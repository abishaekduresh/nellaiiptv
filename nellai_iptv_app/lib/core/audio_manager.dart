import 'package:volume_controller/volume_controller.dart';

class AudioManager {
  // Singleton
  static final AudioManager _instance = AudioManager._internal();
  factory AudioManager() => _instance;
  AudioManager._internal();

  double? _originalVolume;

  void init() {
    // Save current volume
    VolumeController.instance.getVolume().then((vol) => _originalVolume = vol);
  }

  void restoreOriginalVolume() {
    if (_originalVolume != null) {
      VolumeController.instance.setVolume(_originalVolume!);
    }
  }

  void reapplyAppVolume() {
     // Logic to restore in-app volume preferences if any (for now just ensure it's audible)
     // VolumeController.instance.setVolume(1.0); 
  }
}
