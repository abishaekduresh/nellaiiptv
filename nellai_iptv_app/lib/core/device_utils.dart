import 'dart:io';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/foundation.dart';

class DeviceUtils {
  static bool _isTV = false;
  static bool _isHighPerformance = true; // Default to true
  static bool _initialized = false;

  /// Initialize device info check. Should be called at app startup.
  static Future<void> init() async {
    if (_initialized) return;

    if (kIsWeb) {
      _isTV = false; // Assume web is not TV for now, or add specific web-TV checks
      _isHighPerformance = true; // Assume web (desktop) is high perf usually
    } else if (Platform.isAndroid) {
      final deviceInfo = DeviceInfoPlugin();
      final androidInfo = await deviceInfo.androidInfo;
      
      // Check for leanback feature which is standard for Android TV
      _isTV = androidInfo.systemFeatures.contains('android.software.leanback');
      
      // RAM Check (Total Memory in Bytes)
      // 2GB = 2 * 1024 * 1024 * 1024 = 2,147,483,648 bytes
      // We set threshold slightly lower (e.g. 1.8GB) because OS reserves some.
      const int lowRamThreshold = 1800 * 1024 * 1024; 
      
      // Try to get totalMemory if available in this version of device_info_plus
      try {
        // Access via data map to avoid compile-time errors if property is missing in this version
        final dynamic totalRamValue = androidInfo.data['totalMemory'];
        if (totalRamValue != null && totalRamValue is int) {
          _isHighPerformance = totalRamValue > lowRamThreshold;
        } else {
          _isHighPerformance = true; // Fallback
        }
      } catch (e) {
        debugPrint("⚠️ DeviceUtils: Could not get totalMemory: $e");
        _isHighPerformance = true; // Fallback to true
      }
      
      debugPrint("📱 Device Info: Model=${androidInfo.model}, TV=$_isTV, HighPerf=$_isHighPerformance");

    } else {
      // Add iOS/other platform TV checks if needed
      _isTV = false;
      _isHighPerformance = true; // Assume iOS is high perf
    }
    
    _initialized = true;
  }

  /// Returns true if the current device is detected as a TV
  static bool get isTV => _isTV;

  /// Returns true if device has > ~2GB RAM
  static bool get isHighPerformance => _isHighPerformance;
}
