(function () {
  var LS_PAGE = "jb_makeup_page_size";

  var ST = {
    PENDING: "예약대기",
    CONFIRMED: "예약확정",
    CHANGE_REQ: "변경요청",
  };

  var state = {
    workspace: "apply",
    consultSearch: "",
    applySearch: "",
    consultPage: 0,
    applyPage: 0,
    pageSize: 50,
    consultSelectedIds: {},
    applySelectedIds: {},
  };

  function $(id) {
    return document.getElementById(id);
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function dash(v) {
    var s = v != null ? String(v).trim() : "";
    return s ? esc(s) : '<span class="cell-dash">-</span>';
  }

  function formatPhoneInputLive(str) {
    var d = String(str || "").replace(/\D/g, "").slice(0, 11);
    if (!d.length) return "";
    if (d.length <= 3) return d;
    if (d.length <= 7) return d.slice(0, 3) + "-" + d.slice(3);
    return d.slice(0, 3) + "-" + d.slice(3, 7) + "-" + d.slice(7);
  }

  function phoneValidDigits(s) {
    var d = JBData.normalizePhoneDigits(s);
    return d.length === 11 && /^01[016789]/.test(d);
  }

  function bindPhoneInput(el) {
    if (!el) return;
    el.addEventListener("input", function () {
      this.value = formatPhoneInputLive(this.value);
      var len = this.value.length;
      this.setSelectionRange(len, len);
    });
  }

  function loadPageSize() {
    try {
      var v = parseInt(localStorage.getItem(LS_PAGE), 10);
      if (v === 50 || v === 100 || v === 300) return v;
    } catch (e) {}
    return 50;
  }

  /** YYYY-MM-DD → 한글 날짜 (카톡 문구용) */
  function formatDateKo(iso) {
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(String(iso).trim())) return String(iso || "").trim() || "-";
    var p = String(iso).trim().split("-").map(Number);
    return p[0] + "년 " + p[1] + "월 " + p[2] + "일";
  }

  function toast(msg, type) {
    if (window.JBUI && typeof JBUI.toast === "function") {
      JBUI.toast(msg, type);
      return;
    }
    alert(msg);
  }

  function mkConsultFilteredList() {
    var q = state.consultSearch.trim();
    return JBData.getMakeupConsultations()
      .filter(function (c) {
        return matchesConsultSearch(c, q);
      })
      .sort(function (a, b) {
        return getConsultTs(b) - getConsultTs(a);
      });
  }

  function getConsultTs(c) {
    if (!c || !c.createdAt) return 0;
    var t = new Date(c.createdAt);
    return isNaN(t.getTime()) ? 0 : t.getTime();
  }

  function matchesConsultSearch(c, q) {
    if (!q) return true;
    var qn = q.toLowerCase().trim();
    var name = (c.applicantName || "").toLowerCase();
    var phone = JBData.normalizePhoneDigits(c.phone || "");
    var qd = JBData.normalizePhoneDigits(q);
    if (name.indexOf(qn) !== -1) return true;
    if (qd.length >= 3 && phone.indexOf(qd) !== -1) return true;
    return false;
  }

  function mkApplyFilteredList() {
    var q = state.applySearch.trim().toLowerCase();
    return JBData.getMakeup()
      .filter(function (m) {
        if (!q) return true;
        var name = (m.memberName || "").toLowerCase();
        return name.indexOf(q) !== -1;
      })
      .sort(function (a, b) {
        return JBData.getMakeupSortTimestamp(b) - JBData.getMakeupSortTimestamp(a);
      });
  }

  function pruneConsultSel(list) {
    var set = {};
    for (var i = 0; i < list.length; i++) set[list[i].id] = true;
    Object.keys(state.consultSelectedIds).forEach(function (id) {
      if (!set[id]) delete state.consultSelectedIds[id];
    });
  }

  function pruneApplySel(list) {
    var set = {};
    for (var i = 0; i < list.length; i++) set[list[i].id] = true;
    Object.keys(state.applySelectedIds).forEach(function (id) {
      if (!set[id]) delete state.applySelectedIds[id];
    });
  }

  function consultSelCount() {
    return Object.keys(state.consultSelectedIds).filter(function (id) {
      return state.consultSelectedIds[id];
    }).length;
  }

  function applySelCount() {
    return Object.keys(state.applySelectedIds).filter(function (id) {
      return state.applySelectedIds[id];
    }).length;
  }

  function updateMkConsultDel() {
    var btn = $("btnMkConsultBulkDelete");
    if (!btn) return;
    var n = consultSelCount();
    btn.disabled = n === 0;
    btn.setAttribute("aria-label", n ? "선택 " + n + "건 삭제" : "선택 항목 삭제");
  }

  function updateMkApplyDel() {
    var btn = $("btnMkApplyBulkDelete");
    if (!btn) return;
    var n = applySelCount();
    btn.disabled = n === 0;
    btn.setAttribute("aria-label", n ? "선택 " + n + "건 삭제" : "선택 항목 삭제");
  }

  function syncMkConsultSelectAll() {
    var cbs = document.querySelectorAll("#mkConsultTbody .mk-consult-row-cb");
    var sa = $("mkConsultCbSelectAll");
    if (!sa) return;
    if (!cbs.length) {
      sa.checked = false;
      return;
    }
    var all = true;
    Array.prototype.forEach.call(cbs, function (cb) {
      if (!cb.checked) all = false;
    });
    sa.checked = all;
  }

  function syncMkApplySelectAll() {
    var cbs = document.querySelectorAll("#mkApplyTbody .mk-apply-row-cb");
    var sa = $("mkApplyCbSelectAll");
    if (!sa) return;
    if (!cbs.length) {
      sa.checked = false;
      return;
    }
    var all = true;
    Array.prototype.forEach.call(cbs, function (cb) {
      if (!cb.checked) all = false;
    });
    sa.checked = all;
  }

  function renderMkStatusCell(row) {
    var id = esc(row.id || "");
    var st = row.status || ST.PENDING;
    var badge = "";
    if (st === ST.CONFIRMED) {
      badge = '<span class="trial-status-done">예약확정</span> ';
    } else if (st === ST.CHANGE_REQ) {
      badge = '<span class="trial-status-note">변경요청</span> ';
    }
    var btns =
      '<div class="trial-status-split">' +
      '<button type="button" class="btn-trial-status btn-trial-status--half" data-makeup-act="confirm" data-makeup-id="' +
      id +
      '">' +
      (st === ST.CONFIRMED ? "확정알림" : "예약확정") +
      "</button>" +
      '<button type="button" class="btn-trial-status btn-trial-status--half btn-trial-status--muted" data-makeup-act="change" data-makeup-id="' +
      id +
      '">예약변경</button>' +
      "</div>";
    return '<div class="mk-status-wrap">' + badge + btns + "</div>";
  }

  function renderWorkspaceTabs() {
    var c = $("mkWorkspaceTabConsult");
    var a = $("mkWorkspaceTabApply");
    if (!c || !a) return;
    c.classList.toggle("is-on", state.workspace === "consult");
    a.classList.toggle("is-on", state.workspace === "apply");
    c.setAttribute("aria-selected", state.workspace === "consult" ? "true" : "false");
    a.setAttribute("aria-selected", state.workspace === "apply" ? "true" : "false");
    var pc = $("panelMkConsult");
    var pa = $("panelMkApply");
    if (pc) pc.hidden = state.workspace !== "consult";
    if (pa) pa.hidden = state.workspace !== "apply";
  }

  function renderMkConsultPanel() {
    var list = mkConsultFilteredList();
    pruneConsultSel(list);
    var total = list.length;
    var cnt = $("mkConsultCount");
    if (cnt) cnt.textContent = "상담 " + total + "건";

    var ps = state.pageSize;
    var pages = Math.max(1, Math.ceil(total / ps));
    if (state.consultPage >= pages) state.consultPage = Math.max(0, pages - 1);
    var slice = list.slice(state.consultPage * ps, state.consultPage * ps + ps);

    var tb = $("mkConsultTbody");
    if (!tb) return;

    if (slice.length === 0) {
      tb.innerHTML = '<tr><td colspan="6" class="cell-empty">등록된 보강 상담이 없습니다.</td></tr>';
    } else {
      tb.innerHTML = slice
        .map(function (row) {
          var id = esc(row.id || "");
          var rawId = row.id || "";
          var statusCell;
          if (row.consultStatus === "발송완료") {
            statusCell = '<span class="trial-status-done">발송완료</span>';
          } else {
            statusCell =
              '<button type="button" class="btn-trial-status" data-mk-consult-act="send" data-mk-consult-id="' +
              id +
              '">상담완료</button>';
          }
          return (
            "<tr>" +
            '<td><input type="checkbox" class="member-cb mk-consult-row-cb" value="' +
            esc(rawId) +
            '" aria-label="선택" /></td>' +
            "<td>" +
            esc(String(row.applicantName || "").trim() || "") +
            "</td>" +
            "<td>" +
            dash(row.phone) +
            "</td>" +
            "<td>" +
            dash(row.originalClass) +
            "</td>" +
            "<td>" +
            dash(row.absenceDate) +
            "</td>" +
            '<td class="trial-status-td">' +
            statusCell +
            "</td>" +
            "</tr>"
          );
        })
        .join("");
    }

    document.querySelectorAll("#mkConsultTbody .mk-consult-row-cb").forEach(function (cb) {
      if (state.consultSelectedIds[cb.value]) cb.checked = true;
    });
    syncMkConsultSelectAll();
    updateMkConsultDel();

    var cpi = $("mkConsultPageInfo");
    var cpr = $("mkConsultPrev");
    var cnx = $("mkConsultNext");
    if (cpi) cpi.textContent = state.consultPage + 1 + " / " + pages;
    if (cpr) cpr.disabled = state.consultPage <= 0;
    if (cnx) cnx.disabled = state.consultPage >= pages - 1;
    var pss = $("mkConsultPageSize");
    if (pss && pss.value !== String(ps)) pss.value = String(ps);
  }

  function renderMkApplyPanel() {
    var list = mkApplyFilteredList();
    pruneApplySel(list);
    var total = list.length;
    var cnt = $("mkApplyCount");
    if (cnt) cnt.textContent = "전체 보강: " + total + "명";

    var ps = state.pageSize;
    var pages = Math.max(1, Math.ceil(total / ps));
    if (state.applyPage >= pages) state.applyPage = Math.max(0, pages - 1);
    var slice = list.slice(state.applyPage * ps, state.applyPage * ps + ps);

    var tb = $("mkApplyTbody");
    if (!tb) return;

    if (slice.length === 0) {
      tb.innerHTML =
        '<tr><td colspan="8" class="cell-empty">등록된 보강이 없습니다. 학부모 보강 신청 링크로 접수되면 여기에 표시됩니다.</td></tr>';
    } else {
      tb.innerHTML = slice
        .map(function (m) {
          var rawId = m.id || "";
          return (
            "<tr>" +
            '<td><input type="checkbox" class="member-cb mk-apply-row-cb" value="' +
            esc(rawId) +
            '" aria-label="선택" /></td>' +
            "<td>" +
            esc(String(m.memberName || "").trim() || "") +
            "</td>" +
            "<td>" +
            dash(m.originalClass) +
            "</td>" +
            "<td>" +
            dash(m.absenceDate) +
            "</td>" +
            "<td>" +
            dash(m.makeupClass) +
            "</td>" +
            "<td>" +
            dash(m.makeupDate) +
            "</td>" +
            '<td class="trial-status-td">' +
            renderMkStatusCell(m) +
            "</td>" +
            "</tr>"
          );
        })
        .join("");
    }

    document.querySelectorAll("#mkApplyTbody .mk-apply-row-cb").forEach(function (cb) {
      if (state.applySelectedIds[cb.value]) cb.checked = true;
    });
    syncMkApplySelectAll();
    updateMkApplyDel();

    var api = $("mkApplyPageInfo");
    var app = $("mkApplyPrev");
    var anx = $("mkApplyNext");
    if (api) api.textContent = state.applyPage + 1 + " / " + pages;
    if (app) app.disabled = state.applyPage <= 0;
    if (anx) anx.disabled = state.applyPage >= pages - 1;
    var pss = $("mkApplyPageSize");
    if (pss && pss.value !== String(ps)) pss.value = String(ps);
  }

  function render() {
    renderWorkspaceTabs();
    if (state.workspace === "consult") {
      renderMkConsultPanel();
    } else {
      renderMkApplyPanel();
    }
  }

  function showMkConsultErr(msg) {
    var el = $("mkConsultModalErr");
    if (!el) return;
    if (msg) {
      el.textContent = msg;
      el.hidden = false;
    } else {
      el.textContent = "";
      el.hidden = true;
    }
  }

  function openMkConsultModal() {
    showMkConsultErr("");
    $("mkConsultModal").hidden = false;
    document.body.classList.add("modal-open");
    $("mkConsultName").value = "";
    $("mkConsultPhone").value = "";
    $("mkConsultOrigClass").value = "";
    $("mkConsultAbsence").value = "";
    $("mkConsultName").focus();
  }

  function closeMkConsultModal() {
    $("mkConsultModal").hidden = true;
    document.body.classList.remove("modal-open");
  }

  function saveMkConsultFromForm() {
    showMkConsultErr("");
    var applicantName = ($("mkConsultName").value || "").trim();
    var phoneRaw = ($("mkConsultPhone").value || "").trim();
    var originalClass = ($("mkConsultOrigClass").value || "").trim();
    var absenceDate = ($("mkConsultAbsence").value || "").trim();
    if (!applicantName) {
      showMkConsultErr("이름을 입력해 주세요.");
      return;
    }
    if (!phoneValidDigits(phoneRaw)) {
      showMkConsultErr("전화번호를 010-XXXX-XXXX 형식(11자리)로 입력해 주세요.");
      return;
    }
    if (!originalClass) {
      showMkConsultErr("원래클래스를 입력해 주세요.");
      return;
    }
    var phone = formatPhoneInputLive(phoneRaw);
    var list = JBData.getMakeupConsultations().slice();
    var now = new Date().toISOString();
    list.push({
      id: "mcc-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8),
      applicantName: applicantName,
      phone: phone,
      originalClass: originalClass,
      absenceDate: absenceDate,
      consultStatus: "상담대기",
      createdAt: now,
      updatedAt: now,
    });
    JBData.saveMakeupConsultations(list);
    closeMkConsultModal();
    state.consultPage = 0;
    render();
  }

  function sendMakeupLinkForConsult(id) {
    var list = JBData.getMakeupConsultations().slice();
    var idx = -1;
    var row;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        idx = i;
        row = list[i];
        break;
      }
    }
    if (idx < 0 || !row || row.consultStatus === "발송완료") return;
    var link = JBData.getMakeupApplicationLink();
    void link;
    row.consultStatus = "발송완료";
    row.updatedAt = new Date().toISOString();
    list[idx] = row;
    JBData.saveMakeupConsultations(list);
    toast("보강 신청 링크가 발송되었습니다.", "ok");
    render();
  }

  function findMakeupById(id) {
    return JBData.getMakeup().find(function (m) {
      return m.id === id;
    });
  }

  function confirmMakeupReservation(id) {
    var list = JBData.getMakeup().slice();
    var idx = -1;
    var row;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        idx = i;
        row = list[i];
        break;
      }
    }
    if (idx < 0 || !row) return;
    var name = String(row.memberName || "").trim() || "회원";
    var cls = String(row.makeupClass || "").trim() || "보강";
    var when = formatDateKo(row.makeupDate);
    row.status = ST.CONFIRMED;
    row.updatedAt = new Date().toISOString();
    list[idx] = row;
    JBData.saveMakeup(list);
    /* 추후 카카오 비즈메시지 API: sendKakao(row.phone, templateId, { name, date, className }); */
    toast(
      "[카카오 예약] " + name + "님, " + when + " " + cls + " 보강 예약이 확정되었습니다. (발송 예약)",
      "ok"
    );
    render();
  }

  function requestMakeupChange(id) {
    var row = findMakeupById(id);
    if (!row) return;
    var name = String(row.memberName || "").trim() || "회원";
    var list = JBData.getMakeup().slice();
    var idx = list.findIndex(function (m) {
      return m.id === id;
    });
    if (idx < 0) return;
    row.status = ST.CHANGE_REQ;
    row.updatedAt = new Date().toISOString();
    list[idx] = row;
    JBData.saveMakeup(list);
    /* 추후 카카오 API */
    toast("[카카오 예약] " + name + "님, 보강 예약 변경을 요청드립니다. 신청 링크에서 다시 접수해 주세요. (발송 예약)", "ok");
    render();
  }

  function syncPageSizeFromSelect(v) {
    if (v === 50 || v === 100 || v === 300) {
      state.pageSize = v;
      try {
        localStorage.setItem(LS_PAGE, String(v));
      } catch (e) {}
      state.consultPage = 0;
      state.applyPage = 0;
      var a = $("mkApplyPageSize");
      var c = $("mkConsultPageSize");
      if (a) a.value = String(v);
      if (c) c.value = String(v);
      render();
    }
  }

  function init() {
    JBAppShell.init({ activeNav: "makeup", pageTitle: "제이비스포츠 관리프로그램" });
    if (!window.JBData || !window.JBAuth || !JBAuth.getCurrentUser()) return;

    state.pageSize = loadPageSize();
    var pa = $("mkApplyPageSize");
    var pc = $("mkConsultPageSize");
    if (pa) pa.value = String(state.pageSize);
    if (pc) pc.value = String(state.pageSize);

    $("mkWorkspaceTabConsult").addEventListener("click", function () {
      state.workspace = "consult";
      render();
    });
    $("mkWorkspaceTabApply").addEventListener("click", function () {
      state.workspace = "apply";
      render();
    });

    $("mkConsultSearch").addEventListener("input", function () {
      state.consultSearch = this.value;
      state.consultPage = 0;
      render();
    });
    $("mkApplySearch").addEventListener("input", function () {
      state.applySearch = this.value;
      state.applyPage = 0;
      render();
    });

    $("btnMkConsultOpen").addEventListener("click", openMkConsultModal);
    $("mkConsultModalClose").addEventListener("click", closeMkConsultModal);
    $("mkConsultCancel").addEventListener("click", closeMkConsultModal);
    $("mkConsultModal").addEventListener("click", function (e) {
      if (e.target === $("mkConsultModal")) closeMkConsultModal();
    });
    $("mkConsultForm").addEventListener("submit", function (e) {
      e.preventDefault();
      saveMkConsultFromForm();
    });
    bindPhoneInput($("mkConsultPhone"));

    $("mkConsultCbSelectAll").addEventListener("change", function () {
      var on = this.checked;
      document.querySelectorAll("#mkConsultTbody .mk-consult-row-cb").forEach(function (cb) {
        cb.checked = on;
        if (on) state.consultSelectedIds[cb.value] = true;
        else delete state.consultSelectedIds[cb.value];
      });
      updateMkConsultDel();
    });
    $("mkConsultTbody").addEventListener("change", function (e) {
      var t = e.target;
      if (!t.classList || !t.classList.contains("mk-consult-row-cb")) return;
      if (t.checked) state.consultSelectedIds[t.value] = true;
      else delete state.consultSelectedIds[t.value];
      syncMkConsultSelectAll();
      updateMkConsultDel();
    });
    $("mkConsultTbody").addEventListener("click", function (e) {
      var btn = e.target.closest("[data-mk-consult-act]");
      if (!btn || !btn.getAttribute("data-mk-consult-id")) return;
      e.preventDefault();
      if (btn.getAttribute("data-mk-consult-act") === "send") {
        sendMakeupLinkForConsult(btn.getAttribute("data-mk-consult-id"));
      }
    });
    $("btnMkConsultBulkDelete").addEventListener("click", function () {
      var ids = Object.keys(state.consultSelectedIds).filter(function (id) {
        return state.consultSelectedIds[id];
      });
      if (!ids.length) return;
      JBUI.confirm("선택한 " + ids.length + "건의 보강상담 기록을 삭제할까요?", {
        title: "보강상담 삭제",
        confirmText: "삭제",
        cancelText: "취소",
      }).then(function (ok) {
        if (!ok) return;
        var set = {};
        ids.forEach(function (id) {
          set[id] = true;
        });
        var next = JBData.getMakeupConsultations().filter(function (c) {
          return !set[c.id];
        });
        JBData.saveMakeupConsultations(next);
        state.consultSelectedIds = {};
        toast("삭제했습니다.", "ok");
        render();
      });
    });

    $("mkApplyCbSelectAll").addEventListener("change", function () {
      var on = this.checked;
      document.querySelectorAll("#mkApplyTbody .mk-apply-row-cb").forEach(function (cb) {
        cb.checked = on;
        if (on) state.applySelectedIds[cb.value] = true;
        else delete state.applySelectedIds[cb.value];
      });
      updateMkApplyDel();
    });
    $("mkApplyTbody").addEventListener("change", function (e) {
      var t = e.target;
      if (!t.classList || !t.classList.contains("mk-apply-row-cb")) return;
      if (t.checked) state.applySelectedIds[t.value] = true;
      else delete state.applySelectedIds[t.value];
      syncMkApplySelectAll();
      updateMkApplyDel();
    });
    $("mkApplyTbody").addEventListener("click", function (e) {
      var actBtn = e.target.closest("[data-makeup-act]");
      if (actBtn && actBtn.getAttribute("data-makeup-id")) {
        e.preventDefault();
        e.stopPropagation();
        var mid = actBtn.getAttribute("data-makeup-id");
        var act = actBtn.getAttribute("data-makeup-act");
        if (act === "confirm") confirmMakeupReservation(mid);
        else if (act === "change") requestMakeupChange(mid);
        return;
      }
    });
    $("btnMkApplyBulkDelete").addEventListener("click", function () {
      var ids = Object.keys(state.applySelectedIds).filter(function (id) {
        return state.applySelectedIds[id];
      });
      if (!ids.length) return;
      JBUI.confirm("선택한 " + ids.length + "건의 보강 기록을 삭제할까요?", {
        title: "보강 기록 삭제",
        confirmText: "삭제",
        cancelText: "취소",
      }).then(function (ok) {
        if (!ok) return;
        var set = {};
        ids.forEach(function (id) {
          set[id] = true;
        });
        var next = JBData.getMakeup().filter(function (m) {
          return !set[m.id];
        });
        JBData.saveMakeup(next);
        state.applySelectedIds = {};
        toast("삭제했습니다.", "ok");
        render();
      });
    });

    $("mkConsultPageSize").addEventListener("change", function () {
      syncPageSizeFromSelect(parseInt(this.value, 10));
    });
    $("mkApplyPageSize").addEventListener("change", function () {
      syncPageSizeFromSelect(parseInt(this.value, 10));
    });
    $("mkConsultPrev").addEventListener("click", function () {
      if (state.consultPage > 0) {
        state.consultPage--;
        render();
      }
    });
    $("mkConsultNext").addEventListener("click", function () {
      state.consultPage++;
      render();
    });
    $("mkApplyPrev").addEventListener("click", function () {
      if (state.applyPage > 0) {
        state.applyPage--;
        render();
      }
    });
    $("mkApplyNext").addEventListener("click", function () {
      state.applyPage++;
      render();
    });

    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible") render();
    });
    setInterval(function () {
      if (!document.hidden) render();
    }, 60000);

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if ($("mkConsultModal") && !$("mkConsultModal").hidden) closeMkConsultModal();
    });

    render();
  }

  function boot() {
    var p = JBAuth.waitForSession ? JBAuth.waitForSession() : Promise.resolve();
    p.then(function () {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
      } else {
        init();
      }
    });
  }
  boot();
})();
