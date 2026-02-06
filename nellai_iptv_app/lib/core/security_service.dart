import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class SecurityService {
  static const platform = MethodChannel('com.nellaiiptv/security');
  
  /// Check if USB debugging is enabled on the device
  Future<bool> isUsbDebuggingEnabled() async {
    try {
      final bool result = await platform.invokeMethod('isUsbDebuggingEnabled');
      return result;
    } on PlatformException catch (e) {
      debugPrint("Failed to check USB debugging: ${e.message}");
      return false;
    }
  }

  /// Set screenshot blocking based on environment variable
  Future<void> setScreenshotBlocking(bool shouldBlock) async {
    try {
      await platform.invokeMethod('setScreenshotBlocking', {
        'shouldBlock': shouldBlock,
      });
    } on PlatformException catch (e) {
      debugPrint("Failed to set screenshot blocking: ${e.message}");
    }
  }

  /// Main security check - call this on app startup
  Future<void> checkSecurityAndBlock(BuildContext? context) async {
    // Check screenshot blocking setting
    final blockScreenshots = dotenv.env['BLOCK_SCREENSHOTS']?.toLowerCase() == 'true';
    await setScreenshotBlocking(blockScreenshots);

    // Check USB debugging setting
    final blockUsbDebug = dotenv.env['BLOCK_USB_DEBUG']?.toLowerCase() == 'true';
    
    if (blockUsbDebug) {
      final isDebugging = await isUsbDebuggingEnabled();
      
      if (isDebugging && context != null) {
        _showBlockingDialog(context);
      }
    }
  }

  /// Show blocking dialog and exit app
  void _showBlockingDialog(BuildContext context) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Row(
            children: [
              Icon(Icons.warning, color: Colors.red, size: 32),
              SizedBox(width: 12),
              Text('Security Alert'),
            ],
          ),
          content: const Text(
            'USB Debugging Detected.\n\n'
            'This app cannot run with USB debugging enabled for security reasons. '
            'Please disable USB debugging in Developer Options and restart the app.',
            style: TextStyle(fontSize: 16),
          ),
          actions: [
            TextButton(
              onPressed: () {
                SystemNavigator.pop(); // Exit app
              },
              child: const Text('Exit', style: TextStyle(color: Colors.red)),
            ),
          ],
        );
      },
    );
  }
}
