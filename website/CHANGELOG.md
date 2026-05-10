## [1.53.0] - 2026-05-10

- **Feature**: **Stream Servers Admin CRUD** - New `/admin/stream-servers` section with paginated list, create, and edit pages. List includes search bar and filters (status, health, server type). Health status shown with colour-coded badges and icons (Online/Offline/Warning/Maintenance). Admin status, SSL indicator, current streams/max display.
- **Feature**: **StreamServerForm Component** - Comprehensive create/edit form organised into 9 sections: Server Identity, Host/Connection, MistServer API, Streaming Endpoints (RTMP/HLS/HTTPS-HLS/CMAF/WebRTC/SRT), Infrastructure, Hardware Specs, Capacity & Lifecycle, Feature Flags (HLS, RTMP, CMAF, WebRTC, SRT, Transcoding), Security & Status. Toggle switches for all boolean fields.
- **Feature**: **MistServer Auth State Panel** - Edit form shows a read-only "Last Validated Auth State" panel (visible when data exists) displaying `mist_challenge` (yellow) and `mist_final_hash` (green) with individual Copy buttons. Refreshes automatically when password is re-saved.
- **Feature**: **Admin Sidebar** - Added "Stream Servers" entry with `Server` icon between Channels and Scrolling Ads.

## [1.52.0] - 2026-05-01
- **Feature**: **Feedback Page** - New `/feedback` public page with feedback type selector (General, Bug, Channel Issue, Feature Request, Subscription), 1–5 star rating, issue type picker (for channel issues), and message field. Displays logged-in user's name when authenticated.
- **Feature**: **Admin Feedback Management** - New `/admin/feedback` page with table view, inline status updates (New → Reviewed → Resolved), filter bar (type, status, platform), expandable messages, and delete. Added "Feedback" to admin sidebar.
- **Feature**: **Footer Feedback Link** - Added Feedback link under Quick Links in the website footer.

## [1.51.2] - 2026-05-01
- No code changes. Versioned alongside backend CORS/OPTIONS stability fix release.

## [1.51.1] - 2026-05-01
- **Fix**: **Environment Detection** - Expanded `isDev` check in the API interceptor to support both `NEXT_PUBLIC_APP_ENV` and `APP_ENV` for reliable debug error display in development.

## [1.51.0] - 2026-05-01
- **Feature**: **Direct Backend Auth Integration** - Refactored forgot/reset password pages to communicate directly with the backend service, removing redundant Next.js API routes.
- **Feature**: **Scrolling Ads Admin Sidebar** - Added `AdminLayout` wrapper (`layout.tsx`) to the `/admin/scrolling-ads` route.
- **Fix**: **Guest Redirect Loop** - Modified 401 Axios interceptor in `lib/api.ts` to only redirect unauthenticated users to login when an active `token` or `tempToken` exists, preventing channel-change redirect loops for guest users.

## [1.50.6] - 2026-04-30
- **Feature**: **Global System Error Handling** - Implemented a global Axios interceptor (`lib/api.ts`) that catches 500+ and Network Errors, halting current view execution and immediately redirecting to a dedicated, immersive `/system-error` page.
- **Feature**: **System Offline UI** - Created a modern, full-screen `System Offline / Connection Lost` page layout, dynamically displaying the backend failure reason and offering a "Try Again" recovery button.
- **Fix**: **Redundant Toasts** - Suppressed duplicate backend health check toast notifications from triggering once the user has already been redirected to the system error page.

# Website Changelog

## [1.50.5] - Website - 2026-04-15

### Added
- **Admin Player Watermark**: Integrated an automated watermark system in the channel preview player (`ClapprPlayer.tsx`). The player now dynamically fetches the app logo (PNG) from global settings and displays it in the bottom-left corner with 60% opacity, ensuring brand persistence during preview sessions.

### Fixed
- **Universal Share Link Fallback**: Removed the conditional server-side restrictor that bypassed the visual HTML countdown on non-mobile devices. The 3-second explicit countdown page now elegantly displays for all users (Desktop, Mobile, TV), guaranteeing a consistent transition experience. App intent deep linking is now dynamically isolated within the client-side JS payload to strictly fire only on Mobile user-agents.

## [1.50.4] - Website - 2026-04-15

### Fixed
- **Universal Share Link Fallback**: Removed the conditional server-side restrictor that bypassed the visual HTML countdown on non-mobile devices. The 3-second explicit countdown page now elegantly displays for all users (Desktop, Mobile, TV), guaranteeing a consistent transition experience. App intent deep linking is now dynamically isolated within the client-side JS payload to strictly fire only on Mobile user-agents.

### Maintenance
- **Version Sync**: Synchronized with Backend v1.38.4 and App v1.9.6+55.

## [1.50.3] - Website - 2026-04-15

### Added
- **Share Link Visual Countdown**: Reworked the `/channels/share/[shortCode]` routing redirect page into a structured, dark-themed UI. Added a live Javascript-powered 3-second visual countdown timer that actively ticks down on the screen before falling back to the Web Preview.

### Fixed
- **Cross-Platform Deep Linking**: Updated the mobile app detection inside the Share Link router. It now conditionally uses the `nellaiiptv://` custom URI scheme for iOS to ensure proper app launching, while retaining the stricter `intent://` scheme for Android targets.

### Maintenance
- **Version Sync**: Synchronized with Backend v1.38.3 and App v1.9.5+54.

## [1.50.2] - Website - 2026-04-15

### Fixed
- **Admin Player Native Video Fallback**: Added and explicitly registered the `@clappr/hlsjs-playback` plugin in `ClapprPlayer.tsx`. Since Clappr decoupled HLS.js from its core, failing to register the plugin caused the player to fall back to the native HTML5 `<video>` element. This caused HLS playback to silently crash on Windows Chrome ("Your browser does not support..."), while appearing to work perfectly on Safari/iOS.

### Maintenance
- **Version Sync**: Synchronized with Backend v1.38.2 and App v1.9.4+53.

## [1.50.1] - Website - 2026-04-15

### Fixed
- **Admin Player Mixed Content**: Applied `resolveStreamUrl()` to `ClapprPlayer.tsx` (used in `/channels/preview/[uuid]`) to automatically upgrade `http://` stream URLs to `https://` when the site is served securely, matching the behavior of the main `VideoPlayer`.
- **Admin Player HLS Parsing**: Added explicit `mimeType: 'application/x-mpegURL'` to Clappr configuration to guarantee HLS module loading, resolving "browser does not support" errors when stream URLs have tokens or unusual extensions.

### Maintenance
- **Version Sync**: Synchronized with Backend v1.38.1 and App v1.9.3+52.

## [1.50.0] - Website - 2026-04-15

### Fixed
- **Mixed Content / HTTPS Playback**: Added `resolveStreamUrl()` helper in `VideoPlayer.tsx` that automatically upgrades `http://` HLS stream URLs to `https://` when the website is served over HTTPS. Eliminates the "Your browser does not support the playback of this video" error seen on hosted (HTTPS) servers caused by browser Mixed Content blocking. Applied to both the Hls.js path and the native Safari/iOS fallback path.

### Improved
- **ClapprPlayer SD→HD Stretch**: `ClapprPlayer.tsx` now forces Clappr's internal `<video>` element to fill the full player container regardless of source resolution (`object-fit: fill`). Implemented via three layers: inline style injection on init, a persistent `<style>` tag with `!important` rules, and a `MutationObserver` that re-applies stretch styles if Clappr internally recreates the video element. Cleans up the injected style tag on component unmount.

### Maintenance
- **Version Sync**: Synchronized with Backend v1.38.0 and App v1.9.2+51.

## [1.49.0] - Website - 2026-04-14

### Added
- **Channel Share Link**: New `/channels/share/[shortCode]` Next.js server-side route that handles smart redirection -- detects Android/iOS devices and issues a deep link Intent URI to open the Nellai IPTV Flutter app directly; falls back to the web preview player after 2.5 seconds.
- **Share URL in Channel Details Modal**: The admin `ChannelDetailsModal` now displays a one-click copyable Public Share URL block when a channel has a `share_code`.
- **Share Code in Channel Form**: Admin `ChannelForm` now includes a `Share Code (6 Digits)` input. Auto-populates with a random 6-digit code on new channel creation.
- **Share Code in Channel Details**: Channel details info grid now shows `Share Code` alongside location metadata.

### Maintenance
- **Version Sync**: Synchronized with Backend v1.38.0 and App v1.9.1+50.

## [1.48.4] - 2026-03-14
- **App Sync**: Version bumped in sync with App v1.8.28+48 (AGP 8.9.1 upgrade and dependency updates).

## [1.48.3] - 2026-03-14
- **App Sync**: Version bumped in sync with App v1.8.27+47 which hides Settings/Category UI on Android TV devices.

## [1.48.2] - 2026-03-14
- **App Sync**: Version bumped to remain in sync with App v1.8.27+46 which enforced ascending channel number sorting by default and removed the channel order settings option.

## [1.48.1] - 2026-03-14
- **App Compatibility**: Backend and website version bumped to stay in sync with App v1.8.27+45 which includes Android TV specific playback fixes.

## [1.48.0] - Website - 2026-02-21

### Added
- **Scrolling Ads Ticker**: Implemented a gap-free marquee on the player interface (`/channels` and `/channel/{uuid}`) to display scrolling text advertisements.
- **Admin Ads Management**: Created a full CRUD interface in the Admin Panel for Scrolling Ads, featuring markdown support, scroll velocity control (`scroll_speed`), and play limiters (`repeat_count`).

### Maintenance
- **Version Sync**: Synchronized version with Backend and App updates.

## [1.47.3] - Website - 2026-02-16

### Added
- **RTMP URL Support**: Added an optional field for RTMP stream URLs in the channel management forms.

### Maintenance
- **Version Sync**: Synchronized version with Backend and App updates.

## [1.47.2] - Website - 2026-02-16

### Added
- **WebP Image Support**: Full support for `.webp` image uploads for thumbnails and logos in the channel management forms.

### Improved
- **Thumbnail Resolution**: Updated UI help text to recommend **1280x720px** resolution for high-definition channel previews.
- **Logo Resolution**: Explicitly specified **512x512px** requirement for channel logos in the admin interface.
- **Accepted Formats**: File inputs now explicitly accept `image/png` and `image/webp`.

## [1.47.1] - Website - 2026-02-14

### Maintenance
- **Version Sync**: Synchronized version with App update.

### Added
- **Enhanced Export Filters**: Added comprehensive filtering support (Search, Category, Language, State, Status) in the Export Channels modal.

### Improvements
- **Persistent Filter State**: Export modal now automatically inherits and pre-fills active filters from the main channels list.
- **Header Exposure**: Optimized CORS headers to allow frontend access to download filenames (`Content-Disposition`).

## [1.46.3] - Website - 2026-02-08

### Added
- **AdSense Integration**: Implemented Google AdSense with global script loading (`GoogleAdSense`) and reusable ad unit component (`AdSenseUnit`).
- **SEO/Meta**: Added `google-adsense-account` meta tag for verification.
- **ads.txt**: Added `ads.txt` support with example file and `.gitignore` safety.

## [1.46.2] - Website - 2026-02-08

### Maintenance
- **Version Sync**: Synchronized version with backend updates for Public API Access support.

## [1.46.1] - Website - 2026-02-07

### Fixed
- **Player Types**: Resolved TypeScript interface mismatch for `ClapprPlayerProps` where `channelUuid` was missing or incorrectly typed.

## [1.46.0] - Website - 2026-02-07

### Added
- **Developer Tools Protection**: Implemented comprehensive DevTools blocking system with `DevToolsControl` component.
- **Platform Availability Settings**: New admin interface for global channel control across platforms.
- **Admin Settings UI Modernization**: Complete visual overhaul of `/admin/settings` page with glassmorphism effects and color-coded gradient sections.

## [1.45.0] - Website - 2026-02-06

### Added
- **Channel Views Report**: New comprehensive analytics page (`/admin/reports/channel-views`) with interactive charts and data tables.
- **CSV Export**: Export channel views data as CSV file.
- **Serial Numbers**: Added S.No column to customers table with pagination-aware numbering.

## [1.44.0] - Website - 2026-02-06

### Added
- **Admin Comments**: New dedicated management page (`/admin/comments`) for viewing, searching, and moderating channel comments.
- **Status Toggle**: One-click active/inactive status toggle for comments with visual indicators.
- **Auto-Numbering**: Channel creation form now automatically fetches and pre-fills the next available channel number.

## [1.43.0] - Website - 2026-02-03

### Added
- **Channel Proprietor Details**: Unified section in Channel Form to maintain and display owner contact information and address.
- **Indian Phone Validation**: Integrated robust regex-based validation for Indian phone numbers with real-time UI feedback.
- **Stream Headers Support**: Custom `User-Agent` and `Referer` fields added to Channel Form to support restricted streams.

## [1.42.0] - Website - 2026-01-30

### Added
- **Device Profiles**: Smart HLS configuration engine with tier-aware buffering (High-Tier vs. Low-Tier TV).
- **Navigation**: Home page link integrated into the sidebar branding logo.

## [1.17.0] - 2026-01-07

### Added
- **Dynamic Branding**: Implemented Logo Upload feature in Admin Settings.
- **Dynamic Favicon**: Application favicon now updates automatically based on the uploaded logo.
- **Trending Channels Graph**: Added a dynamic chart in Admin Dashboard showing trending channels with filters.

## [1.8.0] - 2025-12-25

### Added
- **Premium Video Loader**: Replaced default spinner with a high-end animated loader.
- **Persistent Watermark**: Added a permanent, responsive watermark logotype to the video player.
