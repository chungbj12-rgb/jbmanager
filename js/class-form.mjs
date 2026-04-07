import { mountNotionEditorUI, emptyDoc } from "./notion-editor.mjs";

var editorApi = null;

function bootClassForm() {
  var params = new URLSearchParams(location.search);
  var id = params.get("id");
  var existing = id ? window.JBContentApi.classesReg.get(id) : null;

  document.getElementById("pageTitleLabel").textContent = existing ? "클래스 수정" : "클래스 등록";

  var wrap = document.getElementById("classDescEditor");
  editorApi = mountNotionEditorUI(wrap, {
    initialDoc: existing && existing.descriptionDoc ? existing.descriptionDoc : emptyDoc(),
    placeholder: "커리큘럼, 장소, 유의사항 등을 블록으로 작성…",
    editable: true,
  });

  var students = window.JBContentApi.students.list();
  var box = document.getElementById("studentChecks");
  var sel = existing && Array.isArray(existing.studentIds) ? existing.studentIds : [];

  students.forEach(function (s) {
    var label = document.createElement("label");
    label.className = "chk-pill";
    var cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = s.id;
    cb.checked = sel.indexOf(s.id) !== -1;
    label.appendChild(cb);
    label.appendChild(document.createTextNode(" " + (s.name || s.id)));
    box.appendChild(label);
  });

  if (existing) {
    document.getElementById("cName").value = existing.name || "";
    document.getElementById("cSchedule").value = existing.scheduleText || "";
    document.getElementById("cInstructor").value = existing.instructorName || "";
    document.getElementById("cInstructorContact").value = existing.instructorContact || "";
  }

  document.getElementById("classForm").addEventListener("submit", function (e) {
    e.preventDefault();
    document.getElementById("formErr").hidden = true;

    var name = document.getElementById("cName").value.trim();
    if (!name) {
      document.getElementById("formErr").textContent = "클래스명을 입력해주세요.";
      document.getElementById("formErr").hidden = false;
      return;
    }

    var studentIds = [];
    box.querySelectorAll('input[type="checkbox"]:checked').forEach(function (cb) {
      studentIds.push(cb.value);
    });

    var row = {
      id: existing ? existing.id : undefined,
      name: name,
      scheduleText: document.getElementById("cSchedule").value.trim(),
      instructorName: document.getElementById("cInstructor").value.trim(),
      instructorContact: document.getElementById("cInstructorContact").value.trim(),
      studentIds: studentIds,
      descriptionDoc: editorApi.getDoc(),
    };

    var saved = window.JBContentApi.classesReg.save(row);
    if (editorApi) {
      editorApi.destroy();
      editorApi = null;
    }
    location.href = window.JBContentApi.classesReg.detailHref(saved.id);
  });

  document.getElementById("btnCancel").addEventListener("click", function () {
    location.href = "class-registry.html";
  });
}

function boot() {
  var p = window.JBAuth && JBAuth.waitForSession ? JBAuth.waitForSession() : Promise.resolve();
  p.then(function () {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", bootClassForm);
    } else {
      bootClassForm();
    }
  });
}
boot();
