(function () {
  var state = {
    classFilter: "",
    search: "",
  };

  function $(id) {
    return document.getElementById(id);
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

  function phoneTableCell(m) {
    var p = m.phone;
    if (!p || !String(p).trim()) return '<span class="cell-dash">-</span>';
    return esc(formatPhoneInputLive(p));
  }

  function isUClassName(name) {
    return /^U-/i.test(String(name || "").trim());
  }

  function getUClassNames() {
    return JBData.getClasses()
      .map(function (c) {
        return String(c.name || "").trim();
      })
      .filter(isUClassName)
      .sort(function (a, b) {
        return a.localeCompare(b, "ko");
      });
  }

  function fillClassFilterSelect() {
    var sel = $("clubClassFilter");
    if (!sel) return;
    var names = getUClassNames();
    var prev = state.classFilter;
    sel.innerHTML =
      '<option value="">전체 클래스</option>' +
      names
        .map(function (n) {
          return '<option value="' + esc(n) + '">' + esc(n) + "</option>";
        })
        .join("");
    if (prev && names.indexOf(prev) !== -1) sel.value = prev;
    else {
      sel.value = "";
      state.classFilter = "";
    }
  }

  function filteredMembers() {
    var q = state.search.trim().toLowerCase();
    var qDigits = state.search.replace(/\D/g, "");
    var cf = state.classFilter.trim();
    return JBData.getMembers().filter(function (m) {
      var cn = String(m.className || "").trim();
      if (!isUClassName(cn)) return false;
      if (cf && cn !== cf) return false;
      if (q) {
        var nm = (m.name || "").toLowerCase();
        var ph = String(m.phone || "").replace(/\D/g, "");
        if (!nm.includes(q) && !(qDigits && ph.includes(qDigits))) return false;
      }
      return true;
    });
  }

  function joinedLabel(v) {
    var x = String(v || "").trim();
    if (x === "Y" || x === "예") return "예";
    if (x === "N" || x === "아니오") return "아니오";
    return "-";
  }

  function maskRrn(s) {
    var raw = String(s || "").replace(/\D/g, "");
    if (!raw.length) {
      if (String(s || "").trim()) return "●●●●●●-●●●●●●●";
      return "-";
    }
    var front = raw.slice(0, 6);
    return front + "-●●●●●●●";
  }

  function toast(msg, type) {
    if (window.JBUI && typeof JBUI.toast === "function") {
      JBUI.toast(msg, type);
      return;
    }
    var el = $("clubToast");
    if (!el) return;
    el.textContent = msg;
    el.className = "members-toast is-show" + (type === "err" ? " members-toast--err" : " members-toast--ok");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      el.classList.remove("is-show");
    }, 2600);
  }

  function fillModalClassSelect(selected) {
    var sel = $("ctClass");
    if (!sel) return;
    var names = getUClassNames();
    sel.innerHTML = '<option value="">클래스 미배정</option>';
    names.forEach(function (n) {
      var o = document.createElement("option");
      o.value = n;
      o.textContent = n;
      sel.appendChild(o);
    });
    var s = String(selected || "").trim();
    if (s && names.indexOf(s) === -1) {
      var o2 = document.createElement("option");
      o2.value = s;
      o2.textContent = s + " (현재)";
      sel.appendChild(o2);
    }
    sel.value = s || "";
  }

  function openClubDetailModal(memberId) {
    var m = JBData.getMembers().find(function (x) {
      return x.id === memberId;
    });
    if (!m) {
      toast("회원을 찾을 수 없습니다.", "err");
      return;
    }
    $("ctId").value = m.id;
    $("ctName").value = (m.name || "").trim();
    $("ctGender").value = m.gender === "남" || m.gender === "여" ? m.gender : "";
    $("ctGrade").value = (m.grade || "").trim();
    $("ctPhone").value = formatPhoneInputLive(m.phone || "");
    $("ctSchool").value = (m.school || "").trim();
    fillModalClassSelect(m.className || "");
    $("ctJersey").value = (m.clubJersey || "").trim();
    $("ctUniform").value = (m.clubUniform || "").trim();
    var j = String(m.clubJoined || "").trim();
    $("ctJoined").value = j === "예" ? "Y" : j === "아니오" ? "N" : j === "Y" || j === "N" ? j : "";
    $("ctRrn").value = (m.clubRrn || "").trim();
    $("clubDetailModal").hidden = false;
    document.body.classList.add("modal-open");
  }

  function closeClubDetailModal() {
    $("clubDetailModal").hidden = true;
    document.body.classList.remove("modal-open");
  }

  function normalizePhone(s) {
    if (!s || !String(s).trim()) return "";
    if (window.JBAuth && JBAuth.normalizePhone) return JBAuth.normalizePhone(String(s));
    return formatPhoneInputLive(s);
  }

  function saveClubDetail() {
    var id = $("ctId").value;
    if (!id) return;
    var className = ($("ctClass").value || "").trim();
    if (className && !isUClassName(className)) {
      toast("U- 로 시작하는 클래스만 선택할 수 있습니다.", "err");
      return;
    }
    var data = {
      name: $("ctName").value.trim(),
      gender: $("ctGender").value,
      grade: $("ctGrade").value.trim(),
      phone: normalizePhone($("ctPhone").value),
      school: $("ctSchool").value.trim(),
      className: className,
      clubJersey: $("ctJersey").value.trim(),
      clubUniform: $("ctUniform").value.trim(),
      clubJoined: $("ctJoined").value,
      clubRrn: $("ctRrn").value.trim(),
      updatedAt: new Date().toISOString(),
    };
    if (!data.name) {
      toast("이름을 입력해 주세요.", "err");
      return;
    }
    JBData.updateMember(id, data);
    toast("저장했습니다.", "ok");
    closeClubDetailModal();
    render();
  }

  function removeFromUClass(memberId) {
    var m = JBData.getMembers().find(function (x) {
      return x.id === memberId;
    });
    if (!m) return;
    if (!isUClassName(m.className)) {
      toast("U클래스 소속이 아닙니다.", "err");
      return;
    }
    JBUI.confirm("이 회원을 U클래스에서 제외할까요?\n(회원 데이터는 유지되며 클래스만 해제됩니다.)", {
      title: "U클래스 제외",
      confirmText: "제외",
      cancelText: "취소",
    }).then(function (ok) {
      if (!ok) return;
      JBData.updateMember(memberId, {
        className: "",
        updatedAt: new Date().toISOString(),
      });
      toast("클래스에서 제외했습니다.", "ok");
      render();
    });
  }

  function render() {
    var list = filteredMembers();
    var countEl = $("clubMemberCount");
    if (countEl) countEl.textContent = list.length + "명";
    var tb = $("clubMemberTbody");
    if (!tb) return;
    if (!getUClassNames().length) {
      tb.innerHTML =
        '<tr><td colspan="10" class="club-empty-msg">클래스관리에 <strong>U-</strong>로 시작하는 클래스를 먼저 등록해 주세요.</td></tr>';
      return;
    }
    if (list.length === 0) {
      tb.innerHTML =
        '<tr><td colspan="10" class="club-empty-msg">U클래스에 등록된 회원이 없습니다. 회원관리에서 U클래스에 회원을 배정해 주세요.</td></tr>';
      return;
    }
    tb.innerHTML = list
      .map(function (m) {
        var nm =
          m.name != null && String(m.name).trim()
            ? '<button type="button" class="club-name-link" data-detail="' +
              esc(m.id) +
              '">' +
              esc(String(m.name).trim()) +
              "</button>"
            : '<span class="cell-dash">-</span>';
        return (
          "<tr>" +
          "<td>" +
          dash(m.className) +
          "</td>" +
          "<td>" +
          nm +
          "</td>" +
          "<td>" +
          dash(m.gender) +
          "</td>" +
          "<td>" +
          dash(m.grade) +
          "</td>" +
          "<td>" +
          phoneTableCell(m) +
          "</td>" +
          "<td>" +
          dash(m.clubJersey) +
          "</td>" +
          "<td>" +
          dash(m.clubUniform) +
          "</td>" +
          "<td>" +
          (joinedLabel(m.clubJoined) === "-"
            ? '<span class="cell-dash">-</span>'
            : esc(joinedLabel(m.clubJoined))) +
          "</td>" +
          "<td>" +
          esc(maskRrn(m.clubRrn)) +
          "</td>" +
          '<td class="club-actions">' +
          '<button type="button" class="club-btn-edit" data-edit="' +
          esc(m.id) +
          '">수정</button>' +
          '<button type="button" class="club-btn-remove" data-remove="' +
          esc(m.id) +
          '">삭제</button>' +
          "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  function init() {
    JBAppShell.init({ activeNav: "clubs", pageTitle: "제이비스포츠 관리프로그램" });
    if (!window.JBData || !window.JBAuth || !JBAuth.getCurrentUser()) return;

    fillClassFilterSelect();
    render();

    $("clubClassFilter").addEventListener("change", function () {
      state.classFilter = this.value;
      render();
    });

    $("clubSearch").addEventListener("input", function () {
      state.search = this.value;
      render();
    });

    $("clubBtnSync").addEventListener("click", function () {
      fillClassFilterSelect();
      render();
      toast("클래스 목록을 동기화했습니다.", "ok");
    });

    $("clubMemberTbody").addEventListener("click", function (e) {
      var t = e.target;
      if (t.dataset && t.dataset.detail) openClubDetailModal(t.dataset.detail);
      else if (t.dataset && t.dataset.edit) openClubDetailModal(t.dataset.edit);
      else if (t.dataset && t.dataset.remove) removeFromUClass(t.dataset.remove);
    });

    $("clubDetailModalClose").addEventListener("click", closeClubDetailModal);
    $("ctBtnCancel").addEventListener("click", closeClubDetailModal);
    $("clubDetailModal").addEventListener("click", function (e) {
      if (e.target === $("clubDetailModal")) closeClubDetailModal();
    });
    $("ctBtnSave").addEventListener("click", saveClubDetail);

    $("ctPhone").addEventListener("input", function () {
      this.value = formatPhoneInputLive(this.value);
      var len = this.value.length;
      this.setSelectionRange(len, len);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if ($("clubDetailModal") && !$("clubDetailModal").hidden) closeClubDetailModal();
    });
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
