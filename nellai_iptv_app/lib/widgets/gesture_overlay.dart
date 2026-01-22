import 'package:flutter/material.dart';

class GestureOverlay extends StatelessWidget {
  final Widget child;
  final VoidCallback onTap;
  final VoidCallback? onToggleMute;

  const GestureOverlay({
    super.key,
    required this.child,
    required this.onTap,
    this.onToggleMute,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      onDoubleTap: onToggleMute,
      behavior: HitTestBehavior.translucent,
      child: child,
    );
  }
}
