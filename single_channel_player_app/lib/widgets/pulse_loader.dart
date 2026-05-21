import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

class PulseLoader extends StatelessWidget {
  final Color color;
  final double size;

  const PulseLoader({
    super.key,
    this.color = const Color(0xFF06B6D4),
    this.size = 50.0,
  });

  @override
  Widget build(BuildContext context) {
    final double dotSize = size * 0.22;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(3, (i) {
        return Container(
          margin: EdgeInsets.symmetric(horizontal: dotSize * 0.35),
          width: dotSize,
          height: dotSize,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        )
            .animate(onPlay: (c) => c.repeat())
            .moveY(
              begin: 0,
              end: -(size * 0.35),
              delay: Duration(milliseconds: i * 160),
              duration: 380.ms,
              curve: Curves.easeInOut,
            )
            .then()
            .moveY(
              begin: -(size * 0.35),
              end: 0,
              duration: 380.ms,
              curve: Curves.easeInOut,
            );
      }),
    );
  }
}
