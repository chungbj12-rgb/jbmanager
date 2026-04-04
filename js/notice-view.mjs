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
      alert("링크를 복사했습니다.");
    } catch (e) {
      document.getElementById("permalink").select();
      document.execCommand("copy");
      alert("링크를 복사했습니다.");
    }
  });

  document.getElementById("btnEdit").addEventListener("click", function () {
    location.href = window.JBContentApi.notices.formHref(row.id);
  });

  document.getElementById("btnDelete").addEventListener("click", function () {
    if (!confirm("이 공지를 삭제할까요?")) return;
    window.JBContentApi.notices.remove(row.id);
    location.href = "notices.html";
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootNoticeView);
} else {
  bootNoticeView();
}
