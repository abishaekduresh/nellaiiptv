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
import 'classic/classic_screen.dart'; // Import ClassicScreen
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
    // Ensure landscape is enforced if needed (though main.dart does it globally)
    if (!kIsWeb) {
      SystemChrome.setPreferredOrientations([
        DeviceOrientation.landscapeLeft, 
        DeviceOrientation.landscapeRight
      ]);
      SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
      SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
    }
    _checkForUpdate();
    _initPackageInfo();
    // _fetchLogo(); // Accessing settings is okay but we can default to asset/env for splash
  }

  String _version = "";

  Future<void> _initPackageInfo() async {
    final info = await PackageInfo.fromPlatform();
    setState(() {
      _version = "${info.version} (${info.buildNumber})";
    });
  }

  Future<void> _checkForUpdate() async {
    // Wait for a minimum splash duration regardless of update check speed
    final minSplashTime = Future.delayed(const Duration(seconds: 3));
    bool shouldNavigate = true;

    try {
      if (!kIsWeb && kReleaseMode) { // In-App Update is Android only & Release only
        final info = await InAppUpdate.checkForUpdate();
        if (info.updateAvailability == UpdateAvailability.updateAvailable &&
            info.immediateUpdateAllowed) {
            
            final result = await InAppUpdate.performImmediateUpdate();
            if (result == AppUpdateResult.userDeniedUpdate) {
              shouldNavigate = false;
              SystemNavigator.pop();
            } else if (result == AppUpdateResult.inAppUpdateFailed) {
              // Decide policy: Allow access on failure or retry?
              // Currently allowing access to avoid blocking on network errors during update
              debugPrint("Update failed, proceeding to app");
            }
        }
      }
    } catch (e) {
      debugPrint("InAppUpdate Error: $e");
    } finally {
      if (shouldNavigate) {
        // Check Backend Health
        bool isHealthy = await ApiService().checkHealth();
        
        // Ensure we waited at least 3 seconds (Splash minimum duration)
        await minSplashTime;

        if (isHealthy) {
          _navigateToClassic();
        } else {
             if (mounted) {
               Navigator.of(context).pushReplacement(
                 MaterialPageRoute(builder: (_) => CommonErrorScreen(
                   title: "Service Unavailable", 
                   message: "Could not connect to the server. Please check your internet connection or try again later.",
                   isNetworkError: true,
                   onRetry: () {
                     // Restart Splash to retry everything
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

  void _navigateToClassic() {
    if (mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const ClassicScreen()),
      );
    }
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
                          width: 350, // Keep size, but scrolling handles overflow if needed
                          // Restrict height effectively 
                          height: MediaQuery.of(context).size.height * 0.5,
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
