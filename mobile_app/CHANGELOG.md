# Changelog

## [1.0.2] - 2026-01-20

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
