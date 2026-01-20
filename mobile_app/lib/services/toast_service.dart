import 'package:flutter/material.dart';

enum ToastType { info, success, error, warning }

class ToastService {
  static final ToastService _instance = ToastService._internal();
  factory ToastService() => _instance;
  ToastService._internal();

  // Global key to access ScaffoldMessenger without context
  final GlobalKey<ScaffoldMessengerState> scaffoldMessengerKey = GlobalKey<ScaffoldMessengerState>();

  DateTime? _lastToastTime;
  String? _lastMessage;

  void show(String message, {ToastType type = ToastType.info}) {
    // Debounce/Throttle duplicates
    final now = DateTime.now();
    if (_lastMessage == message && _lastToastTime != null) {
      if (now.difference(_lastToastTime!) < const Duration(seconds: 2)) {
        return; // Skip duplicate
      }
    }

    _lastMessage = message;
    _lastToastTime = now;

    final color = _getColorForType(type);
    final icon = _getIconForType(type);

    scaffoldMessengerKey.currentState?.hideCurrentSnackBar();
    scaffoldMessengerKey.currentState?.showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(icon, color: Colors.white, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                message,
                style: const TextStyle(color: Colors.white, fontSize: 14),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        backgroundColor: color,
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.only(bottom: 40, left: 20, right: 20), // Bottom Center
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        duration: const Duration(seconds: 3),
      ),
    );
  }

  Color _getColorForType(ToastType type) {
    switch (type) {
      case ToastType.success: return Colors.green.shade700;
      case ToastType.error: return Colors.redAccent;
      case ToastType.warning: return Colors.amber.shade800;
      case ToastType.info:
      default: return const Color(0xFF1E293B); // Dark Blue/Grey
    }
  }

  IconData _getIconForType(ToastType type) {
    switch (type) {
      case ToastType.success: return Icons.check_circle_outline;
      case ToastType.error: return Icons.error_outline;
      case ToastType.warning: return Icons.warning_amber_rounded;
      case ToastType.info:
      default: return Icons.info_outline;
    }
  }
}
