import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:screen_brightness/screen_brightness.dart';
import 'dart:async';
import '../services/audio_manager.dart';

class GestureOverlay extends StatefulWidget {
  final Widget child;
  // Callback when user taps center (e.g. to toggle controls)
  final VoidCallback? onTap;

  // Custom Mute Handler (Returns new volume)
  final Future<double> Function()? onToggleMute;

  // Play/Pause callback for TV remote media keys
  final VoidCallback? onPlayPause;

  const GestureOverlay({super.key, required this.child, this.onTap, this.onToggleMute, this.onPlayPause});

  @override
  State<GestureOverlay> createState() => _GestureOverlayState();
}

class _GestureOverlayState extends State<GestureOverlay> {
  // Overlay State
  bool _isVisible = false;
  double _value = 0.0; // 0.0 to 1.0
  IconData _icon = Icons.brightness_6;
  Timer? _timer;
  double _lastVolume = 0.5;

  @override
  void initState() {
    super.initState();
    AudioManager().init();
  }

  void _showOverlay(IconData icon, double value) {
    setState(() {
      _isVisible = true;
      _icon = icon;
      _value = value.clamp(0.0, 1.0);
    });

    _timer?.cancel();
    _timer = Timer(const Duration(milliseconds: 1500), () {
      if (mounted) {
         setState(() {
           _isVisible = false;
         });
      }
    });
  }

  Future<void> _handleDoubleTap() async {
    if (widget.onToggleMute != null) {
      try {
        double newVol = await widget.onToggleMute!();
        _showOverlay(newVol == 0 ? Icons.volume_off : Icons.volume_up, newVol);
      } catch (e) {
        print("Double-tap Mute Error: $e");
      }
    } else {
      try {
        await AudioManager().toggleMute();
        double newVol = AudioManager().currentVolume;
        _showOverlay(newVol == 0 ? Icons.volume_off : Icons.volume_up, newVol);
      } catch (e) {
        print("Double-tap Volume Error: $e");
      }
    }
  }

  Future<void> _handleTap({TapUpDetails? details, BoxConstraints? constraints}) async {
     widget.onTap?.call(); // Always toggle controls on tap
     
     // Restrict Mute to Center Zone (if details provided)
     // Zone: 25% margin on all sides (Middle 50%)
     if (details != null && constraints != null) {
       final double w = constraints.maxWidth;
       final double h = constraints.maxHeight;
       final double dx = details.localPosition.dx;
       final double dy = details.localPosition.dy;

       bool isCenter = dx > (w * 0.25) && dx < (w * 0.75) &&
                       dy > (h * 0.25) && dy < (h * 0.75);

       if (!isCenter) return; // Skip mute if on edges
     }
     
     // Custom Mute Handler (Prioritized)
     if (widget.onToggleMute != null) {
       try {
         double newVol = await widget.onToggleMute!();
         _showOverlay(newVol == 0 ? Icons.volume_off : Icons.volume_up, newVol);
       } catch (e) {
         print("Mute Toggle Error: $e");
       }
       return;
     }

     // Fallback to System Mute
     try {
       await AudioManager().toggleMute();
       double newVol = AudioManager().currentVolume;
       _showOverlay(newVol == 0 ? Icons.volume_off : Icons.volume_up, newVol);
     } catch(e) {
       print("Volume Error: $e");
     }
  }

  Future<void> _handleVerticalDragUpdate(DragUpdateDetails details, BoxConstraints constraints) async {
    final double halfWidth = constraints.maxWidth / 2;
    final double dx = details.localPosition.dx;
    final double deltaY = details.primaryDelta ?? 0;

    // Sensitivity
    final double sensitivity = 0.005;

    if (dx < halfWidth) {
      // LEFT SIDE: BRIGHTNESS
      try {
        double current = await ScreenBrightness().current;
        double target = (current - (deltaY * sensitivity)).clamp(0.0, 1.0);
        await ScreenBrightness().setScreenBrightness(target);
        _showOverlay(Icons.brightness_6, target);
      } catch (e) {
        print("Brightness Error: $e");
      }
    } else {
      // RIGHT SIDE: VOLUME
      double current = AudioManager().currentVolume;
      double target = (current - (deltaY * sensitivity)).clamp(0.0, 1.0);
      AudioManager().setVolume(target);
      _showOverlay(target == 0 ? Icons.volume_off : Icons.volume_up, target);
    }
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        return RawKeyboardListener(
          focusNode: FocusNode(),
          autofocus: true,
          onKey: (RawKeyEvent event) async {
            if (event is RawKeyDownEvent) {
               final key = event.logicalKey;
               
               // TV Remote: Volume Control (dedicated volume keys)
               if (key == LogicalKeyboardKey.audioVolumeUp) {
                  double current = AudioManager().currentVolume;
                  double target = (current + 0.1).clamp(0.0, 1.0);
                  AudioManager().setVolume(target);
                  _showOverlay(Icons.volume_up, target);
               }
               else if (key == LogicalKeyboardKey.audioVolumeDown) {
                  double current = AudioManager().currentVolume;
                  double target = (current - 0.1).clamp(0.0, 1.0);
                  AudioManager().setVolume(target);
                  _showOverlay(target == 0 ? Icons.volume_off : Icons.volume_up, target);
               }
               // TV Remote: D-pad Up/Down → Volume
               else if (key == LogicalKeyboardKey.arrowUp) {
                  double current = AudioManager().currentVolume;
                  double target = (current + 0.1).clamp(0.0, 1.0);
                  AudioManager().setVolume(target);
                  _showOverlay(Icons.volume_up, target);
               }
               else if (key == LogicalKeyboardKey.arrowDown) {
                  double current = AudioManager().currentVolume;
                  double target = (current - 0.1).clamp(0.0, 1.0);
                  AudioManager().setVolume(target);
                  _showOverlay(target == 0 ? Icons.volume_off : Icons.volume_up, target);
               }
               // TV Remote: D-pad Left/Right → Show controls
               else if (key == LogicalKeyboardKey.arrowLeft || key == LogicalKeyboardKey.arrowRight) {
                 widget.onTap?.call();
               }
               // TV Remote: Select / Enter / Center D-pad
               else if (key == LogicalKeyboardKey.select || key == LogicalKeyboardKey.enter || key == LogicalKeyboardKey.gameButtonA) {
                 _handleTap();
               }
               // TV Remote: Media Play/Pause keys
               else if (key == LogicalKeyboardKey.mediaPlay ||
                        key == LogicalKeyboardKey.mediaPlayPause ||
                        key == LogicalKeyboardKey.mediaPause) {
                 widget.onPlayPause?.call();
               }
            }
          },
          child: Stack(
          children: [
            // 1. The Video Content
            widget.child,

            // 2. Gesture Detector Zone
            Positioned.fill(
              child: GestureDetector(
                onTapUp: (details) => _handleTap(details: details, constraints: constraints),
                onVerticalDragUpdate: (details) => _handleVerticalDragUpdate(details, constraints),
                onDoubleTap: () => _handleDoubleTap(),
              ),
            ),

            // 3. Central Feedback Overlay
            if (_isVisible)
              Center(
                child: Container(
                  width: 150,
                  height: 150,
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.6),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(_icon, color: Colors.white, size: 48),
                      const SizedBox(height: 16),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(10),
                          child: LinearProgressIndicator(
                            value: _value,
                            minHeight: 8,
                            backgroundColor: Colors.white24,
                            valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF06B6D4)),
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                         "${(_value * 100).toInt()}%",
                         style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                      )
                    ],
                  ),
                ),
              ),
          ],
        ),
      );
      }
    );
  }
}
