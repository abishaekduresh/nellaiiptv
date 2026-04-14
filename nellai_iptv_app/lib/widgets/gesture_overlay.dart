import 'package:flutter/material.dart';

class GestureOverlay extends StatelessWidget {
  final Widget child;
  final VoidCallback onTap;
  final VoidCallback? onDoubleTap;
 
   const GestureOverlay({
     super.key,
     required this.child,
     required this.onTap,
     this.onDoubleTap,
   });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
       onDoubleTap: onDoubleTap,
       behavior: HitTestBehavior.translucent,
      child: child,
    );
  }
}
