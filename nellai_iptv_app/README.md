# Nellai IPTV App

A premium Flutter-based IPTV application built for Android TV and Mobile devices.

## Features

- **Live TV Streaming**: High-quality streaming with MediaKit player.
- **Classic TV Interface**: Grid-based channel selection optimized for Remote controls.
- **Premium Content**: Secure handling of premium channels with status indicators.
- **Security**: Built-in screenshot and screen recording prevention.
- **Responsive Design**: Adapts to Mobile and TV landscape orientations.
- **Ads Integration**: Server-controlled ad rotation system.

## Version: 1.8.24+41
- **Key Features**: Scrolling Ads Marquee.
- **Added**: **Scrolling Ads Marquee** - Implemented a dynamic scrolling text ticker in the Classic screen to display server-controlled advertisements with customizable scroll speed and repeat counts.
- **Maintenance**: Version synchronized with latest Backend/Website updates.

## Version: 1.8.23+40
- **Key Features**: Comment Count Badge, HD TV Player Optimization, Fix Focus Errors.
- **Added**: **Comment Count Badge** - Added visual notification badge on the channel details comments icon showing the total number of comments for a channel.
- **Optimization**: **HD TV Playback** - Added aggressive optimizations to MediaKit/FFmpeg properties to ensure smooth Full HD playback on low-end TV processors.
- **Fix**: **TV Player Highlight** - Fixed issue where the cyan player focus border wouldn't trigger correctly when navigating the UI with a D-Pad.

## Version: 1.8.22+39
- **Key Features**: RTMP URL Support.
- **Maintenance**: Version synchronized with latest Backend/Website updates.

## Version: 1.8.19+35
- **Key Features**: TV Playback Optimization, Hardware-Aware Profiling, Branding Update.
- **Added**: **TV Playback Optimization** - Improved smoothness on low-end hardware using memory detection and FFmpeg tuning.
- **Branding**: Integrated dynamic app name loading from environment variables.

## Version: 1.8.18+34
- **Key Features**: Player Focus Fixes, Correct Selection State.
- **Fix**: **Player Focus** - Resolved issue where first channel was incorrectly selected after fullscreen exit.

## Version: 1.8.17+33
- **Key Features**: Global Version Sync, Infrastructure Compatibility.
- **Maintenance**: Version synchronized with Website and Backend updates for channel export features.

## Version: 1.8.16+32

## Version: 1.8.15+31
- **Key Features**: STB Info Overlay, TV Focus Fixes, Fullscreen Logic.
- **Feature**: **STB Info Overlay** - Set-Top Box style channel info banner in fullscreen.
- **Fix**: **TV Focus** - Resolved "OK" button system overlay conflicts.

## Version: 1.8.14+30
- **Key Features**: Device Initialization, Splash Screen Improvements, Enhanced Compatibility.
- **Feature**: **Device Utilities** - Centralized device initialization for better compatibility.
- **Improvement**: **Startup Flow** - Enhanced splash screen with device-specific initialization logic.

## Version: 1.8.13+29
- **Key Features**: D-Pad Navigation Fixes, Focus Enhancements, Build Repairs.
- **Fix**: **Build Repair** - Fixed `Member not found: 'center'` compiler error.
- **Fix**: **Play Store Rejection** - Resolved missing D-Pad functionality on Login/Register screens.
- **Feature**: **Focus Enhancements** - Improved D-Pad support for Channel Modal, Ratings, and Profile.

## Version: 1.8.10+26
- **Key Features**: Focus Persistence, TV Auth support, Server-side Ratings.
- **Feature**: **TV Navigation** - Persistent focus nodes prevent selection loss; Login/Register screens fully D-pad accessible.
- **UI**: **Unified Theme** - Dark theme for Rating/Logout dialogs.

## Version: 1.8.8+24
- **Key Features**: Extended Device Support, Legacy Compatibility.
- **Fix**: **Compatibility** - Restored support for devices without specific hardware sensors.
- **Fix**: **Support** - Ensured Android 5.0+ (API 21) compatibility.

## Version: 1.8.7+23
- **Key Features**: Premium Exit Dialog, Fixed TV Navigation.
- **Feature**: **Exit Dialog** - Redesigned confirmation screen with focus support for TV.
- **Fix**: **Navigation** - Resolved D-Pad grid navigation and Player focus handling.

## Version: 1.8.6+22
- **Key Features**: Stability Fixes, Syntax Resolution.
- **Fix**: Resolved critical class structure issues in Classic Mode.
- **Fix**: Removed invalid key bindings for better compilation.

## Version: 1.8.5+21
- **Key Features**: Channel Report System, Fullscreen D-pad Navigation, Enhanced TV Controls.
- **Report Issues**: Flag button in player allows reporting stream problems with TV-friendly dialog.
- **Channel Zapping**: D-pad Up/Down switches channels in fullscreen mode.
- **Overlay Navigation**: D-pad Left/Right toggles channel list in fullscreen.

## Version: 1.8.4+20
- **Key Features**: Remote Shortcuts (STB Menu), Cleaner Player UI, Native Crash Fix.
- **TV Support**: Added 'Menu', 'Info', 'Guide' key support for shortcuts.
- **Stability**: Fixed FFI crashes on hot restart.

## Version: 1.8.3+19
- **Key Features**: TV Search Fixes, Fullscreen Exit Reliability, Focusable Ads, Focus Stability.
- **TV Search**: Resolved input issues by binding "Select" key to keyboard display.
- **Navigation**: Enhanced DPad focus for Ads and fixed focus stealing bugs.

## Version 1.6.2+12 Highlights

- **Force Update**: Strict enforcement ensuring users are on the latest version by exiting if updates are denied.
- **TV Build Fix**: Resolved Android TV build issues with missing banner resources.

## Version 1.6.1+11 Highlights

- **Service Sync**: Full compatibility with the refined Open Access Kiosk Mode and enhanced backend diagnostic systems.

## Version 1.5.3 Highlights

- **TV Remote Compatibility**: Fully focusable interface elements (Ads, Buttons) with D-Pad navigation support.
- **Smart Focus**: "Retry" button automatically captures focus on error screens.

## Version 1.5.2 Highlights

- **MP4 Fallback Player**: Enhanced fallback reliability using direct MP4 streams (`fallback_404_mp4_url`) instead of HLS.
- **Instant Fallback**: Zero-delay switching to fallback video when main stream fails.
- **Clickable Ads**: Banner ads in Classic Mode now redirect to external URLs on tap.
- **Auto-Countdown**: "Retry" button automatically triggers after 20 seconds.
- **Refined Layout**: Optimized Classic Mode split (50/50) and theming (Cyan accents).

## Version 1.5.1 Highlights

- **Broad Device Support**: Optimized manifest to support legacy/specialized Android TV boxes without WiFi or geolocation hardware.
- **HLS Fallback Player**: Smart error recovery that switches to a default video feed if a channel goes offline (404/Connection Error).
- **Auto-Retry UI**: "Retry Connection" button with pulse animation appears during fallback for manual recovery.
- **Connectivity Monitoring**: Real-time "Offline"/"Online" status alerts to keep users informed of their network state.
- **Play Store TV Compliance**: Configuration updates for full Android TV Store approval (Banner, Manifest, Leanback).



- **Persistent Navigation**: STB Menu remembers your last category for faster browsing.
- **Refined Player UI**: Minimalist stats overlay and improved gesture reliability.
- **Full-Screen STB Overlay**: Setup Box style channel navigation directly in the full-screen player (Left-side aligned).
- **Persistent Metadata**: Live viewer counts and ratings permanently visible during playback.
- **TV Priority Navigation**: "All Channels" grouped list with autofocus for D-Pad remotes.
- **Android 15 Ready**: Full Edge-to-Edge support (Target SDK 35) with modern native integration.
- **Near-Instant Switching**: Parallel API/Player logic for zero-delay channel loading.
- **Session-Based Caching**: High-speed thumbnail caching with automatic startup reset.
- **Enhanced Ad UX**: Dual-level skeleton loading for API calls and image downloads.
- **Security**: Screenshot/Recording prevention and secure `.env` signing.

## Tech Stack

- **Flutter**: ^3.32.6
- **Player**: MediaKit
- **State Management**: Provider
- **Networking**: Dio
- **Animation**: Flutter Animate

## Getting Started

1.  **Environment**: Ensure `.env` is configured with `API_BASE_URL` and `API_KEY`.
2.  **Run**: `flutter run` (Landscape mode enforced).
