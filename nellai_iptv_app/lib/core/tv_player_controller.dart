import 'package:flutter/foundation.dart';
import 'package:video_player/video_player.dart';

class TVPlayerController {
  VideoPlayerController? _controller;
  bool _adPlaying = false;

  static final List<TVPlayerController> _activeControllers = [];

  TVPlayerController() {
    _activeControllers.add(this);
  }

  VideoPlayerController? get controller => _controller;

  // Compatibility getters used by EmbeddedPlayer
  VideoPlayerController? get player => _controller;
  VideoPlayerController? get videoController => _controller;

  /// Forces every active instance to stop and dispose — call before navigating away.
  static Future<void> forceStopAll() async {
    debugPrint('🛑 TVPlayerController: Force stopping ${_activeControllers.length} active player(s)...');
    final snapshot = List<TVPlayerController>.from(_activeControllers);
    _activeControllers.clear();
    for (final c in snapshot) {
      await c.dispose();
    }
    debugPrint('✅ TVPlayerController: All players stopped.');
  }

  /// Called by EmbeddedPlayer before/after showing a visual ad.
  /// When true, [load] will initialise but NOT call play(), so the channel
  /// never acquires exclusive audio focus while the ad is running.
  void setAdPlaying(bool value) => _adPlaying = value;

  /// Loads [url], initialises ExoPlayer, and begins playback.
  /// Blocks until the first frame is ready (video_player initialise() contract).
  Future<void> load(String url) async {
    // Dispose previous controller cleanly before creating a new one.
    if (_controller != null) {
      await _controller!.pause();
      await _controller!.dispose();
      _controller = null;
    }

    debugPrint('⚙️ TVPlayerController: Loading ExoPlayer → $url');

    _controller = VideoPlayerController.networkUrl(
      Uri.parse(url),
      videoPlayerOptions: VideoPlayerOptions(mixWithOthers: false),
    );

    await _controller!.initialize();
    await _controller!.setLooping(false);

    // Skip play() while an ad is active — the ad holds audio focus.
    // muteForAd(false) will call play() once the ad ends.
    if (!_adPlaying) {
      await _controller!.play();
    }

    debugPrint('✅ TVPlayerController: Stream ready (adPlaying=$_adPlaying)');
  }

  Future<void> stop() async {
    try {
      if (_controller != null) {
        await _controller!.pause();
        await _controller!.seekTo(Duration.zero);
      }
    } catch (_) {}
  }

  Future<void> pause() async {
    try {
      await _controller?.pause();
    } catch (_) {}
  }

  Future<void> play() async {
    try {
      await _controller?.play();
    } catch (_) {}
  }

  /// [volume] is 0–100 (matching the rest of the app's convention).
  void setVolume(double volume) {
    _controller?.setVolume((volume / 100.0).clamp(0.0, 1.0));
  }

  Future<void> dispose() async {
    _activeControllers.remove(this);
    try {
      if (_controller != null) {
        debugPrint('🛑 TVPlayerController: Disposing ExoPlayer...');
        await _controller!.pause();
        await _controller!.dispose();
        _controller = null;
        debugPrint('✅ TVPlayerController: Disposed.');
      }
    } catch (e) {
      debugPrint('❌ TVPlayerController: Dispose error: $e');
    }
  }
}
