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
