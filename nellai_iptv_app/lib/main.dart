import 'package:flutter/material.dart';
import 'package:flutter/services.dart'; // For landscape lock
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:provider/provider.dart';
import 'providers/channel_provider.dart';
import 'providers/favorites_provider.dart';
import 'screens/classic/classic_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load(fileName: ".env");
  
  // Enforce Landscape
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.landscapeLeft,
    DeviceOrientation.landscapeRight,
  ]);

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ChannelProvider()),
        ChangeNotifierProvider(create: (_) => FavoritesProvider()),
      ],
      child: const NellaiApp(),
    ),
  );
}

class NellaiApp extends StatelessWidget {
  const NellaiApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Nellai IPTV',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF6366f1), // Modern Indigo/Purple
          brightness: Brightness.dark,
        ),
        useMaterial3: true,
        scaffoldBackgroundColor: Colors.black,
      ),
      home: const ClassicScreen(),
      debugShowCheckedModeBanner: false,
    );
  }
}
