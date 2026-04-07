import { mountNotionEditorUI, emptyDoc } from "./notion-editor.mjs";

function bootNoticeView() {
  var params = new URLSearchParams(location.search);
  var id = params.get("id");
  if (!id) {
    location.href = "notices.html";
    return;
  }

  var row = window.JBContentApi.notices.get(id);
  if (!row) {
    location.href = "notices.html";
    return;
  }

  document.getElementById("nTitle").textContent = row.title || "공지";
  document.getElementById("nMeta").textContent =
    "최종 수정: " + (row.updatedAt ? new Date(row.updatedAt).toLocaleString("ko-KR") : "—");

  mountNotionEditorUI(document.getElementById("noticeBodyReadonly"), {
    initialDoc: row.bodyDoc || emptyDoc(),
    editable: false,
  });

  var link = window.JBContentApi.notices.viewUrl(row.id);
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
    location.href = window.JBContentApi.notices.formHref(row.id);
  });

  document.getElementById("btnDelete").addEventListener("click", function () {
    window.JBUI.confirm("이 공지를 삭제할까요?", {
      title: "삭제 확인",
      confirmText: "삭제",
      cancelText: "취소",
    }).then(function (ok) {
      if (!ok) return;
      window.JBContentApi.notices.remove(row.id);
      location.href = "notices.html";
    });
  });
}

function boot() {
  var p = window.JBAuth && JBAuth.waitForSession ? JBAuth.waitForSession() : Promise.resolve();
  p.then(function () {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", bootNoticeView);
    } else {
      bootNoticeView();
    }
  });
}
boot();
