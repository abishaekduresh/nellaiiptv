import 'package:flutter/material.dart';

class PulseLoader extends StatefulWidget {
  final Color color;
  final double size;

  const PulseLoader({
    super.key, 
    this.color = const Color(0xFF06B6D4),
    this.size = 50.0,
  });

  @override
  State<PulseLoader> createState() => _PulseLoaderState();
}

class _PulseLoaderState extends State<PulseLoader> with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2), // 1.5s in CSS, tweaked for flutter
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: widget.size,
      height: widget.size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Central Dot
          Container(
            width: widget.size * 0.4,
            height: widget.size * 0.4,
            decoration: BoxDecoration(
              color: widget.color,
              shape: BoxShape.circle,
            ),
          ),
          // Ripple 1
          _buildRipple(0.0),
          // Ripple 2
          _buildRipple(0.5), // Delay effect
        ],
      ),
    );
  }

  Widget _buildRipple(double startInterval) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        // Calculate progress (0.0 to 1.0) shifted by interval
        double progress = (_controller.value + startInterval) % 1.0;
        
        return Container(
          width: widget.size * (0.4 + (progress * 1.6)), // Expand from 40% to 200%
          height: widget.size * (0.4 + (progress * 1.6)),
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(
              // Fade out opacity
              color: widget.color.withOpacity((1.0 - progress) * 0.5),
              width: 2 + (4 * (1.0 - progress)), // Border gets thinner? CSS was shadow.
            ),
          ),
        );
      },
    );
  }
}
