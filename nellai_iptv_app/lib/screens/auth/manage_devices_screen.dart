import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:intl/intl.dart';
import '../../core/api_service.dart';
import '../../core/toast_service.dart';
import '../classic/classic_screen.dart';

class ManageDevicesScreen extends StatefulWidget {
  final String tempToken;

  const ManageDevicesScreen({super.key, required this.tempToken});

  @override
  State<ManageDevicesScreen> createState() => _ManageDevicesScreenState();
}

class _ManageDevicesScreenState extends State<ManageDevicesScreen> {
  List<dynamic> _sessions = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    // Enforce Portrait
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
    ]);
    _fetchSessions();
  }

  Future<void> _fetchSessions() async {
    setState(() => _isLoading = true);
    try {
      final sessions = await ApiService().getSessions(widget.tempToken);
      if (mounted) {
        setState(() {
          _sessions = sessions;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
         setState(() => _isLoading = false);
         ToastService().show(e.toString().replaceAll("Exception:", "").trim(), type: ToastType.error);
      }
    }
  }

  Future<void> _handleRevoke(int id) async {
    try {
      final result = await ApiService().deleteSession(id, widget.tempToken);
      
      if (result['success'] == true) {
         // Check if new tokens were returned (Auto Login)
         if (result['data'] != null && result['data']['tokens'] != null) {
            final tokens = result['data']['tokens'];
            final String newToken = tokens['token'];
            
            // Store new token
            final prefs = await SharedPreferences.getInstance();
            await prefs.setString('auth_token', newToken);

            if (mounted) {
               ToastService().show("Device removed. Logging in...", type: ToastType.success);
               _navigateToClassic();
            }
         } else {
            // Just removed, refresh list
             if (mounted) {
                ToastService().show("Device removed successfully", type: ToastType.success);
                _fetchSessions();
             }
         }
      }
    } catch (e) {
      if (mounted) {
        ToastService().show(e.toString().replaceAll("Exception:", "").trim(), type: ToastType.error);
      }
    }
  }

  void _navigateToClassic() {
    // Enforce Landscape for Classic Screen
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
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text("Manage Devices", style: GoogleFonts.outfit(color: Colors.white)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: _isLoading 
            ? const Center(child: CircularProgressIndicator())
            : _sessions.isEmpty 
                ? const Center(child: Text("No active sessions found", style: TextStyle(color: Colors.white70)))
                : ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: _sessions.length,
                    separatorBuilder: (c, i) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final session = _sessions[index];
                      return _buildSessionCard(session);
                    },
                  ),
      ),
    );
  }

  Widget _buildSessionCard(dynamic session) {
    final bool isThisDevice = false; // Hard to verify without device ID comparison, skipping for now
    
    IconData icon;
    Color iconColor;
    String platform = (session['platform'] ?? 'web').toString().toLowerCase();

    if (platform == 'android') {
      icon = Icons.android;
      iconColor = Colors.greenAccent;
    } else if (platform == 'ios') {
      icon = Icons.phone_iphone;
      iconColor = Colors.grey;
    } else if (platform == 'tv') {
      icon = Icons.tv;
      iconColor = Colors.blueAccent;
    } else {
      icon = Icons.language; // Web
      iconColor = Colors.cyanAccent;
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: iconColor, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  session['device_name'] ?? 'Unknown Device',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                ),
                const SizedBox(height: 4),
                Text(
                  "Last active: ${session['last_active'] ?? 'N/A'}",
                  style: const TextStyle(color: Colors.white54, fontSize: 12),
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.delete_outline, color: Colors.redAccent),
            onPressed: () => _handleRevoke(session['id']),
          ),
        ],
      ),
    );
  }
}
