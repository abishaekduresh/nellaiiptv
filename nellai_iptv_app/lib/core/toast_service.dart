import 'package:flutter/material.dart';

enum ToastType { info, warning, error, success }

class ToastService {
  static final ToastService _instance = ToastService._internal();
  factory ToastService() => _instance;
  ToastService._internal();

  void show(String message, {ToastType type = ToastType.info}) {
    // Basic SnackBar implementation for now
    // In a real app, this might use a global key or overlay
    debugPrint("[TOAST]: $message"); 
  }
}
