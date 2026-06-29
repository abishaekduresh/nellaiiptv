/* HLS playback wrapper. Mirrors the website strategy:
 *   - hls.js when MSE is supported (most webOS models)
 *   - native HLS for Safari-like / older TV engines
 *   - PAID_RESTRICTED streams surface a "premium" error instead of playing. */
NIPTV.Player = (function () {
  var video = null;
  var hls = null;
  var handlers = {};       // { onLoading, onPlaying, onError }
  var currentUrl = null;

  function on(name, cb) { handlers[name] = cb; }
  function emit(name, arg) { if (handlers[name]) { handlers[name](arg); } }

  function resolveUrl(url) {
    // Upgrade http -> https when the app itself is served over https (avoids mixed-content block).
    if (location.protocol === 'https:' && url.indexOf('http://') === 0) {
      return url.replace(/^http:\/\//, 'https://');
    }
    return url;
  }

  function init(videoEl) { video = videoEl; }

  function destroy() {
    if (hls) { try { hls.destroy(); } catch (e) {} hls = null; }
    if (video) {
      try { video.pause(); } catch (e) {}
      video.removeAttribute('src');
      try { video.load(); } catch (e) {}
    }
    currentUrl = null;
  }

  function buildConfig() {
    // Conservative live-tuned config that behaves well on limited-RAM TV hardware.
    return {
      debug: false,
      enableWorker: true,
      lowLatencyMode: false,
      capLevelToPlayerSize: false,
      startLevel: -1,
      maxBufferLength: 20,
      maxMaxBufferLength: 40,
      backBufferLength: 10,
      maxBufferSize: 30 * 1000 * 1000,
      manifestLoadingTimeOut: 12000,
      levelLoadingTimeOut: 12000,
      fragLoadingTimeOut: 20000,
      manifestLoadingMaxRetry: 3,
      levelLoadingMaxRetry: 3,
      fragLoadingMaxRetry: 6
    };
  }

  function load(streamUrl) {
    destroy();

    if (!streamUrl) {
      emit('onError', { title: 'No stream', message: 'This channel has no stream URL.' });
      return;
    }
    if (streamUrl === 'PAID_RESTRICTED') {
      emit('onError', { title: 'Premium channel', message: 'This channel requires an active subscription.', premium: true });
      return;
    }
    if (streamUrl.indexOf('RESTRICTED:') === 0) {
      emit('onError', { title: 'Not available', message: streamUrl.replace('RESTRICTED:', '').trim() });
      return;
    }

    var url = resolveUrl(streamUrl);
    currentUrl = url;
    emit('onLoading');

    if (typeof Hls !== 'undefined' && Hls.isSupported()) {
      hls = new Hls(buildConfig());
      hls.attachMedia(video);
      hls.on(Hls.Events.MEDIA_ATTACHED, function () { hls.loadSource(url); });
      hls.on(Hls.Events.MANIFEST_PARSED, function () {
        var p = video.play();
        if (p && p.catch) { p.catch(function () {}); }
      });
      hls.on(Hls.Events.FRAG_BUFFERED, function () { emit('onPlaying'); });
      hls.on(Hls.Events.ERROR, function (evt, data) {
        if (!data || !data.fatal) { return; }
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            // Try one reload before giving up.
            try { hls.startLoad(); } catch (e) {
              emit('onError', { title: 'Stream unavailable', message: 'Network error reaching the stream.' });
            }
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            try { hls.recoverMediaError(); } catch (e) {
              emit('onError', { title: 'Playback error', message: 'Could not decode this stream.' });
            }
            break;
          default:
            emit('onError', { title: 'Stream unavailable', message: 'This channel could not be played.' });
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.addEventListener('loadedmetadata', onNativeLoaded);
      video.addEventListener('playing', onNativePlaying);
      video.addEventListener('error', onNativeError);
    } else {
      emit('onError', { title: 'Unsupported', message: 'HLS playback is not supported on this device.' });
    }
  }

  function onNativeLoaded() { var p = video.play(); if (p && p.catch) { p.catch(function () {}); } }
  function onNativePlaying() { emit('onPlaying'); }
  function onNativeError() { emit('onError', { title: 'Stream unavailable', message: 'This channel could not be played.' }); }

  function retry() { if (currentUrl) { load(currentUrl); } }

  function setMuted(m) { if (video) { video.muted = m; } }
  function isMuted() { return video ? video.muted : false; }

  return {
    init: init,
    on: on,
    load: load,
    retry: retry,
    destroy: destroy,
    setMuted: setMuted,
    isMuted: isMuted
  };
})();
