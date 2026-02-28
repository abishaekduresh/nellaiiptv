import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SettingsProvider with ChangeNotifier {
  static const String _channelOrderKey = 'channelOrder';
  
  String _channelOrder = 'random'; // default to random as requested

  String get channelOrder => _channelOrder;

  SettingsProvider() {
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    _channelOrder = prefs.getString(_channelOrderKey) ?? 'random';
    notifyListeners();
  }

  Future<void> setChannelOrder(String order) async {
    if (order != 'random' && order != 'channelNumber') {
      return; // Validation
    }
    
    _channelOrder = order;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_channelOrderKey, order);
    
    notifyListeners();
  }
}
