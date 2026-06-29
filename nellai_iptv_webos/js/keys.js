/* LG webOS / standard TV remote key codes.
 * Arrow keys + Enter are standard browser key codes (already handled by most code);
 * Back and the colour buttons are webOS-specific. */
NIPTV.Keys = {
  LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, ENTER: 13,

  BACK: 461,        // webOS remote "Back"
  EXIT: 1001,       // some panels send this

  RED: 403, GREEN: 404, YELLOW: 405, BLUE: 406,

  PLAY: 415, PAUSE: 19, STOP: 413, PLAYPAUSE: 10252,
  FF: 417, REW: 412,

  CH_UP: 427, CH_DOWN: 428,

  N0: 48, N1: 49, N2: 50, N3: 51, N4: 52,
  N5: 53, N6: 54, N7: 55, N8: 56, N9: 57,

  isDigit: function (k) { return k >= 48 && k <= 57; },
  digit:   function (k) { return k - 48; }
};
