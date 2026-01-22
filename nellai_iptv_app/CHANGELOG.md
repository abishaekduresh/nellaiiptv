# Changelog

All notable changes to the Nellai IPTV Main App will be documented in this file.

## [1.3.0] - 2026-01-23
### Added
- **Classic UI (Multi-Pane Layout)**:
    - Dedicated orientation lock to **Landscape-Only**.
    - Split-screen architecture: 60% Player Panel, 40% Interactive Grid.
    - Cascading entry animations for channel cards.
    - Selection effects with scale and glow animations.
- **Enhanced Player Controls**:
    - **Double-Tap Fullscreen**: Seamlessly toggle between split-view and true fullscreen.
    - **Picture-in-Picture (PiP)**: Full support for background/overlay playback on Android.
    - **Visual Stats**: Moved View Counts and Rating stats to optimized overlay positions (View Count: Top-Left, PiP: Top-Right).
- **UX Improvements**:
    - **Tap-to-Toggle Category**: Replaced dropdown with a sleek toggle button for switching grouping modes (Categories vs Languages).
    - **Horizontal Scrolling**: Native x-axis scrolling for category chips.
    - **Centered Thumbnails**: Improved visual balance in channel cards.
- **Android Support**:
    - Enabled `android:supportsPictureInPicture` in `AndroidManifest.xml`.

### Changed
- Refactored `PulseLoader` to use a high-end ripple effect loader (synced with single channel player aesthetic).
- Reduced height of Channel Information banner and Stats Box for better vertical space utilization.
- Increased Ad Banner height to 100px for improved visibility.

## [1.0.0] - 2026-01-20
### Added
- Initial release of the production-ready Multi-Channel Classic App.
- Core architecture for HLS streaming and device profiling.
