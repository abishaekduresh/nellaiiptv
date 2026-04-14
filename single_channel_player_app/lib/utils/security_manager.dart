import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter/services.dart'; // For MethodChannel
import 'package:safe_device/safe_device.dart';

class SecurityManager {
  static final SecurityManager _instance = SecurityManager._internal();
  factory SecurityManager() => _instance;
  SecurityManager._internal();

  /// Initialize security checks based on .env configuration
  Future<void> init() async {
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

  /// Checks for Root/Jailbreak and Debugger
  Future<void> _handleDebugDetection() async {
    final bool enableDebugBlock = (dotenv.env['ENABLE_DEBUG_BLOCK'] ?? 'false').toLowerCase() == 'true';

    if (enableDebugBlock) {
      bool isJailBroken = false;
      bool isRealDevice = true;

      try {
        isJailBroken = await SafeDevice.isJailBroken;
        isRealDevice = await SafeDevice.isRealDevice;
      } catch (e) {
        debugPrint('SecurityManager: SafeDevice check failed: $e');
      }

      if (isJailBroken) {
        debugPrint('SecurityManager: Device is Jailbroken/Rooted!');
        // In a real app, you might want to exit(0) or show a blocking dialog.
        // For now, we just log. The goal is to detect and potentially block.
        // exit(0); 
      }

      if (!isRealDevice) {
        debugPrint('SecurityManager: Running on Simulator/Emulator!');
        // exit(0);
      }
      
      // Additional Development Mode check (Android Developer Options)
      bool isDevMode = await SafeDevice.isDevelopmentModeEnable;
      if (isDevMode) {
         debugPrint('SecurityManager: Developer Mode is ENABLED!');
      }
    }
  }

  /// Public method to check if execution should proceed
  /// Returns TRUE if safe, FALSE if compromised (and debug blocking is enabled)
  Future<bool> isSafeToRun() async {
    final bool enableDebugBlock = (dotenv.env['ENABLE_DEBUG_BLOCK'] ?? 'false').toLowerCase() == 'true';
    if (!enableDebugBlock) return true;

    bool isJailBroken = await SafeDevice.isJailBroken;
    bool isRealDevice = await SafeDevice.isRealDevice;
    
    // You can add stricter checks here, e.g. !isRealDevice
    if (isJailBroken) return false;
    
    return true;
  }
}
