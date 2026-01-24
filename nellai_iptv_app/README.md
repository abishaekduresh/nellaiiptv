# Nellai IPTV App

A premium Flutter-based IPTV application built for Android TV and Mobile devices.

## Features

- **Live TV Streaming**: High-quality streaming with MediaKit player.
- **Classic TV Interface**: Grid-based channel selection optimized for Remote controls.
- **Premium Content**: Secure handling of premium channels with status indicators.
- **Security**: Built-in screenshot and screen recording prevention.
- **Responsive Design**: Adapts to Mobile and TV landscape orientations.
- **Ads Integration**: Server-controlled ad rotation system.

## Version 1.4.1 Highlights


- **Near-Instant Switching**: Parallel API/Player logic for zero-delay channel loading.
- **Session-Based Caching**: High-speed thumbnail caching with automatic startup reset.
- **Enhanced Ad UX**: Dual-level skeleton loading for API calls and image downloads.
- **Android TV Ready**: Added `LEANBACK_LAUNCHER` support and optimized D-pad grids.
- **Security**: Screenshot/Recording prevention and secure `.env` signing.

## Tech Stack

- **Flutter**: ^3.32.6
- **Player**: MediaKit
- **State Management**: Provider
- **Networking**: Dio
- **Animation**: Flutter Animate

## Getting Started

1.  **Environment**: Ensure `.env` is configured with `API_BASE_URL` and `API_KEY`.
2.  **Run**: `flutter run` (Landscape mode enforced).
