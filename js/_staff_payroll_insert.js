      function payrollForStaff(staff, monthStr) {
        var records = getAttendanceRecordsForStaff(staff.id, monthStr);
        var summary = "";
        var allowance = 0;
        var base = 0;
        var deduction = 0;
        if (isVehicleTeacher(staff)) {
          var hours = 0;
          records.forEach(function (row) {
            var r = row.rec;
            if (r.vehicleStartTime && r.vehicleEndTime) {
              hours += hoursBetweenHm(r.vehicleStartTime, r.vehicleEndTime);
            }
          });
          allowance = Math.round(hours * PAY_RATES.vehicleHourly);
          summary =
            "\uc6b4\ud589 " +
            hours.toFixed(2) +
            "\uc2dc\uac04 \u00d7 " +
            PAY_RATES.vehicleHourly.toLocaleString("ko-KR") +
            "\uc6d0/\uc2dc";
          return { kind: "vehicle", allowance: allowance, base: base, deduction: deduction, net: allowance - deduction, summary: summary };
        }
        if (isPartCoach(staff)) {
          var rgM = 0;
          var rgA = 0;
          var clM = 0;
          var clA = 0;
          records.forEach(function (row) {
            var r = row.rec;
            if (!r.classMarked) return;
            var club = resolvePartClassKind(r) === "club";
            var asst = r.partCoachRole === "assistant";
            if (club) {
              if (asst) clA++;
              else clM++;
            } else {
              if (asst) rgA++;
              else rgM++;
            }
          });
          allowance =
            rgM * PAY_RATES.partMainRegular +
            rgA * PAY_RATES.partAsstRegular +
            clM * PAY_RATES.partMainClub +
            clA * PAY_RATES.partAsstClub;
          var bits = [];
          if (rgM) bits.push("\uc815\uaddc\u00b7\uba54\uc778\u00d7" + rgM);
          if (rgA) bits.push("\uc815\uaddc\u00b7\ubcf4\uc870\u00d7" + rgA);
          if (clM) bits.push("\ud074\ub7fd\u00b7\uba54\uc778\u00d7" + clM);
          if (clA) bits.push("\ud074\ub7fd\u00b7\ubcf4\uc870\u00d7" + clA);
          summary = bits.length ? bits.join(", ") : "\ud074\ub798\uc2a4 \uadfc\ud0dc \ubbf8\uc785\ub825";
          return { kind: "part", allowance: allowance, base: base, deduction: deduction, net: allowance - deduction, summary: summary };
        }
        return {
          kind: "none",
          allowance: 0,
          base: 0,
          deduction: 0,
          net: 0,
          summary: "\uc790\ub3d9 \uacc4\uc0b0 \uc5c6\uc74c(\uc815\uc9c1\uc6d0 \ub4f1)",
        };
      }

      function ensurePartClassModal() {
        if (document.getElementById("partClassOverlay")) return;
        var main = document.querySelector(".app-content");
        if (!main) return;
        var wrap = document.createElement("div");
        wrap.id = "partClassOverlay";
        wrap.className = "att-detail-overlay";
        wrap.hidden = true;
        wrap.setAttribute("role", "dialog");
        wrap.setAttribute("aria-modal", "true");
        wrap.setAttribute("aria-labelledby", "partClassTitle");
        wrap.innerHTML =
          '<div class="att-detail-dialog part-class-dialog">' +
          '<div class="att-detail-head">' +
          '<h3 id="partClassTitle" class="att-detail-title"></h3>' +
          '<button type="button" class="att-detail-close" id="partClassClose" aria-label="close">\u00d7</button>' +
          "</div>" +
          '<p class="att-detail-meta" id="partClassMeta"></p>' +
          '<div class="part-class-body">' +
          '<label class="part-class-label"><span class="part-class-label-text" id="partLblKind"></span>' +
          '<select id="partClassKind" class="part-class-select">' +
          '<option value="regular"></option>' +
          '<option value="club"></option>' +
          "</select></label>" +
          '<label class="part-class-label"><span class="part-class-label-text" id="partLblRole"></span>' +
          '<select id="partCoachRole" class="part-class-select">' +
          '<option value="main"></option>' +
          '<option value="assistant"></option>' +
          "</select></label>" +
          '<label class="part-class-label"><span class="part-class-label-text" id="partLblName"></span>' +
          '<input type="text" id="partClassName" class="part-class-input" autocomplete="off" /></label>' +
          '<p class="part-class-rate-hint" id="partClassRateHint"></p>' +
          "</div>" +
          '<div class="part-class-actions">' +
          '<button type="button" class="part-class-btn part-class-btn--ghost" id="partClassClear"></button>' +
          '<button type="button" class="part-class-btn part-class-btn--primary" id="partClassSave"></button>' +
          "</div></div>";
        main.appendChild(wrap);
        document.getElementById("partClassTitle").textContent = "\ud30c\ud2b8 \ud074\ub798\uc2a4 \u00b7 \uae09\uc5ec \ubc18\uc601";
        document.getElementById("partLblKind").textContent = "\ud074\ub798\uc2a4 \uad6c\ubd84";
        document.getElementById("partLblRole").textContent = "\uc5ed\ud560";
        document.getElementById("partLblName").textContent =
          "\ud074\ub798\uc2a4\uba85 (\uc120\ud0dd, U- \uc2dc\uc791\uc2dc \ud074\ub7fd\uc73c\ub85c \uc790\ub3d9)";
        document.getElementById("partClassName").placeholder = "\uc608: U-10 \ub9ac\uadf8";
        var sk = document.getElementById("partClassKind");
        sk.options[0].textContent = "\uc815\uaddc\ubc18";
        sk.options[1].textContent = "\ud074\ub7fd\ubc18 (U- \ud074\ub798\uc2a4)";
        var sr = document.getElementById("partCoachRole");
        sr.options[0].textContent = "\uba54\uc778 \ucf54\uce58";
        sr.options[1].textContent = "\ubcf4\uc870 \ucf54\uce58";
        document.getElementById("partClassClear").textContent = "\ud45c\uc2dc \uc81c\uac70";
        document.getElementById("partClassSave").textContent = "\uc800\uc7a5";
      }

      function bindPartClassModal() {
        ensurePartClassModal();
        var ov = document.getElementById("partClassOverlay");
        if (!ov || ov.dataset.bound === "1") return;
        ov.dataset.bound = "1";
        document.getElementById("partClassClose").addEventListener("click", closePartClassModal);
        ov.addEventListener("click", function (e) {
          if (e.target === ov) closePartClassModal();
        });
        document.getElementById("partClassSave").addEventListener("click", savePartClassFromModal);
        document.getElementById("partClassClear").addEventListener("click", clearPartClassFromModal);
        document.getElementById("partClassKind").addEventListener("change", updatePartClassRateHint);
        document.getElementById("partCoachRole").addEventListener("change", updatePartClassRateHint);
        document.getElementById("partClassName").addEventListener("input", function () {
          syncPartClassKindFromInputName();
          updatePartClassRateHint();
        });
      }

      function syncPartClassKindFromInputName() {
        var nameEl = document.getElementById("partClassName");
        var kindEl = document.getElementById("partClassKind");
        if (!nameEl || !kindEl) return;
        if (/^U-/i.test(String(nameEl.value || "").trim())) kindEl.value = "club";
      }

      function updatePartClassRateHint() {
        var kindEl = document.getElementById("partClassKind");
        var roleEl = document.getElementById("partCoachRole");
        var hint = document.getElementById("partClassRateHint");
        if (!kindEl || !roleEl || !hint) return;
        var rec = { partClassKind: kindEl.value, partCoachRole: roleEl.value };
        var nm = document.getElementById("partClassName");
        if (nm && String(nm.value || "").trim()) rec.partClassName = nm.value.trim();
        hint.textContent = "\uc774\ubc88 \uc800\uc7a5 \ucf54\uce58\ube44: " + formatWon(partClassUnitPay(rec));
      }

      function openPartClassModal(staffId) {
        bindPartClassModal();
        partClassStaffId = staffId;
        var list = getStaffList();
        var staff = list.filter(function (s) { return String(s.id) === String(staffId); })[0];
        var month = (tabMonth && tabMonth.value) ? tabMonth.value : "";
        var key = staffId + "|" + monthDateLabel(month);
        var rec = getAttendanceMap()[key] || {};
        document.getElementById("partClassMeta").textContent =
          (staff ? staff.name : "") +
          " \u00b7 " +
          (month || "-") +
          " \u00b7 \ud574\ub2f9 \ucd9c\uadfc\uc77c \uae30\uc900";
        document.getElementById("partClassKind").value = rec.partClassKind === "club" ? "club" : "regular";
        document.getElementById("partCoachRole").value = rec.partCoachRole === "assistant" ? "assistant" : "main";
        document.getElementById("partClassName").value = rec.partClassName || "";
        syncPartClassKindFromInputName();
        updatePartClassRateHint();
        document.getElementById("partClassOverlay").hidden = false;
        document.body.classList.add("modal-open");
      }

      function closePartClassModal() {
        var ov = document.getElementById("partClassOverlay");
        if (ov) ov.hidden = true;
        partClassStaffId = null;
        document.body.classList.remove("modal-open");
      }

      function savePartClassFromModal() {
        if (!partClassStaffId) return;
        var month = (tabMonth && tabMonth.value) ? tabMonth.value : "";
        var key = partClassStaffId + "|" + monthDateLabel(month);
        var map = getAttendanceMap();
        var rec = map[key] || {};
        rec.classMarked = true;
        var nm = String(document.getElementById("partClassName").value || "").trim();
        if (nm) rec.partClassName = nm;
        else delete rec.partClassName;
        if (/^U-/i.test(nm)) rec.partClassKind = "club";
        else rec.partClassKind = document.getElementById("partClassKind").value === "club" ? "club" : "regular";
        rec.partCoachRole = document.getElementById("partCoachRole").value === "assistant" ? "assistant" : "main";
        map[key] = rec;
        saveAttendanceMap(map);
        if (window.JBUI && JBUI.toast) JBUI.toast("\ud074\ub798\uc2a4 \u00b7 \uc5ed\ud560 \uc815\ubcf4\uac00 \uc800\uc7a5\ub418\uc5c8\uc2b5\ub2c8\ub2e4.", "ok");
        closePartClassModal();
        renderAttendance();
      }

      function clearPartClassFromModal() {
        if (!partClassStaffId) return;
        var month = (tabMonth && tabMonth.value) ? tabMonth.value : "";
        var key = partClassStaffId + "|" + monthDateLabel(month);
        var map = getAttendanceMap();
        var rec = map[key] || {};
        delete rec.classMarked;
        delete rec.partClassKind;
        delete rec.partCoachRole;
        delete rec.partClassName;
        if (!Object.keys(rec).length) delete map[key];
        else map[key] = rec;
        saveAttendanceMap(map);
        if (window.JBUI && JBUI.toast) JBUI.toast("\ud074\ub798\uc2a4 \ud45c\uc2dc\ub97c \uc81c\uac70\ud588\uc2b5\ub2c8\ub2e4.", "ok");
        closePartClassModal();
        renderAttendance();
      }
