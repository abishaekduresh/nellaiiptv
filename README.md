# Nellai IPTV Project

This repository contains the source code for the Nellai IPTV ecosystem, including the mobile/TV application and backend services.

## Components

### `frontend` (Next.js)
Premium web interface optimized for Browsers and Smart TV.
- **Version**: 1.42.0
- **Key Features**: Tier-aware HLS Buffering, Dynamic Priority Sorting, Kiosk-style Open Access, Reseller Management.

### `backend` (Slim PHP)
RESTful API with role-based access control and subscription management.
- **Version**: 1.31.0
- **Key Features**: API Status Filtering, Priority Sorting (order_number), Health Check API, Auth Bypass Logic.

### `nellai_iptv_app` (Flutter)
A premium IPTV player built for Android and Android TV.
- **Version**: 1.8.2+18
- **Key Features**: Android TV Compliance (Banner/Icon), Easy Navigation (Menu/Mute), FFI Crash Stability, Number Key Navigation.

## Recent Updates (v1.8.2+18 App / v1.42.0 Frontend / v1.31.0 Backend)

### App (Flutter)
- **Feature**: **Android TV Compliance** - Successfully addressed Play Store rejections by installing high-res 320x180 banners and 512x512 full-bleed icons.
- **Feature**: **Easy Navigation** - Added dedicated "Channel List" and "Mute" buttons to player controls for deliberate remote-control access.
- **Fix**: **Mute Sync** - Real-time synchronization with hardware volume buttons.
- **Fix**: **FFI Crash Stability** - Eliminated `SIGABRT` crashes during hot restarts through synchronous resource disposal.
- **Improvement**: **Single-Click Fullscreen** - Faster transition into immersive viewing.

### Backend
- **Feature**: **Geo Filtering** - Categories and Languages APIs now support `status` parameter (active/inactive).

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
