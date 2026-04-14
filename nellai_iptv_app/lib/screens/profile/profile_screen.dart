import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/api_service.dart';
import '../auth/manage_devices_screen.dart';
import '../auth/login_screen.dart';
import '../../core/toast_service.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final ApiService _api = ApiService();
  Map<String, dynamic>? _profileData;
  bool _isLoading = true;
  bool _isLoggingOut = false; // Track if user is logging out
  
  // Focus Nodes
  late FocusNode _manageDevicesFocusNode;
  late FocusNode _logoutFocusNode;

  @override
  void initState() {
    super.initState();
    
    // Enforce Portrait for Profile Screen
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
    ]);
    
    _manageDevicesFocusNode = FocusNode();
    _logoutFocusNode = FocusNode();
    _loadProfile();
  }

  @override
  void dispose() {
    // Only restore landscape if NOT logging out (going back to ClassicScreen)
    // If logging out, portrait was already set in logout handler
    if (!_isLoggingOut) {
      SystemChrome.setPreferredOrientations([
        DeviceOrientation.landscapeLeft,
        DeviceOrientation.landscapeRight,
      ]);
    }
    
    _manageDevicesFocusNode.dispose();
    _logoutFocusNode.dispose();
    super.dispose();
  }

  Future<void> _loadProfile() async {
    setState(() => _isLoading = true);
    
    try {
      final profile = await _api.getUserProfile();
      if (mounted) {
        setState(() {
          _profileData = profile;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ToastService().show('Failed to load profile', type: ToastType.error);
      }
    }
  }

  Future<void> _handleLogout() async {
    bool confirm = await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1E293B),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text("Confirm Logout", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        content: const Text("Are you sure you want to log out?", style: TextStyle(color: Colors.white70)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text("Cancel", style: TextStyle(color: Colors.white60)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.redAccent,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: () => Navigator.pop(context, true),
            child: const Text("Logout", style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    ) ?? false;

    if (!confirm) return;

    // Set flag to prevent dispose from changing orientation
    _isLoggingOut = true;

    // Call backend to remove session from database
    await _api.logout();

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');

    if (!mounted) return;

    ToastService().show("Logged out successfully", type: ToastType.success);
    
    // Set portrait orientation for login screen
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
    ]);

    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (_) => false,
    );
  }

  Future<void> _navigateToManageDevices() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');
    
    if (token != null) {
      Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => ManageDevicesScreen(tempToken: token)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        title: const Text('My Profile', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        iconTheme: const IconThemeData(color: Colors.white),
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _profileData == null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline, color: Colors.redAccent, size: 60),
                      const SizedBox(height: 16),
                      const Text('Failed to load profile', style: TextStyle(color: Colors.white, fontSize: 18)),
                      const SizedBox(height: 16),
                      ElevatedButton.icon(
                        onPressed: _loadProfile,
                        icon: const Icon(Icons.refresh),
                        label: const Text('Retry'),
                        focusNode: FocusNode()..requestFocus(), // Autofocus on retry
                      ),
                    ],
                  ),
                )
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // User Info Card
                      _buildUserInfoCard(),
                      const SizedBox(height: 20),
                      
                      // Subscription Card
                      _buildSubscriptionCard(),
                      const SizedBox(height: 20),
                      
                      // Manage Devices Button
                      _buildManageDevicesButton(),
                      const SizedBox(height: 16),
                      
                      // Logout Button
                      _buildLogoutButton(),
                    ],
                  ),
                ),
    );
  }

  Widget _buildUserInfoCard() {
    final user = _profileData!;
    
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1E293B), Color(0xFF334155)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white10),
      ),
      child: Column(
        children: [
          // Avatar
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: const LinearGradient(
                colors: [Color(0xFF06B6D4), Color(0xFF0EA5E9)],
              ),
            ),
            child: const Icon(Icons.person, size: 40, color: Colors.white),
          ),
          const SizedBox(height: 16),
          
          // Name
          Text(
            user['name']?.toString() ?? 'User',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          
          // Email
          if (user['email'] != null)
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.email, size: 16, color: Colors.white60),
                const SizedBox(width: 8),
                Text(
                  user['email'].toString(),
                  style: const TextStyle(color: Colors.white70, fontSize: 14),
                ),
              ],
            ),
          const SizedBox(height: 8),
          
          // Phone
          if (user['phone'] != null)
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.phone, size: 16, color: Colors.white60),
                const SizedBox(width: 8),
                Text(
                  user['phone'].toString(),
                  style: const TextStyle(color: Colors.white70, fontSize: 14),
                ),
              ],
            ),
        ],
      ),
    );
  }

  Widget _buildSubscriptionCard() {
    // Backend returns plan data under 'plan' key, not 'subscription'
    final plan = _profileData!['plan'];
    
    if (plan == null) {
      return Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: const Color(0xFF1E293B),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white10),
        ),
        child: Column(
          children: [
            const Icon(Icons.subscriptions_outlined, size: 48, color: Colors.white30),
            const SizedBox(height: 12),
            const Text(
              'No Active Subscription',
              style: TextStyle(color: Colors.white70, fontSize: 16),
            ),
            const SizedBox(height: 8),
            const Text(
              'Subscribe to enjoy premium content',
              style: TextStyle(color: Colors.white38, fontSize: 12),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF10B981), Color(0xFF059669)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF10B981).withOpacity(0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.workspace_premium, color: Colors.white, size: 28),
              const SizedBox(width: 12),
              const Text(
                'Active Subscription',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          
          // Plan Name - backend uses 'name' field
          if (plan['name'] != null)
            _buildSubscriptionRow(
              icon: Icons.card_membership,
              label: 'Plan',
              value: plan['name'].toString(),
            ),
          
          // Expiry Date - check both possible field names
          if (_profileData!['expiry_date'] != null || _profileData!['expires_at'] != null)
            _buildSubscriptionRow(
              icon: Icons.calendar_today,
              label: 'Expires',
              value: _formatDate((_profileData!['expiry_date'] ?? _profileData!['expires_at']).toString()),
            ),
          
          // Device Limit - from plan
          if (plan['device_limit'] != null)
            _buildSubscriptionRow(
              icon: Icons.devices,
              label: 'Devices',
              value: '${_profileData!['active_devices'] ?? 0} / ${plan['device_limit']}',
            ),
        ],
      ),
    );
  }

  Widget _buildSubscriptionRow({required IconData icon, required String label, required String value}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(icon, size: 18, color: Colors.white70),
          const SizedBox(width: 12),
          Text(
            '$label: ',
            style: const TextStyle(color: Colors.white70, fontSize: 14),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildManageDevicesButton() {
    return ElevatedButton.icon(
      focusNode: _manageDevicesFocusNode,
      autofocus: true, // Default focus for TV
      onPressed: _navigateToManageDevices,
      icon: const Icon(Icons.devices),
      label: const Text('Manage Devices'),
      style: ElevatedButton.styleFrom(
        backgroundColor: const Color(0xFF0EA5E9),
        foregroundColor: Colors.white,
        minimumSize: const Size(double.infinity, 56),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        elevation: 4,
      ),
    );
  }

  Widget _buildLogoutButton() {
    return ElevatedButton.icon(
      focusNode: _logoutFocusNode,
      onPressed: _handleLogout,
      icon: const Icon(Icons.logout),
      label: const Text('Logout'),
      style: ElevatedButton.styleFrom(
        backgroundColor: Colors.redAccent,
        foregroundColor: Colors.white,
        minimumSize: const Size(double.infinity, 56),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        elevation: 4,
      ),
    );
  }

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day}/${date.month}/${date.year}';
    } catch (e) {
      return dateStr;
    }
  }
}
