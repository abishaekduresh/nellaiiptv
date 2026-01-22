import 'dart:async';
import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'package:wakelock_plus/wakelock_plus.dart';
import '../../core/api_service.dart';
import '../../models/channel.dart';
import '../../widgets/pulse_loader.dart';
import 'package:simple_pip_mode/simple_pip.dart';

class EmbeddedPlayer extends StatefulWidget {
  final String channelUuid;
  final VoidCallback? onDoubleTap;

  const EmbeddedPlayer({
    super.key, 
    required this.channelUuid,
    this.onDoubleTap,
  });

  @override
  State<EmbeddedPlayer> createState() => _EmbeddedPlayerState();
}

class _EmbeddedPlayerState extends State<EmbeddedPlayer> {
  final ApiService _api = ApiService();
  VideoPlayerController? _controller;
  bool _isLoading = true;
  String? _error;
  Channel? _channel;

  late SimplePip _simplePip;
  bool _isPipMode = false;

  @override
  void initState() {
    super.initState();
    WakelockPlus.enable();
    _simplePip = SimplePip(
      onPipEntered: () => setState(() => _isPipMode = true),
      onPipExited: () => setState(() => _isPipMode = false),
    );
    _loadChannel();
  }

  @override
  void didUpdateWidget(covariant EmbeddedPlayer oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.channelUuid != widget.channelUuid) {
      _loadChannel();
    }
  }

  Future<void> _loadChannel() async {
    setState(() { _isLoading = true; _error = null; });
    _disposeController();

    try {
      final channel = await _api.getChannelDetails(widget.channelUuid);
      if (mounted) {
        setState(() => _channel = channel);
        if (channel.hlsUrl != null) {
          _initPlayer(channel.hlsUrl!);
        } else {
           setState(() { _isLoading = false; _error = "No Stream URL"; });
        }
      }
    } catch (e) {
      if (mounted) setState(() { _isLoading = false; _error = "Failed to load: $e"; });
    }
  }

  Future<void> _initPlayer(String url) async {
    try {
      _controller = VideoPlayerController.networkUrl(Uri.parse(url));
      await _controller!.initialize();
      await _controller!.setVolume(1.0);
      await _controller!.play();
      if (mounted) setState(() { _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() { _isLoading = false; _error = "Playback Error"; });
    }
  }

  void _disposeController() {
    _controller?.dispose();
    _controller = null;
  }

  @override
  void dispose() {
    _disposeController();
    WakelockPlus.disable();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onDoubleTap: widget.onDoubleTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        color: Colors.black,
        width: double.infinity,
        height: double.infinity,
        child: Stack(
          alignment: Alignment.center,
          children: [
            // Video Layer - Forced Full Width/Height Stretch
            SizedBox.expand(
            child: FittedBox(
              fit: BoxFit.fill,
              child: SizedBox(
                width: _controller!.value.size.width,
                height: _controller!.value.size.height,
                child: VideoPlayer(_controller!),
              ),
            ),
          ),
          
          if (_isLoading)
            const PulseLoader(color: Color(0xFF06B6D4), size: 60),

          if (_error != null)
             Container(
               padding: const EdgeInsets.all(16.0),
               color: Colors.black54,
               child: Text(
                 _error!, 
                 style: const TextStyle(color: Colors.red, fontWeight: FontWeight.bold),
                 textAlign: TextAlign.center,
               ),
             ),
            
          // Gradient Overlay (Bottom)
          Positioned(
            left: 0, right: 0, bottom: 0,
            height: 60,
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.transparent, Colors.black87],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
            ),
          ),

          // Top Info Overlay (View Count & Quality) -> Moved to Left
          if (_channel != null)
            Positioned(
              top: 16,
              left: 16, 
              child: Row(
                children: [
                  const SizedBox(width: 8),
                  if (_channel!.viewersCountFormatted != null)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(color: Colors.black54, borderRadius: BorderRadius.circular(4)),
                      child: Row(
                        children: [
                          const Icon(Icons.remove_red_eye, color: Colors.white, size: 12),
                          const SizedBox(width: 4),
                          Text(
                            _channel!.viewersCountFormatted!,
                            style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),

          // PiP Button -> Right Side
          if (_controller != null && _controller!.value.isInitialized)
            Positioned(
              top: 16,
              right: 16,
              child: IconButton(
                icon: const Icon(Icons.picture_in_picture_alt, color: Colors.white),
                onPressed: () => _simplePip.enterPipMode(aspectRatio: (16, 9)),
              ),
            ),
        ],
      ),
    ),
  );
  }
}
