## [1.8.0+16] - 2026-01-30

### Added
- **TV Optimization**: Hybrid Grid rendering using `GridView.builder` for liquid-smooth directional navigation on STB remotes.
- **MediaKit Tweaks**: Custom property injection (`cache-pause`, `demuxer-max-bytes`) for optimized playback stability on Android TV.

### Changed
- **Ad Placement**: Grid-based ads removed to prioritize navigation speed; bottom banner ads retained for clean UX.

### Fixed
- **Loading Latency**: Removed redundant pre-playback Dio checks, reducing channel switch time by ~2 seconds.
- **Black Screen**: Standardized `Player.stop()` and state reset timing to prevent visual hangs during channel transitions.

## [1.7.1+15] - 2026-01-30

### Added
- **Full-Screen TV Toggle**: Dedicated focusable button in playback controls for easy entry/exit of full-screen mode on TV remotes.
- **System UI Management**: Improved logic to hide/restore status and navigation bars using `immersiveSticky` mode for a cleaner TV experience.

### Fixed
- **Volume Persistence**: Resolved issue where system volume would reset to 100% when switching channels; volume now persists throughout the session.
- **Mute Persistence**: Mute state is now handled globally, ensuring a channel remains muted even after switching to another one.
- **UI Interaction**: Refined tap handlers in Classic Mode to prevent overlapping menu layers on TV screens.

## [1.7.0+14] - 2026-01-30

### Added
- **Number Key Navigation**: Direct channel switching using the remote control numeric keypad (0-9) with multi-digit support (1.5s buffer).
- **Visual Input Overlay**: Large animated indicator in the top-right corner to show typed channel numbers.
- **Backend Health Check**: Mandatory system availability check on startup with retry logic and full-screen blocking error UI.
- **UI Animations**: Integrated `flutter_animate` for smoother transitions and polished error screen feedback.

### Changed
- **UI Polish**: Updated channel card thumbnail loader to `CupertinoActivityIndicator` for a premium tick-spinner look.
- **UI Polish**: Removed skeleton shimmers from channel cards for a cleaner loading experience.
- **Branding**: Classic Screen header now dynamically loads the backend logo with a local asset fallback.

### Fixed
- **Sorting**: Channels, Categories, and Languages now respect the `order_number` priority set in the backend.

## [1.6.2+13] - 2026-01-29

### Added
- **TV Navigation**: Enhanced D-Pad support for STB Overlay ("Enter" key capture) and Embedded Player controls (PiP/Retry buttons).
- **UI**: Added View Count and Star Rating display to the Classic Screen channel details banner.
- **Layout**: Dynamic Ad Banner layout that maximizes player height when no ads are loaded.

### Changed
- **UX**: "Refresh" button now triggers a full content sync (Settings + Channels + Ads) instead of just channels.

## [1.6.2+12] - 2026-01-29

### Added
- **Force Update**: Implemented strict update enforcement. The app now exits if a mandatory Play Store update is declined by the user.
- **TV Banner**: Added missing `tv_banner` resource to fix Android TV build failures.

## [1.6.1+11] - 2026-01-28

### Added
- **Maintenance**: Version synchronization with Frontend v1.38.0 and Backend v1.27.0.
- **Improved**: System stability and API response handling in alignment with recent backend logging improvements.

## [1.6.1+10] - 2026-01-27

### Added
- **API Optimization**: Synchronized with Backend v1.22.0 for improved session and plan reliability.

## [1.6.0+9] - 2026-01-27

### Added
- **Global Sync**: Coordinated release with Frontend v1.32.0 and Backend v1.21.0.

## [1.5.3+8] - 2026-01-26

### Added
- **TV Focus**: Upgraded Classic Mode Banner Ads with `InkWell` for full D-Pad support and visual focus states (Cyan highlight).
- **UX**: Added `autofocus` to the "Retry Connection" button, ensuring immediate remote control accessibility during playback errors.

## [1.5.2+7] - 2026-01-25

### Added
- **MP4 Fallback**: Replaced HLS fallback with MP4 (`fallback_404_mp4_url`) for better compatibility.
- **Instant Fallback**: Logic optimization to hide loading spinner immediately when switching to fallback video.
- **Clickable Ads**: Left panel banner ads now redirect to external URLs (`redirect_url`) via system browser.
- **Countdown**: "Retry" button now features an auto-countdown (20s) before automatic reload.

### Fixed
- **In-App Update**: Disabled update checks in Debug mode to prevent `Install Error(-10)`.
- **UI Styling**: Updated Retry button color to Cyan (`0xFF06B6D4`) to match app theme.
- **Layout**: Balanced Classic Screen layout to 50/50 split (Player/List).
- **UX**: Hidden viewer count overlay when playing fallback video to reduce clutter.

## [1.5.1+6] - 2026-01-25

### Fixed
- **Device Support**: Restored compatibility for 7+ device models (Ethernet-only TV boxes) by making WiFi/Location hardware requirements optional.

## [1.5.0+5] - 2026-01-25

### Added
- **Fallback Player**: Robust HLS fallback mechanism with race-condition handling and "Retry Connection" UI for seamless playback recovery.
- **TV Store Compliance**: Added `LEANBACK_LAUNCHER` intent, TV banner assets, and touch-screen indepedence flags.
- **Connectivity Monitoring**: Real-time internet status alerts (Toast with animation) and auto-recovery/retry logic.
- **UI Refinements**: Responsive "Retry" button with pulse animation and adaptive sizing for embedded vs. full-screen modes.

## [1.4.3+4] - 2026-01-25

### Added
- **State Persistence**: STB Navigation now remembers the last selected category and restores it upon reopening.
- **Real-Time Sync**: Player now instantly synchronizes fresh channel data (ratings/view counts) back to the Classic Screen "Channel Info" banner.

### Changed
- **Minimal UI**: Redesigned the player's view count and rating overlay to be smaller and less intrusive (12px icons).
- **View Logic**: Backend view count formatting updated to strict integer math for consistent "+K" suffixes.

### Fixed
- **Interaction Blockers**: Hoisted `GestureOverlay` to the top level, fixing issues where loading/error screens blocked STB navigation gestures.
- **Stability**: Fixed syntax errors in `EmbeddedPlayer` related to premium content logic.

## [1.4.2+3] - 2026-01-25

### Added
- **Full-Screen STB Overlay**: Premium set-top box style navigation drawer (Left-side aligned) for browsing categories and channels seamlessly.
- **TV Priority Navigation**: "All Channels" is now the default first category with automatic focus for D-Pad/Remote controls.

### Changed
- **Persistent Player Stats**: Viewer counts and ratings are now visible at all times in the player interface, regardless of control state.

### Fixed
- **Overlay Stability**: Fixed a bug where interacting with the category list would prematurely hide the navigation overlay.
- **Touch Interaction**: Improved touch target responsiveness for mobile users within the STB overlay.
- **Build**: Resolved native Android build failures and synchronized versioning.

## [1.4.1+2] - 2026-01-24

### Added
- **Android 15 Compatibility**: Implemented `EdgeToEdge` support (Target SDK 35) and migrated to `FlutterFragmentActivity` for robust modern system integration.
- **Near-Instant Switching**: Parallelized API fetching and player initialization for zero-delay channel loading.
- **Session-Based Caching**: Integrated `CachedNetworkImage` for thumbnails & ads with automatic per-session cache clearing on app startup.
- **Enhanced Ad UX**: Dual-level skeleton loading logic (API level + Image byte download state).
- **TV Support**: Added `LEANBACK_LAUNCHER` intent and improved D-pad navigation.
- **Security**: Enabled `FLAG_SECURE` for screenshot/recording prevention.
- **Icons**: Regenerated high-resolution app launcher icons.

### Changed
- **Build**: Migrated Android signing configuration to `.env` variables for better security (removed `key.properties`).
- **Splash Screen**: Layout is now scrollable to prevent overflow on landscape devices.
- **Volume Control**: Removed software volume overrides. Player now relies strictly on system/hardware volume.
- **Icons**: Updated app launcher icons.
- **Player**: Watermark is now responsive to screen size.

### Fixed
- **Volume**: Fixed volume resetting to 100% on channel change.
- **Classic Screen**: Fixed syntax errors in grid builder and `Consumer` nesting.
- **Crash**: Fixed "Bottom Overflowed" on splash screen.
- **Build**: Fixed compilation errors on Android 15 by upgrading native activity base class and resolving Kotlin version conflicts.
- **Deployment**: Incremented version code to 2 to resolve Play Store upload conflicts.
