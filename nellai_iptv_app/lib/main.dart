import 'package:flutter/material.dart';
import 'package:flutter/services.dart'; // For landscape lock
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:provider/provider.dart';
import 'package:wakelock_plus/wakelock_plus.dart'; // Import Wakelock
import 'providers/channel_provider.dart';
import 'providers/favorites_provider.dart';
import 'providers/settings_provider.dart';
import 'screens/classic/classic_screen.dart';
import 'screens/splash_screen.dart'; // Import Splash
import 'core/security_service.dart'; // Import SecurityService

import 'package:flutter_cache_manager/flutter_cache_manager.dart'; // Import CacheManager
import 'core/toast_service.dart'; // Import ToastService

import 'core/device_utils.dart'; // Import DeviceUtils

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Replace Flutter's default red-background / yellow-text ErrorWidget (the
  // "red screen of death") with a branded, dark placeholder. This shows up
  // wherever a widget throws during build — most notably the stream player
  // subtree when a channel URL is bad — instead of the raw framework error.
  ErrorWidget.builder = (FlutterErrorDetails details) => const _AppErrorFallback();

  await DeviceUtils.init(); // Initialize Device Detection

  
  // Clear channel thumbnail cache on startup (Session-based caching).
  // Fire-and-forget — do NOT await. On slow TV hardware / emulators, awaiting
  // a full disk scan before runApp() delays the first frame past the TV
  // launcher's activity-resume timeout, sending the app to the background.
  DefaultCacheManager().emptyCache();
  
  await dotenv.load(fileName: ".env");
  
  // Apply security settings (screenshot blocking)
  await SecurityService().setScreenshotBlocking(
    dotenv.env['BLOCK_SCREENSHOTS']?.toLowerCase() == 'true'
  );
  
  // Enable Wakelock globally
  WakelockPlus.enable();

  // Enforce Landscape
  // Permissions for orientation will be handled per screen
  // SystemChrome.setPreferredOrientations([
  //   DeviceOrientation.landscapeLeft,
  //   DeviceOrientation.landscapeRight,
  // ]);
  // Hide system/nav bar
  SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => SettingsProvider()),
        ChangeNotifierProvider(create: (_) => ChannelProvider()),
        ChangeNotifierProvider(create: (_) => FavoritesProvider()),
      ],
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WakelockPlus.enable(); // Enable initially
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      WakelockPlus.enable(); // Re-enable on resume
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      scaffoldMessengerKey: ToastService().snackbarKey,
      debugShowCheckedModeBanner: false,
      title: dotenv.env['APP_TITLE'] ?? 'Nellai IPTV',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.cyan),
        useMaterial3: true,
        fontFamily: 'Roboto', // Or whatever font you use
      ),
      home: const SplashScreen(),
    );
  }
}

/// Branded fallback rendered in place of Flutter's default red/yellow
/// ErrorWidget whenever a widget throws during build. Kept intentionally
/// small and self-contained (no Scaffold) so it looks correct whether it
/// replaces the whole screen or just a sub-region such as the video surface.
class _AppErrorFallback extends StatelessWidget {
  const _AppErrorFallback();

  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(0xFF0F172A),
      alignment: Alignment.center,
      padding: const EdgeInsets.all(16),
      child: const Column(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline_rounded, color: Color(0xFF06B6D4), size: 44),
          SizedBox(height: 12),
          Text(
            "Something went wrong",
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          SizedBox(height: 6),
          Text(
            "Please try again in a moment.",
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.white60, fontSize: 13),
          ),
        ],
      ),
    );
  }
}
