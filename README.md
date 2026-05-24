# Nellai IPTV Project

This repository contains the source code for the Nellai IPTV ecosystem, including the mobile/TV application and backend services.

## Components

### `website` (Next.js)
Premium web interface optimized for Browsers and Smart TV.
- **Version**: 1.60.0
- **Key Features**: Channel Manager Stream Preview (HLS player modal with loading/buffering/error/retry states, live badge, copy URL, no-controls clean view), Channel Manager Confirm-Save Modal (per-channel diff of number and status changes with thumbnail, arrow indicators, sorted by new number), Full Admin Portal Redesign (modern slate theme, animated, mobile-responsive sidebar, dashboard, all CRUD pages), Admin Layout Isolation (public Navbar/Footer hidden on admin/reseller routes), Admin Branding (logo on login page + sidebar, sidebar logo links to home), Redesigned Home Page (animated hero, stats counter, feature cards, app download section, CTA), Modernised Navbar (scroll-aware glass, active routing, TV link), Modernised Footer (gradient hairline, icons on links, status dot), Channel Manager (inline renumber + status edit, number search), Stream Server 360° View, Stream Servers Admin CRUD, Channel IP View Details Modal, Feedback System, Admin Feedback Management, Backend-Only Auth, HTTP Mixed-Content Warning, ClapprPlayer SD→HD Stretch, Portrait Mobile Letterbox, Universal Media Player (`/player`) with real-time stats & sparkline graphs, Google Play badge, Player Promo Section, Scrolling Ads Ticker, RTMP URL Support.

### `backend` (Slim PHP)
RESTful API with role-based access control and subscription management.
- **Version**: 1.41.4
- **Key Features**: Batch Channel Update API (number + status, swap-safe two-phase update), Stream Servers API, MistServer Auth (challenge-response), AES-256 Password Encryption, Feedback API, Password Reset Service, Email Templates, CORS/OPTIONS Stability, Scrolling Ads API, Channel View Details API.

### `nellai_iptv_app` (Flutter)
A premium multi-channel IPTV player built for Android and Android TV.
- **Version**: 1.12.5+66
- **Key Features**: `video_player` (ExoPlayer) engine for universal Android TV hardware support, `ValueListenableBuilder` buffering overlay, Enhanced ColorFilter contrast/colour matrix (1.22× contrast, cross-channel warmth, −16 bias), `FilterQuality.high`, stall-free ExoPlayer error/buffering via `VideoPlayerValue`, TV audio mute fix, Contact Us form (`POST /contact`), Feedback System, Forgot Password Flow, Responsive Classic Screen Header, Storage Management, Enhanced Channel Search, Deep Link Share, Focus Persistence.

### `single_channel_player_app` (Flutter)
A lightweight single-channel HLS player optimized for Mobile and Android TV.
- **Version**: 1.3.2+7
- **Key Features**: Android TV Launcher (LEANBACK_LAUNCHER), TV Remote D-pad & Media Key support, Runtime TV Detection, Auto-Reconnect on network loss, Double-tap to Mute, PiP (mobile), Session Volume, Gesture Controls (brightness/volume swipe).

## Recent Updates (v1.55.0 Website) — 2026-05-25

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
