# Changelog

All notable changes to this project will be documented in this file.



## [Frontend 1.16.0] - 2026-01-07
### Added
- **Smart HLS Optimization**: Integrated an advanced device profiling engine into the video player.
- **Adaptive Configuration**: The player now automatically detects the device type (TV, Mobile, Desktop) and applies tailored HLS configurations (Buffer size, Start level, etc.).
- **Resolution Capping**: Automatically limits maximum resolution based on device capabilities (720p for TV safety, 4K for PC).

## [Frontend 1.15.0] - 2026-01-07
### Added
- **Registration Security**: Implemented Math Challenge Captcha ("5 + 3 = ?") to prevent automated spam on the registration page.
- **Enhanced Registration UI**: Complete visual redesign of the Sign-Up page with a modern 2-column layout and improved input states.
- **Strict Validation**: Added real-time client-side regex validation for phone numbers (exact 10 digits) and email addresses.

### Fixed
- **Admin Login**: Fixed "Duplicate identifier" build error in `admin/page.tsx`.

## [Backend 1.11.0] - 2026-01-07
### Added
- **JSON Body Parsing**: Enabled `BodyParsingMiddleware` in `public/index.php`. This fixes issues where JSON request bodies (like in Admin Login) were not being parsed correctly, leading to validation failures.
- **Enhanced Validation**: Updated `AuthController::register` to enforce strict patterns:
    - **Phone**: Must be exactly 10 digits (`lengthMin: 10`, `lengthMax: 10`).
    - **Email**: Validated for correct email format and presence.

## [Frontend 1.14.0] - 2026-01-07
### Added
- **Backend Disconnect Fallback**: Automatic fail-safe that switches from "Classic Mode" to "OTT Mode" if the backend becomes unreachable.
- **Improved Diagnostics**: Enhanced error reporting in `BackendHealthCheck` for network and config issues.

### Fixed
- **Login Loop**: Resolved infinite redirect loop in `ClassicModeGuard` and `api.ts`.
- **Vercel Deployment**: Updated routing guards to handle trailing slashes and subpaths in production.

## [Backend 1.10.1] - 2026-01-07
### Fixed
- **Base Path Calculation**: Updated `public/index.php` to correctly handle `/public` in the URL path, resolving 404 errors in certain deployment environments (e.g., local WAMP, Vercel).

## [Frontend 1.13.0] - 2026-01-06
### Added
- **API Key Integration**: Implemented `X-API-KEY` header injection in all Axios requests (`api.ts`, `adminApi.ts`) using `NEXT_PUBLIC_API_SECRET`.
- **Security Config**: Added `.env.local` requirement for `NEXT_PUBLIC_API_SECRET`.

## [Backend 1.10.0] - 2026-01-06
### Added
- **API Security Suite**:
  - `ApiKeyMiddleware`: Enforces `X-API-KEY` validation on all public endpoints.
  - `RateLimitMiddleware`: Limits requests to 100 per minute per IP using file-based cache.
  - `SecurityHeadersMiddleware`: Injects HSTS, X-Frame-Options, and X-XSS-Protection headers.
- **CORS Handling**: Enhanced `index.php` with an "Early Exit" strategy for `OPTIONS` requests to guarantee preflight success.

### Fixed
- **Critical Middleware Order**: Fixed 500 Internal Server Errors by ensuring `addRoutingMiddleware()` runs *before* `CorsMiddleware` (executed last in LIFO stack).
- **Channel Deletion**: Updated `ChannelService` to perform hard deletes instead of soft deletes for channels.
- **Customer Deletion**: Updated `CustomerController` to correctly handle soft deletes (`status = 'deleted'`) and filter them out in lists.
- **Admin Password**: Fixed admin password update logic (though user context was primarily focused on API Security).

## [Frontend 1.12.0] - 2026-01-06
### Added
- **Dynamic DOM Title**: Browser tab title now updates dynamically to show the name of the playing channel (in both Classic and OTT modes).
- **Performance**: Added `loading="lazy"` attribute to channel thumbnails for improved page load performance.

### Changed
- **Classic Mode Selection**: Fixed highlighting logic to only select the specific card clicked (trending vs main list) rather than all instances of that channel.

### Removed
- **Stream Status**: Removed "Online/Offline" status indicators and badges from all channel cards and the player interface.
- **Legacy Code**: Removed unused `streamStatusStore` and related hooks.

## [Backend 1.9.0] - 2026-01-06
### Changed
- **Dependencies**: Upgraded `illuminate/*` packages (Database, Events, Pagination) to `^10.0` to resolve PHP 8.3+ deprecation warnings.

### Removed
- **API Endpoint**: Removed `GET /channels/{uuid}/stream-status` endpoint as the feature has been deprecated.

## [Frontend 1.11.0] - 2026-01-02
### Added
- **Classic Mode Expiry**: Implemented automatic 24-hour expiration for Classic Mode. Use ensures users are periodically returned to the main OTT interface (Dashboard) to see new promoted content.

## [Frontend 1.10.0] - 2026-01-02
### Added
- **Watch History**: Implemented "Continue Watching" feature.
  - Automatically tracks watched channels in LocalStorage.
  - Displays "Continue Watching" row on the Dashboard.
- **Picture-in-Picture**: Added native PiP support with a toggle button in the player overlay.
- **AirPlay Support**: Integrated AirPlay/Casting support for compatible devices (Apple TV / Mac).
- **Auto-Retry Logic**: Added 10-second auto-reload countdown on playback errors.

## [Frontend 1.9.2] - 2025-12-25
### Changed
- **SEO Policy**: Enabled `index: true` and `follow: true` to allow search engines to crawl and index the site.

## [Frontend 1.9.1] - 2025-12-25
### Added
- **Private SEO mode**: Configured metadata to explicitly prevent indexing (`noindex`, `nofollow`).
- **Hybrid Analytics**: Supported both GTM and GA4 scripts running simultaneously in the application layout.

## [Frontend 1.9.0] - 2025-12-25
### Added
- **Sidebar Search**: In-player channel search with immediate filtering (Name/Number).
- **OTT Header Fullscreen**: Dedicated fullscreen toggle button in the top navigation bar.

## [Backend 1.8.0] - 2025-12-25
### Note
- Backend remains at v1.8.0 (Stable). Versioning is now decoupled from Frontend.

## [1.8.0] - 2025-12-25
### Note
- **Last Unified Version**: Versions split after this release (Frontend -> 1.9.0).
### Added
- **Premium Video Loader**: Replaced default spinner with a high-end "Dual Ring" animated loader featuring glowing gradients and theme-aligned colors (Cyan & Yellow).
- **Persistent Watermark**: Added a permanent, responsive watermark logotype (`png_logo.png`) to the video player. It adapts to screen size and remains visible in Fullscreen mode across all player variations (Classic & OTT).
- **OTT Mode Refinements**:
  - Reverted the OTT Channel Page player to use **Default Video.js Controls** for a distinctive "Embedded" feel, separating it from the Classic Mode's custom overlay.
  - Preserved specific custom features (like Watermark) while using native controls.

### Fixed
- **Trending Viewers Count**: Resolved an issue where "Top Trending" cards in Classic Mode displayed "0" viewers; now correctly pulls live data from the main channel list.
- **Fullscreen Watermark**: Fixed z-index and context issues that prevented the watermark from appearing when the player entered fullscreen mode.

## [1.7.0] - 2025-12-24
### Added
- **Advanced Classic Mode**: 
  - Complete mobile interface redesign (compact layout, auto-scroll to player).
  - TV Native Navigation with directional arrow support and "Cycle Button" filtering.
  - Enhanced "Top Trending" section with 4-column desktop layout.
- **Improved Filter System**: 
  - Added "Group By Category" support with backend integration.
  - Implemented smart sorting for languages and categories.
- **Responsive Ad Banner**: Adaptive ad sizing for better mobile fit.

### Changed
- **UI/UX Optimizations**: Unified player/details/ad layout in Classic Mode.
- **Backend**: Added 'category' object to Channel API response for better grouping.

## [1.6.0] - 2024-12-22
### Added
- **Unlimited Channel Browsing**: Removed the hardcoded 100-channel limit across the entire platform.
- **Support for Full Data Fetching**:
  - Implemented `limit=-1` support in the backend `ChannelService` to bypass pagination.
  - Updated all frontend pages (Home, Channels, Language, State) to use unlimited fetching.
- **Enhanced Classic Mode**: Users can now browse and navigate the entire channel catalog without being capped at 100 items.
- **Complete Feature Documentation**: Updated READMEs and API documentation across root, frontend, and backend folders.

### Fixed
- **Inconsistency in List Sizes**: Standardized fetching logic across category pages and related channels sidebar.

## [1.5.0] - 2025-12-21
### Added
- **Channel Report System**: Complete backend and frontend integration for reporting channel issues
  - Created `channel_reports` table with MyISAM engine compatibility
  - Added `ChannelReport` model with channel and customer relationships
  - Implemented `createReport` method in `ChannelService`
  - Added `/api/channels/{uuid}/report` endpoint with validation
  - Integrated `ReportModal` with backend API, sends customer UUID when logged in
  - Report modal now available in both Classic and OTT modes
- **Contact Form Backend**: Replaced webhook with database storage
  - Created `contact_messages` table for storing contact form submissions
  - Added `ContactMessage` model and `ContactController` with validation
  - Implemented `/api/contact` endpoint with email format and length validation
  - Frontend now uses backend API instead of external webhook
- **Classic Mode Enhancements**:
  - Added real-time stream status checking for each channel card
  - Channels now display accurate ONLINE/OFFLINE status based on stream availability
  - Implemented navigation guard to prevent accessing other pages in Classic mode
  - Users are automatically redirected to home page when trying to navigate away
- **Network Status Monitoring**:
  - Added global internet connection status monitoring
  - Toast notifications appear when connection is lost (stays visible until restored)
  - Toast notifications appear when connection is restored (auto-dismisses after 3 seconds)
- **Backend Deployment & Troubleshooting**:
  - Implemented automatic base path detection in `public/index.php` for root and subfolder deployments
  - Added diagnostic debug mode (`?debug=1`) for health check and routing troubleshooting
  - Optimized middleware execution order for better error reporting in production

### Changed
- **UI/UX Improvements**:
  - Removed gap between navbar and content in OTT mode (removed `pt-16` and `pt-24` padding)
  - Added `pt-6` padding to main content area for better spacing below navbar
  - Improved skeleton loading - now only shows during initial page load, not after content loads
- **Classic Mode**:
  - Updated `VideoPlayer` to accept and pass `channelUuid` and `channelName` props
  - Channel status badges now use real-time stream status instead of database status field
- **Contact Page**:
  - Enhanced error handling to display specific validation errors from backend
  - Better user feedback with detailed error messages

### Fixed
- **Channel Report**:
  - Fixed SQL foreign key constraint errors by using MyISAM engine instead of InnoDB
  - Fixed "Channel information missing" error by passing channel props through all components
- **Contact Form**:
  - Fixed validation errors by using correct Valitron rule syntax
  - Removed unsupported `lengthMax` validation rule
- **Classic Mode**:
  - Fixed incorrect channel status display (was showing database status instead of stream status)
  - Fixed navigation issues by implementing `ClassicModeGuard` component
- **Network Monitoring**:
  - Fixed offline toast persisting after connection restored by implementing toast ID tracking

## [1.4.0] - 2025-12-07
### Added
- **Classic Mode Layout**: New 3-column channel list grid on large screens for better density.
- **Classic Mode Ads**: Enhanced ad visibility with optimized player height (50/50 split) and increased container height.
- **OTT Home Sorting**: "Featured" and "All Channels" groups are now sorted by channel number (ascending).
- **Popularity Sorting**: "Other Channels" in OTT mode are now sorted by viewer count (descending).

### Changed
- **Classic Mode**: Player width balanced to 50% to prevent vertical scrolling and ensure the banner ad is fully visible.
- **Startup Performance**: Classic Home now initializes the first channel immediately, removing ad loading delays on mode switch.

## [1.3.1] - 2025-12-07
### Fixed
- Fixed TypeScript error in VideoPlayer where `currentTime()` could be undefined.

## [1.3.0] - 2025-12-07
### Added
- **TV Mode**: Full "10-foot UI" support with arrow key navigation (Spatial Navigation).
- **TV Navigation Provider**: Global context to manage focus and keyboard events.
- **TV Components**: Updated `HeroBanner`, `ChannelCard`, `ChannelRow`, `Navbar`, and `DisclaimerModal` to be focusable and responsive to remote controls.
- **Video Player**: Added native TV remote support (Play/Pause, Volume, Seek, Back).
- **Channel Page**: Complete rework for TV navigation, including focusable rating, share, and comment sections.
- **Search Improvements**: Added support for single-digit channel queries (e.g., "1") and displaying channel numbers in results.

### Changed
- `ChannelCard` now scales (`scale-105`) and shows a border (`ring-4`) when focused.
- `DisclaimerModal` is now fully accessible via keyboard/remote.
- `Navbar` search logic updated to trigger on single-character input.

### Fixed
- Fixed issue where single-digit channel numbers could not be searched.

## [1.2.0] - 2025-12-07
### Added
- Search by channel number in Navbar (Backend & Frontend).
- Optimistic UI updates for viewer count.

### Changed
- Channels are now sorted by channel number (ascending) on the channels page.
- Refactored `ChannelPage` to prevent video player re-renders during state updates.

### Fixed
- Fixed Vercel build error by wrapping `useSearchParams` in `Suspense`.
- Fixed 500 Internal Server Error caused by stale `.next` build artifacts.
- Fixed viewer count not incrementing by resetting timer logic.
- Fixed CORS issues by configuring Next.js rewrites.

## [1.0.0] - 2025-11-26
### Added
- Initial release of Nellai IPTV project.
- Frontend built with Next.js, version 1.0.0.
- Backend REST API built with Slim PHP, version 1.0.0.
- Gitignore files for both frontend and backend.
- Basic project setup and configuration.

### Changed
- N/A

### Fixed
- N/A

---

## [1.1.0] - 2025-12-01
### Added
- Updated frontend UI components.
- Added new theme support.
- Improved accessibility features.

### Changed
- Refactored navigation bar.

### Fixed
- Fixed layout issues on mobile devices.

---

*This changelog follows the Keep a Changelog convention.*
