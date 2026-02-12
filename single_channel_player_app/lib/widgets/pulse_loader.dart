import 'package:flutter/material.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';

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
    return SpinKitThreeBounce(
      color: color,
      size: size,
    );
  }
}
