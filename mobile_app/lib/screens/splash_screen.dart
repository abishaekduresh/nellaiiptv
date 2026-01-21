import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:package_info_plus/package_info_plus.dart';
import '../services/api_service.dart';

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
    _initPackageInfo();
    _fetchLogo();
  }

  String _version = "";
  String? _logoUrl;

  Future<void> _fetchLogo() async {
    try {
      final uuid = dotenv.env['CHANNEL_UUID'];
      if (uuid != null) {
        final channel = await ApiService().getChannelDetails(uuid);
        if (mounted) {
          setState(() {
             // Logic: Use logoUrl if valid (isNotEmpty), else thumbnail, else null (Asset fallback)
             String? validLogo = (channel.logoUrl != null && channel.logoUrl!.isNotEmpty) 
                 ? channel.logoUrl 
                 : (channel.thumbnailUrl != null && channel.thumbnailUrl!.isNotEmpty) 
                     ? channel.thumbnailUrl 
                     : null;
                     
             _logoUrl = validLogo;
          });
        }
      }
    } catch (_) {
       // Silent fail -> shows Asset Logo
    }
  }

  Future<void> _initPackageInfo() async {
    final info = await PackageInfo.fromPlatform();
    setState(() {
      _version = "${info.version} (${info.buildNumber})";
    });
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
                _version.isNotEmpty ? "Version: ${dotenv.env['APP_VERSION'] ?? ""}" : "Loading...",
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
