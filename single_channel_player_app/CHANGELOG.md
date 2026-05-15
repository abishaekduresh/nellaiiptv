# Changelog

## [1.3.2] - 2026-05-15

### Changed
- **Package Identity**: Updated app package name to `com.nellaiiptv.buddhatv` across all platforms (Android, iOS, macOS, Windows, Linux).

## [1.3.1] - 2026-05-14

### Added
- **Auto-Reconnect**: Connectivity listener in `VideoPlayerScreen` automatically retries stream when internet is restored after a loss — no manual retry needed.
- **Double-Tap to Mute**: Double-tapping the video now toggles mute with overlay feedback, without toggling the control bar.

## [1.3.0] - 2026-05-14

### Added
- **Android TV Launcher**: Added `LEANBACK_LAUNCHER` intent filter — app now appears in Android TV home screen.
- **TV Detection**: Runtime detection of Android TV via Leanback feature flag (`_detectTV()`), used to conditionally hide phone-only UI.
- **Media Key Support**: TV remote Play / Pause / PlayPause keys now toggle stream playback.
- **D-pad Left/Right**: Arrow left/right now shows/hides the control bar (consistent with Select/Enter).
- **Focusable Exit Dialog**: Exit confirmation buttons wrapped in `FocusTraversalGroup` with `autofocus` on Cancel — navigable via TV remote D-pad.
- **Focusable Retry Button**: Error screen Retry button gets `autofocus: true` so TV remote can press it immediately.

### Fixed
- **Splash Orientation**: Removed portrait-only lock from splash screen — Android TV has no portrait mode and the lock caused compatibility issues.
- **PiP on TV**: PiP button is now hidden when running on Android TV where PiP is not applicable.

## [1.2.3] - 2026-02-12

### Added
- **Splash Animation**: Implemented entry animation for the logo on splash screen using `flutter_animate`.

## [1.2.2] - 2026-02-12

### Changed
- **Watermark Opacity**: Reduced opacity for better viewing experience.

## [1.2.1] - 2026-01-22

### Fixed
- **App Icon**: Resolved issue where App Icon was not updating by regenerating resources.
- **UI Polish**: Updated Exit Confirmation Popup to use a transparent background, aligning with the app's theme.
- **Signing**: Corrected release keystore configuration to resolve password mismatch and missing file issues.

## [1.2.0] - 2026-01-21

### Added
- **Refactor**: Project renamed from `mobile_app` to `single_channel_player_app`.
- **Intelligent View Counting**: 
    - App now waits for 10s of watch-time before counting a view (Session-base guarding).
    - Synchronized `decrement` logic with frontend for real-time viewer accuracy.
- **Consolidated Viewer Stats**: 
    - Displays Eye-icon viewer count and Average Star Rating in synchronized top-left overlay.
    - Added safety logic to hide overlay if data is missing, zero, or "0".
- **Hard Exit Behavior**: 
    - Uses `exit(0)` to ensure background processes are killed on dialog confirmation.
    - Forces Singleton app instance via `singleTask` launch mode in Manifest.
- **Session-Based Volume**: 
    - Saves original system volume on start and restores it when exited/backgrounded.
    - Remembers last-set in-app volume during active session.
- **Safe Gestures**:
    - Tap-to-Mute is restricted to the center 50% zone of the screen to avoid edge-tap conflicts.

### Fixed
- **PiP Recovery**: Robustly resets `_isPipMode` state and re-enters Landscape on app `resumed` lifecycle.
- **UI Smoothness**:
    - Prevented "Pause" state from triggering during PiP transition.
    - Hardened "Clean UI" by hiding Cast/PiP buttons, stats, and watermarks while in PiP.
- **Volume UI**: Re-enabled `AudioManager` init to ensure hardware buttons hide the native system slider.
- **Data Mapping**: Fixed `viewers_count_formatted` key mismatch to ensure live stats populate correctly.

## [1.1.1] - 2026-01-20

### TV & Legacy Support
- **TV Remote Navigation**: Integrated D-Pad support (`ArrowUp`/`ArrowDown` for Volume) to ensure full usability on Android TV/Firestick without touchscreens.
- **Legacy Android**: Verified `minSdkVersion` 21 to support devices as old as Android 5.0 (Lollipop).


### New Features
- **Pro Gesture Controls**: 
    - **Brightness**: Vertical swipe on the LEFT side of the screen.
    - **Volume**: Vertical swipe on the RIGHT side of the screen.
    - Visual feedback overlay with percentage.
- **Picture-in-Picture (PiP)**:
    - Added specialized PiP button.
    - Enabled `android:supportsPictureInPicture` in Manifest.
    - Background playback support via `simple_pip_mode`.

### UX
- **Immersive Player**: Removed on-screen Volume/Mute toggle button to reduce UI clutter and provide a more immersive viewing experience. Auto-play audio remains enabled.


### Maintenance
- **Backend Sync**: Verified image loading compatibility with Backend v1.20.2 adjustments.


### Changed
- **API Compatibility**: Verified compatibility with Backend v1.20.1 which adheres to absolute URL responses.

## [1.0.0] - 2026-01-20

### Added
- **Initial Release**: First stable version of the Royal TV Mobile App.
- **Core Features**:
    - HLS Video Playback support.
    - Custom Splash Screen with 3-second timer.
    - API Integration for fetching Channel URL and Logo.
- **UI Enhancements**:
    - **Stretch Mode**: Video fills screen (`BoxFit.fill`).
    - **Watermark**: 150px branding overlay.
    - **Audio**: Auto-play with Volume 1.0 and Mute Toggle.
- **Optimization**:
    - configured `android/app/build.gradle.kts` for R8 shrinking.
    - Added `proguard-rules.pro` to fix build warnings.
    - Implemented ABI splitting for smaller APKs.
