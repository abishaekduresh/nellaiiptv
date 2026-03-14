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
    videoController = VideoController(
      player,
      configuration: const VideoControllerConfiguration(
        // Fixes black screen rendering issues on some Android TV boxes
        androidAttachSurfaceAfterVideoParameters: false,
      ),
    );
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

      // Global optimizations for TV Processors (Often weak arm chips)
      
      // 1. Hardware Acceleration
      // 'auto-safe' fails on many low-end Android TVs yielding audio-only.
      // Using 'auto' is the safest fallback. 'mediacodec,auto' can cause black screen/audio-only on Amlogic/Mediatek TVs (e.g. Zebronics).
      p.setProperty('hwdec', 'auto'); 
      
      // GLFinish ensures proper rendering sync on Android 
      p.setProperty('opengl-glfinish', 'yes');
      // Set Video Output to gpu which is recommended for Android TV black screen issues
      p.setProperty('vo', 'gpu');
      
      // 2. Sync and Dropping (Prioritize audio, drop frames if needed)
      p.setProperty('video-sync', 'audio');
      p.setProperty('framedrop', 'vo'); // Allow dropping frames to keep sync
      
      // 3. Decoder Optimizations
      p.setProperty('vd-lavc-fast', 'yes'); // Enable fast decoding
      // REMOVED: vd-lavc-skipidct and vd-lavc-skipframe. Aggressive skipping destroys reference
      // frames on Amlogic/Mediatek HW decoders causing a permanent black screen.

      // 4. Rendering Efficiency (Fastest Scaling)
      p.setProperty('scale', 'fast_bilinear'); 
      p.setProperty('dscale', 'fast_bilinear'); 
      p.setProperty('cscale', 'fast_bilinear');

      if (isHighPerf) {
        // --- HIGH SPEC CONFIGURATION (>2GB RAM) ---
        // 1. Buffer Management (Max Quality, Full HD support)
        p.setProperty('demuxer-max-bytes', '${150 * 1024 * 1024}'); // 150MB Buffer
        p.setProperty('demuxer-max-back-bytes', '${50 * 1024 * 1024}');
        p.setProperty('cache', 'yes');
        
        // 2. Network & IPTV Optimization
        p.setProperty('demuxer-lavf-o', 'reconnect=1,reconnect_at_eof=1,reconnect_streamed=1,reconnect_delay_max=2');
        p.setProperty('network-timeout', '10');
        
        // 3. Quality
        p.setProperty('hls-bitrate', 'max'); // Force highest quality for high end TVs
      
      } else {
        // --- LOW SPEC CONFIGURATION (<=2GB RAM) ---
        // 1. Buffer Management (Conservative)
        p.setProperty('demuxer-max-bytes', '${32 * 1024 * 1024}'); // 32MiB to prevent OutOfMemory crashes
        p.setProperty('demuxer-max-back-bytes', '${8 * 1024 * 1024}'); // Shrink back buffer aggressively
        p.setProperty('cache', 'yes');
        p.setProperty('cache-pause', 'no'); // Do not pause stream to build cache
        
        // 2. Network & IPTV Optimization
        // Aggressive reconnect flags
        p.setProperty('demuxer-lavf-o', 'reconnect=1,reconnect_at_eof=1,reconnect_streamed=1,reconnect_delay_max=2');
        p.setProperty('network-timeout', '10'); 
        
        // 3. Quality (Auto bitrate to prevent choking)
        p.setProperty('hls-bitrate', 'auto'); 
      }
      
      debugPrint("✅ TVPlayerController: Optimizations Applied.");
    } catch (e) {
      debugPrint("❌ TVPlayerController Error: $e");
    }
  }

  Future<void> load(String url) async {
    // 1. Synchronously mute to prevent audio overlap
    player.setVolume(0);
    
    // 2. Stop player stream completely.
    // Extremely important for low-spec Android TVs to avoid crashing the demuxer when switching.
    await player.stop();
    
    // 3. Small arbitrary delay to let native resources flush. 
    await Future.delayed(const Duration(milliseconds: 50));
    
    // 4. Open new stream safely
    await player.open(Media(url), play: true);
    
    // 5. Restore volume after stream is attempting to open
    player.setVolume(100.0);
  }

  Future<void> stop() async {
    try {
      player.setVolume(0); // Synchronous
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
