import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/api_service.dart';
import '../../core/toast_service.dart';
import 'package:flutter_animate/flutter_animate.dart';

import 'dart:math'; // For random ad selection
import 'package:cached_network_image/cached_network_image.dart'; // For displaying ad
import 'package:url_launcher/url_launcher.dart'; // For ad click
import '../../models/ad.dart'; // Import Ad model

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _confirmPasswordController = TextEditingController();
  bool _isLoading = false;
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  Ad? _bannerAd; // Ad state

  @override
  void initState() {
    super.initState();
    // Enforce Portrait for Register
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

  Future<void> _handleRegister() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      await ApiService().register(
        _nameController.text.trim(),
        _phoneController.text.trim(),
        _emailController.text.trim(),
        _passwordController.text
      );

      if (mounted) {
        ToastService().show("Registration Successful! Please login.", type: ToastType.success);
        Navigator.pop(context); // Go back to login
      }

    } catch (e) {
      if (mounted) {
        ToastService().show(e.toString().replaceAll("Exception:", "").trim(), type: ToastType.error);
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
      ),
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
                        const SizedBox(height: 20),
                        Text(
                          "Create Account",
                          style: GoogleFonts.outfit(
                            fontSize: 28,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          "Sign up to get started",
                          style: TextStyle(color: Colors.white60, fontSize: 16),
                        ),
                        const SizedBox(height: 40),

                        // Name Input
                        TextFormField(
                          controller: _nameController,
                          autofocus: true, // Enable D-pad navigation for Android TV
                          style: const TextStyle(color: Colors.white),
                          decoration: _inputDecoration("Full Name", Icons.person),
                          validator: (value) => (value == null || value.isEmpty) ? "Enter your name" : null,
                        ),
                        const SizedBox(height: 20),

                        // Email Input
                        TextFormField(
                          controller: _emailController,
                          keyboardType: TextInputType.emailAddress,
                          style: const TextStyle(color: Colors.white),
                          decoration: _inputDecoration("Email Address", Icons.email),
                          validator: (value) {
                             if (value == null || value.isEmpty) return "Enter your email";
                             if (!value.contains('@')) return "Invalid email";
                             if (!value.toLowerCase().endsWith('@gmail.com')) return "Only Gmail addresses are allowed";
                             return null;
                          },
                        ),
                        const SizedBox(height: 20),

                        // Phone Input
                        TextFormField(
                          controller: _phoneController,
                          keyboardType: TextInputType.phone,
                          style: const TextStyle(color: Colors.white),
                          decoration: _inputDecoration("Phone Number", Icons.phone),
                          validator: (value) {
                            if (value == null || value.isEmpty) return "Enter phone number";
                            if (value.length != 10) return "Phone number must be exactly 10 digits";
                            if (!RegExp(r'^[0-9]+$').hasMatch(value)) return "Phone number must contain only digits";
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
                          validator: (value) => (value == null || value.length < 6) ? "Password must be at least 6 characters" : null,
                        ),
                        const SizedBox(height: 20),

                        // Confirm Password Input
                        TextFormField(
                          controller: _confirmPasswordController,
                          obscureText: _obscureConfirmPassword,
                          style: const TextStyle(color: Colors.white),
                          decoration: InputDecoration(
                            labelText: "Confirm Password",
                            labelStyle: const TextStyle(color: Colors.white70),
                            prefixIcon: const Icon(Icons.lock_outline, color: Colors.cyan),
                            suffixIcon: IconButton(
                              icon: Icon(
                                _obscureConfirmPassword ? Icons.visibility_off : Icons.visibility,
                                color: Colors.white54,
                              ),
                              onPressed: () => setState(() => _obscureConfirmPassword = !_obscureConfirmPassword),
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
                            if (value == null || value.isEmpty) return "Confirm your password";
                            if (value != _passwordController.text) return "Passwords do not match";
                            return null;
                          },
                        ),
                        
                        const SizedBox(height: 40),

                        // Register Button
                        SizedBox(
                          height: 50,
                          child: ElevatedButton(
                            onPressed: _isLoading ? null : _handleRegister,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.cyan,
                              foregroundColor: Colors.black,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            child: _isLoading 
                                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black)) 
                                : const Text("Create Account", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                          ),
                        ),
                        
                        const Spacer(),
                        
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

  InputDecoration _inputDecoration(String label, IconData icon) {
    return InputDecoration(
      labelText: label,
      labelStyle: const TextStyle(color: Colors.white70),
      prefixIcon: Icon(icon, color: Colors.cyan),
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
    );
  }
}
