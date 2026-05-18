# Nellai IPTV App

A premium Flutter-based IPTV application built for Android TV and Mobile devices.

## Features

- **Live TV Streaming**: High-quality HLS streaming via MediaKit (MPV/ExoPlayer pipeline) with hardware decoding.
- **Classic TV Interface**: Grid-based channel selection optimized for D-pad remote controls.
- **Premium Content**: Secure handling of premium channels with status indicators.
- **Security**: Built-in screenshot and screen recording prevention.
- **Responsive Design**: Adapts to Mobile and TV landscape orientations.
- **Ads Integration**: Server-controlled ad rotation system.

## Version: 1.12.2+62
- **Fixed**: **TV Fast Start** — `cache-secs` 30 s → 5 s on TV; `cache-pause-initial=no`; first frame renders immediately without waiting to fill the cache.
- **Fixed**: **SD Green Lines** — Black background on player container; raw OpenGL surface no longer shows green behind 4:3 content.
- **Fixed**: **SD Stretching** — `video-aspect-override=-1` strips codec DAR so `BoxFit.fill` stretches SD content to fill the screen.
- **Fixed**: **HD / FHD Fallback** — Restored `cache-pause` default so buffer underruns pause and rebuffer instead of triggering stall-timer fallback. Buffer sizes raised to 96 MB (TV) / 64 MB (Mobile); `cache-secs` 15 s / 10 s; `demuxer-readahead-secs` 15 s / 10 s.
- **Fixed**: **Stall Timer** — TV 15 s → 30 s, Mobile 30 s → 45 s; prevents premature fallback during HD rebuffering.

## Version: 1.12.1+61
- **Fixed**: **HLS ABR** — Removed `hls-bitrate=max` for all devices; MPV default ABR now used on both TV (WiFi at distance) and mobile (cellular) to prevent stalls and failed starts.
- **Fixed**: **Mobile Cache** — Reverted mobile `cache-secs` to 20 s; 40 s caused slow perceived start due to aggressive pre-buffering.

## Version: 1.12.0+60
- **Key Features**: MediaKit re-migration, API-gated hardware decoding, quality boost, first-frame preloader, stall-triggered fallback.
- **Changed**: **Player Engine** — Re-migrated from `video_player` back to **MediaKit** for full MPV-level HLS control.
- **Added**: **Hardware Decoding** — `hwdec=auto` (API 26+), `hwdec=mediacodec-copy` (API 23–25), software fallback (API < 23). Each property is individually try-caught.
- **Added**: **Buffer Tuning** — 64 MB demuxer cache on TV, 32 MB on Mobile; mobile timeout 60 s, stall timer 30 s.
- **Added**: **Quality Boost** — `ColorFiltered` 1.08× contrast matrix + `FilterQuality.high` at the Flutter compositor level.
- **Added**: **First-Frame Preloader** — Loading spinner stays until `stream.width > 0` (first decoded frame).
- **Added**: **Stall Timer Fallback** — 30 s mobile / 15 s TV timer triggers fallback MP4 when HLS stalls silently.
- **Fixed**: **Dispose Cleanup** — All timers and stream subscriptions cancelled in `dispose()`.

## Version: 1.11.0+59
- **Key Features**: Feedback System.
- **Added**: **Feedback Screen** - Full feedback UI with type selector, star rating, issue type, and message. TV D-Pad support.
- **Added**: **`submitFeedback` API** - Posts to `POST /feedback` with auth token.
- **Added**: **Profile → Feedback Button** and **Settings → Feedback Section**.

## Version: 1.10.0+58
- **Key Features**: Forgot Password Flow, Responsive Classic Screen Header.
- **Added**: **Forgot Password Screen** - New `ForgotPasswordScreen` with email input, math captcha security check, loading state, success confirmation, and error display.
- **Added**: **Login → Forgot Password Link** - "Forgot Password?" `TextButton` on `LoginScreen`, right-aligned below the password field.
- **Added**: **`forgotPassword` API Method** - `ApiService.forgotPassword(String email)` POSTs to `/customers/forgot-password`.
- **Fixed**: **Responsive Classic Screen Header** - `LayoutBuilder` with `isCompact`/`isMedium`/normal breakpoints eliminates header element overlap on small devices. Logo, fonts, and button labels all scale down gracefully.

## Version: 1.9.2+51
- **Key Features**: App Version Display in Settings, Deep Link Share Code Support, Bug Fix.
- **Added**: **App Version Display** - Settings screen now shows the running app version pinned at the bottom center in a subtle muted style.
- **Added**: **Deep Link Share** - `app_links` integration handles incoming `nellaiiptv://channels/share/{code}` and HTTPS deep links; auto-plays the matching channel on launch.
- **Fixed**: **Toast Named Param** - Fixed `ToastService.show()` call in `ClassicScreen` using named `type:` parameter.

## Version: 1.9.1+50
- **Key Features**: Share code feature (not published separately — combined into 1.9.2+51).

## Version: 1.9.0+49
- **Key Features**: Migration to VideoPlayer (ExoPlayer) for Android TV stability.
- **Added**: **Player Migration** - Migrated the core playback engine to ExoPlayer to resolve compatibility issues on Zebronics and other low-end STBs.
- **Improved**: **Null Safety** - Hardened the UI with comprehensive null-safety guards.

## Version: 1.8.27+44
- **Key Features**: Storage Management, Enhanced Channel Search, Settings Screen channel ordering, D-Pad support.
- **Added**: **Storage Management** - Implemented a built-in "Clear Image Cache" utility using `flutter_cache_manager` inside the Settings Screen so users can reclaim device memory on low-end STBs.

## Version: 1.8.26+43
- **Key Features**: Enhanced Channel Search, Settings Screen channel ordering, D-Pad support, TV Stream Crash Prevention.
- **Added**: **Enhanced Channel Search** - Users can search the application using a physical or digital keyboard to filter channels by both Name and native Channel Number. Active searches re-order to numerical bounds dynamically.

## Version: 1.8.25+42
- **Key Features**: Settings Screen channel ordering, D-Pad support, TV Stream Crash Prevention.
- **Added**: **Settings Screen** - Implemented a TV-optimized settings screen allowing users to toggle channel sorting between Random (Default) and Channel Number Order with local persistence.
- **Fix**: **TV Stream Crash Prevention** - Added synchronous flushing and demuxer stops during channel changes to prevent out-of-memory crashes on low-end Android TVs.

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
- **Player**: MediaKit (MPV / ExoPlayer pipeline via `media_kit`, `media_kit_video`, `media_kit_libs_android_video`)
- **State Management**: Provider
- **Networking**: Dio
- **Animation**: Flutter Animate

## Getting Started

1.  **Environment**: Ensure `.env` is configured with `API_BASE_URL` and `API_KEY`.
2.  **Run**: `flutter run` (Landscape mode enforced).
