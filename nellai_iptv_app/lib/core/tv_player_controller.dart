import 'package:flutter/foundation.dart';
import 'package:media_kit/media_kit.dart';
import 'package:media_kit_video/media_kit_video.dart';
import 'device_utils.dart';

/// TVPlayerController wraps MediaKit's Player + VideoController for IPTV playback.
///
/// Platform strategy:
///   - Android TV  : 64 MB demuxer cache, default ABR (WiFi distance-safe)
///   - Mobile       : 32 MB demuxer cache, default ABR (cellular-safe)
///   - Both          : API-gated hwdec (auto / mediacodec-copy / software)
class TVPlayerController {
  Player? _player;
  VideoController? _videoController;

  // Track all live instances so forceStopAll() can silence every player at once.
  static final List<TVPlayerController> _activeControllers = [];

  TVPlayerController() {
    _activeControllers.add(this);
    _createPlayer();
  }

  // ── Getters ────────────────────────────────────────────────────────────────

  Player? get player => _player;
  VideoController? get videoController => _videoController;

  // ── Internal setup ─────────────────────────────────────────────────────────

  void _createPlayer() {
    // Buffer size scaled for FHD/HD IPTV bitrates:
    //   TV    : 96 MB — covers ~50 s of 15 Mbps FHD on Android TV WiFi
    //   Mobile: 64 MB — covers ~30 s of 15 Mbps FHD on LTE/5G
    final int bufferBytes = DeviceUtils.isTV
        ? 96 * 1024 * 1024 // 96 MB — Android TV
        : 64 * 1024 * 1024; // 64 MB — Mobile

    _player = Player(
      configuration: PlayerConfiguration(
        // Demuxer read-ahead cache — directly controls buffering stability.
        bufferSize: bufferBytes,
        // Suppress verbose MPV logs; only surface warnings/errors.
        logLevel: MPVLogLevel.warn,
        // Keep title for system media session notifications.
        title: 'Nellai IPTV',
      ),
    );

    // VideoController: enable platform hardware acceleration (MediaCodec / VideoToolbox).
    _videoController = VideoController(
      _player!,
      configuration: const VideoControllerConfiguration(
        enableHardwareAcceleration: true,
      ),
    );
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /// Opens [url] and begins playback.
  Future<void> load(String url) async {
    if (_player == null) _createPlayer();

    debugPrint('⚙️ TVPlayerController: Loading MediaKit → $url');

    // Apply quality settings BEFORE open() so that hwdec is in effect for
    // the very first decoded frame, and hls-bitrate influences the initial
    // HLS variant selection (quality tier chosen at first playlist fetch).
    if (!kIsWeb) {
      await _applyPlaybackQualitySettings();
    }

    await _player!.open(Media(url), play: true);
    await _player!.setVolume(100.0);
    await _player!.setPlaylistMode(PlaylistMode.none);

    debugPrint('✅ TVPlayerController: Stream opened');
  }

  /// Sets MPV properties that improve HLS quality and decoding behaviour.
  ///
  /// Rules:
  ///  • NEVER set `vo`, `scale`, `cscale` here — media_kit owns the Android
  ///    SurfaceTexture; touching VO before the Video widget's surface is
  ///    attached causes a native WinID assertion crash in android_common.c.
  ///  • Each property is set in its own try-catch so a single unsupported
  ///    option on an older device cannot abort the entire configuration.
  ///  • hwdec strategy is gated on Android API level:
  ///      API < 23  → skip hwdec (unreliable MediaCodec on Android 4/5)
  ///      API 23-25 → mediacodec-copy (safe copy-back path, works on Android 6/7)
  ///      API 26+   → auto (full zero-copy MediaCodec, reliable on Android 8+)
  Future<void> _applyPlaybackQualitySettings() async {
    final native = _player!.platform as dynamic;
    final int sdk = DeviceUtils.androidSdkInt;

    // ── Hardware decoding ──────────────────────────────────────────────────
    // Gated on Android API level — older MediaCodec implementations have
    // zero-copy bugs that cause crashes or artefacts on some devices.
    if (sdk >= 26) {
      // Android 8+ (Oreo): zero-copy MediaCodec — best performance & quality.
      await _trySetProperty(native, 'hwdec', 'auto');
    } else if (sdk >= 23) {
      // Android 6-7: copy-back path — safe on old Mali/Adreno drivers.
      await _trySetProperty(native, 'hwdec', 'mediacodec-copy');
    }
    // API < 23: leave hwdec unset (software decode). Extremely rare.

    // ── HLS variant / bitrate selection ───────────────────────────────────
    // Leave unset on ALL devices — MPV's default ABR algorithm starts at a
    // lower rendition and scales up once it confirms the connection can
    // sustain it. Forcing 'max' on WiFi TVs (often at distance from router)
    // causes the same stalls and failed starts seen on cellular mobile.

    // ── Aspect ratio ──────────────────────────────────────────────────────
    // Strip the codec's stored aspect ratio so the Flutter Video widget's
    // BoxFit.fill is the sole authority on how the frame fills the screen.
    // Without this, SD streams (4:3 DAR) leave pillarbox bars even when
    // fit: BoxFit.fill is set, because MPV pre-scales the frame before
    // handing it to the Flutter compositor.
    await _trySetProperty(native, 'video-aspect-override', '-1');

    // ── Cache / buffer depth ───────────────────────────────────────────────
    // Deeper cache for HD/FHD stability — a single FHD HLS segment can be
    // 5–10 s; 3 s was too shallow and caused constant fallback on HD streams.
    final String cacheSecs = DeviceUtils.isTV ? '15' : '10';
    await _trySetProperty(native, 'cache-secs', cacheSecs);

    // Skip the initial fill-wait so the first frame renders immediately;
    // mid-stream rebuffering (cache-pause default=yes) still protects HD.
    await _trySetProperty(native, 'cache-pause-initial', 'no');

    // INTENTIONALLY NOT setting cache-pause=no — restoring MPV default (yes).
    // With cache-pause=no, HD buffer underruns kept playing with no data,
    // looked like a stall to the timer, and triggered unnecessary fallback.
    // Default behaviour: player pauses + shows spinner, then resumes cleanly.

    // Allow demuxer to read far enough ahead for large HD/FHD segments.
    final String readahead = DeviceUtils.isTV ? '15' : '10';
    await _trySetProperty(native, 'demuxer-readahead-secs', readahead);

    // ── Network stability (Indian mobile networks) ─────────────────────────
    // Mobile timeout doubled (60 s) — cellular streams can be slow to start.
    final String networkTimeout = DeviceUtils.isTV ? '30' : '60';
    await _trySetProperty(native, 'network-timeout', networkTimeout);

    debugPrint('✅ TVPlayerController: MPV stream properties applied'
        ' [TV=${DeviceUtils.isTV}, SDK=$sdk]');
  }

  /// Sets a single MPV property and awaits the result.
  /// Swallows errors so one unsupported option on an older device cannot
  /// prevent the remaining properties from being applied.
  Future<void> _trySetProperty(dynamic native, String key, String value) async {
    try {
      await (native.setProperty(key, value) as Future<void>);
    } catch (e) {
      debugPrint('⚠️ TVPlayerController: setProperty($key=$value) failed: $e');
    }
  }

  Future<void> stop() async {
    try {
      await _player?.stop();
    } catch (_) {}
  }

  Future<void> pause() async {
    try {
      await _player?.pause();
    } catch (_) {}
  }

  Future<void> play() async {
    try {
      await _player?.play();
    } catch (_) {}
  }

  /// [volume] is 0–100 (matching the rest of the app's convention).
  void setVolume(double volume) {
    _player?.setVolume(volume.clamp(0.0, 100.0));
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  /// Forces every active TVPlayerController instance to stop and dispose.
  /// Called before navigating away from the player screen.
  static Future<void> forceStopAll() async {
    debugPrint('🛑 TVPlayerController: Silencing '
        '${_activeControllers.length} active player(s)...');
    final snapshot = List<TVPlayerController>.from(_activeControllers);
    _activeControllers.clear();
    for (final c in snapshot) {
      await c.dispose();
    }
    debugPrint('✅ TVPlayerController: All players disposed.');
  }

  Future<void> dispose() async {
    _activeControllers.remove(this);
    try {
      debugPrint('🛑 TVPlayerController: Disposing MediaKit player...');
      await _player?.stop();
      await _player?.dispose();
      _player = null;
      _videoController = null;
      debugPrint('✅ TVPlayerController: Player disposed.');
    } catch (e) {
      debugPrint('❌ TVPlayerController: Dispose error: $e');
    }
  }
}
