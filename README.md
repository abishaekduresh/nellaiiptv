# Nellai IPTV Project

This repository contains the source code for the Nellai IPTV ecosystem, including the mobile/TV application and backend services.

## Components

### `website` (Next.js)
Premium web interface optimized for Browsers and Smart TV.
- **Version**: 1.82.0
- **Key Features**: **Flussonic Media Server** (stream servers admin rebuilt — Flussonic API columns, Test Connectivity button with live liveness check, `StreamServerDetailsModal` with Flussonic sections, dashboard Stream Server stat cards, expandable sidebar group), Visual Ads System (YouTube-style pre-roll video ads — `.m3u8`/`.mp4`, skippable/non-skippable, countdown timer, skip button, unmuted by default, channel audio muted during ad via `adPlaying` prop restored on skip/complete, click-through tracking, impression/skip/click analytics, session-based frequency limiting, plan-level + guest/free-user targeting, weighted random selection), Visual Ads Admin CRUD (`/admin/visual-ads` — sidebar via layout.tsx, full table with live stats, create/edit modal), AdSense Policy Compliance (script restricted to content pages only; `sitemap.xml` + `robots.txt` generated), Expanded About Page (FAQ, How It Works, Channel Categories, Platform details), Payment Gateway UI (enable/disable toggle per gateway with inline Test Transaction button; credentials managed via backend `.env`), Channel Manager Stream Preview (HLS player modal with loading/buffering/error/retry states, live badge, copy URL, no-controls clean view), Channel Manager Confirm-Save Modal (per-channel diff of number and status changes with thumbnail, arrow indicators, sorted by new number), Full Admin Portal Redesign (modern slate theme, animated, mobile-responsive sidebar, dashboard, all CRUD pages), Admin Layout Isolation (public Navbar/Footer hidden on admin/reseller routes), Admin Branding (logo on login page + sidebar, sidebar logo links to home), Redesigned Home Page (animated hero, stats counter, feature cards, app download section, CTA), Modernised Navbar (scroll-aware glass, active routing, TV link), Modernised Footer (gradient hairline, icons on links, status dot), Channel Manager (inline renumber + status edit, number search), Channel IP View Details Modal, Feedback System, Admin Feedback Management, Backend-Only Auth, HTTP Mixed-Content Warning, ClapprPlayer SD→HD Stretch, Portrait Mobile Letterbox, Universal Media Player (`/player`) with real-time stats & sparkline graphs, Google Play badge, Player Promo Section, Scrolling Ads Ticker, RTMP URL Support.

### `backend` (Slim PHP)
RESTful API with role-based access control and subscription management.
- **Version**: 1.56.0
- **Key Features**: **Flussonic Media Server** (`FlussonicApiService` — TCP pre-check, HTTP→HTTPS auto-detection, Basic Auth + Bearer token, liveness endpoint; `test-connection` API endpoint; `stream_servers` table rebuilt to 18 clean Flussonic columns; `total_servers` + `online_servers` in dashboard stats; MistServer `MistAuthService` and challenge-response auth removed), Visual Ads API — `GET /api/visual-ads/active` (plan-aware, guest/free-user targeting, date range, weighted random), `POST /api/visual-ads/{uuid}/impression|skip|click` (analytics counters), Admin CRUD (`GET|POST|PUT|DELETE /api/admin/visual-ads`), `visual_ads` table migration, `show_visual_ads` column on `subscription_plans`. `ChannelController` `isTrustedApp` now checks `API_SECRET` env var first (fixes master-key 401). Payment Gateway Test API (`POST /api/admin/settings/test-payment`) — reads Razorpay/Cashfree credentials from `.env`; SSL-safe CA bundle resolution for WAMP. Batch Channel Update API (number + status, swap-safe two-phase update), AES-256 Password Encryption, Feedback API, Password Reset Service, Email Templates, CORS/OPTIONS Stability, Scrolling Ads API, Channel View Details API.

### `nellai_iptv_app` (Flutter)
A premium multi-channel IPTV player built for Android and Android TV.
- **Version**: 1.14.0+69
- **Key Features**: My Streams Screen (customer-facing stream management — stream cards with status/health/codec details, client sessions table, Sync button with 30 s cooldown, per-stream Restart with 2 s disable→enable sequence and 30 s cooldown, pull-to-refresh), Profile Screen portrait + landscape orientation support, Visual Pre-roll Ads (YouTube-style full-screen video ads on channel switch — skippable/non-skippable, countdown, skip button, mute toggle, click-through tracking, impression/skip/click analytics, per-session frequency limiting, double-tap fullscreen, `FittedBox.fill` stretch), `video_player` (ExoPlayer) engine for universal Android TV hardware support, `ValueListenableBuilder` buffering overlay, Enhanced ColorFilter contrast/colour matrix (1.22× contrast, cross-channel warmth, −16 bias), `FilterQuality.high`, stall-free ExoPlayer error/buffering via `VideoPlayerValue`, TV audio mute fix, Contact Us form (`POST /contact`), Feedback System, Forgot Password Flow, Responsive Classic Screen Header, Storage Management, Enhanced Channel Search, Deep Link Share, Focus Persistence.

### `single_channel_player_app` (Flutter)
A lightweight single-channel HLS player optimized for Mobile and Android TV.
- **Version**: 1.3.5+11
- **Key Features**: Android TV Launcher (LEANBACK_LAUNCHER), TV Remote D-pad & Media Key support, Runtime TV Detection, Auto-Reconnect on network loss, Double-tap to Mute, PiP (mobile), Session Volume, Gesture Controls (brightness/volume swipe), HLS-optimised ExoPlayer pipeline (`formatHint: VideoFormat.hls`), blue-themed exit dialog, Screenshot blocking (`FLAG_SECURE`), debug/root/emulator detection (`ENABLE_DEBUG_BLOCK`).

## Recent Updates (v1.3.6+12 SCPA) — 2026-06-15

### Single Channel Player App (Flutter)
- **Fixed**: Play Store package name rejection — renamed from `com.nellaiiptv.buddhatv` to `com.nellaiiptv.com.athithoothartv` across Android (`build.gradle.kts`, `MainActivity.kt`), iOS (`project.pbxproj`), macOS (`AppInfo.xcconfig`), and Linux (`CMakeLists.txt`).

---

## Recent Updates (v1.3.5+11 SCPA) — 2026-06-15

### Single Channel Player App (Flutter)
- **Fixed**: Security checks (`SecurityManager.init()`) were never called at startup — now invoked in `main()` after dotenv loads so screenshot and debug blocking actually take effect.
- **Fixed**: `flutter run` / debugger crashing — all `SecurityManager` checks are now skipped in `kDebugMode`; enforcement applies to release builds only.
- **Fixed**: `isSafeToRun()` fetched `isRealDevice` but never used it; now checks rooted, emulator, and dev-mode flags together.
- **Changed**: `_handleDebugDetection()` now calls `exit(0)` on rooted device, emulator, or developer mode (previously only logged).
- **Changed**: `.env` — `ENABLE_SCREENSHOT_BLOCK=true`, `ENABLE_DEBUG_BLOCK=true` enabled for production.

---

## Recent Updates (v1.3.4+10 SCPA) — 2026-06-15

### Single Channel Player App (Flutter)
- **Fixed**: Pinkish video tint caused by a broken `ColorFilter.matrix` (red channel's green contribution set to `50.01`) — removed entirely; video renders with natural colours.
- **Fixed**: Four deprecated `Color.withOpacity()` calls replaced with `Color.withValues(alpha:)`.
- **Changed**: Exit confirmation modal recoloured to app brand cyan (`#06B6D4`) — icon, circle background, and Exit button.
- **Changed**: Added `formatHint: VideoFormat.hls` to `VideoPlayerController` so ExoPlayer uses its HLS-optimised pipeline immediately.
- **Changed**: `allowBackgroundPlayback: false` set explicitly in `VideoPlayerOptions`.
- **Added**: App icons regenerated via `flutter_launcher_icons` from `assets/icon/app-logo.png`.

---

## Recent Updates (v1.82.0 Website) — 2026-06-03

### Website (Next.js)
- **Added**: Admin `layout.tsx` for `/admin/channel-onboarding` — wraps page in `AdminLayout` so sidebar and mobile header render correctly.
- **Fixed**: Channel logo not showing in admin onboarding page — `logoSrc()` helper prepends backend base URL (derived from `NEXT_PUBLIC_API_URL`) to relative upload paths.
- **Fixed**: `package.json` UTF-8 BOM corruption causing Next.js `Unexpected token` JSON parse failure.

---

## Recent Updates (v1.14.0+69 App) — 2026-06-01

### Flutter App
- **Added**: **My Streams Screen** — Customer-facing stream management screen (Profile → My Streams). Stream cards show status dot (running = green, waiting = amber, others = red), stream name, stream-status + health-status badges, enabled/disabled pill, uptime, viewer count, codec chips, and a Restart button (only when enabled).
- **Added**: **Client Sessions panel** — Collapsible section per stream listing active/closed sessions (IP, protocol, country, duration, active indicator dot).
- **Added**: **Sync with 30 s cooldown** — AppBar Sync button fetches `GET /customers/streams?sync=1` with `Cache-Control: no-cache` + `_ts` cache-bust. Label shows countdown ("Sync (28s)") during lockout.
- **Added**: **Per-stream Restart with 30 s cooldown** — Restart button executes disable → 2 s wait → re-enable → fresh API fetch; label shows countdown ("Restart (28s)") during lockout.
- **Added**: `CustomerStream` + `StreamClientSession` models and `ApiService.getMyStreams()` / `ApiService.toggleStream()` methods.
- **Changed**: **Profile Screen** — OrientationBuilder support; landscape = two-pane layout (user-info + subscription/buttons).

---

## Recent Updates (v1.72.0 Website | v1.50.0 Backend) — 2026-06-01

### Website (Next.js)
- **Feature**: **Customer My Streams — Navbar dropdown** — Authenticated users see a "My Streams" panel in the user menu. Each assigned stream shows a health dot (green = online, red = offline), stream name, status badge, uptime, online clients, and out-bandwidth. **Sync** button (30 s cooldown) pulls live stats from Flussonic. **Restart** button (30 s cooldown) toggles the stream off then on with a 2 s gap. Button labels cycle through `Restart` → `…` → `<countdown>s` correctly (idle label was previously an empty string — fixed).
- **Feature**: **Customer My Streams — Classic Mode panel** — Collapsible "My Streams" card in the Classic Mode sidebar. Expandable per-stream cards showing full video/audio/bandwidth details and a client sessions table (IP, Protocol, Country, Opened At, Duration). Sync button with 30 s cooldown.
- **Fix**: **`fetchStreams` / `fetchMyStreams` wrapped in `useCallback`** — `useCallback` was imported in Navbar.tsx but the function was not wrapped; fixed. Both components now use `useCallback(async () => {…}, [])` for stable deps and ESLint compliance.
- **Fix**: **`try/finally` in sync handlers** — `handleSync` and `handleSyncStreams` now use `try/finally` so `setSyncing(false)` always runs, even when the Axios 500-interceptor returns a never-resolving promise in production.
- **Fix**: **Cache-busting on stream fetch** — `?_t=Date.now()` appended to all `GET /customers/streams` calls so browsers never return stale HTTP-cached responses.

### Backend (Slim PHP)
- **Feature**: **`GET /customers/streams?sync=1`** — When `sync=1` is present, `CustomerStreamController::getMyStreams()` calls `StreamService::refreshAssignedStreams()` before reading the DB, returning genuinely live Flussonic stats instead of cron-cached values. Normal load (no param) is a fast DB-only read.
- **Feature**: **`StreamService::refreshAssignedStreams(array $streamIds)`** — Groups the customer's assigned stream IDs by server, calls Flussonic `GET /streams/{name}` per stream (10 s timeout), upserts stats via the existing `upsertStream()` private method, then refreshes client sessions scoped to only those stream names.
- **Feature**: **`StreamService::syncSessionsForStreams(StreamServer, array $streamNames)`** — Targeted session sync: fetches `/sessions` from Flussonic, deletes existing `stream_clients` rows only for the given stream names, and re-inserts. Unlike `syncSessionsFromServer()`, this never touches sessions for other customers' streams.

## Recent Updates (v1.71.0 Website | v1.49.0 Backend) — 2026-06-01

### Website (Next.js)
- **Feature**: **Customer stream assignment** (`/admin/customers`) — Cyan `Radio` button per customer row opens `CustomerStreamsModal`. Shows currently assigned streams with remove button; searchable stream picker to assign new ones.

### Backend (Slim PHP)
- **Feature**: **`customer_stream_assignments` pivot table** — Migration with `INT UNSIGNED customer_id` (matches `customers.id`) and `BIGINT UNSIGNED stream_id` (matches `streams.id`). UNIQUE KEY prevents duplicate assignments.
- **Feature**: **`CustomerStreamController`** — `GET|POST|DELETE /api/admin/customers/{uuid}/streams[/{streamUuid}]` for listing, assigning, and removing stream assignments.
- **Feature**: **Eloquent relationships** — `Customer::assignedStreams()` and `Stream::assignedCustomers()` BelongsToMany via pivot.

## Previous Updates (v1.66.0 Website | v1.45.0 Backend) — 2026-05-31

### Website (Next.js)
- **Feature**: **Streams list redesigned** (`/admin/streams`) — Table replaced with Video / Audio / Clients / Bandwidth columns sourced from Flussonic v3 API stats. Edit button removed; replaced with Eye (view) button linking to the 360° detail page. "Add Stream" button removed (streams are Flussonic-synced). New `stream_status` filter (running / stopped).
- **Feature**: **Stream 360° detail page** (`/admin/streams/[uuid]`) — Completely new view replacing the old edit form. Six detail cards: Publish Info, Video Track, Audio Track, Bandwidth, Stream Server, Record Info. Live viewer bar with capacity %. Per-page **Sync** button scoped to that stream's server.
- **Changed**: **Sync button on detail page** — `POST /admin/streams/sync?server_uuid=…` reloads just the current server's streams and refreshes the detail view.

### Backend (Slim PHP)
- **Feature**: **Streams sync rewritten for Flussonic API v3** — `StreamService::syncFromServers()` now extracts all 17 new stats fields from `/streamer/api/v3/streams`. Upsert key changed from `stream_key` to `stream_name`. `update()` method removed.
- **Changed**: **Routes** — `POST /admin/streams` (create) and `PUT /admin/streams/{uuid}` (update) removed; streams are read-only from Flussonic.
- **Database**: **`add_stream_stats_columns.sql`** — Adds 17 columns to `streams`: `inputs_bandwidth`, `out_bandwidth`, `online_clients`, `video_width`, `video_height`, `video_codec`, `fps`, `audio_codec`, `audio_bitrate`, `audio_sample_rate`, `audio_channels`, `stream_status`, `published_via`, `published_from`, `client_count`, `stream_url_type`, `max_sessions`. `input_url` and `output_formats` made nullable.

## Previous Updates (v1.65.1 Website | v1.44.3a Backend) — 2026-05-30

### Website (Next.js)
- **Feature**: **Streams — "Sync with Server"** (`/admin/streams`) — New button calls `POST /admin/streams/sync`; spinner while in progress; success toast shows created/updated counts; per-server error details shown on failure; stream list auto-refreshes.
- **Fix**: **Edit Stream page crash** (`/admin/streams/[uuid]/page.tsx`) — `use(params)` runtime error fixed; `params` is a plain object in this Next.js version.
- **Fix**: **Edit Tenant page crash** (`/admin/tenants/[uuid]/page.tsx`) — Same `use(params)` crash fixed.

### Backend (Slim PHP)
- **Feature**: **`POST /api/admin/streams/sync`** — Syncs streams from all active + online Flussonic servers. Upserts by `stream_key` + `server_id`; returns `{ created, updated, errors[] }`. Optional `?server_uuid=` targets one server.
- **Improved**: **`FlussonicApiService`** — `request()` accepts a `$timeout` param (60 s for sync, 15 s default). Timeout errors are now definitive in scheme retry — no redundant HTTPS attempt, halving worst-case wait.

## Previous Updates (v1.65.0 Website | v1.44.0 Backend) — 2026-05-28

### Website (Next.js)
- **Feature**: **Streams admin** (`/admin/streams`) — Full CRUD, viewer progress bar, bitrate, health badge, server column, output format chips.
- **Feature**: **Viewer Sessions admin** (`/admin/viewer-sessions`) — Read-only browser with protocol badges, bandwidth, country.
- **Feature**: **Server Monitoring admin** (`/admin/monitoring`) — Per-server tabbed dashboard with CPU/RAM/disk bars, network cards, snapshot button, history table.
- **Feature**: **Tenants admin** (`/admin/tenants`) — Full CRUD with server multi-select and channel-ID tag input.

### Backend (Slim PHP)
- **Feature**: **`Stream` / `ViewerSession` / `ServerMonitoring` / `Tenant` resources** — Full CRUD APIs for all four entities.
- **Feature**: **`StreamServerPingService`** + **`POST /api/admin/stream-servers/ping-all`** — Manual and cron-driven server health checks.

## Previous Updates (v1.64.1 Website | v1.43.1 Backend) — 2026-05-27

### Website (Next.js)
- **Fix**: **Test Connectivity — edit mode** — `uuid` now sent in the test-connection payload. Backend resolves stored (decrypted) credentials when the password field is blank (API hides it on load).

### Backend (Slim PHP)
- **Fix**: **`testConnection` — edit mode credential fallback** — When `uuid` is provided and both `bearer_token` and `password_encrypted` are blank, loads the stored `StreamServer` record and decrypts credentials via `EncryptionHelper` before the liveness check.

## Previous Updates (v1.64.0 Website | v1.43.0 Backend) — 2026-05-27

### Website (Next.js)
- **Changed**: **Stream Servers Admin** — List, create, edit, and details modal rebuilt for Flussonic Media Server. MistServer auth state panel, streaming endpoint URLs, hardware specs, and feature flag sections removed. Table now shows API endpoint column, region, last ping, and health (online/offline only).
- **Feature**: **Test Connectivity** — Inline "Test Connectivity" button in `StreamServerForm.tsx`. Animated idle/testing/success/error states; shows liveness URL on success and failure reason on error.
- **Feature**: **Dashboard Stream Server cards** — "Stream Servers" (orange) and "Online Servers" (emerald) stat cards. 5-column dashboard grid. New Stream Servers recent-activity panel.
- **Changed**: **Admin Sidebar** — "Stream Servers" expandable group (All Servers / Add Server), defaulting open.

### Backend (Slim PHP)
- **Feature**: **`FlussonicApiService`** — Replaces `MistAuthService`. TCP pre-check via `fsockopen`, HTTP→HTTPS scheme auto-detection, HTTP Basic Auth and Bearer token auth, cURL liveness check. Timeouts: connect 8 s, request 15 s.
- **Feature**: **`POST /api/admin/stream-servers/test-connection`** — Dedicated connectivity-test endpoint; returns `{ url, scheme }`.
- **Feature**: **Dashboard stats** — `total_servers` + `online_servers` added to `/api/admin/dashboard/stats`.
- **Changed**: **`stream_servers` table** — 60+ MistServer columns replaced by 18 clean Flussonic columns (InnoDB, utf8mb4).
- **Removed**: **`MistAuthService`** — MistServer challenge-response MD5 auth removed.

## Previous Updates (v1.13.1 App) — 2026-05-25

### nellai_iptv_app (Flutter)
- **Fix**: **Visual Ads on Android TV** — Ads were invisible on TV because `TVPlayerController.load()` re-acquired exclusive ExoPlayer audio focus after `muteForAd()` paused the player, causing the ad to fail silently. Fixed via `_adPlaying` flag in `TVPlayerController` (guards `load()` from calling `play()` during ads), async `muteForAd()` that sets the flag before pausing, and awaiting `muteForAd(true)` in `_tryShowVisualAd()` before showing the overlay.

## Previous Updates (v1.63.1 Website | v1.42.1 Backend) — 2026-05-25


### Website (Next.js)
- **Fix**: **Visual Ad — admin sidebar** — Added missing `AdminLayout` wrapper (`/admin/visual-ads/layout.tsx`) so the sidebar renders on the visual-ads admin page.
- **Fix**: **Visual Ad — ad not showing on channel switch** — Replaced stale `useCallback` closure with a `useEffect` on `selectedChannel?.uuid`; switched to raw `fetch()` to bypass api.ts 5xx-interceptor silent failure.
- **Fix**: **Visual Ad — overlay hidden behind VideoPlayer** — Raised `z-index` to `z-[999]`; added CSS `isolate` on VideoPlayer wrapper.
- **Fix**: **Visual Ad — React Strict Mode double impression count** — `useRef` guard replaces `useState` so double-fired effects don't double-count.
- **Fix**: **Visual Ad — channel audio audible during ad / ad starts muted** — Ad starts unmuted; `VideoPlayer` gains `adPlaying` prop that mutes channel audio during ad and restores mute state when ad ends.
- **Fix**: **API 401 interceptor false session-expiry redirect** — Redirects only for auth-required endpoints; optional-auth endpoints (channels, ads) no longer trigger spurious logouts.

### Backend (Slim PHP)
- **Fix**: **`VisualAdController` PHP fatal** — Removed non-existent `App\Models\Subscription`; fixed `now()` → `date('Y-m-d H:i:s')`; customer resolved from JWT `sub` UUID via `Customer::where('uuid', ...)`.
- **Fix**: **`ChannelController` master API key 401** — `isTrustedApp` now checks `API_SECRET` env var before DB keys; guests with the master key no longer receive a 401.

## Previous Updates (v1.63.0 Website | v1.42.0 Backend) — 2026-05-25

### Website (Next.js)
- **Feature**: **Visual Ads System** — YouTube-style pre-roll video ads overlaid on the channel player. Supports `.m3u8` (HLS via hls.js) and `.mp4` (native). Skippable ads show a countdown "Skip in Xs" that transitions to a "Skip Ad" button after the configured delay. Non-skippable ads run to full duration. Top bar shows AD badge + remaining seconds. Bottom bar shows title, description, "Visit Advertiser" click-through link (opens in new tab), mute/unmute toggle. Session-based impression counting (`sessionStorage`) respects `max_impressions_per_session` and `display_frequency` per ad.
- **Added**: **`/admin/visual-ads`** — Full CRUD admin page for managing video ads. Table shows live analytics (impressions, skips, skip rate %, clicks, CTR%). Status toggle (active/inactive) switchable inline. Create/Edit modal with all fields: Ad URL, Click URL, Thumbnail URL, skip settings, targeting (guests / free users), frequency controls, weight, scheduling (start/end dates), status.
- **Added**: **Visual Ads sidebar link** in `AdminSidebar.tsx` (Film icon, after Scrolling Ads).

### Backend (Slim PHP)
- **Feature**: **Visual Ads API** — New `VisualAd` Eloquent model + `visual_ads` table. Public endpoints: `GET /api/visual-ads/active` (returns a single weighted-random ad matching the caller's plan, guest/free-user targeting, date range and status); `POST /api/visual-ads/{uuid}/impression|skip|click` (increments analytics counters). Admin CRUD: full `GET|POST|PUT|DELETE /api/admin/visual-ads` with `VisualAdAdminController`.
- **Added**: **SQL migrations** — `create_visual_ads_table.sql` (full schema with all columns, indexes, analytics counters) and `add_show_visual_ads_to_plans.sql` (`show_visual_ads` TINYINT column on `subscription_plans` — `1` = show ads, `0` = ad-free plan).

## Previous Updates (v1.62.0 Website) — 2026-05-25

### Website (Next.js)
- **Fix**: **AdSense Policy — Ads on Screens Without Publisher-Content** — `GoogleAdSense` component now checks `usePathname()` and only injects `adsbygoogle.js` on content pages (`/`, `/about`, `/privacy`, `/terms`, `/disclaimer`, `/contact`, `/feedback`). Functional screens like `/channels`, `/login`, `/register`, `/player`, and all `/admin/*` and `/reseller/*` routes no longer load the script.
- **Improved**: **About Page** — Substantially expanded with original text content: Who We Are, Our Mission, How It Works (4-step guide), Channel Categories tag cloud, What We Offer (6-card grid with full descriptions), Platform & Technology section, 5-item FAQ, and a CTA block. Adds `Metadata` export with unique title and description.
- **Improved**: **Privacy & Terms Pages** — Added `Metadata` exports with unique titles and descriptions for proper indexing.
- **Added**: **`/sitemap.xml`** — Dynamic Next.js sitemap (`app/sitemap.ts`) covering all public content and feature pages with correct `changeFrequency` and `priority` values.
- **Added**: **`/robots.txt`** — Dynamic Next.js robots (`app/robots.ts`) allowing all public pages, blocking `/admin/`, `/reseller/`, `/api/`, and `/test/`; references the sitemap.
- **Added**: **Logo assets to version control** — `public/assets/logos/` (Nellai IPTV logo files) now tracked in git.

## Previous Updates (v1.61.0 Website | v1.41.5 Backend) — 2026-05-25

### Website (Next.js)
- **Improved**: **Payment Gateway Settings** (`/admin/settings`) — Credential input fields removed from the UI. Razorpay and Cashfree API keys are now managed exclusively via backend `.env` variables (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY`, `CASHFREE_MODE`). Each gateway card shows the relevant env var names as a reference hint. Enable/disable toggle and inline "Test" button remain.

### Backend (Slim PHP)
- **Feature**: **Payment Gateway Test API** (`POST /api/admin/settings/test-payment`) — Creates a real test order via Razorpay or Cashfree using credentials read from `.env`. CA bundle resolution (`resolveCaBundle`) finds valid cacert from vendor or WAMP glob to avoid cURL SSL errors on Windows.
- **Fix**: Credential values are `trim()`ed before use to guard against CRLF whitespace from Windows-formatted `.env` files causing authentication failures.

## Previous Updates (v1.60.0 Website) — 2026-05-25

### Website (Next.js)
- **Redesigned**: Home page — full-viewport animated hero (floating orbs, dot-grid, staggered fade-up), animated stats count-up row, feature cards with per-card accent colours and hover glow, new App Download section with floating phone mockup, restored and redesigned CTA section.
- **Redesigned**: Navbar — scroll-aware glass effect, active route highlighting with cyan underline, "Watch TV" desktop link added, mobile sidebar with per-item icons and active-pill state, `next/image` for logo.
- **Redesigned**: Footer — gradient hairline top, Lucide icons on all link rows, `next/image` for logo and Play Store badge, "Need Help?" mini-card, pulsing green status dot, responsive 4→2→1 column grid.
- **Added**: CSS animations — `animate-fade-up`, floating hero orbs, dot-grid pattern, phone mockup float.

## Previous Updates (v1.12.5+66 App) — 2026-05-24

### App (Flutter)
- **Improved**: Player contrast matrix — `1.22×` scale, `0.03` cross-channel warmth mix, `−16` bias for punchier picture without highlight blow-out.

## Previous Updates (v1.41.4 Backend) — 2026-05-24

### Backend (Slim PHP)
- **Fixed**: `batchRenumber` channel number swap crash — two-phase update (temp values → targets) prevents MySQL InnoDB unique constraint violation when swapping numbers between channels.

## Previous Updates (v1.54.8 Website | v1.41.3 Backend) — 2026-05-24

### Website (Next.js)
- **Improved**: Channel Manager now supports inline status editing (Active / Inactive / Blocked / Deleted dropdown per row) and channel-number search in the filter bar.

### Backend (Slim PHP)
- **Improved**: `POST /api/admin/channels/batch-renumber` now accepts optional `status` field per entry; `channel_number` is also optional — at least one must be present per item.

## Previous Updates (v1.54.6 Website | v1.41.1 Backend) — 2026-05-24

### Website (Next.js)
- **Added**: Channel IP View Details modal on `/admin/reports/channel-views` — eye icon per row opens IP-level breakdown (IP, date, views) scoped to the active date filter.

### Backend (Slim PHP)
- **Added**: `GET /api/admin/reports/channel-view-details` — returns per-IP per-date view rows + summary for a given channel and date range.
- **Fixed**: `getChannelViews` now exposes `channel_id` in `table_data` response.

## Recent Updates (v1.54.4 Website) — 2026-05-24

### Website (Next.js)
- **Added**: Real-time video stats overlay on `/player` — Resolution, Buffer, Bandwidth, Dropped Frames, Live Latency; toggleable with Stats button or `D` key.
- **Added**: Sparkline SVG graphs in stats panel — cyan bandwidth history and green buffer history (last 60 s).
- **Fixed**: DASH.js player — `destroy()` cleanup, pinned CDN to v4.7.4, polling fallback, additional playback events.
- **Added**: Home button in `/player` header linking to `/`.
- **Removed**: Watermark from `/player` page.
- **Added**: Google Play Store badge in home page hero linking to the Play Store listing.
- **Added**: Player promo section on home page with mock player preview and "Open Player" CTA.

## Recent Updates (v1.54.3 Website) — 2026-05-24

### Website (Next.js)
- **Fixed**: DASH.js loading race — `afterInteractive` strategy + pending-queue auto-replay.
- **Added**: Stretch toggle button (`S` key) — `object-fit: fill` in landscape, always `contain` in portrait.
- **Added**: URL clear (`×`) button — stops player and resets state instantly.
- **Added**: SEO layout with full `Metadata`, JSON-LD `WebApplication` schema, H1 hero, feature cards, shortcuts, and FAQ section below the player.
- **Improved**: Header branding — icon + "Nellai IPTV" styled text.
- **Improved**: Watermark — larger, lower opacity (0.35), +5 px right, only visible while playing.

## Recent Updates (v1.54.2 Website) — 2026-05-24

### Website (Next.js)
- **Added**: **Universal Media Player** at `/player` — supports HLS, DASH, MP4/WebM/native, auto-detects stream type, full custom controls, quality selector, LIVE badge, example presets, keyboard shortcuts, immersive layout.

## Recent Updates (v1.54.1 Website) — 2026-05-23

### Website (Next.js)
- **Fixed**: **Preview Player Portrait Stretch** — `ClapprPlayer.tsx` now letterboxes the video in portrait/vertical orientation (mobile) using `object-fit: contain` instead of stretching with `fill`. Landscape and TV views are unchanged.

## Recent Updates (v1.12.4+64 App) — 2026-05-21

### App (Flutter)
- **Changed**: **Player Engine** — Migrated from `media_kit` (MPV) back to `video_player` (ExoPlayer). ExoPlayer works on all Android TV hardware without EGL surface setup or SoC-specific MPV property tuning.
- **Changed**: **Video Surface** — `Video` widget replaced with `VideoPlayer` in a `FittedBox`; buffering driven by `ValueListenableBuilder<VideoPlayerValue>`; errors via `addListener(_playerListener)`.
- **Fixed**: **TV Audio Muted** — Removed system-volume→player sync on TV; `volume_controller` reads wrong audio stream on some TV SoCs (returns 0), which was silently muting the player.
- **Fixed**: **TV Emulator** — `DeviceUtils.isEmulator` detection added via `!androidInfo.isPhysicalDevice`.
- **Removed**: `media_kit`, `media_kit_video`, `media_kit_libs_android_video`; `MediaKit.ensureInitialized()` removed from `main.dart`.

## Recent Updates (v1.12.3+63 App) — 2026-05-18

### App (Flutter)
- **Added**: **Contact Us** — Settings section with contact form (Name, Email, Subject, Message) posting to `POST /contact`; toast reflects exact API response message.
- **Fixed**: **Contact Validation** — Per-field error messages (name, email, subject, message) replace the generic fallback.
- **Changed**: **Settings Order** — Sections reordered to Feedback → Contact Us → Storage.

## Recent Updates (v1.12.0+60 App) — 2026-05-18

### App (Flutter)
- **Changed**: **Player Engine** — Re-migrated to **MediaKit** (MPV/ExoPlayer) for full HLS control, demuxer cache tuning, and MPV property access.
- **Added**: **Hardware Decoding** — API-gated `hwdec`: `auto` (API 26+), `mediacodec-copy` (API 23–25), software (API < 23).
- **Added**: **Buffer Tuning** — 64 MB TV / 32 MB Mobile demuxer cache; mobile timeout 60 s; stall timer 30 s mobile / 15 s TV.
- **Added**: **Quality Boost** — `ColorFiltered` 1.08× contrast matrix + `FilterQuality.high` at the Flutter compositor level.
- **Added**: **First-Frame Preloader** — Spinner hides only after `stream.width > 0` (first decoded frame).
- **Added**: **Stall Fallback Timer** — Triggers fallback MP4 when HLS stalls silently.
- **Fixed**: **Dispose Cleanup** — All timers and subscriptions properly cancelled in `dispose()`.

## Recent Updates (v1.3.2 SCPA) — 2026-05-15

### Single Channel Player App (Flutter)
- **Feature**: **Package Identity** - Rebranded app package name to `com.nellaiiptv.buddhatv` for Android, iOS, macOS, Windows, and Linux to align with Buddha TV branding.

## Recent Updates (v1.3.1 SCPA) — 2026-05-14

### Single Channel Player App (Flutter)
- **Feature**: **Auto-Reconnect** - Stream automatically restarts when internet is restored after a loss.
- **Feature**: **Double-Tap to Mute** - Double-tap anywhere on video to toggle mute with visual feedback overlay.
- **Feature**: **Android TV Support** (v1.3.0) - Full Android TV launcher registration, runtime TV detection, media key support (Play/Pause), D-pad controls, and focusable exit/retry dialogs.

## Recent Updates (v1.11.0+59 App / v1.53.0 Website / v1.41.0 Backend) — 2026-05-10

### Website (Next.js)
- **Feature**: **Stream Servers Admin CRUD** - New `/admin/stream-servers` section with paginated list, create, and edit pages. Filters: status, health, server type. Colour-coded health badges.
- **Feature**: **StreamServerForm** - 9-section form covering all server, MistServer API, hardware, endpoint, and feature flag fields.
- **Feature**: **MistServer Auth State Panel** - Read-only edit panel showing last `mist_challenge` and `mist_final_hash` with copy buttons.
- **Feature**: **Sidebar** - "Stream Servers" link added with `Server` icon.

### Backend (PHP/Slim)
- **Feature**: **Stream Servers CRUD API** - Full admin REST API for `stream_servers` table with pagination and filters.
- **Feature**: **MistServer Authentication** - `MistAuthService` implements official challenge-response flow. Hash: `MD5(MD5(password) + challenge)`. Validates live credentials on create/update.
- **Feature**: **AES-256 Password Encryption** - `EncryptionHelper` encrypts passwords at rest with random IV. `MIST_ENCRYPTION_KEY` env variable required.
- **Feature**: **Auth State Columns** - `mist_challenge` and `mist_final_hash` stored per server after each successful validation.

## [1.9.8+57] - App | [1.51.1] - Website | [1.39.1] - Backend - 2026-05-01

### Backend (PHP/Slim)
- **Fix**: **Environment Variable Stability** - Refined `getenv()` logic in `ResendEmailService` to correctly handle `false` returns, ensuring robust API key and fallback email detection.

### Website (Next.js)
- **Fix**: **Environment Detection** - Expanded `isDev` check in the API interceptor to support both `NEXT_PUBLIC_APP_ENV` and `APP_ENV` for more reliable debug error displays.

## [1.9.8+57] - App | [1.51.0] - Website | [1.39.0] - Backend - 2026-05-01

### Backend (PHP/Slim)
- **Feature**: **Password Reset Migration** - Full backend-only auth workflow with professional email templates.
- **Fix**: **Stability & Compatibility** - Resolved SSL verification issues on WAMP and critical PSR-7/Eloquent method errors across all controllers.

### Website (Next.js)
- **Feature**: **Auth Refactor** - Updated frontend to leverage backend-only password reset service for improved security.

## Recent Updates (v1.9.7+56 App / v1.50.6 Website / v1.38.6 Backend)

### Website (Next.js)
- **Fix**: **Universal Share Link Fallback** - Removed server-side mobile-only redirect logic. The 3-second visual countdown is now enabled for all devices (Desktop, Mobile, TV), ensuring consistent behavior when testing or accessing shared links. App-specific intent logic moved to client-side callback.

## Recent Updates (v1.9.5+54 App / v1.50.3 Website / v1.38.3 Backend)

### Website (Next.js)
- **Feature**: **Share Link Visual Countdown** - Transformed the silent redirect upon mobile app failure into an interactive, beautifully themed Javascript 3-second explicit countdown screen before triggering the web-player fallback.
- **Fix**: **Cross-Platform Deep Linking** - Added strict OS-detection logic into the Share Link page router to appropriately fire the iOS specific custom URI (`nellaiiptv://`) or Android intent URI (`intent://`), fixing iOS native app launch failures.

## Recent Updates (v1.9.4+53 App / v1.50.2 Website / v1.38.2 Backend)

### Website (Next.js)
- **Fix**: **Admin Player Native Video Fallback** - Included and registered the `@clappr/hlsjs-playback` plugin within `ClapprPlayer.tsx`. Resolves a silent failure where Clappr dropped to the native HTML5 `<video>` element on Windows Chrome (causing "browser does not support" playback errors) because it lacked the bridge to `Hls.js` intrinsically.

## Recent Updates (v1.9.3+52 App / v1.50.1 Website / v1.38.1 Backend)

### Website (Next.js)
- **Fix**: **Admin Player Mixed Content** - Applied the `resolveStreamUrl()` helper to `ClapprPlayer.tsx` to automatically upgrade HTTP streams to HTTPS on the secure admin preview page.
- **Fix**: **Admin Player HLS Parsing** - Added explicit `mimeType: 'application/x-mpegURL'` to Clappr configuration to guarantee HLS module loading for streams with URL tokens.

## Recent Updates (v1.9.2+51 App / v1.50.0 Website / v1.38.0 Backend)

### Website (Next.js)
- **Fix**: **Mixed Content / HTTPS Playback** - Added `resolveStreamUrl()` helper in `VideoPlayer.tsx` that upgrades `http://` stream URLs to `https://` when the site is hosted over HTTPS. Resolves the "Your browser does not support the playback of this video" error caused by browser Mixed Content blocking on production servers.
- **Improved**: **ClapprPlayer SD→HD Stretch** - Forces Clappr's internal `<video>` element to fill the full HD player area via `object-fit: fill`, stretching SD content to full resolution. Enforced via three layers (inline styles, persistent `<style>` tag, `MutationObserver`) for resilience against Clappr's internal DOM rebuilds.

## Recent Updates (v1.9.2+51 App / v1.49.0 Website / v1.38.0 Backend)

### App (Flutter)
- **Feature**: **Scrolling Ads Marquee** - Implemented a dynamic scrolling text ticker in the Classic Screen to display server-controlled advertisements with customizable scroll velocity (`scroll_speed`) and repeat limits (`repeat_count`).

### Website (Next.js)
- **Feature**: **Scrolling Ads Ticker** - Integrated a gap-free marquee on the player interface (`/channels` and `/channel/{uuid}`) to display scrolling text advertisements.
- **Feature**: **Admin Ads Management** - Created a full CRUD interface in the Admin Panel for Scrolling Ads, featuring markdown support, scroll velocity control, and play limiters.

### Backend (PHP)
- **Feature**: **Scrolling Ads API** - Implemented full CRUD REST API for Scrolling Ads (`/admin/scrolling-ads`). Added new `scroll_speed` field and renamed `display_duration` to `repeat_count`. Exposed `/scrolling-ads` public endpoint.

## Recent Updates (v1.8.23+40 App / v1.47.3 Website / v1.36.3 Backend)

### App (Flutter)
- **Feature**: **Comment Count Badge** - Added visual notification badge on the channel details comments icon showing the total number of comments for a channel (capped at 99+).
- **Optimization**: **HD TV Playback** - Added aggressive optimizations to MediaKit/FFmpeg properties (`vd-lavc-skiploopfilter=all`, `vd-lavc-skipidct=all`, `framedrop=vo`) to ensure completely smooth Full HD playback on low-end TV processors.
- **Fix**: **TV Player Highlight** - Fixed issue where the cyan player focus border wouldn't trigger correctly when navigating the UI with a D-Pad.

## Recent Updates (v1.8.22+39 App / v1.47.3 Website / v1.36.3 Backend)

### Website (Next.js)
- **Feature**: **RTMP URL Support** - Added an optional field for RTMP stream URLs in the Admin Channel Form.

### Backend (PHP)
- **Database**: Added `rtmp_url` column to the `channels` table to support RTMP stream URLs.
- **Model**: Updated the `Channel` model to support mass assignment for the new `rtmp_url` field.

### App (Flutter)
- **Maintenance**: Version synchronized with latest Backend/Website updates.

## Recent Updates (v1.8.21+38 App / v1.47.2 Website / v1.36.2 Backend)

### Backend (PHP)
- **Feature**: **WebP Optimization** - Automatic conversion of PNG uploads to `.webp`.
- **Feature**: **Auto-Resizing** - Thumbnails are now automatically resized to **1280x720px**; Logos to **512x512px**.
- **Change**: **Clean Names** - Switched to timestamp-based naming for all uploads.

### Website (Next.js)
- **UI**: Added explicit resolution guidance for 720p thumbnails and high-res logos.
- **Format**: Enabled `.webp` support across all admin upload components.

## Recent Updates (v1.8.20+37 App / v1.47.1 Website / v1.36.1 Backend)

### App (Flutter)
- **Feature**: **Focus Auto-Hide** - Integrated a 3-second auto-hide timer for player focus highlights to maintain a clean viewing experience.
- **Improved**: **TV Focus Highlights** - Added visual selection indicators and inner glows for clearer D-pad navigation on TV.
- **Hardware-Aware Playback**: Enhanced auto-tuning of FFmpeg properties for devices with limited RAM.
- **Bug Fix**: Resolved "child != this" focus errors and fixed compilation state issues in the player component.

## Recent Updates (v1.2.3+4 SCPA / v1.47.0 Website / v1.36.1 Backend)

### App (Single Channel Player)
- **Added**: **Splash Animation** - Implemented entry animation for the logo on splash screen using `flutter_animate`.

## Recent Updates (v1.2.2+3 SCPA / v1.47.0 Website / v1.36.1 Backend)

### App (Flutter)
- **Changed**: **Watermark Opacity** - Reduced opacity for a more subtle branding effect.

## Recent Updates (v1.8.18+34 App / v1.47.0 Website / v1.36.0 Backend)

### App (Flutter)
- **Fix**: **Player Focus** - Resolved issue where first channel was incorrectly selected after fullscreen exit.
- **UI**: **Selection State** - Fixed visual indicator to correctly highlight the active channel.

## Recent Updates (v1.8.17+33 App / v1.47.0 Website / v1.36.0 Backend)

### Website (Next.js)
- **Feature**: **Enhanced Export Filters** - Added granular filtering (Search, Category, Language, State, Status) to the channel export utility.
- **Improvement**: **Auto-Filter Context** - Export modal now inherits active filters from the main channel list automatically.

### Backend (PHP)
- **Feature**: **Filtered Exports** - Core service updated to support multi-column filtering for CSV generators.
- **Improvement**: **CORS Exposure** - Exposed `Content-Disposition` header to ensure frontend can resolve download filenames correctly.

## Recent Updates (v1.8.16+32 App / v1.46.3 Website / v1.35.3 Backend)

### App (Flutter)
- **Feature**: **Smart Retry** - Retries stream 3 times before fallback to prevent false positives.
- **UX**: **Mobile Fullscreen** - Single tap now opens STB Overlay; Controls stay visible.

## Recent Updates (v1.8.15+31 App / v1.46.3 Website / v1.35.3 Backend)

### App (Flutter)
- **Feature**: **STB Info Overlay** - Set-Top Box style channel info banner in fullscreen.
- **Fix**: **TV Focus** - Resolved "OK" button system overlay conflicts.

## Recent Updates (v1.8.14+30 App / v1.46.3 Website / v1.35.3 Backend)

### Website (Next.js)
- **Feature**: **AdSense Integration** - Full integration of Google AdSense with responsive ad units and `ads.txt` verification support.

### Backend (PHP)
- **Maintenance**: Version synchronized.

## Recent Updates (v1.8.14+30 App / v1.46.2 Website / v1.35.2 Backend)

### Backend (PHP)
- **Feature**: **Public API Access** - Guests can now view `is_preview_public` channels without login.
- **Security**: Strict access control blocking guests from private channels.

## Recent Updates (v1.8.14+30 App / v1.46.1 Website / v1.35.1 Backend)

### Website (Next.js)
- **Fix**: **Player Props Types** - Resolved TypeScript compatibility issue for `channelUuid` in player props.

### Backend (PHP)
- **Fix**: **Access Control Logging** - Enhanced debug logging for channel access control to aid troubleshooting.

## Recent Updates (v1.8.14+30 App / v1.46.0 Website / v1.35.0 Backend)

### Website (Next.js)
- **Feature**: **Developer Tools Protection** - Comprehensive DevTools blocking system with keyboard shortcut blocking, console disabling, and progressive enforcement.
- **Feature**: **Platform Availability Settings** - Global channel control interface with emergency block toggle and individual platform disable options.
- **Feature**: **Admin Settings UI Modernization** - Complete visual overhaul with color-coded gradient sections, glassmorphism effects, and enhanced spacing.
- **Improvement**: **Visual Design** - Applied modern design patterns across all 8 settings sections with distinct color themes and improved accessibility.

### Backend (PHP)
- **Feature**: **Platform Blocking System** - Global channel blocking with `block_all_channels` and `disabled_platforms` settings.
- **Improvement**: **Channel Service** - Enhanced with centralized platform blocking logic across all retrieval methods.

### App (Flutter)
- **Maintenance**: Version synchronized.

## Recent Updates (v1.8.14+30 App / v1.45.0 Website / v1.34.0 Backend)

### App (Flutter)
- **Feature**: **Device Utilities** - Centralized device initialization system for improved compatibility across Android devices.
- **Improvement**: **Startup Flow** - Enhanced splash screen with device-specific initialization logic for better reliability.
- **Improvement**: **Compatibility** - Refined device detection and initialization sequence for consistent behavior.

## Recent Updates (v1.8.13+29 App / v1.45.0 Frontend / v1.34.0 Backend)

### Frontend (Next.js)
- **Feature**: **Channel Views Report** - Comprehensive analytics dashboard with interactive charts and data tables.
- **Feature**: **Export Capabilities** - Download reports as JPEG images or CSV files for offline analysis.
- **Feature**: **Advanced Filtering** - Searchable channel dropdown with API fallback and status filtering.
- **Improvement**: **Reports Menu** - Converted to collapsible dropdown for better organization.
- **Improvement**: **Customer Management** - Added serial numbers to customer table.

### Backend (PHP)
- **Feature**: **Analytics Endpoint** - New report API with support for channel and status filtering.
- **Fix**: **Architecture** - Standardized controller structure using ResponseFormatter.

### App (Flutter)
- **Maintenance**: Version synchronized.

## Recent Updates (v1.8.14+30 App / v1.44.0 Frontend / v1.33.0 Backend)

### Frontend (Next.js)
- **Feature**: **Admin Comments** - Full moderation interface for channel comments with search and soft-delete support.
- **Feature**: **Status Toggle** - One-click status updates for comments to quickly managed user content.
- **Improvement**: **Auto-Numbering** - Smartly fetches next available channel number.
- **Fix**: **Dropdowns** - Resolved empty filter dropdowns in production environments.

### Backend (PHP)
- **Feature**: **Moderation APIs** - Dedicated endpoints for comment management and status toggling.
- **Feature**: **Utilities** - `next-number` endpoint for channel sequencing.
- **Fix**: **Stability** - Patched `GeoService` to prevent SQL errors on missing columns.

### App (Flutter)
- **Maintenance**: Version synchronized.

## Recent Updates (v1.8.13+29 App / v1.43.0 Frontend / v1.32.2 Backend)

### App (Flutter)
- **Fix**: **Build Repair** - Resolved `Member not found: 'center'` compiler error.
- **Fix**: **Play Store Rejection** - Solved "Missing DPad functionality" by implementing explicit keyboard activation on "Select" key press for Login/Register screens.
- **Feature**: **D-Pad Focus Enhancements** - Enhanced focus traversal for Channel Details Modal and Star Rating Dialog.

### Backend & Frontend
- **Maintenance**: Version synchronized.

## Recent Updates (v1.8.11+27 App / v1.43.0 Frontend / v1.32.1 Backend)

### App (Flutter)
- **Feature**: **User Profile Section** - Comprehensive profile screen with user info, subscription details, device management, and logout.
- **Feature**: **Session Management** - Logout API integration to remove sessions from database.
- **Feature**: **User Data Persistence** - Login stores user details in SharedPreferences for offline profile access.
- **Fix**: **Type Conversions** - Resolved "int is not a subtype of String" errors with `.toString()` conversions.
- **Fix**: **Subscription Display** - Profile correctly reads subscription data from backend 'plan' key.
- **Fix**: **Orientation Management** - Refined screen orientations (ClassicScreen: landscape only, others: portrait).
- **Improvement**: **Video Playback Control** - ClassicScreen stops playback when navigating to profile, resumes on return.

### Backend & Frontend
- **Maintenance**: Version synchronized with latest App release.

## Recent Updates (v1.8.10+26 App / v1.43.0 Frontend / v1.32.1 Backend)

### App (Flutter)
- **Feature**: **Focus Stability** - Solved "stuck focus" issues in ClassicScreen header buttons.
- **Feature**: **TV Auth** - Login/Register screens are now fully navigable via Remote Control.
- **UI**: **Unified Theme** - Consistent dark theming for Rate/Logout dialogs.
- **Logic**: **Ratings** - Switched to server-authoritative rating data.

### Backend (PHP)
- **Fix**: **GeoService** - Fixed "Column not found" error by removing invalid `status` filter.
- **Feature**: **Rating APIs** - Exposed real-time average rating and count in channel responses.

### Frontend
- **Maintenance**: Version synchronized.

## Recent Updates (v1.8.8+24 App / v1.42.1 Frontend / v1.31.1 Backend)
- **Feature**: **Channel Proprietor Details** - Full lifecycle management for channel owner metadata.
- **Feature**: **Proprietor Phone Validation** - Real-time Indian phone format verification.
- **Fix**: **API Reliability** - Resolved critical filter and form option loading errors by standardizing Admin API parameters.
- **Improvement**: Added support for custom `User-Agent` and `Referer` headers per stream.

## Recent Updates (v1.8.8+24 App / v1.42.1 Frontend / v1.31.1 Backend)

### App (Flutter)
- **Fix**: **Device Support** - Marked hardware features optional to support 2,300+ more devices.
- **Fix**: **Legacy** - Pinned min SDK to 21.
- **Security**: **Remediation** - Removed exposed secrets from history.

### Frontend & Backend
- **Maintenance**: Version synchronized and security hardening.

## Recent Updates (v1.8.7+23 App / v1.42.1 Frontend / v1.31.1 Backend)

### App (Flutter)
- **Feature**: **Premium Exit Dialog** - Dark-themed, focus-aware confirmation dialog.
- **Fix**: **TV Navigation** - Fixed broken D-Pad navigation in Classic Mode (Grid & Player focus).
- **Fix**: **Stability** - Resolved syntax errors and focus traps.

### Frontend & Backend
- **Maintenance**: Version synchronized.

## Recent Updates (v1.8.6+22 App / v1.42.1 Frontend / v1.31.1 Backend)

### App (Flutter)
- **Fix**: **Build Stability** - fixed critical syntax errors and duplicate class definitions in Classic Mode.
- **Fix**: **Compilation** - Removed invalid key bindings.

### Frontend & Backend
- **Maintenance**: Version synchronized.

## Recent Updates (v1.8.5+21 App / v1.42.1 Frontend / v1.31.1 Backend)

### App (Flutter)
- **Feature**: **Channel Report System** - Users can report stream issues (buffering, audio problems, etc.) via Flag button in player with TV-friendly dialog.
- **Feature**: **Fullscreen Channel Zapping** - D-pad Up/Down switches to previous/next channel while in fullscreen mode.
- **Feature**: **Overlay Navigation** - D-pad Left/Right toggles channel list overlay in fullscreen.
- **Improvement**: **Faster Error Recovery** - Reduced auto-retry countdown from 20s to 10s.
- **Fix**: **Focus Behavior** - Disabled player autofocus to prevent focus stealing from channel list.

### Frontend & Backend
- **Maintenance**: Version synchronized.

## Recent Updates (v1.8.4+20 App / v1.42.1 Frontend / v1.31.1 Backend)

### App (Flutter)
- **Feature**: **Remote Shortcuts** - Added "Menu"/"Info" key support for STB Channel List.
- **Improvement**: **Visuals** - Cleaned up player UI (removed black borders).
- **Fix**: **Stability** - Fixed native crash on hot restart.

### Frontend & Backend
- **Maintenance**: Version synchronized.

## Recent Updates (v1.8.3+19 App / v1.42.0 Frontend / v1.31.0 Backend)

### App (Flutter)
- **Feature**: **Android TV Compliance** - Successfully addressed Play Store rejections by installing high-res 320x180 banners and 512x512 full-bleed icons.
- **Feature**: **Easy Navigation** - Added dedicated "Channel List" and "Mute" buttons to player controls for deliberate remote-control access.
- **Fix**: **Mute Sync** - Real-time synchronization with hardware volume buttons.
- **Fix**: **FFI Crash Stability** - Eliminated `SIGABRT` crashes during hot restarts through synchronous resource disposal.
- **Improvement**: **Single-Click Fullscreen** - Faster transition into immersive viewing.

### Backend
- **Feature**: **Geo Filtering** - Categories and Languages APIs now support `status` parameter (active/inactive).

### App (Flutter)
- **Fix**: **TV Search** - Solved text input issues on Android TV by forcing keyboard on Select.
- **Fix**: **Fullscreen Exit** - Reliable exit from fullscreen using Back/Escape keys.
- **Feature**: **Focusable Ads** - Added DPad support for ad banners.

## Recent Updates (v1.8.1+17 App / v1.41.0 Frontend / v1.30.0 Backend)

## Recent Updates (v1.7.1+15 App / v1.39.0 Frontend / v1.28.0 Backend)

### App (Flutter)
- **Feature**: **Full-Screen TV Toggle** - Dedicated focusable button in playback controls.
- **Fix**: **Volume Consistency** - Volume and Mute states now persist across channel switches.
- **Improvement**: **System UI** - Enhanced immersive mode management for TV boxes.

## Recent Updates (v1.7.0+14 App / v1.39.0 Frontend / v1.28.0 Backend)

### App (Flutter)
- **Feature**: **TV Focus** - Full D-Pad "Select" support for all interactive player elements.
- **Feature**: **Dynamic UI** - Adaptive player height based on ad availability.
- **Feature**: **Stats** - Real-time View Count and Star Ratings in Classic Mode.

## Recent Updates (v1.6.2+12 App / v1.38.0 Frontend / v1.27.0 Backend)

### App (Flutter)
- **Feature**: **Force Update** - Strict version enforcement logic.
- **Fix**: **Build Stability** - Fixed Android TV resource errors.

## Recent Updates (v1.6.1+11 App / v1.38.0 Frontend / v1.27.0 Backend)

### Frontend
- **Kiosk Mode**: Automatically hides "Back" and "Menu" buttons in Classic Mode when Open Access is active.
- **Disclaimer**: Enhanced visibility and z-index management for cross-component overlays.
- **Open Access**: Guests can watch channels without login if enabled in backend.

### Backend
- **Error Tracking**: Implemented detailed try-catch logging for customer management debugging.
- **Subscription Bypass**: Robust support for Open Access mode in `JwtMiddleware` and `AuthService`.
- **Sanitization**: Fixed toggle save issues for Featured, Premium, and Open Access settings.

## Recent Updates (v1.6.1+10 App / v1.37.0 Frontend / v1.26.0 Backend)

## Recent Updates (v1.35.1 Frontend / v1.24.1 Backend)
- **Reseller Stats**: Fixed database migrations for customer ownership tracking.
- **Wallet Integration**: Consolidated wallet card and history in reseller dashboard.
- **Timezone**: System-wide IST synchronization for backend and frontend expiry calculations.

## Recent Updates (v1.33.0 Frontend / v1.22.0 Backend)

## Recent Updates (v1.32.0 Frontend / v1.21.0 Backend)

- **SEO & Landing Page**: Full-featured root page with optimized metadata and rich brand storytelling.
- **Community Engagement**: Integrated real-time channel comments for interactive surf sessions.
- **TV-First Navigation**: Global D-pad support across all web and player interfaces.
- **Redirection Logic**: Seamless post-login return to previous context.
- **Dynamic Branding**: Polished footer with glowing gradients and setting-aware logos.

## Recent Updates (v1.31.0 Frontend)
- **Smart Fallback**: Automatic recovery system for broken streams with centered countdown UI.
- **Classic Menu**: Integrated TV-optimized side menu for user accounts and information.

## Recent Updates (v1.5.3+8 App)

- **TV Focus**: Full D-Pad navigation support for ads and interactive elements.
- **Auto-Focus**: Intelligent focus snapping for error screens.

## Recent Updates (v1.5.2+7)

- **MP4 Fallback**: Replaced HLS fallback with instant-loading MP4.
- **Clickable Ads**: Banner ads now support external redirection.
- **UI Refinement**: Cyan accent theming and balanced layout.

## Recent Updates (v1.5.1+6)

- **Device Compatibility**: Restored support for Ethernet-only and non-GPS devices.
- **Available Fallback**: Player automatically switches to a backup stream when the main channel is down.
- **Connectivity Alerts**: Animated Toasts notify users of internet loss and restoration.
- **TV Store Ready**: Fully compliant with Google Play Store Android TV requirements.


- **Persistent Navigation**: STB Menu remembers your last category for faster browsing.
- **Refined Player UI**: Minimalist stats overlay and improved gesture reliability.
- **Full-Screen STB Overlay**: Intuitive channel browsing without exiting full-screen mode (Left-side).
- **TV UX Overhaul**: "All Channels" prioritized and autofocus implemented for remotes.
- **Persistent Information**: View counts and ratings always visible in the player.
- **Android 15 Compatibility**: Support for Target SDK 35 with native Edge-to-Edge display.
- **Performance**: Parallel loading logic and session-based caching.

## Setup

1.  Navigate to `nellai_iptv_app`.
2.  Create `.env` with API keys.
3.  Run `flutter run`.
