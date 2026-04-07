/**
 * 클래스관리 페이지
 */
(function () {
  function runPage() {
  JBAppShell.init({ activeNav: "classes", pageTitle: "제이비스포츠 관리프로그램" });
  if (!JBAuth.getCurrentUser()) return;

  var DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
  var weekdayPillsEl = document.getElementById("weekdayPills");
  var tbody = document.getElementById("classTbody");
  var searchEl = document.getElementById("classSearch");
  var totalNumEl = document.getElementById("classesTotalNum");
  var cbAll = document.getElementById("cbSelectAllClasses");
  var selectionBar = document.getElementById("classesSelectionBar");
  var selectionCountEl = document.getElementById("classesSelectionCount");

  var addModal = document.getElementById("addClassModal");
  var bulkClassUploadModal = document.getElementById("bulkClassUploadModal");
  var bulkClassModal = document.getElementById("bulkClassModal");
  var bulkClassFile = document.getElementById("bulkClassFile");
  var classesBulkLoading = document.getElementById("classesBulkLoading");
  var bulkClassDropZone = document.getElementById("bulkClassDropZone");
  var bulkClassPreviewBody = document.getElementById("bulkClassPreviewBody");
  var bulkClassSubmitBtn = document.getElementById("bulkClassSubmitBtn");

  var classBulkResults = [];

  var cEditId = document.getElementById("cEditId");
  var addTitle = document.getElementById("addClassModalTitle");
  var btnClassSubmit = document.getElementById("btnClassSubmit");

  var selectedCoaches = [];
  var coachAddSelect = document.getElementById("coachAddSelect");
  var coachChips = document.getElementById("coachChips");

  var cStartH = document.getElementById("cStartH");
  var cStartM = document.getElementById("cStartM");
  var cEndH = document.getElementById("cEndH");
  var cEndM = document.getElementById("cEndM");

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function timeToMinutes(t) {
    var m = String(t || "").match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return NaN;
    return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  }

  function formatWeekdayLine(wd) {
    if (!wd || !wd.length) return "—";
    var u = {};
    for (var i = 0; i < wd.length; i++) u[wd[i]] = true;
    var order = [1, 2, 3, 4, 5, 6, 0];
    var out = "";
    for (var j = 0; j < order.length; j++) {
      if (u[order[j]]) out += DAY_LABELS[order[j]];
    }
    return out || "—";
  }

  function formatHHMM(t) {
    var p = JBData.normalizeClassTime(t);
    if (!p) return "";
    var x = p.split(":");
    return String(x[0]).padStart(2, "0") + ":" + x[1];
  }

  function formatTimeRange(a, b) {
    return formatHHMM(a) + " ~ " + formatHHMM(b);
  }

  function formatTuitionWon(n) {
    if (n == null || n === "" || isNaN(Number(n))) return "—";
    return Number(n).toLocaleString("ko-KR") + "원";
  }

  function memberNamesForClass(className) {
    var cn = (className || "").trim();
    var names = [];
    var members = JBData.getMembers();
    for (var i = 0; i < members.length; i++) {
      var m = members[i];
      if ((m.enrollmentStatus || "active") !== "active") continue;
      if ((m.className || "").trim() !== cn) continue;
      var nm = (m.name || "").trim();
      if (nm) names.push(nm);
    }
    names.sort(function (a, b) {
      return a.localeCompare(b, "ko");
    });
    return names;
  }

  function formatMemberCell(names) {
    if (!names.length) return '<span class="cell-dash">—</span>';
    var show = 2;
    var head = names.slice(0, show);
    var rest = names.length - head.length;
    var text = escapeHtml(head.join(", "));
    if (rest > 0) text += ' <span class="classes-extra-names">외 ' + rest + "명</span>";
    return text;
  }

  function countCellClass(cur, cap) {
    if (cap <= 0) return "classes-count-cell classes-count-cell--ok";
    var ratio = cur / cap;
    if (cur >= cap || ratio >= 0.85) return "classes-count-cell classes-count-cell--warn";
    return "classes-count-cell classes-count-cell--ok";
  }

  function fillTimeSelects() {
    function optHour(h) {
      var o = document.createElement("option");
      o.value = String(h).padStart(2, "0");
      o.textContent = String(h).padStart(2, "0");
      return o;
    }
    function optMin(m) {
      var o = document.createElement("option");
      o.value = m;
      o.textContent = m;
      return o;
    }
    var hours = [cStartH, cEndH];
    var mins = [cStartM, cEndM];
    for (var hi = 0; hi < hours.length; hi++) {
      var sel = hours[hi];
      sel.innerHTML = "";
      for (var h = 0; h <= 23; h++) sel.appendChild(optHour(h));
    }
    for (var mi = 0; mi < mins.length; mi++) {
      var s = mins[mi];
      s.innerHTML = "";
      s.appendChild(optMin("00"));
      s.appendChild(optMin("30"));
    }
  }

  function setTimePickers(startTime, endTime) {
    function split(t) {
      var d = JBData.normalizeClassTime(t) || "09:00";
      var p = d.split(":");
      return { h: p[0], m: p[1] };
    }
    var a = split(startTime);
    var b = split(endTime);
    cStartH.value = a.h;
    cStartM.value = a.m;
    cEndH.value = b.h;
    cEndM.value = b.m;
  }

  function readTimePickers() {
    var sh = cStartH.value;
    var sm = cStartM.value;
    var eh = cEndH.value;
    var em = cEndM.value;
    var st = JBData.normalizeClassTime(sh + ":" + sm);
    var et = JBData.normalizeClassTime(eh + ":" + em);
    return { startTime: st, endTime: et };
  }

  function buildWeekdayPills() {
    weekdayPillsEl.innerHTML = "";
    var row1 = document.createElement("div");
    row1.className = "weekday-row";
    var row2 = document.createElement("div");
    row2.className = "weekday-row";
    for (var i = 1; i <= 5; i++) {
      row1.appendChild(makeWdBtn(i));
    }
    for (var j = 6; j <= 6; j++) {
      row2.appendChild(makeWdBtn(j));
    }
    row2.appendChild(makeWdBtn(0));
    weekdayPillsEl.appendChild(row1);
    weekdayPillsEl.appendChild(row2);
  }

  function makeWdBtn(dayIndex) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "weekday-btn";
    b.setAttribute("data-wd", String(dayIndex));
    b.textContent = DAY_LABELS[dayIndex];
    b.addEventListener("click", function () {
      b.classList.toggle("is-on");
    });
    return b;
  }

  function getSelectedWeekdays() {
    var out = [];
    var nodes = weekdayPillsEl.querySelectorAll(".weekday-btn.is-on");
    for (var i = 0; i < nodes.length; i++) {
      out.push(Number(nodes[i].getAttribute("data-wd")));
    }
    return out.sort(function (a, b) {
      return a - b;
    });
  }

  function setSelectedWeekdays(wd) {
    var set = {};
    for (var i = 0; i < (wd || []).length; i++) set[wd[i]] = true;
    var btns = weekdayPillsEl.querySelectorAll(".weekday-btn");
    for (var j = 0; j < btns.length; j++) {
      var d = Number(btns[j].getAttribute("data-wd"));
      btns[j].classList.toggle("is-on", !!set[d]);
    }
  }

  function populateStaffDropdown() {
    var staff = JBAuth.listStaffSafe();
    var opts = '<option value="">담당 코치 선택</option>';
    for (var i = 0; i < staff.length; i++) {
      var n = (staff[i].name || "").trim();
      if (!n) continue;
      opts += '<option value="' + escapeHtml(n) + '">' + escapeHtml(n) + "</option>";
    }
    coachAddSelect.innerHTML = opts;
  }

  function renderCoachChips() {
    coachChips.innerHTML = selectedCoaches
      .map(function (name, idx) {
        return (
          '<span class="coach-chip">' +
          escapeHtml(name) +
          '<button type="button" data-coach-idx="' +
          idx +
          '" aria-label="' +
          escapeHtml(name) +
          ' 제거">×</button></span>'
        );
      })
      .join("");
    coachChips.querySelectorAll("button[data-coach-idx]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var ix = Number(btn.getAttribute("data-coach-idx"));
        selectedCoaches.splice(ix, 1);
        renderCoachChips();
        populateStaffDropdown();
      });
    });
  }

  coachAddSelect.addEventListener("change", function () {
    var v = (coachAddSelect.value || "").trim();
    coachAddSelect.value = "";
    if (!v) return;
    if (selectedCoaches.indexOf(v) >= 0) return;
    if (selectedCoaches.length >= 3) {
      JBUI.toast("담당 코치는 최대 3명까지 지정할 수 있습니다.", "err");
      return;
    }
    selectedCoaches.push(v);
    renderCoachChips();
  });

  function resetAddForm() {
    cEditId.value = "";
    document.getElementById("cName").value = "";
    setSelectedWeekdays([]);
    setTimePickers("09:00", "10:00");
    selectedCoaches = [];
    renderCoachChips();
    document.getElementById("cCapacity").value = "";
    document.getElementById("cTuition").value = "";
    addTitle.textContent = "클래스 추가";
    btnClassSubmit.textContent = "개설";
  }

  function openAddModal() {
    resetAddForm();
    populateStaffDropdown();
    addModal.hidden = false;
    document.getElementById("cName").focus();
    refreshClassesModalBackdrop();
  }

  function openEditModal(c) {
    resetAddForm();
    populateStaffDropdown();
    cEditId.value = c.id;
    document.getElementById("cName").value = c.name || "";
    setSelectedWeekdays(c.weekdays || [1, 2, 3, 4, 5]);
    setTimePickers(c.startTime, c.endTime);
    selectedCoaches = (c.coaches || []).slice(0, 3);
    renderCoachChips();
    document.getElementById("cCapacity").value = c.capacity != null ? String(c.capacity) : "";
    document.getElementById("cTuition").value = c.tuition != null && c.tuition !== "" ? String(c.tuition) : "";
    addTitle.textContent = "클래스 수정";
    btnClassSubmit.textContent = "저장";
    addModal.hidden = false;
    refreshClassesModalBackdrop();
  }

  function closeAddModal() {
    addModal.hidden = true;
    refreshClassesModalBackdrop();
  }

  function refreshClassesModalBackdrop() {
    var open =
      (addModal && !addModal.hidden) ||
      (bulkClassUploadModal && !bulkClassUploadModal.hidden) ||
      (bulkClassModal && !bulkClassModal.hidden);
    if (open) document.body.classList.add("modal-open");
    else document.body.classList.remove("modal-open");
  }

  function showClassesBulkLoading(on) {
    if (classesBulkLoading) classesBulkLoading.hidden = !on;
  }

  function openBulkClassUpload() {
    if (bulkClassModal) bulkClassModal.hidden = true;
    classBulkResults = [];
    if (bulkClassSubmitBtn) bulkClassSubmitBtn.disabled = true;
    if (bulkClassFile) bulkClassFile.value = "";
    if (bulkClassUploadModal) bulkClassUploadModal.hidden = false;
    refreshClassesModalBackdrop();
  }

  function closeBulkClassUpload() {
    if (bulkClassUploadModal) bulkClassUploadModal.hidden = true;
    if (bulkClassDropZone) bulkClassDropZone.classList.remove("bulk-drop-zone--drag");
    if (bulkClassFile) bulkClassFile.value = "";
    refreshClassesModalBackdrop();
  }

  function closeBulkClassResultModal() {
    if (bulkClassModal) bulkClassModal.hidden = true;
    classBulkResults = [];
    if (bulkClassFile) bulkClassFile.value = "";
    refreshClassesModalBackdrop();
  }

  function findClassNameColumn(header) {
    if (!header || !header.length) return 0;
    for (var i = 0; i < header.length; i++) {
      var h = String(header[i] || "").trim();
      if (h === "클래스명" || h === "클래스" || h === "반") return i;
    }
    return 0;
  }

  function renderBulkClassPreview() {
    if (!bulkClassPreviewBody) return;
    bulkClassPreviewBody.innerHTML = classBulkResults
      .map(function (r) {
        var cls =
          r.status === "ok" ? "bulk-status-ok" : r.status === "dup" ? "bulk-status-dup" : "bulk-status-err";
        var st = r.status === "ok" ? "정상" : r.status === "dup" ? "중복" : "오류";
        return (
          "<tr>" +
          "<td>" +
          r.line +
          "</td>" +
          "<td>" +
          escapeHtml(r.name || "") +
          "</td>" +
          '<td class="' +
          cls +
          '">' +
          st +
          "</td>" +
          "<td>" +
          escapeHtml(r.msg || "") +
          "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  function updateBulkClassSubmitState() {
    if (!bulkClassSubmitBtn) return;
    var ok = classBulkResults.some(function (r) {
      return r.status === "ok";
    });
    bulkClassSubmitBtn.disabled = !ok;
  }

  function processClassBulkSheet(rows) {
    if (!rows || rows.length < 2) {
      JBUI.toast("데이터가 없습니다. 헤더와 데이터 행이 있는지 확인해 주세요.", "err");
      return false;
    }
    var header = rows[0];
    var col = findClassNameColumn(header);
    var existing = {};
    JBData.getClasses().forEach(function (c) {
      existing[(c.name || "").trim()] = true;
    });
    var pending = {};
    var results = [];

    for (var r = 1; r < rows.length; r++) {
      var arr = rows[r];
      if (!arr || !arr.length) continue;
      var raw = arr[col];
      var name = raw == null ? "" : String(raw).trim();
      if (!name) continue;
      var line = r + 1;
      if (existing[name]) {
        results.push({ line: line, status: "dup", name: name, msg: "이미 등록된 클래스" });
        continue;
      }
      if (pending[name]) {
        results.push({ line: line, status: "dup", name: name, msg: "파일 내 중복" });
        continue;
      }
      pending[name] = true;
      results.push({ line: line, status: "ok", name: name, msg: "정상" });
    }

    if (results.length === 0) {
      JBUI.toast("분석할 데이터 행이 없습니다. 클래스명 열을 확인해 주세요.", "err");
      return false;
    }

    classBulkResults = results;
    renderBulkClassPreview();
    if (bulkClassModal) bulkClassModal.hidden = false;
    updateBulkClassSubmitState();
    refreshClassesModalBackdrop();
    return true;
  }

  function handleBulkClassExcelFile(file) {
    if (!file) return;
    var nm = (file.name || "").toLowerCase();
    if (!nm.endsWith(".xlsx") && !nm.endsWith(".xls")) {
      JBUI.toast("Excel 파일(.xlsx, .xls)만 업로드할 수 있습니다.", "err");
      return;
    }
    if (typeof XLSX === "undefined") {
      JBUI.toast("엑셀 라이브러리 로딩 실패. 네트워크를 확인해 주세요.", "err");
      return;
    }
    showClassesBulkLoading(true);
    var reader = new FileReader();
    reader.onload = function (e) {
      try {
        var data = new Uint8Array(e.target.result);
        var wb = XLSX.read(data, { type: "array" });
        var sheet = wb.Sheets[wb.SheetNames[0]];
        var rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: false });
        if (processClassBulkSheet(rows)) {
          if (bulkClassUploadModal) bulkClassUploadModal.hidden = true;
          JBUI.toast("파일을 분석했습니다. 결과를 확인해 주세요.", "ok");
        }
      } catch (err) {
        console.error(err);
        JBUI.toast("파일을 읽는 중 오류가 났습니다.", "err");
      }
      showClassesBulkLoading(false);
    };
    reader.onerror = function () {
      showClassesBulkLoading(false);
      JBUI.toast("파일 읽기 실패", "err");
    };
    reader.readAsArrayBuffer(file);
  }

  function getSearchQuery() {
    return (searchEl.value || "").trim().toLowerCase();
  }

  function classMatchesQuery(c, q) {
    if (!q) return true;
    var name = (c.name || "").toLowerCase();
    if (name.indexOf(q) >= 0) return true;
    var names = memberNamesForClass(c.name);
    for (var i = 0; i < names.length; i++) {
      if (names[i].toLowerCase().indexOf(q) >= 0) return true;
    }
    return false;
  }

  function visibleClasses() {
    var q = getSearchQuery();
    return JBData.getClasses().filter(function (c) {
      return classMatchesQuery(c, q);
    });
  }

  function updateSelectionBar() {
    var n = tbody.querySelectorAll('input.class-row-cb:checked').length;
    if (n > 0) {
      selectionBar.hidden = false;
      selectionCountEl.textContent = n + "개 선택됨";
    } else {
      selectionBar.hidden = true;
    }
  }

  function render() {
    var list = visibleClasses();
    var allClasses = JBData.getClasses();
    totalNumEl.textContent = String(allClasses.length);

    tbody.innerHTML = list
      .map(function (c) {
        var names = memberNamesForClass(c.name);
        var cur = JBData.countActiveMembersByClassName(c.name);
        var cap = c.capacity != null ? Number(c.capacity) : 20;
        if (isNaN(cap) || cap < 0) cap = 20;
        var coachStr = (c.coaches || []).filter(Boolean).join(", ");
        if (!coachStr) coachStr = '<span class="cell-dash">—</span>';
        else coachStr = escapeHtml(coachStr);
        return (
          "<tr data-class-id=\"" +
          escapeHtml(c.id) +
          "\">" +
          "<td><input type=\"checkbox\" class=\"classes-cb class-row-cb\" data-class-id=\"" +
          escapeHtml(c.id) +
          '" aria-label="선택" /></td>' +
          "<td><button type=\"button\" class=\"classes-name-btn\" data-edit-id=\"" +
          escapeHtml(c.id) +
          "\">" +
          escapeHtml(c.name || "") +
          "</button></td>" +
          "<td>" +
          escapeHtml(formatWeekdayLine(c.weekdays)) +
          "</td>" +
          "<td>" +
          escapeHtml(formatTimeRange(c.startTime, c.endTime)) +
          "</td>" +
          "<td>" +
          coachStr +
          "</td>" +
          '<td class="classes-td-names">' +
          formatMemberCell(names) +
          "</td>" +
          '<td class="' +
          countCellClass(cur, cap) +
          '">' +
          cur +
          "/" +
          cap +
          "</td>" +
          "<td>" +
          escapeHtml(formatTuitionWon(c.tuition)) +
          "</td>" +
          "</tr>"
        );
      })
      .join("");

    tbody.querySelectorAll(".classes-name-btn").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var id = btn.getAttribute("data-edit-id");
        var row = JBData.getClasses().find(function (x) {
          return x.id === id;
        });
        if (row) openEditModal(row);
      });
    });

    tbody.querySelectorAll("input.class-row-cb").forEach(function (cb) {
      cb.addEventListener("change", function () {
        updateSelectionBar();
        syncSelectAllState();
      });
    });

    cbAll.checked = false;
    updateSelectionBar();
  }

  function syncSelectAllState() {
    var boxes = tbody.querySelectorAll("input.class-row-cb");
    if (!boxes.length) {
      cbAll.checked = false;
      cbAll.indeterminate = false;
      return;
    }
    var checked = tbody.querySelectorAll("input.class-row-cb:checked").length;
    cbAll.checked = checked === boxes.length;
    cbAll.indeterminate = checked > 0 && checked < boxes.length;
  }

  cbAll.addEventListener("change", function () {
    var on = cbAll.checked;
    tbody.querySelectorAll("input.class-row-cb").forEach(function (cb) {
      cb.checked = on;
    });
    updateSelectionBar();
  });

  document.getElementById("btnOpenAddClass").addEventListener("click", openAddModal);
  document.getElementById("btnOpenBulkClass").addEventListener("click", function () {
    openBulkClassUpload();
  });
  document.getElementById("addClassModalClose").addEventListener("click", closeAddModal);
  document.getElementById("btnAddClassCancel").addEventListener("click", closeAddModal);
  document.getElementById("bulkClassUploadModalClose").addEventListener("click", closeBulkClassUpload);
  document.getElementById("bulkClassUploadCancelBtn").addEventListener("click", closeBulkClassUpload);
  document.getElementById("bulkClassModalClose").addEventListener("click", closeBulkClassResultModal);
  document.getElementById("bulkClassCancelBtn").addEventListener("click", closeBulkClassResultModal);

  addModal.addEventListener("click", function (e) {
    if (e.target === addModal) closeAddModal();
  });
  if (bulkClassUploadModal) {
    bulkClassUploadModal.addEventListener("click", function (e) {
      if (e.target === bulkClassUploadModal) closeBulkClassUpload();
    });
  }
  if (bulkClassModal) {
    bulkClassModal.addEventListener("click", function (e) {
      if (e.target === bulkClassModal) closeBulkClassResultModal();
    });
  }

  if (bulkClassFile) {
    bulkClassFile.addEventListener("change", function () {
      var file = this.files && this.files[0];
      if (!file) return;
      handleBulkClassExcelFile(file);
      this.value = "";
    });
  }

  if (bulkClassDropZone && bulkClassFile) {
    bulkClassDropZone.addEventListener("click", function (e) {
      if (e.target.closest("#btnBulkClassPickFile")) return;
      bulkClassFile.click();
    });
    var btnPick = document.getElementById("btnBulkClassPickFile");
    if (btnPick) {
      btnPick.addEventListener("click", function (e) {
        e.stopPropagation();
        bulkClassFile.click();
      });
    }
    bulkClassDropZone.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        bulkClassFile.click();
      }
    });
    ["dragenter", "dragover"].forEach(function (ev) {
      bulkClassDropZone.addEventListener(ev, function (e) {
        e.preventDefault();
        e.stopPropagation();
        bulkClassDropZone.classList.add("bulk-drop-zone--drag");
      });
    });
    bulkClassDropZone.addEventListener("dragleave", function (e) {
      e.preventDefault();
      if (!bulkClassDropZone.contains(e.relatedTarget)) {
        bulkClassDropZone.classList.remove("bulk-drop-zone--drag");
      }
    });
    bulkClassDropZone.addEventListener("drop", function (e) {
      e.preventDefault();
      e.stopPropagation();
      bulkClassDropZone.classList.remove("bulk-drop-zone--drag");
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) handleBulkClassExcelFile(f);
    });
  }

  if (bulkClassSubmitBtn) {
    bulkClassSubmitBtn.addEventListener("click", function () {
      var lines = classBulkResults
        .filter(function (r) {
          return r.status === "ok";
        })
        .map(function (r) {
          return r.name;
        });
      if (!lines.length) return;
      var text = lines.join("\n");
      var n = JBData.bulkAddClassTemplatesFromNames(text);
      closeBulkClassResultModal();
      closeBulkClassUpload();
      if (n === 0) JBUI.toast("추가된 클래스가 없습니다.", "err");
      else JBUI.toast(n + "개 클래스를 등록했습니다.", "ok");
      render();
    });
  }

  document.getElementById("addClassForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var name = (document.getElementById("cName").value || "").trim();
    if (!name) {
      JBUI.toast("클래스명을 입력해 주세요.", "err");
      return;
    }
    var wd = getSelectedWeekdays();
    if (!wd.length) {
      JBUI.toast("요일을 하나 이상 선택해 주세요.", "err");
      return;
    }
    var tt = readTimePickers();
    if (!tt.startTime || !tt.endTime) {
      JBUI.toast("시작·종료 시간을 올바르게 선택해 주세요. (분은 00 또는 30만 가능)", "err");
      return;
    }
    var sm = timeToMinutes(tt.startTime);
    var em = timeToMinutes(tt.endTime);
    if (isNaN(sm) || isNaN(em) || em <= sm) {
      JBUI.toast("종료 시간은 시작 시간보다 늦어야 합니다.", "err");
      return;
    }
    var capRaw = document.getElementById("cCapacity").value;
    var cap = capRaw === "" ? undefined : Number(capRaw);
    var tuitionRaw = document.getElementById("cTuition").value;
    var tuition = tuitionRaw === "" ? null : Number(tuitionRaw);

    var payload = {
      name: name,
      weekdays: wd,
      startTime: tt.startTime,
      endTime: tt.endTime,
      coaches: selectedCoaches.slice(),
      capacity: cap,
      tuition: tuition,
    };

    var editId = (cEditId.value || "").trim();
    if (editId) {
      JBData.updateClassTemplate(editId, payload);
      JBUI.toast("저장했습니다.", "ok");
    } else {
      JBData.addClassTemplate(payload);
      JBUI.toast("클래스를 개설했습니다.", "ok");
    }
    closeAddModal();
    render();
  });

  document.getElementById("btnDeleteSelectedClasses").addEventListener("click", function () {
    var ids = [];
    tbody.querySelectorAll('input.class-row-cb:checked').forEach(function (cb) {
      ids.push(cb.getAttribute("data-class-id"));
    });
    if (!ids.length) return;
    JBUI.confirm(ids.length + "개 클래스를 삭제할까요? 연결된 회원의 클래스명은 그대로이므로, 필요 시 회원관리에서 수정해 주세요.", {
      title: "클래스 삭제",
      confirmText: "삭제",
      cancelText: "취소",
    }).then(function (ok) {
      if (!ok) return;
      for (var i = 0; i < ids.length; i++) JBData.deleteClassTemplate(ids[i]);
      JBUI.toast("삭제했습니다.", "ok");
      render();
    });
  });

  searchEl.addEventListener("input", function () {
    render();
  });

  fillTimeSelects();
  buildWeekdayPills();
  setSelectedWeekdays([]);
  render();
  }
  if (JBAuth.waitForSession) {
    JBAuth.waitForSession().then(runPage);
  } else {
    runPage();
  }
})();
