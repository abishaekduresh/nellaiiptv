## [1.51.0] - 2026-06-01

### Removed
- **`ViewerSessionController`** (`app/Controllers/Admin/ViewerSessionController.php`) — Deleted; `GET /admin/viewer-sessions` and `POST /admin/viewer-sessions` endpoints removed.
- **`ViewerSession` model** (`app/Models/ViewerSession.php`) — Deleted.
- **`ViewerSessionService`** (`app/Services/Admin/ViewerSessionService.php`) — Deleted.
- **`create_viewer_sessions_table.sql`** (`database/migrations/`) — Migration file deleted.
- **`TenantController`** (`app/Controllers/Admin/TenantController.php`) — Deleted; `GET|POST /admin/tenants` and `GET|PUT|DELETE /admin/tenants/{uuid}` endpoints removed.
- **`Tenant` model** (`app/Models/Tenant.php`) — Deleted.
- **`TenantService`** (`app/Services/Admin/TenantService.php`) — Deleted.
- **`create_tenants_table.sql`** (`database/migrations/`) — Migration file deleted.
- **Routes** (`app/Routes/admin.php`) — Viewer Sessions and Tenants route groups removed from the admin middleware group.

---

## [1.50.0] - 2026-06-01

### Added
- **`StreamService::refreshAssignedStreams(array $streamIds)`** — Public method that groups stream IDs by server, calls Flussonic `GET /streams/{name}` (10 s timeout) per stream, upserts stats via the private `upsertStream()` method, and refreshes client sessions scoped to those stream names only.
- **`StreamService::syncSessionsForStreams(StreamServer $server, array $streamNames)`** — Private method for targeted session sync. Fetches `/sessions` from Flussonic, deletes `stream_clients` rows only for the given stream names, and re-inserts fresh data. Scoped so it never affects sessions for other customers' streams.
- **`CustomerStreamController::getMyStreams()` — `?sync=1` support** — When the `sync` query param is present, the controller calls `refreshAssignedStreams()` before reading the DB, returning genuinely live Flussonic stats. Normal requests (no param) remain a fast DB-only read.

---

## [1.49.0] - 2026-06-01

### Added
- **`customer_stream_assignments` pivot table** (`database/migrations/create_customer_stream_assignments_table.sql`) — `INT UNSIGNED customer_id` (FK → `customers.id` CASCADE) + `BIGINT UNSIGNED stream_id` (FK → `streams.id` CASCADE) + `assigned_at`. UNIQUE KEY on `(customer_id, stream_id)`. **Note**: `customer_id` is `INT UNSIGNED` to match `customers.id`; using `BIGINT UNSIGNED` caused MySQL error 3780 (incompatible FK types).
- **`Customer::assignedStreams()`** (`app/Models/Customer.php`) — `BelongsToMany` to `Stream` via pivot, `withPivot('assigned_at')`, ordered by `assigned_at DESC`.
- **`Stream::assignedCustomers()`** (`app/Models/Stream.php`) — Inverse `BelongsToMany` back to `Customer`.
- **`CustomerStreamController`** (`app/Controllers/Admin/CustomerStreamController.php`) — Three methods:
  - `getStreams($uuid)` — Fetches assigned streams for a customer; maps pivot `assigned_at` via `$s->pivot->assigned_at`.
  - `assignStream($uuid, $streamUuid)` — Attaches stream to customer; guards against duplicates (409); uses `date('Y-m-d H:i:s')` (not `now()` — standalone Eloquent has no Laravel helpers).
  - `unassignStream($uuid, $streamUuid)` — Detaches stream from customer.
- **Routes** (`app/Routes/admin.php`) — Three new routes under customers:
  - `GET /api/admin/customers/{uuid}/streams`
  - `POST /api/admin/customers/{uuid}/streams/{streamUuid}`
  - `DELETE /api/admin/customers/{uuid}/streams/{streamUuid}`

### Fixed
- **`now()` unavailable** — Replaced with `date('Y-m-d H:i:s')` in `assignStream()`; `now()` is a Laravel global helper not present in standalone `illuminate/database`.
- **`orderByPivot()` unavailable** — Replaced with `->orderBy('customer_stream_assignments.assigned_at', 'desc')`; `orderByPivot` requires full Laravel framework.

---

## [1.48.0] - 2026-06-01

### Added
- **`uptime` column** (`database/migrations/add_uptime_to_streams.sql`) — `BIGINT UNSIGNED NULL` added to `streams` table; stores milliseconds from Flussonic `stats.lifetime`.
- **`Stream::$fillable` + cast** — `uptime` added as `integer` cast.
- **`StreamService::extractUptime()`** — Dedicated helper; checks `stats.lifetime` first (canonical Flussonic v3 ms field), then `stats.uptime`, `stats.alive_time`, `stats.run_time`, finally computes from `stats.start_time` (Unix epoch). Returns `null` when stream is not alive.

### Fixed
- **Uptime field name** — Previous code checked `stats.uptime` first; Flussonic actually sends `stats.lifetime` in milliseconds. Field priority corrected.

---

## [1.47.0] - 2026-06-01

### Added
- **`FlussonicApiService::requestPut()`** — New public method for authenticated HTTP PUT requests to Flussonic. Mirrors `request()`: prefers stored scheme, supports Basic Auth and Bearer token, with scheme-retry fallback. Backed by new `putWithSchemeRetry()` and `put()` private methods (cURL with `CURLOPT_CUSTOMREQUEST = 'PUT'`, JSON body, `Content-Type: application/json`).
- **`StreamService::toggleStream(string $uuid, bool $enable)`** — Enables or disables a stream on its Flussonic server via `PUT /streamer/api/v3/streams/{encoded_name}` with `{"disabled": !$enable}`. Stream names containing `/` are URL-encoded as `%2F` per Flussonic docs. Updates local DB `status` to `active` or `inactive` on success. Returns fresh `Stream` model.
- **`StreamController::toggle()`** — Reads `enable` boolean from POST body (`filter_var` FILTER_VALIDATE_BOOLEAN). Returns success with updated stream and action message.
- **Route** (`app/Routes/admin.php`) — `POST /streams/{uuid}/toggle` registered between `show` and `clients` routes.

### Changed
- **Admin sidebar** (`AdminSidebar.tsx`) — "Add Server" entry removed from Stream Servers dropdown group.
- **`StreamInfraSubNav`** — "Add Server" item and unused `Plus` import removed.

---

## [1.46.0] - 2026-06-01

### Added
- **`stream_clients` table** (`database/migrations/create_stream_clients_table.sql`) — New table storing Flussonic session snapshots. Columns: `uuid` (Flussonic session id, UNIQUE), `stream_id` (FK → `streams.id` ON DELETE SET NULL), `stream_name`, `ip`, `user_agent`, `protocol`, `opened_at` / `closed_at` (ms epoch, BIGINT UNSIGNED), `country`. **Run migration on live database before deploying.**
- **`StreamClient` model** (`app/Models/StreamClient.php`) — Eloquent model for `stream_clients`; fillable, integer casts for `stream_id`/`opened_at`/`closed_at`; `belongsTo(Stream)` relationship.
- **`StreamService::syncSessionsFromServer()`** — Calls `/streamer/api/v3/sessions` per server. Before inserting, deletes all existing `stream_clients` for that server's streams (wipe-and-replace snapshot semantics). Builds `stream_name → stream_id` map in one query to avoid N+1. Inserts fresh records via `insertStreamClient()`. Returns count of sessions inserted.
- **`StreamService::insertStreamClient()`** — Maps Flussonic session fields: `id→uuid`, `name→stream_name`, `proto→protocol`, `opened_at`/`closed_at` cast to int.
- **`StreamService::getClients(string $uuid)`** — Returns latest 200 `stream_clients` for a stream ordered by `opened_at DESC`.
- **`Stream` model** — Added `clients()` HasMany → `StreamClient` relationship.
- **`StreamController::clients()`** — `GET /api/admin/streams/{uuid}/clients` returns the session list for a stream.
- **Route** (`app/Routes/admin.php`) — `GET /streams/{uuid}/clients` registered before `GET /streams/{uuid}`.

### Changed
- **`StreamService::syncFromServers()`** — Added `$clients` counter; calls `syncSessionsFromServer()` per server inside the sync loop; includes `clients` in the returned result array.
- **`StreamController::sync()`** — Sync response message now includes `{clients} clients synced`.

---

## [1.45.0] - 2026-05-31

### Changed
- **`StreamService::upsertStream()`** — Completely rewritten to consume Flussonic API v3 response shape. Extracts video and audio tracks from `stats.media_info.tracks[]` by `content` field. Maps all 17 new stats columns. Upsert key changed from `stream_key` to `stream_name`. Input URL sourced from `inputs[0].url` first (canonical v3 location) then falls back to legacy field paths.
- **`StreamService::getAll()`** — Added `stream_status` query filter; `ALLOWED_SORTS` extended with `stream_status`, `online_clients`, `out_bandwidth`; search now also matches `published_from`.
- **`StreamService`** — `update()` method removed; streams are read-only from Flussonic.
- **Routes** (`app/Routes/admin.php`) — `POST /admin/streams` (create) and `PUT /admin/streams/{uuid}` (update) routes removed.

### Added
- **`Stream` model** — 17 new fillable fields and casts: `inputs_bandwidth` (BIGINT), `out_bandwidth` (BIGINT), `online_clients` (INT), `video_width` (INT), `video_height` (INT), `video_codec` (VARCHAR 50), `fps` (DECIMAL 6,2 → float cast), `audio_codec` (VARCHAR 50), `audio_bitrate` (INT), `audio_sample_rate` (INT), `audio_channels` (TINYINT), `stream_status` (VARCHAR 50), `published_via` (VARCHAR 50), `published_from` (VARCHAR 100), `client_count` (INT), `stream_url_type` (VARCHAR 255), `max_sessions` (INT).
- **Migration** (`database/migrations/add_stream_stats_columns.sql`) — `ALTER TABLE streams` adds all 17 columns; modifies `input_url` and `output_formats` to nullable. **Run on live database.**

---

## [1.44.1] - 2026-05-30

### Added
- **`POST /api/admin/streams/sync`** — New endpoint registered before `{uuid}` routes. Fetches all streams from every active + online Flussonic server and upserts them into the local DB. Upsert key: `stream_key` + `server_id`. Creates new records (`uuid`, `viewer_limit=1000`, `status=active`); updates `health_status`, `bitrate`, `current_viewers`, `output_formats` on existing ones. Returns `{ created, updated, errors[] }`. Accepts optional `?server_uuid=` query param to target a single server.
- **`StreamService::syncFromServers(?serverUuid)`** — Queries active + online servers, calls `fetchFlussonicStreams()` per server, delegates upsert to `upsertStream()`. Per-server errors are collected and returned (never abort the whole sync). Throws only when no eligible servers exist.

### Improved
- **`FlussonicApiService::request()`** — Added optional `$timeout` parameter (default `self::REQUEST_TIMEOUT = 15 s`). Sync calls pass `60 s`; liveness / ping calls remain at 15 s.
- **`FlussonicApiService` scheme retry** — Timeout errors (`"timed out"`) are now treated as definitive in `requestWithSchemeRetry`. Previously, a timeout on HTTP caused a second 15 s wait on HTTPS on the same host/port; now the exception is thrown immediately, halving the worst-case wait.
- **`describeCurlError()`** — Accepts `$timeout` param so the value shown in error messages reflects the actual limit used for that call.

---

## [1.44.0] - 2026-05-28

### Added
- **`Stream` resource** — Full admin CRUD API (`GET/POST /api/admin/streams`, `GET/PUT/DELETE /api/admin/streams/{uuid}`). `Stream` model with JSON `output_formats` cast, `health_status` (online/offline), `viewer_limit`, `current_viewers`, `bitrate`, soft delete. `StreamService` resolves `server_uuid` → `server_id` FK on create/update, normalises `output_formats` JSON. Filters: `search`, `server_uuid`, `status`, `health_status`. Sort: `id`, `stream_name`, `created_at`, `health_status`, `current_viewers`, `bitrate`.
- **`ViewerSession` resource** — `GET /api/admin/viewer-sessions`, `POST /api/admin/viewer-sessions`. `ViewerSession` model (no timestamps), `protocol` enum (hls/dash/rtmp/webrtc). `ViewerSessionService` resolves `stream_uuid` → `stream_id`, uses `updateOrCreate` on `session_id`. Filters: `stream_uuid`, `protocol`, `country`, `search`.
- **`ServerMonitoring` resource** — `GET /api/admin/monitoring` (latest snapshot per server), `GET /api/admin/monitoring/{serverUuid}/history`, `POST /api/admin/monitoring/{serverUuid}/record`, `POST /api/admin/monitoring/record-all`. `MonitoringService::recordAllFromFlussonic()` pulls live CPU/RAM/disk/network/stream/viewer data from each active server's Flussonic `monitoring` endpoint and persists snapshots.
- **`Tenant` resource** — Full admin CRUD (`GET/POST /api/admin/tenants`, `GET/PUT/DELETE /api/admin/tenants/{uuid}`). `Tenant` model with JSON casts for `allowed_servers` and `channel_id`. `TenantService` normalises both JSON fields on create/update. Filters: `search`, `status`.
- **`StreamServerPingService`** — `pingAll()` iterates all active servers, calls `monitoring/liveness` via `FlussonicApiService::request()`, updates `health_status` and `last_ping_at`, returns a `{total, online, offline, details}` summary.
- **`POST /api/admin/stream-servers/ping-all`** — Manual trigger for `StreamServerPingService::pingAll()`. Registered before `{uuid}` routes to avoid conflict.
- **`backend/cron/ping_stream_servers.php`** — Standalone CLI cron script. Bootstraps Eloquent from `.env` directly (no Slim). Self-throttles using `stream_server_ping_interval` setting (minutes) and `stream_server_last_ping_run` timestamp stored in the `settings` table. Schedule every 1 min in OS scheduler; the script skips execution if the interval has not elapsed.
- **Database migrations** — `create_streams_table.sql`, `create_viewer_sessions_table.sql`, `create_server_monitoring_table.sql`, `create_tenants_table.sql`. All tables use InnoDB, utf8mb4, appropriate FK constraints and indexes.
- **Settings keys** — `stream_server_ping_interval` (default 5 min), `stream_server_last_ping_run` (ISO timestamp, set by cron).

---

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
