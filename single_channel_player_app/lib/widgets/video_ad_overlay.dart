import 'dart:async';
import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/api_service.dart';
import '../models/visual_ad.dart';

class VideoAdOverlay extends StatefulWidget {
  final VisualAd ad;
  final VoidCallback onComplete;
  final VoidCallback? onFullScreenToggle;

  const VideoAdOverlay({
    super.key,
    required this.ad,
    required this.onComplete,
    this.onFullScreenToggle,
  });

  @override
  State<VideoAdOverlay> createState() => _VideoAdOverlayState();
}

class _VideoAdOverlayState extends State<VideoAdOverlay> {
  late VideoPlayerController _controller;
  final ApiService _api = ApiService();

  bool _isInitialized = false;
  bool _isMuted = false;
  int _timeLeft = 0;
  int _skipCountdown = 0;
  bool _canSkip = false;
  bool _completed = false;
  bool _impressionTracked = false;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _timeLeft = widget.ad.durationSeconds;
    _skipCountdown = widget.ad.isSkippable ? widget.ad.skipAfterSeconds : 0;
    _initPlayer();
  }

  Future<void> _initPlayer() async {
    _controller = VideoPlayerController.networkUrl(
      Uri.parse(widget.ad.adUrl),
      videoPlayerOptions: VideoPlayerOptions(mixWithOthers: true),
    );

    try {
      await _controller.initialize();
      if (!mounted) return;
      await _controller.setVolume(1.0);
      await _controller.setLooping(false);
      await _controller.play();

      setState(() => _isInitialized = true);

      if (!_impressionTracked) {
        _impressionTracked = true;
        _api.trackVisualAdImpression(widget.ad.uuid);
      }

      _controller.addListener(_checkVideoEnd);
      _startCountdown();
    } catch (e) {
      debugPrint('[VideoAdOverlay] Init error: $e');
      _finish();
    }
  }

  void _checkVideoEnd() {
    if (!_controller.value.isInitialized) return;
    final pos = _controller.value.position;
    final dur = _controller.value.duration;
    if (dur > Duration.zero && pos >= dur) _finish();
  }

  void _startCountdown() {
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      setState(() {
        _timeLeft = (_timeLeft - 1).clamp(0, widget.ad.durationSeconds);
        if (_timeLeft <= 0) {
          _finish();
          return;
        }
        if (widget.ad.isSkippable && !_canSkip) {
          _skipCountdown = (_skipCountdown - 1).clamp(0, widget.ad.skipAfterSeconds);
          if (_skipCountdown <= 0) _canSkip = true;
        }
      });
    });
  }

  void _finish() {
    if (_completed) return;
    _completed = true;
    _timer?.cancel();
    if (_controller.value.isInitialized) {
      _controller.removeListener(_checkVideoEnd);
    }
    widget.onComplete();
  }

  void _handleSkip() {
    if (!_canSkip) return;
    _api.trackVisualAdSkip(widget.ad.uuid);
    _finish();
  }

  void _handleClick() async {
    final url = widget.ad.clickUrl;
    if (url == null || url.isEmpty) return;
    _api.trackVisualAdClick(widget.ad.uuid);
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  void _toggleMute() {
    setState(() => _isMuted = !_isMuted);
    _controller.setVolume(_isMuted ? 0.0 : 1.0);
  }

  @override
  void dispose() {
    _timer?.cancel();
    try {
      _controller.removeListener(_checkVideoEnd);
      _controller.dispose();
    } catch (_) {}
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isCompact = size.width < 400 || size.height < 320;
    final hPad    = isCompact ? 8.0  : 12.0;
    final vPad    = isCompact ? 6.0  : 8.0;
    final tTitle  = isCompact ? 11.0 : 13.0;
    final tDesc   = isCompact ? 9.0  : 11.0;
    final tBadge  = isCompact ? 9.0  : 11.0;
    final tSkip   = isCompact ? 10.0 : 12.0;
    final iconSz  = isCompact ? 13.0 : 16.0;
    final btnPadH = isCompact ? 8.0  : 14.0;
    final btnPadV = isCompact ? 5.0  : 7.0;

    return GestureDetector(
      onDoubleTap: widget.onFullScreenToggle,
      child: Container(
        color: Colors.black,
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Video — stretched to fill
            if (_isInitialized)
              SizedBox.expand(
                child: FittedBox(
                  fit: BoxFit.fill,
                  child: SizedBox(
                    width: _controller.value.size.width,
                    height: _controller.value.size.height,
                    child: VideoPlayer(_controller),
                  ),
                ),
              )
            else
              const Center(
                child: CircularProgressIndicator(
                  color: Color(0xFFF59E0B),
                  strokeWidth: 2.5,
                ),
              ),

            // Top bar — AD badge + countdown
            Positioned(
              top: 0, left: 0, right: 0,
              child: SafeArea(
                bottom: false,
                child: Container(
                  padding: EdgeInsets.symmetric(horizontal: hPad, vertical: vPad),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [Colors.black.withValues(alpha: 0.72), Colors.transparent],
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: EdgeInsets.symmetric(
                            horizontal: isCompact ? 5 : 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF59E0B),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          'AD',
                          style: TextStyle(
                            color: Colors.black,
                            fontWeight: FontWeight.w900,
                            fontSize: tBadge,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        '${_timeLeft}s remaining',
                        style: TextStyle(
                          color: const Color(0xFFFFFFB3),
                          fontSize: tBadge,
                          fontFamily: 'monospace',
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            // Bottom bar — info + controls
            Positioned(
              bottom: 0, left: 0, right: 0,
              child: SafeArea(
                top: false,
                child: Container(
                  padding: EdgeInsets.symmetric(
                      horizontal: hPad, vertical: isCompact ? 8 : 10),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.bottomCenter,
                      end: Alignment.topCenter,
                      colors: [Colors.black.withValues(alpha: 0.82), Colors.transparent],
                    ),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              widget.ad.title,
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: tTitle,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            if (widget.ad.description != null &&
                                widget.ad.description!.isNotEmpty) ...[
                              const SizedBox(height: 2),
                              Text(
                                widget.ad.description!,
                                style: TextStyle(
                                  color: const Color(0xFFAAAAAA),
                                  fontSize: tDesc,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                            if (widget.ad.clickUrl != null &&
                                widget.ad.clickUrl!.isNotEmpty) ...[
                              SizedBox(height: isCompact ? 4 : 6),
                              GestureDetector(
                                onTap: _handleClick,
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(Icons.open_in_new,
                                        color: const Color(0xFFF59E0B),
                                        size: iconSz - 2),
                                    const SizedBox(width: 4),
                                    Text(
                                      'Visit Advertiser',
                                      style: TextStyle(
                                        color: const Color(0xFFF59E0B),
                                        fontSize: tSkip,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),

                      Row(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          GestureDetector(
                            onTap: _toggleMute,
                            child: Container(
                              padding: EdgeInsets.all(isCompact ? 5 : 7),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Icon(
                                _isMuted ? Icons.volume_off : Icons.volume_up,
                                color: Colors.white,
                                size: iconSz,
                              ),
                            ),
                          ),

                          if (widget.ad.isSkippable) ...[
                            const SizedBox(width: 8),
                            if (_canSkip)
                              GestureDetector(
                                onTap: _handleSkip,
                                child: Container(
                                  padding: EdgeInsets.symmetric(
                                      horizontal: btnPadH, vertical: btnPadV),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text(
                                        'Skip Ad',
                                        style: TextStyle(
                                          color: Colors.black,
                                          fontWeight: FontWeight.w900,
                                          fontSize: tSkip,
                                        ),
                                      ),
                                      const SizedBox(width: 4),
                                      Icon(Icons.skip_next,
                                          color: Colors.black,
                                          size: iconSz - 1),
                                    ],
                                  ),
                                ),
                              )
                            else
                              Container(
                                padding: EdgeInsets.symmetric(
                                    horizontal: btnPadH, vertical: btnPadV),
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                      color: Colors.white.withValues(alpha: 0.15)),
                                ),
                                child: Text(
                                  'Skip in ${_skipCountdown}s',
                                  style: TextStyle(
                                    color: const Color(0xFFAAAAAA),
                                    fontSize: tSkip,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                          ],
                        ],
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
}
