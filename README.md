# Nellai IPTV Project

This repository contains the source code for the Nellai IPTV ecosystem, including the mobile/TV application and backend services.

## Components

### `frontend` (Next.js)
Premium web interface optimized for Browsers and Smart TV.
- **Version**: 1.35.1
- **Key Features**: Reseller Management, Transaction Filtering, Role-Based UI, SEO Landing Page.

### `backend` (Slim PHP)
RESTful API with role-based access control and subscription management.
- **Version**: 1.24.1
- **Key Features**: Reseller System, Device Limits, Transaction Search, Payment Gateway Integration.

### `nellai_iptv_app` (Flutter)
A premium IPTV player built for Android and Android TV.
- **Version**: 1.6.1+10
- **Key Features**: MP4 Fallback, Clickable Ads, Retry Countdown, Android TV Compliance.

## Recent Updates (v1.6.1+10 App / v1.35.1 Frontend / v1.24.1 Backend)

### Backend
- **Reseller Management**: Role-based customer system with 'customer' and 'reseller' types.
- **Device Limits**: Resellers fixed at 1 device; customers use plan-defined limits.
- **Subscription Bypass**: Resellers no longer require active subscription plans.
- **Transaction Filtering**: Enhanced admin API with search and filter capabilities.
- **Payment Flow Fix**: Resolved blocking issue for subscription purchases.

### Frontend
- **Admin Panel**: Added reseller creation and management interface.
- **Role Display**: Visual badges (purple/blue) across customer lists and profiles.
- **Transaction Search**: Advanced filtering by status, gateway, and search terms.
- **Profile Customization**: Different layouts for resellers vs customers.
- **Enhanced UX**: Role filtering and sortable customer tables.

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
