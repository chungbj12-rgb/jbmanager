/**
 * 보호대신청 — 재고·연동·명단(탭·검색·체크 삭제)
 */
(function () {
  var shellOpts = { activeNav: "protective", pageTitle: "제이비스포츠 관리프로그램" };

  /* 비상 폴백: 이벤트 바인딩이 꼬여도 +추가 버튼은 항상 동작 */
  function openStockInlineFallback() {
    if (!window.JBData || !JBData.getProtectiveInventory) return;
    var sec = document.getElementById("editStockSection");
    var form = document.getElementById("editStockForm");
    if (!sec || !form) return;
    var inv = JBData.getProtectiveInventory();
    var rows = [
      { key: "knee_S", label: "무릎 S", value: inv.knee.S },
      { key: "knee_M", label: "무릎 M", value: inv.knee.M },
      { key: "knee_L", label: "무릎 L", value: inv.knee.L },
      { key: "elbow_S", label: "팔꿈치 S", value: inv.elbow.S },
      { key: "elbow_M", label: "팔꿈치 M", value: inv.elbow.M },
      { key: "elbow_L", label: "팔꿈치 L", value: inv.elbow.L },
    ];
    form.innerHTML = rows
      .map(function (r) {
        return (
          '<div class="protective-stock-edit__row">' +
          '<label for="stock_' +
          r.key +
          '">' +
          r.label +
          "</label>" +
          '<input class="auth-input" type="number" min="0" step="1" id="stock_' +
          r.key +
          '" name="' +
          r.key +
          '" value="' +
          String(r.value) +
          '" />' +
          "</div>"
        );
      })
      .join("");
    sec.hidden = false;
  }
  window.JBProtectiveOpenStockInline = openStockInlineFallback;

  function paintShell() {
    JBAppShell.init(shellOpts);
  }

  paintShell();
  requestAnimationFrame(function () {
    var aside = document.getElementById("app-sidebar");
    if (aside && !aside.querySelector(".app-nav") && JBAppShell.ensureSidebarPainted) {
      JBAppShell.ensureSidebarPainted();
    }
  });

  var listTab = "pending";
  var searchQuery = "";
  var selectedIds = {};

  function run() {
    if (run.__started) return;
    run.__started = true;

    paintShell();

    var tb = document.getElementById("tbody");
    var protEmpty = document.getElementById("protEmptyState");
    var protCountNum = document.getElementById("protCountNum");
    var protSearch = document.getElementById("protSearch");
    var tabPending = document.getElementById("tabProtPending");
    var tabDelivered = document.getElementById("tabProtDelivered");
    var btnBulkDelete = document.getElementById("btnProtBulkDelete");
    var protSelectAll = document.getElementById("protSelectAll");

    document.getElementById("d").value = JBData.dateKey(new Date());
    document.getElementById("applyUrlField").value = JBData.getProtectiveApplyPageUrl();

    function sizeLabel(r) {
      if (r.size && /^[SML]$/.test(r.size)) return r.size;
      var m = (r.itemSpec || "").match(/\b(S|M|L)\b/);
      return m ? m[1] : "—";
    }

    function normalizeRow(r) {
      var row = Object.assign({}, r);
      if (typeof row.delivered !== "boolean") {
        row.delivered = String(row.status || "").trim() === "수령완료";
      }
      if (typeof row.paid !== "boolean") row.paid = false;
      return row;
    }

    function getAllNormalized() {
      return JBData.getProtectiveRequests().map(normalizeRow);
    }

    function persistList(list) {
      JBData.saveProtectiveRequests(list);
    }

    function nameForFilter(r) {
      return (
        String(r.applicantName || "") +
        " " +
        String(r.studentName || "")
      ).toLowerCase();
    }

    function filteredRows() {
      var q = searchQuery.trim().toLowerCase();
      return getAllNormalized().filter(function (r) {
        if (listTab === "pending" && r.delivered) return false;
        if (listTab === "delivered" && !r.delivered) return false;
        if (!q) return true;
        return nameForFilter(r).indexOf(q) !== -1;
      });
    }

    function escapeHtml(s) {
      return String(s == null ? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/"/g, "&quot;");
    }

    function kneeCell(r) {
      if (r.productType === "knee") return escapeHtml(sizeLabel(r));
      return "—";
    }

    function elbowCell(r) {
      if (r.productType === "elbow") return escapeHtml(sizeLabel(r));
      return "—";
    }

    function displayName(r) {
      var n = escapeHtml(r.applicantName || "");
      if (r.studentName) {
        n += ' <span class="text-muted">(' + escapeHtml(r.studentName) + ")</span>";
      }
      return n;
    }

    function updateBulkDeleteUi() {
      var ids = Object.keys(selectedIds).filter(function (id) {
        return selectedIds[id];
      });
      var n = ids.length;
      if (!btnBulkDelete) return;
      if (n > 0) {
        btnBulkDelete.hidden = false;
        btnBulkDelete.disabled = false;
      } else {
        btnBulkDelete.hidden = true;
        btnBulkDelete.disabled = true;
      }
    }

    function renderList() {
      var rows = filteredRows();
      if (protCountNum) protCountNum.textContent = String(rows.length);

      if (!tb) return;

      if (rows.length === 0) {
        tb.innerHTML = "";
        if (protEmpty) {
          protEmpty.hidden = false;
        }
        if (protSelectAll) {
          protSelectAll.checked = false;
          protSelectAll.indeterminate = false;
        }
        updateBulkDeleteUi();
        return;
      }

      if (protEmpty) protEmpty.hidden = true;

      tb.innerHTML = rows
        .map(function (r) {
          var id = escapeHtml(r.id);
          var checked = selectedIds[r.id] ? " checked" : "";
          return (
            "<tr data-row-id=\"" +
            id +
            "\">" +
            '<td class="prot-td-check"><input type="checkbox" class="prot-row-check" data-id="' +
            id +
            '"' +
            checked +
            ' aria-label="선택" /></td>' +
            "<td>" +
            displayName(r) +
            "</td>" +
            "<td>" +
            escapeHtml(r.phone || "") +
            "</td>" +
            "<td>" +
            kneeCell(r) +
            "</td>" +
            "<td>" +
            elbowCell(r) +
            "</td>" +
            "<td>" +
            '<select class="prot-cell-select" data-id="' +
            id +
            '" data-field="paid" aria-label="입금여부">' +
            '<option value="0"' +
            (!r.paid ? " selected" : "") +
            ">미입금</option>" +
            '<option value="1"' +
            (r.paid ? " selected" : "") +
            ">입금</option>" +
            "</select></td>" +
            "<td>" +
            '<select class="prot-cell-select" data-id="' +
            id +
            '" data-field="delivered" aria-label="전달여부">' +
            '<option value="0"' +
            (!r.delivered ? " selected" : "") +
            ">미전달</option>" +
            '<option value="1"' +
            (r.delivered ? " selected" : "") +
            ">전달완료</option>" +
            "</select></td>" +
            "</tr>"
          );
        })
        .join("");

      tb.querySelectorAll(".prot-row-check").forEach(function (cb) {
        cb.addEventListener("change", function () {
          var id = cb.getAttribute("data-id");
          if (cb.checked) selectedIds[id] = true;
          else delete selectedIds[id];
          syncSelectAllState();
          updateBulkDeleteUi();
        });
      });

      tb.querySelectorAll(".prot-cell-select").forEach(function (sel) {
        sel.addEventListener("change", function () {
          var id = sel.getAttribute("data-id");
          var field = sel.getAttribute("data-field");
          var val = sel.value === "1";
          var list = JBData.getProtectiveRequests().slice();
          var i;
          for (i = 0; i < list.length; i++) {
            if (list[i].id === id) {
              if (field === "paid") list[i].paid = val;
              if (field === "delivered") {
                list[i].delivered = val;
                if (val) list[i].status = "수령완료";
                else if (list[i].status === "수령완료") list[i].status = "접수";
              }
              break;
            }
          }
          persistList(list);
          delete selectedIds[id];
          renderList();
        });
      });

      syncSelectAllState();
      updateBulkDeleteUi();
    }

    function visibleIds() {
      return filteredRows().map(function (r) {
        return r.id;
      });
    }

    function syncSelectAllState() {
      if (!protSelectAll) return;
      var ids = visibleIds();
      var n = ids.length;
      var c = 0;
      var i;
      for (i = 0; i < n; i++) {
        if (selectedIds[ids[i]]) c++;
      }
      protSelectAll.checked = n > 0 && c === n;
      protSelectAll.indeterminate = c > 0 && c < n;
    }

    if (protSelectAll) {
      protSelectAll.addEventListener("change", function () {
        var ids = visibleIds();
        var on = protSelectAll.checked;
        var i;
        for (i = 0; i < ids.length; i++) {
          if (on) selectedIds[ids[i]] = true;
          else delete selectedIds[ids[i]];
        }
        tb.querySelectorAll(".prot-row-check").forEach(function (cb) {
          cb.checked = on;
        });
        updateBulkDeleteUi();
      });
    }

    if (tabPending && tabDelivered) {
      tabPending.addEventListener("click", function () {
        listTab = "pending";
        tabPending.classList.add("prot-tab--active");
        tabDelivered.classList.remove("prot-tab--active");
        tabPending.setAttribute("aria-selected", "true");
        tabDelivered.setAttribute("aria-selected", "false");
        selectedIds = {};
        renderList();
      });
      tabDelivered.addEventListener("click", function () {
        listTab = "delivered";
        tabDelivered.classList.add("prot-tab--active");
        tabPending.classList.remove("prot-tab--active");
        tabDelivered.setAttribute("aria-selected", "true");
        tabPending.setAttribute("aria-selected", "false");
        selectedIds = {};
        renderList();
      });
    }

    if (protSearch) {
      protSearch.addEventListener("input", function () {
        searchQuery = protSearch.value || "";
        selectedIds = {};
        renderList();
      });
    }

    if (btnBulkDelete) {
      btnBulkDelete.addEventListener("click", function () {
        var ids = Object.keys(selectedIds).filter(function (id) {
          return selectedIds[id];
        });
        if (!ids.length) return;
        JBUI.confirm(ids.length + "건을 삭제할까요?", {
          title: "삭제 확인",
          confirmText: "삭제",
          cancelText: "취소",
        }).then(function (ok) {
          if (!ok) return;
          var set = {};
          var i;
          for (i = 0; i < ids.length; i++) set[ids[i]] = true;
          var next = JBData.getProtectiveRequests().filter(function (x) {
            return !set[x.id];
          });
          persistList(next);
          selectedIds = {};
          renderList();
          renderInv();
          JBUI.toast("삭제했습니다.", "ok");
        });
      });
    }

    function renderInv() {
      var inv = JBData.getProtectiveInventory();
      document.getElementById("dispKneeS").textContent = String(inv.knee.S);
      document.getElementById("dispKneeM").textContent = String(inv.knee.M);
      document.getElementById("dispKneeL").textContent = String(inv.knee.L);
      document.getElementById("dispElbowS").textContent = String(inv.elbow.S);
      document.getElementById("dispElbowM").textContent = String(inv.elbow.M);
      document.getElementById("dispElbowL").textContent = String(inv.elbow.L);
    }

    function renderStockEditForm() {
      var form = document.getElementById("editStockForm");
      if (!form) return;
      var inv = JBData.getProtectiveInventory();
      var rows = [
        { key: "knee_S", label: "무릎 S", value: inv.knee.S },
        { key: "knee_M", label: "무릎 M", value: inv.knee.M },
        { key: "knee_L", label: "무릎 L", value: inv.knee.L },
        { key: "elbow_S", label: "팔꿈치 S", value: inv.elbow.S },
        { key: "elbow_M", label: "팔꿈치 M", value: inv.elbow.M },
        { key: "elbow_L", label: "팔꿈치 L", value: inv.elbow.L },
      ];
      form.innerHTML = rows
        .map(function (r) {
          return (
            '<div class="protective-stock-edit__row">' +
            '<label for="stock_' +
            r.key +
            '">' +
            r.label +
            "</label>" +
            '<input class="auth-input" type="number" min="0" step="1" id="stock_' +
            r.key +
            '" name="' +
            r.key +
            '" value="' +
            String(r.value) +
            '" />' +
            "</div>"
          );
        })
        .join("");
    }

    function openStockEdit() {
      renderStockEditForm();
      var sec = document.getElementById("editStockSection");
      if (sec) sec.hidden = false;
    }

    function closeStockEdit() {
      var sec = document.getElementById("editStockSection");
      if (sec) sec.hidden = true;
    }

    function openManualModal() {
      document.getElementById("d").value = JBData.dateKey(new Date());
      document.getElementById("protManualModal").hidden = false;
      document.body.classList.add("modal-open");
      document.getElementById("who").focus();
    }

    function closeManualModal() {
      document.getElementById("protManualModal").hidden = true;
      document.body.classList.remove("modal-open");
    }

    function renderLinkLine() {
      var el = document.getElementById("registeredLinkLine");
      var u = JBData.getProtectiveApplicationLink();
      if (u) {
        el.textContent = "신청서링크에 등록된 URL: " + u;
      } else {
        el.textContent = "신청서링크에 「보호대」가 포함된 제목의 URL이 아직 없습니다.";
      }
    }

    document.getElementById("btnOpenInvModal").addEventListener("click", openStockEdit);
    document.getElementById("cancelStockBtn").addEventListener("click", closeStockEdit);

    document.getElementById("saveStockBtn").addEventListener("click", function () {
      var form = document.getElementById("editStockForm");
      if (!form) return;
      var fd = new FormData(form);
      var inv = JBData.getProtectiveInventory();
      function readNonNegInt(key) {
        var v = parseInt(String(fd.get(key) || "0"), 10);
        if (isNaN(v) || v < 0) return null;
        return v;
      }
      var kneeS = readNonNegInt("knee_S");
      var kneeM = readNonNegInt("knee_M");
      var kneeL = readNonNegInt("knee_L");
      var elbowS = readNonNegInt("elbow_S");
      var elbowM = readNonNegInt("elbow_M");
      var elbowL = readNonNegInt("elbow_L");
      if (
        kneeS === null ||
        kneeM === null ||
        kneeL === null ||
        elbowS === null ||
        elbowM === null ||
        elbowL === null
      ) {
        JBUI.toast("수량은 0 이상의 숫자로 입력해 주세요.", "err");
        return;
      }
      inv.knee.S = kneeS;
      inv.knee.M = kneeM;
      inv.knee.L = kneeL;
      inv.elbow.S = elbowS;
      inv.elbow.M = elbowM;
      inv.elbow.L = elbowL;
      JBData.saveProtectiveInventory(inv);
      renderInv();
      closeStockEdit();
      JBUI.toast("재고가 반영되었습니다.", "ok");
    });

    document.getElementById("btnCopyApplyUrl").addEventListener("click", function () {
      var field = document.getElementById("applyUrlField");
      field.select();
      field.setSelectionRange(0, 99999);
      try {
        document.execCommand("copy");
        JBUI.toast("웹 접수 주소를 복사했습니다. 신청서링크에 붙여 넣으세요.", "ok");
      } catch (e) {
        JBUI.toast("복사에 실패했습니다. 주소를 직접 선택해 복사해 주세요.", "err");
      }
    });

    var btnManual = document.getElementById("btnProtManualAdd");
    if (btnManual) btnManual.addEventListener("click", openManualModal);
    document.getElementById("protManualClose").addEventListener("click", closeManualModal);
    document.getElementById("protManualCancel").addEventListener("click", closeManualModal);
    document.getElementById("protManualModal").addEventListener("click", function (e) {
      if (e.target.id === "protManualModal") closeManualModal();
    });

    document.getElementById("f").addEventListener("submit", function (e) {
      e.preventDefault();
      var productType = document.getElementById("item").value;
      var size = document.getElementById("sz").value;
      var phoneRaw = document.getElementById("phone").value.trim();
      var digits = phoneRaw.replace(/\D/g, "");
      var phone = phoneRaw;
      if (digits.length === 11 && /^01[016789]/.test(digits)) {
        phone = digits.slice(0, 3) + "-" + digits.slice(3, 7) + "-" + digits.slice(7);
      }
      var st = document.getElementById("st").value;
      var delivered = st === "수령완료";
      var list = JBData.getProtectiveRequests();
      list.push({
        id: "pr-" + Date.now(),
        applicantName: document.getElementById("who").value.trim(),
        studentName: "",
        phone: phone,
        productType: productType,
        size: size,
        itemSpec:
          (productType === "knee" ? "무릎보호대" : "팔꿈치보호대") + " · " + size,
        requestDate: document.getElementById("d").value,
        status: st,
        source: "admin",
        createdAt: new Date().toISOString(),
        paid: false,
        delivered: delivered,
      });
      persistList(list);
      e.target.reset();
      document.getElementById("d").value = JBData.dateKey(new Date());
      closeManualModal();
      renderList();
      JBUI.toast("등록했습니다.", "ok");
    });

    window.addEventListener("jb-remote-update", function (ev) {
      var k = ev.detail && ev.detail.key;
      if (k === "jb_protective_requests" || k === "jb_protective_inventory_v1") {
        renderInv();
        renderList();
        renderLinkLine();
      }
    });

    renderInv();
    renderLinkLine();
    renderList();
  }

  var sessionPromise =
    typeof JBAuth !== "undefined" && JBAuth.waitForSession ? JBAuth.waitForSession() : Promise.resolve();
  var bootTimeout = new Promise(function (resolve) {
    setTimeout(resolve, 2500);
  });
  var pageRan = false;
  function tryRun() {
    if (pageRan) return;
    if (!JBAuth.getCurrentUser()) return;
    pageRan = true;
    run();
  }
  /* 재고 +추가 버튼 무반응 방지: 세션 복원과 무관하게 우선 바인딩 */
  run();
  Promise.race([sessionPromise, bootTimeout]).then(tryRun);
  sessionPromise
    .then(function () {
      paintShell();
      tryRun();
    })
    .catch(function () {});
})();
