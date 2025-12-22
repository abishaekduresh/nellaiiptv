# Frontend Changelog

All notable changes to the Nellai IPTV Frontend will be documented in this file.

## [1.6.0] - 2024-12-22

### Added
- **Unlimited Channel Loading**: Removed the hardcoded 100-channel limit. All channels are now fetched without a cap across all modes.
- **Classic Mode Optimization**: Classic Mode now fetches all available channels using the new `limit=-1` API parameter.
- **Category Fetching Updates**: Standardized data fetching on Language and State category pages to ensure all relevant channels are displayed.
- **Sidebar Synchronization**: The related channels sidebar on individual channel pages now uses `-1` limit for a more complete list.

### Fixed
- **Consistency in Data Fetching**: Replaced varied hardcoded limits with a unified unlimited fetching strategy.

## [1.5.0] - 2024-12-21

### Added
- **Classic Mode Mobile Responsiveness**: Improved layout for mobile devices in Classic Mode.
- **Toast Notifications**: Integrated global toast system for connectivity and action feedback.
- **Channel Reporting UI**: Added interface for users to report stream issues.
- **Contact Form**: Implemented contact page for user inquiries.
