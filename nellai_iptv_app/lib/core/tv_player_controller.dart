import 'package:flutter/foundation.dart';
import 'package:media_kit/media_kit.dart';
import 'package:media_kit_video/media_kit_video.dart';

class TVPlayerController {
  late final Player player;
  late final VideoController videoController;
  
  TVPlayerController() {
    player = Player();
    _configureForTV();
    videoController = VideoController(player);
  }

  void _configureForTV() {
    if (kIsWeb) return;

    try {
      final dynamic p = player;
      
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
      
      debugPrint("✅ TVPlayerController: Optimized for TV (150MB Buffer, Performance Mode)");
    } catch (e) {
      debugPrint("❌ TVPlayerController Error: $e");
    }
  }

  Future<void> load(String url) async {
    await player.open(Media(url), play: true);
  }

  void stop() {
    player.stop();
  }

  void setVolume(double volume) {
    player.setVolume(volume);
  }

  void dispose() {
    player.dispose();
  }
}
