## [1.71.0] - 2026-06-01

### Added
- **`CustomerStreamsModal`** (`components/admin/CustomerStreamsModal.tsx`) — New modal for managing stream assignments per customer. Two-panel layout: "Currently Assigned" list (stream name, status dot, published_via, compact uptime chip, assigned date, remove button) and "Add Stream" picker (search input + scrollable list of unassigned streams, each with Assign button). All API calls show `Loader2` spinner on the active button while in-flight.
- **Radio icon button** (`app/admin/customers/page.tsx`) — Cyan `Radio` icon button added to the Actions column for every customer row. Opens `CustomerStreamsModal` for that customer.
- **`streamsCustomer` state** (`app/admin/customers/page.tsx`) — `{ uuid, name }` state drives the modal; `null` when closed.

### Changed
- **Lucide imports** (`app/admin/customers/page.tsx`) — Added `Radio`.

---

## [1.70.0] - 2026-06-01

### Added
- **Stream uptime display** — `uptime` field (milliseconds from Flussonic `stats.lifetime`) added to `StreamDetail` and `Stream` interfaces. Detail page Publish Info card shows full format: `2d 19hrs 57min 45sec`. List page Stream column shows compact format: `2d 19h`.

### Changed
- **`fmtUptime(ms)`** (both pages) — Now accepts milliseconds (not seconds); divides by 1000 before computing days/hours/minutes/seconds. Detail page uses word-abbreviated format (`d`, `hrs`, `min`, `sec`); list page uses compact (`d`, `h`).

---

## [1.69.0] - 2026-06-01

### Added
- **Enable/Disable + Restart buttons on stream detail page** (`app/admin/streams/[uuid]/page.tsx`) — `Power` (enable/disable) and `RotateCcw` (restart) buttons added to the page header alongside the existing Sync button. Same behaviour as the list page: Power is green when active / grey when inactive; Restart amber, only shown for active streams; restart simulates via disable → 2s → enable. All three header buttons (`toggle`, `restart`, `sync`) are mutually disabled during any in-flight operation.
- **`toggling` and `restarting` boolean state** — Simple booleans (not maps) since there is only one stream in context.
- **`handleToggle` and `handleRestart` handlers** — Added before `handleSync`; both call `POST /admin/streams/{uuid}/toggle` and reload the stream on completion.

### Fixed
- **Client Sessions duration `0s`** (`fmtDuration`) — Closed sessions with a sub-second duration now display `< 1s` instead of `0s`.

---

## [1.68.0] - 2026-06-01

### Added
- **Stream Enable/Disable button** (`app/admin/streams/page.tsx`) — `Power` icon button per row. Green when `status === 'active'`, grey when inactive. Calls `POST /admin/streams/{uuid}/toggle` with `{ enable: boolean }`. Disabled while toggle or restart is in progress. Hidden for streams with no server or `status === 'deleted'`.
- **Stream Restart button** (`app/admin/streams/page.tsx`) — Amber `RotateCcw` icon button, shown only for active streams. Simulates restart: calls `toggle(disable)` → waits 2 seconds → calls `toggle(enable)`. Spins during the full sequence. Prevents concurrent enable/disable clicks while running.
- **Per-UUID loading state** — `toggling` and `restarting` maps (`Record<string, boolean>`) track in-flight operations individually so only the affected row's buttons reflect loading state.

### Changed
- **Lucide imports** — Added `Power`, `RotateCcw`.
- **Actions column** — Now renders up to 3 buttons: Eye (always), Power (enable/disable), RotateCcw (restart, active streams only).

---

## [1.67.0] - 2026-06-01

### Added
- **Stream client sessions table** (`app/admin/streams/[uuid]/page.tsx`) — New "Client Sessions" section below the info cards grid. Fetches `GET /admin/streams/{uuid}/clients` via `loadClients` callback on mount and after each sync. Table columns: IP (monospace), Protocol (monospace chip), Country, Opened At (formatted from ms epoch), Duration/Status (pulsing green "Active" badge for sessions with no `closed_at`; elapsed time string for closed ones), User Agent (truncated with full text on hover). Session count badge in section header. Loading spinner and empty state handled.
- **`StreamClientRecord` interface** — `{ id, uuid, stream_name, ip, user_agent, protocol, opened_at, closed_at, country }`.
- **Helper functions** — `fmtEpochMs(ms)` formats millisecond epoch timestamps; `fmtDuration(openedMs, closedMs)` returns human-readable elapsed time (e.g. `2h 14m`, `45s`).

### Changed
- **`handleSync`** — Now also calls `loadClients()` after a successful sync so the sessions table refreshes alongside the stream stats.
- **Sync toast** — Updated to include client count: `${clients} clients`.

---

## [1.66.0] - 2026-05-31

### Added
- **Stream 360° detail page** (`app/admin/streams/[uuid]/page.tsx`) — Completely new view replacing the old `StreamForm` edit page. Loads stream via `GET /admin/streams/{uuid}`. Components: live viewer capacity bar (colour-coded: green/amber/red by % full); six info cards using shared `Card` + `StatRow` layout components; back-arrow button; Sync button.
- **Per-stream Sync button** (`/admin/streams/[uuid]`) — `POST /admin/streams/sync?server_uuid={server.uuid}` scoped to the stream's own server. Shows `RefreshCw` spinner; success/error toast; calls `loadStream()` on completion to refresh all stats cards.

### Changed
- **Streams list** (`app/admin/streams/page.tsx`) — Table columns replaced: `Formats` → `Video` (codec, WxH, fps, bitrate), `Viewers` → `Clients` (online_clients / max_sessions with progress bar + source IP below), `Bitrate` removed, new `Audio` (codec, channels) and `Bandwidth` (out_bandwidth Mbps + inputs_bandwidth) columns. `Status` row now stacked (health badge + record status badge).
- **Streams list — Actions column** — Edit (`Link`+`Edit` icon) replaced with Eye (`Link`+`Eye` icon) linking to `/admin/streams/{uuid}`. Delete button and `handleDelete` function removed. "Add Stream" header button removed.
- **Streams list — Filters** — Third dropdown added: `stream_status` (All / Running / Stopped). Search placeholder updated to mention source IP.
- **`Stream` TypeScript interface** — All 17 new fields added as optional: `inputs_bandwidth`, `out_bandwidth`, `online_clients`, `video_width`, `video_height`, `video_codec`, `fps`, `audio_codec`, `audio_bitrate`, `audio_sample_rate`, `audio_channels`, `stream_status`, `published_via`, `published_from`, `client_count`, `stream_url_type`, `max_sessions`.
- **Lucide imports** — `Edit`, `Trash2`, `Plus`, `Zap` removed; `Eye`, `Activity`, `Signal` added.
- **Helper functions** — `fmtBitrate` kept; `fmtKbps` (for out_bandwidth, assumed Kbps) and `fmtBps` (for inputs_bandwidth, assumed bps) added.

---

## [1.65.1] - 2026-05-30

### Added
- **Streams — "Sync with Server" button** (`/admin/streams`) — New button in the page header calls `POST /admin/streams/sync`. Shows a spinning `RefreshCw` icon and "Syncing…" label while in progress. On success displays a toast with created/updated counts. On error shows the full per-server error message (8 s toast duration) so the root cause is immediately visible. Refreshes the stream list automatically after sync.

### Fixed
- **Edit Stream page crash** (`/admin/streams/[uuid]/page.tsx`) — `use(params)` threw "An unsupported type was passed to use(): [object Object]" because `params` is a plain object in this Next.js version, not a Promise. Replaced `use(params)` with direct destructuring `const { uuid } = params`.
- **Edit Tenant page crash** (`/admin/tenants/[uuid]/page.tsx`) — Same `use(params)` issue. Applied the same fix.

---

## [1.65.0] - 2026-05-28

### Added
- **Streams admin** (`/admin/streams`, `/admin/streams/create`, `/admin/streams/[uuid]`) — Full CRUD pages for Flussonic stream resources. List page shows viewer progress bar (red >80%, amber >50%, green), bitrate column (`fmtBitrate` helper), health badge, server name, output formats. `StreamForm` component fetches server dropdown, supports output-format checkboxes (hls/dash/rtmp/webrtc), links back to `/admin/stream-servers` on success.
- **Viewer Sessions admin** (`/admin/viewer-sessions`) — Read-only session browser. Protocol badges (hls/dash/rtmp/webrtc), country, bandwidth column (`fmtBandwidth` helper), stream link.
- **Server Monitoring admin** (`/admin/monitoring`) — Per-server tabbed dashboard. `UsageBar` shows CPU/RAM/disk with colour thresholds (red >85%, amber >60%). Network cards with `fmtBytes()` helper. "Record Snapshot" button calls `POST /admin/monitoring/record-all`. History table below.
- **Tenants admin** (`/admin/tenants`, `/admin/tenants/create`, `/admin/tenants/[uuid]`) — Full CRUD pages for B2B tenants. `TenantForm` component: server multi-select (checkbox list from `/admin/stream-servers`), channel-ID tag input (Enter/comma to add, X to remove), `allowed_servers` and `channel_id` serialised as JSON in payload.
- **`StreamForm` component** (`components/admin/StreamForm.tsx`) — Reusable create/edit form for streams.
- **`TenantForm` component** (`components/admin/TenantForm.tsx`) — Reusable create/edit form for tenants.
- **`layout.tsx` files** — Added missing `AdminLayout` wrapper for `/admin/viewer-sessions`, `/admin/monitoring`, and `/admin/tenants` routes so the sidebar renders consistently.

### Changed
- **Admin Sidebar** (`AdminSidebar.tsx`) — Stream Servers expandable group extended with "Streams" (`/admin/streams`) and "Monitoring" (`/admin/monitoring`) children (4 items total). Expanded-group max-height raised from `max-h-40` to `max-h-56`. New top-level items: "Viewer Sessions" (`Monitor` icon) and "Tenants" (`Building2` icon).
- **Stream Servers list** (`/admin/stream-servers/page.tsx`) — "Ping All" button added (calls `POST /admin/stream-servers/ping-all`; `RefreshCw` spinning icon during request).
- **Settings page** (`/admin/settings/page.tsx`) — New "Stream Server Health" section: `stream_server_ping_interval` dropdown (1/2/5/10/15/30/60 min) with Save button. Cron setup code blocks for both Windows Task Scheduler and Linux crontab displayed below.

---

## [1.64.1] - 2026-05-27

### Fixed
- **Test Connectivity — edit mode fails with "Username and password are required"** (`StreamServerForm.tsx`) — In edit mode the password is not returned by the API (`$hidden`), so the test-connection payload contained an empty password and the backend rejected it. Fix: `uuid` is now included in the test-connection request body (`initialData?.uuid ?? ''`). The backend uses the UUID to load and decrypt the stored credentials when the password field is blank.

---

## [1.64.0] - 2026-05-27

### Changed
- **Stream Servers Admin — full Flussonic overhaul** — All `/admin/stream-servers` pages rebuilt to align with Flussonic Media Server. MistServer auth state panel, streaming endpoint sections, hardware specs, and feature flags removed.
  - **List page** (`page.tsx`) — `StreamServer` interface updated to Flussonic fields: `server_host_ip`, `server_host_domain`, `api_port`, `api_version`, `region`, `timezone`, `health_status` (online/offline only), `last_ping_at`, `status` (active/inactive/expired/deleted). Table columns: #, Server (name + username), Host/Domain, API Endpoint (`:port/streamer/api/version`), Region, Last Ping, Health, Status, Actions. Filters: Status + Health only. Search placeholder updated to "name, IP, domain, or region".
  - **Form** (`StreamServerForm.tsx`) — Replaced 9-section MistServer form with Flussonic form: Server Identity, Host/Connection, Flussonic API (port, version, username, password, bearer token), Location & Details, Status. Password labelled "leave blank to keep" on edit. Live API Base URL preview below port/version fields.
  - **Details modal** (`StreamServerDetailsModal.tsx`) — Rebuilt for Flussonic: Hero section (health/status badges, connection grid, last ping), Flussonic API section (port, version, username, base URL, 4 quick-copy endpoint links), System & Lifecycle section. All MistServer-specific sections removed.

### Added
- **Test Connectivity button** (`StreamServerForm.tsx`) — Inline button POSTs to `POST /admin/stream-servers/test-connection`. Animated state machine: idle → testing (spinner) → success (Wifi icon, emerald) → error (WifiOff icon, red). Success banner shows liveness URL; error banner shows failure reason. Any connection field edit resets state to idle.
- **Dashboard Stream Server stats** (`/admin/dashboard`) — Two new stat cards: "Stream Servers" (orange, total non-deleted) and "Online Servers" (emerald, health=online). Grid expanded to 5 columns (`xl:grid-cols-5`). New "Stream Servers" panel in the 3-column recent-activity section: each row shows a server icon (coloured by health), name, IP, and animated health badge.
- **Admin Sidebar expandable Stream Servers group** (`AdminSidebar.tsx`) — "Stream Servers" converted from a flat link to a collapsible group with "All Servers" (`/admin/stream-servers`) and "Add Server" (`/admin/stream-servers/create`) children. Group defaults to open in `openMenus` initial state.

---

## [1.63.1] - 2026-05-25

### Fixed
- **Visual Ad — admin sidebar missing** (`/admin/visual-ads/layout.tsx` — NEW): Added missing `AdminLayout` wrapper so the sidebar renders on the `/admin/visual-ads` page.
- **Visual Ad — not showing on channel switch** (`ClassicHome.tsx`): Replaced stale `useCallback` closure with a `useEffect` watching `selectedChannel?.uuid`. Uses raw `fetch()` to bypass the api.ts 5xx-interceptor that silently returns a never-resolving `Promise`. Added `prevAdChannelUuid` ref to skip the initial load and only trigger on real switches.
- **Visual Ad — overlay hidden behind VideoPlayer** (`VideoAdOverlay.tsx`, `ClassicHome.tsx`): Raised overlay `z-index` to `z-[999]`; added CSS `isolate` class on the VideoPlayer wrapper div to create an independent stacking context.
- **Visual Ad — React Strict Mode double impression count** (`VideoAdOverlay.tsx`): Replaced `useState` boolean guard with `useRef(false)` (`trackedRef`) so Strict Mode's double-fired effects never call the impression API twice.
- **Visual Ad — channel audio audible during ad / ad starts muted** (`VideoAdOverlay.tsx`, `VideoPlayer.tsx`): `VideoAdOverlay` now starts unmuted (`useState(false)`) so ad audio plays automatically (browser allows this after a user gesture). `VideoPlayer` gains an `adPlaying?: boolean` prop; when `true` the channel `<video>` element is muted while keeping the stream buffering silently; the prior mute state is restored via `priorMutedRef` when the ad ends or is skipped.
- **API 401 interceptor false session-expiry redirect** (`lib/api.ts`): The 401 handler now only redirects to `/login?error=session_expired` for endpoints that genuinely require authentication (`/customers/`, `/payments/`, `/favorites`, `/sessions`). Optional-auth endpoints (channels, ads) returning 401 for restricted content no longer trigger spurious logouts.

---

## [1.55.0] - 2026-05-25

### Improved — Home Page, Navbar & Footer Redesign

#### Home Page (`app/page.tsx`)
- **Hero Section**: Full-viewport (`min-h-[100svh]`) with two animated floating orbs, subtle dot-grid background, and staggered `animate-fade-up` entrance for badge, headline, subtext, CTAs, and trust badges.
- **Stats Row**: New animated count-up section (200+ channels, 50k+ viewers, 99% uptime, 24/7 support) powered by `IntersectionObserver` — numbers count up when scrolled into view.
- **Features Grid**: Six feature cards, each with a unique accent colour (yellow, rose, cyan, purple, green, sky) and a full-card gradient glow on hover. Staggered scroll-in animation via `IntersectionObserver`.
- **App Download Section**: New section with a floating phone mockup (CSS animation), feature checklist, and Google Play badge linking to the Play Store. Slides in from both sides on scroll.
- **Final CTA**: Uncommented and redesigned — glowing radial-gradient card with dual action buttons (Get Started / Browse Channels).
- **Scroll Animations**: `useInView` hook (thin wrapper around `IntersectionObserver`) drives opacity + translateY transitions on Stats, Features, App, and CTA sections. `useCountUp` handles animated number counters.

#### Navbar (`components/Navbar.tsx`)
- **Scroll-aware glass**: Border shadow intensifies as user scrolls; stays subtle at page top.
- **Active route highlighting**: Current page link has white background + cyan underline indicator; inactive links are muted until hovered.
- **"Watch TV" desktop link**: Added missing direct link to `/channels` in the desktop nav bar.
- **Route-change close**: Mobile sidebar auto-closes when the pathname changes.
- **Icons in mobile sidebar**: Each nav item now has a Lucide icon; active route is highlighted with `bg-primary/15` pill.
- **`next/image`**: Replaced raw `<img>` for logo with `<Image>` (optimised).
- **Cleaner icon sizing**: Unified icon sizes (19 px for toolbar actions), hover states use `hover:bg-slate-800` rounded pill instead of plain colour change.

#### Footer (`components/Footer.tsx`)
- **Gradient hairline**: 1 px `via-primary/30` gradient line across the very top of the footer.
- **Depth orbs**: Two subtle background blur orbs (primary + purple) for visual depth.
- **Icons on links**: Every Quick Links and Legal row now has a matching Lucide icon with opacity transition on hover.
- **`next/image`**: Both logo and Play Store badge use `<Image>` instead of raw `<img>`.
- **"Need Help?" mini-card**: Compact support card tucked in the Legal column.
- **Status dot**: Pulsing green "All Systems Operational" indicator in the bottom bar (replaces static version string).
- **Responsive grid**: 4-col on desktop, 2-col on tablet, 1-col on mobile — collapses cleanly.

#### CSS (`app/globals.css`)
- Added `@keyframes fade-up` + `.animate-fade-up` utility for hero entrance animations.
- Added `hero-orb-1` / `hero-orb-2` slow floating keyframes for background depth blobs.
- Added `.hero-grid` dot-grid background pattern for the hero section.
- Added `phone-float` gentle up/down float keyframe for the app mockup.

---

## [1.54.0] - 2026-05-11

- **Feature**: **Stream Server 360° View** - New `StreamServerDetailsModal` component providing a full read-only detail view of any stream server. Triggered by a purple Eye button in the stream servers list. Sections: identity/host badges, live capacity cards (streams & viewers with % usage), MistServer API credentials with last-validated challenge/hash copy blocks, all 6 streaming endpoint URLs (copyable), hardware specs, feature flag pills, system & lifecycle timestamps, and notes.

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
