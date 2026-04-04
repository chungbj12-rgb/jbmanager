(function (global) {
  var STORAGE_USERS = "jb_volleyball_users";
  var STORAGE_SESSION = "jb_volleyball_session_phone";
  var PBKDF2_ITERATIONS = 100000;

  var PHONE_RE = /^01[016789]-\d{4}-\d{4}$/;
  var BIRTH_RE = /^\d{6}$/;
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function config() {
    return global.JBAuthConfig || { storageMode: "local", apiBaseUrl: "" };
  }

  function ensureSubtle() {
    if (!global.crypto || !crypto.subtle) {
      return {
        ok: false,
        error:
          "이 페이지는 보안 컨텍스트가 아닙니다. 미리보기는 http://127.0.0.1:8765 로 여세요.",
      };
    }
    return { ok: true };
  }

  function bufToB64(buf) {
    var bytes = new Uint8Array(buf);
    var bin = "";
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }

  function b64ToBuf(s) {
    var bin = atob(s);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  function safeEqualStr(a, b) {
    if (a.length !== b.length) return false;
    var x = 0;
    for (var i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return x === 0;
  }

  function normalizePhone(input) {
    var d = String(input || "").replace(/\D/g, "");
    if (d.length === 11 && /^01[016789]/.test(d)) {
      return d.slice(0, 3) + "-" + d.slice(3, 7) + "-" + d.slice(7);
    }
    return String(input || "").trim();
  }

  function getUsers() {
    try {
      var raw = localStorage.getItem(STORAGE_USERS);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function saveUsers(list) {
    localStorage.setItem(STORAGE_USERS, JSON.stringify(list));
  }

  function findByPhone(phone) {
    return getUsers().find(function (u) {
      return u.phone === phone;
    });
  }

  function replaceUser(updated) {
    var users = getUsers();
    var i = users.findIndex(function (x) {
      return x.phone === updated.phone;
    });
    if (i < 0) return;
    users[i] = updated;
    saveUsers(users);
  }

  function validateSignup(data) {
    var errors = [];
    if (!data.name || !data.name.trim()) errors.push("이름을 입력해주세요.");
    if (!BIRTH_RE.test((data.birth || "").trim())) {
      errors.push("생년월일은 YYMMDD 6자리 숫자로 입력해주세요.");
    }
    var phone = normalizePhone(data.phone);
    if (!PHONE_RE.test(phone)) {
      errors.push("전화번호는 010-XXXX-XXXX 형식으로 입력해주세요.");
    }
    if (!EMAIL_RE.test((data.email || "").trim())) {
      errors.push("올바른 이메일 주소를 입력해주세요.");
    }
    if (!data.password || data.password.length < 8) {
      errors.push("비밀번호는 8자 이상이어야 합니다.");
    }
    if (data.password !== data.passwordConfirm) {
      errors.push("비밀번호 확인이 일치하지 않습니다.");
    }
    if (!data.position || !data.position.trim()) {
      errors.push("직책을 선택해주세요.");
    }
    return { ok: errors.length === 0, errors: errors, phone: phone };
  }

  function validateLoginPhone(phone) {
    var p = normalizePhone(phone);
    if (!PHONE_RE.test(p)) {
      return { ok: false, error: "전화번호는 010-XXXX-XXXX 형식으로 입력해주세요.", phone: p };
    }
    return { ok: true, phone: p };
  }

  async function pbkdf2Derive(password, saltBytes) {
    var enc = new TextEncoder();
    var keyMaterial = await crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );
    return crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: saltBytes,
        iterations: PBKDF2_ITERATIONS,
        hash: "SHA-256",
      },
      keyMaterial,
      256
    );
  }

  async function hashCredentials(password) {
    var salt = crypto.getRandomValues(new Uint8Array(16));
    var hashBuf = await pbkdf2Derive(password, salt);
    return {
      passwordSalt: bufToB64(salt.buffer),
      passwordHash: bufToB64(hashBuf),
      kdf: { name: "PBKDF2", hash: "SHA-256", iterations: PBKDF2_ITERATIONS },
    };
  }

  async function verifyHash(password, saltB64, hashB64) {
    var salt = b64ToBuf(saltB64);
    var expected = hashB64;
    var hashBuf = await pbkdf2Derive(password, salt);
    var actual = bufToB64(hashBuf);
    return safeEqualStr(actual, expected);
  }

  async function upgradeLegacyUser(u, password) {
    var h = await hashCredentials(password);
    delete u.password;
    u.passwordSalt = h.passwordSalt;
    u.passwordHash = h.passwordHash;
    u.kdf = h.kdf;
    replaceUser(u);
  }

  async function register(data) {
    if (config().storageMode === "api") {
      return {
        ok: false,
        errors: [
          'storageMode가 "api"입니다. 서버 연동을 구현하거나 auth-config.js에서 "local"로 바꿔주세요.',
        ],
      };
    }

    var subtle = ensureSubtle();
    if (!subtle.ok) return { ok: false, errors: [subtle.error] };

    var v = validateSignup(data);
    if (!v.ok) return { ok: false, errors: v.errors };

    if (findByPhone(v.phone)) {
      return { ok: false, errors: ["이미 가입된 전화번호입니다."] };
    }

    var cred = await hashCredentials(data.password);
    var users = getUsers();
    users.push({
      name: data.name.trim(),
      birth: data.birth.trim(),
      phone: v.phone,
      email: data.email.trim(),
      position: data.position.trim(),
      createdAt: new Date().toISOString(),
      passwordSalt: cred.passwordSalt,
      passwordHash: cred.passwordHash,
      kdf: cred.kdf,
    });
    saveUsers(users);
    return { ok: true };
  }

  async function login(phoneInput, password) {
    if (config().storageMode === "api") {
      return {
        ok: false,
        error:
          'API 모드는 아직 연결되지 않았습니다. auth-config.js에서 storageMode를 "local"로 두세요.',
      };
    }

    var subtle = ensureSubtle();
    if (!subtle.ok) return { ok: false, error: subtle.error };

    var pv = validateLoginPhone(phoneInput);
    if (!pv.ok) return { ok: false, error: pv.error };

    var u = findByPhone(pv.phone);
    if (!u) {
      return { ok: false, error: "전화번호 또는 비밀번호가 올바르지 않습니다." };
    }

    var ok = false;
    if (u.passwordHash && u.passwordSalt) {
      ok = await verifyHash(password, u.passwordSalt, u.passwordHash);
    } else if (u.password) {
      ok = u.password === password;
      if (ok) await upgradeLegacyUser(u, password);
    }

    if (!ok) {
      return { ok: false, error: "전화번호 또는 비밀번호가 올바르지 않습니다." };
    }

    sessionStorage.setItem(STORAGE_SESSION, pv.phone);
    return { ok: true, user: publicUser(findByPhone(pv.phone)) };
  }

  function publicUser(u) {
    if (!u) return null;
    return {
      name: u.name,
      phone: u.phone,
      position: u.position,
      email: u.email,
      birth: u.birth,
    };
  }

  function logout() {
    sessionStorage.removeItem(STORAGE_SESSION);
  }

  function getSessionPhone() {
    return sessionStorage.getItem(STORAGE_SESSION) || "";
  }

  function getCurrentUser() {
    var phone = getSessionPhone();
    if (!phone) return null;
    return publicUser(findByPhone(phone));
  }

  function listStaffSafe() {
    return getUsers().map(function (u) {
      return {
        name: u.name,
        phone: u.phone,
        position: u.position,
        email: u.email,
        birth: u.birth,
        createdAt: u.createdAt || "",
      };
    });
  }

  async function updateCurrentUserProfile(patch) {
    if (config().storageMode === "api") {
      return { ok: false, error: 'API 모드에서는 지원하지 않습니다. auth-config.js에서 "local"로 사용해주세요.' };
    }

    var subtle = ensureSubtle();
    if (!subtle.ok) return { ok: false, error: subtle.error };

    var oldPhone = getSessionPhone();
    if (!oldPhone) return { ok: false, error: "로그인이 필요합니다." };

    var u = findByPhone(oldPhone);
    if (!u) return { ok: false, error: "사용자 정보를 찾을 수 없습니다." };

    var newPhone = normalizePhone(patch.phone);
    if (!PHONE_RE.test(newPhone)) {
      return { ok: false, error: "전화번호는 010-XXXX-XXXX 형식으로 입력해주세요." };
    }

    if (newPhone !== oldPhone && findByPhone(newPhone)) {
      return { ok: false, error: "이미 다른 계정에서 사용 중인 전화번호입니다." };
    }

    var email = (patch.email || "").trim();
    if (!EMAIL_RE.test(email)) {
      return { ok: false, error: "올바른 이메일 주소를 입력해주세요." };
    }

    var pw = String(patch.password || "");
    var pw2 = String(patch.passwordConfirm || "");
    if (pw.length > 0 || pw2.length > 0) {
      if (pw.length < 8) {
        return { ok: false, error: "새 비밀번호는 8자 이상이어야 합니다." };
      }
      if (pw !== pw2) {
        return { ok: false, error: "새 비밀번호 확인이 일치하지 않습니다." };
      }
    }

    var users = getUsers();
    var i = users.findIndex(function (x) {
      return x.phone === oldPhone;
    });
    if (i < 0) return { ok: false, error: "사용자 정보를 찾을 수 없습니다." };

    var row = users[i];
    row.phone = newPhone;
    row.email = email;

    if (pw.length > 0) {
      var cred = await hashCredentials(pw);
      delete row.password;
      row.passwordSalt = cred.passwordSalt;
      row.passwordHash = cred.passwordHash;
      row.kdf = cred.kdf;
    }

    users[i] = row;
    saveUsers(users);

    if (newPhone !== oldPhone) {
      sessionStorage.setItem(STORAGE_SESSION, newPhone);
    }

    return { ok: true, user: publicUser(findByPhone(newPhone)) };
  }

  global.JBAuth = {
    normalizePhone: normalizePhone,
    validateSignup: validateSignup,
    register: register,
    login: login,
    logout: logout,
    getSessionPhone: getSessionPhone,
    getCurrentUser: getCurrentUser,
    getUsers: getUsers,
    listStaffSafe: listStaffSafe,
    updateCurrentUserProfile: updateCurrentUserProfile,
  };
})(window);
