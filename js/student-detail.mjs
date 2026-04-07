import { mountNotionEditorUI, emptyDoc } from "./notion-editor.mjs";

function bootStudentDetail() {
  var params = new URLSearchParams(location.search);
  var id = params.get("id");
  if (!id) {
    location.href = "students.html";
    return;
  }

  var row = window.JBContentApi.students.get(id);
  if (!row) {
    location.href = "students.html";
    return;
  }

  document.getElementById("stuName").textContent = row.name || "—";
  document.getElementById("stuBirth").textContent = row.birth || "—";
  document.getElementById("stuPhone").textContent = row.phone || "—";
  document.getElementById("stuParent").textContent = row.parentPhone || "—";
  document.getElementById("stuSchool").textContent = row.school || "—";
  document.getElementById("stuEmergency").textContent = row.emergencyContact || "—";

  var wrap = document.getElementById("studentNotesReadonly");
  mountNotionEditorUI(wrap, {
    initialDoc: row.notesDoc || emptyDoc(),
    editable: false,
  });

  var link = window.JBContentApi.students.detailUrl(row.id);
  document.getElementById("permalink").value = link;

  document.getElementById("btnCopyLink").addEventListener("click", async function () {
    try {
      await navigator.clipboard.writeText(link);
      window.JBUI.toast("링크를 복사했습니다.", "ok");
    } catch (e) {
      document.getElementById("permalink").select();
      document.execCommand("copy");
      window.JBUI.toast("링크를 복사했습니다.", "ok");
    }
  });

  document.getElementById("btnEdit").addEventListener("click", function () {
    location.href = window.JBContentApi.students.formHref(row.id);
  });

  document.getElementById("btnDelete").addEventListener("click", function () {
    window.JBUI.confirm("이 학생 정보를 삭제할까요?", {
      title: "삭제 확인",
      confirmText: "삭제",
      cancelText: "취소",
    }).then(function (ok) {
      if (!ok) return;
      window.JBContentApi.students.remove(row.id);
      location.href = "students.html";
    });
  });
}

function boot() {
  var p = window.JBAuth && JBAuth.waitForSession ? JBAuth.waitForSession() : Promise.resolve();
  p.then(function () {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", bootStudentDetail);
    } else {
      bootStudentDetail();
    }
  });
}
boot();
