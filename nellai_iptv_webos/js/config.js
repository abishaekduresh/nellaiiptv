/* Global namespace + configuration.
 * Edit API_BASE / API_KEY to point at your backend. */
window.NIPTV = window.NIPTV || {};

NIPTV.config = {
  // Backend API root (no trailing slash). Matches the Flutter app's prod value.
  API_BASE: 'https://api.nellaiiptv.com/public/api',

  // X-API-KEY sent on every request — pre-filled with the same public client key
  // your website/app already ship (backend API_SECRET / NEXT_PUBLIC_API_SECRET).
  // Replace with your production key before publishing to the LG store.
  API_KEY: 'xkey_for_local_dev_only_12345',

  // Sent as X-Client-Platform. 'tv' is an allowed platform on the backend and
  // lets plans/restrictions target TV correctly.
  PLATFORM: 'tv',

  APP_TITLE: 'Nellai IPTV',
  APP_VERSION: '1.0.0',

  SPLASH_MS: 1500,        // minimum splash duration
  OVERLAY_HIDE_MS: 4500,  // player info overlay auto-hide
  NUMBER_ENTRY_MS: 2500,  // how long the typed channel number stays before tuning

  STORAGE: {
    FAV:    'niptv_tv_favorites',
    LAST:   'niptv_tv_last_channel',
    DEVICE: 'niptv_tv_device_id'
  }
};
