# Nellai IPTV App

A premium Flutter-based IPTV application built for Android TV and Mobile devices.

## Features

- **Live TV Streaming**: High-quality streaming with MediaKit player.
- **Classic TV Interface**: Grid-based channel selection optimized for Remote controls.
- **Premium Content**: Secure handling of premium channels with status indicators.
- **Security**: Built-in screenshot and screen recording prevention.
- **Responsive Design**: Adapts to Mobile and TV landscape orientations.
- **Ads Integration**: Server-controlled ad rotation system.

## Version 1.4.0 Highlights

- **Enhanced Security**: Screen recording blocked and secure `.env` signing configuration.
- **Better Navigation**: Validated TV remote D-pad support.
- **Visuals**: New animated splash screen and responsive watermarks.
- **Reliability**: Blocking error screens for API failures and volume persistence fixes.
- **Distribution**: Release-ready Android App Bundle (.aab) generated.

## Tech Stack

- **Flutter**: ^3.27.0
- **Player**: MediaKit
- **State Management**: Provider
- **Networking**: Dio
- **Animation**: Flutter Animate

## Getting Started

1.  **Environment**: Ensure `.env` is configured with `API_BASE_URL` and `API_KEY`.
2.  **Run**: `flutter run` (Landscape mode enforced).
