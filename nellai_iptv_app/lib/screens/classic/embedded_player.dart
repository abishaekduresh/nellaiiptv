import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart'; // for kIsWeb
import 'package:media_kit/media_kit.dart'; // MediaKit Core
import 'package:media_kit_video/media_kit_video.dart'; // MediaKit Video Widget
import 'package:dio/dio.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:simple_pip_mode/simple_pip.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:wakelock_plus/wakelock_plus.dart'; // Import WakelockPlus
import 'package:url_launcher/url_launcher.dart'; // Import url_launcher

import '../../core/api_service.dart';
import '../../core/audio_manager.dart';
import '../../core/toast_service.dart';
import '../../models/channel.dart';
import '../../widgets/pulse_loader.dart';
import '../../widgets/gesture_overlay.dart';

class EmbeddedPlayer extends StatefulWidget {
  final String channelUuid;
  final Channel? initialChannel; // Support passing the object for instant load
  final VoidCallback? onDoubleTap;
  final VoidCallback? onTap;
  final bool isFullScreen; 
  final bool hideControls;

  const EmbeddedPlayer({
    super.key, 
    required this.channelUuid,
    this.initialChannel,
    this.onDoubleTap,
    this.onTap,
    required this.isFullScreen,
    this.hideControls = false,
  });

  @override
  State<EmbeddedPlayer> createState() => _EmbeddedPlayerState();
}

class _EmbeddedPlayerState extends State<EmbeddedPlayer> with WidgetsBindingObserver {
  final ApiService _api = ApiService();
  
  // MediaKit Controllers
  late final Player _player;
  late final VideoController _controller;
  
  // PiP Controller
  late SimplePip _simplePip;
  
  bool _isLoading = true;
  bool _hasError = false;
  String _errorMessage = '';
  String? _appLogoUrl;
  Channel? _channel;
  
  // Premium State
  bool _isPremiumContent = false;
  
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
    WidgetsBinding.instance.addObserver(this); 
    
    // Initialize MediaKit Player
    _player = Player();
    _controller = VideoController(_player);

    // Initialize PiP
    _simplePip = SimplePip(
      onPipEntered: () {
        if (mounted) setState(() { _isPipMode = true; });
      },
      onPipExited: () {
        if (mounted) {
           setState(() { _isPipMode = false; });
        }
      },
    );

    // Initialize Audio Manager
    AudioManager().init();

    _fetchAppLogo();
    _loadChannel();
  }

  @override
  void didUpdateWidget(covariant EmbeddedPlayer oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.channelUuid != widget.channelUuid) {
      _loadChannel();
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused || state == AppLifecycleState.inactive) {
      if (!_isPipMode) {
         _player.pause();
         AudioManager().restoreOriginalVolume();
      }
    } else if (state == AppLifecycleState.resumed) {
      if (!_isPremiumContent) {
        _player.play();
      }
      AudioManager().reapplyAppVolume();
      
      if (mounted) {
        setState(() {
          _isPipMode = false;
        });
      }
    }
  }

  void _toggleControls() {
    if (_isPremiumContent || widget.hideControls) return; // No controls for premium or if hidden by parent
    setState(() {
      _showControls = !_showControls;
    });
    if (_showControls) _startHideTimer();
    else _hideTimer?.cancel();
    
    // Call external onTap if provided
    widget.onTap?.call();
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
      double newVol = (current > 0) ? 0.0 : 100.0; // MediaKit uses 0-100
      await _player.setVolume(newVol);
      return newVol;
  }
  
  Future<void> _fetchAppLogo() async {
    try {
      final settings = await _api.getPublicSettings();
      if (mounted && settings != null) {
        setState(() {
          _appLogoUrl = settings.appLogoPngUrl ?? settings.logoUrl;
        });
      }
    } catch (e) {
      debugPrint("Logo Fetch Error: $e");
    }
  }

  Future<void> _loadChannel() async {
    // 1. Reset Error State but keep loading if we don't have initial data
    setState(() { 
      _hasError = false; 
      _errorMessage = ''; 
      if (widget.initialChannel == null) _isLoading = true;
    }); 
    
    // 2. Use initialChannel data for INSTANT start if available
    if (widget.initialChannel != null) {
      debugPrint("Instant Play Triggered for: ${widget.initialChannel!.name}");
      _channel = widget.initialChannel;
      _isPremiumContent = _channel!.isPremium;
      
      if (!_isPremiumContent && _channel!.hlsUrl != null) {
        _initVideoPlayer(_channel!.hlsUrl!);
        // Dismiss internal loader immediately, let MediaKit handle buffering UI
        setState(() => _isLoading = false);
      } else if (_isPremiumContent) {
        setState(() => _isLoading = false);
        WakelockPlus.enable();
      }
    }

    // 3. Parallel Background Update from API (Stats & Data Freshness)
    _api.getChannelDetails(widget.channelUuid).then((channel) {
      if (mounted) {
        bool wasPremium = _isPremiumContent;
        setState(() {
          _channel = channel;
          _isPremiumContent = channel.isPremium;
          // If we had no initial data, or if premium status changed, trigger UI update
          if (widget.initialChannel == null) {
            _isLoading = false;
          }
        });

        if (channel.isPremium) {
           _player.stop(); // Stop if user was watching cached non-premium URL
           _viewCountTimer?.cancel();
           WakelockPlus.enable(); 
        } else if (channel.hlsUrl != null && (widget.initialChannel == null || wasPremium)) {
          // Only init if we haven't already OR if we are switching FROM a premium state
          _initVideoPlayer(channel.hlsUrl!);
        }
      }
    }).catchError((e) {
       if (widget.initialChannel == null) _handleError(e);
       debugPrint("Background Channel Update Error: $e");
    });
  }

  void _handleError(dynamic e) {
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

  Future<void> _initVideoPlayer(String url) async {
    try {
      // Don't await the open entirely to keep the UI thread responsive
      _player.open(Media(url), play: true);
      
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }

      _startViewCountTimer();
      
    } catch (e) {
      debugPrint("Video Init Error: $e");
      if (mounted) _showError("Playback Failed");
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
      if (mounted && _channel != null && !_hasIncrementedView && !_isPremiumContent) {
        _api.incrementView(_channel!.uuid);
        _hasIncrementedView = true;
      }
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _player.dispose(); // Dispose MediaKit Player
    AudioManager().restoreOriginalVolume();

    if (_hasIncrementedView && _channel != null) {
      // _api.decrementView(_channel!.uuid); 
    }
    _viewCountTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.black, // Ensure black background
      child: Stack(
        fit: StackFit.expand,
        children: [
          // 1. Gesture Layer / Video Surface
          GestureOverlay(
            onTap: _toggleControls,
            onToggleMute: widget.onDoubleTap ?? () => _toggleMute(), 
            child: Container(
              color: Colors.black, 
              child: _isPremiumContent 
                ? const SizedBox() 
                : SizedBox.expand(
                    child: Video(
                      controller: _controller,
                      controls: NoVideoControls,
                      fit: BoxFit.fill,
                    ),
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
          StreamBuilder<bool>(
            stream: _player.stream.buffering,
            builder: (context, snapshot) {
              final isBuffering = snapshot.data ?? false;
              
              if ((_isLoading || isBuffering) && !_hasError && !_isPremiumContent) {
                 return Center(
                   child: Container(
                     color: Colors.black, 
                     child: const Center(child: PulseLoader(color: Color(0xFF06B6D4), size: 60)),
                   ),
                 );
              }
              return const SizedBox();
            },
          ),
          
          // 4. Premium Overlay
          if (_isPremiumContent)
             _buildPremiumOverlay(),

          // 5. Error Layer
          if (_hasError && !_isPremiumContent)
             Center(
               child: Column(
                 mainAxisAlignment: MainAxisAlignment.center,
                 children: [
                   const Icon(Icons.error_outline, color: Color(0xFF06B6D4), size: 50),
                   const SizedBox(height: 10),
                   Text(
                     _errorMessage,
                     style: const TextStyle(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 16),
                     textAlign: TextAlign.center,
                   ),
                   const SizedBox(height: 10),
                   ElevatedButton(
                     onPressed: _loadChannel, 
                     child: const Text("Retry"),
                   )
                 ],
               ),
             ),

          // 6. Watermark Layer (Hide in PiP)
          if (!_hasError && _appLogoUrl != null && !_isPipMode && !_isPremiumContent)
            Positioned(
              bottom: -5,
              left: 15,
              child: Opacity(
                opacity: 0.6,
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    // Responsive width: Smaller in non-fullscreen mode
                    double scale = widget.isFullScreen ? 0.12 : 0.08;
                    double minWidth = widget.isFullScreen ? 80.0 : 45.0;
                    double maxWidth = widget.isFullScreen ? 150.0 : 80.0;
                    
                    double width = constraints.maxWidth * scale;
                    width = width.clamp(minWidth, maxWidth);
                    
                    return Image.network(
                      _appLogoUrl!,
                      width: width,
                      errorBuilder: (c,e,s) => const SizedBox(),
                    );
                  }
                ),
              ),
            ),

            // 7. Viewer Count & Rating (Top Left)
            if (_channel != null && 
                !_isPipMode && 
                !_isPremiumContent &&
                ((_channel!.viewersCountFormatted != null && _channel!.viewersCountFormatted! != "0" && _channel!.viewersCountFormatted!.isNotEmpty) || 
                 (_channel!.averageRating != null && _channel!.averageRating! > 0)))
              Positioned(
                top: 25,
                left: 20,
                child: AnimatedOpacity(
                  opacity: 1.0, // Always visible
                  duration: const Duration(milliseconds: 300),
                  child: IgnorePointer(
                    ignoring: false, // Don't ignore pointers
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

             // 8. Cast & PiP Buttons (Top Right)
            if (!kIsWeb && !_isPipMode && !_isPremiumContent) 
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
                        // PiP Button - Show ONLY if Fullscreen
                        if (widget.isFullScreen)
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
    );
  }

  Widget _buildPremiumOverlay() {
    return Container(
      color: Colors.black,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      child: Center(
        child: SingleChildScrollView(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min, // Wrap content
            children: [
               Container(
                 padding: const EdgeInsets.all(12),
                 decoration: BoxDecoration(
                   shape: BoxShape.circle,
                   color: Colors.amber.withOpacity(0.1),
                 ),
                 child: const Icon(Icons.workspace_premium, color: Color(0xFFFCD34D), size: 32), // Smaller Icon
               ),
               const SizedBox(height: 12),
               const Text(
                 "Premium Content", 
                 style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)
               ),
               const SizedBox(height: 8),
               const Text(
                 "This channel is available exclusively for Premium subscribers. Please upgrade to watch.",
                 textAlign: TextAlign.center,
                 style: TextStyle(color: Colors.white70, fontSize: 13, height: 1.3),
               ),
               const SizedBox(height: 16),
               SizedBox(
                 width: 180,
                 height: 40,
                 child: ElevatedButton(
                   style: ElevatedButton.styleFrom(
                     backgroundColor: const Color(0xFFFBBF24), // Amber-400
                     foregroundColor: Colors.black,
                     padding: EdgeInsets.zero,
                     shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                   ),
                   onPressed: () async {
                      final url = Uri.parse("https://www.nellaiiptv.com");
                      if (await canLaunchUrl(url)) {
                        await launchUrl(url, mode: LaunchMode.externalApplication);
                      } else {
                        ToastService().show("Could not launch website", type: ToastType.error);
                      }
                   },
                   child: const Text("Upgrade Now", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                 ),
               ),
            ],
          ),
        ),
      ),
    );
  }
}
