import 'dart:io';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/foundation.dart';

class DeviceUtils {
  static bool _isTV = false;
  static bool _initialized = false;

  /// Initialize device info check. Should be called at app startup.
  static Future<void> init() async {
    if (_initialized) return;

    if (kIsWeb) {
      _isTV = false; // Assume web is not TV for now, or add specific web-TV checks
    } else if (Platform.isAndroid) {
      final deviceInfo = DeviceInfoPlugin();
      final androidInfo = await deviceInfo.androidInfo;
      
      // Check for leanback feature which is standard for Android TV
      _isTV = androidInfo.systemFeatures.contains('android.software.leanback');
    } else {
      // Add iOS/other platform TV checks if needed
      _isTV = false;
    }
    
    _initialized = true;
    debugPrint("📺 DeviceUtils: Is TV? $_isTV");
  }

  /// Returns true if the current device is detected as a TV
  static bool get isTV => _isTV;
}
