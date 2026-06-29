# lib/ — third-party libraries

The app loads **hls.js** from a CDN in `index.html`, with a fallback to a local
copy at `lib/hls.min.js`.

For a **store / production build** you should NOT rely on the CDN — bundle hls.js
locally so the app works even if jsdelivr is unreachable:

```bash
# from the nellai_iptv_webos/ folder
curl -L https://cdn.jsdelivr.net/npm/hls.js@1.5.13/dist/hls.min.js -o lib/hls.min.js
```

Then (optionally) remove the CDN `<script>` tag in `index.html` and keep only:

```html
<script src="lib/hls.min.js"></script>
```

Pin the version you tested against — newer majors can change the config/API.
