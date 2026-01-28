# Backend Changelog

All notable changes to the Nellai IPTV Backend will be documented in this file.

## [1.26.0] - 2026-01-28

### Added
- **Open Access Bypass**: Integrated `is_open_access` check into `JwtMiddleware` and `AuthService` to bypass plans/platform/device-limit requirements globally.
- **Boolean Sanitization**: Added `filter_var` sanitization for `is_featured`, `is_premium`, `is_ad_enabled`, and `is_open_access` in admin controllers to fix toggle persistence (Off state).

### Fixed
- **Middleware Safety**: Ensured cross-platform access for Open Access users by skipping platform-restriction checks in `AuthService`.

## [1.25.0] - 2026-01-28

## [1.24.1] - 2026-01-28

### Fixed
- **Timezone**: Set default system timezone to `Asia/Kolkata` (IST) to fix date discrepancies.
- **Reseller Stats**: Resolved missing column error (`created_by_id`) with database migration.
- **Slim Application Error**: Fixed autoload issue causing 500 errors on dashboard stats API.

### Added
- **API**: `GET /reseller/dashboard/stats` endpoint now operational.

## [1.24.0] - 2026-01-28

### Added
- Customer creation tracking system with `created_by_type` and `created_by_id` fields
- Database migration: `add_customer_creation_tracking.sql` for ownership tracking
- Ownership indicator in reseller customer search (`is_owned_by_reseller` flag)
- Password requirement for reseller customer creation endpoint

### Changed
- ResellerCustomerController: List endpoint now filters customers by reseller ownership
- ResellerCustomerController: Search endpoint returns all customers with ownership flag
- AdminCustomerController: Tracks admin user ID when creating customers
- AuthService: Sets `created_by_type='self'` for self-registrations

### Fixed
- Reseller customer filtering now properly shows only owned customers in list view

## [1.23.0] - 2026-01-27

### Added
- **Reseller Management**: Added `role` field to Customer model to distinguish between 'customer' and 'reseller' accounts.
- **Reseller Rules**: Resellers now have a fixed device limit of 1 and bypass all subscription requirements.
- **Transaction Filtering**: Added search and filter capabilities (by status, gateway) to `/admin/transactions` endpoint.
- **Role-Based Access**: Updated `JwtMiddleware` to exempt resellers from subscription validation.

### Changed
- **Customer API**: `CustomerController` now handles `role` field in create and update operations.
- **Auth Service**: Updated `AuthService` to include `role` in user data returned during login and token generation.
- **Device Limits**: Modified device limit logic to always enforce 1 device for resellers regardless of plan settings.

### Fixed
- **Subscription Purchase**: Resolved Catch-22 where users without a plan couldn't purchase one; added `/api/payments` to whitelist in `JwtMiddleware`.
- **Payment Flow**: Updated middleware to allow payment requests even when device limit is reached.

## [1.22.0] - 2026-01-27

### Fixed
- **Route Conflict**: Resolved critical 500 Slim Application Error on `/api/plans` by fixing route shadowing in `api.php`. Moved public/static routes before protected/variable routes to ensure correct FastRoute registration.
- **Settings API**: Fixed undefined variable `$fallbackMp4Url` in `PublicSettingController.php`.

### Improved
- **Security Middleware**: Updated `OptionalAuthMiddleware.php` to catch all `Throwable` types during JWT decoding, preventing 500 crashes on malformed tokens.
- **Infrastructure**: Guaranteed existence of `logs` directory for filesystem-based logging stability.

## [1.21.0] - 2026-01-26

### Added
- **Sanitized Fallback Handling**: Updated `PublicSettingController` to resolve full absolute URLs for `fallback_404_mp4_url`.
- **Default Asset Resilience**: Integrated high-quality fallback video samples for newly deployed systems with unconfigured settings.

### Fixed
- **Settings API**: Resolved relative path resolution issues in `PublicSettingController` to ensure cross-platform compatibility.

## [1.20.4] - 2026-01-25

### Added
- **Ad Redirection**: `Ad` model now supports `redirect_url` via `$fillable` for creating clickable banner ads.
- **MP4 Fallback**: `PublicSettingController` now returns `fallback_404_mp4_url` instead of HLS, supporting the new app-side fallback player.

## [1.20.3] - 2026-01-25

### Changed
- **View Count Formatting**: Refactored `formatViewCount` in `ChannelService` and `Admin\ChannelService` to use integer arithmetic. This eliminates floating-point rounding errors, ensuring values like 2253 are correctly formatted as "2.2+K" instead of "2.3K".

## [1.20.2] - 2026-01-20

### Fixed
- **URL Resolution**: Enhanced `APP_URL` detection to support `getenv()` and `$_SERVER` variables, ensuring correct cloud domain generation even when `$_ENV` is not populated (e.g., specific server configs).
- **Admin Settings**: Applied the same robust URL resolution logic to the Admin Settings controller.


### Security
- **Path Disclosure**: Removed `_path` fields (`logo_path`, `thumbnail_path`, `app_logo_png_path`) from public API responses to prevent exposing internal file system structures.
- **Access Control**: `Channel` model now enforces hiding of path attributes, ensuring only `_url` accessors are visible.


### Fixed
- **Production URLs**: Refactored `Channel.php` and `Settings` logic to use `APP_URL` env variable for generating absolute URLs, removing hardcoded local paths.
- **Documentation**: Updated README to properly document `APP_URL` requirement for production deployments.

## [1.18.1] - 2026-01-19

### Refactored
- **Database Schema**: Renamed `thumbnail_url` to `thumbnail_path` and `logo_url` to `logo_path` in `channels` table to accurately reflect storage of relative paths.
- **Model Logic**: Updated `Channel` model to store paths but dynamically append full URLs (`thumbnail_url`, `logo_url`) in API responses via accessors.

## [1.18.0] - 2026-01-19

### Added
- **Smart File Management**: Implemented automatic cleanup of old files when replacing channel logos/thumbnails.
- **Relative Path Storage**: Optimized database storage to save only relative paths (`/uploads/...`) while APIs return full absolute URLs.

### Fixed
- **Upload Stability**: Fixed "Slim Application Error" (500) caused by duplicate file processing.
- **API Compatibility**: Updated `Channel` model accessors to ensure consistent full URL generation for all clients.

## [1.12.1] - 2026-01-07

### Fixed
- **Critical Crash**: Resolved a syntax error in `public/index.php` (broken string concatenation/array definition) that caused 500 errors.
- **Logo Stability**: Updated `SettingController` to ensure logo URLs are always fully qualified, preventing display issues in Admin and Frontend.

## [1.12.0] - 2026-01-07

### Added
- **Dynamic Trending API**: Added `GET /api/dashboard/trending` endpoint to fetch trending channel statistics with support for filtering by Limit, Category, and Language.
- **Dynamic Branding API**: Added `POST /api/settings/logo` and `GET /api/settings/public` endpoints for logo management.
- **Metadata Endpoints**: Exposed `/api/states`, `/api/districts`, `/api/languages`, and `/api/categories` via `GeoController`.
- **Dashboard Stats**: Extended `DashboardController` to perform efficient aggregation for view counts.

## [1.11.0] - 2026-01-07

### Added
- **JSON Body Parsing**: Enabled `BodyParsingMiddleware` in `public/index.php`. This fixes issues where JSON request bodies (like in Admin Login) were not being parsed correctly, leading to validation failures.
- **Enhanced Validation**: Updated `AuthController::register` to enforce strict patterns:
    - **Phone**: Must be exactly 10 digits (`lengthMin: 10`, `lengthMax: 10`).
    - **Email**: Validated for correct email format and presence.

## [1.7.0] - 2025-12-24

### Added
- **Channel Views Tracking**: Added `channel_views` table to track views with client IP addresses (`client_ip` column).
- **Improved Sorting**: Implemented `top_trending` sort logic in `ChannelService`, calculating views based on the last 3 days.
- **Category Relationship**: Added direct relationship between `Channel` and `Category` models, eager loaded in API responses.
- **Heartbeat & View Logic**: Updated view increment logic to verify unique IPs per session/day (basic implementation for accurate counting).

### Changed
- **API Response**: `Channel` objects now include a full `category` object.
- **CORS Policies**: Refined CORS headers for better cross-origin support during development.

## [1.6.0] - 2024-12-22

### Added
- **Global Channel Limit Removal**: Removed the hardcoded 100-channel limit across the entire application.
- **Unlimited Fetching Support**: Added support for `limit=-1` parameter in the `GET /channels` endpoint to return all active channels without pagination.
- **Updated Pagination Logic**: Refined `ChannelService` to branch between paginated results (default) and full results when `limit=-1` is specified.

### Updated
- **Category-Specific Fetching**: Updated language and state category pages to fetch all relevant channels at once.
- **Search & Sidebar Synchronization**: Synchronized the channel limit removal across the main home page, channels list, and individual channel sidebar.

## [1.5.0] - 2024-12-21

### Added
- **Channel Reporting System**: Users can now report individual channels for issues.
  - Added `POST /api/channels/{uuid}/report` endpoint.
  - Created `channel_reports` database table.
  - Created `ChannelReport` model and service logic.
- **Contact Form Backend**:
  - Added `POST /api/contact` endpoint for user inquiries.
  - Created `contact_messages` table and `ContactMessage` model.
  - Implemented validation for name, email, and message.
- **Improved Base Path Detection**: Added logic to `public/index.php` to automatically detect the base path, supporting both subfolder and root domain deployments.
- **Debug Mode**: Added `?debug=1` parameter to the health check and main entry point for easier server troubleshooting.

### Fixed
- **Slim Routing in Root**: Resolved "Endpoint not found" errors when deploying the backend directly to the server root.
- **Validation Consistency**: Updated `ContactController` and `ChannelController` to return consistent error response formats.
- **CORS Configuration**: Refined CORS headers to ensure compatibility with various server environments.

### Technical Improvements
- Migrated to a more robust middleware stack ordering (LIFO logic corrected).
- Integrated `ResponseFormatter` across new controllers for consistent JSON outputs.
- Optimized Eloquent relationships for channel details.

---
*Nellai IPTV Backend Development Team*
