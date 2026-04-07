/**
 * 전역 테마·글씨 크기 (localStorage). app-shell.js보다 먼저 로드하세요.
 */
(function (global) {
  var K_THEME = "jb_pref_theme";
  var K_FONT = "jb_pref_font_scale";
  var K_NAV_ORDER = "jb_pref_nav_order";

  var FONT_SCALES = {
    xs: "80%",
    sm: "90%",
    md: "100%",
    lg: "110%",
    xl: "120%",
  };

  function applyPreferences() {
    var theme = localStorage.getItem(K_THEME) || "dark";
    if (theme !== "light" && theme !== "dark") theme = "dark";
    document.documentElement.setAttribute("data-theme", theme);

    var font = localStorage.getItem(K_FONT) || "md";
    if (!FONT_SCALES[font]) font = "md";
    document.documentElement.style.fontSize = FONT_SCALES[font];
  }

  global.JBPreferences = {
    K_THEME: K_THEME,
    K_FONT: K_FONT,
    K_NAV_ORDER: K_NAV_ORDER,
    FONT_SCALES: FONT_SCALES,
    getTheme: function () {
      var t = localStorage.getItem(K_THEME) || "dark";
      return t === "light" ? "light" : "dark";
    },
    setTheme: function (t) {
      var v = t === "light" ? "light" : "dark";
      localStorage.setItem(K_THEME, v);
      document.documentElement.setAttribute("data-theme", v);
    },
    getFontScale: function () {
      var k = localStorage.getItem(K_FONT) || "md";
      return FONT_SCALES[k] ? k : "md";
    },
    setFontScale: function (key) {
      if (!FONT_SCALES[key]) key = "md";
      localStorage.setItem(K_FONT, key);
      document.documentElement.style.fontSize = FONT_SCALES[key];
    },
    getNavOrderRaw: function () {
      try {
        var raw = localStorage.getItem(K_NAV_ORDER);
        if (!raw) return null;
        var o = JSON.parse(raw);
        return Array.isArray(o) ? o : null;
      } catch (e) {
        return null;
      }
    },
    setNavOrder: function (ids) {
      localStorage.setItem(K_NAV_ORDER, JSON.stringify(ids));
    },
    resetNavOrder: function () {
      localStorage.removeItem(K_NAV_ORDER);
    },
    applyAll: applyPreferences,
  };

  applyPreferences();
})(window);
