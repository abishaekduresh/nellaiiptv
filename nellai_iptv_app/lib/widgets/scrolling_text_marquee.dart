import 'package:flutter/material.dart';

/// A horizontally scrolling marquee that displays text ads.
///
/// Supports inline Markdown: **bold**, *italic*, ~~strikethrough~~, `code`.
/// Uses LayoutBuilder to get the ACTUAL container width (not screen width),
/// so the text starts at the right edge immediately with no startup delay.
class ScrollingTextMarquee extends StatefulWidget {
  final String text;
  final int scrollSpeed;   // pixels/sec from backend `scroll_speed`
  final int repeatCount;   // loops before calling onComplete, from `repeat_count`
  final VoidCallback onComplete;

  const ScrollingTextMarquee({
    super.key,
    required this.text,
    required this.scrollSpeed,
    required this.repeatCount,
    required this.onComplete,
  });

  @override
  State<ScrollingTextMarquee> createState() => _ScrollingTextMarqueeState();
}

class _ScrollingTextMarqueeState extends State<ScrollingTextMarquee>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  double _containerWidth = 0;
  double _textWidth = 0;
  double _travelDistance = 0;
  bool _ready = false;

  // Loop tracking
  int _loopsCompleted = 0;
  double _prevValue = 0.0;
  bool _done = false;

  static const TextStyle _baseStyle = TextStyle(
    color: Colors.white,
    fontSize: 14,
    fontWeight: FontWeight.w500,
  );

  /// Parses inline Markdown into a styled [TextSpan] tree.
  /// Supports: **bold**, *italic*, ~~strike~~, `code`, plain text.
  static TextSpan _parseMarkdown(String text) {
    final List<InlineSpan> spans = [];
    final RegExp pat = RegExp(
      r'\*\*(.+?)\*\*'
      r'|\*(.+?)\*'
      r'|~~(.+?)~~'
      r'|`(.+?)`'
      r'|([^*~`]+)',
    );
    for (final m in pat.allMatches(text)) {
      if (m.group(1) != null) {
        spans.add(TextSpan(text: m.group(1), style: _baseStyle.copyWith(fontWeight: FontWeight.bold)));
      } else if (m.group(2) != null) {
        spans.add(TextSpan(text: m.group(2), style: _baseStyle.copyWith(fontStyle: FontStyle.italic)));
      } else if (m.group(3) != null) {
        spans.add(TextSpan(text: m.group(3), style: _baseStyle.copyWith(decoration: TextDecoration.lineThrough, decorationColor: Colors.white70)));
      } else if (m.group(4) != null) {
        spans.add(TextSpan(text: m.group(4), style: _baseStyle.copyWith(fontFamily: 'monospace', color: const Color(0xFF7DD3FC), backgroundColor: Colors.white10)));
      } else if (m.group(5) != null) {
        spans.add(TextSpan(text: m.group(5), style: _baseStyle));
      }
    }
    return TextSpan(children: spans.isEmpty ? [TextSpan(text: text, style: _baseStyle)] : spans);
  }

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(seconds: 10));
  }

  /// Called with the REAL container width from LayoutBuilder — only runs once.
  void _setupAndStart(double containerWidth) {
    if (_ready) return; // Already initialized

    _containerWidth = containerWidth;

    // Measure text width based on parsed markdown spans
    final textPainter = TextPainter(
      text: _parseMarkdown(widget.text),
      textDirection: TextDirection.ltr,
    )..layout(minWidth: 0, maxWidth: double.infinity);

    _textWidth = textPainter.size.width;

    // Total distance = actual container width + text width
    // This ensures the text starts just off the RIGHT edge and exits just off the LEFT edge
    _travelDistance = _containerWidth + _textWidth;

    final double speed = widget.scrollSpeed > 0 ? widget.scrollSpeed.toDouble() : 50.0;
    final int durationMs = (_travelDistance / speed * 1000).round();
    _controller.duration = Duration(milliseconds: durationMs > 0 ? durationMs : 1000);

    final int maxLoops = widget.repeatCount > 0 ? widget.repeatCount : 1;

    // Detect seamless loop wraps: repeat() goes 0→1→0→1 with no gap.
    // When value drops from >0.95 to <0.05, one loop completed.
    _controller.addListener(() {
      if (_done) return;
      if (_prevValue > 0.95 && _controller.value < 0.05) {
        _loopsCompleted++;
        if (_loopsCompleted >= maxLoops) {
          _done = true;
          _controller.stop();
          widget.onComplete();
        }
      }
      _prevValue = _controller.value;
    });

    setState(() => _ready = true);
    _controller.repeat(); // Zero-gap seamless looping
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // LayoutBuilder gives us the ACTUAL available width of the container,
    // not the full screen width. This prevents the startup delay caused by
    // the text needing to travel from the far-right of the screen to the
    // visible area of the narrower left panel.
    return LayoutBuilder(
      builder: (context, constraints) {
        final double actualWidth = constraints.maxWidth;

        // Initialize on the first layout pass
        if (!_ready && actualWidth > 0) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted && !_ready) _setupAndStart(actualWidth);
          });
        }

        if (!_ready || _travelDistance == 0) return const SizedBox();

        return ClipRect(
          child: AnimatedBuilder(
            animation: _controller,
            builder: (context, child) {
              // dx starts at containerWidth (text off-screen right)
              // and moves to -textWidth (text off-screen left)
              final double dx = _containerWidth - (_controller.value * _travelDistance);
              return Transform.translate(
                offset: Offset(dx, 0),
                child: SizedBox(
                  width: _textWidth + 10,
                  child: RichText(
                    text: _parseMarkdown(widget.text),
                    maxLines: 1,
                    overflow: TextOverflow.visible,
                    softWrap: false,
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }
}
