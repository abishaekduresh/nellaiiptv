## [1.4.0] - 2026-01-24

### Added
- **Security**: Enabled `FLAG_SECURE` to prevent screenshots and screen recordings in mobile app.
- **Splash Screen**: Larger, animated logo with fade-in, scale, and shimmer effects.
- **TV Support**: Improved D-pad navigation for channel grid (Focus/InkWell).
- **Wakelock**: Implemented global wakelock to prevent screen sleep.
- **Watermark**: Responsive player watermark scaling.
- **API Error Handling**: Blocking UI for API errors (e.g. Unauthorized) with Retry option.

### Changed
- **Splash Screen**: Layout is now scrollable to prevent overflow on landscape devices.
- **Volume Control**: Removed software volume overrides. Player now relies strictly on system/hardware volume.
- **Icons**: Updated app launcher icons.
- **Player**: Watermark is now responsive to screen size.

### Fixed
- **Volume**: Fixed volume resetting to 100% on channel change.
- **Classic Screen**: Fixed syntax errors in grid builder and `Consumer` nesting.
- **Crash**: Fixed "Bottom Overflowed" on splash screen.
