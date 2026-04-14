import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:package_info_plus/package_info_plus.dart';
import '../../providers/settings_provider.dart';
import '../../core/device_utils.dart';
import 'package:flutter_cache_manager/flutter_cache_manager.dart';
import '../../core/toast_service.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final FocusNode _clearCacheFocusNode = FocusNode();

  bool _isClearingCache = false;
  String _appVersion = '';

  Future<void> _handleClearCache() async {
    if (_isClearingCache) return;
    
    setState(() => _isClearingCache = true);
    ToastService().show("Clearing cache...", type: ToastType.info);

    try {
      await DefaultCacheManager().emptyCache();
      ToastService().show("Cache cleared successfully!", type: ToastType.success);
    } catch (e) {
      ToastService().show("Failed to clear cache", type: ToastType.error);
    } finally {
      setState(() => _isClearingCache = false);
    }
  }

  Future<void> _loadVersion() async {
    final info = await PackageInfo.fromPlatform();
    if (mounted) setState(() => _appVersion = 'Version ${info.version}+${info.buildNumber}');
  }

  @override
  void initState() {
    super.initState();
    _loadVersion();
    if (DeviceUtils.isTV) {
      SystemChrome.setPreferredOrientations([
        DeviceOrientation.landscapeLeft,
        DeviceOrientation.landscapeRight,
      ]);
    } else {
      // Allow all orientations on mobile
      SystemChrome.setPreferredOrientations([
        DeviceOrientation.portraitUp,
        DeviceOrientation.portraitDown,
        DeviceOrientation.landscapeLeft,
        DeviceOrientation.landscapeRight,
      ]);
    }
  }

  @override
  void dispose() {
    // We came from ClassicScreen, which is landscape.
    // If not TV (e.g. tablet), it could be either. Safely reset.
    // Actually, setting to landscape across the board for classic mode is what classic_screen.dart does on init.
    // Resetting to landscape is safe. 
    SystemChrome.setPreferredOrientations([
        DeviceOrientation.landscapeLeft,
        DeviceOrientation.landscapeRight,
    ]);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        title: const Text('Settings', style: TextStyle(color: Colors.white)),
        backgroundColor: const Color(0xFF1E293B),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: Consumer<SettingsProvider>(
        builder: (context, settingsProvider, child) {
          return Column(
            children: [
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.all(16.0),
                  children: [
                  const Text(
                    'Storage',
                    style: TextStyle(
                      color: Colors.cyan,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Container(
                    decoration: BoxDecoration(
                      color: const Color(0xFF1E293B),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: _buildActionOption(
                      focusNode: _clearCacheFocusNode,
                      title: 'Clear Image Cache',
                      icon: Icons.delete_outline,
                      iconColor: Colors.redAccent,
                      onSelect: _handleClearCache,
                    ),
                  ),
                  ],
                ),
              ),
              if (_appVersion.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(bottom: 20.0),
                  child: Text(
                    _appVersion,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: Colors.white30,
                      fontSize: 12,
                      letterSpacing: 1.2,
                    ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildActionOption({
    required FocusNode focusNode,
    required String title,
    required IconData icon,
    required Color iconColor,
    required VoidCallback onSelect,
  }) {
    return AnimatedBuilder(
      animation: focusNode,
      builder: (context, _) {
        final isFocused = focusNode.hasFocus;
        return Container(
          decoration: BoxDecoration(
             color: isFocused ? Colors.cyan.withOpacity(0.2) : Colors.transparent,
             border: Border.all(
                color: isFocused ? Colors.cyan : Colors.transparent,
                width: 2,
             ),
             borderRadius: BorderRadius.circular(8),
          ),
          child: InkWell(
            focusNode: focusNode,
            onTap: onSelect,
            onFocusChange: (hasFocus) {
              if (hasFocus) setState(() {});
            },
            child: ListTile(
              leading: Icon(icon, color: iconColor),
              title: Text(title, style: const TextStyle(color: Colors.white)),
              trailing: const Icon(Icons.chevron_right, color: Colors.white54),
            ),
          ),
        );
      },
    );
  }
}
