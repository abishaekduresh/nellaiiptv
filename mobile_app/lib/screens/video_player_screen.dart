import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter/foundation.dart'; // for kIsWeb
import 'package:video_player/video_player.dart';
import 'package:dio/dio.dart';
import 'package:wakelock_plus/wakelock_plus.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import '../services/api_service.dart';
import '../models/channel.dart';
import '../widgets/pulse_loader.dart';

class VideoPlayerScreen extends StatefulWidget {
  const VideoPlayerScreen({super.key});

  @override
  State<VideoPlayerScreen> createState() => _VideoPlayerScreenState();
}

class _VideoPlayerScreenState extends State<VideoPlayerScreen> with WidgetsBindingObserver {
  final ApiService _api = ApiService();
  
  // Official Video Player Controller
  VideoPlayerController? _videoPlayerController;

  bool _isLoading = true;
  bool _hasError = false;
  String _errorMessage = '';
  String? _appLogoUrl;
  Channel? _channel;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this); // Detect Background/Foreground
    _enterLandscape();
    WakelockPlus.enable();

    _fetchAppLogo();
    _fetchChannel();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (_videoPlayerController == null) return;
    
    if (state == AppLifecycleState.paused || state == AppLifecycleState.inactive) {
      _videoPlayerController!.pause();
    } else if (state == AppLifecycleState.resumed) {
      _videoPlayerController!.play();
    }
  }

  Future<void> _fetchAppLogo() async {
    try {
      final logo = await _api.getAppLogo();
      if (mounted && logo != null) {
        setState(() {
          _appLogoUrl = logo;
        });
      }
    } catch (e) {
      print("Logo Fetch Error: $e");
    }
  }

  void _enterLandscape() {
    if (!kIsWeb) {
      SystemChrome.setPreferredOrientations([
        DeviceOrientation.landscapeLeft,
        DeviceOrientation.landscapeRight,
      ]);
      SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
    }
  }

  Future<void> _fetchChannel() async {
    final uuid = dotenv.env['CHANNEL_UUID'];
    if (uuid == null) {
      _showError("Configuration Error: Missing UUID");
      return;
    }

    try {
      final channel = await _api.getChannelDetails(uuid);
      if (mounted) {
        if (channel.hlsUrl != null) {
           setState(() {
            _channel = channel;
          });
          _initVideoPlayer(channel.hlsUrl!);
        } else {
          _showError("Channel has no stream URL");
        }
      }
    } catch (e) {
      String msg = "Failed to load channel";
      if (e is DioException) {
         if (e.response != null) {
           msg = "API Error: ${e.response?.data['message'] ?? e.response?.statusMessage}";
         } else {
           msg = "Connection Failed. Check URL or Network.";
         }
      } else {
         msg = e.toString();
      }
      if (mounted) _showError(msg);
    }
  }

  Future<void> _initVideoPlayer(String url) async {
    try {
      // Dispose previous if any
      _disposeControllers();

      _videoPlayerController = VideoPlayerController.networkUrl(
        Uri.parse(url),
        videoPlayerOptions: VideoPlayerOptions(mixWithOthers: true),
      );
      
      await _videoPlayerController!.initialize();
      await _videoPlayerController!.setLooping(false);
      await _videoPlayerController!.setVolume(1.0); // Ensure Audio is ON
      await _videoPlayerController!.play(); // Auto Play

      // Listen for buffering/errors
      _videoPlayerController!.addListener(_videoListener);

      setState(() {
        _isLoading = false;
      });
      
    } catch (e) {
      print("Video Init Error: $e");
      _showError("Playback Failed");
    }
  }

  void _videoListener() {
    if (!mounted || _videoPlayerController == null) return;

    // Handle Errors
    if (_videoPlayerController!.value.hasError) {
       _showError("Playback Error: ${_videoPlayerController!.value.errorDescription}");
       return;
    }

    // Handle Buffering
    if (_videoPlayerController!.value.isBuffering) {
      if (!_isLoading) {
        setState(() {
          _isLoading = true;
        });
      }
    } else {
      if (_isLoading) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  void _showError(String msg) {
    setState(() {
      _isLoading = false;
      _hasError = true;
      _errorMessage = msg;
    });
  }

  void _disposeControllers() {
    if (_videoPlayerController != null) {
       _videoPlayerController!.removeListener(_videoListener);
       _videoPlayerController!.dispose();
       _videoPlayerController = null;
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _disposeControllers();
    WakelockPlus.disable();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false, // Prevent default pop
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) return;
        final bool shouldExit = await _showExitConfirmation();
        if (shouldExit) {
          if (context.mounted) {
             SystemNavigator.pop();
          }
        }
      },
      child: Scaffold(
        backgroundColor: const Color(0xFF0F172A),
      body: Stack(
        fit: StackFit.expand,
        children: [
          // 1. Video Layer (Native VideoPlayer)
          if (_videoPlayerController != null && _videoPlayerController!.value.isInitialized)
            SizedBox.expand(
              child: FittedBox(
                fit: BoxFit.fill,
                child: SizedBox(
                  width: _videoPlayerController!.value.size.width,
                  height: _videoPlayerController!.value.size.height,
                  child: VideoPlayer(_videoPlayerController!),
                ),
              ),
            ),

          // 2. Web Warning (Bottom)
          if (kIsWeb)
            Positioned(
              bottom: 20,
              left: 20,
              right: 20,
              child: Container(
                padding: const EdgeInsets.all(8),
                color: Colors.black54,
                child: const Text( 
                  "NOTE: Desktop Chrome cannot play HLS (.m3u8) natively.\nPlease test on Android Emulator or Safari.",
                  style: TextStyle(color: Colors.yellow, fontSize: 12),
                  textAlign: TextAlign.center,
                ),
              ),
            ),

          // 3. Loading Layer (Overlay)
          if (_isLoading && !_hasError)
            const Center(child: PulseLoader(color: Color(0xFF06B6D4), size: 60)),
          
          // 4. Error Layer
          if (_hasError)
             Center(
               child: Column(
                 mainAxisAlignment: MainAxisAlignment.center,
                 children: [
                   const Icon(Icons.error_outline, color: Color(0xFF06B6D4), size: 50),
                   const SizedBox(height: 10),
                   Text(
                     _errorMessage,
                     style: const TextStyle(color: Colors.white, fontSize: 16),
                     textAlign: TextAlign.center,
                   ),
                   const SizedBox(height: 10),
                   ElevatedButton(
                     onPressed: () {
                       setState(() {
                         _hasError = false;
                         _isLoading = true;
                       });
                       _fetchChannel();
                     }, 
                     child: const Text("Retry"),
                   )
                 ],
               ),
             ),

          // 5. Watermark Layer
          if (!_hasError && _appLogoUrl != null)
            Positioned(
              bottom: 10,
              left: 20,
              child: Opacity(
                opacity: 0.6,
                child: Image.network(
                  _appLogoUrl!,
                  width: 150,
                  errorBuilder: (c,e,s) => const SizedBox(),
                ),
              ),
            ),

            // 6. Mute Toggle Removed

        ],
      ),
      ),
    );
  }

  Future<bool> _showExitConfirmation() async {
    return await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1E293B), // Surface Color
        title: const Text(
          "Exit Royal TV?", 
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        content: const Text(
          "Are you sure you want to exit the app?",
          style: TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text("Cancel", style: TextStyle(color: Color(0xFFFCD34D))), // Secondary
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text("Exit", style: TextStyle(color: Color(0xFF06B6D4), fontWeight: FontWeight.bold)), // Primary
          ),
        ],
      ),
    ) ?? false;
  }
}
