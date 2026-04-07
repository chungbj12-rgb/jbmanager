/**
 * 보호대신청 — 재고·연동·명단(탭·검색·체크 삭제)
 */
(function () {
  var shellOpts = { activeNav: "protective", pageTitle: "제이비스포츠 관리프로그램" };

  /* 비상 폴백: 이벤트 바인딩이 꼬여도 +추가 버튼은 항상 동작 */
  function openStockInlineFallback() {
    var sec = document.getElementById("editStockSection");
    var form = document.getElementById("editStockForm");
    if (!sec || !form) return;
    var inv = { knee: { S: 0, M: 0, L: 0 }, elbow: { S: 0, M: 0, L: 0 } };
    if (window.JBData && JBData.getProtectiveInventory) {
      var loaded = JBData.getProtectiveInventory();
      if (loaded && loaded.knee && loaded.elbow) {
        inv = loaded;
      }
    }
    var sizes = ["S", "M", "L"];
    form.innerHTML =
      '<div class="protective-stock-edit__group-title">무릎보호대 재고</div>' +
      sizes
        .map(function (size) {
          var key = "knee_" + size;
          return (
            '<div class="protective-stock-edit__row">' +
            '<label for="stock_' +
            key +
            '">' +
            size +
            "사이즈</label>" +
            '<input class="auth-input" type="number" min="0" step="1" id="stock_' +
            key +
            '" name="' +
            key +
            '" value="' +
            String(inv.knee[size]) +
            '" />' +
            "</div>"
          );
        })
        .join("") +
      '<div class="protective-stock-edit__group-title">팔꿈치보호대 재고</div>' +
      sizes
        .map(function (size) {
          var key = "elbow_" + size;
          return (
            '<div class="protective-stock-edit__row">' +
            '<label for="stock_' +
            key +
            '">' +
            size +
            "사이즈</label>" +
            '<input class="auth-input" type="number" min="0" step="1" id="stock_' +
            key +
            '" name="' +
            key +
            '" value="' +
            String(inv.elbow[size]) +
            '" />' +
            "</div>"
          );
        })
        .join("");
    sec.hidden = false;
    document.body.classList.add("modal-open");
  }
  window.JBProtectiveOpenStockInline = openStockInlineFallback;

  function bindStockButtonFallback() {
    var btn = document.getElementById("btnOpenInvModal");
    if (!btn || btn.__jbStockBound) return;
    btn.__jbStockBound = true;
    btn.addEventListener("click", function () {
      openStockInlineFallback();
    });
  }
  bindStockButtonFallback();
  document.addEventListener("DOMContentLoaded", bindStockButtonFallback);

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
    var protSelectAll = document.getElementById("protSelectAll");

    function seedDemoRowsIfEmpty() {
      var list = JBData.getProtectiveRequests();
      if (Array.isArray(list) && list.length > 0) return;
      var today = JBData.dateKey(new Date());
      var demo = [
        { name: "김민준", phone: "010-2345-7811", type: "knee", size: "S" },
        { name: "이서연", phone: "010-4451-2290", type: "elbow", size: "M" },
        { name: "박지호", phone: "010-7722-1184", type: "knee", size: "L" },
        { name: "최유나", phone: "010-9081-6632", type: "elbow", size: "S" },
        { name: "정도윤", phone: "010-5512-9407", type: "knee", size: "M" },
      ].map(function (x, i) {
        return {
          id: "demo-pr-" + (Date.now() + i),
          applicantName: x.name,
          studentName: "",
          phone: x.phone,
          productType: x.type,
          size: x.size,
          itemSpec: (x.type === "knee" ? "무릎보호대" : "팔꿈치보호대") + " · " + x.size,
          requestDate: today,
          status: "접수",
          source: "admin",
          createdAt: new Date().toISOString(),
          paid: false,
          delivered: false,
        };
      });
      JBData.saveProtectiveRequests(demo);
    }
    seedDemoRowsIfEmpty();

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

    function notify(msg, kind) {
      if (window.JBUI && JBUI.toast) JBUI.toast(msg, kind || "ok");
      else window.alert(msg);
    }

    function adjustInventory(productType, size, delta) {
      var isKnee = productType === "knee";
      var isElbow = productType === "elbow";
      var isSize = size === "S" || size === "M" || size === "L";
      if ((!isKnee && !isElbow) || !isSize || !delta) return true;

      var inv = JBData.getProtectiveInventory();
      var bucket = isKnee ? inv.knee : inv.elbow;
      var current = parseInt(String(bucket[size] || 0), 10);
      if (isNaN(current)) current = 0;
      if (delta < 0 && current + delta < 0) return false;
      bucket[size] = current + delta;
      JBData.saveProtectiveInventory(inv);
      return true;
    }

    function syncInventoryByDeliveryChange(prevDelivered, nextDelivered, productType, size) {
      if (prevDelivered === nextDelivered) return true;
      if (nextDelivered) {
        return adjustInventory(productType, size, -1);
      }
      return adjustInventory(productType, size, 1);
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
                var prevDelivered = !!list[i].delivered;
                if (!syncInventoryByDeliveryChange(prevDelivered, val, list[i].productType, sizeLabel(list[i]))) {
                  sel.value = prevDelivered ? "1" : "0";
                  JBUI.toast("재고가 부족해 전달완료로 변경할 수 없습니다.", "err");
                  return;
                }
                list[i].delivered = val;
                if (val) list[i].status = "수령완료";
                else if (list[i].status === "수령완료") list[i].status = "접수";
              }
              break;
            }
          }
          persistList(list);
          delete selectedIds[id];
          renderInv();
          renderList();
        });
      });

      syncSelectAllState();
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
      form.innerHTML = renderStockFormMarkup(inv);
    }

    function renderStockFormMarkup(inv) {
      var groups = [
        { title: "무릎보호대 재고", prefix: "knee" },
        { title: "팔꿈치보호대 재고", prefix: "elbow" },
      ];
      var sizes = ["S", "M", "L"];
      return groups
        .map(function (g) {
          var fields = sizes
            .map(function (size) {
              var key = g.prefix + "_" + size;
              var value = inv[g.prefix] && inv[g.prefix][size] != null ? inv[g.prefix][size] : 0;
              return (
                '<div class="protective-stock-edit__row">' +
                '<label for="stock_' +
                key +
                '">' +
                size +
                "사이즈</label>" +
                '<input class="auth-input" type="number" min="0" step="1" id="stock_' +
                key +
                '" name="' +
                key +
                '" value="' +
                String(value) +
                '" />' +
                "</div>"
              );
            })
            .join("");
          return '<div class="protective-stock-edit__group-title">' + g.title + "</div>" + fields;
        })
        .join("");
    }

    function openStockEdit() {
      renderStockEditForm();
      var sec = document.getElementById("editStockSection");
      if (sec) sec.hidden = false;
      document.body.classList.add("modal-open");
    }

    function closeStockEdit() {
      var sec = document.getElementById("editStockSection");
      if (sec) sec.hidden = true;
      document.body.classList.remove("modal-open");
    }

    function openManualModal() {
      document.getElementById("protManualModal").hidden = false;
      document.body.classList.add("modal-open");
      document.getElementById("kneeQty").value = "0";
      document.getElementById("elbowQty").value = "0";
      document.getElementById("kneeSize").value = "";
      document.getElementById("elbowSize").value = "";
      updateManualAmounts();
      document.getElementById("who").focus();
    }

    function closeManualModal() {
      document.getElementById("protManualModal").hidden = true;
      document.body.classList.remove("modal-open");
    }

    var btnOpenInvModal = document.getElementById("btnOpenInvModal");
    if (btnOpenInvModal) {
      btnOpenInvModal.onclick = null;
      btnOpenInvModal.addEventListener("click", openStockEdit);
    }
    var cancelStockBtn = document.getElementById("cancelStockBtn");
    if (cancelStockBtn) {
      cancelStockBtn.addEventListener("click", closeStockEdit);
    }
    var stockModalClose = document.getElementById("stockModalClose");
    if (stockModalClose) {
      stockModalClose.addEventListener("click", closeStockEdit);
    }
    var stockModal = document.getElementById("editStockSection");
    if (stockModal) {
      stockModal.addEventListener("click", function (e) {
        if (e.target === stockModal) closeStockEdit();
      });
    }

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

    var btnManual = document.getElementById("btnProtManualAdd");
    if (btnManual) btnManual.addEventListener("click", openManualModal);
    document.getElementById("protManualClose").addEventListener("click", closeManualModal);
    document.getElementById("protManualCancel").addEventListener("click", closeManualModal);
    document.getElementById("protManualModal").addEventListener("click", function (e) {
      if (e.target.id === "protManualModal") closeManualModal();
    });

    function updateManualAmounts() {
      var kneeQty = parseInt(String(document.getElementById("kneeQty").value || "0"), 10);
      var elbowQty = parseInt(String(document.getElementById("elbowQty").value || "0"), 10);
      if (isNaN(kneeQty) || kneeQty < 0) kneeQty = 0;
      if (isNaN(elbowQty) || elbowQty < 0) elbowQty = 0;
      var kneeAmount = kneeQty * 18000;
      var elbowAmount = elbowQty * 20000;
      var total = kneeAmount + elbowAmount;
      document.getElementById("kneeAmount").value = kneeAmount.toLocaleString("ko-KR") + "원";
      document.getElementById("elbowAmount").value = elbowAmount.toLocaleString("ko-KR") + "원";
      document.getElementById("totalAmount").value = total.toLocaleString("ko-KR") + "원";
    }
    document.getElementById("kneeQty").addEventListener("input", updateManualAmounts);
    document.getElementById("elbowQty").addEventListener("input", updateManualAmounts);

    document.getElementById("f").addEventListener("submit", function (e) {
      e.preventDefault();
      var phoneRaw = document.getElementById("phone").value.trim();
      var digits = phoneRaw.replace(/\D/g, "");
      var phone = phoneRaw;
      if (digits.length === 11 && /^01[016789]/.test(digits)) {
        phone = digits.slice(0, 3) + "-" + digits.slice(3, 7) + "-" + digits.slice(7);
      }
      var st = "접수";
      var delivered = false;
      var kneeSize = document.getElementById("kneeSize").value;
      var elbowSize = document.getElementById("elbowSize").value;
      var kneeQty = parseInt(String(document.getElementById("kneeQty").value || "0"), 10);
      var elbowQty = parseInt(String(document.getElementById("elbowQty").value || "0"), 10);
      if (isNaN(kneeQty) || kneeQty < 0) kneeQty = 0;
      if (isNaN(elbowQty) || elbowQty < 0) elbowQty = 0;
      if ((kneeQty > 0 && !kneeSize) || (elbowQty > 0 && !elbowSize)) {
        notify("수량을 입력한 품목은 사이즈를 선택해 주세요.", "err");
        return;
      }
      if (kneeQty === 0 && elbowQty === 0) {
        notify("최소 1개 이상 수량을 입력해 주세요.", "err");
        return;
      }
      var list = JBData.getProtectiveRequests();
      function pushRows(productType, size, qty) {
        var i;
        for (i = 0; i < qty; i++) {
          list.push({
            id: "pr-" + Date.now() + "-" + productType + "-" + i,
            applicantName: document.getElementById("who").value.trim(),
            studentName: "",
            phone: phone,
            productType: productType,
            size: size,
            itemSpec:
              (productType === "knee" ? "무릎보호대" : "팔꿈치보호대") + " · " + size,
            requestDate: JBData.dateKey(new Date()),
            status: st,
            source: "admin",
            createdAt: new Date().toISOString(),
            paid: false,
            delivered: delivered,
          });
        }
      }
      if (delivered) {
        var j;
        for (j = 0; j < kneeQty; j++) {
          if (!adjustInventory("knee", kneeSize, -1)) {
            notify("무릎보호대 재고가 부족합니다.", "err");
            return;
          }
        }
        for (j = 0; j < elbowQty; j++) {
          if (!adjustInventory("elbow", elbowSize, -1)) {
            notify("팔꿈치보호대 재고가 부족합니다.", "err");
            return;
          }
        }
      }
      if (kneeQty > 0) pushRows("knee", kneeSize, kneeQty);
      if (elbowQty > 0) pushRows("elbow", elbowSize, elbowQty);
      persistList(list);
      e.target.reset();
      updateManualAmounts();
      closeManualModal();
      listTab = "pending";
      if (tabPending && tabDelivered) {
        tabPending.classList.add("prot-tab--active");
        tabDelivered.classList.remove("prot-tab--active");
        tabPending.setAttribute("aria-selected", "true");
        tabDelivered.setAttribute("aria-selected", "false");
      }
      renderInv();
      renderList();
      notify("신청이 등록되었습니다.", "ok");
    });

    window.addEventListener("jb-remote-update", function (ev) {
      var k = ev.detail && ev.detail.key;
      if (k === "jb_protective_requests" || k === "jb_protective_inventory_v1") {
        renderInv();
        renderList();
      }
    });

    renderInv();
    renderList();
    window.__JBProtectiveReady = true;
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
