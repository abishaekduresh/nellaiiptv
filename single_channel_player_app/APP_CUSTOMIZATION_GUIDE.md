# App Customization Guide

This guide lists the files and values you need to modify to create a new application instance (e.g., changing the package name, app name, or API endpoint).

## 1. Package Name (Application ID)
Used for the Play Store and unique installation identification.
**Current Value**: `com.nellaiiptv.smstv`

### Locations to Change:
1.  **`android/app/build.gradle.kts`**:
    -   `namespace = "com.changed.here"`
    -   `applicationId = "com.changed.here"`
2.  **`android/app/src/main/kotlin/com/nellaiiptv/smstv/MainActivity.kt`**:
    -   Change `package com.nellaiiptv.smstv` to match your new namespace.
    -   *Note*: You must physically move this file to a new folder structure matching the package name (e.g., `android/app/src/main/kotlin/com/changed/here/MainActivity.kt`).
3.  **`lib/main.dart` / Codebase**:
    -   Search and replace the package string if it's hardcoded anywhere else (rare in Flutter but check imports).

## 2. Application Name (Displayed on Home Screen)
**Current Value**: `SMS TV`

### Locations to Change:
1.  **`android/app/src/main/AndroidManifest.xml`**:
    -   `android:label="Your App Name"`
2.  **`pubspec.yaml`**:
    -   `description`: Update description.

## 3. Launcher Icon & Branding
### Locations to Change:
1.  **`pubspec.yaml`**:
    -   Update `flutter_launcher_icons`: `image_path` config.
    -   Run `flutter pub run flutter_launcher_icons` to generate new icons.
2.  **Assets**:
    -   Replace files in `assets/` (e.g., specific logos or watermarks your logic uses).

## 4. API & Environment Configuration
**Current Value**: Loads from `.env`

### Locations to Change:
1.  **`.env` file**:
    -   Update `API_BASE_URL` or relevant keys.
    -   Update `APP_NAME` if used for internal logic.

## 5. Build Versioning
For Play Store updates.

### Locations to Change:
1.  **`pubspec.yaml`**:
    -   `version: 1.0.0+1` (Format: `versionName+versionCode`)
    -   Or set via command line: `flutter build appbundle --build-name=1.0.1 --build-number=2`
