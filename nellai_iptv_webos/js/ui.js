/* DOM rendering. Owns no app state — app.js calls these to paint the screens. */
NIPTV.UI = (function () {
  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function channelImage(ch) {
    return ch.logo_url || ch.thumbnail_url || 'icon.png';
  }

  // ---- View switching ----
  function showView(id) {
    var views = document.querySelectorAll('.view');
    for (var i = 0; i < views.length; i++) { views[i].classList.remove('active'); }
    $(id).classList.add('active');
  }

  // ---- Splash ----
  function setSplashStatus(text) { $('splash-status').textContent = text; }
  function setSplashVersion(v) { $('splash-version').textContent = 'v' + v; }

  // ---- Sidebar categories ----
  // items: [{ id, label }] — id is a string key ('all','fav', or category uuid)
  function renderCategories(items, activeId) {
    var html = '';
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var active = it.id === activeId ? ' active' : '';
      html += '<div class="cat-item focusable' + active + '" data-cat="' + esc(it.id) + '" tabindex="0">' +
                '<span class="cat-label">' + esc(it.label) + '</span>' +
                '<span class="cat-count">' + (it.count != null ? it.count : '') + '</span>' +
              '</div>';
    }
    $('category-list').innerHTML = html;
  }

  function setActiveCategory(id) {
    var items = $('category-list').querySelectorAll('.cat-item');
    for (var i = 0; i < items.length; i++) {
      items[i].classList.toggle('active', items[i].getAttribute('data-cat') === id);
    }
  }

  // ---- Channel grid ----
  function renderGrid(channels, title) {
    $('content-title').textContent = title || 'Channels';
    $('content-count').textContent = channels.length + (channels.length === 1 ? ' channel' : ' channels');

    if (!channels.length) {
      $('channel-grid').innerHTML = '';
      $('empty-state').classList.remove('hidden');
      return;
    }
    $('empty-state').classList.add('hidden');

    var html = '';
    for (var i = 0; i < channels.length; i++) {
      var ch = channels[i];
      var fav = NIPTV.Store.isFavourite(ch.uuid);
      var premium = ch.is_premium ? '<span class="badge premium">PREMIUM</span>' : '';
      var favStar = fav ? '<span class="badge fav">★</span>' : '';
      html += '<div class="card focusable" tabindex="0" data-uuid="' + esc(ch.uuid) +
                '" data-number="' + esc(ch.channel_number || '') + '">' +
                '<div class="card-thumb">' +
                  '<img src="' + esc(channelImage(ch)) + '" alt="" ' +
                       'onerror="this.onerror=null;this.src=\'icon.png\'" />' +
                  premium + favStar +
                '</div>' +
                '<div class="card-meta">' +
                  '<span class="card-num">' + esc(ch.channel_number || '–') + '</span>' +
                  '<span class="card-name">' + esc(ch.name) + '</span>' +
                '</div>' +
              '</div>';
    }
    $('channel-grid').innerHTML = html;
  }

  // Update a single card's favourite star without re-rendering the whole grid.
  function updateCardFavourite(uuid, isFav) {
    var card = $('channel-grid').querySelector('.card[data-uuid="' + uuid + '"]');
    if (!card) { return; }
    var thumb = card.querySelector('.card-thumb');
    var existing = thumb.querySelector('.badge.fav');
    if (isFav && !existing) {
      var s = document.createElement('span'); s.className = 'badge fav'; s.textContent = '★';
      thumb.appendChild(s);
    } else if (!isFav && existing) {
      existing.parentNode.removeChild(existing);
    }
  }

  // ---- Player overlay ----
  function showOverlay(ch) {
    $('po-number').textContent = ch.channel_number || '';
    $('po-name').textContent = ch.name || '';
    $('po-category').textContent = (ch.category && ch.category.name) ? ch.category.name : '';
    $('po-fav').classList.toggle('hidden', !NIPTV.Store.isFavourite(ch.uuid));
    var ov = $('player-overlay');
    ov.classList.add('visible');
  }
  function hideOverlay() { $('player-overlay').classList.remove('visible'); }

  function showLoader() { $('player-loader').classList.remove('hidden'); }
  function hideLoader() { $('player-loader').classList.add('hidden'); }

  function showError(err) {
    hideLoader();
    $('player-error-title').textContent = err.title || 'Stream unavailable';
    $('player-error-msg').textContent = err.message || '';
    $('player-error').classList.remove('hidden');
  }
  function hideError() { $('player-error').classList.add('hidden'); }

  // ---- Direct channel number entry ----
  function showNumber(val) {
    $('number-entry-val').textContent = val;
    $('number-entry').classList.remove('hidden');
  }
  function hideNumber() { $('number-entry').classList.add('hidden'); }

  // ---- Toast ----
  var toastTimer = null;
  function toast(msg) {
    var t = $('toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    if (toastTimer) { clearTimeout(toastTimer); }
    toastTimer = setTimeout(function () { t.classList.add('hidden'); }, 2500);
  }

  return {
    showView: showView,
    setSplashStatus: setSplashStatus, setSplashVersion: setSplashVersion,
    renderCategories: renderCategories, setActiveCategory: setActiveCategory,
    renderGrid: renderGrid, updateCardFavourite: updateCardFavourite,
    showOverlay: showOverlay, hideOverlay: hideOverlay,
    showLoader: showLoader, hideLoader: hideLoader,
    showError: showError, hideError: hideError,
    showNumber: showNumber, hideNumber: hideNumber,
    toast: toast
  };
})();
