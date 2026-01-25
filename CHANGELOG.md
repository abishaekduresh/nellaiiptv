## [1.5.2+7] - App | [1.20.4] - Backend - 2026-01-25

### App (Flutter)
- **Added**: MP4 Fallback support with instant loading logic.
- **Added**: Clickable Banner Ads with `redirect_url` support.
- **Improved**: Retry button countdown and Cyan theming.
- **Fixed**: Disabled In-App Updates in debug builds.

### Backend (PHP)
- **Added**: `fallback_404_mp4_url` in Public Settings API.
- **Added**: `redirect_url` support for Ads model.

## [1.5.1+6] - App | [1.20.4] - Backend - 2026-01-25

### App (Flutter)
- **Fixed**: Play Store device compatibility issue (Ethernet-tier devices) by relaxing manifest hardware requirements.

## [1.5.0+5] - App | [1.20.4] - Backend - 2026-01-25

### App (Flutter)
- **Added**: Fallback HLS Player with "Retry" UI and pulse animation.
- **Added**: Android TV Store compliance features (Banner, Leanback).
- **Added**: Connectivity monitoring with animated Toast notifications.
- **Fixed**: Internet recovery logic.

### Backend (PHP)
- **Added**: `fallback_404_hls_url` field to public settings API response.

## [1.4.3+4] - App | [1.20.3] - Backend - 2026-01-25

### App (Flutter)
- **Added**: State persistence for STB Navigation (remembers last category).
- **Added**: Real-time sync of channel ratings/views from player to main screen.
- **Changed**: Minimalist design for player stats overlay (smaller icons/text).
- **Fixed**: `GestureOverlay` hoisting to fix interaction issues during loading states.
- **Fixed**: Syntax errors in premium content logic.

### Backend (PHP)
- **Changed**: View count formatting now uses integer arithmetic for consistent precision (e.g. `2.2+K`).

## [1.4.2+3] - App | [1.20.2] - Backend - 2026-01-25

### App
- **Added**: Full-Screen "Set-Top Box" style channel navigation drawer.
- **Added**: TV-priority navigation with "All Channels" default group.
- **Changed**: Persistent viewer counts and ratings in player.

### Backend
- **Fixed**: Enhanced `APP_URL` detection for cloud deployments.
- **Security**: Removed internal path fields from public API responses.

## [1.4.1+2] - App | [1.18.1] - Backend - 2026-01-24

### App
- **Added**: Android 15 Edge-to-Edge support.
- **Added**: Parallel API fetching for instant switching.
- **Added**: Session-based thumbnail caching.
- **Security**: Screenshot prevention enabled.

### Backend
- **Refactored**: Database schema for relative path storage.
- **Added**: Smart file cleanup for logo/thumbnail updates.
