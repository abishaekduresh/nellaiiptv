# Nellai IPTV Main App (Classic Mode)

**Version**: `1.3.0`

A production-ready, high-performance Flutter application optimized for Android Tablets and TV devices. This app focuses on providing a **Classic IPTV experience** with a split-screen layout and advanced player controls.

## 📺 Key Features

### 🎨 Immersive Design
- **Landscape-Only Architecture**: Optimized for horizontal screens (TVs, Tablets).
- **Classic Split Layout**: 
    - **Left (60%)**: Premium Video Player with dynamic overlays and Ad banners.
    - **Right (40%)**: Interactive Channel Grid with smart category/language filtering.
- **Micro-Animations**: Cascading card entry and subtle selection glow effects for a premium feel.

### 🎥 Advanced Playback
- **HLS Performance**: Smart buffering and adaptive bitrate management.
- **Double-Tap Fullscreen**: Instant toggle between multi-pane and cinematic fullscreen.
- **Picture-in-Picture (PiP)**: Continue watching while using other apps.
- **Smart Loader**: Cyan ripple-effect pulse loader for smooth buffering transitions.

### 🛠 Tech Stack
- **Framework**: Flutter 3.x
- **Video Logic**: `video_player` + `simple_pip_mode`
- **Networking**: `dio` + `flutter_dotenv` for secure environment management.
- **State**: `provider` for efficient channel and advertisement management.

## 🚀 Getting Started

### Prerequisites
- Flutter SDK (^3.8.1)
- Android Studio / VS Code
- Android Device (Tablet/TV recommended)

### Setup
1. Clone the repository.
2. Navigate to `nellai_iptv_app`.
3. Create a `.env` file based on `.env.example`.
4. Run `flutter pub get`.
5. Run `flutter run --release`.

## 📦 Build Instructions
To build the final production APK:
```bash
flutter build apk --release --split-per-abi
```

## 📜 Documentation
- [CHANGELOG.md](./CHANGELOG.md): History of all major changes.
- [Project Root README](../README.md): Overview of the entire ecosystem.
