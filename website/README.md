# Nellai IPTV - Frontend v1.72.0

A Next.js 14 application providing a modern, responsive interface for the Nellai IPTV platform. Optimized for Web, Mobile, and TV browsers.

## 🚀 Features

### **Latest Updates (v1.72.0)**
- **Feature**: **Customer My Streams — Navbar dropdown** — "My Streams" panel inside the authenticated user menu. Per-stream health dot (green/red/grey), status badge, uptime, online clients, and out-bandwidth. **Sync** button (30 s cooldown) sends `?sync=1` to trigger a live Flussonic pull. **Restart** button (30 s cooldown) toggles the stream off then on with a 2 s delay.
- **Feature**: **Customer My Streams — Classic Mode panel** — Collapsible "My Streams" card in the Classic Mode sidebar. Expandable per-stream rows with full video/audio/bandwidth details and a client sessions table (IP, Protocol, Country, Opened At, Duration).
- **Fix**: **`useCallback` wrapping** (`Navbar.tsx`) — `useCallback` was imported but `fetchStreams` was not wrapped; fixed. Both `fetchStreams` and `fetchMyStreams` now use `useCallback` with `[]` deps.
- **Fix**: **`try/finally` in sync handlers** — `setSyncing(false)` now always runs, preventing a stuck button when the Axios 500-interceptor returns a never-resolving promise in production.
- **Fix**: **Restart button idle label** — Was rendering an empty string when idle; fixed to `'Restart'`.
- **Fix**: **Cache-busting** — `?_t=Date.now()` appended to every `GET /customers/streams` request.

### **Previous Updates (v1.71.0)**
- **Feature**: **Customer stream assignment** (`/admin/customers`) — Cyan `Radio` icon button per customer opens `CustomerStreamsModal`. Modal shows currently assigned streams with a remove (trash) button per stream, and a searchable picker to assign new ones. Spinner feedback on every in-flight action.

### **Previous Updates (v1.70.0)**
- **Feature**: **Stream uptime synced from Flussonic** (`stats.lifetime` ms field) — Uptime stored in `streams.uptime` column and displayed as `2d 19hrs 57min 45sec` on the detail page Publish Info card and as compact `2d 19h` chip on the list page.
- **Fix**: **Uptime `lifetime` field** — Backend now reads `stats.lifetime` (ms) as the canonical Flussonic uptime field; falls back to `uptime`, `alive_time`, `run_time`, then computed from `start_time`.
- **Feature**: **Stream 360° detail page** (`/admin/streams/[uuid]`) — New view with live viewer bar and 6 info cards: Publish Info, Video Track, Audio Track, Bandwidth, Stream Server, Record Info.
- **Feature**: **Per-stream Sync button** — Header button on the detail page syncs that stream's server and refreshes the view.

### **Previous Updates (v1.65.1)**
- **Feature**: **Streams — "Sync with Server" button** (`/admin/streams`) — Calls `POST /admin/streams/sync`; spinner during sync; success toast with created/updated counts; per-server error message on failure; auto-refresh after sync.
- **Fix**: **Edit Stream page** (`/admin/streams/[uuid]/page.tsx`) — `use(params)` runtime crash fixed; `params` is a plain object in this Next.js version.
- **Fix**: **Edit Tenant page** (`/admin/tenants/[uuid]/page.tsx`) — Same `use(params)` crash fixed.

### **Previous Updates (v1.65.0)**
- **Feature**: **Streams admin** (`/admin/streams`) — Full CRUD, viewer progress bar, bitrate, health badge, server column, output format chips.
- **Feature**: **Viewer Sessions admin** (`/admin/viewer-sessions`) — Read-only browser with protocol badges, bandwidth, country.
- **Feature**: **Server Monitoring admin** (`/admin/monitoring`) — Per-server tabbed dashboard with CPU/RAM/disk bars, network cards, snapshot button, history table.
- **Feature**: **Tenants admin** (`/admin/tenants`) — Full CRUD with server multi-select and channel-ID tag input.

### **Previous Updates (v1.64.1)**
- **Fix**: Test Connectivity edit mode — `uuid` sent in test-connection payload; backend resolves stored credentials when password is blank (API hides it on load).

### **Previous Updates (v1.64.0)**
- **Changed**: **Stream Servers Admin** — All `/admin/stream-servers` pages rebuilt for Flussonic Media Server. List table now shows API endpoint (`:port/streamer/api/version`), region, last ping, and health (online/offline only). MistServer auth state panel, streaming endpoint URLs, hardware specs, and feature flag sections removed.
- **Feature**: **Test Connectivity** — Inline button in `StreamServerForm.tsx` POSTs to `test-connection`; shows animated idle/testing/success/error states with Wifi/WifiOff/PlugZap icons and inline result banner.
- **Feature**: **Dashboard Stream Server cards** — "Stream Servers" (orange) and "Online Servers" (emerald) stat cards. Dashboard grid is now 5 columns. New "Stream Servers" recent-activity panel.
- **Changed**: **Admin Sidebar** — "Stream Servers" is now an expandable group (All Servers / Add Server), defaulting open.

### **Previous Updates (v1.63.1)**
- **Fix**: Visual Ad admin sidebar — added missing `AdminLayout` wrapper (`/admin/visual-ads/layout.tsx`).
- **Fix**: Visual Ad not showing on channel switch — `useEffect` on `selectedChannel?.uuid` + raw `fetch()` replacing stale closure + api.ts interceptor bypass.
- **Fix**: Visual Ad overlay hidden behind VideoPlayer — `z-[999]` + CSS `isolate` stacking context.
- **Fix**: React Strict Mode double impression count — `useRef` guard in `VideoAdOverlay`.
- **Fix**: Channel audio audible during ad / ad started muted — ad starts unmuted; `VideoPlayer` `adPlaying` prop mutes channel stream during ad and restores mute state on complete/skip.
- **Fix**: API 401 interceptor false session-expiry redirect — only redirects for genuinely auth-required endpoints.

### **Previous Updates (v1.55.0)**
- **Home Page Redesign**: Full-viewport hero with animated floating orbs, dot-grid background, and staggered `animate-fade-up` entrance animations. New animated stats row (count-up numbers on scroll). Feature cards with per-card accent colours and gradient hover glow. New App Download section with floating phone mockup and Google Play badge. Restored and redesigned final CTA section. All scroll-triggered sections use `IntersectionObserver` via a `useInView` hook.
- **Navbar Redesign**: Scroll-aware glass effect (shadow intensifies on scroll). Active route highlighting (white bg + cyan underline). "Watch TV" link added to desktop nav. Mobile sidebar auto-closes on route change; each nav item has a Lucide icon and active-pill styling. `next/image` used for logo. Unified icon sizing and hover states.
- **Footer Redesign**: Gradient hairline across the top. Background depth orbs. Lucide icons on all Quick Links and Legal rows. `next/image` for logo and Play Store badge. "Need Help?" support mini-card. Pulsing green "All Systems Operational" status dot. Responsive 4→2→1 column grid.
- **CSS Animations**: `animate-fade-up`, `hero-orb-1/2` floating blobs, `.hero-grid` dot pattern, `phone-float` mockup animation — all added to `globals.css`.

### **Previous Updates (v1.54.8)**
- **Channel Manager — Status Editing**: The `/admin/channels/renumber` page now also allows inline status changes. Each row's Status column is a dropdown with four options: Active, Inactive, Blocked, Deleted. The dropdown border turns amber when the value differs from the saved state. Status and channel number changes are tracked independently; a single Save call submits only the dirty fields for each channel (number-only, status-only, or both).
- **Channel Manager — Search by Number**: The search field now matches on channel number in addition to channel name (e.g. typing `5` surfaces channel 5, typing `sun` surfaces "Sun TV"). Status filter updated to include Blocked.

### **Previous Updates (v1.54.7)**
- **Channel Number Manager** (`/admin/channels/renumber`): New admin page for updating channel numbers in bulk. Loads all channels sorted by channel number, displays them in a two-per-row table layout (Channel # | Name | Category | Status on each side). Channel number inputs are inline-editable — changed rows highlight amber, duplicate numbers highlight red with an alert icon. Client-side search by name and status filter (Active / Inactive / Deleted). Duplicate number detection blocks saving with a detailed banner. Save button batch-submits only dirty rows via `POST /admin/channels/batch-renumber`; Reset button discards all edits. Sidebar "Channels" group updated with "All Channels" and "Channel Numbers" children.

### **Previous Updates (v1.54.6)**
- **Channel IP View Details Modal**: Each row in the Channel Performance Details table (`/admin/reports/channel-views`) now has a "View" eye-icon button. Clicking it opens a modal scoped to the active date filter. The modal shows a 3-card summary strip (Total Views, Unique IPs, Record count) and a scrollable IP details table (IP Address, Date, Views) sorted by date desc. Includes loading spinner, backdrop-dismiss, and empty state. Calls the new backend `GET /admin/reports/channel-view-details` endpoint.

### **Previous Updates (v1.54.5)**
- **HTTP Mixed-Content Warning**: Yellow warning banner appears below the `/player` URL bar whenever an `http://` URL is entered on the HTTPS-hosted site. Explains that the URL is auto-upgraded to HTTPS and playback will fail if the server has no SSL certificate. The error overlay also shows a targeted mixed-content callout when playback fails under these conditions.
- **Google Play Badge Moved to Footer**: Removed the badge from the home page hero section; added it to the footer branding column (`Footer.tsx`) above the social icons, so it's globally visible on every page.

### **Previous Updates (v1.54.4)**
- **Real-Time Video Stats**: Toggleable stats overlay on `/player` (button or `D` key) showing Resolution, Buffer health, Bandwidth estimate, Dropped frames (Chrome), and Live latency. Updates every 1 s while playing; shows "last known values" when paused.
- **Sparkline Graphs**: Cyan bandwidth graph and green buffer graph (last 60 s of history) rendered as SVG polylines inside the stats panel. Graphs reset automatically when a new stream is loaded.
- **DASH.js Fix**: Replaced `reset()` with `destroy()` for proper cleanup between streams. Pinned CDN to `v4.7.4` (was `latest`). Added `STREAM_INITIALIZED`, `CAN_PLAY`, and `PLAYBACK_STARTED` events alongside `PLAYBACK_METADATA_LOADED`. Added a 300 ms polling fallback that detects `window.dashjs` even if `onLoad` misfires.
- **Home Button**: House icon button added to the `/player` header bar, linking back to `/`.
- **Watermark Removed**: Watermark removed from the `/player` page.
- **Google Play Badge**: "Get it on Google Play" badge (`get_it_on_google_playstore.webp`) added to the home page hero, below the Watch Now / Create Account buttons, linking to the Play Store listing.
- **Player Promo Section**: New home page section (between Features and About) promoting `/player` — two-column card with feature chips, "Open Player" CTA, and a mock player preview showing badges, real-time stats, seek bar, and controls.

### **Previous Updates (v1.54.3)**
- **DASH.js Loading Fix**: Switched Script strategy to `afterInteractive`; a `pendingDashRef` queue stores the load request if DASH.js hasn't finished downloading and auto-replays it on `onLoad` — eliminating the "DASH.js still loading" error.
- **Stretch Toggle**: New button in player controls (shortcut `S`) switches `object-fit` between `contain` (letterbox) and `fill` (stretch) in landscape. Portrait always stays `contain` via CSS media query.
- **URL Clear Button**: `×` icon inside the URL input clears text, stops playback, and resets the player to idle in one click.
- **SEO & Metadata**: `app/player/layout.tsx` exports server-side `Metadata` (title, description, 15 keywords, OpenGraph, Twitter Card, canonical URL, robots). Page includes `WebApplication` JSON-LD schema, H1 hero heading, 6 feature cards, keyboard shortcut reference, and a 6-item crawlable FAQ using `<details>/<summary>` — all below the fold, accessible by scrolling.
- **Header Branding**: Shows the app icon (`logo_url`, `h-8 w-8 rounded-lg`) + "Nellai " (white) + "IPTV" (cyan) bold text matching the brand identity.
- **Watermark**: Enlarged to `w-24 sm:w-32 md:w-40`, opacity reduced to `0.35`, shifted 5 px right (`left: 21px`), and rendered only while `isPlaying` is true.
- **Layout**: Sticky header, scrollable page (`overflow` restored), player fixed at `calc(100vh - 56px)` — first viewport is pure player, scroll reveals SEO content.

### **Previous Updates (v1.54.2)**
- **Universal Media Player** (`/player`): Standalone player page supporting HLS (`.m3u8` via hls.js), DASH (`.mpd` via dash.js CDN), and MP4/WebM/native video. Auto-detects stream type from URL extension. Custom controls: play/pause, seek bar (disabled for live), current time/duration, volume slider, mute, quality selector (HLS ABR levels), fullscreen. LIVE badge for live streams, loading/error states with retry, example stream presets, HTTP→HTTPS mixed-content upgrade, keyboard shortcuts (Space, M, F, ←→ ±10s, ↑↓ volume). Immersive no-navbar/no-footer layout via `LiteRouteGuard`.

### **Previous Updates (v1.54.1)**
- **Preview Player Portrait Fix**: `ClapprPlayer.tsx` now preserves the video's 16:9 aspect ratio on portrait/vertical mobile screens using `object-fit: contain` (letterboxing) instead of stretching with `fill`. Landscape and TV views remain unchanged. Applied via JS orientation check, a `@media (orientation: portrait)` CSS rule, and re-application on resize/rotation.

### **Previous Updates (v1.54.0)**
- **Stream Server 360° View**: New `StreamServerDetailsModal` with a purple Eye button in the list. Full read-only detail view covering all server fields: identity, host, live capacity, MistServer API auth state, all 6 streaming endpoints (copyable), hardware specs, feature flag pills, system & lifecycle info.

### **Previous Updates (v1.53.0)**
- **Stream Servers Admin CRUD**: New `/admin/stream-servers` with list, create, and edit pages. Filters: status, health (Online/Offline/Warning/Maintenance), server type. Colour-coded health badges with icons.
- **StreamServerForm**: 9-section form covering all server properties — identity, host, MistServer API (protocol/host/port/username/password), streaming endpoints, infrastructure, hardware specs, capacity, feature flags (HLS/RTMP/CMAF/WebRTC/SRT/Transcoding), security & status.
- **MistServer Auth State Panel**: Read-only panel on edit page showing last validated `mist_challenge` and `mist_final_hash` with copy buttons.
- **Sidebar**: "Stream Servers" link added with `Server` icon.

### **Previous Updates (v1.51.0–1.52.0)**
- **Direct Backend Auth Integration**: Forgot/reset password pages now call the backend directly, removing redundant Next.js API middleware routes.
- **Scrolling Ads Admin Sidebar**: Added `AdminLayout` wrapper to `/admin/scrolling-ads`.
- **Guest Redirect Fix**: 401 Axios interceptor now only redirects to login when an active session token exists — guest channel browsing no longer triggers "Session expired" errors.
- **Feedback System**: Public `/feedback` page, admin `/admin/feedback` management page, sidebar link.

### **Previous Updates (v1.50.5)**
- **Admin Player Watermark**: Added an automated watermark system to the admin preview player (`ClapprPlayer.tsx`). The player now pulls the `app_logo_png_path` from settings and overlays it at the bottom-left with 60% opacity.

### **Previous Updates (v1.50.4)**
- **Universal Share Link Fallback**: Overhauled the share link routing to be truly universal. The 3-second visual countdown now appears on both Desktop and Mobile devices, resolving issues where Desktop users were being instantly redirected without seeing the UI. Deep-link triggers are now handled safely on the client-side.

### **Previous Updates (v1.50.3)**
- **Share Link Visual Countdown**: Reworked the mobile fallback UI for channel sharing. Replaced silent redirects with a structured, dark-themed UI featuring a live Javascript-powered 3-second visual countdown that explicitly warns users before falling back to the Web Preview via `window.location.replace`.
- **Cross-Platform Deep Linking**: Injected an OS detection script into the routing boundary. Ensures iOS effectively routes to the app via its custom `nellaiiptv://` scheme while retaining the required `intent://` target for Android devices.

### **Previous Updates (v1.50.2)**
- **Admin Player Native Video Fallback Fix**: Properly registered `@clappr/hlsjs-playback` in the Admin preview player (`ClapprPlayer.tsx`). This resolves a silent failure where Clappr dropped to the native HTML5 `<video>` element on Chrome (throwing "browser does not support" errors) because it didn't inherently know how to bridge to `Hls.js` without the plugin.

### **Previous Updates (v1.50.1)**
- **Admin Player Mixed Content Fix**: Applied `resolveStreamUrl()` to `ClapprPlayer.tsx` to automatically upgrade `http://` streams to `https://` on secure admin pages, mirroring the behavior of the main player.
- **Admin Player HLS Parsing**: Enforced `mimeType: 'application/x-mpegURL'` in Clappr configuration, ensuring robust HLS stream detection even when URLs contain tokens or lack clear extensions.

### **Previous Updates (v1.50.0)**
- **Mixed Content / HTTPS Playback Fix**: Added `resolveStreamUrl()` helper in `VideoPlayer.tsx` that automatically upgrades `http://` HLS stream URLs to `https://` when the page is served over HTTPS. Fixes "Your browser does not support the playback of this video" error on hosted (HTTPS) servers caused by browser Mixed Content blocking.
- **ClapprPlayer SD→HD Stretch**: `ClapprPlayer.tsx` now forces Clappr's internal `<video>` element to fill the full player container with `object-fit: fill`, stretching SD content to full HD. Enforced via inline styles, a persistent `<style>` tag, and a `MutationObserver` for resilience against Clappr's internal reflows.

### **Previous Updates (v1.49.0)**
- **Type Safety**: Verified and fixed `channelUuid` prop propagation to video players, ensuring strict TypeScript compliance.

### **Previous Updates (v1.49.0)**
- **Admin Comments**: New dedicated management page (`/admin/comments`) for viewing, searching, and moderating channel comments.
- **Status Toggle**: Low-friction status toggling (Active/Inactive) for comments directly from the list view.
- **Auto-Numbering**: Intelligent channel form that pre-fetches the next available channel number to prevent conflicts.
- **API Stability**: Resolved empty filter dropdowns by aligning API parameters with backend schemas.

### **Previous Updates (v1.49.0)**
- **Channel Proprietor Details**: Unified section in Channel Form to maintain and display owner contact information and address.
- **Indian Phone Validation**: Integrated robust regex-based validation for Indian phone numbers with real-time UI feedback (color-coded borders and messages).
- **Stream Headers Support**: Custom `User-Agent` and `Referer` fields added to Channel Form to support restricted streams.
- **Improved API Resilience**: Standardized on Admin API endpoints for fetching metadata, resolving "Failed to load" errors in filters and forms.

### **Previous Updates (v1.49.0)**
- **Maintenance**: Version synchronized with latest App Release (v1.8.8+24).
- **Improved Performance**: Refined HLS buffering profiles for consistent cross-device stability.

### **Previous Updates (v1.49.0)**
- **Device Profiles**: Tier-aware HLS buffering engine for optimized PC & TV playback.
- **Unified Branding**: Sidebar logo now functions as a global "Home" navigation link.
- **Ad Refinement**: Full-width grid banners replace individual channel ads.

### **Previous Updates (v1.38.0)**
- **Kiosk Mode**: Dedicated distraction-free viewing experience by hiding navigation controls when Open Access is active.
- **Disclaimer Overlay**: Fine-tuned z-index management for reliable display of system messages.

### **Previous Updates (v1.37.0)**
- **Open Access Mode**: Unauthenticated guests can now watch channels directly if enabled in settings.
- **Auto-Redirection**: Intelligent routing from home to channels list for guest users in Open Access mode.
- **Reseller Dashboard (v1.35.1)**: Integrated Wallet Card and optimized timezone-aware plan assignments.
- **Transaction Management**:
    - **Advanced Filtering**: Search and filter admin transactions by status, gateway, and search term.
    - **Improved UX**: Added dedicated transaction layout for consistency.
- **Enhanced Customer Management**:
    - **Role Column**: Added sortable role column to customer table.
    - **Role Filter**: Filter customers by role (All/Customer/Reseller).

### **Previous Updates (v1.33.0)**
- **Authentication Guards**: Implemented automatic redirects for authenticated users on login/register pages.
- **Home UX**: Conditionally hide guest-specific UI for logged-in users.

### **Previous Updates (v1.32.0)**

### **Previous Updates (v1.31.0)**
- **Smart Fallback & Recovery**:
    - Implemented automatic switch to high-quality MP4 fallback when HLS streams fail or time out (20s).
    - Added background monitoring with real-time countdown for automatic live stream recovery.

### **Previous Updates (v1.30.3)**
- **Absolute URLs**: The application now strictly uses `_url` properties from API responses, eliminating relative path resolution logic.

### **Previous Updates (v1.30.0)**
- **Image Resolution Engine**:
  - Implemented `resolveImageUrl` utility to handle production URL construction dynamically.
  - Fixed `logo_url` vs `logo_path` inconsistencies across the application.
  - Ensures correct image loading regardless of subfolder deployment (e.g. `/backend/public`).

### **Previous Updates (v1.29.0)**
- **Admin Tools**:
  - **API Documentation**: Interactive API reference with detailed header requirements built directly into the Admin Panel.
  - **API Key Manager**: GUI for managing secure API access keys with platform restrictions (Web, TV, Android, iOS).
  - **Subscription Management**: Full CRUD for subscription plans.

### **Previous Updates (v1.28.2)**
- **Dynamic Watermark**: Player now uses specific `app_logo_png_url` from backend settings for the persistent watermark.
- **Asset Resolution**: Enhanced `useBranding` hook to correctly resolve image paths from backend subdirectories.

### **Previous Updates (v1.28.0)**
- **Hybrid Responsive Player**: 
  - Smart control layout that switches from absolute centering (Desktop) to flexbox (Tablet/Mobile) to guarantee 0% overlap.
  - Constrained side panels and optimized spacing for all resolutions.
- **Immersive Classic Mode**: 
  - Removed standard web Navbar/Footer in Classic Mode for a native TV app feel.
  - Fixed blank screen race condition on refresh.


### **Core**
- **Dual Mode Interface**:
  - **OTT Mode**: Modern, Netflix-style layout with Featured Banners, Trending Rows, and "Continue Watching".
  - **Classic Mode**: Traditional TV-guide style list for quick channel surfing. (Now resets to OTT Mode on browser restart).
- **Smart Device Optimization**:
  - **HLS Profiling**: Dynamic buffer settings (20MB for TV, 60MB for PC) based on device capabilities.
  - **Watermark Engine**: Dynamic, backend-configured watermark overlay for video players (`png` support).
  - **Resolution Capping**: Prevents 4K streams from crashing 1080p hardware.
- **Admin Tools**:
  - **API Documentation**: Interactive API reference built directly into the Admin Panel.
  - **API Key Manager**: GUI for managing secure API access keys.
  - **Subscription Management**: Full CRUD for subscription plans.
... (Rest of the file remains similar, just highlighting the key updates)
