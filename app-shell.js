(function (global) {
  var NAV = [
    { id: "dashboard", href: "main.html", label: "대시보드", icon: "grid" },
    { id: "members", href: "members.html", label: "회원관리", icon: "users" },
    { id: "clubs", href: "club-teams.html", label: "클럽팀관리", icon: "briefcase" },
    { id: "trials", href: "trials.html", label: "체험관리", icon: "userCheck" },
    { id: "makeup", href: "makeup.html", label: "보강관리", icon: "refresh" },
    { id: "classes", href: "classes.html", label: "클래스관리", icon: "layers" },
    { id: "attendance", href: "attendance.html", label: "출결관리", icon: "clipboard" },
    { id: "shuttle", href: "shuttle.html", label: "셔틀관리", icon: "bus" },
    { id: "protective", href: "protective.html", label: "보호대신청", icon: "cube" },
    { id: "schedule", href: "schedule.html", label: "일정관리", icon: "cal" },
    { id: "consultation", href: "consultation.html", label: "상담관리", icon: "message" },
    { id: "payments", href: "payments.html", label: "수납관리", icon: "wallet" },
    { id: "staff", href: "staff.html", label: "직원관리", icon: "user" },
    { id: "applications", href: "applications.html", label: "신청서링크", icon: "clipboard" },
    { id: "studentsReg", href: "students.html", label: "학생관리", icon: "studentCap" },
    { id: "classesReg", href: "class-registry.html", label: "수업·클래스", icon: "board" },
    { id: "notices", href: "notices.html", label: "공지사항", icon: "megaphone" },
    { id: "settings", href: "settings.html", label: "설정", icon: "gear" },
  ];

  var SVG = {
    grid:
      '<svg class="app-nav__svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
    users:
      '<svg class="app-nav__svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    briefcase:
      '<svg class="app-nav__svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
    userCheck:
      '<svg class="app-nav__svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-3.5 2.1"/><circle cx="9" cy="7" r="4"/><path d="m17 9 2 2 4-4"/></svg>',
    refresh:
      '<svg class="app-nav__svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 3"/><path d="M21 3v7h-7"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 21"/><path d="M8 16H3v5"/></svg>',
    layers:
      '<svg class="app-nav__svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
    clipboard:
      '<svg class="app-nav__svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 12 2 2 4-4"/></svg>',
    bus:
      '<svg class="app-nav__svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.5"/><path d="M18 18h3s.5-1 .5-2-.5-2-.5-2h-5s-.5 1-.5 2 .5 2 .5 2z"/><path d="M16 6h2a2 2 0 0 1 2 2v9"/><path d="M4 18h2"/></svg>',
    cube:
      '<svg class="app-nav__svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2l9 5v10l-9 5-9-5V7l9-5z"/><path d="M12 22V12"/><path d="m21 7-9 5-9-5"/></svg>',
    cal:
      '<svg class="app-nav__svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>',
    message:
      '<svg class="app-nav__svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    wallet:
      '<svg class="app-nav__svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 4 0v-2h-4"/></svg>',
    user:
      '<svg class="app-nav__svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    gear:
      '<svg class="app-nav__svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
    studentCap:
      '<svg class="app-nav__svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>',
    board:
      '<svg class="app-nav__svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M7 8h10M7 12h6M8 22h8"/></svg>',
    megaphone:
      '<svg class="app-nav__svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 11 18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>',
  };

  function firstChar(name) {
    var s = (name || "?").trim();
    return s ? s.charAt(0) : "?";
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function closeUserDropdown() {
    var d = document.getElementById("appUserDropdown");
    var b = document.getElementById("appUserMenuBtn");
    var wrap = document.querySelector(".app-user-menu");
    if (d) d.hidden = true;
    if (b) b.setAttribute("aria-expanded", "false");
    if (wrap) wrap.classList.remove("app-user-menu--open");
  }

  function closeAccountModal() {
    var modal = document.getElementById("appAccountModal");
    if (modal) modal.hidden = true;
    document.body.classList.remove("modal-open");
  }

  function ensureAccountModal() {
    if (document.getElementById("appAccountModal")) return;
    var wrap = document.createElement("div");
    wrap.id = "appAccountModal";
    wrap.className = "modal-overlay";
    wrap.hidden = true;
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-modal", "true");
    wrap.setAttribute("aria-labelledby", "appAccountTitle");
    wrap.innerHTML =
      '<div class="modal-dialog modal-dialog--account">' +
      '<h2 id="appAccountTitle" class="modal-title">회원정보 변경</h2>' +
      '<p class="modal-account-hint">전화번호·이메일을 수정하거나, 새 비밀번호를 입력하면 변경됩니다.</p>' +
      '<div id="appAccountErr" class="auth-banner auth-banner--error" hidden role="alert"></div>' +
      '<form id="appAccountForm" class="auth-form">' +
      '<div class="auth-field"><label class="auth-label" for="appAccPhone">전화번호</label>' +
      '<input class="auth-input" id="appAccPhone" type="tel" autocomplete="tel" placeholder="010-XXXX-XXXX" required /></div>' +
      '<div class="auth-field"><label class="auth-label" for="appAccEmail">이메일</label>' +
      '<input class="auth-input" id="appAccEmail" type="email" autocomplete="email" required /></div>' +
      '<div class="auth-field"><label class="auth-label" for="appAccPw">새 비밀번호</label>' +
      '<input class="auth-input" id="appAccPw" type="password" autocomplete="new-password" placeholder="변경 시만 입력 (8자 이상)" minlength="8" /></div>' +
      '<div class="auth-field"><label class="auth-label" for="appAccPw2">새 비밀번호 확인</label>' +
      '<input class="auth-input" id="appAccPw2" type="password" autocomplete="new-password" placeholder="변경 시만 입력" /></div>' +
      '<div class="modal-account-actions">' +
      '<button type="submit" class="btn btn--primary">저장</button>' +
      '<button type="button" class="btn btn--secondary" id="appAccountCancel">닫기</button>' +
      "</div></form></div>";
    document.body.appendChild(wrap);

    wrap.addEventListener("click", function (e) {
      if (e.target === wrap) closeAccountModal();
    });

    document.getElementById("appAccountCancel").addEventListener("click", closeAccountModal);

    document.getElementById("appAccountForm").addEventListener("submit", async function (e) {
      e.preventDefault();
      var errEl = document.getElementById("appAccountErr");
      errEl.hidden = true;
      errEl.textContent = "";
      var r = await JBAuth.updateCurrentUserProfile({
        phone: document.getElementById("appAccPhone").value,
        email: document.getElementById("appAccEmail").value,
        password: document.getElementById("appAccPw").value,
        passwordConfirm: document.getElementById("appAccPw2").value,
      });
      if (!r.ok) {
        errEl.textContent = r.error;
        errEl.hidden = false;
        return;
      }
      closeAccountModal();
      var top = document.getElementById("app-topbar");
      if (top) {
        var titleEl = top.querySelector(".app-topbar__title");
        var t = titleEl ? titleEl.textContent : "제이비스포츠 관리프로그램";
        renderTopbar(top, t);
        finalizeTopbar(top, t);
      }
    });
  }

  function openAccountModal() {
    ensureAccountModal();
    var user = JBAuth.getCurrentUser();
    var modal = document.getElementById("appAccountModal");
    if (!user || !modal) return;
    document.getElementById("appAccPhone").value = user.phone || "";
    document.getElementById("appAccEmail").value = user.email || "";
    document.getElementById("appAccPw").value = "";
    document.getElementById("appAccPw2").value = "";
    var err = document.getElementById("appAccountErr");
    err.hidden = true;
    err.textContent = "";
    modal.hidden = false;
    document.body.classList.add("modal-open");
    closeUserDropdown();
  }

  function requireAuth() {
    if (!global.JBAuth || !JBAuth.getCurrentUser()) {
      location.replace("login.html");
      return false;
    }
    return true;
  }

  function renderSidebar(activeId, asideEl) {
    var navHtml = NAV.map(function (item) {
      var active = item.id === activeId ? " app-nav__link--active" : "";
      var ic = SVG[item.icon] || SVG.grid;
      return (
        '<a class="app-nav__link' +
        active +
        '" href="' +
        item.href +
        '" data-nav="' +
        item.id +
        '">' +
        ic +
        '<span class="app-nav__label">' +
        item.label +
        "</span></a>"
      );
    }).join("");

    asideEl.innerHTML =
      '<div class="app-sidebar__brand">' +
      '<span class="app-sidebar__brand-title">제이비스포츠</span>' +
      '<span class="app-sidebar__brand-sub">배구센터</span>' +
      "</div>" +
      '<nav class="app-nav" aria-label="주 메뉴">' +
      navHtml +
      "</nav>";
  }

  function renderTopbar(headerEl, titleText) {
    var user = JBAuth.getCurrentUser();
    if (!user) return;
    var pos = user.position || "직원";
    var avatar = firstChar(user.name);
    headerEl.innerHTML =
      '<div class="app-topbar__left">' +
      '<button type="button" class="app-menu-toggle" id="appMenuToggle" aria-label="메뉴 열기">' +
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>' +
      "</button>" +
      '<h1 class="app-topbar__title">' +
      (titleText || "제이비스포츠 관리프로그램") +
      "</h1>" +
      "</div>" +
      '<div class="app-topbar__user">' +
      '<div class="app-user-menu">' +
      '<button type="button" class="app-user-menu__trigger" id="appUserMenuBtn" aria-expanded="false" aria-haspopup="true" aria-label="사용자 메뉴">' +
      '<div class="app-topbar__meta">' +
      '<span class="app-topbar__name">' +
      escapeHtml(user.name) +
      "</span>" +
      '<span class="app-topbar__role">' +
      escapeHtml(pos) +
      "</span>" +
      "</div>" +
      '<span class="app-topbar__avatar" aria-hidden="true">' +
      escapeHtml(avatar) +
      "</span>" +
      '<svg class="app-user-menu__chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>' +
      "</button>" +
      '<div class="app-user-menu__dropdown" id="appUserDropdown" hidden role="menu">' +
      '<button type="button" class="app-user-menu__item" id="appUserMenuAccount" role="menuitem">회원관리</button>' +
      '<button type="button" class="app-user-menu__item app-user-menu__item--logout" id="appUserMenuLogout" role="menuitem">로그아웃</button>' +
      "</div></div></div>";
  }

  function finalizeTopbar(headerEl, titleText) {
    ensureAccountModal();

    var layout = document.querySelector(".app-layout");
    var toggle = headerEl.querySelector("#appMenuToggle");
    if (toggle && layout) {
      toggle.onclick = function (e) {
        e.stopPropagation();
        layout.classList.toggle("app-layout--nav-open");
      };
    }

    if (layout) {
      layout.onclick = function (e) {
        if (!layout.classList.contains("app-layout--nav-open")) return;
        if (e.target.closest(".app-sidebar") || e.target.closest(".app-menu-toggle")) return;
        layout.classList.remove("app-layout--nav-open");
      };
    }

    var menuBtn = headerEl.querySelector("#appUserMenuBtn");
    var dropdown = document.getElementById("appUserDropdown");
    if (menuBtn && dropdown) {
      menuBtn.onclick = function (e) {
        e.stopPropagation();
        var willOpen = dropdown.hidden;
        closeUserDropdown();
        if (willOpen) {
          dropdown.hidden = false;
          menuBtn.setAttribute("aria-expanded", "true");
          menuBtn.closest(".app-user-menu").classList.add("app-user-menu--open");
        }
      };
    }

    var accBtn = headerEl.querySelector("#appUserMenuAccount");
    if (accBtn) {
      accBtn.onclick = function () {
        openAccountModal();
      };
    }

    var outBtn = headerEl.querySelector("#appUserMenuLogout");
    if (outBtn) {
      outBtn.onclick = function () {
        JBAuth.logout();
        location.href = "login.html";
      };
    }

    if (!global.__jbUserMenuOutsideBound) {
      global.__jbUserMenuOutsideBound = true;
      document.addEventListener("mousedown", function (e) {
        if (e.target.closest && e.target.closest(".app-user-menu")) return;
        closeUserDropdown();
      });
    }
  }

  function init(options) {
    options = options || {};
    if (!requireAuth()) return;
    var activeId = options.activeNav || "dashboard";
    var aside = document.getElementById("app-sidebar");
    var top = document.getElementById("app-topbar");
    if (aside) renderSidebar(activeId, aside);
    if (top) {
      renderTopbar(top, options.pageTitle);
      finalizeTopbar(top, options.pageTitle);
    }
  }

  global.JBAppShell = {
    init: init,
    requireAuth: requireAuth,
    NAV: NAV,
  };
})(window);
