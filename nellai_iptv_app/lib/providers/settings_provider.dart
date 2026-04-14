import 'package:flutter/material.dart';

class SettingsProvider with ChangeNotifier {
  SettingsProvider() {
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    // Left for future settings implementation
    notifyListeners();
  }
}
