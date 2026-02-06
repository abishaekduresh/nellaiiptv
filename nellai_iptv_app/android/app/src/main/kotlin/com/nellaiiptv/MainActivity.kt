package com.nellaiiptv

import android.os.Bundle
import android.provider.Settings
import androidx.activity.enableEdgeToEdge
import io.flutter.embedding.android.FlutterFragmentActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import android.view.WindowManager

class MainActivity : FlutterFragmentActivity() {
    private val CHANNEL = "com.nellaiiptv/security"
    private var shouldBlockScreenshots = true // Default to true for security

    override fun onCreate(savedInstanceState: Bundle?) {
        // Enable edge-to-edge display for Android 15 compatibility
        // Requires FlutterFragmentActivity to provide ComponentActivity context
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
    }

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        
        // Setup MethodChannel for security controls
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {
                "isUsbDebuggingEnabled" -> {
                    result.success(isUsbDebuggingEnabled())
                }
                "setScreenshotBlocking" -> {
                    val shouldBlock = call.argument<Boolean>("shouldBlock") ?: true
                    shouldBlockScreenshots = shouldBlock
                    applyScreenshotBlocking()
                    result.success(null)
                }
                else -> {
                    result.notImplemented()
                }
            }
        }
    }

    private fun isUsbDebuggingEnabled(): Boolean {
        return try {
            Settings.Secure.getInt(
                contentResolver,
                Settings.Secure.ADB_ENABLED,
                0
            ) == 1
        } catch (e: Exception) {
            false
        }
    }

    private fun applyScreenshotBlocking() {
        if (shouldBlockScreenshots) {
            window.setFlags(
                WindowManager.LayoutParams.FLAG_SECURE,
                WindowManager.LayoutParams.FLAG_SECURE
            )
        } else {
            window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
        }
    }
}
