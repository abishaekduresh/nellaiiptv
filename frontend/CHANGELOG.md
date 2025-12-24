# Frontend Changelog

All notable changes to the Nellai IPTV Frontend will be documented in this file.

## [1.8.0] - 2025-12-25

### Added
- **Premium Video Loader**: Replaced default spinner with a high-end "Dual Ring" animated loader featuring glowing gradients and theme-aligned colors (Cyan & Yellow).
- **Persistent Watermark**: Added a permanent, responsive watermark logotype (`png_logo.png`) to the video player. It adapts to screen size and remains visible in Fullscreen mode across all player variations (Classic & OTT).
- **OTT Mode Refinements**:
    - Reverted the OTT Channel Page player to use **Default Video.js Controls** for a distinctive "Embedded" feel, separating it from the Classic Mode's custom overlay.
    - Preserved specific custom features (like Watermark) while using native controls.

### Fixed
- **Trending Viewers Count**: Resolved an issue where "Top Trending" cards in Classic Mode displayed "0" viewers; now correctly pulls live data from the main channel list.
- **Fullscreen Watermark**: Fixed z-index and context issues that prevented the watermark from appearing when the player entered fullscreen mode.
- **Visual Contrast**: Improved text visibility for viewer counts and metadata on dark backgrounds.

## [1.7.0] - 2025-12-24

### Added
- **Advanced Classic Mode**:
    - Complete mobile interface redesign (compact layout, auto-scroll to player).
    - TV Native Navigation with directional arrow support and "Cycle Button" filtering.
    - Enhanced "Top Trending" section with 4-column desktop and 2-column mobile layout.
    - Flexbox-based player layout for perfect viewport fitting.
- **Improved Filter System**: 
    - Added "Group By Category" support with backend integration.
    - Implemented smart sorting for languages and categories (priority-based).
- **Responsive Ad Banner**: 
    - Adaptive ad sizing (90px mobile, 180px desktop).
    - Removed fixed aspect ratios for better mobile fit.

### Changed
- **UI/UX Optimizations**:
    - Unified player/details/ad layout in Classic Mode.
    - Improved focus visibility for TV users (rings, borders).
    - Smoother scrolling behaviors.
- **Dependencies**: Updated `Channel` interface to support categories.

## [1.6.0] - 2024-12-22

### Added
- **Unlimited Channel Loading**: Removed the hardcoded 100-channel limit. All channels are now fetched without a cap across all modes.
- **Classic Mode Optimization**: Classic Mode now fetches all available channels using the new `limit=-1` API parameter.
- **Category Fetching Updates**: Standardized data fetching on Language and State category pages to ensure all relevant channels are displayed.
- **Sidebar Synchronization**: The related channels sidebar on individual channel pages now uses `-1` limit for a more complete list.

### Fixed
- **Consistency in Data Fetching**: Replaced varied hardcoded limits with a unified unlimited fetching strategy.

## [1.5.0] - 2024-12-21

### Added
- **Classic Mode Mobile Responsiveness**: Improved layout for mobile devices in Classic Mode.
- **Toast Notifications**: Integrated global toast system for connectivity and action feedback.
- **Channel Reporting UI**: Added interface for users to report stream issues.
- **Contact Form**: Implemented contact page for user inquiries.
