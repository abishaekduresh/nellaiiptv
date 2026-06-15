import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter/services.dart';
import 'package:safe_device/safe_device.dart';

class SecurityManager {
  static final SecurityManager _instance = SecurityManager._internal();
  factory SecurityManager() => _instance;
  SecurityManager._internal();

  /// Initialize security checks based on .env configuration.
  /// All checks are skipped in debug builds so `flutter run` works normally.
  Future<void> init() async {
    if (kDebugMode) return;
    await _handleScreenshotBlocking();
    await _handleDebugDetection();
  }

  // Method Channel for Native Calls
  static const platform = MethodChannel('flutter.native/helper');

  /// Handles FLAG_SECURE to prevent screenshots/screen recording
  Future<void> _handleScreenshotBlocking() async {
    final bool enableScreenshotBlock = (dotenv.env['ENABLE_SCREENSHOT_BLOCK'] ?? 'false').toLowerCase() == 'true';
    
    if (Platform.isAndroid) {
      try {
        await platform.invokeMethod('setSecure', {'secure': enableScreenshotBlock});
        debugPrint('SecurityManager: Screenshot blocking set to $enableScreenshotBlock');
      } catch (e) {
        debugPrint('SecurityManager: Failed to set screenshot blocking: $e');
      }
    } else {
      debugPrint('SecurityManager: Screenshot blocking not supported on this platform natively via this method.');
    }
  }

  /// Checks for Root/Jailbreak and Emulator; exits the app if any check fails.
  Future<void> _handleDebugDetection() async {
    final bool enableDebugBlock = (dotenv.env['ENABLE_DEBUG_BLOCK'] ?? 'false').toLowerCase() == 'true';
    if (!enableDebugBlock) return;

    bool isJailBroken = false;
    bool isRealDevice = true;
    bool isDevMode = false;

    try {
      isJailBroken = await SafeDevice.isJailBroken;
      isRealDevice = await SafeDevice.isRealDevice;
      isDevMode = await SafeDevice.isDevelopmentModeEnable;
    } catch (e) {
      debugPrint('SecurityManager: SafeDevice check failed: $e');
    }

    if (isJailBroken) {
      debugPrint('SecurityManager: Rooted/Jailbroken device detected — exiting.');
      exit(0);
    }

    if (!isRealDevice) {
      debugPrint('SecurityManager: Emulator detected — exiting.');
      exit(0);
    }

    if (isDevMode) {
      debugPrint('SecurityManager: Developer Mode enabled — exiting.');
      exit(0);
    }
  }

  /// Public method to check if execution should proceed
  /// Returns TRUE if safe, FALSE if compromised (and debug blocking is enabled)
  Future<bool> isSafeToRun() async {
    if (kDebugMode) return true;
    final bool enableDebugBlock = (dotenv.env['ENABLE_DEBUG_BLOCK'] ?? 'false').toLowerCase() == 'true';
    if (!enableDebugBlock) return true;

    final bool isJailBroken = await SafeDevice.isJailBroken;
    final bool isRealDevice = await SafeDevice.isRealDevice;
    final bool isDevMode = await SafeDevice.isDevelopmentModeEnable;

    if (isJailBroken || !isRealDevice || isDevMode) return false;
    return true;
  }
}
