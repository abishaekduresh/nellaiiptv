# Changelog

All notable changes to this project will be documented in this file.

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
