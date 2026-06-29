# Changelog — Nellai IPTV (LG webOS TV App)

All notable changes to the webOS TV app are documented here.
This project follows the `appinfo.json` version (`MAJOR.MINOR.PATCH`).

## [1.0.0] - 2026-06-30

### Added — Initial release
- **Standalone LG webOS web app** (`appinfo.json` id `com.nellaiiptv.tv`, type `web`,
  1920×1080) — independent of the Flutter app and Next.js website; talks directly to
  the Nellai IPTV backend.
- **App flow**: animated Splash → Channel browser (categories sidebar + channel grid)
  → fullscreen Player.
- **D-pad spatial navigation** (`js/focus.js`) — geometric nearest-neighbour focus that
  moves seamlessly between the sidebar and the channel grid (no external library).
- **Categories sidebar** — `All Channels`, `Favourites`, and every backend category that
  has channels, each with a live count (`/categories`).
- **Channel grid** (`/channels?limit=-1`) — logo/number/name cards with `PREMIUM` and
  favourite (★) badges; image fallback to the app icon on load error.
- **HLS playback** (`js/player.js`) — hls.js with TV-tuned buffering config and a
  native-HLS fallback; mirrors the website's strategy. Handles `PAID_RESTRICTED` and
  `RESTRICTED:` streams with an on-screen message instead of failing silently.
- **Player controls** — `▲ ▼` / `Ch+ Ch-` change channel (wraps), `OK` returns to the
  channel list (or retries on error), `Play/Pause` toggles playback, auto-hiding info
  overlay with channel number/name/category.
- **Favourites** — toggled with the **Yellow** colour button; persisted in
  `localStorage` (`js/store.js`); Favourites counter and list update live.
- **Direct channel-number entry** — type digits on the remote to tune by
  `channel_number` (with on-screen entry overlay; works from browse and player).
- **Remote handling** (`js/keys.js`) — webOS key codes incl. **Back (461)**: from the
  grid it returns focus to the sidebar, from the sidebar it exits the app.
- **Backend client** (`js/api.js`) — XHR-based (works on older webOS WebKit), sends
  `X-API-KEY`, `X-Client-Platform: tv`, and a persistent `X-Device-Id`; normalises both
  the flat-array and Laravel-paginator response shapes.
- **TV UI** (`css/style.css`) — 10-foot layout, overscan-safe spacing, high-visibility
  focus rings, brand theme.
- **Generated placeholder artwork** — `icon.png` (80×80), `largeIcon.png` (130×130),
  `splash.png` (1920×1080).
- **Docs** — `README.md` (configure/run/package/deploy to LG TV + Seller Lounge),
  `lib/README.md` (vendoring hls.js for production).

### Notes
- Uses the public/open-access channel endpoints; premium channels show a subscription
  message. Per-user premium gating (login + JWT) is a planned follow-up.
- `js/config.js` is pre-filled with the same public client key the website/app ship;
  replace it with the production key before publishing.
