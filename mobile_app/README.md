# Royal TV Mobile App

**Version**: `1.2.0`
**Framework**: Flutter 3.x

A high-performance, native Android application for streaming HLS content, optimized for both Mobile and TV interfaces.

## 🔗 Compatibility
- **Backend API**: v1.20.2+ (Required for correct image resolution)
- **Frontend**: v1.30.2+ (Shared assets)

## 🚀 Features

- **Native Playback**: Uses the official `video_player` package for hardware-accelerated HLS streaming.
- **Smart UI**:
    - **Splash Screen**: Professional startup with versioning and asset-optimized logo.
    - **Auto-Landscape**: Forces landscape mode for immersive viewing.
    - **Stretch Mode**: Fills the entire screen regardless of aspect ratio.
    - **Viewer Stats**: Real-time Top-Left viewer count (hidden in PiP).
- **Pro Experience**:
    - **Refined PiP**: Floating video with auto-hide controls and zero-pause entry.
    - **Session Volume**: Keeps separate app volume levels and restores system volume on exit.
    - **Safe Gestures**: Tap-to-Mute restricted to center zone.
- **Production Ready**:
    - **SecureConfig**: API keys managed via `.env`.
    - **Optimized**: APK size under 24MB.

## 🛠️ Setup & Development

### Prerequisites
- Flutter SDK (3.x+)
- Android Studio / Android SDK (API 35+)
- VS Code (Recommended)

### Installation

1.  **Navigate to directory**:
    ```bash
    cd mobile_app
    ```
2.  **Install Dependencies**:
    ```bash
    flutter pub get
    ```
3.  **Run Locally (Debug)**:
    ```bash
    flutter run
    ```

## 📦 Building for Production

To build a production-ready APK optimized for size (< 20MB):

1.  **Clean Build Cache**:
    ```bash
    flutter clean
    flutter pub get
    ```

2.  **Build Split APKs**:
    ```bash
    flutter build apk --release --split-per-abi
    ```
    *This generates separate APKs for `arm64-v8a` (Modern phones) and `armeabi-v7a` (Older phones).*

3.  **Locate APKs**:
    Output directory: `build/app/outputs/flutter-apk/`

## 🧩 Architecture

- **Entry Point**: `lib/main.dart`
- **Screens**:
    - `SplashScreen` (`lib/screens/splash_screen.dart`): Initial loading and branding.
    - `VideoPlayerScreen` (`lib/screens/video_player_screen.dart`): Main player logic.
- **Services**:
    - `ApiService`: Handles API communication and Environment variables.

## 🔒 Security

- **Package Name**: `com.nellaiiptv.royaltv`
- **Permissions**:
    - `INTERNET`: For streaming.
    - `WAKE_LOCK`: To keep screen on during playback.
- **Obfuscation**: R8 Code Shrinking enabled for release builds.
