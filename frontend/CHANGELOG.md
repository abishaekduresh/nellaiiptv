# Frontend Changelog

All notable changes to the Nellai IPTV Frontend will be documented in this file.

## [1.16.0] - 2026-01-07

### Added
- **Smart HLS Optimization**: Integrated an advanced device profiling engine into the video player.
- **Adaptive Configuration**: The player now automatically detects the device type (TV, Mobile, Desktop) and applies tailored HLS configurations:
    - **TV Mode**: Aggressive buffering (30s) enabled; `capLevelToPlayerSize` disabled to reduce CPU overhead; 720p cap maintained.
    - **Mobile Mode**: Balanced settings (up to 1080p, moderate buffer) optimized for battery and stability.
    - **Desktop Mode**: High-performance settings (up to 4K, large buffer) for maximum quality.
- **Resolution Capping**: Automatically limits maximum resolution based on device capabilities to ensure smooth playback.

## [1.15.0] - 2026-01-07

### Added
- **Registration Security**: Implemented Math Challenge Captcha ("5 + 3 = ?") to prevent automated spam on the registration page.
- **Enhanced Registration UI**: Complete visual redesign of the Sign-Up page with a modern 2-column layout and improved input states.
- **Strict Validation**: Added real-time client-side regex validation for phone numbers (exact 10 digits) and email addresses.

### Fixed
- **Admin Login**: Fixed "Duplicate identifier" build error in `admin/page.tsx` that caused compilation failures.

## [1.14.0] - 2026-01-07

### Added
- **Backend Disconnect Fallback**: Automatic fail-safe that switches from "Classic Mode" to "OTT Mode" if the backend becomes unreachable, ensuring the app remains usable.
- **Improved Diagnostics**: `BackendHealthCheck` now provides detailed error messages for connection failures (404, Network Error, etc.).

### Fixed
- **Login Loop**: Resolved an infinite redirect loop in `ClassicModeGuard` and `api.ts` that occurred when a 401 error happened on the login page.
- **Vercel Deployment**: 
    - Updated `ClassicModeGuard` to handle trailing slashes and subpaths correctly.
    - Adjusted `backend/public/index.php` (backend fix) to correctly calculate base paths in production environments.


## [1.13.0] - 2026-01-06

### Added
- **API Key Integration**: Implemented `X-API-KEY` header injection in all Axios requests (`api.ts`, `adminApi.ts`) using `NEXT_PUBLIC_API_SECRET`.
- **Security Config**: Updated `.env.local` to require `NEXT_PUBLIC_API_SECRET` and match backend WAMP structure (`/backend/api`).

### Fixed
- **Admin Login**: Resolved 401 Unauthorized errors by ensuring `adminApi.ts` correctly sends the API Key.
- **Backend Connection**: Fixed "Could not connect to backend" errors caused by incorrect API URL and missing API Key.

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
