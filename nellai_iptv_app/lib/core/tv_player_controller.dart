import 'package:flutter/foundation.dart';
import 'package:video_player/video_player.dart';
import 'device_utils.dart';

class TVPlayerController {
  VideoPlayerController? _controller;
  
  // Static tracking of all active instances
  static final List<TVPlayerController> _activeControllers = [];

  TVPlayerController() {
    _activeControllers.add(this);
  }

  VideoPlayerController? get controller => _controller;

  /// Forces all active players to stop and dispose.
  static Future<void> forceStopAll() async {
    debugPrint("🛑 TVPlayerController: Force stopping ${_activeControllers.length} active players...");
    
    final List<TVPlayerController> activeList = List.from(_activeControllers);
    _activeControllers.clear(); 

    for (var controller in activeList) {
       await controller.dispose(); 
    }
    debugPrint("✅ TVPlayerController: All active players silenced and disposed.");
  }

  Future<void> load(String url) async {
    // 1. Dispose old controller if exists
    if (_controller != null) {
      await _controller!.pause();
      await _controller!.dispose();
    }

    // 2. Clear buffers and start fresh
    debugPrint("⚙️ TVPlayerController: Loading ExoPlayer for URL: $url");
    
    _controller = VideoPlayerController.networkUrl(
      Uri.parse(url),
      videoPlayerOptions: VideoPlayerOptions(mixWithOthers: false),
    );

    // 3. Initialize
    try {
      await _controller!.initialize();
      await _controller!.setLooping(false);
      await _controller!.play();
      debugPrint("✅ TVPlayerController: Video Initialized");
    } catch (e) {
      debugPrint("❌ TVPlayerController: Initialization Error: $e");
      rethrow;
    }
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
    await _controller?.pause();
  }

  Future<void> play() async {
    await _controller?.play();
  }

  void setVolume(double volume) {
    // video_player uses 0.0 to 1.0, current app uses 0 to 100
    _controller?.setVolume(volume / 100.0);
  }

  Future<void> dispose() async {
    _activeControllers.remove(this);
    try {
      if (_controller != null) {
        debugPrint("🛑 TVPlayerController: Disposing ExoPlayer instance...");
        await _controller!.pause();
        await _controller!.dispose();
        _controller = null;
        debugPrint("✅ TVPlayerController: Player disposed.");
      }
    } catch (e) {
      debugPrint("❌ TVPlayerController: Error disposing player: $e");
    }
  }

  // Compatibility getters for EmbeddedPlayer
  // Since we merged Player and VideoController, we'll return the same object
  VideoPlayerController? get player => _controller;
  VideoPlayerController? get videoController => _controller;
}
