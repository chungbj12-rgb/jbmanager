import { mountNotionEditorUI, emptyDoc } from "./notion-editor.mjs";

var editorApi = null;

function bootNoticeForm() {
  var params = new URLSearchParams(location.search);
  var id = params.get("id");
  var existing = id ? window.JBContentApi.notices.get(id) : null;

  document.getElementById("pageTitleLabel").textContent = existing ? "공지 수정" : "공지 작성";

  var wrap = document.getElementById("noticeBodyEditor");
  editorApi = mountNotionEditorUI(wrap, {
    initialDoc: existing && existing.bodyDoc ? existing.bodyDoc : emptyDoc(),
    placeholder: "공지 내용을 작성하세요. 제목·본문·이미지·할 일 목록을 자유롭게 구성할 수 있습니다.",
    editable: true,
  });

  if (existing) {
    document.getElementById("nTitle").value = existing.title || "";
  }

  document.getElementById("noticeForm").addEventListener("submit", function (e) {
    e.preventDefault();
    document.getElementById("formErr").hidden = true;

    var title = document.getElementById("nTitle").value.trim();
    if (!title) {
      document.getElementById("formErr").textContent = "제목을 입력해주세요.";
      document.getElementById("formErr").hidden = false;
      return;
    }

    var row = {
      id: existing ? existing.id : undefined,
      title: title,
      bodyDoc: editorApi.getDoc(),
    };

    var saved = window.JBContentApi.notices.save(row);
    if (editorApi) {
      editorApi.destroy();
      editorApi = null;
    }
    location.href = window.JBContentApi.notices.viewHref(saved.id);
  });

  document.getElementById("btnCancel").addEventListener("click", function () {
    location.href = "notices.html";
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootNoticeForm);
} else {
  bootNoticeForm();
}
