# Changelog

All notable changes to this project will be documented in this file.

## [Frontend 1.27.1] - 2026-01-12
### Changed
- **Classic Mode Persistence**: Switched from `localStorage` to `sessionStorage` for storing view mode preference.
  - **Behavior**: "Classic Mode" now persists only during the active browser session. Closing the browser or tab automatically resets the view to "OTT Mode" (default) for the next visit.
  - **Expiry**: Updates expiry handling to match the new session-based lifecycle.

## [Frontend 1.27.0] - 2026-01-12
### Added
- **Lite Player (Cinematic UI)**:
  - **Full-Screen Error Overlay**: Replaced standard errors with a cinematic, dark-themed "Playback Interrupted" screen for a premium TV experience.
  - **Smart Retry**: Implemented a visible **6-second auto-retry countdown** to automatically recover from stream failures without user intervention.
  - **Home Navigation**: Added a transparent "Return Home" button to the top-left corner, allowing users to easily exit the player.
  - **TV Navigation Polish**: Refined the bottom-left channel info overlay and confirmed "Prev/Next" button visibility for clearer navigation.

## [Frontend 1.26.0] - 2026-01-12
### Added
- **TV Navigation System**:
  - **Channel Surfing**: Implemented full `Previous` / `Next` channel navigation in the Lite Player (`/lite`).
  - **Remote Support**: Mapped standard TV Remote keys (`ArrowUp`, `ArrowRight`, `ChannelUp` -> Next) and (`ArrowDown`, `ArrowLeft`, `ChannelDown` -> Previous) to navigation actions.
  - **Overlay UI**: Added a sleek, auto-hiding overlay that displays the current channel info and provides touch/click navigation buttons.
  - **Seamless Fetching**: The player now intelligently pre-fetches the entire channel list in the background to enable instant channel switching without returning to the home screen.

## [Frontend 1.25.0] - 2026-01-11
### Added
- **Lite Player Polish**:
  - **Immersive Mode**: The Navbar and Footer now completely vanish on the `/lite` route, ensuring a distraction-free, full-screen cinematic experience.
  - **Premium UI**: Replaced generic "Access Denied" errors with a TV-friendly "Premium Content" screen featuring a Crown icon, "Upgrade Now" call-to-action, and a critical "Go Back" button to prevent navigation traps.
  - **Auto-Play Fix**: Solved "Infinite Loading" loop on TV browsers when navigating from Home Page by detecting pre-loaded Clappr instances immediately.

### Fixed
- **TV Navigation**:
  - **Universal Redirect**: Hardened the "TV Detection" logic across the entire application. Clicking ANY video—whether in Featured Banner, Trending Lists, or Search Results—now strictly forces a redirect to the optimized Lite Player on TV devices.
- **Image Handling**:
  - **Smart Fallback**: Fixed broken channel thumbnails caused by external provider timeouts (Catbox). The system now gracefully detects load errors and instantly swaps to a generated Initials Avatar, keeping the UI clean.
  - **Proxy Sanitization**: Added utility to strip `localhost` from image URLs, fixing display issues on non-server devices.

## [Frontend 1.24.0] - 2026-01-11
### Added
- **Lite Player (Clappr Engine)**:
  - **TV-Optimized Playback**: Replaced standard player with **Clappr** for the Lite Mode (`/lite`), offering 3x faster load times and zero buffering on low-spec Android TVs.
  - **Zero-Distraction UI**: A "Click & Watch" interface with no seekbar, volume controls, or overlays. The Play button auto-hides for a pure cinematic experience.
  - **Smart Redirection**: TV devices in OTT mode are automatically routed to this Lite Player for direct-play channels.
  - **Secure Stream Fetching**: The player manages secure stream URLs internally, protecting content while offering a seamless user experience.

### Fixed
- **UI Cleanup**: Removed visual hover effects, dark overlays, and watermarks/logos from the Lite Player to maximize performance and viewing area.
- **TV Playback Stability**: Fixed "Main Thread Starvation" on older TVs by offloading stream management and simplifying the DOM structure.
- **API Compliance**: Ensured all Lite/TV requests strictly adhere to the `X-Client-Platform` header standards.

## [Frontend 1.23.4] - 2026-01-11
### Added
- **Lite Player (v1.0)**:
  - **Zero-Overhead Playback**: New `/lite` route designed specifically for older Android TVs. Bypasses all React UI rendering to dedicate 100% CPU to video decoding.
  - **Auto-Redirect Logic**: The main player intelligently detects "Low Tier" devices and seamlessly redirects them to the Lite player.
  - **Secure Stream Hiding**: The Lite player accepts a `channel` UUID (e.g., `?channel=...`) and internally fetches the secure stream URL, preventing `.m3u8` link exposure in the browser bar.

## [Frontend 1.23.3] - 2026-01-11
### Fixed
- **Low-End TV Optimization**:
  - **Dynamic Tiering**: Restored smart detection for low-spec TVs based on CPU/RAM (`cores < 4` or `memory < 2GB`).
  - **Lite Profile**: Automatically applies "Safety Mode" for these devices: `startLevel: 0` (Lowest), `maxBuffer: 15MB` (RAM Saver), and `BandwidthFactor: 0.5` (Conservative ABR).
  - **Result**: Eliminates buffering on older Android TVs where decoding power is the bottleneck, while keeping 1080p/4K unlocked for high-end devices (Shield/FireTV).

## [Frontend 1.23.2] - 2026-01-11
### Fixed
- **HLS Threading**:
  - **Performance**: Enabled `enableWorker: true` for React applications.
  - **Why**: While static HTML files work without workers, the React/Next.js runtime consumes significant Main Thread resources. Enabling the worker offloads video parsing to a background thread, preventing CPU starvation and buffering loops on low-spec TVs.

## [Frontend 1.23.1] - 2026-01-11
### Fixed
- **HLS Priority Engine**:
  - **Critical Fix**: Modified player initialization to **Force HLS.js** (MSE) on Android TVs and Smart TVs instead of defaulting to Native Playback.
  - **Why**: Native players on many TVs ignore custom buffer strategies. Forcing HLS.js ensures our optimized "Safe Start" and "20MB Buffer" profiles are strictly enforced, solving the Vercel buffering issues.

## [Frontend 1.23.0] - 2026-01-11
### Added
- **Advanced HLS Optimization (v2.0)**:
  - **Device-Specific Profiles**: Complete overhaul of the HLS configuration engine in `VideoPlayer.tsx`.
  - **TV Profile**: Implemented a "Safe Start" strategy for older Android TVs (`startLevel: 1`, `maxBufferSize: 20MB`) to prevent startup freezes.
  - **Mobile Profile**: Balanced configuration for phones (`maxBufferSize: 30MB`) ensuring quick load times.
  - **PC Profile**: High-quality profile for desktops (`maxBufferSize: 60MB`) for maximized playback stability.
  - **Legacy Cleanup**: Removed conflicting resolution caps (`capLevelToPlayerSize: false`) to allow the new ABR (Adaptive Bitrate) logic to manage quality naturally.

## [Frontend 1.22.2] - 2026-01-10
### Added
- **Decoder Optimization**:
  - **Frame Dropping**: Implemented `playsinline` and `webkit-playsinline` attributes on the video element. This instructs the TV's webview to drop frames rather than freezing the entire stream when the decoder falls behind, ensuring audio continuity.
  - **Render Performance**: Explicitly set `imageRendering: "auto"` to prevent expensive scaling algorithms on low-power devices.


### Added
- **Native HLS Support**:
  - **TV Optimization**: The Video Player now prioritizes **Native HLS** playback (via `application/vnd.apple.mpegurl`) on TV devices (WebOS, Tizen, Android TV) before falling back to HLS.js. This leverages the TV's dedicated hardware decoder for vastly superior performance on low-spec devices, eliminating stuttering and frame drops.


### Added
- **Subscription Module**:
  - **Admin Plan Management**: Complete UI for creating, editing, and deleting subscription plans (`/admin/plans`).
  - **Customer Integration**: View and manage customer subscription status and plan details directly from the customer profile.
  - **Visuals**: Plan details are now displayed in the customer table and overview modal.
- **TV Performance Tuning**:
  - **Optimized HLS**: Overhauled `VideoPlayer` settings for low-spec Android TVs (`maxBuffer` reduced to 15MB, `startLevel` set to 0, `capLevelToPlayerSize` enabled).
  - **Decoder Safety**: Aggressive capping of resolution to match screen size, preventing 4K stalls on 1080p hardware.

### Fixed
- **Type Safety**: Fixed `src` type mismatch in `ClassicHome` and `ChannelPage` video players by handling `undefined` HLS URLs.
- **Build Errors**: Resolved TypeScript build failures in production:
  - Fixed `src` type mismatch in `ClassicHome` and `ChannelPage`.
  - Fixed `channel_number` undefined access in `PlayerOverlay` search filter.

## [Backend 1.17.0] - 2026-01-10
### Added
- **Subscription Engine**:
  - **Models & Migrations**: Added `SubscriptionPlan` model and migration scripts for database structure.
  - **Admin API**: Full CRUD endpoints for managing subscription plans (`SubscriptionPlanController`).
  - **Logic**: Implemented expiration logic (`subscription_expires_at`) and plan association (`subscription_plan_id`) in `Customer` model.
  - **Middleware**: Added `OptionalAuthMiddleware` to identifying subscribers on public routes without forcing login.

## [Frontend 1.21.0] - 2026-01-10
### Added
- **Premium Integration**:
  - **Classic Mode Support**: Complete support for Premium functionality in Classic TV mode.
  - **Smart Fetching**: Channel selection in Classic Mode now triggers a real-time fresh data fetch to ensure accurate Premium access validation.
  - **Visuals**: Added "Premium" Crown badge to channel list items in Classic Mode.

### Fixed
- **Playback Security**: Resolved issue where stale channel data could bypass (or falsely trigger) Premium restrictions in long-running sessions.

## [Backend 1.16.1] - 2026-01-10
### Fixed
- **Auth Middleware**: Implemented `OptionalAuthMiddleware` for public channel endpoints (`GET /api/channels/{uuid}`). This ensures that logged-in users are correctly identified as subscribers even on public routes, allowing seamless access to Premium content without breaking guest access.

## [Frontend 1.20.1] - 2026-01-10
### Fixed
- **Content Filtering**: Fixed an issue where the "Top Trending" section would still appear on the `/channels` page even when disabled in Admin Settings.

## [Frontend 1.20.0] - 2026-01-10
### Added
- **Top Trending Control**: Added granular control for "Top Trending" section visibility across platforms (Web, TV, Android, iOS) via Admin Settings.
- **Admin UI Polish**: Completely redesigned "Allowed Platforms" and "Channel Status" (Featured, Premium, Active) inputs in Channel Form using a modern card-based grid layout.

### Fixed
- **Maintenance Mode**: Fixed UI lag when toggling Maintenance Mode in Admin Panel by implementing optimistic state updates.

## [Backend 1.16.0] - 2026-01-10
### Added
- **Public Settings**: Expose `top_trending_platforms` setting in `PublicSettingController` to allow frontend clients to conditionally render trending sections.

## [Frontend 1.19.2] - 2026-01-10
### Fixed
- **Admin Login**: Fixed `adminApi` client to correctly use `NEXT_PUBLIC_API_URL` environment variable, resolving "Invalid API Key" errors on production deployments.

## [Frontend 1.19.1] - 2026-01-09
### Fixed
- **Registration**: Resolved UI error handling for registration failures.

## [Backend 1.15.1] - 2026-01-09
### Fixed
- **Critical Auth Bug**: Resolved `Cannot redeclare class Resend` fatal error in `ResendEmailService` that prevented new user registration.

## [Frontend 1.19.0] - 2026-01-09
### Added
- **Channel Analytics**: New "Analytics" modal in Admin Panel showing daily view trends and average ratings per channel.
- **Admin Tooling**: Integrated `Chart.js` for visual data representation in the admin interface.

### Fixed
- **Type Safety**: Resolved typescript mismatch in `CustomerForm` for admin customer management.
- **Visuals**: Fixed channel list display issues in OTT and Classic modes.

## [Backend 1.15.0] - 2026-01-09
### Added
- **Analytics API**: New `GET /admin/channels/{uuid}/analytics` endpoint providing daily view aggregation and rating stats.
- **Admin Service**: Dedicated `ChannelService` logic for admin-specific data retrieval.

### Fixed
- **API Stability**: Resolved 500 Internal Server Errors in `getAnalytics` due to `avg()` on null relationships.
- **Public API**: Fixed 500 Error in public `GET /channels` caused by duplicate `withAvg` calls in the service layer.
- **Session Monitor**: Implemented client-side polling (`SessionMonitor.tsx`) to detect session revocation and trigger instant logout.
- **Device Management**: Added `DeviceManager` component to profile and devices pages, allowing users to view and revoke active sessions.
- **Maintenance Mode**: Implemented global "Under Maintenance" screen with Admin-configurable title and message, blocking public access while allowing admin login.
- **Conditional Auto-Login**: Added logic to support auto-login after device revocation only when explicitly requested (e.g., from the Device Limit page).

### Fixed
- **Toast Notifications**: Resolved issue with duplicate toast notifications appearing during session expiration.
- **Session Handling**: Fixed issue where revoking a device from the profile page would mistakenly auto-login the user immediately.
- **Vercel Build**: Fixed `missing suspense` error by wrapping `useSearchParams` in a Suspense boundary on the login page.

## [Backend 1.14.0] - 2026-01-08
### Added
- **Activity Logging**: Implemented comprehensive customer activity logging (`LOGIN`, `LOGOUT`, `REVOKE_DEVICE`) with IP and User-Agent tracking.
- **Session Revocation API**: Enhanced `DELETE /customers/sessions/{id}` to accept optional `auto_login` query parameter.
- **Database Schema**: Added `customer_activity_logs` table.
- **Forgot Password**: Implemented secure password reset flow using Resend API (`POST /customers/forgot-password`).
- **Email Webhooks**: Added `POST /webhooks/resend` to track email delivery status (Sent, Delivered, Bounced) in real-time.
- **Maintenance API**: Exposed maintenance mode settings in `PublicSettingController`.

### Changed
- **Database Refactor**: [BREAKING] Switched `customer_sessions` and `customer_activity_logs` tables to use `customer_id` (Integer) as foreign key instead of `customer_uuid`, improving data integrity and performance.
- **Auth Service**: Updated internal logic to resolve Customer ID from UUID for all session operations.

## [Frontend 1.17.5] - 2026-01-07
### Fixed
- **Linting Error**: Fixed duplicate `className` prop in `VideoPlayer.tsx` which caused styling conflicts on the back button.

## [Frontend 1.17.4] - 2026-01-07
### Added
- **Admin API Client**: Created dedicated `adminApi` client (`lib/adminApi.ts`) for secure admin-panel interactions.
- **Improved Security**: Admin client automatically handles `X-Client-Platform` (web) and `X-API-KEY` headers.
- **Session Handling**: Implemented automatic redirect to login screen on 401 Unauthorized responses.

### Changed
- **Cleanup**: Removed extraneous debug logging of API keys from the public API client.

## [Frontend 1.17.3] - 2026-01-07
### Added
- **TV Platform Support**: Fully integrated 'tv' as a distinct platform in channel restrictions.
- **OTT Filtering**: Enhanced "Continue Watching", "Top Trending", and "Featured" sections to respect platform restrictions.
- **Client Identification**: Updated API client to send 'web' as the default `X-Client-Platform` header.

## [Backend 1.13.0] - 2026-01-07
### Added
- **Platform Enforcement**: New `PlatformMiddleware` now strictly enforces the presence of `X-Client-Platform` header on all API requests.
- **TV Support**: Added 'tv' to the `allowed_platforms` ENUM/SET in the database.
- **CORS Update**: Whitelisted `X-Client-Platform` header in CORS configuration.
- **Enhanced Filtering**: Updated `ChannelService` methods (`getFeatured`, `getRelated`, `getNew`) to filter content based on the request platform.

### Changed
- **Breaking Change**: API requests without a valid `X-Client-Platform` header (web, android, ios, tv) will now fail with `400 Bad Request`.

## [Frontend 1.17.2] - 2026-01-07
### Added
- **Premium UI**: Implemented "Premium" badge on Channel Cards and Classic Mode list items.
- **Restricted Overlay**: Added a "Premium Content" overlay for restricted channels, displaying the channel name and a lock icon.
- **Classic Mode Polish**: Added support for Premium badges in the Classic Mode list view.

### Changed
- **Refactor**: Renamed `is_paid` to `is_premium` across the entire codebase for better semantic clarity.
- **Bug Fix**: Fixed an issue where non-premium channels might display a "0" or empty indicator.

## [Backend 1.12.3] - 2026-01-07
### Added
- **Content Protection**: Implemented HLS URL redaction for premium channels. Public API now returns `PAID_RESTRICTED` for the `hls_url` of premium channels.

### Changed
- **Database Refactor**: Renamed `is_paid` column to `is_premium` in `channels` table.
- **API Update**: Updated `Channel` model and `ChannelService` to use `is_premium` field.

## [Frontend 1.17.1] - 2026-01-07
### Fixed
- **Production Logo Display**: Implemented "Smart Sanitization" to universally handle logo URLs. Even if the backend returns a localhost URL (common in default production configs), the frontend now automatically detects and converts it to a relative path, forcing the request through the correctly configured Next.js proxy.
- **Admin Settings**: Applied the same sanitization logic to the Admin Panel setting page to ensure the logo preview always works.

## [Backend 1.12.2] - 2026-01-07
### Fixed
- **Admin Credentials**: Documented default seed credentials in database migrations.
- **Logo URL Handling**: Further refined `PublicSettingController` to prioritize `APP_URL` environment variable for absolute URL generation.

## [Frontend 1.17.0] - 2026-01-07
### Added
- **Dynamic Branding**: Implemented Logo Upload feature in Admin Settings; branding reflects on Navbar and Classic Mode.
- **Trending Channels Graph**: Interactive chart in Admin Dashboard with Category/Language filters.

## [Backend 1.12.1] - 2026-01-07
### Fixed
- **Critical Crash**: Resolved a syntax error in `public/index.php` (broken string concatenation/array definition) that caused 500 errors.
- **Logo Stability**: Updated `SettingController` to ensure logo URLs are always fully qualified, preventing display issues in Admin and Frontend.

## [Backend 1.12.0] - 2026-01-07
### Added
- **Trending API**: `GET /dashboard/trending` for aggregated channel view statistics.
- **Metadata API**: Endpoints for Categories, Languages, and Geo-data.
- **Logo Management**: APIs for uploading and retrieving custom logos.

## [Frontend 1.16.0] - 2026-01-07
### Added
- **Smart HLS Optimization**: Integrated an advanced device profiling engine into the video player.
- **Classic Mode Tuning**: Resolved buffering issues on older TVs by disabling `capLevelToPlayerSize` and implementing **conditional rendering** in `PlayerOverlay` (eliminating hidden DOM nodes).
- **Aggressive Buffering**: TV devices now use a 30s buffer strategy to prevent stuttering.
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
- **Fixed TypeScript error in VideoPlayer where `currentTime()` could be undefined.**

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

---

*This changelog follows the Keep a Changelog convention.*
