# Nellai IPTV — LG webOS TV App

> **Version:** 1.0.0 · See [CHANGELOG.md](CHANGELOG.md) for release history.

A standalone **LG webOS** Smart-TV app for Nellai IPTV. It is a self-contained web
app (HTML/CSS/vanilla JS) that talks directly to the Nellai IPTV backend — it does
**not** depend on the Next.js website or the Flutter app.

## Features

- **Splash → Channel browser → Player** flow, built for 1920×1080 10-foot UI.
- **D-pad spatial navigation** (geometric nearest-neighbour) across the sidebar and
  channel grid — no library needed.
- **Categories sidebar**: All, Favourites, and every backend category that has channels.
- **HLS playback** via hls.js (with native-HLS fallback) mirroring the website's tuning.
- **Favourites** stored locally (toggle with the **Yellow** remote button).
- **Direct channel-number entry** (type digits on the remote to tune).
- **Premium / restricted** channels show a message instead of failing silently.
- **Remote keys**: arrows + OK, **Back** (461), **▲ ▼ / Ch+ Ch-** to change channel,
  **Yellow** favourite, Play/Pause.

## Project layout

```
nellai_iptv_webos/
├── appinfo.json        # webOS app manifest
├── index.html          # entry point (loads scripts in order)
├── icon.png            # 80×80 launcher icon
├── largeIcon.png       # 130×130 icon
├── splash.png          # 1920×1080 splash background
├── css/style.css       # TV UI
├── js/
│   ├── config.js       # API base URL / key / platform  ← EDIT THIS
│   ├── keys.js         # webOS remote key codes
│   ├── store.js        # favourites + device id (localStorage)
│   ├── api.js          # backend REST client (XHR)
│   ├── focus.js        # D-pad spatial navigation engine
│   ├── player.js       # hls.js playback wrapper
│   ├── ui.js           # DOM rendering
│   └── app.js          # controller / key router
└── lib/                # vendor hls.min.js here for production (see lib/README.md)
```

## 1. Configure

Edit **`js/config.js`**:

```js
API_BASE: 'https://api.nellaiiptv.com/public/api',  // your backend /api root
API_KEY:  '',                                       // X-API-KEY if your backend requires one
PLATFORM: 'tv',                                      // already an allowed platform
```

> The backend already allows the `tv` platform and exposes the public channel
> endpoints used here (`/channels?limit=-1`, `/channels/{uuid}`, `/categories`,
> `/settings/public`). Make sure **CORS** allows the app origin
> (`file://`, the emulator, and `*.lge` device origin) — the existing
> `CorsMiddleware` typically returns `*`, which is fine.

## 2. Run in a browser (fast dev loop)

Open `index.html` in Chrome and use the keyboard: **arrows + Enter**, and map Back to
your taste (in Chrome, keycode 461 isn't sent — use it on a real TV/emulator). This is
enough to validate layout, data loading and playback.

## 3. webOS SDK setup

Install the **webOS TV SDK / CLI** (or the *webOS Studio* VS Code extension):
https://webostv.developer.lge.com/develop/tools/cli-installation

Verify:
```bash
ares --version
```

## 4. Package

From this folder:
```bash
ares-package .
# → produces com.nellaiiptv.tv_1.0.0_all.ipk
```

## 5. Run on the emulator
```bash
ares-launch --device emulator com.nellaiiptv.tv
# or install the .ipk first:
ares-install --device emulator com.nellaiiptv.tv_1.0.0_all.ipk
```

## 6. Deploy to a real LG TV

1. On the TV, install the **Developer Mode** app from the LG Content Store, log in with
   your LG developer account, enable Dev Mode, and note the **passphrase / key server port**.
2. Register the device:
   ```bash
   ares-setup-device          # add the TV's IP + dev key (interactive)
   ares-novacom --device <name> --getkey
   ```
3. Install & launch:
   ```bash
   ares-install --device <name> com.nellaiiptv.tv_1.0.0_all.ipk
   ares-launch  --device <name> com.nellaiiptv.tv
   ```
4. Inspect/debug:
   ```bash
   ares-inspect --device <name> --app com.nellaiiptv.tv --open
   ```

## 7. Store submission

Submit the `.ipk` via the **LG Seller Lounge** (https://seller.lgappstv.com). For
production: vendor hls.js locally (see `lib/README.md`), replace the placeholder
icons/splash with branded artwork, and bump `version` in `appinfo.json`.

## Remote control map

| Button | Browser / Grid | Player |
|--------|----------------|--------|
| ◀ ▲ ▼ ▶ | Move focus | ▲▼ change channel |
| OK | Open channel / select category | Retry (on error) / channel list |
| Back (461) | Grid → sidebar, then exit app | Return to channel list |
| Yellow | Toggle favourite | Toggle favourite |
| 0–9 | Tune by channel number | Tune by channel number |
| Play/Pause | — | Pause/resume |

## Notes / next steps

- **Login/subscriptions**: this build uses the public/open-access channel endpoints.
  To gate premium channels per-user, add a login screen calling `POST /customers/login`
  and send the returned JWT as `Authorization: Bearer …` in `js/api.js`.
- **DRM**: not used (plain HLS). LG supports PlayReady if you ever need it.
- **Old webOS (3.x)**: code avoids `?.`/`??` and ES modules for compatibility; if you must
  support very old models, also vendor a `fetch`/`Promise` polyfill (we already use XHR).
