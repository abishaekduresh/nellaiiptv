import 'package:flutter/material.dart';
import 'package:flutter/services.dart'; // For landscape lock
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:provider/provider.dart';
import 'package:wakelock_plus/wakelock_plus.dart'; // Import Wakelock
import 'providers/channel_provider.dart';
import 'providers/favorites_provider.dart';
import 'screens/classic/classic_screen.dart';
import 'screens/splash_screen.dart'; // Import Splash

import 'package:media_kit/media_kit.dart'; // Import MediaKit
import 'package:flutter_cache_manager/flutter_cache_manager.dart'; // Import CacheManager
import 'core/toast_service.dart'; // Import ToastService

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  MediaKit.ensureInitialized(); // Initialize MediaKit
  
  // Clear channel thumbnail cache on startup (Session-based caching)
  await DefaultCacheManager().emptyCache();
  
  await dotenv.load(fileName: ".env");
  
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
