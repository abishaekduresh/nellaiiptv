import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/api_service.dart';
import '../auth/manage_devices_screen.dart';
import '../auth/login_screen.dart';
import '../../core/toast_service.dart';
import 'feedback_screen.dart';
import 'my_streams_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final ApiService _api = ApiService();
  Map<String, dynamic>? _profileData;
  bool _isLoading = true;
  bool _isLoggingOut = false;

  // Focus Nodes
  late FocusNode _manageDevicesFocusNode;
  late FocusNode _myStreamsFocusNode;
  late FocusNode _feedbackFocusNode;
  late FocusNode _logoutFocusNode;

  @override
  void initState() {
    super.initState();
    // Allow free rotation — layout adapts via OrientationBuilder
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
      DeviceOrientation.portraitDown,
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);
    _manageDevicesFocusNode = FocusNode();
    _myStreamsFocusNode = FocusNode();
    _feedbackFocusNode = FocusNode();
    _logoutFocusNode = FocusNode();
    _loadProfile();
  }

  @override
  void dispose() {
    if (!_isLoggingOut) {
      // Restore landscape for ClassicScreen
      SystemChrome.setPreferredOrientations([
        DeviceOrientation.landscapeLeft,
        DeviceOrientation.landscapeRight,
      ]);
    }
    _manageDevicesFocusNode.dispose();
    _myStreamsFocusNode.dispose();
    _feedbackFocusNode.dispose();
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
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1E293B),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Confirm Logout',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        content: const Text('Are you sure you want to log out?',
            style: TextStyle(color: Colors.white70)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel', style: TextStyle(color: Colors.white60)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.redAccent,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Logout', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    _isLoggingOut = true;
    await _api.logout();
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');

    if (!mounted) return;

    ToastService().show('Logged out successfully', type: ToastType.success);
    SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (_) => false,
    );
  }

  Future<void> _navigateToManageDevices() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');
    if (token != null && mounted) {
      Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => ManageDevicesScreen(tempToken: token)),
      );
    }
  }

  // ─── Build ────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        title: const Text('My Profile',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        iconTheme: const IconThemeData(color: Colors.white),
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF06B6D4)))
          : _profileData == null
              ? _buildErrorState()
              : OrientationBuilder(
                  builder: (context, orientation) {
                    return orientation == Orientation.landscape
                        ? _buildLandscapeLayout()
                        : _buildPortraitLayout();
                  },
                ),
    );
  }

  // ─── Portrait ─────────────────────────────────────────────────────────────

  Widget _buildPortraitLayout() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _buildUserInfoCard(compact: false),
          const SizedBox(height: 20),
          _buildSubscriptionCard(),
          const SizedBox(height: 20),
          _buildActionButtons(),
        ],
      ),
    );
  }

  // ─── Landscape ────────────────────────────────────────────────────────────

  Widget _buildLandscapeLayout() {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Left pane — user card fixed width
        SizedBox(
          width: 220,
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: _buildUserInfoCard(compact: true),
          ),
        ),
        // Divider
        Container(width: 1, color: Colors.white10),
        // Right pane — subscription + buttons
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _buildSubscriptionCard(),
                const SizedBox(height: 16),
                _buildActionButtons(),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // ─── Shared widgets ───────────────────────────────────────────────────────

  Widget _buildErrorState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, color: Colors.redAccent, size: 60),
          const SizedBox(height: 16),
          const Text('Failed to load profile',
              style: TextStyle(color: Colors.white, fontSize: 18)),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: _loadProfile,
            icon: const Icon(Icons.refresh),
            label: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  Widget _buildUserInfoCard({required bool compact}) {
    final user = _profileData!;
    final avatarSize = compact ? 56.0 : 80.0;
    final avatarIconSize = compact ? 28.0 : 40.0;
    final nameSize = compact ? 18.0 : 24.0;

    return Container(
      padding: EdgeInsets.all(compact ? 16 : 20),
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
          Container(
            width: avatarSize,
            height: avatarSize,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                colors: [Color(0xFF06B6D4), Color(0xFF0EA5E9)],
              ),
            ),
            child: Icon(Icons.person, size: avatarIconSize, color: Colors.white),
          ),
          SizedBox(height: compact ? 10 : 16),
          Text(
            user['name']?.toString() ?? 'User',
            style: TextStyle(
              color: Colors.white,
              fontSize: nameSize,
              fontWeight: FontWeight.bold,
            ),
            textAlign: TextAlign.center,
          ),
          SizedBox(height: compact ? 6 : 8),
          if (user['email'] != null)
            _buildContactRow(Icons.email, user['email'].toString(), compact),
          SizedBox(height: compact ? 4 : 8),
          if (user['phone'] != null)
            _buildContactRow(Icons.phone, user['phone'].toString(), compact),
        ],
      ),
    );
  }

  Widget _buildContactRow(IconData icon, String text, bool compact) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(icon, size: compact ? 13 : 16, color: Colors.white60),
        const SizedBox(width: 6),
        Flexible(
          child: Text(
            text,
            style: TextStyle(
              color: Colors.white70,
              fontSize: compact ? 12 : 14,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  Widget _buildSubscriptionCard() {
    final plan = _profileData!['plan'];

    if (plan == null) {
      return Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: const Color(0xFF1E293B),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white10),
        ),
        child: const Column(
          children: [
            Icon(Icons.subscriptions_outlined, size: 48, color: Colors.white30),
            SizedBox(height: 12),
            Text('No Active Subscription',
                style: TextStyle(color: Colors.white70, fontSize: 16)),
            SizedBox(height: 8),
            Text('Subscribe to enjoy premium content',
                style: TextStyle(color: Colors.white38, fontSize: 12)),
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
            color: const Color(0xFF10B981).withValues(alpha: 0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.workspace_premium, color: Colors.white, size: 28),
              SizedBox(width: 12),
              Text('Active Subscription',
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 16),
          if (plan['name'] != null)
            _buildSubscriptionRow(
                icon: Icons.card_membership,
                label: 'Plan',
                value: plan['name'].toString()),
          if (_profileData!['expiry_date'] != null ||
              _profileData!['expires_at'] != null)
            _buildSubscriptionRow(
              icon: Icons.calendar_today,
              label: 'Expires',
              value: _formatDate(
                  (_profileData!['expiry_date'] ?? _profileData!['expires_at'])
                      .toString()),
            ),
          if (plan['device_limit'] != null)
            _buildSubscriptionRow(
              icon: Icons.devices,
              label: 'Devices',
              value:
                  '${_profileData!['active_devices'] ?? 0} / ${plan['device_limit']}',
            ),
        ],
      ),
    );
  }

  Widget _buildSubscriptionRow(
      {required IconData icon, required String label, required String value}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(icon, size: 18, color: Colors.white70),
          const SizedBox(width: 12),
          Text('$label: ',
              style: const TextStyle(color: Colors.white70, fontSize: 14)),
          Expanded(
            child: Text(value,
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButtons() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _buildBtn(
          focusNode: _manageDevicesFocusNode,
          autofocus: true,
          icon: Icons.devices,
          label: 'Manage Devices',
          color: const Color(0xFF0EA5E9),
          onTap: _navigateToManageDevices,
        ),
        const SizedBox(height: 12),
        _buildBtn(
          focusNode: _myStreamsFocusNode,
          icon: Icons.wifi_tethering,
          label: 'My Streams',
          color: const Color(0xFF1E3A5F),
          onTap: () => Navigator.of(context)
              .push(MaterialPageRoute(builder: (_) => const MyStreamsScreen())),
        ),
        const SizedBox(height: 12),
        _buildBtn(
          focusNode: _feedbackFocusNode,
          icon: Icons.thumb_up_alt_outlined,
          label: 'Share Feedback',
          color: const Color(0xFF334155),
          onTap: () => Navigator.of(context)
              .push(MaterialPageRoute(builder: (_) => const FeedbackScreen())),
        ),
        const SizedBox(height: 12),
        _buildBtn(
          focusNode: _logoutFocusNode,
          icon: Icons.logout,
          label: 'Logout',
          color: Colors.redAccent,
          onTap: _handleLogout,
        ),
      ],
    );
  }

  Widget _buildBtn({
    required FocusNode focusNode,
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
    bool autofocus = false,
  }) {
    return ElevatedButton.icon(
      focusNode: focusNode,
      autofocus: autofocus,
      onPressed: onTap,
      icon: Icon(icon),
      label: Text(label),
      style: ElevatedButton.styleFrom(
        backgroundColor: color,
        foregroundColor: Colors.white,
        minimumSize: const Size(double.infinity, 52),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        elevation: 2,
      ),
    );
  }

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day}/${date.month}/${date.year}';
    } catch (_) {
      return dateStr;
    }
  }
}
