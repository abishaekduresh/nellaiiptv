## [1.4.1] - 2026-01-24

### Added
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
