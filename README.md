# Nellai IPTV Project

This repository contains the source code for the Nellai IPTV ecosystem, including the mobile/TV application and backend services.

## Components

### `frontend` (Next.js)
Premium web interface optimized for Browsers and Smart TV.
- **Version**: 1.38.0
- **Key Features**: Kiosk-style Open Access, Reseller Management, Transaction Filtering, SEO Landing Page, Disclaimer UI logic.

### `backend` (Slim PHP)
RESTful API with role-based access control and subscription management.
- **Version**: 1.27.0
- **Key Features**: Auth Bypass Logic, Unified Admin Logs, Reseller System, Device Limits, Boolean Sanitization.

### `nellai_iptv_app` (Flutter)
A premium IPTV player built for Android and Android TV.
- **Version**: 1.6.2+13
- **Key Features**: Enhanced TV Navigation, Dynamic Ad Layout, Full Refresh Sync, Rich Channel Metadata.

## Recent Updates (v1.6.2+13 App / v1.38.0 Frontend / v1.27.0 Backend)

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
