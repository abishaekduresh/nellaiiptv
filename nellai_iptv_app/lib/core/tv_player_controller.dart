import 'package:flutter/foundation.dart';
import 'package:media_kit/media_kit.dart';
import 'package:media_kit_video/media_kit_video.dart';
import 'device_utils.dart';

/// TVPlayerController wraps MediaKit's Player + VideoController for IPTV playback.
///
/// Platform strategy:
///   - Android TV  : 64 MB demuxer cache, lock to highest available HLS bitrate
///   - Mobile       : 32 MB demuxer cache, start high then allow intelligent ABR
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
    // Buffer size: larger on TV for uninterrupted 1080p/4K IPTV streams.
    final int bufferBytes = DeviceUtils.isTV
        ? 64 * 1024 * 1024 // 64 MB — Android TV
        : 32 * 1024 * 1024; // 32 MB — Mobile

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
    // Use 'max' on ALL devices so MPV always picks the highest quality
    // rendition from the HLS manifest. This must be set BEFORE open() so
    // the initial playlist request selects the best variant immediately.
    // The ABR algorithm still adjusts down if bandwidth genuinely cannot
    // sustain the chosen bitrate.
    await _trySetProperty(native, 'hls-bitrate', 'max');

    // ── Cache / buffer depth ───────────────────────────────────────────────
    // Mobile gets a deeper buffer (40 s) to absorb cellular jitter.
    final String cacheSecs = DeviceUtils.isTV ? '30' : '40';
    await _trySetProperty(native, 'cache-secs', cacheSecs);

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
