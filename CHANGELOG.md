## [1.8.4+20] - App | [1.42.1] - Frontend | [1.31.1] - Backend - 2026-01-31

### App (Flutter)
- **Feature**: **Remote shortcuts** - Added support for "Menu", "Info", and "Guide" keys to open STB Channel List.
- **Improvement**: **TV Navigation** - Enhanced Fullscreen trigger with "Space" and "Select" keys.
- **Visuals**: **Player Cleanup** - Removed black borders/backgrounds from player containers.
- **Fix**: **Native Crash** - Resolved `SIGABRT` crashes during hot restarts.

### Frontend (Next.js) & Backend (PHP)
- **Maintenance**: Version synchronized with latest App Release (v1.8.4+20).

## [1.8.3+19] - App | [1.42.0] - Frontend | [1.31.0] - Backend - 2026-01-31

### App (Flutter)
- **Fix**: **TV Search Input** - Search bar now explicitly summons the keyboard on "Select" press.
- **Fix**: **Fullscreen Exit** - Robust `Back` and `Escape` key handling to exit fullscreen mode reliably.
- **Feature**: **Focusable Ads** - Ad banners now support DPad focus with visual highlights.
- **Improvement**: **Focus Stability** - Eliminated "focus stealing" bugs by removing aggressive autofocus on list items.

## [1.8.2+18] - App | [1.42.0] - Frontend | [1.31.0] - Backend - 2026-01-30

### App (Flutter)
- **Feature**: **Android TV Compliance** - Generated and installed high-resolution 320x180 "xhdpi" TV banner and 512x512 full-bleed square icon to resolve Play Store rejections.
- **Feature**: **Easy TV Navigation** - Added dedicated "Channel List" (Menu) and "Mute/Unmute" buttons to player controls.
- **Improvement**: **Single-Click Fullscreen** - Intuitive tap-to-expand logic for embedded player.
- **Fix**: **FFI Crash Stability** - Fixed critical `SIGABRT` crashes during hot restarts by silencing high-frequency native log streams.
- **Fix**: **Mute Sync** - Synchronized UI mute icon with physical hardware/remote volume buttons using a reactive volume listener.

### Frontend (Next.js)
- **Maintenance**: Version synchronized with latest App optimizations.

### Backend (PHP)
- **Feature**: **Geo Filtering** - Enhanced Categories and Languages APIs with optional `status` parameter (active/inactive).

## [1.8.1+17] - App | [1.41.0] - Frontend | [1.30.0] - Backend - 2026-01-30

### App (Flutter)
- **Feature**: **Video Stretching** - Added dynamic `BoxFit` logic to stretch video to full viewport width/height in fullscreen mode.
- **Fix**: **FFI Crash Resolution** - Fixed a critical SIGABRT (FFI Callback invoked after deletion) by refining `player.stop()` timing and adding asynchronous guards.
- **Fix**: **Initialization Safety** - Introduced `loadId` verification and redundancy checks to prevent race conditions during rapid channel switching.
- **Optimization**: **MediaKit Tweaks** - Restored performance properties (`demuxer`, `cache`) using a safe dynamic bridge for compatibility.

### Frontend (Next.js)
- **Optimization**: **Buffer Logic** - Standardized device-specific HLS buffering and loading timeouts for better stability.
- **UI/UX**: sidebar logo now functions as a "Home" link; refined player viewport height.

### Backend (PHP)
- **Feature**: **Status Filtering** - Categories and Languages APIs now support `status` parameter (defaults to 'active').
- **Optimization**: **Sorting** - Standardized `order_number` sorting across all Geo metadata services.

## [1.8.0+16] - App | [1.40.0] - Frontend | [1.29.0] - Backend - 2026-01-30

### App (Flutter)
- **Feature**: **TV Optimization** - Switched to `GridView.builder` for the channel grid to ensure smooth directional navigation on Android TV/STB.
- **Improvement**: **Video Playback** - Reduced redundancy in player initialization for faster channel switching.
- **Fix**: **Black Screen Resolution** - Fixed a synchronization issue by ensuring cleaner player disposal and source loading during channel switches.
- **Ad Refinement**: Removed inline grid ads to prioritize navigation speed, while maintaining the bottom banner ad.

### Frontend (Next.js)
- **Optimization**: **Video Player** - Zero-latency initialization. Implemented device-specific buffering profiles (High-Tier vs. Low-Tier TV) to maximize performance and minimize RAM usage on weak hardware.
- **UI/UX**: Refined Classic Mode layout with increased video player height and optimized comment section spacing.
- **Navigation**: Branding logo in the sidebar now conveniently links back to the home page.
- **Ads**: Migrated from individual grid ads to full-width banners every 16 channels for a more premium browsing experience.

### Backend (PHP)
- **Feature**: **Advanced Filtering** - Added `status` parameter support to Categories and Languages APIs for refined content management.
- **Optimization**: Standardized priority-first sorting (`order_number`) for all Geo metadata services.

## [1.7.1+15] - App | [1.39.0] - Frontend | [1.28.0] - Backend - 2026-01-30

### App (Flutter)
- **Feature**: **Full-Screen TV Toggle** - Added a dedicated button for easier fullscreen access on TV remotes.
- **Improvement**: **System UI Logic** - Optimized immersive mode to hide status/nav bars more reliably.
- **Fix**: **Volume Persistence** - Prevented system volume from resetting to 100% on channel switch.
- **Fix**: **Mute State** - Integrated mute toggle with global manager for persistence across channels.

## [1.7.0+14] - App | [1.39.0] - Frontend | [1.28.0] - Backend - 2026-01-30

### App (Flutter)
- **Feature**: **Number Key Navigation** - Direct channel switching using numeric keypad with visual overlay.
- **Feature**: **Backend Health Check** - Mandatory availability check on startup with blocking error UI.
- **Improvement**: **UI Animations** - Added `flutter_animate` for polished error screens and overlays.
- **Improvement**: **UI Polish** - Switched card loaders to Cupertino-style ticks and removed shimmers.
- **Fix**: **Priority Sorting** - Respects `order_number` for Categories/Languages.

### Backend (PHP)
- **Feature**: **Priority Sorting** - Added `order_number` field to Categories and Languages.
- **Improvement**: **Ordered APIs** - Geo metadata sorted by priority by default.

### Frontend (Next.js)
- **Improvement**: **Dynamic Sorting** - Integrated `order_number` for backend-aligned sorting.

## [1.6.2+13] - App | [1.38.0] - Frontend | [1.27.0] - Backend - 2026-01-29

### App (Flutter)
- **Feature**: **TV Navigation** - Enhanced D-Pad support for STB Overlay ("Enter" key capture) and Embedded Player controls.
- **Feature**: **Classic Mode UI** - Added View Count and Star Rating stats to channel details banner.
- **Improvement**: **Dynamic Layout** - Player optimizes vertical space when ads are not loaded.
- **Improvement**: **Refresh Logic** - "Refresh" button now triggers a full application state sync (Settings + Data).

## [1.6.2+12] - App | [1.38.0] - Frontend | [1.27.0] - Backend - 2026-01-29

### App (Flutter)
- **Feature**: **Force Update Enforcement** - Strict logic to close the app if a mandatory update is declined.
- **Fix**: **Android TV Build** - Resolved resource linking errors by adding missing `tv_banner`.

## [1.6.1+11] - App | [1.38.0] - Frontend | [1.27.0] - Backend - 2026-01-28

### Frontend (Next.js)
- **Feature**: **Kiosk Mode** - Automatically hides "Back" and "Menu" navigation buttons in Classic Mode when `is_open_access` is enabled.
- **Improved**: Logic for disclaimer visibility and z-index depth to prevent overlay clipping.
- **Improved**: Initial state evaluation for Open Access settings in player components.

### Backend (PHP)
- **Logging**: Enhanced error reporting in `CustomerController` with detailed exception tracing for debugging customer list failures.
- **Maintenance**: Addressed database collation troubleshooting for unified transaction reporting queries.

## [1.6.1+10] - App | [1.37.0] - Frontend | [1.26.0] - Backend - 2026-01-28

## [1.6.1+10] - App | [1.36.0] - Frontend | [1.25.0] - Backend - 2026-01-28

### Frontend (Next.js)
- **Feature**: **Open Access Mode** - Guests can now watch channels without login if enabled in backend. (Initial Implementation)
- **UX**: Auto-redirect from Landing Page to Channels List for guests in Open Access mode.
- **Fix**: Resolved mobile layout issues (double headers) in Reseller Dashboard.

### Backend (PHP)
- **Feature**: Logic to support "Open Access" mode, bypassing subscription checks.
- **Feature**: Unified Admin Transaction Report combining Gateway payments and Wallet logs.
- **Fix**: Relaxed type checking for boolean-like settings from database.

## [1.6.1+10] - App | [1.35.1] - Frontend | [1.24.1] - Backend - 2026-01-28

### Backend (PHP)
- **Fixed**: Timezone synchronization (IST) and database schema for reseller tracking.

### Frontend (Next.js)
- **Fixed**: Reseller dashboard layout optimization and timezone-aware date handling.

## [1.6.1+10] - App | [1.35.0] - Frontend | [1.24.0] - Backend - 2026-01-28

### Backend (PHP)
- **Added**: Customer creation tracking with `created_by_type` (self/admin/reseller) and `created_by_id` fields.
- **Added**: Database migration for customer ownership tracking (`add_customer_creation_tracking.sql`).
- **Changed**: Reseller customers filtered by ownership - list shows only owned customers, search shows all.
- **Changed**: Admin customer creation now tracks admin user ID as creator.
- **Changed**: Password field is now required for reseller customer creation.
- **Fixed**: Reseller customer search returns ownership indicator (`is_owned_by_reseller` flag).

### Frontend (Next.js)
- **Added**: Reseller dashboard at `/reseller` with stats, quick actions, and recent customers.
- **Added**: Reseller plans page at `/reseller/plans` showing both retail and reseller pricing with profit margins.
- **Added**: Customer ownership badges in reseller search results ("Your Customer" vs "Other").
- **Added**: Phone number input validation - accepts only numeric characters.
- **Changed**: Sidebar for resellers now shows Dashboard, Plans, and Customers menu items.
- **Changed**: Navbar shows "Reseller" button instead of "Plans" for reseller users.
- **Changed**: Resellers can watch channels at `/channels` and `/channel/[uuid]` without subscription.
- **Fixed**: Reseller authentication in AdminLayout using correct `/customers/profile` endpoint.
- **Fixed**: Plans page API endpoint changed from `/admin/plans` to public `/plans` to prevent logout.
- **Fixed**: Sidebar active state now highlights only current page (no multiple highlights).
- **Fixed**: Reduced main content padding for better space utilization.

### App (Flutter)
- No changes in this release.

## [1.6.1+10] - App | [1.34.0] - Frontend | [1.23.0] - Backend - 2026-01-27

### Backend (PHP)
- **Added**: Reseller management system with role-based access control.
- **Added**: Transaction search and filtering by status and gateway.
- **Changed**: Device limit enforcement - resellers fixed at 1 device, customers use plan limits.
- **Changed**: Subscription validation now exempts resellers (no plan required).
- **Fixed**: Payment flow blocking issue where users without plans couldn't purchase subscriptions.

### Frontend (Next.js)
- **Added**: Reseller creation and management UI in admin panel.
- **Added**: Role badge display on customer list, profile page, and admin tables.
- **Added**: Transaction page search/filter functionality (status, gateway, search term).
- **Changed**: Profile page now shows different layouts for resellers vs customers.
- **Improved**: Customer table with role column and filtering capabilities.

## [1.6.1+10] - App | [1.33.0] - Frontend | [1.22.0] - Backend - 2026-01-27

### Backend (PHP)
- **Fixed**: Critical 500 Slim Application Error on `/api/plans` (FastRoute route shadowing conflict).
- **Fixed**: Undefined variable `$fallbackMp4Url` in `PublicSettingController.php`.
- **Improved**: `OptionalAuthMiddleware.php` resilience with global `Throwable` catch blocks.

### Frontend (Next.js)
- **Added**: Redirect logic for authenticated users on `/register` and `/login` (auto-redirect to `/`).
- **Improved**: Home page UX with conditional rendering for logged-in users.

## [1.6.0+9] - App | [1.32.0] - Frontend | [1.21.0] - Backend - 2026-01-27

### Frontend (Next.js)
- **Added**: Immersive SEO-friendly Landing Page at root (`/`) with Hero, Features, and About sections.
- **Refactored**: Dedicated player experience at `/channels` with automatic immersive mode (hidden navbar/footer).
- **Added**: Community Discussion section for channels with real-time comment support.
- **Improved**: Global TV Navigation (D-pad support) for all landing page actions and player interactions (ratings, comments).
- **Improved**: Smart Post-Login Redirection to return users to their previous context.
- **Added**: Logout success notifications and refined focus indicators for TV visibility.

## [1.6.0+9] - App | [1.31.0] - Frontend | [1.21.0] - Backend - 2026-01-26

### Frontend (Next.js)
- **Added**: Smart Video Fallback system for HLS errors and timeouts with 20s auto-recovery countdown.
- **Added**: TV-optimized Classic Menu (Login, Register, Profile, etc.) with remote focus support.
- **Improved**: Sanitized player logs to prevent technical URL exposure.

### Backend (PHP)
- **Improved**: Automatic URL resolution for fallback video assets.
- **Added**: Default high-quality placeholder samples for out-of-the-box readiness.

## [1.5.3+8] - App | [1.20.4] - Backend - 2026-01-26

### App (Flutter)
- **Added**: Full TV Remote (D-Pad) compatibility for Classic Mode Ads and Retry functionality.
- **Improved**: Focus management with visual cyan highlights for selected elements.

## [1.5.2+7] - App | [1.20.4] - Backend - 2026-01-25

### App (Flutter)
- **Added**: MP4 Fallback support with instant loading logic.
- **Added**: Clickable Banner Ads with `redirect_url` support.
- **Improved**: Retry button countdown and Cyan theming.
- **Fixed**: Disabled In-App Updates in debug builds.

### Backend (PHP)
- **Added**: `fallback_404_mp4_url` in Public Settings API.
- **Added**: `redirect_url` support for Ads model.

## [1.5.1+6] - App | [1.20.4] - Backend - 2026-01-25

### App (Flutter)
- **Fixed**: Play Store device compatibility issue (Ethernet-tier devices) by relaxing manifest hardware requirements.

## [1.5.0+5] - App | [1.20.4] - Backend - 2026-01-25

### App (Flutter)
- **Added**: Fallback HLS Player with "Retry" UI and pulse animation.
- **Added**: Android TV Store compliance features (Banner, Leanback).
- **Added**: Connectivity monitoring with animated Toast notifications.
- **Fixed**: Internet recovery logic.

### Backend (PHP)
- **Added**: `fallback_404_hls_url` field to public settings API response.

## [1.4.3+4] - App | [1.20.3] - Backend - 2026-01-25

### App (Flutter)
- **Added**: State persistence for STB Navigation (remembers last category).
- **Added**: Real-time sync of channel ratings/views from player to main screen.
- **Changed**: Minimalist design for player stats overlay (smaller icons/text).
- **Fixed**: `GestureOverlay` hoisting to fix interaction issues during loading states.
- **Fixed**: Syntax errors in premium content logic.

### Backend (PHP)
- **Changed**: View count formatting now uses integer arithmetic for consistent precision (e.g. `2.2+K`).

## [1.4.2+3] - App | [1.20.2] - Backend - 2026-01-25

### App
- **Added**: Full-Screen "Set-Top Box" style channel navigation drawer.
- **Added**: TV-priority navigation with "All Channels" default group.
- **Changed**: Persistent viewer counts and ratings in player.

### Backend
- **Fixed**: Enhanced `APP_URL` detection for cloud deployments.
- **Security**: Removed internal path fields from public API responses.

## [1.4.1+2] - App | [1.18.1] - Backend - 2026-01-24

### App
- **Added**: Android 15 Edge-to-Edge support.
- **Added**: Parallel API fetching for instant switching.
- **Added**: Session-based thumbnail caching.
- **Security**: Screenshot prevention enabled.

### Backend
- **Refactored**: Database schema for relative path storage.
- **Added**: Smart file cleanup for logo/thumbnail updates.
