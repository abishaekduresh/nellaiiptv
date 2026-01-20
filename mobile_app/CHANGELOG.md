# Changelog

## [1.2.0] - 2026-01-21

### Added
- **Session-Based Volume**: 
    - App now saves original system volume on start.
    - Automatically restores original system volume when backgrounded or exited.
    - Remembers last-set in-app volume during active session.
- **Viewer Stats**: 
    - Integrated `viewers_count_formated` from API.
    - Added Top-Left display within safe areas.
    - Integrated with PiP logic to auto-hide.
- **Dynamic Branding**:
    - App title in exit dialog dynamically reads from `APP_NAME` in `.env`.
- **Safe Gestures**:
    - Tap-to-Mute is now restricted to the center 50% zone of the screen.
    - Edge taps strictly toggle the Cast/PiP controls.

### Fixed
- **PiP Smoothness**:
    - Prevented "Pause" state from triggering during PiP transition (optimistic state).
    - Hardened "Clean UI" by hiding Cast/PiP buttons and watermarks while in PiP.
- **Volume UI**: Re-enabled `AudioManager` init to ensure hardware buttons hide the native system slider.

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
