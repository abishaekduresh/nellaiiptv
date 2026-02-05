import 'package:flutter/foundation.dart';
import 'package:media_kit/media_kit.dart';
import 'package:media_kit_video/media_kit_video.dart';

class TVPlayerController {
  late final Player player;
  late final VideoController videoController;
  
  // Static tracking of all active instances
  static final List<TVPlayerController> _activeControllers = [];

  TVPlayerController() {
    _activeControllers.add(this);
    player = Player();
    _configureForTV();
    videoController = VideoController(player);
  }

  /// Forces all active players to stop and dispose.
  /// Useful for logout or critical navigation events.
  static Future<void> forceStopAll() async {
    debugPrint("🛑 TVPlayerController: Force stopping ${_activeControllers.length} active players...");
    
    // 1. Immediate Silence (Synchronous)
    for (var controller in _activeControllers) {
      try {
        controller.player.setVolume(0); // Mute immediately
        controller.player.pause();      // Pause immediately
        // Force load empty playlist to kill stream buffer
        controller.player.open(Playlist([]), play: false);
      } catch (e) {
        debugPrint("⚠️ TVPlayerController: Error muting player: $e");
      }
    }

    // 2. Async Dispose
    final List<Future> futures = [];
    final List<TVPlayerController> activeList = List.from(_activeControllers);
    _activeControllers.clear(); // Clear immediately to prevent double-access

    for (var controller in activeList) {
       futures.add(controller.dispose()); 
    }
    
    await Future.wait(futures);
    debugPrint("✅ TVPlayerController: All active players silenced and disposed.");
  }

  void _configureForTV() {
    if (kIsWeb) return;

    try {
      final dynamic p = player;
      
      /* 
      // Optimization properties temporarily disabled due to compatibility issues
      // 1. Buffer Management (Boosted for TV)
      p.setProperty('demuxer-max-bytes', '${150 * 1024 * 1024}'); // 150MB Pre-buffer
      p.setProperty('demuxer-readahead-secs', '120');  // 2 Minutes ahead
      p.setProperty('stream-buffer-size', '${2 * 1024 * 1024}');  // 2MB Stream Buffer
      
      // 2. Hardware Acceleration
      p.setProperty('hwdec', 'auto'); 
      p.setProperty('hwdec-codecs', 'all'); 
      
      // 3. HLS Optimization (Quality Priority)
      p.setProperty('hls-bitrate', 'max'); // Always prefer highest quality
      p.setProperty('cache', 'yes');
      p.setProperty('cache-secs', '300'); // 5 Minutes Cache
      p.setProperty('cache-pause-initial', 'yes'); 
      p.setProperty('cache-pause-wait', '2'); // Low wait for faster start
      
      // 4. Video Quality & Rendering (Performance Mode)
      // Switched to bilinear/fast settings to prevent GPU pixelation/stutter on TV
      p.setProperty('video-sync', 'audio'); 
      p.setProperty('interpolation', 'no'); 
      p.setProperty('deband', 'no'); 
      p.setProperty('scale', 'bilinear'); 
      p.setProperty('dscale', 'bilinear'); 
      p.setProperty('cscale', 'bilinear'); 
      
      // 5. Network & Stability
      p.setProperty('demuxer-lavf-o', 'reconnect_at_eof=1,reconnect_streamed=1,reconnect_delay_max=5');
      p.setProperty('network-timeout', '60'); // 60s Timeout
      p.setProperty('demuxer-max-back-bytes', '${50 * 1024 * 1024}'); // 50MB Back buffer
      
      // 6. Performance
      p.setProperty('vo', 'gpu'); 
      p.setProperty('gpu-context', 'auto');
      */
      debugPrint("✅ TVPlayerController: Optimization skipped for stability check.");
    } catch (e) {
      debugPrint("❌ TVPlayerController Error: $e");
    }
  }

  Future<void> load(String url) async {
    await player.open(Media(url), play: true);
  }

  Future<void> stop() async {
    try {
      player.setVolume(0); // Synchronous
      // Instead of Playlist([]), open a null or empty source if needed, 
      // but stop() + volume 0 should be enough if called correctly.
      await player.stop();
    } catch (_) {}
  }

  void setVolume(double volume) {
    player.setVolume(volume);
  }

  Future<void> dispose() async {
    _activeControllers.remove(this);
    try {
      debugPrint("🛑 TVPlayerController: Disposing player instance...");
      // 1. Mute & Stop
      await player.setVolume(0); 
      await player.stop();
      
      // 2. Dispose Player
      await player.dispose();
      debugPrint("✅ TVPlayerController: Player disposed.");
    } catch (e) {
      debugPrint("❌ TVPlayerController: Error disposing player: $e");
    }
  }
}
