# Nellai IPTV Project

This repository contains the source code for the Nellai IPTV ecosystem, including the mobile/TV application and backend services.

## Components

### `nellai_iptv_app` (Flutter)
A premium IPTV player built for Android and Android TV.
- **Version**: 1.5.0+5
- **Key Features**: Fallback HLS, Retry UI, Connectivity Monitoring, Android TV Compliance.

## Recent Updates (v1.5.0+5)

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
