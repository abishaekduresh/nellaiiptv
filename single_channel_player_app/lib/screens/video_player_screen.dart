import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter/foundation.dart'; // for kIsWeb
import 'package:media_kit/media_kit.dart';
import 'package:media_kit_video/media_kit_video.dart';
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
import 'dart:io';


class VideoPlayerScreen extends StatefulWidget {
  const VideoPlayerScreen({super.key});

  @override
  State<VideoPlayerScreen> createState() => _VideoPlayerScreenState();
}

class _VideoPlayerScreenState extends State<VideoPlayerScreen> with WidgetsBindingObserver {
  final ApiService _api = ApiService();
  
  late final Player _player;
  late final VideoController _videoController;
  
  // Player Subscriptions
  StreamSubscription<bool>? _bufferingSubscription;
  // Player Subscriptions

  StreamSubscription<String?>? _errorSubscription;
  StreamSubscription<int?>? _widthSubscription; // Listen for video dimensions
  StreamSubscription<double>? _volumeSubscription; // Listen for System Volume changes
  
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

  // View Count Logic
  Timer? _viewCountTimer;
  bool _hasIncrementedView = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this); // Detect Background/Foreground
    _enterLandscape();
    WakelockPlus.enable();
    
    // Initialize MediaKit Player
    _player = Player();
    _videoController = VideoController(_player);

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

    // Initialize Audio Manager
    AudioManager().init();
    
    // Listen to System Volume Changes (e.g. Hardware Buttons or Gestures)
    // If user increases volume, ensure Player is unmuted
    _volumeSubscription = AudioManager().volumeStream.listen((volume) {
       if (volume > 0 && _player.state.volume == 0) {
          _player.setVolume(100.0); // Unmute Player
       }
    });

    _fetchAppLogo();
    _fetchChannel();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused || state == AppLifecycleState.inactive) {
      // Prevent pausing if we are effectively in PiP mode (or entering it)
      if (!_isPipMode) {
         _player.pause();
         // Restore System Volume when backgrounded (unless entering PiP)
         AudioManager().restoreOriginalVolume();
      }
    } else if (state == AppLifecycleState.resumed) {
      _player.play();
      // Re-apply Session Volume when foregrounded
      AudioManager().reapplyAppVolume();
      
      // Safety: Ensure we exit PiP state and re-force landscape when returning to foreground
      if (mounted) {
        setState(() {
          _isPipMode = false;
        });
        _enterLandscape();
      }
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
      double current = _player.state.volume;
      double newVol = (current > 0) ? 0.0 : 100.0;
      await _player.setVolume(newVol);
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
            // Reset view increment state for new channel
            _hasIncrementedView = false;
            _viewCountTimer?.cancel();
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
      // Dispose previous activity
      _disposeControllers(); // Stops player and cancels subs

      await _player.open(Media(url), play: true);
      await _player.setVolume(100.0); // Ensure Audio is ON
      await _player.setPlaylistMode(PlaylistMode.none);

      // Listen for buffering
      _bufferingSubscription = _player.stream.buffering.listen((isBuffering) {
          if (!mounted) return;
          if (isBuffering) {
            if (!_isLoading) {
              setState(() { _isLoading = true; });
              _checkBufferingHealth();
            }
          } else {
             if (_isLoading) {
               setState(() { _isLoading = false; });
             }
          }
      });

      // Listen for Errors
      _errorSubscription = _player.stream.error.listen((error) {
         if (!mounted) return;
         _showError("Playback Error: $error");
      });

      // Listen for Video Dimensions (Seamless Transition)
      _widthSubscription = _player.stream.width.listen((width) {
        if (mounted && width != null && width > 0) {
           // Video has dimensions, trigger rebuild to hide logo overlay
           setState(() {});
        }
      });
      
      // Wait a bit for initialization or just assume valid if no error
      setState(() {
        _isLoading = false;
      });

      // Start 10s timer for view increment (Same as Frontend)
      _startViewCountTimer();
      
    } catch (e) {
      print("Video Init Error: $e");
      _showError("Playback Failed");
    }
  }

  DateTime? _lastBufferTime;
  int _bufferCount = 0;

  void _checkBufferingHealth() {
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

  void _showError(String msg) {
    setState(() {
      _isLoading = false;
      _hasError = true;
      _errorMessage = msg;
    });
  }

  void _startViewCountTimer() {
    _viewCountTimer?.cancel();
    _viewCountTimer = Timer(const Duration(seconds: 10), () {
      if (mounted && _channel != null && !_hasIncrementedView) {
        _api.incrementView(_channel!.uuid);
        _hasIncrementedView = true;
      }
    });
  }

  void _disposeControllers() {
    _bufferingSubscription?.cancel();

    _errorSubscription?.cancel();
    _widthSubscription?.cancel();
    _volumeSubscription?.cancel();
    // Do not dispose _player here if you want to reuse it, but typically we do for full reset.
    // However, with single instance, maybe just stop. 
    // But since _initVideoPlayer creates new one? No, I initialized _player in initState (final).
    // So I should just stop it.
    _player.stop();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _disposeControllers();
    _player.dispose(); // Dispose the final player instance
    WakelockPlus.disable();
    // Restore System Volume on Exit
    AudioManager().restoreOriginalVolume();

    // Decrement view if it was incremented (Sync with Frontend)
    if (_hasIncrementedView && _channel != null) {
      _api.decrementView(_channel!.uuid);
    }
    _viewCountTimer?.cancel();

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
             exit(0); // Hard Kill Process
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
              child: Video(
                controller: _videoController,
                fit: BoxFit.fill,
                controls: NoVideoControls,
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
          // Maintain overlay until video has dimensions and is playing (Seamless Transition)
          if ((_isLoading || _player.state.width == null || _player.state.width == 0) && !_hasError)
             Center(
              child: Stack(
                alignment: Alignment.center,
                children: [
                  // Always show loader if in this state
                  const PulseLoader(color: Color(0xFF06B6D4), size: 60),
                ],
              ),
             ),
          
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
                opacity: 0.2,
                child: Image.network(
                  _appLogoUrl!,
                  width: 150,
                  errorBuilder: (c,e,s) => const SizedBox(),
                ),
              ),
            ),

            // 6. Viewer Count & Rating (Top Left)
            if (_channel != null && 
                !_isPipMode && 
                ((_channel!.viewersCountFormatted != null && _channel!.viewersCountFormatted! != "0" && _channel!.viewersCountFormatted!.isNotEmpty) || 
                 (_channel!.averageRating != null && _channel!.averageRating! > 0)))
              Positioned(
                top: 25,
                left: 20,
                child: AnimatedOpacity(
                  opacity: _showControls ? 1.0 : 0.0,
                  duration: const Duration(milliseconds: 300),
                  child: IgnorePointer(
                    ignoring: !_showControls,
                    child: SafeArea(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.5),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            if (_channel!.viewersCountFormatted != null && _channel!.viewersCountFormatted! != "0" && _channel!.viewersCountFormatted!.isNotEmpty) ...[
                              const Icon(Icons.remove_red_eye_outlined, color: Colors.white70, size: 16),
                              const SizedBox(width: 5),
                              Text(
                                _channel!.viewersCountFormatted!,
                                style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                              ),
                            ],
                            if (_channel!.averageRating != null && _channel!.averageRating! > 0) ...[
                              if (_channel!.viewersCountFormatted != null && _channel!.viewersCountFormatted! != "0" && _channel!.viewersCountFormatted!.isNotEmpty)
                                const SizedBox(width: 12),
                              const Icon(Icons.star, color: Color(0xFFFCD34D), size: 16),
                              const SizedBox(width: 4),
                              Text(
                                _channel!.averageRating!.toStringAsFixed(1),
                                style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),

            // 7. Cast & PiP Buttons (Top Right)
            if (!kIsWeb && !_isPipMode)
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
      barrierColor: Colors.black.withOpacity(0.8),
      builder: (context) => Dialog(
        backgroundColor: const Color(0xFF1E293B), // Dark Slate
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Container(
          width: 350, // Reduced Width
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Icon
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.red.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.power_settings_new, color: Colors.red, size: 32),
              ),
              const SizedBox(height: 20),
              
              // Title
              Text(
                "Exit ${dotenv.env['APP_NAME'] ?? "App"}?", 
                style: const TextStyle(
                  color: Colors.white, 
                  fontWeight: FontWeight.bold,
                  fontSize: 20,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 10),
              
              // Message
              const Text(
                "Are you sure you want to close the player?",
                style: TextStyle(color: Colors.white70, fontSize: 16),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 30),
              
              // Buttons
              Row(
                children: [
                  // Cancel Button
                  Expanded(
                    child: TextButton(
                      onPressed: () => Navigator.of(context).pop(false),
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                          side: BorderSide(color: Colors.white.withOpacity(0.1)),
                        ),
                      ),
                      child: const Text(
                        "Cancel", 
                        style: TextStyle(color: Colors.white70, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  
                  // Exit Button
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () => Navigator.of(context).pop(true),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.red, // Prominent color for destructive action
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        "Exit", 
                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    ) ?? false;
  }
}