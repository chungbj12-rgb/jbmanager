/**
 * 셔틀관리 — 차량·공유 링크
 */
(function () {
  var shuttleShellOpts = { activeNav: "shuttle", pageTitle: "제이비스포츠 관리프로그램" };
  var vehicleFallbackWired = false;

  function paintShell() {
    document.body.classList.add("page-shuttle");
    JBAppShell.init(shuttleShellOpts);
  }

  function retryShuttleShellIfNavMissing() {
    var aside = document.getElementById("app-sidebar");
    if (!aside || aside.querySelector(".app-nav")) return;
    if (JBAppShell.ensureSidebarPainted) JBAppShell.ensureSidebarPainted();
    if (!aside.querySelector(".app-nav")) JBAppShell.init(shuttleShellOpts);
  }

  function wireVehicleFallback() {
    if (vehicleFallbackWired) return;
    vehicleFallbackWired = true;

    function el(id) {
      return document.getElementById(id);
    }

    function validate() {
      var nameEl = el("vehName");
      var plateEl = el("vehPlate");
      var submitEl = el("submitRegisterBtn");
      if (!nameEl || !plateEl || !submitEl) return;
      submitEl.disabled = nameEl.value.trim() === "" || plateEl.value.trim() === "";
    }

    function openModal() {
      var modal = el("vehicleModal");
      var nameEl = el("vehName");
      var plateEl = el("vehPlate");
      var submitEl = el("submitRegisterBtn");
      if (!modal || !nameEl || !plateEl) return;
      nameEl.value = "";
      plateEl.value = "";
      if (submitEl) submitEl.disabled = true;
      modal.hidden = false;
      document.body.classList.add("modal-open");
    }

    function closeModal() {
      var modal = el("vehicleModal");
      if (modal) modal.hidden = true;
      document.body.classList.remove("modal-open");
    }

    document.addEventListener("click", function (e) {
      var t = e.target;
      if (!t) return;
      if (t.id === "btnShuttleVehicle" || (t.closest && t.closest("#btnShuttleVehicle"))) {
        e.preventDefault();
        openModal();
        return;
      }
      if (t.id === "vehicleModalClose" || t.id === "vehicleModalCancel") {
        e.preventDefault();
        closeModal();
        return;
      }
      if (t.id === "vehicleModal") {
        closeModal();
      }
    });

    var nameInput = el("vehName");
    var plateInput = el("vehPlate");
    if (nameInput) nameInput.addEventListener("input", validate);
    if (plateInput) plateInput.addEventListener("input", validate);

    var form = el("vehicleForm");
    if (form) {
      form.addEventListener("submit", function (e) {
        var nameEl = el("vehName");
        var plateEl = el("vehPlate");
        if (!nameEl || !plateEl) return;
        var name = nameEl.value.trim();
        var plate = plateEl.value.trim();
        if (!name || !plate) {
          e.preventDefault();
          validate();
          return;
        }
        e.preventDefault();
        if (!window.JBData || !JBData.addShuttleVehicle) return;
        JBData.addShuttleVehicle({ name: name, plate: plate, driverNote: "" });
        if (JBData.publishShuttleShareSnapshot) JBData.publishShuttleShareSnapshot().catch(function () {});
        closeModal();
        if (window.JBUI && JBUI.toast) JBUI.toast("차량을 등록했습니다.", "ok");
      });
    }
  }

  paintShell();
  wireVehicleFallback();
  requestAnimationFrame(retryShuttleShellIfNavMissing);
  setTimeout(retryShuttleShellIfNavMissing, 0);
  setTimeout(retryShuttleShellIfNavMissing, 120);
  setTimeout(retryShuttleShellIfNavMissing, 400);
  setTimeout(retryShuttleShellIfNavMissing, 800);
  setTimeout(retryShuttleShellIfNavMissing, 1600);

  var shuttlePageStarted = false;

  function runShuttlePage() {
    if (shuttlePageStarted) return;
    shuttlePageStarted = true;

    paintShell();

    function bindClick(id, handler) {
      var el = document.getElementById(id);
      if (el) el.addEventListener("click", handler);
    }

    function escapeHtml(s) {
      return String(s == null ? "" : s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    function renderVehicles() {
      var tb = document.getElementById("shuttleVehicleTbody");
      if (!tb) return;
      var list = JBData.getShuttleVehicles().slice();
      list.sort(function (a, b) {
        return (a.name || "").localeCompare(b.name || "", "ko");
      });
      tb.innerHTML = list
        .map(function (v) {
          return (
            "<tr>" +
            "<td>" +
            escapeHtml(v.name || "") +
            "</td>" +
            "<td>" +
            escapeHtml(v.plate || "") +
            "</td>" +
            '<td><button type="button" class="linkish-del" data-del-veh="' +
            escapeHtml(v.id) +
            '">삭제</button></td>' +
            "</tr>"
          );
        })
        .join("");
      tb.querySelectorAll("[data-del-veh]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var id = btn.getAttribute("data-del-veh");
          JBUI.confirm("이 차량을 삭제할까요?", { title: "차량 삭제", confirmText: "삭제", cancelText: "취소" }).then(function (ok) {
            if (!ok) return;
            JBData.deleteShuttleVehicle(id);
            JBData.publishShuttleShareSnapshot().catch(function () {});
            JBUI.toast("삭제했습니다.", "ok");
            renderVehicles();
          });
        });
      });
    }

    function openVehicleModal() {
      var modal = document.getElementById("vehicleModal");
      var nameEl = document.getElementById("vehName");
      var plateEl = document.getElementById("vehPlate");
      var submitBtn = document.getElementById("submitRegisterBtn");
      if (!modal || !nameEl || !plateEl) return;
      nameEl.value = "";
      plateEl.value = "";
      if (submitBtn) submitBtn.disabled = true;
      modal.hidden = false;
      document.body.classList.add("modal-open");
      try {
        renderVehicles();
      } catch (e) {
        console.error("[shuttle] renderVehicles", e);
      }
    }

    function closeVehicleModal() {
      var modal = document.getElementById("vehicleModal");
      if (modal) modal.hidden = true;
      document.body.classList.remove("modal-open");
    }

    function openShareLinkModal() {
      JBData.publishShuttleShareSnapshot().then(function (pub) {
        if (!pub || !pub.ok) {
          JBUI.toast((pub && pub.error) || "공유 링크를 만들 수 없습니다.", "err");
          return;
        }
        var url = JBData.getShuttlePublicShareUrl();
        var ta = document.getElementById("shareLinkUrl");
        if (ta) ta.value = url;
        document.getElementById("shareLinkModal").hidden = false;
        document.body.classList.add("modal-open");
      });
    }

    function closeShareLinkModal() {
      document.getElementById("shareLinkModal").hidden = true;
      document.body.classList.remove("modal-open");
    }

    function copyShareUrlFromModal() {
      var ta = document.getElementById("shareLinkUrl");
      var url = ta ? ta.value : "";
      if (!url) return;
      function copyDone() {
        JBUI.toast("링크를 복사했습니다.", "ok");
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(copyDone).catch(function () {
          ta.focus();
          ta.select();
          try {
            document.execCommand("copy");
          } catch (e2) {}
          copyDone();
        });
      } else {
        ta.focus();
        ta.select();
        try {
          document.execCommand("copy");
        } catch (e2) {}
        copyDone();
      }
    }

    bindClick("btnShuttleVehicle", openVehicleModal);
    bindClick("btnShuttleShare", openShareLinkModal);
    bindClick("btnShuttleLinkManage", function () {
      window.location.href = "applications.html";
    });

    var daySelector = document.getElementById("daySelector");
    var classButtons = document.getElementById("classButtons");
    var vehicleDropdown = document.getElementById("vehicleDropdown");
    var memberListBody = document.getElementById("memberListBody");
    var addMemberBtn = document.getElementById("addMemberBtn");
    var dayToIdx = {
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
      sunday: 0,
    };
    var selectedDay = "";
    var selectedClassId = "";
    var selectedVehicleId = "";

    function selectedClass() {
      var classes = JBData.getClasses();
      for (var i = 0; i < classes.length; i++) {
        if (classes[i].id === selectedClassId) return classes[i];
      }
      return null;
    }

    function formatClassTime(cls) {
      if (!cls) return "";
      var s = JBData.normalizeClassTime(cls.startTime) || cls.startTime || "";
      var e = JBData.normalizeClassTime(cls.endTime) || cls.endTime || "";
      if (!s && !e) return "";
      return s + " ~ " + e;
    }

    function clearMemberList() {
      if (memberListBody) memberListBody.innerHTML = "";
    }

    function classesByDayKey(dayKey) {
      var idx = dayToIdx[dayKey];
      if (typeof idx !== "number") return [];
      return JBData.getClasses().filter(function (c) {
        if (!Array.isArray(c.weekdays) || !c.weekdays.length) return false;
        for (var i = 0; i < c.weekdays.length; i++) {
          if (Number(c.weekdays[i]) === idx) return true;
        }
        return false;
      });
    }

    function renderClassButtons(dayKey) {
      if (!classButtons) return;
      var list = classesByDayKey(dayKey);
      classButtons.innerHTML = list.length
        ? list
            .map(function (c) {
              return (
                '<button type="button" class="class-btn" data-class-id="' +
                escapeHtml(c.id) +
                '">' +
                escapeHtml(c.name || "") +
                "</button>"
              );
            })
            .join("")
        : '<p class="class-selector__empty">해당 요일 클래스가 없습니다.</p>';

      classButtons.querySelectorAll(".class-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
          selectedClassId = btn.getAttribute("data-class-id") || "";
          selectedVehicleId = "";
          classButtons.querySelectorAll(".class-btn").forEach(function (x) {
            x.classList.remove("selected");
          });
          btn.classList.add("selected");
          clearMemberList();
          renderVehicleDropdown();
          if (vehicleDropdown) vehicleDropdown.value = "";
          if (addMemberBtn) addMemberBtn.disabled = true;
        });
      });
    }

    function renderVehicleDropdown() {
      if (!vehicleDropdown) return;
      var list = JBData.getShuttleVehicles();
      vehicleDropdown.innerHTML = list.length
        ? '<option value="">차량을 선택하세요</option>' +
          list
            .map(function (v) {
              var label = (v.name || "") + (v.plate ? " (" + v.plate + ")" : "");
              return '<option value="' + escapeHtml(v.id) + '">' + escapeHtml(label) + "</option>";
            })
            .join("")
        : '<option value="">등록된 차량이 없습니다</option>';
      vehicleDropdown.disabled = !list.length;
    }

    function findMemberByNamePrefix(nameValue) {
      var q = String(nameValue || "").trim();
      if (!q) return null;
      var members = JBData.getMembers();
      for (var i = 0; i < members.length; i++) {
        var n = String(members[i].name || "");
        if (n.indexOf(q) === 0) return members[i];
      }
      return null;
    }

    function addMemberRow() {
      if (!memberListBody) return;
      var tr = document.createElement("tr");
      var cls = selectedClass();
      var defaultTime = formatClassTime(cls);

      var nameTd = document.createElement("td");
      nameTd.className = "col-cell-name";
      var nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.placeholder = "회원 이름 입력";
      nameTd.appendChild(nameInput);

      var timeTd = document.createElement("td");
      timeTd.className = "col-cell-time";
      var timeInput = document.createElement("input");
      timeInput.type = "text";
      timeInput.placeholder = "18:50";
      timeInput.maxLength = 5;
      timeInput.inputMode = "numeric";
      timeInput.value = defaultTime || "";
      timeTd.appendChild(timeInput);

      var pickupTd = document.createElement("td");
      var pickupInput = document.createElement("input");
      pickupInput.type = "text";
      pickupInput.placeholder = "승차 장소";
      pickupTd.appendChild(pickupInput);

      var dropoffTd = document.createElement("td");
      var dropoffInput = document.createElement("input");
      dropoffInput.type = "text";
      dropoffInput.placeholder = "하차 장소";
      dropoffTd.appendChild(dropoffInput);

      var actionTd = document.createElement("td");
      var delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "parent-vehicle-schedule__row-del";
      delBtn.textContent = "삭제";
      actionTd.appendChild(delBtn);

      nameInput.addEventListener("input", function () {
        var m = findMemberByNamePrefix(nameInput.value);
        pickupInput.value = (m && m.pickupLocation) || "";
        dropoffInput.value = (m && m.dropoffLocation) || "";
      });
      delBtn.addEventListener("click", function () {
        tr.remove();
      });

      tr.appendChild(nameTd);
      tr.appendChild(timeTd);
      tr.appendChild(pickupTd);
      tr.appendChild(dropoffTd);
      tr.appendChild(actionTd);
      memberListBody.appendChild(tr);
    }

    if (addMemberBtn) {
      addMemberBtn.addEventListener("click", function () {
        addMemberRow();
      });
    }

    if (daySelector) {
      daySelector.addEventListener("change", function (event) {
        var t = event.target;
        if (!t || t.name !== "day") return;
        selectedDay = t.value;
        selectedClassId = "";
        selectedVehicleId = "";
        renderClassButtons(selectedDay);
        if (vehicleDropdown) {
          vehicleDropdown.innerHTML = '<option value="">차량을 선택하세요</option>';
          vehicleDropdown.disabled = true;
        }
        clearMemberList();
        if (addMemberBtn) addMemberBtn.disabled = true;
      });
    }

    if (vehicleDropdown) {
      vehicleDropdown.addEventListener("change", function (event) {
        selectedVehicleId = event.target.value || "";
        clearMemberList();
        if (addMemberBtn) addMemberBtn.disabled = !selectedVehicleId;
      });
    }

    function setShuttleTab(which) {
      var panelP = document.getElementById("shuttleTabParent");
      var panelT = document.getElementById("shuttleTabTeacher");
      var btnP = document.getElementById("tabShuttleParent");
      var btnT = document.getElementById("tabShuttleTeacher");
      var headAct = document.getElementById("shuttleHeadActions");
      if (!panelP || !panelT || !btnP || !btnT) return;
      if (which === "parent") {
        panelP.hidden = false;
        panelT.hidden = true;
        btnP.classList.add("is-on");
        btnT.classList.remove("is-on");
        btnP.setAttribute("aria-selected", "true");
        btnT.setAttribute("aria-selected", "false");
        if (headAct) headAct.hidden = false;
      } else {
        panelP.hidden = true;
        panelT.hidden = false;
        btnT.classList.add("is-on");
        btnP.classList.remove("is-on");
        btnT.setAttribute("aria-selected", "true");
        btnP.setAttribute("aria-selected", "false");
        if (headAct) headAct.hidden = true;
      }
    }
    bindClick("tabShuttleParent", function () {
      setShuttleTab("parent");
    });
    bindClick("tabShuttleTeacher", function () {
      setShuttleTab("teacher");
    });
    bindClick("shareLinkModalClose", closeShareLinkModal);
    bindClick("shareLinkModalClose2", closeShareLinkModal);
    bindClick("shareLinkCopy", copyShareUrlFromModal);
    var shareOverlay = document.getElementById("shareLinkModal");
    if (shareOverlay) {
      shareOverlay.addEventListener("click", function (e) {
        if (e.target.id === "shareLinkModal") closeShareLinkModal();
      });
    }
    bindClick("vehicleModalClose", closeVehicleModal);
    bindClick("vehicleModalCancel", closeVehicleModal);
    var vehOverlay = document.getElementById("vehicleModal");
    if (vehOverlay) {
      vehOverlay.addEventListener("click", function (e) {
        if (e.target.id === "vehicleModal") closeVehicleModal();
      });
    }

    var vehicleForm = document.getElementById("vehicleForm");
    var carNameInput = document.getElementById("vehName");
    var carNumberInput = document.getElementById("vehPlate");
    var submitRegisterBtn = document.getElementById("submitRegisterBtn");

    function validateVehicleInputs() {
      if (!carNameInput || !carNumberInput || !submitRegisterBtn) return;
      var isValid = carNameInput.value.trim() !== "" && carNumberInput.value.trim() !== "";
      submitRegisterBtn.disabled = !isValid;
    }

    if (carNameInput) carNameInput.addEventListener("input", validateVehicleInputs);
    if (carNumberInput) carNumberInput.addEventListener("input", validateVehicleInputs);

    if (vehicleForm) {
      vehicleForm.addEventListener("submit", function (e) {
        e.preventDefault();
        JBData.addShuttleVehicle({
          name: document.getElementById("vehName").value,
          plate: document.getElementById("vehPlate").value,
          driverNote: "",
        });
        JBData.publishShuttleShareSnapshot().catch(function () {});
        closeVehicleModal();
        JBUI.toast("차량을 등록했습니다.", "ok");
        renderVehicles();
      });
    }

    renderVehicles();
  }

  /* 버튼 무반응 방지: 세션 복원과 무관하게 우선 이벤트 바인딩 */
  runShuttlePage();

  var sessionPromise =
    typeof JBAuth !== "undefined" && JBAuth.waitForSession ? JBAuth.waitForSession() : Promise.resolve();
  var bootTimeoutMs = 2500;
  var bootTimeout = new Promise(function (resolve) {
    setTimeout(resolve, bootTimeoutMs);
  });
  Promise.race([sessionPromise, bootTimeout]).then(function () {
    runShuttlePage();
  });
  sessionPromise
    .then(function () {
      paintShell();
    })
    .catch(function () {});
})();
