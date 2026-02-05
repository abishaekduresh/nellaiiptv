import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:package_info_plus/package_info_plus.dart';
import '../core/api_service.dart';
import 'package:flutter_animate/flutter_animate.dart'; // Animation support
import 'package:in_app_update/in_app_update.dart'; // Import InAppUpdate
import 'package:shared_preferences/shared_preferences.dart'; // Import SharedPreferences
import 'classic/classic_screen.dart'; // Import ClassicScreen
import 'auth/login_screen.dart' as import_auth; // Import LoginScreen with alias
import 'common_error_screen.dart'; // Import CommonErrorScreen

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {

  @override
  void initState() {
    super.initState();
    // Enforce Portrait for Splash on Mobile, but allow Landscape for TV/Web
    if (!kIsWeb && _isMobile()) {
      SystemChrome.setPreferredOrientations([
        DeviceOrientation.portraitUp, 
      ]);
    }
    _checkForUpdate();
    _initPackageInfo();
  }
  
  bool _isMobile() {
    if (defaultTargetPlatform == TargetPlatform.android || defaultTargetPlatform == TargetPlatform.iOS) {
      // Simple check, can be refined for tablets
      return true;
    }
    return false;
  }

  String _version = "";

  Future<void> _initPackageInfo() async {
    final info = await PackageInfo.fromPlatform();
    setState(() {
      _version = "${info.version} (${info.buildNumber})";
    });
  }

  Future<void> _checkForUpdate() async {
    debugPrint("Splash: _checkForUpdate started");
    final minSplashTime = Future.delayed(const Duration(seconds: 3));
    bool shouldNavigate = true;

    try {
      if (!kIsWeb && kReleaseMode && defaultTargetPlatform == TargetPlatform.android) { 
        debugPrint("Splash: Checking for InAppUpdate");
        final info = await InAppUpdate.checkForUpdate();
        if (info.updateAvailability == UpdateAvailability.updateAvailable &&
            info.immediateUpdateAllowed) {
            
            final result = await InAppUpdate.performImmediateUpdate();
            if (result == AppUpdateResult.userDeniedUpdate) {
              shouldNavigate = false;
              SystemNavigator.pop();
            } else if (result == AppUpdateResult.inAppUpdateFailed) {
              debugPrint("Update failed, proceeding to app");
            }
        }
      }
    } catch (e) {
      debugPrint("InAppUpdate Error: $e");
    } finally {
      if (shouldNavigate) {
        debugPrint("Splash: Checking Backend Health...");
        // Check Backend Health
        bool isHealthy = await ApiService().checkHealth();
        debugPrint("Splash: Health Check Result: $isHealthy");
        
        await minSplashTime;
        debugPrint("Splash: Minimum wait over.");

        if (isHealthy) {
          debugPrint("Splash: Navigating to Auth Check");
          _checkAuthAndNavigate();
        } else {
             debugPrint("Splash: Navigating to Error Screen");
             if (mounted) {
               Navigator.of(context).pushReplacement(
                 MaterialPageRoute(builder: (_) => CommonErrorScreen(
                   title: "Service Unavailable", 
                   message: "Could not connect to the server. Please check your internet connection or try again later.",
                   isNetworkError: true,
                   onRetry: () {
                     Navigator.of(context).pushReplacement(
                        MaterialPageRoute(builder: (_) => const SplashScreen())
                     );
                   }
                 )),
               );
             }
        }
      }
    }
  }

  Future<void> _checkAuthAndNavigate() async {
    debugPrint("Splash: Checking Shared Preferences for token");
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');
    debugPrint("Splash: Token found: ${token != null}");

    if (mounted) {
      if (token != null && token.isNotEmpty) {
        debugPrint("Splash: Going to ClassicScreen");
        _navigateToClassic();
      } else {
        debugPrint("Splash: Going to LoginScreen");
        _navigateToLogin();
      }
    }
  }

  void _navigateToClassic() {
    // Enforce Landscape for Classic Screen
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const ClassicScreen()),
    );
  }

  void _navigateToLogin() {
    // Enforce Portrait for Login
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
    ]);
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const import_auth.LoginScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      body: SafeArea(
        child: SizedBox(
          width: double.infinity,
          child: SingleChildScrollView(
            child: SizedBox(
              height: MediaQuery.of(context).size.height - MediaQuery.of(context).padding.top - MediaQuery.of(context).padding.bottom, 
              child: Column(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Spacer(),
                  Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // Try env logo or asset default
                        Image.asset(
                          'assets/img/logo.png', 
                          width: 200, // Reduced from 350
                          // Restrict height effectively 
                          height: MediaQuery.of(context).size.height * 0.3, // Reduced from 0.5
                          fit: BoxFit.contain,
                          errorBuilder: (c, e, s) => Column(
                            children: [
                               const Icon(Icons.tv, size: 150, color: Color(0xFF06B6D4)), 
                               const SizedBox(height: 10),
                               Text(
                                 dotenv.env['APP_TITLE'] ?? "Nellai IPTV",
                                 style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold)
                               )
                            ],
                          ),
                        )
                        .animate()
                        .fadeIn(duration: 800.ms)
                        .scale(duration: 600.ms, curve: Curves.easeOutBack)
                        .shimmer(delay: 1000.ms, duration: 1500.ms, color: Colors.white24),
                      ],
                    ),
                  ),
                  const Spacer(),
                  Column(
                    children: [
                      GestureDetector(
                        onTap: _launchUrl,
                        child: Padding(
                          padding: const EdgeInsets.all(8.0),
                          child: Text(
                            dotenv.env['POWERED_BY_TEXT'] ?? "Powered by Nellai IPTV",
                            style: const TextStyle(
                              color: Colors.white54,
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                              decoration: TextDecoration.underline,
                              decorationColor: Colors.white24,
                            ),
                          ),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.only(bottom: 24.0),
                        child: Text(
                          _version.isNotEmpty ? "Version: ${dotenv.env['APP_VERSION'] ?? _version}" : "Loading...",
                          style: const TextStyle(
                            color: Colors.white24,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ],
                  )
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _launchUrl() async {
    final String urlString = dotenv.env['POWERED_BY_URL'] ?? 'https://www.nellaiiptv.com';
    final Uri url = Uri.parse(urlString);
    if (!await launchUrl(url)) {
      debugPrint("Could not launch $url");
    }
  }
}
