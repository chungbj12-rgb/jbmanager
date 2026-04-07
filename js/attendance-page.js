/**
 * 출결관리 — 날짜·클래스별 정규/체험/보강 연동
 */
(function () {
  var DAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

  var state = {
    guestRows: [],
  };

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function formatKoreanDate(yyyyMmDd) {
    var p = String(yyyyMmDd || "")
      .trim()
      .split("-")
      .map(Number);
    if (p.length < 3 || isNaN(p[0])) return "";
    var d = new Date(p[0], p[1] - 1, p[2]);
    return p[0] + "년 " + pad2(p[1]) + "월 " + pad2(p[2]) + "일 (" + DAY_KO[d.getDay()] + ")";
  }

  function shiftDateKey(yyyyMmDd, deltaDays) {
    var p = String(yyyyMmDd || "")
      .trim()
      .split("-")
      .map(Number);
    if (p.length < 3) return JBData.dateKey(new Date());
    var d = new Date(p[0], p[1] - 1, p[2]);
    d.setDate(d.getDate() + deltaDays);
    return JBData.dateKey(d);
  }

  function formatClassTimeLabel(c) {
    var a = JBData.normalizeClassTime(c.startTime) || c.startTime || "";
    var b = JBData.normalizeClassTime(c.endTime) || c.endTime || "";
    return a + " ~ " + b;
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatPhoneDisplay(phone) {
    var d = JBData.normalizePhoneDigits(String(phone || ""));
    if (d.length === 11 && /^01[016789]/.test(d)) {
      return d.slice(0, 3) + "-" + d.slice(3, 7) + "-" + d.slice(7);
    }
    return String(phone || "").trim();
  }

  function trialTimeMatchesClass(trialTime, c) {
    var tt = String(trialTime || "").trim();
    if (!tt) return true;
    var nt = JBData.normalizeClassTime(tt);
    var st = JBData.normalizeClassTime(c.startTime) || c.startTime;
    if (nt && st && nt === st) return true;
    return true;
  }

  function buildRoster(dateStr, classObj) {
    var cn = (classObj.name || "").trim();
    var rows = [];

    var members = JBData.getMembers().filter(function (m) {
      return (m.enrollmentStatus || "active") === "active" && (m.className || "").trim() === cn;
    });
    members.sort(function (a, b) {
      return (a.name || "").localeCompare(b.name || "", "ko");
    });
    members.forEach(function (m) {
      rows.push({
        rowKey: "m:" + m.id,
        sourceType: "member",
        division: "regular",
        locked: true,
        name: (m.name || "").trim(),
        phone: formatPhoneDisplay(m.phone),
        memberId: m.id,
        trialId: "",
        makeupId: "",
        guestId: "",
      });
    });

    var trials = JBData.getTrials().filter(function (t) {
      if (String(t.trialDate || "").trim() !== dateStr) return false;
      if ((t.className || "").trim() !== cn) return false;
      return trialTimeMatchesClass(t.trialTime, classObj);
    });
    trials.sort(function (a, b) {
      return (a.applicantName || "").localeCompare(b.applicantName || "", "ko");
    });
    trials.forEach(function (t) {
      rows.push({
        rowKey: "t:" + t.id,
        sourceType: "trial",
        division: "trial",
        locked: true,
        name: (t.applicantName || "").trim(),
        phone: formatPhoneDisplay(t.phone),
        memberId: "",
        trialId: t.id,
        makeupId: "",
        guestId: "",
      });
    });

    var makeups = JBData.getMakeup().filter(function (mk) {
      if (String(mk.makeupDate || "").trim() !== dateStr) return false;
      return (mk.makeupClass || "").trim() === cn;
    });
    makeups.sort(function (a, b) {
      return (a.memberName || "").localeCompare(b.memberName || "", "ko");
    });
    makeups.forEach(function (mk) {
      rows.push({
        rowKey: "w:" + mk.id,
        sourceType: "makeup",
        division: "makeup",
        locked: true,
        name: (mk.memberName || "").trim(),
        phone: formatPhoneDisplay(mk.phone),
        memberId: "",
        trialId: "",
        makeupId: mk.id,
        guestId: "",
      });
    });

    var cid = classObj.id;
    var seenGuest = {};
    JBData.getAttendanceRecords().forEach(function (r) {
      if (r.date !== dateStr || r.classId !== cid || r.sourceType !== "guest" || !r.guestId) return;
      var gd = (r.guestDivision || "regular").trim();
      if (gd !== "trial" && gd !== "makeup") gd = "regular";
      rows.push({
        rowKey: "g:" + r.guestId,
        sourceType: "guest",
        division: gd,
        locked: false,
        name: (r.guestName || "").trim(),
        phone: formatPhoneDisplay(r.guestPhone),
        memberId: "",
        trialId: "",
        makeupId: "",
        guestId: r.guestId,
      });
      seenGuest[r.guestId] = true;
    });

    state.guestRows.forEach(function (g) {
      if (seenGuest[g.guestId]) return;
      var gd = (g.division || "regular").trim();
      if (gd !== "trial" && gd !== "makeup") gd = "regular";
      rows.push({
        rowKey: "g:" + g.guestId,
        sourceType: "guest",
        division: gd,
        locked: false,
        name: g.name || "",
        phone: g.phone || "",
        memberId: "",
        trialId: "",
        makeupId: "",
        guestId: g.guestId,
      });
    });

    return rows;
  }

  function findSavedAttendance(dateStr, classId, rowKey) {
    var list = JBData.getAttendanceRecords();
    for (var i = 0; i < list.length; i++) {
      var r = list[i];
      if (r.date === dateStr && r.classId === classId && r.rowKey === rowKey) return r;
    }
    if (rowKey.indexOf("m:") === 0) {
      var mid = rowKey.slice(2);
      for (var j = 0; j < list.length; j++) {
        var x = list[j];
        if (x.date === dateStr && x.memberId === mid && !x.classId) return x;
      }
    }
    return null;
  }

  function divisionLabel(div) {
    if (div === "trial") return "체험";
    if (div === "makeup") return "보강";
    return "정규";
  }

  function statusOptionsHtml(selected) {
    var opts = [
      { v: "", t: "선택" },
      { v: "present", t: "출석" },
      { v: "absent", t: "결석" },
      { v: "late", t: "지각" },
      { v: "excused", t: "사유" },
    ];
    return opts
      .map(function (o) {
        return (
          '<option value="' +
          o.v +
          '"' +
          (selected === o.v ? " selected" : "") +
          ">" +
          o.t +
          "</option>"
        );
      })
      .join("");
  }

  function render() {
    var dateStr = document.getElementById("attDateInput").value || JBData.dateKey(new Date());
    document.getElementById("attDateLabel").textContent = formatKoreanDate(dateStr);

    var sel = document.getElementById("attClassSelect");
    var dayIdx = new Date(dateStr + "T12:00:00").getDay();
    var classes = JBData.classesForWeekday(dayIdx);

    var prevVal = sel.value;
    sel.innerHTML = "";
    if (!classes.length) {
      var opt0 = document.createElement("option");
      opt0.value = "";
      opt0.textContent = "해당 요일에 등록된 클래스가 없습니다";
      sel.appendChild(opt0);
      sel.disabled = true;
      document.getElementById("attTbody").innerHTML = "";
      document.getElementById("attEmptyHint").hidden = false;
      document.getElementById("attEmptyHint").textContent = "이 날짜 요일에 운영하는 클래스가 없습니다. 클래스관리에서 요일·시간을 확인해 주세요.";
      return;
    }
    sel.disabled = false;
    document.getElementById("attEmptyHint").hidden = true;
    classes.forEach(function (c) {
      var o = document.createElement("option");
      o.value = c.id;
      o.textContent = (c.name || "") + " (" + formatClassTimeLabel(c) + ")";
      sel.appendChild(o);
    });
    if (prevVal && classes.some(function (c) { return c.id === prevVal; })) {
      sel.value = prevVal;
    } else {
      sel.value = classes[0].id;
    }

    var classId = sel.value;
    var classObj = classes.find(function (c) {
      return c.id === classId;
    });
    if (!classObj) return;

    var roster = buildRoster(dateStr, classObj);
    var tbody = document.getElementById("attTbody");
    tbody.innerHTML = roster
      .map(function (row, idx) {
        var saved = findSavedAttendance(dateStr, classId, row.rowKey);
        var st = saved && saved.status != null ? saved.status : "";
        var note = saved && saved.note != null ? saved.note : "";

        var divSel =
          '<select class="att-cell-select att-field-div" data-row-key="' +
          escapeHtml(row.rowKey) +
          '" ' +
          (row.locked ? "disabled" : "") +
          ">";
        ["regular", "trial", "makeup"].forEach(function (dv) {
          divSel +=
            '<option value="' +
            dv +
            '"' +
            (row.division === dv ? " selected" : "") +
            ">" +
            divisionLabel(dv) +
            "</option>";
        });
        divSel += "</select>";

        var nameField =
          row.sourceType === "guest"
            ? '<input type="text" class="att-cell-input att-field-name" data-row-key="' +
              escapeHtml(row.rowKey) +
              '" value="' +
              escapeHtml(row.name) +
              '" placeholder="이름" />'
            : "<span>" + escapeHtml(row.name) + "</span>";

        var phoneField =
          row.sourceType === "guest"
            ? '<input type="text" class="att-cell-input att-field-phone" data-row-key="' +
              escapeHtml(row.rowKey) +
              '" value="' +
              escapeHtml(row.phone) +
              '" placeholder="010-0000-0000" />'
            : "<span>" + escapeHtml(row.phone) + "</span>";

        return (
          "<tr data-row-key=\"" +
          escapeHtml(row.rowKey) +
          "\">" +
          "<td class=\"att-col-div\">" +
          divSel +
          "</td>" +
          "<td class=\"att-col-name\">" +
          nameField +
          "</td>" +
          "<td class=\"att-col-phone\">" +
          phoneField +
          "</td>" +
          "<td class=\"att-col-status\"><select class=\"att-cell-select att-field-status\" data-row-key=\"" +
          escapeHtml(row.rowKey) +
          "\">" +
          statusOptionsHtml(st) +
          "</select></td>" +
          "<td class=\"att-col-note\"><input type=\"text\" class=\"att-cell-input att-field-note\" data-row-key=\"" +
          escapeHtml(row.rowKey) +
          '" placeholder="특이사항 입력…" value="' +
          escapeHtml(note) +
          "\" /></td>" +
          "</tr>"
        );
      })
      .join("");
  }

  function collectRowsForSave(dateStr, classId) {
    var trs = document.querySelectorAll("#attTbody tr[data-row-key]");
    var out = [];
    for (var i = 0; i < trs.length; i++) {
      var tr = trs[i];
      var rk = tr.getAttribute("data-row-key");
      if (!rk) continue;
      var stEl = tr.querySelector(".att-field-status");
      var noteEl = tr.querySelector(".att-field-note");
      var status = stEl ? stEl.value : "";
      var note = noteEl ? noteEl.value : "";

      if (rk.indexOf("m:") === 0) {
        out.push({
          rowKey: rk,
          sourceType: "member",
          memberId: rk.slice(2),
          trialId: "",
          makeupId: "",
          guestId: "",
          guestName: "",
          guestPhone: "",
          guestDivision: "regular",
          status: status,
          note: note,
        });
      } else if (rk.indexOf("t:") === 0) {
        out.push({
          rowKey: rk,
          sourceType: "trial",
          memberId: "",
          trialId: rk.slice(2),
          makeupId: "",
          guestId: "",
          guestName: "",
          guestPhone: "",
          guestDivision: "regular",
          status: status,
          note: note,
        });
      } else if (rk.indexOf("w:") === 0) {
        out.push({
          rowKey: rk,
          sourceType: "makeup",
          memberId: "",
          trialId: "",
          makeupId: rk.slice(2),
          guestId: "",
          guestName: "",
          guestPhone: "",
          guestDivision: "regular",
          status: status,
          note: note,
        });
      } else if (rk.indexOf("g:") === 0) {
        var divEl = tr.querySelector(".att-field-div");
        var nm = tr.querySelector(".att-field-name");
        var ph = tr.querySelector(".att-field-phone");
        out.push({
          rowKey: rk,
          sourceType: "guest",
          memberId: "",
          trialId: "",
          makeupId: "",
          guestId: rk.slice(2),
          guestName: nm ? nm.value.trim() : "",
          guestPhone: ph ? ph.value.trim() : "",
          guestDivision: divEl ? divEl.value : "regular",
          status: status,
          note: note,
        });
      }
    }
    return out;
  }

  function init() {
    function inner() {
    JBAppShell.init({ activeNav: "attendance", pageTitle: "제이비스포츠 관리프로그램" });
    if (!JBAuth.getCurrentUser()) return;

    var dateInput = document.getElementById("attDateInput");
    dateInput.value = JBData.dateKey(new Date());

    document.getElementById("attDatePrev").addEventListener("click", function () {
      dateInput.value = shiftDateKey(dateInput.value, -1);
      state.guestRows = [];
      render();
    });
    document.getElementById("attDateNext").addEventListener("click", function () {
      dateInput.value = shiftDateKey(dateInput.value, 1);
      state.guestRows = [];
      render();
    });
    dateInput.addEventListener("change", function () {
      state.guestRows = [];
      render();
    });

    document.getElementById("attClassSelect").addEventListener("change", function () {
      state.guestRows = [];
      render();
    });

    document.getElementById("attBtnAdd").addEventListener("click", function () {
      var id = "g" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      state.guestRows.push({ guestId: id, name: "", phone: "", division: "regular" });
      render();
    });

    document.getElementById("attBtnSave").addEventListener("click", function () {
      var dateStr = dateInput.value || JBData.dateKey(new Date());
      var classId = document.getElementById("attClassSelect").value;
      if (!classId) {
        JBUI.toast("클래스를 선택해 주세요.", "err");
        return;
      }
      var rows = collectRowsForSave(dateStr, classId);
      JBData.saveAttendanceSessionBatch(dateStr, classId, rows);
      state.guestRows = [];
      JBUI.toast("저장했습니다.", "ok");
      render();
    });

    render();
    }
    var _p = JBAuth.waitForSession ? JBAuth.waitForSession() : Promise.resolve();
    _p.then(inner);
  }

  init();
})();
