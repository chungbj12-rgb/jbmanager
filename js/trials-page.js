(function () {
  var LS_PAGE = "jb_trials_page_size";

  var state = {
    workspace: "apply",
    tab: "all",
    search: "",
    consultSearch: "",
    page: 0,
    consultPage: 0,
    pageSize: 50,
    selectedIds: {},
    consultSelectedIds: {},
    detailId: null,
    scheduleEditMode: false,
  };

  function $(id) {
    return document.getElementById(id);
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function isoDate(d) {
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function parseISODate(s) {
    if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(String(s).trim())) return null;
    var p = String(s).trim().split("-").map(Number);
    return new Date(p[0], p[1] - 1, p[2]);
  }

  /** 다크 테마 달력 팝오버 (브라우저 기본 date 피커 대신) */
  var DatePicker = (function () {
    var pop;
    var anchor;
    var hiddenInput;
    var viewInput;
    var viewYear;
    var viewMonth;

    function ensurePop() {
      if (pop) return;
      pop = document.createElement("div");
      pop.className = "trial-date-picker-pop";
      pop.hidden = true;
      pop.setAttribute("role", "dialog");
      pop.setAttribute("aria-label", "날짜 선택");
      document.body.appendChild(pop);
    }

    function buildGrid() {
      var first = new Date(viewYear, viewMonth, 1);
      var startDow = first.getDay();
      var dim = new Date(viewYear, viewMonth + 1, 0).getDate();
      var prevDim = new Date(viewYear, viewMonth, 0).getDate();
      var dow = ["일", "월", "화", "수", "목", "금", "토"];
      var html = [];
      var i;
      for (i = 0; i < 7; i++) {
        html.push('<div class="trial-date-picker-pop__dow">' + dow[i] + "</div>");
      }
      for (i = 0; i < startDow; i++) {
        var pd = prevDim - startDow + i + 1;
        html.push('<div class="trial-date-picker-pop__muted">' + pd + "</div>");
      }
      var todayIso = isoDate(new Date());
      for (var day = 1; day <= dim; day++) {
        var dObj = new Date(viewYear, viewMonth, day);
        var isoStr = isoDate(dObj);
        var cls = "trial-date-picker-pop__day";
        if (isoStr === todayIso) cls += " trial-date-picker-pop__day--today";
        html.push('<button type="button" class="' + cls + '" data-iso="' + isoStr + '">' + day + "</button>");
      }
      var used = startDow + dim;
      var next = 1;
      while (used < 42) {
        html.push('<div class="trial-date-picker-pop__muted">' + next++ + "</div>");
        used++;
      }
      return '<div class="trial-date-picker-pop__grid">' + html.join("") + "</div>";
    }

    function render() {
      var head =
        '<div class="trial-date-picker-pop__head">' +
        '<button type="button" class="trial-date-picker-pop__nav" data-act="prev-y" aria-label="이전 해">«</button>' +
        '<button type="button" class="trial-date-picker-pop__nav" data-act="prev-m" aria-label="이전 달">‹</button>' +
        '<span class="trial-date-picker-pop__title">' +
        viewYear +
        "년 " +
        (viewMonth + 1) +
        "월</span>" +
        '<button type="button" class="trial-date-picker-pop__nav" data-act="next-m" aria-label="다음 달">›</button>' +
        '<button type="button" class="trial-date-picker-pop__nav" data-act="next-y" aria-label="다음 해">»</button>' +
        "</div>";
      pop.innerHTML = head + buildGrid();
    }

    function position() {
      if (!anchor || !pop) return;
      var r = anchor.getBoundingClientRect();
      var left = Math.max(8, Math.min(r.left, window.innerWidth - 308));
      var top = r.bottom + 6;
      if (top + 320 > window.innerHeight) top = Math.max(8, r.top - 8 - 320);
      pop.style.left = left + "px";
      pop.style.top = top + "px";
    }

    function applyValue(isoStr) {
      if (hiddenInput) hiddenInput.value = isoStr;
      if (viewInput) viewInput.value = isoStr;
      close();
    }

    function onPopClick(e) {
      var nav = e.target.closest("[data-act]");
      if (nav && nav.dataset.act) {
        var act = nav.dataset.act;
        if (act === "prev-m") {
          viewMonth--;
          if (viewMonth < 0) {
            viewMonth = 11;
            viewYear--;
          }
        } else if (act === "next-m") {
          viewMonth++;
          if (viewMonth > 11) {
            viewMonth = 0;
            viewYear++;
          }
        } else if (act === "prev-y") viewYear--;
        else if (act === "next-y") viewYear++;
        render();
        pop.onclick = onPopClick;
        return;
      }
      var dayBtn = e.target.closest("[data-iso]");
      if (dayBtn && dayBtn.dataset.iso) {
        applyValue(dayBtn.dataset.iso);
      }
    }

    function open(anchorEl, hiddenEl, viewEl) {
      ensurePop();
      anchor = anchorEl;
      hiddenInput = hiddenEl;
      viewInput = viewEl;
      var cur = parseISODate((hiddenEl && hiddenEl.value) || "") || new Date();
      viewYear = cur.getFullYear();
      viewMonth = cur.getMonth();
      render();
      pop.onclick = onPopClick;
      pop.hidden = false;
      position();
      window.addEventListener("resize", position);
    }

    function close() {
      if (pop) pop.hidden = true;
      window.removeEventListener("resize", position);
    }

    function isOpen() {
      return pop && !pop.hidden;
    }

    document.addEventListener("click", function (e) {
      if (!pop || pop.hidden) return;
      if (pop.contains(e.target)) return;
      if (anchor && anchor.contains(e.target)) return;
      close();
    });

    return { open: open, close: close, isOpen: isOpen };
  })();

  function loadPageSize() {
    try {
      var v = parseInt(localStorage.getItem(LS_PAGE), 10);
      if (v === 50 || v === 100 || v === 300) return v;
    } catch (e) {}
    return 50;
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
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

  function matchesTab(t) {
    var reg = JBData.isRegisteredMemberPhone(t.phone);
    if (state.tab === "registered") return reg;
    if (state.tab === "unregistered") return !reg;
    return true;
  }

  function matchesSearch(t, q) {
    if (!q) return true;
    var qn = q.toLowerCase().trim();
    var name = (t.applicantName || "").toLowerCase();
    var phone = JBData.normalizePhoneDigits(t.phone || "");
    var qd = JBData.normalizePhoneDigits(q);
    if (name.indexOf(qn) !== -1) return true;
    if (qd.length >= 3 && phone.indexOf(qd) !== -1) return true;
    return false;
  }

  function getConsultSortTimestamp(c) {
    if (!c) return 0;
    if (c.createdAt) {
      var x = new Date(c.createdAt);
      if (!isNaN(x.getTime())) return x.getTime();
    }
    return 0;
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

  function consultFilteredList() {
    var q = state.consultSearch.trim();
    return JBData.getTrialConsultations()
      .filter(function (c) {
        return matchesConsultSearch(c, q);
      })
      .sort(function (a, b) {
        return getConsultSortTimestamp(b) - getConsultSortTimestamp(a);
      });
  }

  /** 체험신청 탭: 기존 체험 목록·상태 관리(전체 체험 기록) */
  function filteredApplyList() {
    var q = state.search.trim();
    return JBData.getTrials()
      .filter(function (t) {
        return matchesTab(t) && matchesSearch(t, q);
      })
      .sort(function (a, b) {
        return JBData.getTrialSortTimestamp(b) - JBData.getTrialSortTimestamp(a);
      });
  }

  function trialStatusLabel(st) {
    var map = {
      상담전: "상담전",
      체험전: "체험전",
      체험완료: "체험완료",
      추가상담: "추가상담",
      후속등록: "등록 안내 완료",
      후속미등록: "미등록 안내 완료",
    };
    if (st && map[st]) return map[st];
    return st || "-";
  }

  function toast(msg, type) {
    if (window.JBUI && typeof JBUI.toast === "function") {
      JBUI.toast(msg, type);
      return;
    }
    var el = $("trialToast");
    if (!el) return;
    el.textContent = msg;
    el.className = "members-toast is-show" + (type === "err" ? " members-toast--err" : " members-toast--ok");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      el.className = "members-toast";
      el.textContent = "";
    }, 2800);
  }

  function updateTrialRecordStatus(id, nextStatus) {
    var list = JBData.getTrials().slice();
    var now = new Date().toISOString();
    var found = false;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id !== id) continue;
      list[i].trialStatus = nextStatus;
      list[i].updatedAt = now;
      list[i].consultationDone =
        nextStatus === "추가상담" || nextStatus === "후속등록" || nextStatus === "후속미등록";
      found = true;
      break;
    }
    if (!found) return;
    JBData.saveTrials(list);
    render();
    if (state.detailId === id) {
      var t = findTrialById(id);
      if (t && $("trialDetailConsult")) $("trialDetailConsult").textContent = trialStatusLabel(t.trialStatus);
    }
  }

  function renderTrialStatusCell(t) {
    var st = t.trialStatus || "상담전";
    var id = esc(t.id || "");
    if (st === "상담전") {
      return (
        '<button type="button" class="btn-trial-status" data-trial-act="consult-done" data-trial-id="' +
        id +
        '">상담완료</button>'
      );
    }
    if (st === "체험전") {
      return '<span class="trial-status-note">체험 예정</span>';
    }
    if (st === "체험완료") {
      return (
        '<button type="button" class="btn-trial-status" data-trial-act="to-extra" data-trial-id="' +
        id +
        '">추가상담</button>'
      );
    }
    if (st === "추가상담") {
      return (
        '<div class="trial-status-split">' +
        '<button type="button" class="btn-trial-status btn-trial-status--half" data-trial-act="path-registered" data-trial-id="' +
        id +
        '">등록</button>' +
        '<button type="button" class="btn-trial-status btn-trial-status--half btn-trial-status--muted" data-trial-act="path-unregistered" data-trial-id="' +
        id +
        '">미등록</button>' +
        "</div>"
      );
    }
    if (st === "후속등록" || st === "후속미등록") {
      return '<span class="trial-status-done">' + esc(trialStatusLabel(st)) + "</span>";
    }
    return esc(String(st));
  }

  function pruneSelectedToFiltered(list) {
    var set = {};
    for (var i = 0; i < list.length; i++) set[list[i].id] = true;
    Object.keys(state.selectedIds).forEach(function (id) {
      if (!set[id]) delete state.selectedIds[id];
    });
  }

  function bulkSelectedCount() {
    return Object.keys(state.selectedIds).filter(function (id) {
      return state.selectedIds[id];
    }).length;
  }

  function updateDeleteBtn() {
    var btn = $("btnTrialBulkDelete");
    if (!btn) return;
    var n = bulkSelectedCount();
    btn.disabled = n === 0;
    btn.setAttribute("aria-label", n ? "선택 " + n + "건 삭제" : "선택 항목 삭제");
  }

  function pruneConsultSelectedToFiltered(list) {
    var set = {};
    for (var i = 0; i < list.length; i++) set[list[i].id] = true;
    Object.keys(state.consultSelectedIds).forEach(function (id) {
      if (!set[id]) delete state.consultSelectedIds[id];
    });
  }

  function bulkConsultSelectedCount() {
    return Object.keys(state.consultSelectedIds).filter(function (id) {
      return state.consultSelectedIds[id];
    }).length;
  }

  function updateConsultDeleteBtn() {
    var btn = $("btnConsultBulkDelete");
    if (!btn) return;
    var n = bulkConsultSelectedCount();
    btn.disabled = n === 0;
    btn.setAttribute("aria-label", n ? "선택 " + n + "건 삭제" : "선택 항목 삭제");
  }

  function syncConsultSelectAllFromPage() {
    var cbs = document.querySelectorAll("#consultTbody .consult-row-cb");
    var sa = $("consultCbSelectAll");
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

  function syncSelectAllFromPage() {
    var cbs = document.querySelectorAll("#trialTbody .trial-row-cb");
    var sa = $("trialCbSelectAll");
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

  function renderTabs() {
    var all = $("tabAll");
    var reg = $("tabRegistered");
    var un = $("tabUnregistered");
    if (!all || !reg || !un) return;
    all.classList.toggle("is-on", state.tab === "all");
    reg.classList.toggle("is-on", state.tab === "registered");
    un.classList.toggle("is-on", state.tab === "unregistered");
    all.setAttribute("aria-selected", state.tab === "all" ? "true" : "false");
    reg.setAttribute("aria-selected", state.tab === "registered" ? "true" : "false");
    un.setAttribute("aria-selected", state.tab === "unregistered" ? "true" : "false");
  }

  function renderWorkspaceTabs() {
    var c = $("workspaceTabConsult");
    var a = $("workspaceTabApply");
    if (!c || !a) return;
    c.classList.toggle("is-on", state.workspace === "consult");
    a.classList.toggle("is-on", state.workspace === "apply");
    c.setAttribute("aria-selected", state.workspace === "consult" ? "true" : "false");
    a.setAttribute("aria-selected", state.workspace === "apply" ? "true" : "false");
    var pc = $("panelTrialConsult");
    var pa = $("panelTrialApply");
    if (pc) pc.hidden = state.workspace !== "consult";
    if (pa) pa.hidden = state.workspace !== "apply";
  }

  function renderConsultPanel() {
    var list = consultFilteredList();
    pruneConsultSelectedToFiltered(list);
    var total = list.length;
    var cnt = $("consultCount");
    if (cnt) cnt.textContent = "상담 " + total + "건";

    var ps = state.pageSize;
    var pages = Math.max(1, Math.ceil(total / ps));
    if (state.consultPage >= pages) state.consultPage = Math.max(0, pages - 1);
    var start = state.consultPage * ps;
    var slice = list.slice(start, start + ps);

    var tb = $("consultTbody");
    if (!tb) return;

    if (slice.length === 0) {
      tb.innerHTML = '<tr><td colspan="6" class="cell-empty">검색 결과가 없습니다.</td></tr>';
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
              '<button type="button" class="btn-trial-status" data-consult-act="send" data-consult-id="' +
              id +
              '">상담완료</button>';
          }
          return (
            "<tr>" +
            '<td><input type="checkbox" class="member-cb consult-row-cb" value="' +
            esc(rawId) +
            '" aria-label="선택" /></td>' +
            "<td>" +
            esc(String(row.applicantName || "").trim() || "") +
            "</td>" +
            "<td>" +
            dash(row.phone) +
            "</td>" +
            "<td>" +
            dash(row.gender) +
            "</td>" +
            "<td>" +
            dash(row.grade) +
            "</td>" +
            '<td class="trial-status-td">' +
            statusCell +
            "</td>" +
            "</tr>"
          );
        })
        .join("");
    }

    document.querySelectorAll("#consultTbody .consult-row-cb").forEach(function (cb) {
      if (state.consultSelectedIds[cb.value]) cb.checked = true;
    });
    syncConsultSelectAllFromPage();
    updateConsultDeleteBtn();

    var pi = $("consultPageInfo");
    if (pi) pi.textContent = state.consultPage + 1 + " / " + pages;
    var prev = $("consultPrev");
    var next = $("consultNext");
    if (prev) prev.disabled = state.consultPage <= 0;
    if (next) next.disabled = state.consultPage >= pages - 1;

    var pss = $("consultPageSize");
    if (pss && pss.value !== String(ps)) pss.value = String(ps);
  }

  function renderApplyPanel() {
    renderTabs();
    var list = filteredApplyList();
    pruneSelectedToFiltered(list);
    var total = list.length;
    var cnt = $("trialCount");
    if (cnt) cnt.textContent = "전체 회원: " + total + "명";

    var ps = state.pageSize;
    var pages = Math.max(1, Math.ceil(total / ps));
    if (state.page >= pages) state.page = pages - 1;
    var start = state.page * ps;
    var slice = list.slice(start, start + ps);

    var tb = $("trialTbody");
    if (!tb) return;

    if (slice.length === 0) {
      tb.innerHTML =
        '<tr><td colspan="9" class="cell-empty">검색 결과가 없습니다.</td></tr>';
    } else {
      tb.innerHTML = slice
        .map(function (t) {
          var statusCell = renderTrialStatusCell(t);
          var nameCell =
            t.applicantName != null && String(t.applicantName).trim()
              ? '<button type="button" class="members-name-link" data-detail="' +
                esc(t.id || "") +
                '">' +
                esc(String(t.applicantName).trim()) +
                "</button>"
              : dash(t.applicantName);
          return (
            "<tr>" +
            '<td><input type="checkbox" class="member-cb trial-row-cb" value="' +
            esc(t.id || "") +
            '" aria-label="선택" /></td>' +
            "<td>" +
            nameCell +
            "</td>" +
            "<td>" +
            dash(t.gender) +
            "</td>" +
            "<td>" +
            dash(t.grade) +
            "</td>" +
            "<td>" +
            dash(t.phone) +
            "</td>" +
            "<td>" +
            dash(t.className) +
            "</td>" +
            "<td>" +
            dash(t.trialDate) +
            "</td>" +
            "<td>" +
            dash(t.school) +
            "</td>" +
            "<td class=\"trial-status-td\">" +
            statusCell +
            "</td>" +
            "</tr>"
          );
        })
        .join("");
    }

    document.querySelectorAll("#trialTbody .trial-row-cb").forEach(function (cb) {
      if (state.selectedIds[cb.value]) cb.checked = true;
    });
    syncSelectAllFromPage();
    updateDeleteBtn();

    var pi = $("trialPageInfo");
    if (pi) pi.textContent = state.page + 1 + " / " + pages;
    var prev = $("trialPrev");
    var next = $("trialNext");
    if (prev) prev.disabled = state.page <= 0;
    if (next) next.disabled = state.page >= pages - 1;

    var pss = $("trialPageSize");
    if (pss && pss.value !== String(ps)) pss.value = String(ps);
  }

  function render() {
    renderWorkspaceTabs();
    if (state.workspace === "consult") {
      renderConsultPanel();
    } else {
      renderApplyPanel();
    }
  }

  function showConsultModalErr(msg) {
    var el = $("consultModalErr");
    if (!el) return;
    if (msg) {
      el.textContent = msg;
      el.hidden = false;
    } else {
      el.textContent = "";
      el.hidden = true;
    }
  }

  function openConsultModal() {
    showConsultModalErr("");
    $("consultModal").hidden = false;
    document.body.classList.add("modal-open");
    $("consultName").value = "";
    $("consultPhone").value = "";
    $("consultGender").value = "";
    fillGradeSelect($("consultGrade"), "");
    $("consultName").focus();
  }

  function closeConsultModal() {
    $("consultModal").hidden = true;
    document.body.classList.remove("modal-open");
  }

  function saveConsultFromForm() {
    showConsultModalErr("");
    var applicantName = ($("consultName").value || "").trim();
    var phoneRaw = ($("consultPhone").value || "").trim();
    var gender = ($("consultGender").value || "").trim();
    var grade = ($("consultGrade").value || "").trim();
    if (!applicantName) {
      showConsultModalErr("이름을 입력해 주세요.");
      return;
    }
    if (!phoneValidDigits(phoneRaw)) {
      showConsultModalErr("전화번호를 010-XXXX-XXXX 형식(11자리)로 입력해 주세요.");
      return;
    }
    if (!gender) {
      showConsultModalErr("성별을 선택해 주세요.");
      return;
    }
    if (!grade) {
      showConsultModalErr("학년을 선택해 주세요.");
      return;
    }
    var phone = formatPhoneInputLive(phoneRaw);
    var list = JBData.getTrialConsultations().slice();
    var now = new Date().toISOString();
    list.push({
      id: "tc-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8),
      applicantName: applicantName,
      phone: phone,
      gender: gender,
      grade: grade,
      consultStatus: "상담대기",
      createdAt: now,
      updatedAt: now,
    });
    JBData.saveTrialConsultations(list);
    closeConsultModal();
    state.consultPage = 0;
    render();
  }

  function sendExperienceLinkForConsult(id) {
    var list = JBData.getTrialConsultations().slice();
    var row;
    var idx = -1;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        idx = i;
        row = list[i];
        break;
      }
    }
    if (idx < 0 || !row || row.consultStatus === "발송완료") return;
    var phone = (row.phone || "").trim();
    var experienceLink = JBData.getTrialApplicationLink();
    /* 추후 문자/카카오 API: sendMessage(phone, experienceLink); */
    void phone;
    void experienceLink;
    row.consultStatus = "발송완료";
    row.updatedAt = new Date().toISOString();
    list[idx] = row;
    JBData.saveTrialConsultations(list);
    toast("체험신청서 링크가 발송되었습니다.", "ok");
    render();
  }

  function fillGradeSelect(sel, selected) {
    if (!sel) return;
    var opts = JBData.getMemberGradeOptions();
    sel.innerHTML = '<option value="">' + "선택" + "</option>";
    for (var i = 0; i < opts.length; i++) {
      var o = document.createElement("option");
      o.value = opts[i];
      o.textContent = opts[i];
      sel.appendChild(o);
    }
    sel.value = (selected || "").trim() || "";
  }

  function findTrialById(id) {
    return JBData.getTrials().find(function (t) {
      return t.id === id;
    });
  }

  function setDetailScheduleView(iso) {
    if ($("trialDetailDateReadonly")) $("trialDetailDateReadonly").textContent = iso || "-";
    if ($("trialDetailDateHidden")) $("trialDetailDateHidden").value = iso || "";
    if ($("trialDetailDateView")) $("trialDetailDateView").value = iso || "";
  }

  function exitScheduleEditMode() {
    state.scheduleEditMode = false;
    var ro = $("trialDetailDateReadonly");
    var ed = $("trialDetailDateEditWrap");
    var btnCh = $("btnTrialDetailChangeSchedule");
    var btnAp = $("btnTrialDetailApplySchedule");
    var btnCn = $("btnTrialDetailCancelEdit");
    if (ro) ro.style.display = "";
    if (ed) ed.style.display = "none";
    if (btnCh) {
      btnCh.style.display = "";
      btnCh.disabled = false;
    }
    if (btnAp) btnAp.style.display = "none";
    if (btnCn) btnCn.style.display = "none";
    DatePicker.close();
  }

  function enterScheduleEditMode() {
    state.scheduleEditMode = true;
    var t = findTrialById(state.detailId);
    var iso = (t && t.trialDate) || JBData.dateKey(new Date());
    var ro = $("trialDetailDateReadonly");
    var ed = $("trialDetailDateEditWrap");
    var btnCh = $("btnTrialDetailChangeSchedule");
    var btnAp = $("btnTrialDetailApplySchedule");
    var btnCn = $("btnTrialDetailCancelEdit");
    if (ro) ro.style.display = "none";
    if (ed) ed.style.display = "flex";
    if (btnCh) btnCh.style.display = "none";
    if (btnAp) btnAp.style.display = "inline-flex";
    if (btnCn) btnCn.style.display = "inline-flex";
    setDetailScheduleView(iso);
  }

  function openTrialDetail(id) {
    var t = findTrialById(id);
    if (!t) return;
    state.detailId = id;
    exitScheduleEditMode();
    $("trialDetailName").textContent = (t.applicantName || "").trim() || "";
    $("trialDetailGender").textContent = (t.gender || "").trim() || "-";
    $("trialDetailGrade").textContent = (t.grade || "").trim() || "-";
    $("trialDetailPhone").textContent = (t.phone || "").trim() || "-";
    $("trialDetailClass").textContent = (t.className || "").trim() || "-";
    $("trialDetailSchool").textContent = (t.school || "").trim() || "-";
    $("trialDetailNotes").textContent = (t.notes || "").trim() || "-";
    $("trialDetailConsult").textContent = trialStatusLabel(t.trialStatus);
    $("trialDetailReg").textContent = JBData.isRegisteredMemberPhone(t.phone) ? "등록회원" : "미등록회원";
    setDetailScheduleView((t.trialDate || "").trim());
    $("trialDetailModal").hidden = false;
    document.body.classList.add("modal-open");
  }

  function closeTrialDetailModal() {
    DatePicker.close();
    state.detailId = null;
    state.scheduleEditMode = false;
    $("trialDetailModal").hidden = true;
    document.body.classList.remove("modal-open");
  }

  function applyTrialScheduleChange() {
    var id = state.detailId;
    var iso = ($("trialDetailDateHidden").value || "").trim();
    if (!id || !iso) return;
    if (!parseISODate(iso)) {
      return;
    }
    var list = JBData.getTrials().slice();
    var now = new Date().toISOString();
    var found = false;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        list[i].trialDate = iso;
        list[i].updatedAt = now;
        found = true;
        break;
      }
    }
    if (!found) return;
    JBData.saveTrials(list);
    exitScheduleEditMode();
    setDetailScheduleView(iso);
    render();
  }

  function init() {
    JBAppShell.init({ activeNav: "trials", pageTitle: "제이비스포츠 관리프로그램" });
    if (!window.JBData || !window.JBAuth || !JBAuth.getCurrentUser()) return;

    state.pageSize = loadPageSize();
    var pss0 = $("trialPageSize");
    if (pss0) pss0.value = String(state.pageSize);
    var pssC = $("consultPageSize");
    if (pssC) pssC.value = String(state.pageSize);

    $("workspaceTabConsult").addEventListener("click", function () {
      state.workspace = "consult";
      render();
    });
    $("workspaceTabApply").addEventListener("click", function () {
      state.workspace = "apply";
      render();
    });

    $("tabAll").addEventListener("click", function () {
      state.tab = "all";
      state.page = 0;
      render();
    });
    $("tabRegistered").addEventListener("click", function () {
      state.tab = "registered";
      state.page = 0;
      render();
    });
    $("tabUnregistered").addEventListener("click", function () {
      state.tab = "unregistered";
      state.page = 0;
      render();
    });

    $("trialSearch").addEventListener("input", function () {
      state.search = this.value;
      state.page = 0;
      render();
    });

    $("consultSearch").addEventListener("input", function () {
      state.consultSearch = this.value;
      state.consultPage = 0;
      render();
    });

    $("btnConsultOpen").addEventListener("click", openConsultModal);
    $("consultModalClose").addEventListener("click", closeConsultModal);
    $("consultCancel").addEventListener("click", closeConsultModal);
    $("consultModal").addEventListener("click", function (e) {
      if (e.target === $("consultModal")) closeConsultModal();
    });
    $("consultForm").addEventListener("submit", function (e) {
      e.preventDefault();
      saveConsultFromForm();
    });

    function syncPageSizeFromSelect(v) {
      if (v === 50 || v === 100 || v === 300) {
        state.pageSize = v;
        try {
          localStorage.setItem(LS_PAGE, String(v));
        } catch (err) {}
        state.page = 0;
        state.consultPage = 0;
        var ts = $("trialPageSize");
        var cs = $("consultPageSize");
        if (ts) ts.value = String(v);
        if (cs) cs.value = String(v);
        render();
      }
    }

    $("trialPageSize").addEventListener("change", function () {
      syncPageSizeFromSelect(parseInt(this.value, 10));
    });

    $("consultPageSize").addEventListener("change", function () {
      syncPageSizeFromSelect(parseInt(this.value, 10));
    });

    $("trialPrev").addEventListener("click", function () {
      if (state.page > 0) {
        state.page--;
        render();
      }
    });
    $("trialNext").addEventListener("click", function () {
      state.page++;
      render();
    });

    $("consultPrev").addEventListener("click", function () {
      if (state.consultPage > 0) {
        state.consultPage--;
        render();
      }
    });
    $("consultNext").addEventListener("click", function () {
      state.consultPage++;
      render();
    });

    bindPhoneInput($("consultPhone"));

    $("consultTbody").addEventListener("click", function (e) {
      var btn = e.target.closest("[data-consult-act]");
      if (!btn || !btn.getAttribute("data-consult-id")) return;
      e.preventDefault();
      if (btn.getAttribute("data-consult-act") === "send") {
        sendExperienceLinkForConsult(btn.getAttribute("data-consult-id"));
      }
    });

    $("consultCbSelectAll").addEventListener("change", function () {
      var on = this.checked;
      document.querySelectorAll("#consultTbody .consult-row-cb").forEach(function (cb) {
        cb.checked = on;
        if (on) state.consultSelectedIds[cb.value] = true;
        else delete state.consultSelectedIds[cb.value];
      });
      updateConsultDeleteBtn();
    });

    $("consultTbody").addEventListener("change", function (e) {
      var t = e.target;
      if (!t.classList || !t.classList.contains("consult-row-cb")) return;
      if (t.checked) state.consultSelectedIds[t.value] = true;
      else delete state.consultSelectedIds[t.value];
      syncConsultSelectAllFromPage();
      updateConsultDeleteBtn();
    });

    $("btnConsultBulkDelete").addEventListener("click", function () {
      var ids = Object.keys(state.consultSelectedIds).filter(function (id) {
        return state.consultSelectedIds[id];
      });
      if (!ids.length) return;
      JBUI.confirm("선택한 " + ids.length + "건의 체험상담 기록을 삭제할까요?", {
        title: "체험상담 삭제",
        confirmText: "삭제",
        cancelText: "취소",
      }).then(function (ok) {
        if (!ok) return;
        var set = {};
        ids.forEach(function (id) {
          set[id] = true;
        });
        var next = JBData.getTrialConsultations().filter(function (c) {
          return !set[c.id];
        });
        JBData.saveTrialConsultations(next);
        state.consultSelectedIds = {};
        toast("삭제했습니다.", "ok");
        render();
      });
    });

    $("trialCbSelectAll").addEventListener("change", function () {
      var on = this.checked;
      document.querySelectorAll("#trialTbody .trial-row-cb").forEach(function (cb) {
        cb.checked = on;
        if (on) state.selectedIds[cb.value] = true;
        else delete state.selectedIds[cb.value];
      });
      updateDeleteBtn();
    });

    $("trialTbody").addEventListener("change", function (e) {
      var t = e.target;
      if (!t.classList || !t.classList.contains("trial-row-cb")) return;
      if (t.checked) state.selectedIds[t.value] = true;
      else delete state.selectedIds[t.value];
      syncSelectAllFromPage();
      updateDeleteBtn();
    });

    function handleTrialStatusAction(id, act) {
      if (act === "consult-done") {
        updateTrialRecordStatus(id, "체험전");
        toast("체험 전 단계로 전환했습니다.", "ok");
        return;
      }
      if (act === "to-extra") {
        updateTrialRecordStatus(id, "추가상담");
        toast("추가상담 단계로 전환했습니다.", "ok");
        return;
      }
      if (act === "path-registered") {
        var tr = findTrialById(id);
        if (!tr || tr.trialStatus !== "추가상담") return;
        var phone = (tr.phone || "").trim();
        var regularAppLink = JBData.getRegularApplicationLink();
        if (regularAppLink) {
          /* 추후 문자/카카오 API: sendTo(phone, regularAppLink) */
        }
        state.tab = "registered";
        state.page = 0;
        updateTrialRecordStatus(id, "후속등록");
        toast((phone ? phone + " · " : "") + "정규신청 링크 발송을 예약했습니다.", "ok");
        return;
      }
      if (act === "path-unregistered") {
        var tu = findTrialById(id);
        if (!tu || tu.trialStatus !== "추가상담") return;
        state.tab = "unregistered";
        state.page = 0;
        updateTrialRecordStatus(id, "후속미등록");
        toast("미등록 회원 탭으로 전환했습니다.", "ok");
      }
    }

    $("trialTbody").addEventListener("click", function (e) {
      var actBtn = e.target.closest("[data-trial-act]");
      if (actBtn && actBtn.getAttribute("data-trial-id")) {
        e.preventDefault();
        e.stopPropagation();
        handleTrialStatusAction(actBtn.getAttribute("data-trial-id"), actBtn.getAttribute("data-trial-act"));
        return;
      }
      var btn = e.target.closest("[data-detail]");
      if (btn && btn.dataset.detail) {
        openTrialDetail(btn.dataset.detail);
      }
    });

    $("btnTrialBulkDelete").addEventListener("click", function () {
      var ids = Object.keys(state.selectedIds).filter(function (id) {
        return state.selectedIds[id];
      });
      if (!ids.length) return;
      JBUI.confirm("선택한 " + ids.length + "건의 체험 기록을 삭제할까요?", {
        title: "체험 기록 삭제",
        confirmText: "삭제",
        cancelText: "취소",
      }).then(function (ok) {
        if (!ok) return;
        var set = {};
        ids.forEach(function (id) {
          set[id] = true;
        });
        var next = JBData.getTrials().filter(function (t) {
          return !set[t.id];
        });
        JBData.saveTrials(next);
        state.selectedIds = {};
        toast("삭제했습니다.", "ok");
        render();
      });
    });

    $("trialDetailClose").addEventListener("click", closeTrialDetailModal);
    $("trialDetailModal").addEventListener("click", function (e) {
      if (e.target === $("trialDetailModal")) closeTrialDetailModal();
    });

    $("btnTrialDetailChangeSchedule").addEventListener("click", enterScheduleEditMode);
    $("btnTrialDetailApplySchedule").addEventListener("click", applyTrialScheduleChange);
    $("btnTrialDetailCancelEdit").addEventListener("click", function () {
      var t = findTrialById(state.detailId);
      exitScheduleEditMode();
      if (t) setDetailScheduleView((t.trialDate || "").trim());
    });

    var detailDateWrap = $("trialDetailDateEditWrap");
    if (detailDateWrap) {
      detailDateWrap.addEventListener("click", function (e) {
        if (e.target.closest("#trialDetailDateOpen") || e.target.id === "trialDetailDateView") {
          e.preventDefault();
          DatePicker.open(detailDateWrap, $("trialDetailDateHidden"), $("trialDetailDateView"));
        }
      });
    }

    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible") render();
    });
    setInterval(function () {
      if (!document.hidden) render();
    }, 60000);

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (DatePicker.isOpen()) {
        DatePicker.close();
        e.preventDefault();
        return;
      }
      if ($("consultModal") && !$("consultModal").hidden) closeConsultModal();
      else if ($("trialDetailModal") && !$("trialDetailModal").hidden) closeTrialDetailModal();
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
