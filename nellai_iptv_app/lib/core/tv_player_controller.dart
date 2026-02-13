import 'package:flutter/foundation.dart';
import 'package:media_kit/media_kit.dart';
import 'package:media_kit_video/media_kit_video.dart';
import 'device_utils.dart';

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
      
      final bool isHighPerf = DeviceUtils.isHighPerformance;
      debugPrint("⚙️ TVPlayerController: Configuring for ${isHighPerf ? 'High' : 'Low'} Performance Device");

      if (isHighPerf) {
        // --- HIGH SPEC CONFIGURATION (>2GB RAM) ---
        // 1. Buffer Management (Max Quality)
        p.setProperty('demuxer-max-bytes', '${100 * 1024 * 1024}'); // 100MB Buffer
        p.setProperty('demuxer-readahead-secs', '60');
        
        // 2. Hardware Acceleration & Performance
        p.setProperty('hwdec', 'auto'); 
        p.setProperty('hwdec-codecs', 'all'); 
        p.setProperty('video-sync', 'audio');
        p.setProperty('vd-lavc-fast', '1'); // Enable fast decoding
        p.setProperty('audio-pitch-correction', 'yes');

        // 3. Network & IPTV Optimization
        p.setProperty('demuxer-lavf-o', 'reconnect_at_eof=1,reconnect_streamed=1,reconnect_delay_max=5');
        p.setProperty('network-timeout', '30');
        p.setProperty('cache-pause', 'no'); // Don't pause on low cache for live streams
        p.setProperty('probesize', '65536'); // Smaller probe size for faster start
        p.setProperty('analyzeduration', '1000000'); // 1 second
        
        // 4. Quality
        p.setProperty('hls-bitrate', 'max');
      
      } else {
        // --- LOW SPEC CONFIGURATION (<=2GB RAM) ---
        // 1. Buffer Management (Conservative)
        p.setProperty('demuxer-max-bytes', '${16 * 1024 * 1024}'); // 16MB Buffer to save RAM
        p.setProperty('demuxer-readahead-secs', '15');
        
        // 2. Hardware Acceleration & CPU Saving
        p.setProperty('hwdec', 'auto'); 
        p.setProperty('hwdec-codecs', 'all'); 
        p.setProperty('video-sync', 'audio');
        p.setProperty('framedrop', 'vo'); // Allow frame drops to keep audio sync
        p.setProperty('vd-lavc-fast', '1'); // Enable fast decoding
        p.setProperty('vd-lavc-skiploopfilter', 'all'); // Skip loop filter to save CPU
        p.setProperty('vd-lavc-skipidct', 'all'); // Skip IDCT for performance

        // 3. Rendering Efficiency (Fastest Scaling)
        p.setProperty('scale', 'bilinear'); 
        p.setProperty('dscale', 'bilinear'); 
        p.setProperty('cscale', 'bilinear');

        // 4. Network & IPTV Optimization
        p.setProperty('demuxer-lavf-o', 'reconnect_at_eof=1,reconnect_streamed=1,reconnect_delay_max=5');
        p.setProperty('network-timeout', '20'); 
        p.setProperty('probesize', '32768'); // Even smaller probe for low-end
        p.setProperty('analyzeduration', '500000'); // 0.5 seconds
        
        // 5. Quality (Auto bitrate to prevent choking)
        p.setProperty('hls-bitrate', 'auto'); 
      }
      
      debugPrint("✅ TVPlayerController: Optimizations Applied.");
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
