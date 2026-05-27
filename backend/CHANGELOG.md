## [1.43.1] - 2026-05-27

### Fixed
- **`testConnection` — edit mode always fails with "Username and password are required"** (`StreamServerController.php`) — The backend hides `password_encrypted` and `bearer_token` in API responses (`$hidden`), so the edit form loads with blank credential fields. When "Test Connectivity" was clicked without re-entering the password, the payload arrived with an empty password and the controller rejected it. Fix: if both `bearer_token` and `password_encrypted` are blank but a `uuid` is provided, the controller now loads the stored `StreamServer` record and decrypts its credentials via `EncryptionHelper::decrypt()` before running the liveness check. Added `use App\Helpers\EncryptionHelper` and `use App\Models\StreamServer` imports.

---

## [1.43.0] - 2026-05-27

### Added
- **`FlussonicApiService`** (`backend/app/Services/Flussonic/FlussonicApiService.php`) — New service replacing `MistAuthService`. Implements TCP port pre-check (`fsockopen`, 5 s), HTTP→HTTPS auto-detection (`detectScheme`), HTTP Basic Auth and Bearer token auth, liveness check against `GET /streamer/api/{version}/monitoring/liveness`. cURL timeouts: connect 8 s, request 15 s. Detailed error messages include the URL that was attempted.
  - `validateCredentials(host, port, version, username, password)` — validates plaintext credentials against a live Flussonic server; returns working scheme.
  - `validateBearerToken(host, port, version, token)` — same flow using Bearer auth.
  - `request(StreamServer, path)` — authenticated GET using AES-decrypted stored credentials.
  - `buildUrl(host, port, version, path, scheme)` — public URL builder for Flussonic API paths.
- **`POST /api/admin/stream-servers/test-connection`** — Dedicated connectivity-test endpoint, decoupled from save operations. Accepts `server_host_ip`, `api_port`, `api_version`, `username`, `password_encrypted`, `bearer_token`. Returns `{ url, scheme }` on success. Registered before generic `POST /stream-servers` to prevent route conflict.
- **Dashboard stats** — `GET /api/admin/dashboard/stats` now returns `total_servers` (non-deleted stream servers) and `online_servers` (`health_status = online`) alongside existing stats.
- **`stream_servers` schema** — Table rebuilt with 18 clean Flussonic columns: `uuid`, `server_name`, `server_host_ip`, `server_host_domain`, `api_port` (default 8080), `api_version` (default v3), `username`, `password_encrypted` (AES-256), `bearer_token` (AES-256, nullable), `timezone`, `region`, `health_status` (online/offline), `last_ping_at`, `status` (active/inactive/expired/deleted), `created_at`, `updated_at`, `deleted_at`. All 35+ MistServer columns removed. Engine changed to InnoDB.
- **Migration files** — `create_stream_servers_table.sql` rebuilt for Flussonic schema. `modify_stream_servers_for_flussonic.sql` (ALTER TABLE path for existing installs). `add_mist_auth_fields_to_stream_servers.sql` marked OBSOLETE.
- **`StreamServerService`** — Search fields updated to `server_name`, `server_host_ip`, `server_host_domain`, `region`. Sort fields: `id`, `server_name`, `created_at`, `status`, `health_status`, `last_ping_at`, `region`. `create()` encrypts both `password_encrypted` and `bearer_token`. `update()` re-encrypts password when provided; clears `bearer_token` when sent as empty string.

### Removed
- **`MistAuthService`** — Entire MistServer challenge-response MD5 auth service removed; superseded by `FlussonicApiService`.
- **Mandatory connectivity checks on save** — `StreamServerController::create()` and `::update()` no longer require Flussonic reachability before persisting. Connectivity testing is advisory-only via the dedicated `test-connection` endpoint.

---

## [1.42.1] - 2026-05-25

### Fixed
- **`VisualAdController` — PHP fatal on ad request** (`VisualAdController.php`): Removed non-existent `use App\Models\Subscription` import (subscription fields live directly on `Customer`). Replaced Laravel's `now()` helper (unavailable in Slim) with `date('Y-m-d H:i:s')`. Customer now resolved from JWT `$user->sub` UUID via `Customer::where('uuid', $jwtUser->sub)->first()`.
- **`ChannelController` — master API key not recognised as trusted** (`ChannelController.php`): The `isTrustedApp` flag check now inspects the `API_SECRET` env variable first before querying DB keys. Previously, guests carrying the master key received a 401 because only DB-registered keys were accepted.

## [1.42.0] - 2026-05-25

- **Feature**: **Visual Ads API** — `GET /api/visual-ads/active` (plan-aware, guest/free-user targeting, date range, weighted random), `POST /api/visual-ads/{uuid}/impression|skip|click` (analytics). Admin CRUD via `VisualAdAdminController`. `visual_ads` table migration + `show_visual_ads` column on `subscription_plans`.

## [1.41.0] - 2026-05-10

- **Feature**: **Stream Servers CRUD API** - Full admin CRUD for `stream_servers` table: `GET/POST /api/admin/stream-servers`, `GET/PUT/DELETE /api/admin/stream-servers/{uuid}`. Supports filters: `search`, `status`, `health_status`, `server_type`, `provider_name`.
- **Feature**: **MistServer Authentication Service** - New `MistAuthService` implementing the official MistServer challenge-response auth flow (`POST /api2`). Step 1 requests challenge with empty password; Step 2 computes `MD5(MD5(password) + challenge)`; Step 3 sends authenticated request. Credentials validated against live MistServer on every create/update before persisting.
- **Feature**: **AES-256 Password Encryption** - New `EncryptionHelper` encrypts `mist_server_password` at rest using AES-256-CBC with a random IV per encryption. Key from `MIST_ENCRYPTION_KEY` env variable. Decrypted only at runtime inside `MistAuthService`.
- **Feature**: **MistServer Auth State Persistence** - `mist_challenge` (VARCHAR 64) and `mist_final_hash` (VARCHAR 32) stored per server record after each successful credential validation, enabling admin visibility of last known auth state.
- **Database**: **`stream_servers` Table** - New table with 60+ columns: server identity, host (IPv4/IPv6/domain), MistServer API config, streaming endpoints (RTMP, HLS, HTTPS-HLS, CMAF, WebRTC, SRT), infrastructure (type, provider, datacenter, OS, kernel), hardware specs (CPU, RAM, disk, bandwidth, GPU), capacity/monitoring, lifecycle timestamps, feature flags, security flags, admin status.
- **Database**: **Migration Files** - `create_stream_servers_table.sql` (fresh install) and `add_mist_auth_fields_to_stream_servers.sql` (ALTER for existing installs).
- **Config**: **`MIST_ENCRYPTION_KEY`** - New required env variable for AES-256 MistServer password encryption. Added to `.env` and `.env.example`.

## [1.40.1] - 2026-05-01
- **Fix**: **Feedback Public Access** - Added `/api/feedback` to `ApiKeyMiddleware` public bypass list using suffix/contains matching to support subdirectory installs (e.g. `/nellaiiptv/backend/public/api/feedback`).
- **Fix**: **Feedback Response Data** - `POST /api/feedback` now returns the created feedback record (`uuid`, `feedback_type`, `rating`, `issue_type`, `platform`, `status`, `created_at`) instead of `null`.

## [1.40.0] - 2026-05-01
- **Feature**: **Feedback API** - New `POST /api/feedback` public endpoint (optional auth) accepting `feedback_type`, `rating` (1–5), `issue_type` (for channel issues), and `message`. Platform resolved from `X-Client-Platform` header; `customer_id` auto-resolved from JWT when authenticated.
- **Feature**: **Admin Feedback API** - New admin endpoints: `GET /api/admin/feedback` (paginated, filterable by type/status/platform/rating), `PUT /api/admin/feedback/{uuid}/status`, `DELETE /api/admin/feedback/{uuid}`.
- **Feature**: **Feedback Model & Migration** - Added `Feedback` Eloquent model and `create_feedback_table.sql` migration with `customer_id` (nullable FK), `feedback_type`, `rating`, `issue_type`, `message`, `platform`, `status` columns.

## [1.39.2] - 2026-05-01
- **Fix**: **CORS & Preflight Stability** - Implemented dynamic origin handling and a global OPTIONS catch-all route to ensure seamless cross-subdomain authentication and password resets.
- **Fix**: **Header Compatibility** - Expanded allowed CORS headers to include `Accept` and `Origin` for improved browser compatibility.

## [1.39.1] - 2026-05-01
- **Fix**: **Environment Variable Stability** - Refined `getenv()` logic in `ResendEmailService` to correctly handle `false` returns using the Elvis (`?:`) operator, ensuring robust API key and from-address detection on all PHP environments.

## [1.39.0] - 2026-05-01
- **Feature**: **Backend-Only Password Reset** - Migrated the complete password reset architecture from Next.js middleware to the PHP backend. Backend now owns token generation, validation, and email dispatch.
- **Feature**: **Email Templates** - Implemented a dedicated view-based email template system (`app/Templates/Emails`) for professional, branded password reset notifications.
- **Fix**: **SSL/cURL Resilience** - Implemented a direct cURL fallback (`sendViaCurl`) with an SSL verification toggle (`RESEND_SKIP_SSL=true`) to resolve cURL error 77 on local WAMP/Windows environments where `cacert.pem` is broken.
- **Fix**: **PSR-7 Compatibility** - Resolved `getBasePath()` unknown method errors across all controllers by implementing proper `RouteContext` retrieval.
- **Fix**: **Eloquent Capsule Stability** - Fixed `DB::raw()` errors by switching to `DB::connection()->raw()`.
- **Config**: **Resend Domain Verified** - Updated `MAIL_FROM_ADDRESS` to `no-reply@nellaiiptv.com` after completing Cloudflare DNS verification for the `nellaiiptv.com` sending domain on Resend, eliminating spam folder delivery.

## [1.38.6] - 2026-04-30
- **Feature**: **Database Health Verification** - Enhanced the `/health` endpoint in `SystemController` to actively verify the PDO database connection via Capsule on every ping, reliably triggering a 503 response if the backend loses database connectivity.

# Backend Changelog

## [1.38.0] - Backend - 2026-04-14

### Added
- **Channel Share Code**: Added `share_code` column (VARCHAR 6, UNIQUE) to the `channels` table for static 6-digit shareable channel identifiers.
- **API Endpoint**: Implemented `GET /api/channels/share/{share_code}` public endpoint to resolve a share code to full channel details.
- **Auto-Generation**: Updated `Channel` model `boot()` method to automatically generate a unique 6-digit `share_code` on record creation.
- **Admin API**: `share_code` is now included in channel create/update payloads and returned in all channel API responses.

### Fixed
- **Slim Route Param Mismatch**: Fixed `findByShareCode` method -- Slim 4 requires PHP parameter name to exactly match the route placeholder (`{share_code}`).

### Maintenance
- **Version Sync**: Synchronized with Website v1.49.0 and App v1.9.1+50.

## [1.37.5] - Backend - 2026-03-14
- **App Sync**: Version bumped in sync with App v1.8.28+48 (AGP 8.9.1 upgrade and dependency updates).

## [1.37.4] - Backend - 2026-03-14
- **App Sync**: Version bumped in sync with App v1.8.27+47 which hides Settings/Category UI on Android TV devices.

## [1.37.3] - Backend - 2026-03-14
- **App Sync**: Version bumped to remain in sync with App v1.8.27+46 which enforced ascending channel number sorting by default.

## [1.37.2] - Backend - 2026-03-14
- **App Compatibility**: Backend and website version bumped to stay in sync with App v1.8.27+45 which includes Android TV specific playback fixes.

## [1.37.1] - Backend - 2026-02-28

### Maintenance
- **Version Sync**: Synchronized version with Frontend v1.48.1 and App v1.8.25+42 tracking heavy TV performance patches and persistent user settings interfaces.

## [1.37.0] - Backend - 2026-02-21

### Added
- **Scrolling Ads API**: Implemented full CRUD REST API for Scrolling Ads (`/admin/scrolling-ads`).
- **Database Migrations**: Added new `scroll_speed` field and renamed `display_duration` to `repeat_count`.
- **Public Endpoint**: Exposed `/scrolling-ads` endpoint for frontend apps to consume active marquee advertisements.

### Maintenance
- **Version Sync**: Synchronized version with Frontend and App updates.

## [1.36.3] - Backend - 2026-02-16

### Added
- **RTMP URL Support**: Added a new `rtmp_url` column to the `channels` table.
- **Mass Assignment**: Updated `Channel` model to allow mass assignment for the `rtmp_url` field.

### Maintenance
- **Version Sync**: Synchronized version with Website and App updates.
