import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

enum ToastType { info, warning, error, success }

class ToastService {
  static final ToastService _instance = ToastService._internal();
  factory ToastService() => _instance;
  ToastService._internal();

  final GlobalKey<ScaffoldMessengerState> snackbarKey = GlobalKey<ScaffoldMessengerState>();

  void showSuccess(String message, {BuildContext? context}) {
    show(message, type: ToastType.success, context: context);
  }

  void showError(String message, {BuildContext? context}) {
    show(message, type: ToastType.error, context: context);
  }

  void show(String message, {ToastType type = ToastType.info, BuildContext? context}) {
    debugPrint("[TOAST]: $message"); 
    
    // If context is provided, show overlay toast (on top of modals)
    if (context != null) {
      _showOverlayToast(context, message, type);
      return;
    }

    // Default SnackBar logic
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

    snackbarKey.currentState?.clearSnackBars(); 
    
    snackbarKey.currentState?.showSnackBar(
      SnackBar(
        content: _buildToastContent(icon, iconColor, message),
        backgroundColor: bgColor,
        behavior: SnackBarBehavior.floating, 
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        elevation: 8,
        duration: const Duration(milliseconds: 2500),
      ),
    );
  }

  void _showOverlayToast(BuildContext context, String message, ToastType type) {
    OverlayState? overlay = Overlay.of(context);
    if (overlay == null) return;

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

    late OverlayEntry overlayEntry;
    
    overlayEntry = OverlayEntry(
      builder: (context) => Positioned(
        top: 60, // Top of screen
        left: 0,
        right: 0,
        child: Material(
          color: Colors.transparent,
          child: Center(
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 24),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: bgColor,
                borderRadius: BorderRadius.circular(12),
                boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 8, offset: Offset(0, 4))],
              ),
              child: _buildToastContent(icon, iconColor, message),
            ).animate()
             .fade(duration: 300.ms)
             .slideY(begin: -1, end: 0, curve: Curves.easeOutBack),
          ),
        ),
      ),
    );

    overlay.insert(overlayEntry);

    // Auto remove after 2.5 seconds
    Future.delayed(const Duration(milliseconds: 2500), () {
      overlayEntry.remove();
    });
  }

  Widget _buildToastContent(IconData icon, Color iconColor, String message) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, color: iconColor, size: 24)
          .animate()
          .scale(duration: 400.ms, curve: Curves.elasticOut)
          .then(delay: 200.ms)
          .shake(hz: 4, curve: Curves.easeInOutCubic),
        
        const SizedBox(width: 12),
        
        Flexible(
          child: Text(message, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w500))
            .animate()
            .fade(duration: 300.ms)
            .slideX(begin: 0.2, end: 0),
        ),
      ],
    );
  }
}
