# Frontend Changelog

All notable changes to the Nellai IPTV Frontend will be documented in this file.

## [1.31.0] - 2026-01-26

### Added
- **Smart Fallback System**: Implemented automatic fallback to MP4 video for HLS stream errors and connection timeouts (20s).
- **Auto-Recovery**: Added background monitoring with a 20s countdown for automatic reconnection attempts.
- **Classic Mode Menu**: TV-optimized side navigation menu featuring Login, Register, Profile, Devices, About, and Contact pages.
- **Responsive Recovery**: Centered recovery button with real-time countdown for manual and automatic stream restoration.

### Improved
- **Player Aesthetics**: Removed technical "Playback Error" overlays during fallback playback for a cleaner broadcast experience.
- **Privacy & Security**: Sanitized client-side logs to prevent exposure of HLS URLs and internal system states.

### Fixed
- **Cleanup Persistence**: Fixed video element state management when switching between broken HLS streams and fallback MP4.

## [1.30.2] - 2026-01-20

### Maintenance
- **Backend Sync**: Verified compatibility with Backend v1.20.2 to ensure consistent image loading in production environments.


### Changed
- **URL Resolution**: Removed `resolveImageUrl` logic entirely. The frontend now consumes fully qualified absolute URLs (`logo_url`, `thumbnail_url`) directly from the backend, improving performance and simplifying the codebase.
- **Cleanup**: Removed unused relative path properties from `Channel` interfaces (`logo_path`, `thumbnail_path`).


### Fixed
- **Image URL Resolution**: Implemented `resolveImageUrl` to ensure thumbnails, logos, and watermarks load correctly in production by dynamically prepending the backend `API_URL`.
- **Branding Consistency**: Standardized `useBranding` to support both `logo_path` and `logo_url`, fixing potential breakages after backend schema normalization.

## [1.29.0]
- **API Key Manager**: GUI for managing secure API access keys.

## [1.28.1] - 2026-01-19

### Fixed
- **Refresh Flash**: Eliminated the brief "White Flash" or default OTT layout flicker when refreshing the page in Classic Mode. Implemented a strict hydration gate in `LiteRouteGuard` that waits for the view mode to be fully initialized before rendering.

## [1.28.2] - 2026-01-19

### Added
- **Channel Branding**: Added "Channel Logo" upload support in `ChannelForm`.
- **Visual Feedback**: Added instant image preview for uploaded channel logos.

### Fixed
- **Upload Reliability**: Fixed `Content-Type` header issue in `adminApi.ts` that caused silent upload failures.

## [1.28.0] - 2026-01-19

### Added
- **Hybrid Responsive Player**: 
    - Implemented a smart hybrid layout for the player overlay.
    - **Large Screens**: Controls are strictly centered for aesthetics.
    - **Tablet/Mobile**: Controls switch to a flex layout to guarantee zero overlap.
    - **Side Constraints**: Added width constraints to side panels to prevent them from bleeding into the playback controls.
- **Immersive Classic Mode**:
    - **Layout Cleanup**: Removed the standard web `Navbar` and `Footer` when in 'Classic' mode.
    - **True Fullscreen**: The application now offers a native TV-like experience without web navigation clutter.

### Fixed
- **Classic Mode Blank Screen**: Resolved a race condition in `ViewModeContext` where the app initialized in 'OTT' mode before switching to 'Classic', causing a render failure.
- **State Recovery**: Fixed a bug in `ClassicHome` where it failed to recover from a null channel state on page refresh.

## [1.17.0] - 2026-01-07

### Added
- **Dynamic Branding**: Implemented Logo Upload feature in Admin Settings.
- **Dynamic Favicon**: Application favicon now updates automatically based on the uploaded logo.
- **Trending Channels Graph**: Added a dynamic chart in Admin Dashboard showing trending channels with filters (Category, Language, Limit).
- **Classic Mode Branding**: Updated Classic Mode to display the custom uploaded logo.

### Fixed
- **Logo Proxy**: Configured Next.js rewrites to correctly serve uploaded images from the backend.

## [1.16.0] - 2026-01-07

### Added
- **Smart HLS Optimization**: Integrated an advanced device profiling engine into the video player.
- **Adaptive Configuration**: The player now automatically detects the device type (TV, Mobile, Desktop) and applies tailored HLS configurations:
    - **TV Mode**: Aggressive buffering (30s) enabled; `capLevelToPlayerSize` disabled to reduce CPU overhead; 720p cap maintained.
- **Overlay Performance**: Optimized `PlayerOverlay` to unmount hidden channel lists, reducing DOM nodes by 90% in Classic Mode.
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
