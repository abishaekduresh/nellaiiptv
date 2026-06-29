/* Application controller: bootstrap, view state machine and remote-key routing. */
(function () {
  var Keys = NIPTV.Keys, UI = NIPTV.UI, Api = NIPTV.Api, Focus = NIPTV.Focus,
      Player = NIPTV.Player, Store = NIPTV.Store, cfg = NIPTV.config;

  var state = {
    view: 'splash',          // 'splash' | 'browse' | 'player'
    allChannels: [],
    categories: [],          // [{ id, label, count }]
    activeCat: 'all',
    list: [],                // channels currently shown in the grid
    playingIndex: -1,        // index into state.list while in player
    playingChannel: null
  };

  var overlayTimer = null, numberTimer = null, numberBuffer = '';

  // ---------------- Bootstrap ----------------
  function boot() {
    UI.setSplashVersion(cfg.APP_VERSION);
    Player.init(document.getElementById('video'));
    wirePlayer();
    document.addEventListener('keydown', onKey, false);

    var started = Date.now();
    UI.setSplashStatus('Connecting…');

    Promise.all([
      Api.getChannels().catch(function () { return []; }),
      Api.getCategories().catch(function () { return []; })
    ]).then(function (res) {
      state.allChannels = res[0] || [];
      buildCategories(res[1] || []);

      if (!state.allChannels.length) {
        UI.setSplashStatus('No channels available. Check your connection.');
        return;
      }
      // Honour the minimum splash duration so it doesn't flash.
      var wait = Math.max(0, cfg.SPLASH_MS - (Date.now() - started));
      setTimeout(enterBrowse, wait);
    });
  }

  function buildCategories(cats) {
    var items = [{ id: 'all', label: 'All Channels', count: state.allChannels.length }];
    var favCount = 0, i;
    for (i = 0; i < state.allChannels.length; i++) {
      if (Store.isFavourite(state.allChannels[i].uuid)) { favCount++; }
    }
    items.push({ id: 'fav', label: 'Favourites', count: favCount });

    // Only show categories that actually have channels.
    for (i = 0; i < cats.length; i++) {
      var c = cats[i];
      var n = countInCategory(c.uuid);
      if (n > 0) { items.push({ id: c.uuid, label: c.name, count: n }); }
    }
    state.categories = items;
  }

  function countInCategory(catUuid) {
    var n = 0;
    for (var i = 0; i < state.allChannels.length; i++) {
      var ch = state.allChannels[i];
      if (ch.category && ch.category.uuid === catUuid) { n++; }
    }
    return n;
  }

  // ---------------- Browse view ----------------
  function enterBrowse() {
    state.view = 'browse';
    UI.showView('browse');
    UI.renderCategories(state.categories, state.activeCat);
    applyCategory(state.activeCat, /*focusGrid*/ true);
    Focus.setScope(document.getElementById('browse'));
  }

  function applyCategory(catId, focusGrid) {
    state.activeCat = catId;
    UI.setActiveCategory(catId);

    var list;
    if (catId === 'all') {
      list = state.allChannels.slice();
    } else if (catId === 'fav') {
      list = state.allChannels.filter(function (ch) { return Store.isFavourite(ch.uuid); });
    } else {
      list = state.allChannels.filter(function (ch) { return ch.category && ch.category.uuid === catId; });
    }
    state.list = list;

    var title = 'All Channels';
    for (var i = 0; i < state.categories.length; i++) {
      if (state.categories[i].id === catId) { title = state.categories[i].label; break; }
    }
    UI.renderGrid(list, title);

    if (focusGrid) { focusFirstCard(); }
  }

  function focusFirstCard() {
    var grid = document.getElementById('channel-grid');
    var card = grid.querySelector('.card');
    if (card) { Focus.focus(card); }
    else {
      // Empty category (e.g. no favourites yet) — fall back to the sidebar.
      var cat = document.querySelector('.cat-item[data-cat="' + state.activeCat + '"]');
      if (cat) { Focus.focus(cat); }
    }
  }

  function onBrowseKey(code) {
    var el = Focus.current();
    var isCard = el && el.classList.contains('card');
    var isCat = el && el.classList.contains('cat-item');

    switch (code) {
      case Keys.LEFT:  Focus.move('left'); return;
      case Keys.RIGHT: Focus.move('right'); return;
      case Keys.UP:    Focus.move('up'); return;
      case Keys.DOWN:  Focus.move('down'); return;

      case Keys.ENTER:
        if (isCard) { openFromCard(el); }
        else if (isCat) { applyCategory(el.getAttribute('data-cat'), true); }
        return;

      case Keys.YELLOW:
        if (isCard) { toggleFavourite(el.getAttribute('data-uuid')); }
        return;

      case Keys.BACK:
        if (isCard) {
          // From the grid, Back returns focus to the active category in the sidebar.
          var cat = document.querySelector('.cat-item[data-cat="' + state.activeCat + '"]');
          if (cat) { Focus.focus(cat); return; }
        }
        // From the sidebar, Back exits the app.
        exitApp();
        return;

      default:
        if (Keys.isDigit(code)) { pushDigit(Keys.digit(code)); }
        return;
    }
  }

  function openFromCard(cardEl) {
    var uuid = cardEl.getAttribute('data-uuid');
    var idx = indexInList(uuid);
    if (idx !== -1) { playByIndex(idx); }
  }

  function indexInList(uuid) {
    for (var i = 0; i < state.list.length; i++) { if (state.list[i].uuid === uuid) { return i; } }
    return -1;
  }

  function toggleFavourite(uuid) {
    var nowFav = Store.toggleFavourite(uuid);
    UI.updateCardFavourite(uuid, nowFav);
    UI.toast(nowFav ? 'Added to Favourites' : 'Removed from Favourites');
    // Keep the Favourites counter in the sidebar fresh.
    buildCategories(rawCategories());
    UI.renderCategories(state.categories, state.activeCat);
    // If we are looking at the Favourites list, re-filter so it stays accurate.
    if (state.activeCat === 'fav') { applyCategory('fav', false); }
    var still = document.querySelector('.card[data-uuid="' + uuid + '"]');
    if (still) { Focus.focus(still); } else { focusFirstCard(); }
  }

  // Rebuild category objects from the cached category names (avoids another API call).
  function rawCategories() {
    var out = [];
    for (var i = 0; i < state.categories.length; i++) {
      var it = state.categories[i];
      if (it.id !== 'all' && it.id !== 'fav') { out.push({ uuid: it.id, name: it.label }); }
    }
    return out;
  }

  // ---------------- Player view ----------------
  function playByIndex(idx) {
    if (idx < 0 || idx >= state.list.length) { return; }
    state.playingIndex = idx;
    var ch = state.list[idx];
    state.playingChannel = ch;
    Store.setLastChannel(ch.uuid);

    state.view = 'player';
    UI.showView('player');
    UI.hideError();
    UI.showLoader();
    UI.showOverlay(ch);
    bumpOverlay();

    // Fetch fresh detail (gives the freshest/authorised stream URL for the TV platform);
    // fall back to the list copy if that fails.
    Api.getChannel(ch.uuid).then(function (fresh) {
      var url = streamUrlOf(fresh) || streamUrlOf(ch);
      Player.load(url);
      Api.incrementView(ch.uuid);
    }).catch(function () {
      Player.load(streamUrlOf(ch));
    });
  }

  function streamUrlOf(ch) {
    if (!ch) { return null; }
    return ch.hls_url || ch.stream_url || null;
  }

  function changeChannel(delta) {
    if (!state.list.length) { return; }
    var n = state.list.length;
    var idx = ((state.playingIndex + delta) % n + n) % n;
    playByIndex(idx);
  }

  function onPlayerKey(code) {
    var errVisible = !document.getElementById('player-error').classList.contains('hidden');

    switch (code) {
      case Keys.BACK:
        closePlayer();
        return;

      case Keys.UP:
      case Keys.CH_UP:
        changeChannel(-1); return;

      case Keys.DOWN:
      case Keys.CH_DOWN:
        changeChannel(1); return;

      case Keys.ENTER:
        if (errVisible) { UI.hideError(); UI.showLoader(); Player.retry(); }
        else { closePlayer(); }   // OK acts as "channel list"
        return;

      case Keys.YELLOW:
        if (state.playingChannel) {
          var nowFav = Store.toggleFavourite(state.playingChannel.uuid);
          UI.toast(nowFav ? 'Added to Favourites' : 'Removed from Favourites');
          UI.showOverlay(state.playingChannel); bumpOverlay();
        }
        return;

      case Keys.PLAYPAUSE:
      case Keys.PLAY:
      case Keys.PAUSE:
        togglePause(); return;

      default:
        if (Keys.isDigit(code)) { pushDigit(Keys.digit(code)); }
        else { UI.showOverlay(state.playingChannel); bumpOverlay(); }
        return;
    }
  }

  function togglePause() {
    var v = document.getElementById('video');
    if (v.paused) { var p = v.play(); if (p && p.catch) { p.catch(function () {}); } }
    else { v.pause(); }
    UI.showOverlay(state.playingChannel); bumpOverlay();
  }

  function closePlayer() {
    Player.destroy();
    UI.hideOverlay();
    UI.hideError();
    UI.hideLoader();
    state.view = 'browse';
    UI.showView('browse');
    Focus.setScope(document.getElementById('browse'));
    // Restore focus to the channel we were watching.
    if (!(state.playingChannel && Focus.focusByUuid(state.playingChannel.uuid))) {
      focusFirstCard();
    }
    state.playingChannel = null;
    state.playingIndex = -1;
  }

  function bumpOverlay() {
    if (overlayTimer) { clearTimeout(overlayTimer); }
    overlayTimer = setTimeout(function () { UI.hideOverlay(); }, cfg.OVERLAY_HIDE_MS);
  }

  function wirePlayer() {
    Player.on('onLoading', function () { UI.hideError(); UI.showLoader(); });
    Player.on('onPlaying', function () { UI.hideLoader(); UI.hideError(); });
    Player.on('onError', function (err) { UI.showError(err); });
  }

  // ---------------- Direct channel-number entry ----------------
  function pushDigit(d) {
    numberBuffer += String(d);
    if (numberBuffer.length > 4) { numberBuffer = numberBuffer.slice(-4); }
    UI.showNumber(numberBuffer);
    if (numberTimer) { clearTimeout(numberTimer); }
    numberTimer = setTimeout(commitNumber, cfg.NUMBER_ENTRY_MS);
  }

  function commitNumber() {
    var num = parseInt(numberBuffer, 10);
    numberBuffer = '';
    UI.hideNumber();
    if (isNaN(num)) { return; }

    // Search the full channel set by channel_number.
    var target = null;
    for (var i = 0; i < state.allChannels.length; i++) {
      if (parseInt(state.allChannels[i].channel_number, 10) === num) { target = state.allChannels[i]; break; }
    }
    if (!target) { UI.toast('Channel ' + num + ' not found'); return; }

    // Make sure the channel exists in the active list so up/down works after tuning.
    var idx = indexInList(target.uuid);
    if (idx === -1) { applyCategory('all', false); idx = indexInList(target.uuid); }
    if (idx !== -1) { playByIndex(idx); }
  }

  // ---------------- Key router ----------------
  function onKey(e) {
    var code = e.keyCode;
    if (state.view === 'splash') { return; }

    // Number entry takes priority when active and Enter is pressed.
    if (numberBuffer && code === Keys.ENTER) {
      if (numberTimer) { clearTimeout(numberTimer); }
      commitNumber();
      e.preventDefault();
      return;
    }

    if (state.view === 'browse') { onBrowseKey(code); }
    else if (state.view === 'player') { onPlayerKey(code); }

    // Stop the TV engine from scrolling / navigating on the keys we own.
    if (code === Keys.LEFT || code === Keys.RIGHT || code === Keys.UP ||
        code === Keys.DOWN || code === Keys.ENTER || code === Keys.BACK) {
      e.preventDefault();
    }
  }

  function exitApp() {
    try { if (window.webOS && window.webOS.platformBack) { window.webOS.platformBack(); return; } } catch (e) {}
    try { window.close(); } catch (e) {}
  }

  // Go.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else { boot(); }
})();
