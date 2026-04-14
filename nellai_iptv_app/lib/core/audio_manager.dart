import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:volume_controller/volume_controller.dart';

class AudioManager {
  static final AudioManager _instance = AudioManager._internal();
  factory AudioManager() => _instance;
  AudioManager._internal();

  final VolumeController _volumeController = VolumeController.instance;
  
  // Stream for volume changes
  final StreamController<double> _volumeStreamController = StreamController<double>.broadcast();
  Stream<double> get volumeStream => _volumeStreamController.stream;
  double get currentVolume => _currentVolume;

  double _currentVolume = 0.5;
  double _lastUnmutedVolume = 0.5;
  bool _isMuted = false;
  
  // Session Volume Management
  double? _originalVolume; // System volume before app interaction
  double _appSessionVolume = 0.5; // Last volume set by the app
  bool _isInitialized = false;

  Future<void> init() async {
    if (_isInitialized) return;
    _isInitialized = true;
    
    // Get initial volume
    double vol = await _volumeController.getVolume();
    
    // Store original volume ONCE
    _originalVolume ??= vol;
    _currentVolume = vol;
    _appSessionVolume = vol;
    
    _volumeStreamController.add(_currentVolume);
    
    // Hide System UI for volume changes
    _volumeController.showSystemUI = false;

    // Remove existing listener if any to avoid duplicate callbacks after hot restart
    try {
      _volumeController.removeListener();
    } catch (_) {}

    // Listen for system changes (e.g. hardware buttons)
    _volumeController.addListener((volume) {
      _currentVolume = volume;
      _appSessionVolume = volume; // Keep sync if hardware changed it
      // If volume is > 0, we can assume unmuted
      if (_currentVolume > 0) {
        _isMuted = false;
      }
      if (!_volumeStreamController.isClosed) {
        _volumeStreamController.add(_currentVolume);
      }
    });
  }

  void dispose() {
    restoreOriginalVolume();
    _volumeController.removeListener();
    _volumeStreamController.close();
  }
  
  Future<void> restoreOriginalVolume() async {
    if (_originalVolume != null) {
       _volumeController.showSystemUI = false; // Keep it hidden during restore
       await _volumeController.setVolume(_originalVolume!);
    }
  }
  
  Future<void> reapplyAppVolume() async {
     _volumeController.showSystemUI = false;
     await _volumeController.setVolume(_appSessionVolume);
  }

  Future<void> setVolume(double volume) async {
    // Clamp 0.0 to 1.0
    final newVolume = volume.clamp(0.0, 1.0);
    _currentVolume = newVolume;
    _appSessionVolume = newVolume; // Update session volume
    
    // Optimistic update
    _volumeStreamController.add(_currentVolume);
    
    // Apply to system (hide system UI)
    await _volumeController.setVolume(newVolume);
  }

  Future<void> toggleMute() async {
    if (_currentVolume > 0) {
      // Mute
      _lastUnmutedVolume = _currentVolume;
      _isMuted = true;
      await setVolume(0);
    } else {
      // Unmute
      _isMuted = false;
      // Restore last volume or default to 0.5 if it was 0
      final target = _lastUnmutedVolume > 0 ? _lastUnmutedVolume : 0.5;
      await setVolume(target);
    }
  }

  bool get isMuted => _currentVolume == 0;
}
