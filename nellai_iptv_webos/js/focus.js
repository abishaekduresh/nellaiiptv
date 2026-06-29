/* Spatial (D-pad) focus manager.
 * TV WebKit engines do NOT move focus on arrow keys automatically, so we pick the
 * nearest focusable element in the pressed direction using element geometry.
 *
 * Any element with class "focusable" inside the current scope is a candidate.
 * The focused element gets class "focused" and is scrolled into view. */
NIPTV.Focus = (function () {
  var scopeEl = document;
  var currentEl = null;

  function candidates() {
    var list = scopeEl.querySelectorAll('.focusable');
    var out = [];
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      // Skip hidden / zero-size elements.
      if (el.offsetParent === null && el.getClientRects().length === 0) { continue; }
      out.push(el);
    }
    return out;
  }

  function center(el) {
    var r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, r: r };
  }

  function setScope(el) { scopeEl = el || document; }

  function clear() {
    if (currentEl) { currentEl.classList.remove('focused'); currentEl = null; }
  }

  function focus(el) {
    if (!el) { return; }
    if (currentEl && currentEl !== el) { currentEl.classList.remove('focused'); }
    currentEl = el;
    el.classList.add('focused');
    // Keep the focused element comfortably in view (centred where possible).
    try { el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (e) { el.scrollIntoView(); }
  }

  function current() { return currentEl; }

  function first() {
    var c = candidates();
    if (c.length) { focus(c[0]); }
    return currentEl;
  }

  // Focus a specific element by data-uuid (used to restore last channel).
  function focusByUuid(uuid) {
    var el = scopeEl.querySelector('.focusable[data-uuid="' + uuid + '"]');
    if (el) { focus(el); return true; }
    return false;
  }

  function move(dir) {
    if (!currentEl) { return first(); }
    var from = center(currentEl);
    var list = candidates();
    var best = null, bestScore = Infinity;

    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      if (el === currentEl) { continue; }
      var c = center(el);
      var dx = c.x - from.x;
      var dy = c.y - from.y;

      var primary, cross;
      if (dir === 'left')  { if (dx >= -2) continue; primary = -dx; cross = Math.abs(dy); }
      else if (dir === 'right') { if (dx <= 2) continue; primary = dx; cross = Math.abs(dy); }
      else if (dir === 'up')    { if (dy >= -2) continue; primary = -dy; cross = Math.abs(dx); }
      else /* down */           { if (dy <= 2) continue; primary = dy; cross = Math.abs(dx); }

      // Primary-axis distance dominates; cross-axis misalignment is penalised so we
      // prefer the element most directly in line with the current one.
      var score = primary + cross * 2;
      if (score < bestScore) { bestScore = score; best = el; }
    }

    if (best) { focus(best); }
    return best; // null => no candidate that way (caller may cross into another pane)
  }

  return {
    setScope: setScope,
    clear: clear,
    focus: focus,
    current: current,
    first: first,
    focusByUuid: focusByUuid,
    move: move
  };
})();
