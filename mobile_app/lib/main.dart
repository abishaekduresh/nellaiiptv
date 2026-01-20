import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'screens/splash_screen.dart';
import 'widgets/connectivity_wrapper.dart';
import 'services/toast_service.dart';

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
      scaffoldMessengerKey: ToastService().scaffoldMessengerKey,
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
      builder: (context, child) {
        return ConnectivityWrapper(child: child!);
      },
      home: const SplashScreen(),
    );
  }
}
