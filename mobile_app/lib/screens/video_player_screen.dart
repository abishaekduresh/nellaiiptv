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
import '../widgets/gesture_overlay.dart';
import 'package:simple_pip_mode/simple_pip.dart'; // Correct import
import '../services/toast_service.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import '../services/audio_manager.dart';
import 'dart:async';


class VideoPlayerScreen extends StatefulWidget {
  const VideoPlayerScreen({super.key});

  @override
  State<VideoPlayerScreen> createState() => _VideoPlayerScreenState();
}

class _VideoPlayerScreenState extends State<VideoPlayerScreen> with WidgetsBindingObserver {
  final ApiService _api = ApiService();
  
  // Official Video Player Controller
  VideoPlayerController? _videoPlayerController;
  
  // PiP Controller
  late SimplePip _simplePip;

  bool _isLoading = true;
  bool _hasError = false;
  String _errorMessage = '';
  String? _appLogoUrl;
  Channel? _channel;
  
  // UI State
  bool _showControls = false;
  Timer? _hideTimer;
  bool _isPipMode = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this); // Detect Background/Foreground
    _enterLandscape();
    WakelockPlus.enable();
    
    // Initialize PiP
    _simplePip = SimplePip(
      onPipEntered: () {
        if (mounted) setState(() { _isPipMode = true; });
      },
      onPipExited: () {
        if (mounted) {
           setState(() { _isPipMode = false; });
           // Re-force landscape when exiting PiP
           _enterLandscape();
        }
      },
    );

    _fetchAppLogo();
    _fetchChannel();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (_videoPlayerController == null) return;
    
    if (state == AppLifecycleState.paused || state == AppLifecycleState.inactive) {
      // Prevent pausing if we are effectively in PiP mode (or entering it)
      if (!_isPipMode) {
         _videoPlayerController!.pause();
         // Restore System Volume when backgrounded (unless entering PiP)
         AudioManager().restoreOriginalVolume();
      }
    } else if (state == AppLifecycleState.resumed) {
      _videoPlayerController!.play();
      // Re-apply Session Volume when foregrounded
      AudioManager().reapplyAppVolume();
    }
  }

  void _toggleControls() {
    setState(() {
      _showControls = !_showControls;
    });
    if (_showControls) _startHideTimer();
    else _hideTimer?.cancel();
  }

  void _startHideTimer() {
    _hideTimer?.cancel();
    _hideTimer = Timer(const Duration(seconds: 4), () {
      if (mounted && _showControls) {
        setState(() { _showControls = false; });
      }
    });
  }

  Future<double> _toggleMute() async {
      if (_videoPlayerController == null) return 0;
      double current = _videoPlayerController!.value.volume;
      double newVol = (current > 0) ? 0.0 : 1.0;
      await _videoPlayerController!.setVolume(newVol);
      return newVol;
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

  DateTime? _lastBufferTime;
  int _bufferCount = 0;

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
        
        // Smart Buffering Monitor
        final now = DateTime.now();
        if (_lastBufferTime != null && now.difference(_lastBufferTime!) < const Duration(seconds: 30)) {
           _bufferCount++;
        } else {
           _bufferCount = 1; // Reset window
        }
        _lastBufferTime = now;

        if (_bufferCount >= 3) {
           ToastService().show("Unstable Network: Buffering...", type: ToastType.warning);
           _bufferCount = 0; // Reset after warning
        }
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
    // Restore System Volume on Exit
    AudioManager().restoreOriginalVolume();
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
          // 1. Gesture Layer (Wraps Video) - Background
          GestureOverlay(
            onTap: _toggleControls,
            onToggleMute: _toggleMute,
            child: Container(
              color: Colors.black, // Ensure black background
              child: (_videoPlayerController != null && _videoPlayerController!.value.isInitialized)
                ? SizedBox.expand(
                    child: FittedBox(
                      fit: BoxFit.fill,
                      child: SizedBox(
                        width: _videoPlayerController!.value.size.width,
                        height: _videoPlayerController!.value.size.height,
                        child: VideoPlayer(_videoPlayerController!),
                      ),
                    ),
                  )
                : const SizedBox.shrink(),
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

          // 5. Watermark Layer (Hide in PiP)
          if (!_hasError && _appLogoUrl != null && !_isPipMode)
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

            // 6. Viewer Count (Top Left)
            if (!kIsWeb && _channel?.viewersCountFormatted != null && !_isPipMode)
              Positioned(
                top: 25, // Align with buttons top margin (20) + some padding if needed
                left: 20,
                child: SafeArea( // Ensure it respects notch
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.5),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.remove_red_eye_outlined, color: Colors.white70, size: 16),
                        const SizedBox(width: 5),
                        Text(
                          _channel!.viewersCountFormatted!,
                          style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

            // 7. Cast & PiP Buttons (Top Right)
            if (!kIsWeb && _videoPlayerController != null && _videoPlayerController!.value.isInitialized && !_isPipMode)
              Positioned(
                top: 20,
                right: 20,
                child: AnimatedOpacity(
                  opacity: _showControls ? 1.0 : 0.0,
                  duration: const Duration(milliseconds: 300),
                  child: IgnorePointer(
                    ignoring: !_showControls,
                    child: Row(
                      children: [
                        // Cast Button
                        IconButton(
                          icon: const Icon(Icons.cast, color: Colors.white, size: 28),
                          onPressed: () async {
                            _startHideTimer(); // Reset timer
                            final connectivityResult = await Connectivity().checkConnectivity();
                            if (connectivityResult.contains(ConnectivityResult.wifi)) {
                               ToastService().show("Searching for Cast devices...", type: ToastType.info);
                            } else {
                               ToastService().show("Connect to WiFi to Cast", type: ToastType.warning);
                            }
                          },
                        ),
                        const SizedBox(width: 8),
                        // PiP Button
                        IconButton(
                          icon: const Icon(Icons.picture_in_picture_alt, color: Colors.white, size: 28),
                          onPressed: () async {
                            _startHideTimer(); // Reset timer
                            try {
                               final isPipAvailable = await SimplePip.isPipAvailable;
                               if (isPipAvailable) {
                                 // Optimistically set mode to prevent auto-pause race condition
                                 setState(() { _isPipMode = true; });
                                 await _simplePip.enterPipMode(aspectRatio: (16, 9));
                               } else {
                                 ToastService().show("PiP not supported on this device", type: ToastType.warning);
                               }
                            } catch (e) {
                               // Revert state if failed
                               setState(() { _isPipMode = false; });
                               ToastService().show("PiP Failed: $e", type: ToastType.error);
                            }
                          },
                        ),
                      ],
                    ),
                  ),
                ),
              ),

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
        title: Text(
          "Exit ${dotenv.env['APP_NAME'] ?? "App"}?", 
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
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
