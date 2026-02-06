import 'package:flutter/material.dart';
import 'package:flutter/services.dart'; // For orientation
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/api_service.dart';
import '../../core/toast_service.dart';
import '../classic/classic_screen.dart';
import 'register_screen.dart';
import 'package:flutter_animate/flutter_animate.dart';

import 'dart:math'; // For random ad selection
import 'package:cached_network_image/cached_network_image.dart'; // For displaying ad
import 'package:url_launcher/url_launcher.dart'; // For ad click
import '../../models/ad.dart'; // Import Ad model
import 'manage_devices_screen.dart'; // Import ManageDevicesScreen

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  bool _isLoading = false;
  bool _obscurePassword = true;
  Ad? _bannerAd; // Ad state

  @override
  void initState() {
    super.initState();
    // Enforce Portrait for Login
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
    ]);
    _fetchAd(); // Fetch random ad
  }

  Future<void> _fetchAd() async {
    try {
      final ads = await ApiService().getAds();
      if (ads.isNotEmpty && mounted) {
        setState(() {
          _bannerAd = ads[Random().nextInt(ads.length)];
        });
      }
    } catch (e) {
      debugPrint("Error fetching ad: $e");
    }
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final response = await ApiService().login(
        _phoneController.text.trim(), 
        _passwordController.text
      );

      // Store Token
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('auth_token', response['token']);
      
      // Store User Info if needed
      // await prefs.setString('user_uuid', response['user']['uuid']);

      if (mounted) {
        ToastService().show("Login Successful", type: ToastType.success);
        _navigateToClassic();
      }

    } catch (e) {
      debugPrint("Login Error caught: $e");
      debugPrint("Error Type: ${e.runtimeType}");
      if (e is AuthException) {
         debugPrint("Is AuthException. Errors: ${e.errors}");
         if (e.errors != null) {
            debugPrint("Error Key: ${e.errors!['error']}");
         }
      }

      if (mounted) {
        if (e is AuthException && e.errors != null && e.errors!['error'] == 'device_limit_reached') {
           print("Device limit condition met!"); // Print to console
           final tempToken = e.errors!['temp_token'];
           if (tempToken != null) {
             print("Navigating to ManageDevicesScreen with token: $tempToken");
             ToastService().show("Device limit reached. Managing devices...", type: ToastType.warning);
             Navigator.of(context).push(
               MaterialPageRoute(builder: (_) => ManageDevicesScreen(tempToken: tempToken))
             );
             return;
           }
        }
        ToastService().show(e.toString(), type: ToastType.error);
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _handleSkip() {
     _navigateToClassic();
  }

  void _navigateToClassic() {
    // Set landscape orientation before navigating
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);
    
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const ClassicScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            return SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24.0),
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  minHeight: constraints.maxHeight,
                ),
                child: IntrinsicHeight(
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const SizedBox(height: 40),
                        // Logo
                        Center(
                          child: Image.asset(
                            'assets/img/logo.png',
                            height: 120,
                            errorBuilder: (c, e, s) => const Icon(Icons.tv, size: 100, color: Colors.cyan),
                          ).animate().scale(duration: 500.ms, curve: Curves.easeOutBack),
                        ),
                        const SizedBox(height: 20),
                        Text(
                          dotenv.env['APP_TITLE'] ?? "Nellai IPTV",
                          textAlign: TextAlign.center,
                          style: GoogleFonts.outfit(
                            fontSize: 28,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 60),
        
                        // Phone Input
                        TextFormField(
                          controller: _phoneController,
                          autofocus: true, // Enable D-pad navigation for Android TV
                          keyboardType: TextInputType.phone,
                          style: const TextStyle(color: Colors.white),
                          decoration: InputDecoration(
                            labelText: "Phone Number",
                            labelStyle: const TextStyle(color: Colors.white70),
                            prefixIcon: const Icon(Icons.phone, color: Colors.cyan),
                            filled: true,
                            fillColor: Colors.white.withOpacity(0.05),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide(color: Colors.white.withOpacity(0.1)),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(color: Colors.cyan),
                            ),
                          ),
                          validator: (value) {
                            if (value == null || value.isEmpty) return "Please enter your phone number";
                            if (value.length < 10) return "Invalid phone number";
                            return null;
                          },
                        ),
                        const SizedBox(height: 20),
        
                        // Password Input
                        TextFormField(
                          controller: _passwordController,
                          obscureText: _obscurePassword,
                          style: const TextStyle(color: Colors.white),
                          decoration: InputDecoration(
                            labelText: "Password",
                            labelStyle: const TextStyle(color: Colors.white70),
                            prefixIcon: const Icon(Icons.lock, color: Colors.cyan),
                            suffixIcon: IconButton(
                              icon: Icon(
                                _obscurePassword ? Icons.visibility_off : Icons.visibility,
                                color: Colors.white54,
                              ),
                              onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                            ),
                            filled: true,
                            fillColor: Colors.white.withOpacity(0.05),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide(color: Colors.white.withOpacity(0.1)),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(color: Colors.cyan),
                            ),
                          ),
                          validator: (value) {
                            if (value == null || value.isEmpty) return "Please enter your password";
                            return null;
                          },
                        ),
                        
                        const SizedBox(height: 40),
        
                        // Login Button
                        SizedBox(
                          height: 50,
                          child: ElevatedButton(
                            onPressed: _isLoading ? null : _handleLogin,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.cyan,
                              foregroundColor: Colors.black,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            child: _isLoading 
                                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black)) 
                                : const Text("Login", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                          ),
                        ),
        
                        const SizedBox(height: 20),
        
                        // Register Link
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Text("Don't have an account? ", style: TextStyle(color: Colors.white60)),
                            TextButton(
                              onPressed: () {
                                 Navigator.of(context).push(
                                   MaterialPageRoute(builder: (_) => const RegisterScreen())
                                 );
                              },
                              child: const Text("Register", style: TextStyle(color: Colors.cyan, fontWeight: FontWeight.bold)),
                            ),
                          ],
                        ),
        
                        const Spacer(),
        
                        // Skip Button
                        Center(
                          child: TextButton(
                            onPressed: _handleSkip,
                            child: const Text("Skip for now", style: TextStyle(color: Colors.white38)),
                          ),
                        ),
                        
                        if (_bannerAd != null) ...[
                           const SizedBox(height: 20),
                           InkWell(
                             onTap: () async {
                               if (_bannerAd!.linkUrl != null) {
                                 final uri = Uri.parse(_bannerAd!.linkUrl!);
                                 if (await canLaunchUrl(uri)) {
                                   await launchUrl(uri);
                                 }
                               }
                             },
                             borderRadius: BorderRadius.circular(8),
                             child: Container(
                               height: 80, 
                               width: double.infinity,
                               decoration: BoxDecoration(
                                 borderRadius: BorderRadius.circular(8),
                                 color: Colors.white10,
                               ),
                               clipBehavior: Clip.antiAlias,
                               child: CachedNetworkImage(
                                 imageUrl: _bannerAd!.imageUrl,
                                 fit: BoxFit.fill,
                                 placeholder: (context, url) => const Center(child: CircularProgressIndicator()),
                                 errorWidget: (context, url, error) => const SizedBox.shrink(),
                               ),
                             ),
                           ).animate().fadeIn(duration: 500.ms),
                        ],

                        const SizedBox(height: 20),
                      ],
                    ),
                  ),
                ),
              ),
            );
          }
        ),
      ),
    );
  }
}
