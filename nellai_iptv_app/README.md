# Nellai IPTV App

A premium Flutter-based IPTV application built for Android TV and Mobile devices.

## Features

- **Live TV Streaming**: High-quality streaming with MediaKit player.
- **Classic TV Interface**: Grid-based channel selection optimized for Remote controls.
- **Premium Content**: Secure handling of premium channels with status indicators.
- **Security**: Built-in screenshot and screen recording prevention.
- **Responsive Design**: Adapts to Mobile and TV landscape orientations.
- **Ads Integration**: Server-controlled ad rotation system.

## Version 1.4.2 Highlights


- **Full-Screen STB Overlay**: Setup Box style channel navigation directly in the full-screen player (Left-side aligned).
- **Persistent Metadata**: Live viewer counts and ratings permanently visible during playback.
- **TV Priority Navigation**: "All Channels" grouped list with autofocus for D-Pad remotes.
- **Android 15 Ready**: Full Edge-to-Edge support (Target SDK 35) with modern native integration.
- **Near-Instant Switching**: Parallel API/Player logic for zero-delay channel loading.
- **Session-Based Caching**: High-speed thumbnail caching with automatic startup reset.
- **Enhanced Ad UX**: Dual-level skeleton loading for API calls and image downloads.
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
