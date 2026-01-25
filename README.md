# Nellai IPTV Project

This repository contains the source code for the Nellai IPTV ecosystem, including the mobile/TV application and backend services.

## Components

### `frontend` (Next.js)
Premium web interface optimized for Browsers and Smart TV.
- **Version**: 1.31.0
- **Key Features**: Smart Fallback Player, Auto-Recovery, TV Navigation Menu.

### `nellai_iptv_app` (Flutter)
A premium IPTV player built for Android and Android TV.
- **Version**: 1.5.3+8
- **Key Features**: MP4 Fallback, Clickable Ads, Retry Countdown, Android TV Compliance.

## Recent Updates (v1.31.0 Frontend / v1.21.0 Backend)

- **Smart Fallback**: Automatic recovery system for broken streams with centered countdown UI.
- **Classic Menu**: Integrated TV-optimized side menu for user accounts and information.
- **Asset Resilience**: Automatic resolution of fallback video paths in backend.

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
