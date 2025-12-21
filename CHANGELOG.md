# Changelog

All notable changes to this project will be documented in this file.

## [1.5.0] - 2025-12-21
### Added
- **Channel Report System**: Complete backend and frontend integration for reporting channel issues
  - Created `channel_reports` table with MyISAM engine compatibility
  - Added `ChannelReport` model with channel and customer relationships
  - Implemented `createReport` method in `ChannelService`
  - Added `/api/channels/{uuid}/report` endpoint with validation
  - Integrated `ReportModal` with backend API, sends customer UUID when logged in
  - Report modal now available in both Classic and OTT modes
- **Contact Form Backend**: Replaced webhook with database storage
  - Created `contact_messages` table for storing contact form submissions
  - Added `ContactMessage` model and `ContactController` with validation
  - Implemented `/api/contact` endpoint with email format and length validation
  - Frontend now uses backend API instead of external webhook
- **Classic Mode Enhancements**:
  - Added real-time stream status checking for each channel card
  - Channels now display accurate ONLINE/OFFLINE status based on stream availability
  - Implemented navigation guard to prevent accessing other pages in Classic mode
  - Users are automatically redirected to home page when trying to navigate away
- **Network Status Monitoring**:
  - Added global internet connection status monitoring
  - Toast notifications appear when connection is lost (stays visible until restored)
  - Toast notifications appear when connection is restored (auto-dismisses after 3 seconds)
  - Offline toast automatically dismisses when connection returns

### Changed
- **UI/UX Improvements**:
  - Removed gap between navbar and content in OTT mode (removed `pt-16` and `pt-24` padding)
  - Added `pt-6` padding to main content area for better spacing below navbar
  - Improved skeleton loading - now only shows during initial page load, not after content loads
- **Classic Mode**:
  - Updated `VideoPlayer` to accept and pass `channelUuid` and `channelName` props
  - Channel status badges now use real-time stream status instead of database status field
- **Contact Page**:
  - Enhanced error handling to display specific validation errors from backend
  - Better user feedback with detailed error messages

### Fixed
- **Channel Report**:
  - Fixed SQL foreign key constraint errors by using MyISAM engine instead of InnoDB
  - Fixed "Channel information missing" error by passing channel props through all components
- **Contact Form**:
  - Fixed validation errors by using correct Valitron rule syntax
  - Removed unsupported `lengthMax` validation rule
- **Classic Mode**:
  - Fixed incorrect channel status display (was showing database status instead of stream status)
  - Fixed navigation issues by implementing `ClassicModeGuard` component
- **Network Monitoring**:
  - Fixed offline toast persisting after connection restored by implementing toast ID tracking

## [1.4.0] - 2025-12-07
### Added
- **Classic Mode Layout**: New 3-column channel list grid on large screens for better density.
- **Classic Mode Ads**: Enhanced ad visibility with optimized player height (50/50 split) and increased container height.
- **OTT Home Sorting**: "Featured" and "All Channels" groups are now sorted by channel number (ascending).
- **Popularity Sorting**: "Other Channels" in OTT mode are now sorted by viewer count (descending).

### Changed
- **Classic Mode**: Player width balanced to 50% to prevent vertical scrolling and ensure the banner ad is fully visible.
- **Startup Performance**: Classic Home now initializes the first channel immediately, removing ad loading delays on mode switch.

## [1.3.1] - 2025-12-07
### Fixed
- Fixed TypeScript error in VideoPlayer where `currentTime()` could be undefined.

## [1.3.0] - 2025-12-07
### Added
- **TV Mode**: Full "10-foot UI" support with arrow key navigation (Spatial Navigation).
- **TV Navigation Provider**: Global context to manage focus and keyboard events.
- **TV Components**: Updated `HeroBanner`, `ChannelCard`, `ChannelRow`, `Navbar`, and `DisclaimerModal` to be focusable and responsive to remote controls.
- **Video Player**: Added native TV remote support (Play/Pause, Volume, Seek, Back).
- **Channel Page**: Complete rework for TV navigation, including focusable rating, share, and comment sections.
- **Search Improvements**: Added support for single-digit channel queries (e.g., "1") and displaying channel numbers in results.

### Changed
- `ChannelCard` now scales (`scale-105`) and shows a border (`ring-4`) when focused.
- `DisclaimerModal` is now fully accessible via keyboard/remote.
- `Navbar` search logic updated to trigger on single-character input.

### Fixed
- Fixed issue where single-digit channel numbers could not be searched.

## [1.2.0] - 2025-12-07
### Added
- Search by channel number in Navbar (Backend & Frontend).
- Optimistic UI updates for viewer count.

### Changed
- Channels are now sorted by channel number (ascending) on the channels page.
- Refactored `ChannelPage` to prevent video player re-renders during state updates.

### Fixed
- Fixed Vercel build error by wrapping `useSearchParams` in `Suspense`.
- Fixed 500 Internal Server Error caused by stale `.next` build artifacts.
- Fixed viewer count not incrementing by resetting timer logic.
- Fixed CORS issues by configuring Next.js rewrites.

## [1.0.0] - 2025-11-26
### Added
- Initial release of Nellai IPTV project.
- Frontend built with Next.js, version 1.0.0.
- Backend REST API built with Slim PHP, version 1.0.0.
- Gitignore files for both frontend and backend.
- Basic project setup and configuration.

### Changed
- N/A

### Fixed
- N/A

---

## [1.1.0] - 2025-12-01
### Added
- Updated frontend UI components.
- Added new theme support.
- Improved accessibility features.

### Changed
- Refactored navigation bar.

### Fixed
- Fixed layout issues on mobile devices.

---

*This changelog follows the Keep a Changelog convention.*
