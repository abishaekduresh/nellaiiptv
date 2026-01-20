import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'screens/splash_screen.dart';

Future<void> main() async {
  runZonedGuarded(() async {
    WidgetsFlutterBinding.ensureInitialized();
    await dotenv.load(fileName: ".env");
    runApp(const MyApp());
  }, (error, stack) {
    print("CRASH CAUGHT: $error");
    print(stack);
  });
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: dotenv.env['APP_TITLE'] ?? 'Nellai IPTV',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF06B6D4), // Cyan Primary
          primary: const Color(0xFF06B6D4),
          secondary: const Color(0xFFFCD34D), // Yellow Secondary
          surface: const Color(0xFF1E293B), // Card
          background: const Color(0xFF0F172A), // Dark Navy
        ),
        scaffoldBackgroundColor: const Color(0xFF0F172A),
        useMaterial3: true,
      ),
      home: const SplashScreen(),
    );
  }
}
