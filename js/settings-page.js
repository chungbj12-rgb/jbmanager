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

  function init() {
    if (!global.JBPreferences) return;
    syncThemeRadios();
    syncFontRadios();
    buildNavOrderList();
    wireTheme();
    wireFont();
    wireResetNav();
  }

  global.JBSettingsPage = {
    init: init,
    showToast: showToast,
    FONT_KEYS: FONT_KEYS,
    FONT_LABELS: FONT_LABELS,
  };
})(window);
