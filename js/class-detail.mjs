import { mountNotionEditorUI, emptyDoc } from "./notion-editor.mjs";

function bootClassDetail() {
  var params = new URLSearchParams(location.search);
  var id = params.get("id");
  if (!id) {
    location.href = "class-registry.html";
    return;
  }

  var row = window.JBContentApi.classesReg.get(id);
  if (!row) {
    location.href = "class-registry.html";
    return;
  }

  document.getElementById("cName").textContent = row.name || "—";
  document.getElementById("cSchedule").textContent = row.scheduleText || "—";
  document.getElementById("cInstructor").textContent = row.instructorName || "—";
  document.getElementById("cInstructorContact").textContent = row.instructorContact || "—";

  var ul = document.getElementById("studentList");
  var ids = row.studentIds || [];
  if (ids.length === 0) {
    ul.innerHTML = '<li class="list-empty">연결된 수강생이 없습니다.</li>';
  } else {
    ul.innerHTML = ids
      .map(function (sid) {
        var st = window.JBContentApi.students.get(sid);
        var name = st ? st.name : sid;
        var href = window.JBContentApi.students.detailHref(sid);
        return '<li><a href="' + href + '">' + name + "</a></li>";
      })
      .join("");
  }

  mountNotionEditorUI(document.getElementById("classDescReadonly"), {
    initialDoc: row.descriptionDoc || emptyDoc(),
    editable: false,
  });

  var link = window.JBContentApi.classesReg.detailUrl(row.id);
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
    location.href = window.JBContentApi.classesReg.formHref(row.id);
  });

  document.getElementById("btnDelete").addEventListener("click", function () {
    window.JBUI.confirm("이 클래스를 삭제할까요?", {
      title: "삭제 확인",
      confirmText: "삭제",
      cancelText: "취소",
    }).then(function (ok) {
      if (!ok) return;
      window.JBContentApi.classesReg.remove(row.id);
      location.href = "class-registry.html";
    });
  });
}

function boot() {
  var p = window.JBAuth && JBAuth.waitForSession ? JBAuth.waitForSession() : Promise.resolve();
  p.then(function () {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", bootClassDetail);
    } else {
      bootClassDetail();
    }
  });
}
boot();
