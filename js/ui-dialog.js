/**
 * 전역 알림·확인·입력창 (한글 UI, 회원관리와 동일한 토스트/모달 톤)
 * JBUI.toast(message, type)  type: 'ok' | 'err'
 * JBUI.confirm(message, options) → Promise<boolean>
 * JBUI.prompt(message, options) → Promise<string|null>  (취소 시 null)
 */
(function (global) {
  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function ensureToast() {
    var el = document.getElementById("jbUiToast");
    if (!el) {
      el = document.createElement("div");
      el.id = "jbUiToast";
      el.className = "jb-ui-toast";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      document.body.appendChild(el);
    }
    return el;
  }

  var toastTimer = null;

  function toast(msg, type) {
    var el = ensureToast();
    el.textContent = msg;
    el.className = "jb-ui-toast is-show" + (type === "err" ? " jb-ui-toast--err" : " jb-ui-toast--ok");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.classList.remove("is-show");
      el.textContent = "";
    }, 2800);
  }

  function confirm(message, opts) {
    opts = opts || {};
    var title = opts.title != null ? String(opts.title) : "확인";
    var okText = opts.confirmText != null ? String(opts.confirmText) : "확인";
    var cancelText = opts.cancelText != null ? String(opts.cancelText) : "취소";

    return new Promise(function (resolve) {
      var overlay = document.createElement("div");
      overlay.className = "jb-ui-confirm-overlay";
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-modal", "true");
      overlay.setAttribute("aria-labelledby", "jbUiConfirmTitle");

      var wrap = document.createElement("div");
      wrap.className = "jb-ui-confirm-dialog";

      var h = document.createElement("h2");
      h.id = "jbUiConfirmTitle";
      h.className = "jb-ui-confirm__title";
      h.textContent = title;

      var p = document.createElement("p");
      p.className = "jb-ui-confirm__msg";
      p.textContent = message;
      p.setAttribute("role", "document");

      var actions = document.createElement("div");
      actions.className = "jb-ui-confirm__actions";

      var btnCancel = document.createElement("button");
      btnCancel.type = "button";
      btnCancel.className = "btn btn--secondary";
      btnCancel.textContent = cancelText;

      var btnOk = document.createElement("button");
      btnOk.type = "button";
      btnOk.className = "btn btn--primary";
      btnOk.textContent = okText;

      actions.appendChild(btnCancel);
      actions.appendChild(btnOk);
      wrap.appendChild(h);
      wrap.appendChild(p);
      wrap.appendChild(actions);
      overlay.appendChild(wrap);
      document.body.appendChild(overlay);
      document.body.classList.add("modal-open");

      function done(v) {
        document.removeEventListener("keydown", onKey);
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        document.body.classList.remove("modal-open");
        resolve(v);
      }

      function onKey(e) {
        if (e.key === "Escape") {
          e.preventDefault();
          done(false);
        }
      }

      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) done(false);
      });
      btnCancel.addEventListener("click", function () {
        done(false);
      });
      btnOk.addEventListener("click", function () {
        done(true);
      });
      document.addEventListener("keydown", onKey);
      btnCancel.focus();
    });
  }

  function promptDialog(message, opts) {
    opts = opts || {};
    var title = opts.title != null ? String(opts.title) : "입력";
    var okText = opts.confirmText != null ? String(opts.confirmText) : "확인";
    var cancelText = opts.cancelText != null ? String(opts.cancelText) : "취소";
    var placeholder = opts.placeholder != null ? String(opts.placeholder) : "";
    var def = opts.defaultValue != null ? String(opts.defaultValue) : "";
    var inputType = opts.inputType != null ? String(opts.inputType) : "text";

    return new Promise(function (resolve) {
      var overlay = document.createElement("div");
      overlay.className = "jb-ui-confirm-overlay";
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-modal", "true");
      overlay.setAttribute("aria-labelledby", "jbUiPromptTitle");

      var wrap = document.createElement("div");
      wrap.className = "jb-ui-confirm-dialog jb-ui-prompt-dialog";

      var h = document.createElement("h2");
      h.id = "jbUiPromptTitle";
      h.className = "jb-ui-confirm__title";
      h.textContent = title;

      var p = document.createElement("p");
      p.className = "jb-ui-confirm__msg";
      p.textContent = message;

      var input = document.createElement("input");
      input.type = inputType;
      input.className = "auth-input jb-ui-prompt__input";
      input.value = def;
      input.placeholder = placeholder;
      input.autocomplete = "off";

      var actions = document.createElement("div");
      actions.className = "jb-ui-confirm__actions";

      var btnCancel = document.createElement("button");
      btnCancel.type = "button";
      btnCancel.className = "btn btn--secondary";
      btnCancel.textContent = cancelText;

      var btnOk = document.createElement("button");
      btnOk.type = "button";
      btnOk.className = "btn btn--primary";
      btnOk.textContent = okText;

      actions.appendChild(btnCancel);
      actions.appendChild(btnOk);
      wrap.appendChild(h);
      wrap.appendChild(p);
      wrap.appendChild(input);
      wrap.appendChild(actions);
      overlay.appendChild(wrap);
      document.body.appendChild(overlay);
      document.body.classList.add("modal-open");

      function done(v) {
        document.removeEventListener("keydown", onKey);
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        document.body.classList.remove("modal-open");
        resolve(v);
      }

      function onKey(e) {
        if (e.key === "Escape") {
          e.preventDefault();
          done(null);
        } else if (e.key === "Enter" && document.activeElement === input) {
          e.preventDefault();
          done(input.value.trim());
        }
      }

      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) done(null);
      });
      btnCancel.addEventListener("click", function () {
        done(null);
      });
      btnOk.addEventListener("click", function () {
        done(input.value.trim());
      });
      document.addEventListener("keydown", onKey);
      requestAnimationFrame(function () {
        input.focus();
        input.select();
      });
    });
  }

  global.JBUI = {
    toast: toast,
    confirm: confirm,
    prompt: promptDialog,
    escapeHtml: escapeHtml,
  };
})(window);
