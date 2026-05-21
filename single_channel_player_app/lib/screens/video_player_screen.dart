import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter/foundation.dart';
import 'package:video_player/video_player.dart';
import 'package:dio/dio.dart';
import 'package:wakelock_plus/wakelock_plus.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import '../services/api_service.dart';
import '../models/channel.dart';
import '../widgets/pulse_loader.dart';
import '../widgets/gesture_overlay.dart';
import 'package:simple_pip_mode/simple_pip.dart';
import '../services/toast_service.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import '../services/audio_manager.dart';
import 'dart:async';
import 'dart:io';
import 'package:device_info_plus/device_info_plus.dart';


class VideoPlayerScreen extends StatefulWidget {
  const VideoPlayerScreen({super.key});

  @override
  State<VideoPlayerScreen> createState() => _VideoPlayerScreenState();
}

class _VideoPlayerScreenState extends State<VideoPlayerScreen> with WidgetsBindingObserver {
  final ApiService _api = ApiService();

  VideoPlayerController? _controller;

  // Subscriptions
  StreamSubscription<double>? _volumeSubscription;
  StreamSubscription<List<ConnectivityResult>>? _connectivitySubscription;
  bool _wasOffline = false;

  // PiP Controller
  late SimplePip _simplePip;

  bool _isLoading = true;
  bool _hasError = false;
  String _errorMessage = '';
  String? _appLogoUrl;
  Channel? _channel;

  // Buffering health tracking
  bool _lastIsBuffering = false;
  DateTime? _lastBufferTime;
  int _bufferCount = 0;

  // TV Detection
  bool _isTV = false;

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
    _enterLandscape();
    WakelockPlus.enable();

    _simplePip = SimplePip(
      onPipEntered: () {
        if (mounted) setState(() { _isPipMode = true; });
      },
      onPipExited: () {
        if (mounted) {
          setState(() { _isPipMode = false; });
          _enterLandscape();
        }
      },
    );

    _detectTV();
    AudioManager().init();

    // Unmute player when system volume becomes non-zero
    _volumeSubscription = AudioManager().volumeStream.listen((volume) {
      if (volume > 0 && (_controller?.value.volume ?? 1.0) == 0) {
        _controller?.setVolume(1.0);
      }
    });

    _connectivitySubscription = Connectivity().onConnectivityChanged.listen(_onConnectivityChanged);

    _fetchAppLogo();
    _fetchChannel();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused || state == AppLifecycleState.inactive) {
      if (!_isPipMode) {
        _controller?.pause();
        AudioManager().restoreOriginalVolume();
      }
    } else if (state == AppLifecycleState.resumed) {
      _controller?.play();
      AudioManager().reapplyAppVolume();
      if (mounted) {
        setState(() { _isPipMode = false; });
        _enterLandscape();
      }
    }
  }

  void _toggleControls() {
    setState(() { _showControls = !_showControls; });
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

  void _onConnectivityChanged(List<ConnectivityResult> results) {
    final isOnline = results.any((r) => r != ConnectivityResult.none);
    if (isOnline && _wasOffline) {
      _wasOffline = false;
      if (_hasError || !(_controller?.value.isPlaying ?? false)) {
        setState(() { _hasError = false; _isLoading = true; });
        ToastService().show("Connection restored. Reconnecting...", type: ToastType.info);
        _fetchChannel();
      }
    } else if (!isOnline) {
      _wasOffline = true;
    }
  }

  Future<void> _detectTV() async {
    if (kIsWeb || defaultTargetPlatform != TargetPlatform.android) return;
    try {
      final androidInfo = await DeviceInfoPlugin().androidInfo;
      final isTV = androidInfo.systemFeatures.contains('android.software.leanback') ||
                   androidInfo.host.toLowerCase().contains('tv') ||
                   androidInfo.model.toLowerCase().contains('tv');
      if (mounted) setState(() { _isTV = isTV; });
    } catch (_) {}
  }

  void _togglePlayPause() {
    if (_controller?.value.isPlaying ?? false) {
      _controller?.pause();
    } else {
      _controller?.play();
    }
  }

  // Returns new volume in 0.0–1.0 for the GestureOverlay overlay indicator
  Future<double> _toggleMute() async {
    final double current = _controller?.value.volume ?? 1.0;
    final double newVol = (current > 0) ? 0.0 : 1.0;
    await _controller?.setVolume(newVol);
    return newVol;
  }

  Future<void> _fetchAppLogo() async {
    try {
      final logo = await _api.getAppLogo();
      if (mounted && logo != null) {
        setState(() { _appLogoUrl = logo; });
      }
    } catch (e) {
      debugPrint("Logo Fetch Error: $e");
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
        msg = e.response != null
            ? "API Error: ${e.response?.data['message'] ?? e.response?.statusMessage}"
            : "Connection Failed. Check URL or Network.";
      } else {
        msg = e.toString();
      }
      if (mounted) _showError(msg);
    }
  }

  // Single listener attached to the VideoPlayerController
  void _playerListener() {
    if (!mounted || _controller == null) return;
    final val = _controller!.value;

    if (val.hasError && !_hasError) {
      _showError("Playback Error: ${val.errorDescription ?? 'Unknown error'}");
      return;
    }

    // Only setState when buffering state actually changes to avoid rebuild storms
    if (val.isBuffering != _lastIsBuffering) {
      _lastIsBuffering = val.isBuffering;
      if (mounted) {
        setState(() { _isLoading = val.isBuffering; });
        if (val.isBuffering) _checkBufferingHealth();
      }
    }
  }

  Future<void> _initVideoPlayer(String url) async {
    try {
      await _disposeController();

      if (mounted) setState(() { _isLoading = true; _hasError = false; });

      _controller = VideoPlayerController.networkUrl(
        Uri.parse(url),
        videoPlayerOptions: VideoPlayerOptions(mixWithOthers: false),
      );
      _controller!.addListener(_playerListener);

      await _controller!.initialize();
      await _controller!.setLooping(false);
      await _controller!.setVolume(1.0);
      await _controller!.play();

      if (mounted) setState(() { _isLoading = false; });

      _startViewCountTimer();
    } catch (e) {
      debugPrint("Video Init Error: $e");
      if (mounted) _showError("Playback Failed");
    }
  }

  void _checkBufferingHealth() {
    final now = DateTime.now();
    if (_lastBufferTime != null && now.difference(_lastBufferTime!) < const Duration(seconds: 30)) {
      _bufferCount++;
    } else {
      _bufferCount = 1;
    }
    _lastBufferTime = now;

    if (_bufferCount >= 3) {
      ToastService().show("Unstable Network: Buffering...", type: ToastType.warning);
      _bufferCount = 0;
    }
  }

  void _showError(String msg) {
    if (mounted) {
      setState(() {
        _isLoading = false;
        _hasError = true;
        _errorMessage = msg;
      });
    }
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

  Future<void> _disposeController() async {
    _controller?.removeListener(_playerListener);
    await _controller?.pause();
    await _controller?.dispose();
    _controller = null;
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _connectivitySubscription?.cancel();
    _volumeSubscription?.cancel();
    _hideTimer?.cancel();
    _viewCountTimer?.cancel();

    _controller?.removeListener(_playerListener);
    _controller?.pause();
    _controller?.dispose();

    WakelockPlus.disable();
    AudioManager().restoreOriginalVolume();

    if (_hasIncrementedView && _channel != null) {
      _api.decrementView(_channel!.uuid);
    }

    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) return;
        final bool shouldExit = await _showExitConfirmation();
        if (shouldExit && context.mounted) {
          exit(0);
        }
      },
      child: Scaffold(
        backgroundColor: const Color(0xFF0F172A),
        body: Stack(
          fit: StackFit.expand,
          children: [
            // 1. Video Layer
            GestureOverlay(
              onTap: _toggleControls,
              onToggleMute: _toggleMute,
              onPlayPause: _togglePlayPause,
              child: Container(
                color: Colors.black,
                child: (_controller != null && _controller!.value.isInitialized)
                    ? SizedBox.expand(
                        child: FittedBox(
                          fit: BoxFit.fill,
                          child: SizedBox(
                            width: _controller!.value.size.width,
                            height: _controller!.value.size.height,
                            child: VideoPlayer(_controller!),
                          ),
                        ),
                      )
                    : const SizedBox(),
              ),
            ),

            // 2. Web Warning
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

            // 3. Loading Overlay — visible until controller is initialized and not buffering
            if ((_isLoading || _controller == null || !_controller!.value.isInitialized) && !_hasError)
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
                      autofocus: true,
                      onPressed: () {
                        setState(() { _hasError = false; _isLoading = true; });
                        _fetchChannel();
                      },
                      child: const Text("Retry"),
                    ),
                  ],
                ),
              ),

            // 5. Watermark
            if (!_hasError && _appLogoUrl != null && !_isPipMode)
              Positioned(
                bottom: 10,
                left: 20,
                child: Opacity(
                  opacity: 0.2,
                  child: Image.network(
                    _appLogoUrl!,
                    width: 150,
                    errorBuilder: (c, e, s) => const SizedBox(),
                  ),
                ),
              ),

            // 6. Viewer Count & Rating (Top Left)
            if (_channel != null &&
                !_isPipMode &&
                ((_channel!.viewersCountFormatted != null &&
                      _channel!.viewersCountFormatted! != "0" &&
                      _channel!.viewersCountFormatted!.isNotEmpty) ||
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
                            if (_channel!.viewersCountFormatted != null &&
                                _channel!.viewersCountFormatted! != "0" &&
                                _channel!.viewersCountFormatted!.isNotEmpty) ...[
                              const Icon(Icons.remove_red_eye_outlined, color: Colors.white70, size: 16),
                              const SizedBox(width: 5),
                              Text(
                                _channel!.viewersCountFormatted!,
                                style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                              ),
                            ],
                            if (_channel!.averageRating != null && _channel!.averageRating! > 0) ...[
                              if (_channel!.viewersCountFormatted != null &&
                                  _channel!.viewersCountFormatted! != "0" &&
                                  _channel!.viewersCountFormatted!.isNotEmpty)
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

            // 7. PiP Button (Top Right, hidden on TV)
            if (!kIsWeb && !_isPipMode && !_isTV)
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
                        IconButton(
                          icon: const Icon(Icons.picture_in_picture_alt, color: Colors.white, size: 28),
                          onPressed: () async {
                            _startHideTimer();
                            try {
                              final isPipAvailable = await SimplePip.isPipAvailable;
                              if (isPipAvailable) {
                                setState(() { _isPipMode = true; });
                                await _simplePip.enterPipMode(aspectRatio: (16, 9));
                              } else {
                                ToastService().show("PiP not supported on this device", type: ToastType.warning);
                              }
                            } catch (e) {
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
            backgroundColor: const Color(0xFF1E293B),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            child: Container(
              width: 350,
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.red.withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.power_settings_new, color: Colors.red, size: 32),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    "Exit ${dotenv.env['APP_TITLE'] ?? "App"}?",
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 20,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 10),
                  const Text(
                    "Are you sure you want to close the player?",
                    style: TextStyle(color: Colors.white70, fontSize: 16),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 30),
                  FocusTraversalGroup(
                    policy: OrderedTraversalPolicy(),
                    child: Row(
                      children: [
                        Expanded(
                          child: TextButton(
                            autofocus: true,
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
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () => Navigator.of(context).pop(true),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.red,
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
                  ),
                ],
              ),
            ),
          ),
        ) ??
        false;
  }
}
