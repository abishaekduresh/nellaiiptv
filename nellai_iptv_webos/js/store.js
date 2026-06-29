/* Local persistence: favourites, last-watched channel, and a stable device id.
 * All wrapped in try/catch because storage can be unavailable / full on some TVs. */
NIPTV.Store = (function () {
  var S = NIPTV.config.STORAGE;

  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }

  function uuid() {
    // RFC4122-ish v4; crypto may be missing on old webOS so fall back to Math.random.
    if (window.crypto && crypto.randomUUID) { try { return crypto.randomUUID(); } catch (e) {} }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  var favSet = read(S.FAV, []);          // array of channel uuids
  var deviceId = read(S.DEVICE, null);
  if (!deviceId) { deviceId = uuid(); write(S.DEVICE, deviceId); }

  return {
    deviceId: function () { return deviceId; },

    isFavourite: function (uuid) { return favSet.indexOf(uuid) !== -1; },

    toggleFavourite: function (uuid) {
      var i = favSet.indexOf(uuid);
      if (i === -1) { favSet.push(uuid); } else { favSet.splice(i, 1); }
      write(S.FAV, favSet);
      return i === -1; // true => now a favourite
    },

    favourites: function () { return favSet.slice(); },

    setLastChannel: function (uuid) { write(S.LAST, uuid); },
    getLastChannel: function () { return read(S.LAST, null); }
  };
})();
