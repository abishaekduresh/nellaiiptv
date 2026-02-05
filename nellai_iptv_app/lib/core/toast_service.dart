import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

enum ToastType { info, warning, error, success }

class ToastService {
  static final ToastService _instance = ToastService._internal();
  factory ToastService() => _instance;
  ToastService._internal();

  final GlobalKey<ScaffoldMessengerState> snackbarKey = GlobalKey<ScaffoldMessengerState>();

  void showSuccess(String message) {
    show(message, type: ToastType.success);
  }

  void showError(String message) {
    show(message, type: ToastType.error);
  }

  void show(String message, {ToastType type = ToastType.info}) {
    debugPrint("[TOAST]: $message"); 
    
    Color bgColor = Colors.black87;
    IconData icon = Icons.info_outline;
    Color iconColor = Colors.white;
    
    switch (type) {
      case ToastType.success:
        bgColor = Colors.green[800]!;
        icon = Icons.check_circle_outline;
        iconColor = Colors.greenAccent;
        break;
      case ToastType.error:
        bgColor = Colors.red[900]!;
        icon = Icons.error_outline;
        iconColor = Colors.redAccent;
        break;
      case ToastType.warning:
        bgColor = Colors.amber[900]!;
        icon = Icons.warning_amber_rounded;
        iconColor = Colors.amberAccent;
        break;
      case ToastType.info:
      default:
        bgColor = Colors.grey[900]!;
        icon = Icons.info_outline;
        iconColor = Colors.lightBlueAccent;
        break;
    }

    snackbarKey.currentState?.clearSnackBars(); // Clear previous to prevent stacking delay
    
    snackbarKey.currentState?.showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(icon, color: iconColor, size: 24)
              .animate()
              .scale(duration: 400.ms, curve: Curves.elasticOut)
              .then(delay: 200.ms)
              .shake(hz: 4, curve: Curves.easeInOutCubic), // Fun shake effect
            
            const SizedBox(width: 12),
            
            Expanded(
              child: Text(message, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w500))
                .animate()
                .fade(duration: 300.ms)
                .slideX(begin: 0.2, end: 0),
            ),
          ],
        ),
        backgroundColor: bgColor,
        behavior: SnackBarBehavior.floating, 
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        elevation: 8,
        duration: const Duration(milliseconds: 2500),
      ),
    );
  }
}
