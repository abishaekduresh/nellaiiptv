## [1.13.0+67] - 2026-05-25

### Added
- **Visual Pre-roll Ads** — YouTube-style full-screen video ad overlay triggered on every channel switch. Fetches active ad from `GET /api/visual-ads/active`; respects `display_frequency` (every N switches) and `max_impressions_per_session` (in-memory per-session cap). Channel audio is muted via `muteForAd()` during the ad and restored on skip/complete.
- **`VideoAdOverlay` widget** (`lib/widgets/video_ad_overlay.dart`) — `VideoPlayerController.networkUrl` with `VideoPlayerOptions(mixWithOthers: true)`. Video fills overlay via `FittedBox(fit: BoxFit.fill)` inside `SizedBox.expand`. Double-tap calls `onFullScreenToggle` callback. Top bar: amber AD badge + monospace "Xs remaining" countdown. Bottom bar: title, description, "Visit Advertiser" click-through (tracked), mute/unmute toggle, skip controls (countdown transitions to active "Skip Ad" button). Impression tracked once via `_impressionTracked` bool guard.
- **`VisualAd` model** (`lib/models/visual_ad.dart`) — typed model with `fromJson` factory covering `uuid`, `adUrl`, `clickUrl`, `thumbnailUrl`, `isSkippable`, `skipAfterSeconds`, `durationSeconds`, `maxImpressionsPerSession`, `displayFrequency`.
- **Visual Ad API methods** in `ApiService` — `getActiveVisualAd()`, `trackVisualAdImpression(uuid)`, `trackVisualAdSkip(uuid)`, `trackVisualAdClick(uuid)`.
- **`muteForAd(bool)` method** on `EmbeddedPlayerState` (`embedded_player.dart`) — sets channel `VideoPlayerController` volume to `0.0` / `1.0`; channel keeps buffering silently during the ad.

### Changed
- **`ClassicScreen`** (`classic_screen.dart`) — Ad overlay placed in a root-level `Stack` wrapping the `Focus` widget so it covers the full screen (both panels). All four channel-switch paths now call `_tryShowVisualAd()`: channel card `onTap`, D-pad `_changeChannel()`, number-dial `_navigateToChannelByNumber()`, STB overlay `onChannelSelected`. `_changeChannel()` guards against switching while an ad is active via `_showVisualAd` check.

## [1.12.4+64] - 2026-05-21

### Changed
- **Player Engine** — Migrated from `media_kit` (MPV) back to Flutter's official `video_player` (ExoPlayer). ExoPlayer is Google's standard Android video pipeline and works on all Android TV hardware — including budget Amlogic/Rockchip SoCs — without requiring EGL surface configuration or MPV property tuning. `TVPlayerController` rewritten around `VideoPlayerController.networkUrl()`.
- **Video Surface** — Replaced `Video` (media_kit widget) with `VideoPlayer` in a `FittedBox`/`SizedBox` tree; `BoxFit.fill` stretches SD content to fill the screen exactly as before.
- **Buffering Overlay** — Replaced `stream.buffering` subscription + `_isBuffering` flag with `ValueListenableBuilder<VideoPlayerValue>` so buffering state is driven directly by the `VideoPlayerController` value notifier; no separate subscription needed.
- **Error Handling** — Replaced `stream.error` subscription with a `_playerListener` `VoidCallback` added via `addListener()`; reads `value.hasError` / `value.errorDescription` from `VideoPlayerValue`.

### Fixed
- **TV Audio** — Removed system-volume→player sync on TV. `volume_controller` reads the wrong audio stream on some TV SoCs (returns 0), which was silently muting the player. On TV the player always runs at volume 100; the TV's own hardware mixer controls the output level.
- **TV Emulator** — Added `DeviceUtils.isEmulator` detection (`!androidInfo.isPhysicalDevice`) so x86 AVD/emulators are correctly identified and any hardware-decoder-specific paths can be skipped.

### Removed
- **media_kit dependency** — `media_kit`, `media_kit_video`, `media_kit_libs_android_video` removed from `pubspec.yaml`; `MediaKit.ensureInitialized()` removed from `main.dart`.
- **Stall timer** — `_stallTimer`, `_playerWidthSub`, `_playerBufferingSub` stream subscriptions removed; ExoPlayer surfaces errors and buffering state natively through `VideoPlayerValue`.
- **`_isBuffering` field** — No longer needed; buffering state read directly from `VideoPlayerController.value.isBuffering` via `ValueListenableBuilder`.

## [1.12.3+63] - 2026-05-18

### Added
- **Contact Us** — New section in Settings with a "Send a Message" tile that opens a full contact form (Name, Email, Subject, Message). Submits to `POST /contact`; toast displays the exact API success or error message.

### Fixed
- **Contact Validation** — Per-field validation errors instead of a single generic message; each field reports its specific requirement on failure.

### Changed
- **Settings Order** — Section order is now Feedback → Contact Us → Storage.

## [1.12.2+62] - 2026-05-18

### Fixed
- **TV Fast Start** — Reduced `cache-secs` to 5 s on TV (was 30 s) and added `cache-pause-initial=no` so the first frame renders as soon as the demuxer has any data; `demuxer-readahead-secs=3` keeps pre-buffer shallow for live IPTV.
- **SD Green Lines** — Added `color: Colors.black` to the player `AnimatedContainer` so the raw OpenGL surface never shows its green default colour behind 4:3 / pillarboxed content.
- **SD Stretching** — Set `video-aspect-override=-1` (square-pixel mode) so MPV stops pre-scaling SD frames before handing them to Flutter; `BoxFit.fill` on the `Video` widget is now the sole authority on aspect ratio.
- **HD / FHD Fallback** — Restored `cache-pause` default (`yes`) so buffer underruns on high-bitrate streams pause and rebuffer (spinner shown) instead of continuing with no data and triggering the stall timer as a false failure.
- **HD / FHD Buffer** — Increased demuxer buffer: TV 64 MB → 96 MB (~50 s at 15 Mbps FHD); Mobile 32 MB → 64 MB (~30 s). `cache-secs` raised to 15 s (TV) / 10 s (Mobile); `demuxer-readahead-secs` raised to 15 s (TV) / 10 s (Mobile) to accommodate large FHD HLS segments.
- **Stall Timer** — Raised TV stall timeout 15 s → 30 s and Mobile 30 s → 45 s; the previous values fired fallback during legitimate HD rebuffering events.

## [1.12.1+61] - 2026-05-18

### Fixed
- **HLS ABR on All Devices** — Removed `hls-bitrate=max` entirely (was TV-only after the previous fix). Android TVs connected via WiFi at a distance suffer the same stalls as cellular mobile when forced to the highest bitrate variant. MPV's default ABR now applies to both TV and mobile — it starts conservatively and scales up only once the connection proves it can sustain higher quality.
- **Mobile Cache Depth** — Reverted mobile `cache-secs` from 40 s back to 20 s; the deeper buffer caused MPV to pre-download aggressively, making playback feel slow to start.

## [1.12.0+60] - 2026-05-18

### Changed
- **Player Engine**: Re-migrated from `video_player` (ExoPlayer) back to **MediaKit** (`media_kit` + `media_kit_video` + `media_kit_libs_android_video`) for full MPV-level control over HLS bitrate selection, demuxer cache, and hardware decoding strategy.

### Added
- **Hardware Decoding (API-gated)**: `hwdec=auto` on Android 8+ (API 26+); `hwdec=mediacodec-copy` on Android 6–7 (API 23–25); software fallback on API < 23. Each property set in its own try-catch so a single unsupported option on an older device cannot abort the entire configuration.
- **Demuxer Cache**: 64 MB on Android TV, 32 MB on Mobile — configured in `TVPlayerController` via `PlayerConfiguration(bufferSize: ...)`.
- **HLS Bitrate Lock**: `hls-bitrate=max` applied *before* `Player.open()` so the initial HLS variant selection always targets the highest available rendition.
- **Network Stability**: `cache-secs=30` (TV) / `20` (mobile), `network-timeout=30` for Indian mobile network resilience.
- **Flutter-Level Quality Boost**: `ColorFiltered` matrix (1.08× RGB, −10 bias) wrapping the `Video` widget adds a crisp contrast lift at the Flutter compositor level — no MPV VF filters needed.
- **High-Quality Texture Sampling**: `FilterQuality.high` on the `Video` widget for sharper GPU texture interpolation.
- **First-Frame Preloader**: `stream.width` listener hides the loading spinner only after the first decoded frame is ready (`width > 0`), preventing a blank flash before video appears.
- **Stall / Fallback Timer**: 15-second `Timer` fires `_handlePlaybackError` if no first frame appears, triggering the fallback MP4 URL for HLS streams that stall silently without emitting a MediaKit error event.

### Fixed
- **Dispose Cleanup**: `_stallTimer`, `_playerWidthSub`, `_hideTimer`, `_infoTimer`, and `_focusHighlightTimer` are now all cancelled in `EmbeddedPlayerState.dispose()` to prevent timer leaks after navigation.
- **VO/VF Safety**: Removed all `vo`, `scale`, `cscale`, and `vf` MPV properties — setting VO before the Video widget's SurfaceTexture is attached causes a native `WinID` assertion crash in `android_common.c`; `lavfi` is not compiled in `media_kit_libs_android_video` and causes a native SIGABRT.

## [1.11.0+59] - 2026-05-01

### Added
- **Feedback Screen**: New `FeedbackScreen` with feedback type selector (General, Bug Report, Feature Request, Channel Issue, Subscription), 1–5 star rating with labels, issue type radio list (for Channel Issue), message textarea, and submit button. Full TV D-Pad support with `FocusNode` on every interactive element.
- **`submitFeedback` API Method**: Added `ApiService.submitFeedback()` posting to `POST /feedback` with `feedback_type`, `rating`, `issue_type`, and `message`. Auth token attached automatically.
- **Profile Screen — Feedback Button**: "Share Feedback" button added between Manage Devices and Logout.
- **Settings Screen — Feedback Section**: Feedback section added at the top of Settings (above Storage) with a "Share Feedback" tile navigating to `FeedbackScreen`.

## [1.10.0+58] - 2026-05-01

### Added
- **Forgot Password Screen**: New `ForgotPasswordScreen` (`screens/auth/forgot_password_screen.dart`) with email input, math captcha security check, loading state, error banner, and success confirmation view.
- **Login → Forgot Password Link**: "Forgot Password?" `TextButton` added to `LoginScreen` below the password field, navigating to `ForgotPasswordScreen`.
- **`forgotPassword` API Method**: Added `ApiService.forgotPassword(String email)` method that POSTs to `/customers/forgot-password` and throws a descriptive `Exception` if `status != true`.

### Fixed
- **Responsive Classic Screen Header**: Refactored the header in `ClassicScreen` using `LayoutBuilder` to eliminate element overlap on small-screen devices. Logo now scales dynamically (28–36px), title font size adapts, the "Group by" button uses abbreviated labels or icon-only on narrow panels, and all action buttons are uniformly 28px with tighter spacing.

### Chore
- **Version Sync**: Bumped `pubspec.yaml` from `1.9.2+51` to `1.10.0+58` to align with actual release history.

## [1.9.2+51] - 2026-04-14

### Added
- **App Version Display**: The Settings screen now shows the running app version (e.g., `Version 1.9.2+51`) pinned at the bottom center in a subtle muted style.

### Fixed
- **Share Code Deep Link**: Fixed `ToastService.show()` call in `ClassicScreen` -- `type` is a named parameter; changed from positional `show(msg, ToastType.error)` to named `show(msg, type: ToastType.error)`.

### Maintenance
- **Version Sync**: Synchronized with Backend v1.38.0 and Website v1.49.0.
## [1.9.1+50] - 2026-04-14

### Added
- **Deep Link Share Handling**: Integrated `app_links` package to listen for incoming deep links at app startup via `SplashScreen`.
- **Share Code Auto-Play**: `ClassicScreen` now accepts an optional `initialShareCode` parameter. When provided via a deep link, it fetches the matching channel by share code and auto-plays it immediately after channels load.
- **Android Deep Link Config**: Added `<intent-filter>` entries to `AndroidManifest.xml` for both HTTPS (`/channels/share/`) and custom URI scheme (`nellaiiptv://channels/share/`).
- **API Helper**: Added `getChannelByShareCode(String shareCode)` method to `ApiService` for clean share-code-to-channel resolution.

### Maintenance
- **Version Sync**: Synchronized with Backend v1.38.0 and Website v1.49.0.
## [1.9.0+49] - 2026-03-27

### Changed
- **Player Migration**: Migrated from MediaKit to standard `video_player` (ExoPlayer) for significantly improved compatibility and stability on low-end Android TV hardware (e.g., Zebronics).

### Fixed
- **TV Playback**: Resolved "black screen" and "no playback" issues on certain Amlogic/Mediatek chipsets by leveraging Google's native ExoPlayer implementation.
- **Null Safety**: Hardened the player UI with robust null-checks and stable state management during stream initialization.

## [1.8.27+44] - 2026-02-28

### Added
- **Storage Management**: Added a new "Clear Image Cache" button inside Settings to allow users to manually wipe downloaded covers and icons to free space on memory-constrained TV boxes.
- **Visual Feedback**: Implemented toast notifications showing active clearing status and success/error resolutions.

## [1.8.26+43] - 2026-02-28

### Added
- **Channel Search Enhancement**: Users can now search for channels by typing the channel number. 
- **Dynamic Search Sorting**: For an intuitive search experience, results are actively sorted in ascending channel number order while typing, reverting to default sorting when cleared.

## [1.8.25+42] - 2026-02-28

### Added
- **Settings Screen**: Implemented a new settings UI (accessible via the Gear icon in Classic layout) allowing users to globally toggle channel lists between Random and Channel Number constraints.
- **Device Persistence**: Settings preferences are cleanly stored in `SharedPreferences`.
- **TV D-Pad Support**: The Settings screen fully maps focus nodes and selection inputs to physical remote D-Pads and forces Landscape orientation specifically on TV hardware.

### Fixed
- **TV Playback Stability**: Low-end SoCs (Mediatek/Amlogic) crashed rapidly via out-of-memory demuxer errors when mashing the channel change keys. Implemented a robust `load()` pipeline that guarantees synchronous stream unloading before spinning up a new media container.

## [1.8.24+41] - 2026-02-21

### Added
- **Scrolling Ads Marquee**: Implemented a dynamic scrolling text ticker in the Classic Screen to display server-controlled advertisements.
- **Marquee Settings**: Integrated support for custom `scroll_speed` and `repeat_count` configured via the Admin Panel.

### Maintenance
- **Version Sync**: Synchronized version with Website and Backend updates.

## [1.8.23+40] - 2026-02-21
- **Comment Count Badge**: Added visual notification badge on the channel details comments icon showing the total number of comments for a channel (capped at 99+).

### Improved
- **HD TV Playback**: Added aggressive optimizations to MediaKit/FFmpeg properties (`vd-lavc-skiploopfilter=all`, `vd-lavc-skipidct=all`, `framedrop=vo`) to ensure completely smooth Full HD playback on low-end TV SOCs tracking HD streams.

### Fixed
- **TV Player Highlight**: Fixed issue where the cyan player focus border wouldn't trigger correctly when navigating the UI with a D-Pad.

## [1.8.22+39] - 2026-02-16
- **Maintenance**: Version synchronized with latest Backend/Website updates.

## [1.8.21+38] - 2026-02-16
- **Maintenance**: Version synchronized with latest Backend/Website updates.

## [1.8.20+37] - 2026-02-14
- **Focus Auto-Hide**: Integrated a 3-second auto-hide timer for player focus highlights to maintain a clean viewing experience.
- **TV Focus Highlights**: Implemented visual cyan highlights and inner glow for player selection and internal controls.
- **Hardware-Aware Playback**: Added intelligent device profiling to tune FFmpeg/MediaKit properties for low-end Android TV hardware.

### Improved
- **Interaction Feedback**: Interaction via D-pad, touch, or mouse resets the focus highlight timer for clear feedback during use.
- **Playback Stability**: Fine-tuned buffer management and network probesize to prevent stuttering on resource-constrained TV devices.

### Fixed
- **Focus Reliability**: Resolved critical "child != this" errors in EmbeddedPlayer by consolidating gesture overlays.
- **Syntax & State**: Fixed compilation errors and state variable references in the player components.

## [1.8.19+36] - 2026-02-13

## [1.8.19+35] - 2026-02-13

### Added
- **TV Playback Optimization**: Implemented hardware-aware device profiling (RAM check) and tailored MediaKit/FFmpeg properties for low-end hardware.
- **Branding Update**: Integrated dynamic app name loading from environment variables and updated logo branding across all main screens.

### Changed
- **Performance**: Optimized buffer management and probesize for faster IPTV stream connection and reduced stuttering on resource-constrained TVs.
- **UX**: Conditionally reduced animation complexity on low-performance devices to save CPU cycles and improve responsiveness.

### Fixed
- **Compile Stability**: Fixed a critical compile-time error in device memory detection logic by safely accessing RAM info via the data map.

## [1.8.18+34] - 2026-02-11

### Fixed
- **Player Focus**: Resolved critical issue where the first channel card was incorrectly selected instead of the active channel when exiting fullscreen or refreshing.
- **Selection State**: Ensured visual selection state accurately reflects the currently playing channel.

## [1.8.17+33] - 2026-02-10

### Maintenance
- **Version Sync**: Synchronized version with Website and Backend updates for channel export filtering features.

## [1.8.16+32] - 2026-02-09

### Added
- **Smart Retry Logic**: Implemented intelligent stream recovery that retries connection 3 times before switching to Fallback Video, reducing false positives.
- **TV Clean UI**: Automatically hides Top Right buttons (Cast, PiP, Mute) on TV devices for a cleaner viewing experience.

### Changed
- **Mobile Fullscreen UX**: Single tap in fullscreen now opens the STB Navigation Overlay immediately instead of toggling player controls.
- **Controls Usage**: Top Right buttons (Mute, PiP, Menu) now remain visible and interactive when the STB Overlay is active on mobile devices.

### Fixed
- **Compilation**: Resolved `DeviceUtils` import error and duplicate variable declarations.

## [1.8.15+31] - 2026-02-09

### Added
- **STB Info Overlay**: Implemented a "Set-Top Box" style channel information banner (Logo, Number, Name, Category) that appears on channel load in fullscreen.
- **Auto-Hide Logic**: Info overlay automatically fades out after 3 seconds; restricted to fullscreen mode only.

### Fixed
- **TV Focus**: Resolved issue where "OK" button triggered system overlays; ensured focus remains on player controls.
- **Navigation**: Restored focus to category menu after interacting with the player.

## [1.8.14+30] - 2026-02-07

### Added
- **Device Utilities**: Implemented centralized `DeviceUtils` initialization in main.dart for improved device compatibility checks.
- **Splash Screen**: Enhanced splash screen with device initialization logic for better startup reliability.

### Changed
- **Initialization Flow**: Moved device-specific initialization to startup sequence for consistent behavior across all Android devices.

## [1.8.13+29] - 2026-02-06

### Fixed
- **Build Repair**: Resolved `Member not found: 'center'` compiler error by removing deprecated `LogicalKeyboardKey.center` usage.
- **Play Store Rejection**: Solved "Missing DPad functionality" by implementing explicit keyboard activation on "Select" key press for Login and Register screens.

### Added
- **D-Pad Focus Enhancements**: Enhanced focus traversal for:
  - **Channel Details Modal**: Comments input now explicitly triggers keyboard; comments list is scrollable via D-Pad.
  - **Star Rating Dialog**: Stars are now fully focusable and interactive via D-Pad (Left/Right navigation + Select to submit).
  - **Profile Screen**: Validated focus traversal app-wide.



### Added
- **D-Pad Navigation**: Implemented full D-Pad support for:
  - **Channel Details Modal**: Focusable Info button (converted to IconButton) and scrollable comments list interactions.
  - **Manage Devices Screen**: Focusable session cards allowing easy selection and removal via remote.
  - **Profile Screen**: Added autofocus to "Manage Devices" button and improved focus traversal structure.

### Fixed
- **Comment Posting**: Resolved false "Failed to post comment" error by updating API service to accept HTTP 201 (Created) status codes.
- **Timezone Display**: Fixed timestamp discrepancies (~5.5h offset) in comments by correctly parsing server UTC time to local device time.
- **Backend Timezone**: Enforced `Asia/Kolkata` (IST) in backend PHP and Database configurations.

## [1.8.11+27] - 2026-02-06

### Added
- **User Profile Section**: Implemented comprehensive profile screen accessible from ClassicScreen header when logged in.
  - User information card displaying name, email, and phone with gradient avatar
  - Active subscription card showing plan name, expiry date, and device usage
  - Manage Devices button navigating to device management screen
  - Logout functionality with confirmation dialog
  - Full D-pad navigation support for TV remote control
  - OTT-style UI with premium gradients, shadows, and modern design
- **Profile API Integration**: Added `getUserProfile()` method to ApiService for fetching user data from `/customers/profile` endpoint.
- **Session Management**: Implemented logout API call to remove sessions from database on logout.
- **User Data Persistence**: Login now stores user details (uuid, name, email, phone) in SharedPreferences for offline profile display.

### Changed
- **Screen Orientations**: Refined orientation management across all screens:
  - ClassicScreen: Always landscape/horizontal
  - ProfileScreen: Portrait with landscape restoration when returning to ClassicScreen
  - ManageDevicesScreen: Portrait for better mobile usability
  - LoginScreen/RegisterScreen: Portrait (unchanged)
- **Profile Button**: Replaced logout button in ClassicScreen header with profile button (person icon) that navigates to ProfileScreen.
- **Video Playback Control**: ClassicScreen now stops video playback completely when navigating to ProfileScreen, with automatic resume on return.

### Fixed
- **Type Conversion Errors**: Fixed "int is not a subtype of String" errors by adding `.toString()` conversions for:
  - User data fields (name, email, phone, uuid) during login
  - Profile display fields (name, email, phone)
  - Subscription data fields (plan name, expiry date, device limit)
- **Subscription Display**: Fixed profile screen not showing subscription data by:
  - Changing from `subscription` key to `plan` key to match backend response
  - Updated field names: `plan['name']` instead of `subscription['plan_name']`
  - Checking both `expiry_date` and `expires_at` for expiration date
- **Logout Orientation**: Fixed LoginScreen appearing in landscape after logout by adding `_isLoggingOut` flag to prevent dispose() from overriding portrait orientation.
- **Profile Navigation**: Fixed ClassicScreen showing in portrait when returning from ProfileScreen by restoring landscape in ProfileScreen's dispose() method (only when not logging out).

### Technical Details
- Profile screen uses `ApiService().getUserProfile()` to fetch fresh data on load
- Logout calls `ApiService().logout()` to remove session from database before clearing local token
- All dynamic values from backend are converted to strings using `.toString()` to handle both int and string types
- Orientation changes use `SystemChrome.setPreferredOrientations()` in initState() and dispose() methods
- Video playback control uses `_stopPlayerCompletely()` and `_resumePlayback()` methods in ClassicScreen

## [1.8.10+26] - 2026-02-06

### Added
- **Security Controls**: Implemented configurable screenshot blocking and USB debugging detection via environment variables (`BLOCK_SCREENSHOTS`, `BLOCK_USB_DEBUG`).
- **Native Security**: Added MethodChannel communication between Flutter and Kotlin for platform-specific security enforcement.
- **Security Service**: Created dedicated `SecurityService` class to manage security checks and native platform integration.
- **USB Debug Blocking**: Displays blocking dialog and exits app when USB debugging is detected (if enabled).
- **Screenshot Protection**: Conditionally applies Android `FLAG_SECURE` based on environment configuration.
- **Banner Ads**: Added banner ad support to Register screen with random ad fetching and clickable URL launching.

### Changed
- **Register Screen Layout**: Restructured using `LayoutBuilder`, `ConstrainedBox`, and `IntrinsicHeight` to match Login screen layout.
- **Ad Positioning**: Banner ads now stick to bottom of screen using `Spacer()` widget for consistent placement.

### Fixed
- **D-pad Navigation**: Improved focus management in Register screen with proper button and input field focus support.

## [1.8.9+25] - 2026-02-06

### Added
- **Focus Control**: Implemented persistent persistent `FocusNode` management in `ClassicScreen` headers (Search, Refresh, Group, Auth) to prevent focus loss during rebuilds.
- **TV Navigation**: Replaced `GestureDetector` with focusable `TextButton` and `InkWell` in Login/Register screens for full D-pad support.

### Changed
- **Rating Logic**: Removed client-side optimistic calculation; now relies entirely on server-provided `average_rating` and `ratings_count`.
- **UI Theme**: Unified "Rate Channel" and "Logout" dialogs with consistent dark theme, rounded corners, and Slate-900 background (`0xFF1E293B`).

### Fixed
- **API Integration**: Updated `ChannelProvider` to correctly parse `total_ratings` and `average_rating` from backend responses.

## [1.8.8+24] - 2026-02-03

### Fixed
- **Device Compatibility**: Resolved "Unsupported Device" warnings on Play Store by explicitly marking hardware features (Mic, Bluetooth, Telephony) as optional.
- **Legacy Support**: Restored support for Android 5.0+ devices by pinning `minSdkVersion` to 21.

## [1.8.7+23] - 2026-02-03

### Added
- **TV UX**: Redesigned "Confirm Exit" dialog with premium dark theme and D-Pad optimized buttons.

### Fixed
- **TV Navigation**: Resolved D-Pad navigation issues in Classic Mode; Arrow keys now work naturally in the channel grid.
- **Focus Trap**: Fixed issue where focus got stuck in the channel list; Left arrow on the first column now correctly moves focus to the Player.
- **Syntax Error**: Fixed a critical syntax error in `classic_screen.dart` causing build failures.

## [1.8.6+22] - 2026-02-01

### Fixed
- **Critical Syntax Fix**: Resolved duplicate class definitions and missing braces in `classic_screen.dart` that caused build failures.
- **Compilation Error**: Removed invalid usage of `LogicalKeyboardKey.center` to restore build stability.
- **Grid Navigation**: Verified and restored `Focus` handling for Channel Cards and Category Chips.

## [1.8.5+21] - 2026-02-01

### Added
- **Channel Report Feature**: Users can now report issues with channels (stream not working, buffering, audio issues, etc.) directly from the player controls via a new Flag button.
- **TV-Optimized Report Dialog**: Fully D-pad navigable issue reporting interface with predefined issue types and custom description support.
- **Fullscreen Channel Zapping**: D-pad Up/Down keys now switch to previous/next channel while in fullscreen mode for seamless browsing.
- **Fullscreen Overlay Controls**: D-pad Left/Right keys toggle the channel list overlay in fullscreen for quick navigation.

### Changed
- **Player Retry Countdown**: Reduced auto-retry countdown from 20 seconds to 10 seconds for faster error recovery.
- **Player Focus Behavior**: Disabled autofocus on embedded player to prevent focus stealing from channel list during browsing.

### Fixed
- **D-pad Key Support**: Removed invalid `LogicalKeyboardKey` references (center, gameButtonA, numpad5) that caused compilation errors.
- **Focus Navigation**: Improved focus traversal between player and channel grid using `FocusTraversalGroup` boundaries.

## [1.8.3+19] - 2026-01-31

### Fixed
- **TV Search**: Search bar now explicitly activates the on-screen keyboard when the "Select" (DPad Center) button is pressed, solving text input issues on Android TV.
- **Fullscreen Exit**: Implemented `Escape` and `Back` key listeners in the embedded player to strictly handle fullscreen exit, preventing app closure or unresponsive back actions.
- **Ad Focus**: Replaced the standard Ad Banner with a `FocusableAdBanner` widget features a visual cyan selection border for clear DPad navigation.
- **Focus Stability**: Removed aggressive `autofocus` from grid and list items to prevent "focus stealing" bugs during UI updates.

## [1.8.2+18] - 2026-01-30

### Added
- **Android TV Asset Policy**: Generated and installed high-resolution 320x180 "xhdpi" TV banner and 512x512 full-bleed square icon to resolve Google Play Store rejections.
- **Easy Navigation Controls**: Added dedicated "Channel List" (Menu) and "Mute/Unmute" buttons to the player's control bar for faster access on STB remotes.
- **Single-Click Fullscreen**: Single-tapping the player in embedded mode now instantly toggles fullscreen for better mobile/TV UX.
- **Smart Focus Feedback**: Player controls now automatically reveal themselves when the player gains focus via D-Pad or touch.

### Fixed
- **Mute Synchronization**: Integrated `AudioManager` with hardware volume listener to ensure the mute icon stays in sync with physical remote/phone buttons.
- **FFI Stability**: Resolved critical `SIGABRT` crashes during hot restarts by implementing strictly synchronous `_player.dispose()` and disabling high-frequency native log streams.
- **TV Remote Navigation**: Expanded "Select" key support to capture `LogicalKeyboardKey.select` and `numpadEnter`, ensuring compatibility across diverse STB chipsets.

## [1.8.1+17] - 2026-01-30

### Added
- **Video Stretching**: Standardized `BoxFit.fill` across all modes (classic grid view and fullscreen) to ensure the video always occupies the full player viewport.
- **FFI Safety Guards**: Implemented `_currentLoadId` tracking to prevent overlapping player initialization calls.

### Fixed
- **FFI Callback Crash**: Resolved a critical `SIGABRT` crash (Callback invoked after deletion) by removing redundant `player.stop()` calls during initialization.
- **Asynchronous Sync**: Standardized `await` logic in `_loadChannel` and `_initVideoPlayer` to eliminate race conditions.
- **Build stability**: Safely re-introduced MediaKit property optimizations using dynamic dispatch to fix compilation errors.

## [1.8.0+16] - 2026-01-30

### Added
- **TV Optimization**: Hybrid Grid rendering using `GridView.builder` for liquid-smooth directional navigation on STB remotes.
- **MediaKit Tweaks**: Custom property injection (`cache-pause`, `demuxer-max-bytes`) for optimized playback stability on Android TV.

### Changed
- **Ad Placement**: Grid-based ads removed to prioritize navigation speed; bottom banner ads retained for clean UX.

### Fixed
- **Loading Latency**: Removed redundant pre-playback Dio checks, reducing channel switch time by ~2 seconds.
- **Black Screen**: Standardized `Player.stop()` and state reset timing to prevent visual hangs during channel transitions.

## [1.7.1+15] - 2026-01-30

### Added
- **Full-Screen TV Toggle**: Dedicated focusable button in playback controls for easy entry/exit of full-screen mode on TV remotes.
- **System UI Management**: Improved logic to hide/restore status and navigation bars using `immersiveSticky` mode for a cleaner TV experience.

### Fixed
- **Volume Persistence**: Resolved issue where system volume would reset to 100% when switching channels; volume now persists throughout the session.
- **Mute Persistence**: Mute state is now handled globally, ensuring a channel remains muted even after switching to another one.
- **UI Interaction**: Refined tap handlers in Classic Mode to prevent overlapping menu layers on TV screens.

## [1.7.0+14] - 2026-01-30

### Added
- **Number Key Navigation**: Direct channel switching using the remote control numeric keypad (0-9) with multi-digit support (1.5s buffer).
- **Visual Input Overlay**: Large animated indicator in the top-right corner to show typed channel numbers.
- **Backend Health Check**: Mandatory system availability check on startup with retry logic and full-screen blocking error UI.
- **UI Animations**: Integrated `flutter_animate` for smoother transitions and polished error screen feedback.

### Changed
- **UI Polish**: Updated channel card thumbnail loader to `CupertinoActivityIndicator` for a premium tick-spinner look.
- **UI Polish**: Removed skeleton shimmers from channel cards for a cleaner loading experience.
- **Branding**: Classic Screen header now dynamically loads the backend logo with a local asset fallback.

### Fixed
- **Sorting**: Channels, Categories, and Languages now respect the `order_number` priority set in the backend.

## [1.6.2+13] - 2026-01-29

### Added
- **TV Navigation**: Enhanced D-Pad support for STB Overlay ("Enter" key capture) and Embedded Player controls (PiP/Retry buttons).
- **UI**: Added View Count and Star Rating display to the Classic Screen channel details banner.
- **Layout**: Dynamic Ad Banner layout that maximizes player height when no ads are loaded.

### Changed
- **UX**: "Refresh" button now triggers a full content sync (Settings + Channels + Ads) instead of just channels.

## [1.6.2+12] - 2026-01-29

### Added
- **Force Update**: Implemented strict update enforcement. The app now exits if a mandatory Play Store update is declined by the user.
- **TV Banner**: Added missing `tv_banner` resource to fix Android TV build failures.

## [1.6.1+11] - 2026-01-28

### Added
- **Maintenance**: Version synchronization with Frontend v1.38.0 and Backend v1.27.0.
- **Improved**: System stability and API response handling in alignment with recent backend logging improvements.

## [1.6.1+10] - 2026-01-27

### Added
- **API Optimization**: Synchronized with Backend v1.22.0 for improved session and plan reliability.

## [1.6.0+9] - 2026-01-27

### Added
- **Global Sync**: Coordinated release with Frontend v1.32.0 and Backend v1.21.0.

## [1.5.3+8] - 2026-01-26

### Added
- **TV Focus**: Upgraded Classic Mode Banner Ads with `InkWell` for full D-Pad support and visual focus states (Cyan highlight).
- **UX**: Added `autofocus` to the "Retry Connection" button, ensuring immediate remote control accessibility during playback errors.

## [1.5.2+7] - 2026-01-25

### Added
- **MP4 Fallback**: Replaced HLS fallback with MP4 (`fallback_404_mp4_url`) for better compatibility.
- **Instant Fallback**: Logic optimization to hide loading spinner immediately when switching to fallback video.
- **Clickable Ads**: Left panel banner ads now redirect to external URLs (`redirect_url`) via system browser.
- **Countdown**: "Retry" button now features an auto-countdown (20s) before automatic reload.

### Fixed
- **In-App Update**: Disabled update checks in Debug mode to prevent `Install Error(-10)`.
- **UI Styling**: Updated Retry button color to Cyan (`0xFF06B6D4`) to match app theme.
- **Layout**: Balanced Classic Screen layout to 50/50 split (Player/List).
- **UX**: Hidden viewer count overlay when playing fallback video to reduce clutter.

## [1.5.1+6] - 2026-01-25

### Fixed
- **Device Support**: Restored compatibility for 7+ device models (Ethernet-only TV boxes) by making WiFi/Location hardware requirements optional.

## [1.5.0+5] - 2026-01-25

### Added
- **Fallback Player**: Robust HLS fallback mechanism with race-condition handling and "Retry Connection" UI for seamless playback recovery.
- **TV Store Compliance**: Added `LEANBACK_LAUNCHER` intent, TV banner assets, and touch-screen indepedence flags.
- **Connectivity Monitoring**: Real-time internet status alerts (Toast with animation) and auto-recovery/retry logic.
- **UI Refinements**: Responsive "Retry" button with pulse animation and adaptive sizing for embedded vs. full-screen modes.

## [1.4.3+4] - 2026-01-25

### Added
- **State Persistence**: STB Navigation now remembers the last selected category and restores it upon reopening.
- **Real-Time Sync**: Player now instantly synchronizes fresh channel data (ratings/view counts) back to the Classic Screen "Channel Info" banner.

### Changed
- **Minimal UI**: Redesigned the player's view count and rating overlay to be smaller and less intrusive (12px icons).
- **View Logic**: Backend view count formatting updated to strict integer math for consistent "+K" suffixes.

### Fixed
- **Interaction Blockers**: Hoisted `GestureOverlay` to the top level, fixing issues where loading/error screens blocked STB navigation gestures.
- **Stability**: Fixed syntax errors in `EmbeddedPlayer` related to premium content logic.

## [1.4.2+3] - 2026-01-25

### Added
- **Full-Screen STB Overlay**: Premium set-top box style navigation drawer (Left-side aligned) for browsing categories and channels seamlessly.
- **TV Priority Navigation**: "All Channels" is now the default first category with automatic focus for D-Pad/Remote controls.

### Changed
- **Persistent Player Stats**: Viewer counts and ratings are now visible at all times in the player interface, regardless of control state.

### Fixed
- **Overlay Stability**: Fixed a bug where interacting with the category list would prematurely hide the navigation overlay.
- **Touch Interaction**: Improved touch target responsiveness for mobile users within the STB overlay.
- **Build**: Resolved native Android build failures and synchronized versioning.

## [1.4.1+2] - 2026-01-24

### Added
- **Android 15 Compatibility**: Implemented `EdgeToEdge` support (Target SDK 35) and migrated to `FlutterFragmentActivity` for robust modern system integration.
- **Near-Instant Switching**: Parallelized API fetching and player initialization for zero-delay channel loading.
- **Session-Based Caching**: Integrated `CachedNetworkImage` for thumbnails & ads with automatic per-session cache clearing on app startup.
- **Enhanced Ad UX**: Dual-level skeleton loading logic (API level + Image byte download state).
- **TV Support**: Added `LEANBACK_LAUNCHER` intent and improved D-pad navigation.
- **Security**: Enabled `FLAG_SECURE` for screenshot/recording prevention.
- **Icons**: Regenerated high-resolution app launcher icons.

### Changed
- **Build**: Migrated Android signing configuration to `.env` variables for better security (removed `key.properties`).
- **Splash Screen**: Layout is now scrollable to prevent overflow on landscape devices.
- **Volume Control**: Removed software volume overrides. Player now relies strictly on system/hardware volume.
- **Icons**: Updated app launcher icons.
- **Player**: Watermark is now responsive to screen size.

### Fixed
- **Volume**: Fixed volume resetting to 100% on channel change.
- **Classic Screen**: Fixed syntax errors in grid builder and `Consumer` nesting.
- **Crash**: Fixed "Bottom Overflowed" on splash screen.
- **Build**: Fixed compilation errors on Android 15 by upgrading native activity base class and resolving Kotlin version conflicts.
- **Deployment**: Incremented version code to 2 to resolve Play Store upload conflicts.




