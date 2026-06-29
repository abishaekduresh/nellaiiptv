/* Thin REST client for the Nellai IPTV backend.
 * Uses XMLHttpRequest (works on every webOS WebKit, unlike fetch on older models).
 * Backend wraps every response as { status: bool, message: string, data: any }. */
NIPTV.Api = (function () {
  var cfg = NIPTV.config;

  function request(method, path, params, body) {
    return new Promise(function (resolve, reject) {
      var url = cfg.API_BASE + path;
      if (params) {
        var qs = [];
        for (var k in params) {
          if (params.hasOwnProperty(k) && params[k] !== undefined && params[k] !== null) {
            qs.push(encodeURIComponent(k) + '=' + encodeURIComponent(params[k]));
          }
        }
        if (qs.length) { url += (url.indexOf('?') === -1 ? '?' : '&') + qs.join('&'); }
      }

      var xhr = new XMLHttpRequest();
      xhr.open(method, url, true);
      xhr.timeout = 15000;
      xhr.setRequestHeader('Accept', 'application/json');
      if (body) { xhr.setRequestHeader('Content-Type', 'application/json'); }
      if (cfg.API_KEY) { xhr.setRequestHeader('X-API-KEY', cfg.API_KEY); }
      xhr.setRequestHeader('X-Client-Platform', cfg.PLATFORM);
      xhr.setRequestHeader('X-Device-Id', NIPTV.Store.deviceId());

      xhr.onload = function () {
        var json = null;
        try { json = JSON.parse(xhr.responseText); } catch (e) {}
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(json || { status: true, data: null });
        } else {
          var msg = (json && json.message) ? json.message : ('HTTP ' + xhr.status);
          reject({ status: xhr.status, message: msg });
        }
      };
      xhr.onerror   = function () { reject({ status: 0, message: 'Network error' }); };
      xhr.ontimeout = function () { reject({ status: 0, message: 'Request timed out' }); };

      xhr.send(body ? JSON.stringify(body) : null);
    });
  }

  // Normalise the list endpoint: limit=-1 returns a flat array; otherwise it is
  // a Laravel paginator object ({ data: [...] }).
  function unwrapList(res) {
    var d = res && res.data;
    if (!d) { return []; }
    if (Object.prototype.toString.call(d) === '[object Array]') { return d; }
    if (d.data && Object.prototype.toString.call(d.data) === '[object Array]') { return d.data; }
    return [];
  }

  return {
    health: function () { return request('GET', '/health'); },

    getChannels: function () {
      // limit=-1 => all channels in a single flat array, ordered by channel_number.
      return request('GET', '/channels', { limit: -1 }).then(unwrapList);
    },

    getChannel: function (uuid) {
      return request('GET', '/channels/' + encodeURIComponent(uuid)).then(function (r) {
        return r && r.data ? r.data : null;
      });
    },

    getCategories: function () {
      return request('GET', '/categories').then(function (r) {
        return unwrapList(r);
      });
    },

    getPublicSettings: function () {
      return request('GET', '/settings/public').then(function (r) {
        return r && r.data ? r.data : {};
      });
    },

    // Fire-and-forget analytics (never block playback on these).
    incrementView: function (uuid) {
      request('POST', '/channels/' + encodeURIComponent(uuid) + '/view', null, {}).catch(function () {});
    },
    heartbeat: function (uuid) {
      request('POST', '/channels/' + encodeURIComponent(uuid) + '/heartbeat', null, {}).catch(function () {});
    }
  };
})();
