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
