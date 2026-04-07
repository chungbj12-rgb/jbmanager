/**
 * 학부모용 셔틀 노선표 — 로컬 번들 / Supabase 공개 스냅샷
 */
(function () {
  var DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
  function escapeHtml(s) {
    return String(s == null ? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function normalizeTime(t) {
    if (typeof JBData !== "undefined" && JBData.normalizeClassTime) {
      return JBData.normalizeClassTime(t) || String(t || "").trim();
    }
    return String(t || "").trim();
  }

  function parseBundleLocal() {
    var h = location.hash;
    if (h && h.indexOf("#d=") === 0) {
      try {
        return JSON.parse(decodeURIComponent(h.slice(3)));
      } catch (e) {
        console.error(e);
      }
    }
    var t = new URLSearchParams(location.search).get("t");
    if (t) {
      try {
        var raw = localStorage.getItem("jb_shuttle_bundle_" + t);
        if (raw) return JSON.parse(raw);
      } catch (e) {}
    }
    return null;
  }

  function formatTimeRange(c) {
    return normalizeTime(c.startTime) + " ~ " + normalizeTime(c.endTime);
  }

  function vehicleLabel(v) {
    if (!v) return "";
    return (v.name || "") + (v.plate ? " · " + v.plate : "");
  }

  function findRoute(routes, classId) {
    for (var i = 0; i < routes.length; i++) {
      if (routes[i].classId === classId) return routes[i];
    }
    return null;
  }

  function findVehicle(vehicles, id) {
    if (!id) return null;
    for (var i = 0; i < vehicles.length; i++) {
      if (vehicles[i].id === id) return vehicles[i];
    }
    return null;
  }

  function classesForDay(classes, dayIdx) {
    return classes
      .filter(function (c) {
        return Array.isArray(c.weekdays) && c.weekdays.indexOf(dayIdx) !== -1;
      })
      .sort(function (a, b) {
        var ta = normalizeTime(a.startTime);
        var tb = normalizeTime(b.startTime);
        if (ta !== tb) return ta.localeCompare(tb);
        return (a.name || "").localeCompare(b.name || "", "ko");
      });
  }

  function render(bundle) {
    var vehicles = Array.isArray(bundle.vehicles) ? bundle.vehicles : [];
    var routes = Array.isArray(bundle.routes) ? bundle.routes : [];
    var classes = Array.isArray(bundle.classes) ? bundle.classes : [];

    var selDay = document.getElementById("pubDay");
    var selClass = document.getElementById("pubClass");
    var panel = document.getElementById("pubPanel");

    function refreshClassOptions() {
      var dayIdx = parseInt(selDay.value, 10);
      if (isNaN(dayIdx)) dayIdx = 1;
      var list = classesForDay(classes, dayIdx);
      var prev = selClass.value;
      selClass.innerHTML = "";
      if (!list.length) {
        var o = document.createElement("option");
        o.value = "";
        o.textContent = "해당 요일에 운영하는 클래스가 없습니다";
        selClass.appendChild(o);
        selClass.disabled = true;
        panel.innerHTML = '<p class="shuttle-pub__empty">이 요일에 등록된 클래스가 없습니다.</p>';
        return;
      }
      selClass.disabled = false;
      list.forEach(function (c) {
        var o = document.createElement("option");
        o.value = c.id;
        o.textContent = (c.name || "") + " · " + formatTimeRange(c);
        selClass.appendChild(o);
      });
      if (prev && list.some(function (x) { return x.id === prev; })) {
        selClass.value = prev;
      } else {
        selClass.value = list[0].id;
      }
      showRoute();
    }

    function showRoute() {
      var cid = selClass.value;
      if (!cid) {
        panel.innerHTML = '<p class="shuttle-pub__empty">클래스를 선택해 주세요.</p>';
        return;
      }
      var c = classes.find(function (x) {
        return x.id === cid;
      });
      var r = findRoute(routes, cid);
      var v = r && r.vehicleId ? findVehicle(vehicles, r.vehicleId) : null;
      var routeText = (r && r.routeText) || "";
      var title = (c && c.name) || "";
      var di = parseInt(selDay.value, 10);
      if (isNaN(di)) di = 1;
      var wdLabel = DAY_LABELS[di];
      var metaParts = [wdLabel];
      if (c) metaParts.push(formatTimeRange(c));
      if (v) metaParts.push("배차: " + vehicleLabel(v));
      var metaLine = metaParts.join(" · ");

      if (!routeText.trim()) {
        panel.innerHTML =
          '<h2 class="shuttle-pub__class-head">' +
          escapeHtml(title) +
          '</h2><p class="shuttle-pub__meta">' +
          escapeHtml(metaLine) +
          '</p><p class="shuttle-pub__empty">등록된 노선 정보가 없습니다.</p>';
        return;
      }

      panel.innerHTML =
        '<h2 class="shuttle-pub__class-head">' +
        escapeHtml(title) +
        '</h2><p class="shuttle-pub__meta">' +
        escapeHtml(metaLine) +
        '</p><div class="shuttle-pub__route">' +
        escapeHtml(routeText) +
        "</div>";
    }

    selDay.addEventListener("change", refreshClassOptions);
    selClass.addEventListener("change", showRoute);

    refreshClassOptions();
  }

  function showErr(msg) {
    document.getElementById("pubRoot").innerHTML =
      '<div class="shuttle-pub"><p class="shuttle-pub__err">' +
      escapeHtml(msg || "데이터를 불러올 수 없습니다.") +
      "</p></div>";
  }

  function init() {
    function finish(bundle) {
      if (!bundle || !bundle.classes || !bundle.classes.length) {
        showErr("유효한 링크가 아니거나 데이터가 없습니다. 관리자에게 공유 링크를 요청해 주세요.");
        return;
      }
      var dayEl = document.getElementById("pubDay");
      if (dayEl) dayEl.value = String(new Date().getDay());
      render(bundle);
    }

    if (typeof JBRemoteSync !== "undefined" && JBRemoteSync.enabled && JBRemoteSync.enabled()) {
      JBRemoteSync.fetchShuttlePublicAnon().then(function (bundle) {
        if (bundle && bundle.classes && bundle.classes.length) {
          finish(bundle);
          return;
        }
        if (typeof JBData !== "undefined") {
          JBData.ensureSeed();
        }
        finish(parseBundleLocal());
      });
      return;
    }

    if (typeof JBData === "undefined") {
      showErr("데이터를 불러올 수 없습니다.");
      return;
    }
    JBData.ensureSeed();

    var liveToken = null;
    try {
      liveToken = new URLSearchParams(location.search).get("t");
    } catch (e) {}
    if (liveToken) {
      window.addEventListener("storage", function (e) {
        if (e.key === "jb_shuttle_bundle_" + liveToken && e.newValue) {
          location.reload();
        }
      });
    }

    finish(parseBundleLocal());
  }

  init();
})();
