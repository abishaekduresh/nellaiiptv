# Backend Changelog

All notable changes to the Nellai IPTV Backend will be documented in this file.

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
