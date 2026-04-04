(function () {
  var LS_PAGE_SIZE = "jb_members_page_size";

  function loadPageSize() {
    try {
      var v = parseInt(localStorage.getItem(LS_PAGE_SIZE), 10);
      if (v === 50 || v === 100 || v === 300) return v;
    } catch (e) {}
    return 50;
  }

  var state = {
    /** 재원생 목록 포함 (토글) */
    filterActive: true,
    /** 휴원생 목록 포함 (토글). 둘 다 켜면 재원+휴원 통합 표시 */
    filterInactive: false,
    search: "",
    page: 0,
    pageSize: 50,
    editingId: null,
    bulkResults: [],
    /** 체크된 회원 id (여러 페이지 유지) */
    selectedIds: {},
  };

  function $(id) {
    return document.getElementById(id);
  }

  function toast(msg, type) {
    var el = $("membersToast");
    if (!el) return;
    el.textContent = msg;
    el.className = "members-toast is-show" + (type === "err" ? " members-toast--err" : " members-toast--ok");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      el.classList.remove("is-show");
    }, 2800);
  }

  function showLoading(on) {
    var o = $("membersLoading");
    if (o) o.hidden = !on;
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

  function bindPhoneAutoFormat(id) {
    var el = $(id);
    if (!el) return;
    el.addEventListener("input", function () {
      this.value = formatPhoneInputLive(this.value);
      var len = this.value.length;
      this.setSelectionRange(len, len);
    });
  }

  function normalizePhone(s) {
    if (!s || !String(s).trim()) return "";
    if (window.JBAuth && JBAuth.normalizePhone) return JBAuth.normalizePhone(String(s));
    var d = String(s).replace(/\D/g, "");
    if (d.length === 11 && /^01/.test(d)) {
      return d.slice(0, 3) + "-" + d.slice(3, 7) + "-" + d.slice(7);
    }
    return String(s).trim();
  }

  function displayPhone(v) {
    var n = normalizePhone(v || "");
    if (n) return n;
    return formatPhoneInputLive(v || "");
  }

  function fillClassSelectInto(sel, selectedName, emptyLabel) {
    if (!sel) return;
    emptyLabel = emptyLabel || "클래스 선택";
    var names = JBData.getClasses()
      .map(function (c) {
        return (c.name || "").trim();
      })
      .filter(Boolean);
    names.sort(function (a, b) {
      return a.localeCompare(b, "ko");
    });
    var uniq = [];
    for (var i = 0; i < names.length; i++) {
      if (uniq.indexOf(names[i]) === -1) uniq.push(names[i]);
    }
    sel.innerHTML = '<option value="">' + emptyLabel + "</option>";
    for (var j = 0; j < uniq.length; j++) {
      var n = uniq[j];
      var opt = document.createElement("option");
      opt.value = n;
      opt.textContent = n;
      sel.appendChild(opt);
    }
    var selVal = (selectedName || "").trim();
    if (selVal && uniq.indexOf(selVal) === -1) {
      var o2 = document.createElement("option");
      o2.value = selVal;
      o2.textContent = selVal + " (클래스관리 미등록)";
      sel.appendChild(o2);
    }
    sel.value = selVal;
  }

  function fillClassSelect(selectedName) {
    fillClassSelectInto(
      $("mClass"),
      selectedName,
      "클래스 선택 (클래스관리에서 등록)"
    );
  }

  function fillDetailClassSelect(selectedName) {
    fillClassSelectInto($("dClass"), selectedName, "클래스 선택");
  }

  function ensureSelectValue(sel, value, suffix) {
    if (!sel) return;
    var v = (value || "").trim();
    if (!v) {
      sel.value = "";
      return;
    }
    var found = false;
    for (var i = 0; i < sel.options.length; i++) {
      if (sel.options[i].value === v) {
        found = true;
        break;
      }
    }
    if (!found) {
      var o = document.createElement("option");
      o.value = v;
      o.textContent = v + (suffix || " (기존)");
      sel.appendChild(o);
    }
    sel.value = v;
  }

  function phoneOk(s) {
    if (!s || !String(s).trim()) return true;
    var d = String(s).replace(/\D/g, "");
    return d.length >= 9 && d.length <= 12;
  }

  function enrollmentFilterMode() {
    var a = state.filterActive;
    var i = state.filterInactive;
    if (a && i) return "all";
    if (a) return "active";
    if (i) return "inactive";
    return "none";
  }

  function filteredList() {
    var list = JBData.getMembers().slice();
    var mode = enrollmentFilterMode();
    list = list.filter(function (m) {
      var st = m.enrollmentStatus || "active";
      if (mode === "none") return false;
      if (mode === "active" && st !== "active") return false;
      if (mode === "inactive" && st !== "inactive") return false;
      if (state.search) {
        var q = state.search.toLowerCase();
        if (!(m.name || "").toLowerCase().includes(q)) return false;
      }
      return true;
    });
    list.sort(function (a, b) {
      return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
    });
    return list;
  }

  function totalCount() {
    return JBData.getMembers().length;
  }

  function pruneSelectedIds() {
    var set = {};
    var members = JBData.getMembers();
    for (var i = 0; i < members.length; i++) set[members[i].id] = true;
    Object.keys(state.selectedIds).forEach(function (id) {
      if (!set[id]) delete state.selectedIds[id];
    });
  }

  function pruneSelectedToFiltered(list) {
    var set = {};
    for (var j = 0; j < list.length; j++) set[list[j].id] = true;
    Object.keys(state.selectedIds).forEach(function (id) {
      if (!set[id]) delete state.selectedIds[id];
    });
  }

  function bulkSelectedCount() {
    return Object.keys(state.selectedIds).filter(function (id) {
      return state.selectedIds[id];
    }).length;
  }

  function bulkSelectedIdList() {
    return Object.keys(state.selectedIds).filter(function (id) {
      return state.selectedIds[id];
    });
  }

  function syncSelectAllFromPage() {
    var cbs = document.querySelectorAll("#memberTbody .member-row-cb");
    var sa = $("cbSelectAll");
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

  function updateSelectionFab() {
    var fab = $("membersSelectionFab");
    var countEl = $("membersFabCount");
    var btnLeave = $("btnFabLeave");
    var btnReturn = $("btnFabReturn");
    var btnDel = $("btnFabDelete");
    if (!fab || !btnLeave || !btnReturn || !btnDel) return;
    var n = bulkSelectedCount();
    if (n === 0) {
      fab.hidden = true;
      return;
    }
    var mode = enrollmentFilterMode();
    if (mode === "none") {
      fab.hidden = true;
      return;
    }
    fab.hidden = false;
    if (countEl) countEl.textContent = n + "명 선택됨";
    if (mode === "active") {
      btnLeave.hidden = false;
      btnReturn.hidden = true;
      btnDel.hidden = true;
    } else if (mode === "inactive") {
      btnLeave.hidden = true;
      btnReturn.hidden = false;
      btnDel.hidden = false;
    } else {
      btnLeave.hidden = false;
      btnReturn.hidden = false;
      btnDel.hidden = false;
    }
  }

  function applyFilterTabUi() {
    var a = $("btnFilterActive");
    var i = $("btnFilterInactive");
    if (!a || !i) return;
    if (state.filterActive) a.classList.add("is-on");
    else a.classList.remove("is-on");
    if (state.filterInactive) i.classList.add("is-on");
    else i.classList.remove("is-on");
  }

  function parentPhonesListCell(m) {
    var mom = displayPhone(m.parentPhoneMother);
    var dad = displayPhone(m.parentPhoneFather);
    var hasM = m.parentPhoneMother != null && String(m.parentPhoneMother).trim() !== "";
    var hasD = m.parentPhoneFather != null && String(m.parentPhoneFather).trim() !== "";
    if (!hasM && !hasD) return '<span class="cell-dash">-</span>';
    return (
      '<span class="members-cell-parent">' +
      '<span class="members-cell-parent__line">모 ' +
      (hasM ? esc(mom) : '<span class="cell-dash">-</span>') +
      "</span>" +
      '<span class="members-cell-parent__line">부 ' +
      (hasD ? esc(dad) : '<span class="cell-dash">-</span>') +
      "</span>" +
      "</span>"
    );
  }

  function render() {
    pruneSelectedIds();
    var list = filteredList();
    pruneSelectedToFiltered(list);
    var total = list.length;
    var ps = state.pageSize;
    var pages = Math.max(1, Math.ceil(total / ps));
    if (state.page >= pages) state.page = pages - 1;
    var start = state.page * ps;
    var slice = list.slice(start, start + ps);

    var mc = $("membersCount");
    if (mc) mc.textContent = "전체 회원: " + totalCount() + "명";
    var fl = $("membersFilterLabel");
    if (fl) {
      var mode = enrollmentFilterMode();
      var filterNote = state.search || mode !== "active";
      fl.textContent =
        "현재 목록: " + total + "명" + (filterNote ? " (필터 적용)" : "");
    }

    var tb = $("memberTbody");
    if (slice.length === 0) {
      tb.innerHTML =
        '<tr><td colspan="8" style="text-align:center;padding:2rem;color:#9aa3b2">조건에 맞는 회원이 없습니다.</td></tr>';
    } else {
      tb.innerHTML = slice
        .map(function (m) {
          var nameBtn =
            m.name != null && String(m.name).trim()
              ? '<button type="button" class="members-name-link" data-detail="' +
                esc(m.id || "") +
                '">' +
                esc(String(m.name).trim()) +
                "</button>"
              : '<span class="cell-dash">-</span>';
          return (
            "<tr>" +
            '<td><input type="checkbox" class="member-row-cb member-cb" value="' +
            esc(m.id || "") +
            '" aria-label="선택" /></td>' +
            "<td>" +
            nameBtn +
            "</td>" +
            "<td>" +
            dash(m.gender) +
            "</td>" +
            "<td>" +
            dash(m.grade) +
            "</td>" +
            "<td>" +
            dash(displayPhone(m.phone)) +
            "</td>" +
            "<td class=\"members-td-parent\">" +
            parentPhonesListCell(m) +
            "</td>" +
            '<td class="members-td-school" title="' +
            esc((m.school || "").trim()) +
            '">' +
            dash(m.school) +
            "</td>" +
            "<td>" +
            dash(m.className) +
            "</td>" +
            "</tr>"
          );
        })
        .join("");
    }

    $("pageInfo").textContent = state.page + 1 + " / " + pages;
    $("btnPrev").disabled = state.page <= 0;
    $("btnNext").disabled = state.page >= pages - 1;

    document.querySelectorAll("#memberTbody .member-row-cb").forEach(function (cb) {
      if (state.selectedIds[cb.value]) cb.checked = true;
    });
    syncSelectAllFromPage();
    updateSelectionFab();

    var pss = $("memberPageSize");
    if (pss && pss.value !== String(ps)) pss.value = String(ps);
  }

  function openRegisterModal(editId) {
    state.editingId = editId || null;
    $("registerModalTitle").textContent = editId ? "회원 정보 수정" : "회원등록";
    $("btnRegisterSave").textContent = editId ? "저장" : "등록";
    var f = $("memberRegisterForm");
    f.reset();
    $("mId").value = "";
    if (editId) {
      var m = JBData.getMembers().find(function (x) {
        return x.id === editId;
      });
      if (!m) return;
      $("mId").value = m.id;
      $("mName").value = m.name || "";
      $("mGender").value = m.gender || "";
      $("mGrade").value = m.grade || "";
      $("mPhone").value = formatPhoneInputLive(m.phone || "");
      $("mMom").value = formatPhoneInputLive(m.parentPhoneMother || "");
      $("mDad").value = formatPhoneInputLive(m.parentPhoneFather || "");
      $("mAddr").value = m.address || "";
      $("mSchool").value = m.school || "";
      $("mTuition").value = m.tuition != null ? m.tuition : "";
      $("mPickup").value = m.pickupLocation || "";
      $("mDrop").value = m.dropoffLocation || "";
      fillClassSelect(m.className || "");
    } else {
      fillClassSelect("");
      $("mPhone").value = "";
      $("mMom").value = "";
      $("mDad").value = "";
    }
    $("registerModal").hidden = false;
    document.body.classList.add("modal-open");
  }

  function closeRegisterModal() {
    $("registerModal").hidden = true;
    state.editingId = null;
    refreshMemberModalsBackdrop();
  }

  var DETAIL_GRADE_HTML =
    '<option value="">선택</option>' +
    '<option value="1학년">1학년</option>' +
    '<option value="2학년">2학년</option>' +
    '<option value="3학년">3학년</option>' +
    '<option value="4학년">4학년</option>' +
    '<option value="5학년">5학년</option>' +
    '<option value="6학년">6학년</option>' +
    '<option value="중1">중1</option>' +
    '<option value="중2">중2</option>' +
    '<option value="중3">중3</option>' +
    '<option value="고1">고1</option>' +
    '<option value="고2">고2</option>' +
    '<option value="고3">고3</option>' +
    '<option value="성인">성인</option>';

  function openDetailModal(memberId) {
    var m = JBData.getMembers().find(function (x) {
      return x.id === memberId;
    });
    if (!m) {
      toast("회원을 찾을 수 없습니다.", "err");
      return;
    }
    $("dGender").innerHTML =
      '<option value="">선택안함</option><option value="남">남</option><option value="여">여</option>';
    $("dGrade").innerHTML = DETAIL_GRADE_HTML;

    $("dId").value = m.id;
    $("dName").value = (m.name || "").trim();
    var g = (m.gender || "").trim();
    if (g === "남" || g === "여") $("dGender").value = g;
    else if (g) ensureSelectValue($("dGender"), g, " (기존)");
    else $("dGender").value = "";

    var gr = (m.grade || "").trim();
    if (gr) ensureSelectValue($("dGrade"), gr, " (기존)");
    else $("dGrade").value = "";
    $("dAddr").value = (m.address || "").trim();
    $("dSchool").value = (m.school || "").trim();
    $("dTuition").value = m.tuition != null && m.tuition !== "" ? m.tuition : "";
    $("dPickup").value = (m.pickupLocation || "").trim();
    $("dDrop").value = (m.dropoffLocation || "").trim();
    $("dPhone").value = formatPhoneInputLive(m.phone || "");
    $("dDad").value = formatPhoneInputLive(m.parentPhoneFather || "");
    $("dMom").value = formatPhoneInputLive(m.parentPhoneMother || "");
    fillDetailClassSelect(m.className || "");
    $("memberDetailModal").hidden = false;
    document.body.classList.add("modal-open");
  }

  function closeDetailModal() {
    $("memberDetailModal").hidden = true;
    refreshMemberModalsBackdrop();
  }

  function parseDetailTuition() {
    var t = $("dTuition").value;
    if (t === "" || t == null) return null;
    var n = Number(t);
    return isNaN(n) ? null : n;
  }

  function collectDetailForm() {
    return {
      name: $("dName").value.trim(),
      gender: $("dGender").value,
      grade: $("dGrade").value.trim(),
      address: $("dAddr").value.trim(),
      school: $("dSchool").value.trim(),
      tuition: parseDetailTuition(),
      pickupLocation: ($("dPickup").value || "").trim(),
      dropoffLocation: ($("dDrop").value || "").trim(),
      phone: normalizePhone($("dPhone").value),
      parentPhoneFather: normalizePhone($("dDad").value),
      parentPhoneMother: normalizePhone($("dMom").value),
      className: ($("dClass").value || "").trim(),
    };
  }

  function parseTuitionInput() {
    var t = $("mTuition").value;
    if (t === "" || t == null) return null;
    var n = Number(t);
    return isNaN(n) ? null : n;
  }

  function collectForm() {
    return {
      name: $("mName").value.trim(),
      gender: $("mGender").value,
      grade: $("mGrade").value.trim(),
      phone: normalizePhone($("mPhone").value),
      parentPhoneMother: normalizePhone($("mMom").value),
      parentPhoneFather: normalizePhone($("mDad").value),
      address: $("mAddr").value.trim(),
      school: $("mSchool").value.trim(),
      className: ($("mClass") && $("mClass").value ? $("mClass").value : "").trim(),
      tuition: parseTuitionInput(),
      pickupLocation: ($("mPickup").value || "").trim(),
      dropoffLocation: ($("mDrop").value || "").trim(),
    };
  }

  function buildColumnMap(headerRow, applyDefaults) {
    if (applyDefaults == null) applyDefaults = true;
    var map = {};
    for (var c = 0; c < headerRow.length; c++) {
      var raw = String(headerRow[c] || "").trim();
      var h = raw.replace(/\s+/g, "");
      var k = null;
      if (/^(이름|성명)$/i.test(h) || /^name$/i.test(h)) k = "name";
      else if (/성별/.test(h)) k = "gender";
      else if (/학년/.test(h)) k = "grade";
      else if (
        /학부모전화번호\(모\)|\(모\)|어머니|모전화|모휴대폰/.test(h) ||
        (/모/.test(raw) && /전화|연락|휴대폰|핸드폰/.test(raw) && /학부모|부모/.test(raw))
      )
        k = "parentPhoneMother";
      else if (
        /학부모전화번호\(부\)|\(부\)|아버지|부전화|부휴대폰/.test(h) ||
        (/부/.test(raw) && /전화|연락|휴대폰|핸드폰/.test(raw) && /학부모|부모/.test(raw) && !/모/.test(raw))
      )
        k = "parentPhoneFather";
      else if (h === "학부모전화번호" || h === "학부모연락처" || h === "부모전화번호") k = "parentPhoneMother";
      else if (/학생/.test(h) && /전화|연락|휴대폰/.test(h)) k = "phone";
      else if (/전화|연락|휴대폰|핸드폰/.test(h) && !/부모|학부모/.test(h)) k = "phone";
      else if (/주소/.test(h)) k = "address";
      else if (/학교/.test(h)) k = "school";
      else if (/클래스|수강반|클래스명/.test(h)) k = "className";
      else if (/수강료|금액/.test(h)) k = "tuition";
      if (k != null) map[k] = c;
    }
    if (applyDefaults) {
      if (map.name == null && headerRow.length > 0) map.name = 0;
      if (map.phone == null && headerRow.length > 1 && map.parentPhoneMother == null) map.phone = 1;
    }
    return map;
  }

  function rowToObject(rowArr, colMap) {
    function val(key) {
      var c = colMap[key];
      if (c == null) return "";
      return rowArr[c] != null ? String(rowArr[c]).trim() : "";
    }
    var tuitionRaw = val("tuition");
    var tuition = null;
    if (tuitionRaw !== "") {
      var tn = Number(String(tuitionRaw).replace(/,/g, ""));
      if (!isNaN(tn)) tuition = tn;
    }
    return {
      name: val("name"),
      gender: val("gender"),
      grade: val("grade"),
      phone: val("phone"),
      parentPhoneMother: val("parentPhoneMother"),
      parentPhoneFather: val("parentPhoneFather"),
      address: val("address"),
      school: val("school"),
      className: val("className"),
      tuition: tuition,
    };
  }

  function validateBulkRow(o) {
    if (!o.name && !o.className && !o.phone && !o.parentPhoneMother && !o.parentPhoneFather) {
      return { ok: false, msg: "빈 행" };
    }
    if (!o.name) return { ok: false, msg: "이름 없음" };
    if (!o.className) return { ok: false, msg: "클래스 없음" };
    if (!phoneOk(o.phone)) return { ok: false, msg: "학생 전화 형식" };
    if (!phoneOk(o.parentPhoneMother)) return { ok: false, msg: "모 전화 형식" };
    if (!phoneOk(o.parentPhoneFather)) return { ok: false, msg: "부 전화 형식" };
    o.phone = normalizePhone(o.phone);
    o.parentPhoneMother = normalizePhone(o.parentPhoneMother);
    o.parentPhoneFather = normalizePhone(o.parentPhoneFather);
    return { ok: true, msg: "" };
  }

  function findBulkDuplicateInDb(o) {
    var md = (o.parentPhoneMother || "").replace(/\D/g, "");
    var fd = (o.parentPhoneFather || "").replace(/\D/g, "");
    if (md || fd) {
      return JBData.findDuplicateMemberByNameParent(o.name, o.parentPhoneMother, o.parentPhoneFather);
    }
    if (typeof JBData.findDuplicateMemberByNameClass === "function") {
      return JBData.findDuplicateMemberByNameClass(o.name, o.className);
    }
    return null;
  }

  function bulkRowDedupeKey(o) {
    return (
      o.name.trim() +
      "\t" +
      (o.className || "").trim() +
      "\t" +
      (o.parentPhoneMother || "").replace(/\D/g, "") +
      "\t" +
      (o.parentPhoneFather || "").replace(/\D/g, "")
    );
  }

  function processBulkSheet(rows) {
    if (!rows || rows.length < 2) {
      toast("데이터가 없습니다. 헤더와 데이터 행이 있는지 확인해 주세요.", "err");
      return false;
    }
    var header = rows[0].map(function (x) {
      return x;
    });
    var colMap = buildColumnMap(header, false);
    if (colMap.name == null) {
      toast("필수 열「이름」을 찾을 수 없습니다. 첫 행 헤더를 확인해 주세요.", "err");
      return false;
    }
    if (colMap.className == null) {
      toast("필수 열「클래스」를 찾을 수 없습니다. 첫 행 헤더를 확인해 주세요.", "err");
      return false;
    }

    var results = [];
    var pendingKeys = {};

    for (var r = 1; r < rows.length; r++) {
      var arr = rows[r];
      if (!arr || !arr.length) continue;
      var o = rowToObject(arr, colMap);
      var v = validateBulkRow(o);
      var line = r + 1;
      if (!v.ok) {
        if (v.msg === "빈 행") continue;
        results.push({ line: line, status: "err", msg: v.msg, data: o });
        continue;
      }
      var dup = findBulkDuplicateInDb(o);
      var k = bulkRowDedupeKey(o);
      if (pendingKeys[k]) {
        results.push({ line: line, status: "dup", msg: "파일 내 중복", data: o });
        continue;
      }
      pendingKeys[k] = true;
      if (dup) {
        results.push({ line: line, status: "dup", msg: "기존 회원과 중복", data: o });
        continue;
      }
      results.push({ line: line, status: "ok", msg: "정상", data: o });
    }

    if (results.length === 0) {
      toast("분석할 데이터 행이 없습니다.", "err");
      $("bulkFile").value = "";
      return false;
    }

    state.bulkResults = results;
    renderBulkPreview();
    $("bulkModal").hidden = false;
    document.body.classList.add("modal-open");
    updateBulkSubmitState();
    return true;
  }

  function renderBulkPreview() {
    var tb = $("bulkPreviewBody");
    var rows = state.bulkResults;
    tb.innerHTML = rows
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
          esc(r.data.name || "") +
          "</td>" +
          "<td>" +
          esc(r.data.className || "") +
          "</td>" +
          "<td>" +
          esc(displayPhone(r.data.phone)) +
          "</td>" +
          "<td>" +
          esc(displayPhone(r.data.parentPhoneMother)) +
          " / " +
          esc(displayPhone(r.data.parentPhoneFather)) +
          "</td>" +
          '<td class="' +
          cls +
          '">' +
          st +
          "</td>" +
          "<td>" +
          esc(r.msg || "") +
          "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  function updateBulkSubmitState() {
    var ok = state.bulkResults.some(function (r) {
      return r.status === "ok";
    });
    $("bulkSubmitBtn").disabled = !ok;
  }

  function refreshMemberModalsBackdrop() {
    var open =
      ($("memberDetailModal") && !$("memberDetailModal").hidden) ||
      ($("registerModal") && !$("registerModal").hidden) ||
      ($("bulkModal") && !$("bulkModal").hidden) ||
      ($("bulkUploadModal") && !$("bulkUploadModal").hidden);
    if (open) document.body.classList.add("modal-open");
    else document.body.classList.remove("modal-open");
  }

  function openBulkUploadModal() {
    $("bulkFile").value = "";
    $("bulkUploadModal").hidden = false;
    document.body.classList.add("modal-open");
  }

  function closeBulkUploadModal() {
    $("bulkUploadModal").hidden = true;
    var z = $("bulkDropZone");
    if (z) z.classList.remove("bulk-drop-zone--drag");
    $("bulkFile").value = "";
    refreshMemberModalsBackdrop();
  }

  function closeBulkModal() {
    $("bulkModal").hidden = true;
    state.bulkResults = [];
    $("bulkFile").value = "";
    refreshMemberModalsBackdrop();
  }

  function handleBulkExcelFile(file) {
    if (!file) return;
    var nm = (file.name || "").toLowerCase();
    if (!nm.endsWith(".xlsx") && !nm.endsWith(".xls")) {
      toast("Excel 파일(.xlsx, .xls)만 업로드할 수 있습니다.", "err");
      return;
    }
    if (typeof XLSX === "undefined") {
      toast("엑셀 라이브러리 로딩 실패. 네트워크를 확인해 주세요.", "err");
      return;
    }
    showLoading(true);
    var reader = new FileReader();
    reader.onload = function (e) {
      try {
        var data = new Uint8Array(e.target.result);
        var wb = XLSX.read(data, { type: "array" });
        var sheet = wb.Sheets[wb.SheetNames[0]];
        var rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: false });
        if (processBulkSheet(rows)) {
          $("bulkUploadModal").hidden = true;
          refreshMemberModalsBackdrop();
          toast("파일을 분석했습니다. 결과를 확인해 주세요.", "ok");
        }
      } catch (err) {
        console.error(err);
        toast("파일을 읽는 중 오류가 났습니다.", "err");
      }
      showLoading(false);
    };
    reader.onerror = function () {
      showLoading(false);
      toast("파일 읽기 실패", "err");
    };
    reader.readAsArrayBuffer(file);
  }

  function init() {
    state.pageSize = loadPageSize();
    var pss0 = $("memberPageSize");
    if (pss0) pss0.value = String(state.pageSize);

    if (!window.JBData || !window.JBAuth || !JBAuth.getCurrentUser()) return;

    $("memberPageSize").addEventListener("change", function () {
      var v = parseInt(this.value, 10);
      if (v === 50 || v === 100 || v === 300) {
        state.pageSize = v;
        try {
          localStorage.setItem(LS_PAGE_SIZE, String(v));
        } catch (e) {}
        state.page = 0;
        render();
      }
    });

    $("btnFilterActive").addEventListener("click", function () {
      var next = !state.filterActive;
      if (!next && !state.filterInactive) return;
      state.filterActive = next;
      state.selectedIds = {};
      applyFilterTabUi();
      state.page = 0;
      render();
    });
    $("btnFilterInactive").addEventListener("click", function () {
      var next = !state.filterInactive;
      if (!next && !state.filterActive) return;
      state.filterInactive = next;
      state.selectedIds = {};
      applyFilterTabUi();
      state.page = 0;
      render();
    });

    $("memberSearch").addEventListener("input", function () {
      state.search = this.value.trim();
      state.page = 0;
      render();
    });

    $("btnOpenRegister").addEventListener("click", function () {
      openRegisterModal(null);
    });
    $("btnBulkRegister").addEventListener("click", function () {
      openBulkUploadModal();
    });

    $("btnGradePromote").addEventListener("click", function () {
      if (typeof JBData.promoteAllMemberGradesOneStep !== "function") {
        toast("학년 올림 기능을 불러오지 못했습니다. 페이지를 새로고침해 주세요.", "err");
        return;
      }
      if (
        !confirm(
          "전체 회원의 학년을 한 단계 올립니다.\n" +
            "(1학년→2학년 … 6학년→중1, 중3→고1, 고3은 그대로)\n" +
            "위 형식으로 저장된 학년만 바뀝니다. 계속할까요?"
        )
      )
        return;
      var n = JBData.promoteAllMemberGradesOneStep();
      if (n) toast(n + "명의 학년을 올렸습니다.", "ok");
      else
        toast(
          "변경된 회원이 없습니다. (이미 고3이거나, 학년이 비었거나, 1학년·중1 형식이 아닐 수 있습니다)",
          "ok"
        );
      render();
    });

    bindPhoneAutoFormat("mPhone");
    bindPhoneAutoFormat("mMom");
    bindPhoneAutoFormat("mDad");
    bindPhoneAutoFormat("dPhone");
    bindPhoneAutoFormat("dDad");
    bindPhoneAutoFormat("dMom");

    $("bulkFile").addEventListener("change", function () {
      var file = this.files && this.files[0];
      if (!file) return;
      handleBulkExcelFile(file);
      this.value = "";
    });

    var bulkDropZone = $("bulkDropZone");
    if (bulkDropZone) {
      bulkDropZone.addEventListener("click", function (e) {
        if (e.target.closest("#btnBulkPickFile")) return;
        $("bulkFile").click();
      });
      $("btnBulkPickFile").addEventListener("click", function (e) {
        e.stopPropagation();
        $("bulkFile").click();
      });
      bulkDropZone.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          $("bulkFile").click();
        }
      });
      ["dragenter", "dragover"].forEach(function (ev) {
        bulkDropZone.addEventListener(ev, function (e) {
          e.preventDefault();
          e.stopPropagation();
          bulkDropZone.classList.add("bulk-drop-zone--drag");
        });
      });
      bulkDropZone.addEventListener("dragleave", function (e) {
        e.preventDefault();
        if (!bulkDropZone.contains(e.relatedTarget)) {
          bulkDropZone.classList.remove("bulk-drop-zone--drag");
        }
      });
      bulkDropZone.addEventListener("drop", function (e) {
        e.preventDefault();
        e.stopPropagation();
        bulkDropZone.classList.remove("bulk-drop-zone--drag");
        var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (f) handleBulkExcelFile(f);
      });
    }

    $("bulkUploadModalClose").addEventListener("click", closeBulkUploadModal);
    $("bulkUploadCancelBtn").addEventListener("click", closeBulkUploadModal);
    $("bulkUploadModal").addEventListener("click", function (e) {
      if (e.target === $("bulkUploadModal")) closeBulkUploadModal();
    });

    $("registerModalClose").addEventListener("click", closeRegisterModal);
    $("btnRegisterCancel").addEventListener("click", closeRegisterModal);
    $("bulkModalClose").addEventListener("click", closeBulkModal);
    $("bulkCancelBtn").addEventListener("click", closeBulkModal);

    $("registerModal").addEventListener("click", function (e) {
      if (e.target === $("registerModal")) closeRegisterModal();
    });
    $("bulkModal").addEventListener("click", function (e) {
      if (e.target === $("bulkModal")) closeBulkModal();
    });

    $("memberRegisterForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var data = collectForm();
      if (!JBData.memberHasAnyField(data)) {
        toast("최소 한 항목 이상 입력해 주세요.", "err");
        return;
      }
      var id = $("mId").value;
      if (id) {
        JBData.updateMember(id, Object.assign({}, data, { updatedAt: new Date().toISOString() }));
        toast("수정했습니다.", "ok");
      } else {
        JBData.addMemberFull(Object.assign({ enrollmentStatus: "active" }, data));
        toast("등록했습니다.", "ok");
      }
      closeRegisterModal();
      render();
    });

    $("bulkSubmitBtn").addEventListener("click", function () {
      var toAdd = state.bulkResults
        .filter(function (r) {
          return r.status === "ok";
        })
        .map(function (r) {
          return Object.assign({ enrollmentStatus: "active" }, r.data);
        });
      showLoading(true);
      try {
        var n = JBData.bulkAddMembers(toAdd);
        toast(n + "명 등록했습니다.", "ok");
        closeBulkModal();
        render();
      } finally {
        showLoading(false);
      }
    });

    $("btnPrev").addEventListener("click", function () {
      if (state.page > 0) {
        state.page--;
        render();
      }
    });
    $("btnNext").addEventListener("click", function () {
      state.page++;
      render();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if ($("memberDetailModal") && !$("memberDetailModal").hidden) closeDetailModal();
      else if ($("registerModal") && !$("registerModal").hidden) closeRegisterModal();
      else if ($("bulkModal") && !$("bulkModal").hidden) closeBulkModal();
      else if ($("bulkUploadModal") && !$("bulkUploadModal").hidden) closeBulkUploadModal();
    });

    $("memberDetailModalClose").addEventListener("click", closeDetailModal);
    $("btnDetailClose").addEventListener("click", closeDetailModal);
    $("memberDetailModal").addEventListener("click", function (e) {
      if (e.target === $("memberDetailModal")) closeDetailModal();
    });
    $("memberDetailForm").addEventListener("submit", function (e) {
      e.preventDefault();
    });
    $("btnDetailSave").addEventListener("click", function () {
      var id = $("dId").value;
      if (!id) return;
      var data = collectDetailForm();
      if (!JBData.memberHasAnyField(data)) {
        toast("최소 한 항목 이상 입력해 주세요.", "err");
        return;
      }
      JBData.updateMember(id, Object.assign({}, data, { updatedAt: new Date().toISOString() }));
      toast("회원 정보를 저장했습니다.", "ok");
      closeDetailModal();
      render();
    });

    $("memberTbody").addEventListener("click", function (e) {
      var t = e.target;
      if (t.dataset && t.dataset.detail) {
        openDetailModal(t.dataset.detail);
      }
    });

    $("memberTbody").addEventListener("change", function (e) {
      var t = e.target;
      if (!t.classList || !t.classList.contains("member-row-cb")) return;
      if (t.checked) state.selectedIds[t.value] = true;
      else delete state.selectedIds[t.value];
      syncSelectAllFromPage();
      updateSelectionFab();
    });

    $("cbSelectAll").addEventListener("change", function () {
      var on = this.checked;
      document.querySelectorAll("#memberTbody .member-row-cb").forEach(function (cb) {
        cb.checked = on;
        if (on) state.selectedIds[cb.value] = true;
        else delete state.selectedIds[cb.value];
      });
      updateSelectionFab();
    });

    $("btnFabLeave").addEventListener("click", function () {
      var ids = bulkSelectedIdList();
      if (!ids.length) return;
      var mode = enrollmentFilterMode();
      if (mode !== "active" && mode !== "all") return;
      var members = JBData.getMembers();
      var byId = {};
      for (var z = 0; z < members.length; z++) byId[members[z].id] = members[z];
      var targets = ids.filter(function (id) {
        var m = byId[id];
        return m && (m.enrollmentStatus || "active") === "active";
      });
      if (!targets.length) {
        toast("휴원 처리할 재원생이 선택되지 않았습니다.", "err");
        return;
      }
      if (!confirm("선택한 재원생 " + targets.length + "명을 휴원생으로 옮길까요?")) return;
      var now = new Date().toISOString();
      for (var i = 0; i < targets.length; i++) {
        JBData.updateMember(targets[i], { enrollmentStatus: "inactive", updatedAt: now });
      }
      state.selectedIds = {};
      toast(targets.length + "명을 휴원 처리했습니다.", "ok");
      render();
    });

    $("btnFabReturn").addEventListener("click", function () {
      var ids = bulkSelectedIdList();
      if (!ids.length) return;
      var modeR = enrollmentFilterMode();
      if (modeR !== "inactive" && modeR !== "all") return;
      var membersR = JBData.getMembers();
      var byIdR = {};
      for (var zr = 0; zr < membersR.length; zr++) byIdR[membersR[zr].id] = membersR[zr];
      var targetsR = ids.filter(function (id) {
        var m = byIdR[id];
        return m && (m.enrollmentStatus || "active") === "inactive";
      });
      if (!targetsR.length) {
        toast("복귀할 휴원생이 선택되지 않았습니다.", "err");
        return;
      }
      if (!confirm("선택한 휴원생 " + targetsR.length + "명을 재원생으로 복귀시킬까요?")) return;
      var nowR = new Date().toISOString();
      for (var j = 0; j < targetsR.length; j++) {
        JBData.updateMember(targetsR[j], { enrollmentStatus: "active", updatedAt: nowR });
      }
      state.selectedIds = {};
      toast(targetsR.length + "명을 재원으로 복귀했습니다.", "ok");
      render();
    });

    $("btnFabDelete").addEventListener("click", function () {
      var ids = bulkSelectedIdList();
      if (!ids.length) return;
      var modeD = enrollmentFilterMode();
      if (modeD !== "inactive" && modeD !== "all") return;
      var membersD = JBData.getMembers();
      var byIdD = {};
      for (var zd = 0; zd < membersD.length; zd++) byIdD[membersD[zd].id] = membersD[zd];
      var targetsD = ids.filter(function (id) {
        var m = byIdD[id];
        return m && (m.enrollmentStatus || "active") === "inactive";
      });
      if (!targetsD.length) {
        toast("삭제할 휴원생이 선택되지 않았습니다.", "err");
        return;
      }
      if (
        !confirm(
          "선택한 휴원생 " +
            targetsD.length +
            "명을 데이터에서 완전히 삭제할까요?\n이 작업은 되돌릴 수 없습니다."
        )
      )
        return;
      for (var k = 0; k < targetsD.length; k++) {
        JBData.deleteMember(targetsD[k]);
      }
      state.selectedIds = {};
      toast(targetsD.length + "명을 삭제했습니다.", "ok");
      render();
    });

    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
