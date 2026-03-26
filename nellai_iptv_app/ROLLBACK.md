# Player Rollback Instructions (MediaKit)

If the new player changes (or migration to `video_player`) cause issues on any devices, follow these steps to restore the original **MediaKit** implementation.

## 1. Restore Dependencies (`pubspec.yaml`)
Revert `pubspec.yaml` to include the following dependencies:
```yaml
dependencies:
  media_kit: ^1.1.10
  media_kit_video: ^1.2.4
  media_kit_libs_android_video: ^1.2.0
  # video_player: ^2.8.6 # Keep commented out if not used
```
Run `flutter pub get` after making changes.

## 2. Restore Initialization (`lib/main.dart`)
Ensure `MediaKit.ensureInitialized()` is called in the `main()` function:
```dart
import 'package:media_kit/media_kit.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  MediaKit.ensureInitialized(); // <--- This line must be present
  // ... rest of init
}
```

## 3. Restore TVPlayerController (`lib/core/tv_player_controller.dart`)
The `TVPlayerController` should use `media_kit`'s `Player` and `VideoController`. 
The original version included optimizations for Android TV (ARM chips) like:
- `setProperty('hwdec', 'auto')`
- `setProperty('vo', 'gpu')`
- `setProperty('video-sync', 'audio')`

## 4. Restore EmbeddedPlayer (`lib/screens/classic/embedded_player.dart`)
The `Video` widget should come from `media_kit_video`:
```dart
import 'package:media_kit_video/media_kit_video.dart';

// ...
Video(
  controller: _tvPlayer.videoController,
  fit: BoxFit.fill,
  controls: NoVideoControls,
)
```

## Original Settings Note
The original `TVPlayerController` used `androidAttachSurfaceAfterVideoParameters: false` in its `VideoControllerConfiguration`. If you see a black screen after rolling back, consider toggling this setting.
