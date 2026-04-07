import { mountNotionEditorUI, emptyDoc } from "./notion-editor.mjs";

var PHONE_RE = /^01[016789]-\d{4}-\d{4}$/;
var BIRTH_RE = /^\d{6}$/;

function validate(data) {
  if (!data.name || !data.name.trim()) return "이름을 입력해주세요.";
  if (!BIRTH_RE.test((data.birth || "").trim())) return "생년월일은 YYMMDD 6자리 숫자로 입력해주세요.";
  var phone = window.JBAuth.normalizePhone(data.phone);
  if (!PHONE_RE.test(phone)) return "학생 연락처는 010-XXXX-XXXX 형식으로 입력해주세요.";
  var pp = (data.parentPhone || "").trim();
  if (pp && !PHONE_RE.test(window.JBAuth.normalizePhone(pp))) {
    return "보호자 연락처 형식을 확인해주세요.";
  }
  return null;
}

function qs(id) {
  return document.getElementById(id);
}

var editorApi = null;

function bootStudentForm() {
  var params = new URLSearchParams(location.search);
  var id = params.get("id");
  var existing = id ? window.JBContentApi.students.get(id) : null;

  qs("pageTitleLabel").textContent = existing ? "학생 정보 수정" : "학생 등록";

  var wrap = qs("studentNotesEditor");
  editorApi = mountNotionEditorUI(wrap, {
    initialDoc: existing && existing.notesDoc ? existing.notesDoc : emptyDoc(),
    placeholder: "특이사항, 건강 정보, 목표 등 자유롭게 작성…",
    editable: true,
  });

  if (existing) {
    qs("stuName").value = existing.name || "";
    qs("stuBirth").value = existing.birth || "";
    qs("stuPhone").value = existing.phone || "";
    qs("stuParent").value = existing.parentPhone || "";
    qs("stuSchool").value = existing.school || "";
    qs("stuEmergency").value = existing.emergencyContact || "";
  }

  qs("studentForm").addEventListener("submit", function (e) {
    e.preventDefault();
    qs("formErr").hidden = true;

    var row = {
      id: existing ? existing.id : undefined,
      name: qs("stuName").value.trim(),
      birth: qs("stuBirth").value.trim(),
      phone: qs("stuPhone").value,
      parentPhone: qs("stuParent").value.trim(),
      school: qs("stuSchool").value.trim(),
      emergencyContact: qs("stuEmergency").value.trim(),
      notesDoc: editorApi.getDoc(),
    };

    row.phone = window.JBAuth.normalizePhone(row.phone);
    if (row.parentPhone) row.parentPhone = window.JBAuth.normalizePhone(row.parentPhone);

    var err = validate(row);
    if (err) {
      qs("formErr").textContent = err;
      qs("formErr").hidden = false;
      return;
    }

    var saved = window.JBContentApi.students.save(row);
    if (editorApi) {
      editorApi.destroy();
      editorApi = null;
    }
    location.href = window.JBContentApi.students.detailHref(saved.id);
  });

  qs("btnCancel").addEventListener("click", function () {
    location.href = "students.html";
  });
}

function boot() {
  var p = window.JBAuth && JBAuth.waitForSession ? JBAuth.waitForSession() : Promise.resolve();
  p.then(function () {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", bootStudentForm);
    } else {
      bootStudentForm();
    }
  });
}
boot();
