import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart'; // Import for LogicalKeyboardKey
import 'package:flutter_animate/flutter_animate.dart'; // Import flutter_animate
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
  final Function(Channel)? onChannelLoaded; // Callback to sync data back to parent

  const EmbeddedPlayer({
    super.key, 
    required this.channelUuid,
    this.initialChannel,
    this.onDoubleTap,
    this.onTap,
    required this.isFullScreen,
    this.hideControls = false,
    this.onChannelLoaded,
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
  String? _fallbackMp4Url;
  bool _fallbackUsed = false;
  Channel? _channel;
  
  // Premium State
  bool _isPremiumContent = false;
  
  // UI State
  bool _showControls = false;
  Timer? _hideTimer;
  bool _isPipMode = false;
  String? _lastOpenedUrl;
  int _currentLoadId = 0; // Guard against overlapping API returns

  // View Count Logic
  Timer? _viewCountTimer;
  bool _hasIncrementedView = false;
  
  StreamSubscription? _playerErrorSub;
  StreamSubscription? _playerLogSub;

  // Auto-Retry Logic
  Timer? _retryTimer;
  int _retrySeconds = 20;

  late final FocusNode _focusNode;
  
  // Persistent Control Focus Nodes
  late final FocusNode _menuFocusNode;
  late final FocusNode _fsFocusNode;
  late final FocusNode _pipFocusNode;
  late final FocusNode _muteFocusNode;

  @override
  void initState() {
    super.initState();
    _currentLoadId++;
    
    // Init Focus Nodes
    _focusNode = FocusNode();
    _menuFocusNode = FocusNode();
    _fsFocusNode = FocusNode();
    _pipFocusNode = FocusNode();
    _muteFocusNode = FocusNode();
    
    _focusNode.addListener(() {
      if (mounted) {
        if (_focusNode.hasFocus) {
          _toggleControls(show: true);
        }
        setState(() {});
      }
    });
    WidgetsBinding.instance.addObserver(this); 
    
    // Initialize MediaKit Player
    _player = Player();
    
    // 🚀 Performance Tweaks (Apply once)
    if (!kIsWeb) {
      try {
        // Use dynamic to bypass compilation check if setProperty is not in the base Player interface of this version
        final dynamic p = _player;
        p.setProperty('cache-pause', 'no');
        p.setProperty('demuxer-max-bytes', '10485760'); 
        p.setProperty('demuxer-max-back-bytes', '0');
        p.setProperty('stream-buffer-size', '131072');
      } catch (e) {
        debugPrint("Failed to set MediaKit properties: $e");
      }
    }
    
    _controller = VideoController(_player);

    // Listen for Player Errors
    _playerErrorSub = _player.stream.error.listen((error) {
       // debugPrint("MediaKit Stream Error: $error");
       if (mounted) _handlePlaybackError("Stream Error: $error");
    });
    
    // Listen for Logs (often contains 404s that don't trigger stream.error instantly)
    // Disabled to prevent FFI callback crashes on hot restart
    /*
    _playerLogSub = _player.stream.log.listen((log) {
       final String msg = log.toString();
       if (msg.contains("404 Not Found") || msg.contains("Connection refused") || msg.contains("Input/output error")) {
          if (mounted && !_hasError && !_fallbackUsed) {
             _handlePlaybackError("Playback Error: $msg");
          }
       }
    });
    */

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

    _connectivitySubscription = Connectivity().onConnectivityChanged.listen(_handleConnectivityChange);
    
    _audioSubscription = AudioManager().volumeStream.listen((vol) {
      if (mounted) {
        setState(() {});
        // Also sync player volume if hardware buttons change system volume
        _player.setVolume(vol <= 0 ? 0 : 100);
      }
    });

    _initializeApp();
  }
  
  StreamSubscription<List<ConnectivityResult>>? _connectivitySubscription;
  StreamSubscription<double>? _audioSubscription;
  bool _wasOffline = false;

  void _handleConnectivityChange(List<ConnectivityResult> results) {
     final isOffline = results.contains(ConnectivityResult.none);
     if (isOffline) {
       if (!_wasOffline) {
          ToastService().show("Internet Connection Lost", type: ToastType.error);
          _wasOffline = true;
       }
     } else {
       if (_wasOffline) {
          ToastService().show("Internet Connection Restored", type: ToastType.success);
          _wasOffline = false;
          // Auto-retry if we were in an error state or stuck loading
          if (_hasError || (_isLoading && _channel == null)) {
             _loadChannel();
          }
       }
     }
  }

  Future<void> _initializeApp() async {
    await _fetchSettings(); // Ensure settings (and fallback URL) are loaded FIRST
    if (mounted) _loadChannel();
  }

  @override
  void didUpdateWidget(covariant EmbeddedPlayer oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.channelUuid != widget.channelUuid) {
      _loadChannel();
    }
    if (oldWidget.isFullScreen != widget.isFullScreen) {
      _updateSystemUI();
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

  void _toggleControls({bool? show}) {
    if (_isPremiumContent || widget.hideControls) return; 
    setState(() {
      _showControls = show ?? !_showControls;
    });
    if (_showControls) _startHideTimer();
    else _hideTimer?.cancel();
  }

  void _toggleFullScreen() {
    if (widget.onDoubleTap != null) {
      widget.onDoubleTap!();
    }
  }

  void _updateSystemUI() {
    if (widget.isFullScreen) {
      SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
    } else {
      // Restore immersive mode but sticky as well for TV
      SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
    }
  }

  void _startHideTimer() {
    _hideTimer?.cancel();
    _hideTimer = Timer(const Duration(seconds: 4), () {
      if (mounted && _showControls) {
        setState(() { _showControls = false; });
      }
    });
  }

  Future<void> _toggleMute() async {
    await AudioManager().toggleMute();
    if (mounted) {
      final bool isMuted = AudioManager().isMuted;
      _player.setVolume(isMuted ? 0 : 100);
    }
  }
  
  Future<void> _fetchSettings() async {
    try {
      final settings = await _api.getPublicSettings();
      if (mounted && settings != null) {
        setState(() {
          _appLogoUrl = settings.appLogoPngUrl ?? settings.logoUrl;
          _fallbackMp4Url = settings.fallbackMp4Url;
        });
      }
    } catch (e) {
      debugPrint("Settings Fetch Error: $e");
    }
  }

   Future<void> _loadChannel() async {
    final int loadId = ++_currentLoadId;
    _retryTimer?.cancel(); // Cancel any existing retry loop when starting a new load
    // 1. Reset Error State but keep loading if we don't have initial data
    setState(() { 
      _hasError = false; 
      _errorMessage = ''; 
      _fallbackUsed = false; // Reset fallback state for new channel
      if (widget.initialChannel == null) _isLoading = true;
    }); 
    
    // 2. Use initialChannel data for INSTANT start if available
    if (widget.initialChannel != null) {
      // debugPrint("Instant Play Triggered for: ${widget.initialChannel!.name}");
      _channel = widget.initialChannel;
      _isPremiumContent = _channel!.isPremium;
      
      if (!_isPremiumContent && _channel!.hlsUrl != null) {
        await _initVideoPlayer(_channel!.hlsUrl!);
      } else if (_isPremiumContent) {
        if (mounted) {
          setState(() {
            _isLoading = false;
          });
        }
        WakelockPlus.enable();
      }
    }

    // 3. Parallel Background Update from API (Stats & Data Freshness)
    _api.getChannelDetails(widget.channelUuid).then((channel) async {
      if (!mounted || _currentLoadId != loadId) return;
      
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
           _player.stop().catchError((e) => debugPrint("Player Stop Error: $e")); 
           _viewCountTimer?.cancel();
           WakelockPlus.enable(); 
        } else if (channel.hlsUrl != null && (widget.initialChannel == null || wasPremium)) {
          // Only init if we haven't already OR if we are switching FROM a premium state
          await _initVideoPlayer(channel.hlsUrl!);
        }

        // Notify parent with fresh data (e.g. ratings)
        widget.onChannelLoaded?.call(channel);
      }
    }).catchError((e) {
       if (widget.initialChannel == null) {
          if (e is DioException) {
             _handleDioError(e);
          } else {
             _handleError(e);
          }
       }
       debugPrint("Background Channel Update Error: $e");
    });
  }

  void _handleError(dynamic e) {
    String msg = "Failed to load channel";
    msg = e.toString();
    if (mounted) _showError(msg);
  }

  void _handleDioError(DioException dio_exception) {
    String msg = "Failed to load channel";
    if (dio_exception.response != null) {
      msg = "API Error: ${dio_exception.response?.data['message'] ?? dio_exception.response?.statusMessage}";
    } else {
      msg = "Connection Failed. Check URL or Network.";
    }
    if (mounted) _showError(msg);
  }

  Future<void> _initVideoPlayer(String url) async {
    if (url == _lastOpenedUrl && !_hasError && _player.state.playing) {
       // Still playing the same thing, just ensure we show the UI
       if (mounted && _isLoading) setState(() => _isLoading = false);
       return;
    }
    _lastOpenedUrl = url;

    try {
      if (mounted) {
        setState(() {
          _isLoading = true;
          _hasError = false;
        });
      }

      // 🛑 CRITICAL: We don't call stop() explicitly before open()
      // MediaKit's open() handles the transition internally much more safely for FFI.
      await _player.open(Media(url), play: true);
      
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }

      _startViewCountTimer();
      
    } catch (e) {
      debugPrint("Video Init Error: $e");
      if (mounted) _handlePlaybackError("Playback Failed: $e");
    }
  }

  Future<void> _handlePlaybackError(String errorMsg) async {
      // debugPrint("HANDLE_PLAYBACK_ERROR: $errorMsg");
      
      // If fallback is already being used or setup, ignore further errors
      if (_fallbackUsed) return;
      
      // If fallback URL is missing, try fetching settings one last time (Race condition fix)
      // This handles cases where error occurs before settings load completion.
      if (_fallbackMp4Url == null) {
          // debugPrint("Fallback URL is null. Attempting to fetch settings...");
          await _fetchSettings();
      }

      // debugPrint("State: _fallbackUsed=$_fallbackUsed, _isPremiumContent=$_isPremiumContent");
      // debugPrint("Fallback URL: $_fallbackMp4Url");

      // Check Fallback Conditions:
      // 1. Fallback hasn't been used yet (prevent loop)
      // 2. Fallback URL exists
      // 3. User is allowed to watch (not premium blocked)
      if (!_fallbackUsed && _fallbackMp4Url != null && _fallbackMp4Url!.isNotEmpty && !_isPremiumContent) {
          // debugPrint("Switching to Fallback URL: $_fallbackMp4Url");
          _fallbackUsed = true; // Prevent infinite loop
          
          if (mounted) {
            setState(() {
               _isLoading = false; // Hide loader immediately to show player/button
            });
          }

          _initVideoPlayer(_fallbackMp4Url!);
          
          // Start Auto-Retry Countdown
          _startRetryCountdown();
          
          // Seamless switch - no toast to user, just play the fallback stream
          return;
      } else {
        // debugPrint("Fallback conditions not met. Showing error.");
      }
      // Sanitize error to not expose URL to user
      _showError("Stream Unavailable");
  }

  void _startRetryCountdown() {
    setState(() => _retrySeconds = 20);
    _retryTimer?.cancel();
    _retryTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        setState(() {
          if (_retrySeconds > 0) {
            _retrySeconds--;
          } else {
            // Time up! Retry
            timer.cancel();
            _loadChannel();
          }
        });
      }
    });
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
    _viewCountTimer = Timer(const Duration(seconds: 5), () {
      if (mounted && _channel != null && !_hasIncrementedView && !_isPremiumContent) {
        _api.incrementView(_channel!.uuid);
        _hasIncrementedView = true;
      }
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    AudioManager().reapplyAppVolume(); // Ensure current app volume is applied

    _viewCountTimer?.cancel();
    _retryTimer?.cancel();
    _audioSubscription?.cancel();
    _connectivitySubscription?.cancel();
    
    // Explicitly cancel player-specific subscriptions first
    _playerErrorSub?.cancel();
    _playerLogSub?.cancel();

    // 🛑 Synchronous disposal is safer for hot restarts to prevent post-environment-wipe callbacks
    _player.dispose();

    _menuFocusNode.dispose();
    _fsFocusNode.dispose();
    _pipFocusNode.dispose();
    _muteFocusNode.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Focus(
      focusNode: _focusNode,
      autofocus: true,
      onKeyEvent: (node, event) {
        if (event is KeyDownEvent) {
           final isSelect = event.logicalKey == LogicalKeyboardKey.select || 
                           event.logicalKey == LogicalKeyboardKey.enter ||
                           event.logicalKey == LogicalKeyboardKey.numpadEnter ||
                           event.logicalKey == LogicalKeyboardKey.space;
           
           final isBack = event.logicalKey == LogicalKeyboardKey.escape || 
                          event.logicalKey == LogicalKeyboardKey.goBack;

           final isMenu = event.logicalKey == LogicalKeyboardKey.contextMenu || 
                          event.logicalKey == LogicalKeyboardKey.keyI ||
                          event.logicalKey == LogicalKeyboardKey.info ||
                          event.logicalKey == LogicalKeyboardKey.guide;

           if (isMenu && widget.isFullScreen) {
              // Open STB Menu
              widget.onTap?.call();
              return KeyEventResult.handled;
           }

           if (isSelect) {
             if (!widget.isFullScreen) {
               // If embedded, Enter/Select goes to fullscreen
               widget.onDoubleTap?.call();
             } else {
               // If already in fullscreen, Enter/Select toggles controls
               _toggleControls();
             }
             return KeyEventResult.handled;
           }

           if (isBack && widget.isFullScreen) {
              // Exit fullscreen on Back button
              widget.onDoubleTap?.call();
              return KeyEventResult.handled;
           }
        }
        return KeyEventResult.ignored;
      },
      child: Builder(
        builder: (context) {
          final bool hasFocus = _focusNode.hasFocus;
          return GestureOverlay(
            onTap: () {
              _focusNode.requestFocus();
              if (!widget.isFullScreen) {
                _toggleFullScreen();
              } else {
                _toggleControls();
              }
            },
            onToggleMute: widget.onDoubleTap ?? () => _toggleMute(),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              decoration: BoxDecoration(
                color: Colors.transparent,
                border: (!widget.isFullScreen && hasFocus) 
                    ? Border.all(color: const Color(0xFF0EA5E9), width: 2.5) 
                    : Border.all(color: Colors.transparent, width: 2.5),
                boxShadow: (!widget.isFullScreen && hasFocus) ? [
                  BoxShadow(color: const Color(0xFF0EA5E9).withOpacity(0.4), blurRadius: 12, spreadRadius: 2)
                ] : [],
              ),
              child: Stack(
                fit: StackFit.expand,
                children: [
                  // 1. Video Surface
                  Container(
                    color: Colors.transparent, 
                    child: _isPremiumContent 
                      ? const SizedBox() 
                      : SizedBox.expand(
                          child: Video(
                            controller: _controller,
                            controls: NoVideoControls,
                            alignment: Alignment.center,
                            fit: BoxFit.fill, // Stretched to fill player area in both embedded and fullscreen
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
              
              if (!_hasError && !_isPremiumContent) {
                if (_isLoading) {
                   return Container(
                     color: Colors.transparent, 
                     child: const Center(child: PulseLoader(color: Color(0xFF06B6D4), size: 60)),
                   );
                } else if (isBuffering) {
                   return const Center(child: PulseLoader(color: Color(0xFF06B6D4), size: 60));
                }
              }
              return const SizedBox();
            },
          ),
          
          // 4. Retry Button (Fallback Mode)
          // Show when fallback is active request by user to manually retry
          if (_fallbackUsed)
            Positioned(
              bottom: widget.isFullScreen ? 50 : 20, // Lower in embedded mode
              left: 0,
              right: 0,
              child: SafeArea(
                child: Center(
                  child: ElevatedButton.icon(
                    autofocus: true, // Auto-focus on fallback for D-Pad
                    onPressed: () {
                      // Manually trigger reload
                      _loadChannel();
                    },
                    // Responsive sizing: Larger in fullscreen, compact in embedded
                    icon: Icon(Icons.refresh, size: widget.isFullScreen ? 18 : 14),
                    label: Text("$_retrySeconds", 
                      style: TextStyle(fontSize: widget.isFullScreen ? 15 : 12)
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF06B6D4), // Cyan to match theme
                      foregroundColor: Colors.white,
                      padding: EdgeInsets.symmetric(
                        horizontal: widget.isFullScreen ? 20 : 12, 
                        vertical: widget.isFullScreen ? 12 : 6
                      ),
                      minimumSize: Size.zero, // Remove default minimums for true compactness
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap, // Tighter touch target
                      elevation: 5,
                    ),
                  )
                  .animate(onPlay: (controller) => controller.repeat(reverse: true))
                  .scale(begin: const Offset(1.0, 1.0), end: const Offset(1.05, 1.05), duration: 800.ms)
                  .then(delay: 800.ms), // Gentle pulse
                ),
              ),
            ),

          // 5. Premium Overlay
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
                opacity: 0.2,
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

             // 7. Viewer Count & Rating (REMOVED)


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
                        // 1. Channel List Button (STB Navigation) - NEW
                        if (widget.isFullScreen)
                              InkWell(
                                focusNode: _menuFocusNode,
                                onTap: () {
                                  _startHideTimer();
                                  widget.onTap?.call();
                                },
                                borderRadius: BorderRadius.circular(20),
                                child: AnimatedBuilder(
                                  animation: _menuFocusNode,
                                  builder: (context, child) {
                                    return Container(
                                      padding: const EdgeInsets.all(8),
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        color: _menuFocusNode.hasFocus ? const Color(0xFF0EA5E9).withOpacity(0.8) : Colors.black45,
                                        border: _menuFocusNode.hasFocus ? Border.all(color: Colors.white, width: 2) : null,
                                      ),
                                      child: const Icon(Icons.menu_open, color: Colors.white, size: 28),
                                    );
                                  },
                                ),
                              ),
                        if (widget.isFullScreen) const SizedBox(width: 12),

                        // 2. Fullscreen Toggle Button - CRITICAL FOR TV
                            InkWell(
                              focusNode: _fsFocusNode,
                              onTap: () {
                                _startHideTimer();
                                _toggleFullScreen();
                              },
                              borderRadius: BorderRadius.circular(20),
                              child: AnimatedBuilder(
                                animation: _fsFocusNode,
                                builder: (context, child) {
                                  return Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      color: _fsFocusNode.hasFocus ? const Color(0xFF0EA5E9).withOpacity(0.8) : Colors.black45,
                                      border: _fsFocusNode.hasFocus ? Border.all(color: Colors.white, width: 2) : null,
                                    ),
                                    child: Icon(
                                      widget.isFullScreen ? Icons.fullscreen_exit : Icons.fullscreen, 
                                      color: Colors.white, 
                                      size: 28
                                    ),
                                  );
                                },
                              ),
                            ),
                        const SizedBox(width: 12),

                        // PiP Button - Show ONLY if Fullscreen
                        if (widget.isFullScreen)
                              InkWell(
                                focusNode: _pipFocusNode,
                                onTap: () async {
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
                                borderRadius: BorderRadius.circular(20),
                                child: AnimatedBuilder(
                                  animation: _pipFocusNode,
                                  builder: (context, child) {
                                    return Container(
                                      padding: const EdgeInsets.all(8),
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        color: _pipFocusNode.hasFocus ? const Color(0xFF0EA5E9).withOpacity(0.8) : Colors.black45,
                                        border: _pipFocusNode.hasFocus ? Border.all(color: Colors.white, width: 2) : null,
                                        boxShadow: _pipFocusNode.hasFocus ? [
                                          BoxShadow(color: const Color(0xFF0EA5E9).withOpacity(0.5), blurRadius: 8, spreadRadius: 2)
                                        ] : [],
                                      ),
                                      child: const Icon(Icons.picture_in_picture_alt, color: Colors.white, size: 28),
                                    );
                                  },
                                ),
                              ),
                        const SizedBox(width: 12),

                        // 4. Mute Button - NEW
                            InkWell(
                              focusNode: _muteFocusNode,
                               onTap: () async {
                                _startHideTimer();
                                await _toggleMute();
                                if (mounted) setState(() {});
                              },
                              borderRadius: BorderRadius.circular(20),
                              child: AnimatedBuilder(
                                animation: _muteFocusNode,
                                builder: (context, child) {
                                  final isMuted = AudioManager().isMuted;
                                  return Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      color: _muteFocusNode.hasFocus ? const Color(0xFF0EA5E9).withOpacity(0.8) : Colors.black45,
                                      border: _muteFocusNode.hasFocus ? Border.all(color: Colors.white, width: 2) : null,
                                    ),
                                    child: Icon(
                                      isMuted ? Icons.volume_off : Icons.volume_up, 
                                      color: Colors.white, 
                                      size: 28
                                    ),
                                  );
                                },
                              ),
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
    },
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
                      final url = Uri.parse("https://www.nellaiiptv.com/login");
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
