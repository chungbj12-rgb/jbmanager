/**
 * 노션 스타일 리치 텍스트 (TipTap v2, ESM CDN)
 * — 블록(제목/목록/할 일/인용/코드), 링크·이미지(URL), 굵게/기울임/밑줄
 */
import { Editor } from "https://esm.sh/@tiptap/core@2.10.4";
import StarterKit from "https://esm.sh/@tiptap/starter-kit@2.10.4";
import Placeholder from "https://esm.sh/@tiptap/extension-placeholder@2.10.4";
import Link from "https://esm.sh/@tiptap/extension-link@2.10.4";
import Image from "https://esm.sh/@tiptap/extension-image@2.10.4";
import TaskList from "https://esm.sh/@tiptap/extension-task-list@2.10.4";
import TaskItem from "https://esm.sh/@tiptap/extension-task-item@2.10.4";
import Underline from "https://esm.sh/@tiptap/extension-underline@2.10.4";
import Table from "https://esm.sh/@tiptap/extension-table@2.10.4";
import TableRow from "https://esm.sh/@tiptap/extension-table-row@2.10.4";
import TableCell from "https://esm.sh/@tiptap/extension-table-cell@2.10.4";
import TableHeader from "https://esm.sh/@tiptap/extension-table-header@2.10.4";

export function emptyDoc() {
  return { type: "doc", content: [{ type: "paragraph" }] };
}

function normalizeContent(json) {
  if (!json || typeof json !== "object") return emptyDoc();
  if (json.type !== "doc") return emptyDoc();
  if (!Array.isArray(json.content) || json.content.length === 0) return emptyDoc();
  return json;
}

const defaultExtensions = (placeholder, editable) => [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    bulletList: { HTMLAttributes: { class: "bullet-list" } },
    orderedList: { HTMLAttributes: { class: "ordered-list" } },
  }),
  Placeholder.configure({
    placeholder: placeholder || "내용을 입력하세요… '/' 로 블록을 상상해 보세요",
    emptyEditorClass: "is-editor-empty",
  }),
  Underline,
  Link.configure({ openOnClick: editable === true, autolink: true }),
  Image.configure({ inline: false, allowBase64: false }),
  TaskList,
  TaskItem.configure({ nested: true }),
  Table.configure({
    resizable: true,
    allowTableNodeSelection: true,
    HTMLAttributes: { class: "notion-table" },
  }),
  TableRow,
  TableHeader,
  TableCell,
];

/**
 * @param {HTMLElement} mountEl — 에디터 본문이 붙을 요소
 * @param {{ initialDoc?: object, placeholder?: string, editable?: boolean }} opts
 */
export function createNotionEditor(mountEl, opts) {
  opts = opts || {};
  var editable = opts.editable !== false;
  var initial = normalizeContent(opts.initialDoc);

  var editor = new Editor({
    element: mountEl,
    editable: editable,
    extensions: defaultExtensions(opts.placeholder, editable),
    content: initial,
    editorProps: {
      attributes: {
        class: "notion-pm-root",
      },
    },
  });

  return {
    editor: editor,
    getDoc: function () {
      return editor.getJSON();
    },
    setDoc: function (json) {
      editor.commands.setContent(normalizeContent(json), false);
    },
    focus: function () {
      editor.commands.focus("end");
    },
    destroy: function () {
      editor.destroy();
    },
    isEditable: function () {
      return editor.isEditable;
    },
  };
}

function toolbarButton(label, title, onClick, isActive) {
  var b = document.createElement("button");
  b.type = "button";
  b.className = "notion-toolbar__btn";
  b.textContent = label;
  b.title = title || label;
  b.addEventListener("click", function (e) {
    e.preventDefault();
    onClick();
  });
  if (isActive) b.classList.add("is-active");
  return b;
}

/**
 * @param {HTMLElement} barEl
 * @param {ReturnType<createNotionEditor>} api
 */
export function bindNotionToolbar(barEl, api) {
  var ed = api.editor;
  if (!ed.isEditable) return function () {};

  function refresh() {
    barEl.innerHTML = "";
    var chain = function () {
      return ed.chain().focus();
    };

    var add = function (label, title, fn, activeFn) {
      barEl.appendChild(
        toolbarButton(label, title, fn, activeFn && activeFn())
      );
    };

    add("B", "굵게", function () {
      chain().toggleBold().run();
    }, function () {
      return ed.isActive("bold");
    });
    add("I", "기울임", function () {
      chain().toggleItalic().run();
    }, function () {
      return ed.isActive("italic");
    });
    add("U", "밑줄", function () {
      chain().toggleUnderline().run();
    }, function () {
      return ed.isActive("underline");
    });
    add("S", "취소선", function () {
      chain().toggleStrike().run();
    }, function () {
      return ed.isActive("strike");
    });

    var sep = document.createElement("span");
    sep.className = "notion-toolbar__sep";
    barEl.appendChild(sep);

    add("H1", "제목 1", function () {
      chain().toggleHeading({ level: 1 }).run();
    }, function () {
      return ed.isActive("heading", { level: 1 });
    });
    add("H2", "제목 2", function () {
      chain().toggleHeading({ level: 2 }).run();
    }, function () {
      return ed.isActive("heading", { level: 2 });
    });
    add("H3", "제목 3", function () {
      chain().toggleHeading({ level: 3 }).run();
    }, function () {
      return ed.isActive("heading", { level: 3 });
    });

    var sep2 = document.createElement("span");
    sep2.className = "notion-toolbar__sep";
    barEl.appendChild(sep2);

    add("•", "글머리", function () {
      chain().toggleBulletList().run();
    }, function () {
      return ed.isActive("bulletList");
    });
    add("1.", "번호", function () {
      chain().toggleOrderedList().run();
    }, function () {
      return ed.isActive("orderedList");
    });
    add("☐", "할 일", function () {
      chain().toggleTaskList().run();
    }, function () {
      return ed.isActive("taskList");
    });
    add("❝", "인용", function () {
      chain().toggleBlockquote().run();
    }, function () {
      return ed.isActive("blockquote");
    });
    add("</>", "코드 블록", function () {
      chain().toggleCodeBlock().run();
    }, function () {
      return ed.isActive("codeBlock");
    });
    add("토글", "토글형 블록(인용 대체)", function () {
      chain().toggleBlockquote().run();
    }, function () {
      return ed.isActive("blockquote");
    });

    var sep3 = document.createElement("span");
    sep3.className = "notion-toolbar__sep";
    barEl.appendChild(sep3);

    add("링크", "링크", function () {
      var prev = ed.getAttributes("link").href;
      window.JBUI.prompt("링크할 주소를 입력하세요.", {
        title: "링크",
        defaultValue: prev || "https://",
        confirmText: "적용",
        cancelText: "취소",
        placeholder: "https://",
        inputType: "url",
      }).then(function (url) {
        if (url === null) return;
        if (url === "") {
          chain().extendMarkRange("link").unsetLink().run();
          return;
        }
        chain().extendMarkRange("link").setLink({ href: url }).run();
      });
    }, function () {
      return ed.isActive("link");
    });
    add("이미지", "이미지 URL", function () {
      window.JBUI.prompt("붙여넣을 이미지 주소를 입력하세요.", {
        title: "이미지",
        defaultValue: "https://",
        confirmText: "삽입",
        cancelText: "취소",
        placeholder: "https://",
        inputType: "url",
      }).then(function (url) {
        if (url == null || url === "") return;
        chain().setImage({ src: url }).run();
      });
    });

    var sep4 = document.createElement("span");
    sep4.className = "notion-toolbar__sep";
    barEl.appendChild(sep4);

    add("—", "구분선", function () {
      chain().setHorizontalRule().run();
    });
    add("표", "2x2 표 삽입", function () {
      chain().insertTable({ rows: 2, cols: 2, withHeaderRow: true }).run();
    }, function () {
      return ed.isActive("table");
    });
    add("+행", "아래 행 추가", function () {
      chain().addRowAfter().run();
    });
    add("-행", "행 삭제", function () {
      chain().deleteRow().run();
    });
    add("+열", "오른쪽 열 추가", function () {
      chain().addColumnAfter().run();
    });
    add("-열", "열 삭제", function () {
      chain().deleteColumn().run();
    });
    add("병합", "셀 병합", function () {
      chain().mergeCells().run();
    });
    add("분할", "셀 분할", function () {
      chain().splitCell().run();
    });
    add("헤더", "헤더셀 토글", function () {
      chain().toggleHeaderCell().run();
    });
    add("표삭제", "표 삭제", function () {
      chain().deleteTable().run();
    });

    add("↩", "실행 취소", function () {
      chain().undo().run();
    }, function () {
      return false;
    });
    add("↪", "다시 실행", function () {
      chain().redo().run();
    }, function () {
      return false;
    });
  }

  var raf = null;
  function scheduleRefresh() {
    if (raf) return;
    raf = requestAnimationFrame(function () {
      raf = null;
      refresh();
    });
  }

  refresh();
  ed.on("selectionUpdate", scheduleRefresh);

  return function () {
    ed.off("selectionUpdate", scheduleRefresh);
  };
}

/**
 * 툴바 + 본문 래퍼 한 번에 구성
 * @param {HTMLElement} wrap — .notion-editor-wrap 역할
 */
export function mountNotionEditorUI(wrap, opts) {
  opts = opts || {};
  var editable = opts.editable !== false;
  var toolbar = document.createElement("div");
  toolbar.className = "notion-toolbar";
  var host = document.createElement("div");
  host.className = "notion-editor-host" + (editable ? "" : " notion-editor-host--readonly");

  if (editable) {
    wrap.appendChild(toolbar);
  }
  wrap.appendChild(host);

  var api = createNotionEditor(host, opts);
  var unbindToolbar = editable ? bindNotionToolbar(toolbar, api) : function () {};

  return {
    getDoc: api.getDoc,
    setDoc: api.setDoc,
    focus: api.focus,
    destroy: function () {
      unbindToolbar();
      api.destroy();
      wrap.innerHTML = "";
    },
  };
}
