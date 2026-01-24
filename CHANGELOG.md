## [1.4.2+3] - 2026-01-25

### Added
- **Full-Screen STB Overlay**: Multi-column channel navigation drawer available directly in full-screen mode (Left-side aligned).
- **TV Priority Navigation**: Autofocus for category selection and "All Channels" prioritized list.

### Changed
- **Persistent Player Stats**: Live viewer counts and ratings always visible in player.

### Fixed
- **Overlay Interaction**: Resolved bug where category clicks triggered overlay closure.
- **Build**: Finalized Android 15 stability and Kotlin versioning.

## [1.4.1+2] - 2026-01-24

### Added
- **Android 15 Compatibility**: Robust Edge-to-Edge support (Target SDK 35) with native FragmentActivity integration.
- **Near-Instant Switching**: Parallelized API fetching and player logic for zero-delay loading.
- **Session-Based Caching**: Fast thumbnail rendering with automatic per-launch cache clearing.
- **Enhanced Ad UX**: skeleton loading for both server response and image download phases.
- **TV Support**: Native `LEANBACK_LAUNCHER` and improved D-pad navigation.
- **Security**: Enabled screenshot prevention and secure `.env` signing.
- **Icons**: Updated project-wide application icons.

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
- **Build**: Resolved native Android build failures and synchronized versioning.
