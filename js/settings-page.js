/**
 * 설정 페이지: 테마, 글씨 크기, 사이드바 순서 (localStorage + 즉시 반영)
 */
(function (global) {
  var FONT_KEYS = ["xs", "sm", "md", "lg", "xl"];
  var FONT_LABELS = {
    xs: "매우 작게 (80%)",
    sm: "작게 (90%)",
    md: "보통 (100%)",
    lg: "크게 (110%)",
    xl: "매우 크게 (120%)",
  };

  function showToast(message) {
    if (global.JBUI && typeof global.JBUI.toast === "function") {
      global.JBUI.toast(message, "ok");
      return;
    }
    var el = document.getElementById("jbToast");
    if (!el) return;
    el.textContent = message;
    el.hidden = false;
    el.classList.add("jb-toast--show");
    setTimeout(function () {
      el.classList.remove("jb-toast--show");
      el.hidden = true;
    }, 2200);
  }

  function syncThemeRadios() {
    var t = global.JBPreferences ? JBPreferences.getTheme() : "dark";
    var radios = document.querySelectorAll('input[name="themePref"]');
    for (var i = 0; i < radios.length; i++) {
      radios[i].checked = radios[i].value === t;
    }
  }

  function syncFontRadios() {
    var k = global.JBPreferences ? JBPreferences.getFontScale() : "md";
    var radios = document.querySelectorAll('input[name="fontPref"]');
    for (var i = 0; i < radios.length; i++) {
      radios[i].checked = radios[i].value === k;
    }
  }

  function buildNavOrderList() {
    var ul = document.getElementById("navOrderList");
    if (!ul || !global.JBAppShell) return;
    var items = JBAppShell.getOrderedNavItems();
    ul.innerHTML = "";
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var li = document.createElement("li");
      li.className = "settings-nav-item";
      li.setAttribute("data-nav-id", it.id);
      li.setAttribute("draggable", "true");
      li.setAttribute("tabindex", "0");
      li.setAttribute("role", "listitem");
      li.innerHTML =
        '<span class="settings-nav-handle" aria-hidden="true">≡</span>' +
        '<span class="settings-nav-label">' +
        escapeHtml(it.label) +
        "</span>";
      ul.appendChild(li);
    }
    bindNavDrag(ul);
    bindNavKeyboard(ul);
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function persistNavOrderFromList(ul) {
    var ids = [];
    var lis = ul.querySelectorAll(".settings-nav-item");
    for (var i = 0; i < lis.length; i++) {
      ids.push(lis[i].getAttribute("data-nav-id"));
    }
    if (global.JBPreferences) JBPreferences.setNavOrder(ids);
    if (global.JBAppShell) JBAppShell.refreshNav();
    showToast("메뉴 순서가 저장되었습니다.");
  }

  function bindNavDrag(ul) {
    var dragEl = null;

    ul.addEventListener("dragstart", function (e) {
      var li = e.target.closest(".settings-nav-item");
      if (!li || !ul.contains(li)) return;
      dragEl = li;
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", li.getAttribute("data-nav-id"));
      setTimeout(function () {
        li.classList.add("settings-nav-item--dragging");
      }, 0);
    });

    ul.addEventListener("dragend", function () {
      if (!dragEl) return;
      dragEl.classList.remove("settings-nav-item--dragging");
      persistNavOrderFromList(ul);
      dragEl = null;
    });

    ul.addEventListener("dragover", function (e) {
      e.preventDefault();
      var over = e.target.closest(".settings-nav-item");
      if (!over || !dragEl || over === dragEl) return;
      var rect = over.getBoundingClientRect();
      var mid = rect.top + rect.height / 2;
      if (e.clientY < mid) {
        ul.insertBefore(dragEl, over);
      } else {
        ul.insertBefore(dragEl, over.nextSibling);
      }
    });

    ul.addEventListener("drop", function (e) {
      e.preventDefault();
    });
  }

  function bindNavKeyboard(ul) {
    function moveFocus(li, delta) {
      var items = ul.querySelectorAll(".settings-nav-item");
      var arr = Array.prototype.slice.call(items);
      var idx = arr.indexOf(li);
      if (idx < 0) return;
      var ni = idx + delta;
      if (ni < 0 || ni >= arr.length) return;
      arr[ni].focus();
    }

    function moveItem(li, delta) {
      var items = ul.querySelectorAll(".settings-nav-item");
      var arr = Array.prototype.slice.call(items);
      var idx = arr.indexOf(li);
      if (idx < 0) return;
      var ni = idx + delta;
      if (ni < 0 || ni >= arr.length) return;
      var other = arr[ni];
      if (delta < 0) {
        ul.insertBefore(li, other);
      } else {
        ul.insertBefore(li, other.nextSibling);
      }
      li.focus();
      persistNavOrderFromList(ul);
    }

    ul.addEventListener("keydown", function (e) {
      var li = e.target.closest(".settings-nav-item");
      if (!li || !ul.contains(li)) return;

      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        if (e.altKey) {
          e.preventDefault();
          moveItem(li, e.key === "ArrowDown" ? 1 : -1);
        } else {
          e.preventDefault();
          moveFocus(li, e.key === "ArrowDown" ? 1 : -1);
        }
        return;
      }

      if (e.key === "Home") {
        e.preventDefault();
        var first = ul.querySelector(".settings-nav-item");
        if (first) first.focus();
        return;
      }
      if (e.key === "End") {
        e.preventDefault();
        var all = ul.querySelectorAll(".settings-nav-item");
        if (all.length) all[all.length - 1].focus();
      }
    });
  }

  function wireTheme() {
    document.body.addEventListener("change", function (e) {
      var t = e.target;
      if (t.name !== "themePref" || t.type !== "radio") return;
      if (global.JBPreferences) {
        JBPreferences.setTheme(t.value);
        showToast(t.value === "light" ? "화이트 모드로 전환했습니다." : "다크 모드로 전환했습니다.");
      }
    });
  }

  function wireFont() {
    document.body.addEventListener("change", function (e) {
      var t = e.target;
      if (t.name !== "fontPref" || t.type !== "radio") return;
      if (global.JBPreferences) {
        JBPreferences.setFontScale(t.value);
        showToast("글씨 크기가 적용되었습니다.");
      }
    });
  }

  function wireResetNav() {
    var btn = document.getElementById("resetNavOrderBtn");
    if (!btn) return;
    btn.addEventListener("click", function () {
      if (!global.JBPreferences || !global.JBAppShell) return;
      JBPreferences.resetNavOrder();
      buildNavOrderList();
      JBAppShell.refreshNav();
      showToast("메뉴 순서를 기본값으로 복원했습니다.");
    });
  }

  function hostFromUrl(u) {
    try {
      return new URL(u).host;
    } catch (e) {
      return "";
    }
  }

  function pingSupabaseHealth(baseUrl) {
    var u = String(baseUrl || "").replace(/\/$/, "");
    if (!u) return Promise.resolve(null);
    return fetch(u + "/auth/v1/health", { method: "GET", cache: "no-store" })
      .then(function (r) {
        return r.ok;
      })
      .catch(function () {
        return false;
      });
  }

  function connRow(label, valueInnerHtml) {
    return (
      '<div class="settings-connect-row">' +
      '<span class="settings-connect-row__label">' +
      escapeHtml(label) +
      "</span>" +
      '<span class="settings-connect-row__value">' +
      valueInnerHtml +
      "</span></div>"
    );
  }

  function updateDataLeadForMode(cloudConfigured) {
    var el = document.getElementById("settingsDataLead");
    if (!el || !cloudConfigured) return;
    el.innerHTML =
      "Supabase mode: data may sync with your project. Reset below reseeds demo data in this browser.";
  }

  function renderConnectionStatus() {
    var root = document.getElementById("jbConnectionStatus");
    if (!root) return;
    var cfg = global.JBAuthConfig || {};
    var mode = cfg.storageMode || "local";
    var url = cfg.supabaseUrl || "";
    var hasKey = !!(cfg.supabaseAnonKey && String(cfg.supabaseAnonKey).length > 8);
    var client =
      global.JBSupabase && typeof JBSupabase.getClient === "function"
        ? JBSupabase.getClient()
        : null;

    var body = "";
    var dotClass = "settings-connect-dot--off";
    var summary = "Local only (this browser)";

    if (mode === "supabase") {
      if (url && hasKey) {
        dotClass = "settings-connect-dot--warn";
        summary = "Checking project...";
        body +=
          connRow("Storage", "Supabase") +
          connRow("Project", escapeHtml(hostFromUrl(url) || url)) +
          connRow("Anon key", hasKey ? "Set" : "Missing") +
          connRow("SDK client", escapeHtml(client ? "Ready" : "Not ready")) +
          connRow("Auth API", '<span id="jbConnPing">...</span>');
      } else {
        dotClass = "settings-connect-dot--err";
        summary = "Supabase mode but URL/key missing";
        body +=
          connRow("Storage", "supabase (incomplete)") +
          connRow("Project", url ? escapeHtml(hostFromUrl(url) || url) : "\u2014") +
          connRow("Anon key", hasKey ? "Set" : "Missing");
      }
    } else {
      body +=
        connRow("Storage", escapeHtml("local")) +
        connRow(
          "Note",
          "Green dot in Cursor MCP = editor only. This app needs URL + anon key in auth-config or Vercel env."
        );
    }

    root.innerHTML =
      '<div class="settings-connect-summary">' +
      '<span class="settings-connect-dot ' +
      dotClass +
      '" aria-hidden="true"></span>' +
      "<span>" +
      escapeHtml(summary) +
      "</span></div>" +
      body;

    updateDataLeadForMode(mode === "supabase" && !!url && hasKey);

    if (mode === "supabase" && url && hasKey) {
      pingSupabaseHealth(url).then(function (ok) {
        var pingEl = document.getElementById("jbConnPing");
        if (pingEl) {
          pingEl.textContent = ok ? "OK" : "Failed";
        }
        var sumSpan = root.querySelector(".settings-connect-summary span:last-child");
        var dot = root.querySelector(".settings-connect-dot");
        if (ok && client) {
          if (sumSpan) sumSpan.textContent = "Connected (like MCP: app reaches Supabase)";
          if (dot) dot.className = "settings-connect-dot settings-connect-dot--ok";
        } else if (ok) {
          if (sumSpan) sumSpan.textContent = "Server up, SDK check needed";
          if (dot) dot.className = "settings-connect-dot settings-connect-dot--warn";
        } else {
          if (sumSpan) sumSpan.textContent = "Cannot reach project";
          if (dot) dot.className = "settings-connect-dot settings-connect-dot--err";
        }
      });
    }
  }

  function wireConnectionRefresh() {
    var btn = document.getElementById("jbConnectionRefresh");
    if (!btn) return;
    btn.addEventListener("click", function () {
      renderConnectionStatus();
      showToast("Connection rechecked.");
    });
  }

  function init() {
    if (!global.JBPreferences) return;
    syncThemeRadios();
    syncFontRadios();
    buildNavOrderList();
    wireTheme();
    wireFont();
    wireResetNav();
    renderConnectionStatus();
    wireConnectionRefresh();
  }

  global.JBSettingsPage = {
    init: init,
    showToast: showToast,
    FONT_KEYS: FONT_KEYS,
    FONT_LABELS: FONT_LABELS,
    renderConnectionStatus: renderConnectionStatus,
  };
})(window);
