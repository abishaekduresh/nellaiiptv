import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

import 'video_player_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {

  @override
  void initState() {
    super.initState();
    if (!kIsWeb) {
      SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
    }
    _startTimer();
  }

  Future<void> _startTimer() async {
    await Future.delayed(const Duration(seconds: 3));
    if (mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const VideoPlayerScreen()),
      );
    }
  }
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Image.asset(
                      'assets/logo.png',
                      width: 200,
                      errorBuilder: (c, e, s) => const Icon(Icons.tv, size: 100, color: Color(0xFF06B6D4)),
                    ),
                  ],
                ),
              ),
            ),
            GestureDetector(
              onTap: _launchUrl,
              child: Padding(
                padding: const EdgeInsets.only(top: 16.0, left: 16.0, right: 16.0, bottom: 8.0),
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
                "Version: ${dotenv.env['APP_VERSION'] ?? '1.0.0'}",
                style: const TextStyle(
                  color: Colors.white24,
                  fontSize: 12,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _launchUrl() async {
    final String urlString = dotenv.env['POWERED_BY_URL'] ?? 'https://www.nellaiiptv.com';
    final Uri url = Uri.parse(urlString);
    if (!await launchUrl(url)) {
      print("Could not launch $url");
    }
  }
}
