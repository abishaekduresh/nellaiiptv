import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../providers/settings_provider.dart';
import '../../providers/channel_provider.dart';
import '../../core/device_utils.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final FocusNode _randomFocusNode = FocusNode();
  final FocusNode _channelNumberFocusNode = FocusNode();

  @override
  void initState() {
    super.initState();
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
    _randomFocusNode.dispose();
    _channelNumberFocusNode.dispose();
    
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
          return ListView(
            padding: const EdgeInsets.all(16.0),
            children: [
              const Text(
                'Channel List Order',
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
                child: Column(
                  children: [
                    _buildRadioOption(
                      focusNode: _randomFocusNode,
                      title: 'Random (Default)',
                      value: 'random',
                      groupValue: settingsProvider.channelOrder,
                      onSelect: () {
                         settingsProvider.setChannelOrder('random');
                         context.read<ChannelProvider>().applySort();
                      }
                    ),
                    const Divider(color: Colors.white24, height: 1),
                    _buildRadioOption(
                      focusNode: _channelNumberFocusNode,
                      title: 'Channel Number Order',
                      value: 'channelNumber',
                      groupValue: settingsProvider.channelOrder,
                      onSelect: () {
                         settingsProvider.setChannelOrder('channelNumber');
                         context.read<ChannelProvider>().applySort();
                      }
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildRadioOption({
    required FocusNode focusNode,
    required String title,
    required String value,
    required String groupValue,
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
            child: RadioListTile<String>(
              title: Text(title, style: const TextStyle(color: Colors.white)),
              value: value,
              groupValue: groupValue,
              activeColor: Colors.cyan,
              // The RadioListTile handles its own ontap, but we also want the InkWell to trigger it via D-Pad Enter
              onChanged: (val) {
                onSelect();
              },
            ),
          ),
        );
      },
    );
  }
}
