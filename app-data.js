(function (global) {
  var K_MEMBERS = "jb_center_members";
  var K_CLASSES = "jb_class_templates";
  var K_ATTEND = "jb_attendance_records";
  var K_PAY = "jb_payment_records";
  var K_TRIALS = "jb_trial_records";
  var K_TRIAL_CONSULT = "jb_trial_consultations";
  var K_MAKEUP = "jb_makeup_records";
  var K_MAKEUP_CONSULT = "jb_makeup_consultations";
  var K_MAKEUP_DEMO_FLAG = "jb_makeup_demo_two";
  var K_EVENTS = "jb_schedule_events";
  var K_CONSULT = "jb_consultation_records";
  var K_LINKS = "jb_application_links";
  var K_CLUB = "jb_club_team_records";
  var K_SHUTTLE = "jb_shuttle_records";
  var K_SHUTTLE_VEHICLES = "jb_shuttle_vehicles_v1";
  var K_SHUTTLE_ROUTES = "jb_shuttle_routes_v1";
  var K_SHUTTLE_SHARE_TOKEN = "jb_shuttle_share_token_v1";
  var K_PROTECTIVE = "jb_protective_requests";
  var K_PROTECTIVE_INV = "jb_protective_inventory_v1";
  var K_STUDENTS_REG = "jb_students_registry_v1";
  var K_CLASSES_REG = "jb_classes_registry_v1";
  var K_NOTICES = "jb_notices_v1";
  var K_INIT = "jb_management_data_v1";
  var K_MEMBER_SCHEMA = "jb_members_schema_v2";
  var K_MEMBER_CLUB_PROFILE = "jb_member_club_profile_v1";

  function readJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function writeJson(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {}
    if (typeof global.JBRemoteSync !== "undefined" && global.JBRemoteSync.enabled && global.JBRemoteSync.enabled()) {
      global.JBRemoteSync.queuePush(key, val);
    }
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function dateKey(d) {
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function monthKey(d) {
    return d.getFullYear() + "-" + pad(d.getMonth() + 1);
  }

  function uid(prefix) {
    return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function ensureSeed() {
    if (localStorage.getItem(K_INIT)) return;

    var now = new Date();
    var members = [];
    var early = ["강주원", "강지원", "강태오", "강은서"];
    function memberDefaults(extra) {
      var t = new Date().toISOString();
      return Object.assign(
        {
          enrollmentStatus: "active",
          gender: "",
          grade: "",
          parentPhoneMother: "",
          parentPhoneFather: "",
          address: "",
          school: "",
          className: "",
          tuition: null,
          pickupLocation: "",
          dropoffLocation: "",
          memo: "",
          clubJersey: "",
          clubUniform: "",
          clubJoined: "",
          clubRrn: "",
          updatedAt: t,
        },
        extra
      );
    }
    for (var i = 0; i < early.length; i++) {
      members.push(
        memberDefaults({
          id: uid("m"),
          name: early[i],
          phone: "010-100" + i + "-000" + (i + 1),
          gender: i % 2 === 0 ? "남" : "여",
          grade: ((i % 6) + 1) + "학년",
          parentPhoneMother: "010-200" + i + "-000" + (i + 1),
          parentPhoneFather: i % 2 === 0 ? "010-300" + i + "-000" + (i + 1) : "",
          address: "-",
          school: "○○중",
          className: ["금2부", "토1부", "일3부", "금2부"][i % 4],
          createdAt: now.toISOString(),
        })
      );
    }
    for (var j = 0; j < 176; j++) {
      var n = j + 5;
      var past = new Date(now.getTime() - (j + 3) * 86400000);
      members.push(
        memberDefaults({
          id: uid("m"),
          name: "회원" + String(n).padStart(3, "0"),
          phone: "010-2" + pad((j % 99) + 1) + "-" + pad(1000 + (j % 9000)),
          gender: j % 2 === 0 ? "남" : "여",
          grade: ((j % 6) + 1) + "학년",
          parentPhoneMother: "010-3" + pad((j % 89) + 10) + "-" + pad(1000 + (j % 9000)),
          parentPhoneFather: j % 3 === 0 ? "" : "010-4" + pad((j % 89) + 10) + "-" + pad(1000 + (j % 9000)),
          address: j % 5 === 0 ? "-" : "서울시",
          school: j % 4 === 0 ? "-" : "○○초",
          className: ["금2부", "토1부", "일3부"][j % 3],
          createdAt: past.toISOString(),
        })
      );
    }

    var allDays = [0, 1, 2, 3, 4, 5, 6];
    var classes = [
      {
        id: uid("c"),
        name: "U-15(여중대표반)",
        weekdays: allDays.slice(),
        startTime: "10:00",
        endTime: "13:00",
        coaches: ["정봉진", "오예진"],
        capacity: 20,
        tuition: 150000,
      },
      {
        id: uid("c"),
        name: "U-18(여고대표반)",
        weekdays: allDays.slice(),
        startTime: "10:00",
        endTime: "13:00",
        coaches: ["정봉진"],
        capacity: 16,
        tuition: 150000,
      },
      {
        id: uid("c"),
        name: "일3부",
        weekdays: allDays.slice(),
        startTime: "13:00",
        endTime: "14:30",
        coaches: [],
        capacity: 12,
        tuition: 120000,
      },
      {
        id: uid("c"),
        name: "U-15(남중대표반)",
        weekdays: allDays.slice(),
        startTime: "14:30",
        endTime: "16:30",
        coaches: ["정봉진"],
        capacity: 12,
        tuition: 150000,
      },
    ];

    writeJson(K_MEMBERS, members);
    writeJson(K_CLASSES, classes);
    writeJson(K_ATTEND, []);
    writeJson(K_PAY, []);
    writeJson(K_TRIALS, []);
    writeJson(K_TRIAL_CONSULT, []);
    writeJson(K_MAKEUP, []);
    writeJson(K_MAKEUP_CONSULT, []);
    writeJson(K_EVENTS, []);
    writeJson(K_CONSULT, []);
    writeJson(K_LINKS, [
      { id: uid("l"), title: "체험 신청 구글폼", url: "https://forms.google.com/", note: "예시 링크" },
      { id: uid("l"), title: "보강 신청 구글폼", url: "https://forms.google.com/", note: "예시 보강 링크" },
      { id: uid("l"), title: "정규 등록 신청", url: "https://forms.google.com/", note: "예시 정규신청 링크" },
      {
        id: uid("l"),
        title: "보호대신청",
        url: "https://example.com/protective-apply.html",
        note: "배포 주소의 protective-apply.html 전체 URL로 교체",
      },
    ]);
    writeJson(K_CLUB, []);
    writeJson(K_SHUTTLE, []);
    writeJson(K_PROTECTIVE, []);
    writeJson(K_PROTECTIVE_INV, { knee: { S: 0, M: 0, L: 0 }, elbow: { S: 0, M: 0, L: 0 } });
    localStorage.setItem(K_INIT, "1");
  }

  function migrateMembersIfNeeded() {
    if (localStorage.getItem(K_MEMBER_SCHEMA) === "1") return;
    var list = readJson(K_MEMBERS, []);
    if (!Array.isArray(list) || list.length === 0) {
      localStorage.setItem(K_MEMBER_SCHEMA, "1");
      return;
    }
    if (list[0].enrollmentStatus !== undefined && list[0].parentPhoneMother !== undefined) {
      localStorage.setItem(K_MEMBER_SCHEMA, "1");
      return;
    }
    var t0 = new Date().toISOString();
    list = list.map(function (m, idx) {
      var t = m.createdAt || t0;
      return Object.assign(
        {
          enrollmentStatus: "active",
          gender: idx % 2 === 0 ? "남" : "여",
          grade: ((idx % 6) + 1) + "학년",
          parentPhoneMother: "",
          parentPhoneFather: "",
          address: "-",
          school: "-",
          className: ["금2부", "토1부", "일3부"][idx % 3],
          tuition: null,
          pickupLocation: "",
          dropoffLocation: "",
          memo: "",
          updatedAt: t,
        },
        m
      );
    });
    saveMembers(list);
    localStorage.setItem(K_MEMBER_SCHEMA, "1");
  }

  function migrateMemberClubProfileFields() {
    if (localStorage.getItem(K_MEMBER_CLUB_PROFILE) === "1") return;
    var list = readJson(K_MEMBERS, []);
    if (!Array.isArray(list) || list.length === 0) {
      localStorage.setItem(K_MEMBER_CLUB_PROFILE, "1");
      return;
    }
    var changed = false;
    for (var i = 0; i < list.length; i++) {
      var m = list[i];
      if (m.clubJersey === undefined) {
        m.clubJersey = "";
        m.clubUniform = "";
        m.clubJoined = "";
        m.clubRrn = "";
        changed = true;
      }
    }
    if (changed) writeJson(K_MEMBERS, list);
    localStorage.setItem(K_MEMBER_CLUB_PROFILE, "1");
  }

  function getMembers() {
    ensureSeed();
    migrateMembersIfNeeded();
    migrateMemberClubProfileFields();
    var list = readJson(K_MEMBERS, []);
    return Array.isArray(list) ? list : [];
  }

  function saveMembers(list) {
    writeJson(K_MEMBERS, list);
  }

  function normalizeClassTime(t) {
    if (t == null) return "";
    var m = String(t).trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return "";
    var h = parseInt(m[1], 10);
    var min = parseInt(m[2], 10);
    if (h < 0 || h > 23 || (min !== 0 && min !== 30)) return "";
    return String(h).padStart(2, "0") + ":" + (min === 0 ? "00" : "30");
  }

  function migrateClassTemplate(c) {
    if (!c || typeof c !== "object") return c;
    var o = Object.assign({}, c);
    if (!Array.isArray(o.weekdays)) o.weekdays = [1, 2, 3, 4, 5];
    if (!Array.isArray(o.coaches)) o.coaches = [];
    if (o.capacity == null || o.capacity === "") o.capacity = 20;
    else {
      var cap = Number(o.capacity);
      o.capacity = isNaN(cap) || cap < 0 ? 20 : cap;
    }
    if (o.tuition != null && o.tuition !== "" && !isNaN(Number(o.tuition))) o.tuition = Number(o.tuition);
    else o.tuition = null;
    var ns = normalizeClassTime(o.startTime);
    var ne = normalizeClassTime(o.endTime);
    o.startTime = ns || "09:00";
    o.endTime = ne || "10:00";
    return o;
  }

  function getClasses() {
    ensureSeed();
    var list = readJson(K_CLASSES, []);
    if (!Array.isArray(list)) return [];
    return list.map(migrateClassTemplate);
  }

  function saveClasses(list) {
    writeJson(K_CLASSES, list);
  }

  /** 재원생 중 해당 클래스명과 일치하는 회원 수 */
  function countActiveMembersByClassName(className) {
    var cn = (className || "").trim();
    if (!cn) return 0;
    var members = getMembers();
    var n = 0;
    for (var i = 0; i < members.length; i++) {
      var m = members[i];
      if ((m.enrollmentStatus || "active") !== "active") continue;
      if ((m.className || "").trim() === cn) n++;
    }
    return n;
  }

  /**
   * 클래스명만 한 줄씩 (빈 줄 제외). 요일·시간 등은 기본값.
   * 중복 클래스명은 건너뜀.
   */
  function bulkAddClassTemplatesFromNames(text) {
    var lines = String(text || "")
      .split(/\r?\n/)
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);
    var existing = getClasses();
    var existingNames = {};
    for (var e = 0; e < existing.length; e++) {
      existingNames[(existing[e].name || "").trim()] = true;
    }
    var list = existing.slice();
    var added = 0;
    for (var i = 0; i < lines.length; i++) {
      var nm = lines[i];
      if (existingNames[nm]) continue;
      existingNames[nm] = true;
      list.push(
        migrateClassTemplate({
          id: uid("c"),
          name: nm,
          weekdays: [1, 2, 3, 4, 5],
          startTime: "09:00",
          endTime: "10:00",
          coaches: [],
          capacity: 20,
          tuition: null,
        })
      );
      added++;
    }
    saveClasses(list);
    return added;
  }

  function migrateAttendanceRecord(r) {
    if (!r || typeof r !== "object") return r;
    var o = Object.assign({}, r);
    if (o.note == null) o.note = "";
    if (o.classId == null) o.classId = "";
    if (o.status == null) {
      if (o.present === true) o.status = "present";
      else if (o.present === false) o.status = "absent";
      else o.status = "";
    }
    if (o.rowKey == null) {
      if (o.memberId) o.rowKey = "m:" + o.memberId;
      else if (o.trialId) o.rowKey = "t:" + o.trialId;
      else if (o.makeupId) o.rowKey = "w:" + o.makeupId;
      else if (o.guestId) o.rowKey = "g:" + o.guestId;
    }
    if (o.sourceType == null) {
      if (o.trialId) o.sourceType = "trial";
      else if (o.makeupId) o.sourceType = "makeup";
      else if (o.guestId) o.sourceType = "guest";
      else o.sourceType = "member";
    }
    if (o.present == null) o.present = o.status === "present";
    if (o.guestName == null) o.guestName = "";
    if (o.guestPhone == null) o.guestPhone = "";
    if (o.guestDivision == null) o.guestDivision = "regular";
    return o;
  }

  function getAttendanceRecords() {
    ensureSeed();
    var list = readJson(K_ATTEND, []);
    if (!Array.isArray(list)) return [];
    return list.map(migrateAttendanceRecord);
  }

  function saveAttendanceRecords(list) {
    writeJson(K_ATTEND, list);
  }

  /**
   * 출결관리(날짜+클래스) 한 세션의 행 전체 저장. 동일 date+classId 기존 행은 교체.
   * row: { rowKey, sourceType, memberId?, trialId?, makeupId?, guestId?, status, note }
   */
  function saveAttendanceSessionBatch(dateStr, classId, rows) {
    var list = readJson(K_ATTEND, []);
    if (!Array.isArray(list)) list = [];
    var filtered = list.filter(function (r) {
      return !(r.date === dateStr && r.classId === classId);
    });
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i] || {};
      var rec = {
        date: dateStr,
        classId: classId,
        rowKey: row.rowKey || "",
        sourceType: row.sourceType || "member",
        memberId: row.memberId || "",
        trialId: row.trialId || "",
        makeupId: row.makeupId || "",
        guestId: row.guestId || "",
        guestName: row.guestName != null ? String(row.guestName) : "",
        guestPhone: row.guestPhone != null ? String(row.guestPhone) : "",
        guestDivision:
          row.sourceType === "guest" ? (row.guestDivision != null ? String(row.guestDivision) : "regular") : "regular",
        note: row.note != null ? String(row.note) : "",
        status: row.status != null ? String(row.status) : "",
        present: row.status === "present",
      };
      if (!rec.rowKey) continue;
      filtered.push(migrateAttendanceRecord(rec));
    }
    writeJson(K_ATTEND, filtered);
  }

  function getPayments() {
    ensureSeed();
    var list = readJson(K_PAY, []);
    return Array.isArray(list) ? list : [];
  }

  function savePayments(list) {
    writeJson(K_PAY, list);
  }

  /** 회원관리·체험등록 등에서 동일하게 사용하는 학년 값 목록 */
  var MEMBER_GRADE_OPTIONS = [
    "1학년",
    "2학년",
    "3학년",
    "4학년",
    "5학년",
    "6학년",
    "중1",
    "중2",
    "중3",
    "고1",
    "고2",
    "고3",
    "성인",
  ];

  function getMemberGradeOptions() {
    return MEMBER_GRADE_OPTIONS.slice();
  }

  function normalizePhoneDigits(s) {
    return String(s == null ? "" : s).replace(/\D/g, "");
  }

  /** 체험 등록 전화번호가 회원(student phone)과 일치하면 등록회원으로 간주 */
  function isRegisteredMemberPhone(phone) {
    var d = normalizePhoneDigits(phone);
    if (d.length < 10) return false;
    var members = getMembers();
    for (var i = 0; i < members.length; i++) {
      if (normalizePhoneDigits(members[i].phone) === d) return true;
    }
    return false;
  }

  var TRIAL_STATUS = {
    CONSULT_BEFORE: "상담전",
    BEFORE: "체험전",
    DONE: "체험완료",
    EXTRA: "추가상담",
    FOLLOW_REG: "후속등록",
    FOLLOW_UNREG: "후속미등록",
  };

  function parseTrialDateOnly(s) {
    if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(String(s).trim())) return null;
    var p = String(s).trim().split("-").map(Number);
    return new Date(p[0], p[1] - 1, p[2]);
  }

  /** 체험 종료 시각: trialTime이 있으면 해당 시각, 없으면 당일 23:59:59.999 */
  function trialSessionEndDate(row) {
    if (!row || !row.trialDate) return null;
    var d = parseTrialDateOnly(row.trialDate);
    if (!d) return null;
    var tm = (row.trialTime || "").trim();
    var m = tm.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (m) {
      d.setHours(parseInt(m[1], 10), parseInt(m[2], 10), m[3] ? parseInt(m[3], 10) : 0, 0);
    } else {
      d.setHours(23, 59, 59, 999);
    }
    return d;
  }

  /** 체험전이면서 체험일정이 지난 경우 → 체험완료로 자동 전환 */
  function applyTrialAutoStatusIfNeeded() {
    var list = readJson(K_TRIALS, []);
    if (!Array.isArray(list) || list.length === 0) return;
    var migrated = list.map(migrateTrialRow);
    var now = new Date();
    var changed = false;
    for (var i = 0; i < migrated.length; i++) {
      var row = migrated[i];
      if (row.trialStatus !== TRIAL_STATUS.BEFORE) continue;
      var end = trialSessionEndDate(row);
      if (end && now.getTime() > end.getTime()) {
        row.trialStatus = TRIAL_STATUS.DONE;
        row.updatedAt = new Date().toISOString();
        row.consultationDone = false;
        changed = true;
      }
    }
    if (changed) writeJson(K_TRIALS, migrated);
  }

  function migrateTrialRow(t) {
    if (!t || typeof t !== "object") return t;
    var o = Object.assign({}, t);
    if (o.className == null) o.className = "";
    if (o.grade == null) o.grade = "";
    if (o.gender == null) o.gender = "";
    if (o.school == null) o.school = "";
    if (o.notes == null) o.notes = o.note != null ? String(o.note) : "";
    if (o.trialTime == null) o.trialTime = "";
    if (typeof o.consultationDone !== "boolean") o.consultationDone = false;
    if (typeof o.submittedByParent !== "boolean") o.submittedByParent = true;

    var validStatuses = [
      TRIAL_STATUS.CONSULT_BEFORE,
      TRIAL_STATUS.BEFORE,
      TRIAL_STATUS.DONE,
      TRIAL_STATUS.EXTRA,
      TRIAL_STATUS.FOLLOW_REG,
      TRIAL_STATUS.FOLLOW_UNREG,
    ];
    var ok = validStatuses.indexOf(o.trialStatus) !== -1;
    if (!ok) {
      if (o.trialStatus === "체험상담") {
        o.trialStatus = TRIAL_STATUS.EXTRA;
      } else if (o.consultationDone === true) {
        o.trialStatus = TRIAL_STATUS.EXTRA;
      } else {
        o.trialStatus = TRIAL_STATUS.BEFORE;
      }
    }
    if (
      o.trialStatus === TRIAL_STATUS.EXTRA ||
      o.trialStatus === TRIAL_STATUS.FOLLOW_REG ||
      o.trialStatus === TRIAL_STATUS.FOLLOW_UNREG
    ) {
      o.consultationDone = true;
    } else {
      o.consultationDone = false;
    }

    return o;
  }

  function getTrialSortTimestamp(t) {
    if (!t) return 0;
    if (t.createdAt) {
      var c = new Date(t.createdAt);
      if (!isNaN(c.getTime())) return c.getTime();
    }
    var d = parseTrialDateOnly(t.trialDate || "");
    return d ? d.getTime() : 0;
  }

  function ensureTrialConsultStorage() {
    if (localStorage.getItem(K_TRIAL_CONSULT) === null) {
      writeJson(K_TRIAL_CONSULT, []);
    }
  }

  function migrateConsultRow(r) {
    if (!r || typeof r !== "object") return r;
    var o = Object.assign({}, r);
    if (o.applicantName == null) o.applicantName = o.name != null ? String(o.name) : "";
    if (o.phone == null) o.phone = "";
    if (o.gender == null) o.gender = "";
    if (o.grade == null) o.grade = "";
    if (o.consultStatus !== "발송완료") o.consultStatus = "상담대기";
    if (o.createdAt == null) o.createdAt = new Date().toISOString();
    return o;
  }

  function getTrialConsultations() {
    ensureSeed();
    ensureTrialConsultStorage();
    var list = readJson(K_TRIAL_CONSULT, []);
    if (!Array.isArray(list)) return [];
    return list.map(migrateConsultRow);
  }

  function saveTrialConsultations(list) {
    writeJson(K_TRIAL_CONSULT, list);
  }

  function formatPhoneKr11FromDigits(d) {
    var s = String(d || "").replace(/\D/g, "").slice(0, 11);
    if (s.length !== 11 || !/^01[016789]/.test(s)) return "";
    return s.slice(0, 3) + "-" + s.slice(3, 7) + "-" + s.slice(7);
  }

  /**
   * 학부모 체험신청서(웹폼) 제출 시 서버에서 호출할 수 있는 저장 헬퍼.
   * 로컬 데모에서는 localStorage에만 반영됩니다.
   */
  function addTrialFromParentSubmission(data) {
    ensureSeed();
    ensureTrialConsultStorage();
    var raw = data || {};
    var phone = formatPhoneKr11FromDigits(raw.phone);
    if (!phone) return null;
    var applicantName = String(raw.applicantName || raw.name || "").trim();
    if (!applicantName) return null;
    var trialDate = String(raw.trialDate || "").trim();
    if (!trialDate || !/^\d{4}-\d{2}-\d{2}$/.test(trialDate)) return null;
    var className = String(raw.className || "").trim();
    if (!className) return null;
    var now = new Date().toISOString();
    var row = {
      id: uid("t"),
      applicantName: applicantName,
      phone: phone,
      gender: String(raw.gender || "").trim(),
      grade: String(raw.grade || "").trim(),
      className: className,
      trialDate: trialDate,
      school: String(raw.school || "").trim(),
      notes: String(raw.notes || raw.memo || "").trim(),
      consultationDone: false,
      trialStatus: TRIAL_STATUS.CONSULT_BEFORE,
      status: "예약",
      submittedByParent: true,
      createdAt: now,
      updatedAt: now,
    };
    row = migrateTrialRow(row);
    var list = readJson(K_TRIALS, []);
    if (!Array.isArray(list)) list = [];
    list.push(row);
    saveTrials(list);
    return row;
  }

  /** 신청서 링크 목록에서 체험 신청 URL (제목에 '체험' 우선, 없으면 첫 URL) */
  function getTrialApplicationLink() {
    var links = getAppLinks();
    if (!Array.isArray(links) || links.length === 0) return "https://forms.google.com/";
    var i;
    for (i = 0; i < links.length; i++) {
      var title = (links[i].title || "").trim();
      var url = (links[i].url || "").trim();
      if (title.indexOf("체험") !== -1 && url) return url;
    }
    for (i = 0; i < links.length; i++) {
      var u = (links[i].url || "").trim();
      if (u) return u;
    }
    return "https://forms.google.com/";
  }

  /** 신청서 링크 목록에서 정규 신청 URL (제목에 '정규' 우선, 없으면 첫 URL) */
  function getRegularApplicationLink() {
    var links = getAppLinks();
    if (!Array.isArray(links) || links.length === 0) return "https://forms.google.com/";
    var i;
    for (i = 0; i < links.length; i++) {
      var title = (links[i].title || "").trim();
      var url = (links[i].url || "").trim();
      if (title.indexOf("정규") !== -1 && url) return url;
    }
    for (i = 0; i < links.length; i++) {
      var u = (links[i].url || "").trim();
      if (u) return u;
    }
    return "https://forms.google.com/";
  }

  function getTrials() {
    ensureSeed();
    applyTrialAutoStatusIfNeeded();
    var list = readJson(K_TRIALS, []);
    if (!Array.isArray(list)) return [];
    return list.map(migrateTrialRow);
  }

  function saveTrials(list) {
    writeJson(K_TRIALS, list);
  }

  var MAKEUP_STATUS = {
    PENDING: "예약대기",
    CONFIRMED: "예약확정",
    CHANGE_REQ: "변경요청",
  };

  function migrateMakeupRow(m) {
    if (!m || typeof m !== "object") return m;
    var o = Object.assign({}, m);
    if (o.memberName == null) o.memberName = String(o.applicantName || "").trim();
    if (o.originalClass == null) o.originalClass = "";
    if (o.absenceDate == null) o.absenceDate = o.date != null ? String(o.date) : "";
    if (o.makeupClass == null) o.makeupClass = "";
    if (o.makeupDate == null) o.makeupDate = o.date != null ? String(o.date) : o.absenceDate || "";
    if (o.memo == null) o.memo = o.note != null ? String(o.note) : "";
    if (o.phone == null) o.phone = o.parentPhone != null ? String(o.parentPhone) : "";
    if (o.timeSlot == null) o.timeSlot = "";
    var validSt = [MAKEUP_STATUS.PENDING, MAKEUP_STATUS.CONFIRMED, MAKEUP_STATUS.CHANGE_REQ];
    if (validSt.indexOf(o.status) === -1) o.status = MAKEUP_STATUS.PENDING;
    if (typeof o.submittedByParent !== "boolean") o.submittedByParent = true;
    if (o.createdAt == null) o.createdAt = new Date().toISOString();
    if (o.updatedAt == null) o.updatedAt = o.createdAt;
    return o;
  }

  function getMakeupSortTimestamp(m) {
    if (!m) return 0;
    if (m.createdAt) {
      var c = new Date(m.createdAt);
      if (!isNaN(c.getTime())) return c.getTime();
    }
    var d = String(m.makeupDate || m.absenceDate || "").trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      var p = d.split("-").map(Number);
      return new Date(p[0], p[1] - 1, p[2]).getTime();
    }
    return 0;
  }

  /** 보강 목록이 비어 있을 때 테스트용 2건을 한 번만 넣음 */
  function ensureMakeupDemoTwoSamples() {
    if (localStorage.getItem(K_MAKEUP_DEMO_FLAG) === "1") return;
    var raw = readJson(K_MAKEUP, []);
    if (!Array.isArray(raw) || raw.length > 0) return;
    var now = new Date().toISOString();
    var today = new Date();
    var in3 = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3);
    var in7 = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
    var tom = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    var rows = [
      {
        id: uid("mk"),
        memberName: "김테스트",
        originalClass: "U-15(남중대표반)",
        absenceDate: dateKey(today),
        makeupClass: "일3부",
        makeupDate: dateKey(in3),
        memo: "",
        phone: "010-1001-0001",
        timeSlot: "",
        status: MAKEUP_STATUS.PENDING,
        submittedByParent: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uid("mk"),
        memberName: "이샘플",
        originalClass: "U-18(여고대표반)",
        absenceDate: dateKey(tom),
        makeupClass: "금2부",
        makeupDate: dateKey(in7),
        memo: "",
        phone: "010-2002-0002",
        timeSlot: "",
        status: MAKEUP_STATUS.PENDING,
        submittedByParent: true,
        createdAt: now,
        updatedAt: now,
      },
    ];
    writeJson(K_MAKEUP, rows.map(migrateMakeupRow));
    localStorage.setItem(K_MAKEUP_DEMO_FLAG, "1");
  }

  function getMakeup() {
    ensureSeed();
    ensureMakeupDemoTwoSamples();
    var list = readJson(K_MAKEUP, []);
    if (!Array.isArray(list)) return [];
    return list.map(migrateMakeupRow);
  }

  function saveMakeup(list) {
    writeJson(K_MAKEUP, list);
  }

  function ensureMakeupConsultStorage() {
    if (localStorage.getItem(K_MAKEUP_CONSULT) === null) {
      writeJson(K_MAKEUP_CONSULT, []);
    }
  }

  function migrateMakeupConsultRow(r) {
    if (!r || typeof r !== "object") return r;
    var o = Object.assign({}, r);
    if (o.applicantName == null) o.applicantName = o.name != null ? String(o.name) : "";
    if (o.phone == null) o.phone = "";
    if (o.originalClass == null) o.originalClass = "";
    if (o.absenceDate == null) o.absenceDate = "";
    if (o.consultStatus !== "발송완료") o.consultStatus = "상담대기";
    if (o.createdAt == null) o.createdAt = new Date().toISOString();
    return o;
  }

  function getMakeupConsultations() {
    ensureSeed();
    ensureMakeupConsultStorage();
    var list = readJson(K_MAKEUP_CONSULT, []);
    if (!Array.isArray(list)) return [];
    return list.map(migrateMakeupConsultRow);
  }

  function saveMakeupConsultations(list) {
    writeJson(K_MAKEUP_CONSULT, list);
  }

  /** 신청서 링크 목록에서 보강 신청 URL (제목에 '보강' 우선) */
  function getMakeupApplicationLink() {
    var links = getAppLinks();
    if (!Array.isArray(links) || links.length === 0) return "https://forms.google.com/";
    var i;
    for (i = 0; i < links.length; i++) {
      var title = (links[i].title || "").trim();
      var url = (links[i].url || "").trim();
      if (title.indexOf("보강") !== -1 && url) return url;
    }
    for (i = 0; i < links.length; i++) {
      var u = (links[i].url || "").trim();
      if (u) return u;
    }
    return "https://forms.google.com/";
  }

  /**
   * 학부모 보강 신청서 제출 시 서버에서 호출 (로컬은 localStorage 저장).
   */
  function addMakeupFromParentSubmission(data) {
    ensureSeed();
    ensureMakeupConsultStorage();
    var raw = data || {};
    var memberName = String(raw.memberName || raw.name || "").trim();
    if (!memberName) return null;
    var originalClass = String(raw.originalClass || "").trim();
    var makeupClass = String(raw.makeupClass || "").trim();
    var absenceDate = String(raw.absenceDate || "").trim();
    var makeupDate = String(raw.makeupDate || "").trim();
    if (!absenceDate || !/^\d{4}-\d{2}-\d{2}$/.test(absenceDate)) return null;
    if (!makeupDate || !/^\d{4}-\d{2}-\d{2}$/.test(makeupDate)) return null;
    if (!originalClass || !makeupClass) return null;
    var phone = formatPhoneKr11FromDigits(raw.phone);
    if (!phone) return null;
    var now = new Date().toISOString();
    var row = {
      id: uid("mk"),
      memberName: memberName,
      originalClass: originalClass,
      absenceDate: absenceDate,
      makeupClass: makeupClass,
      makeupDate: makeupDate,
      memo: String(raw.memo || "").trim(),
      phone: phone,
      timeSlot: "",
      status: MAKEUP_STATUS.PENDING,
      submittedByParent: true,
      createdAt: now,
      updatedAt: now,
    };
    row = migrateMakeupRow(row);
    var list = readJson(K_MAKEUP, []);
    if (!Array.isArray(list)) list = [];
    list.push(row);
    saveMakeup(list);
    return row;
  }

  function getEvents() {
    ensureSeed();
    return Array.isArray(readJson(K_EVENTS, [])) ? readJson(K_EVENTS, []) : [];
  }

  function saveEvents(list) {
    writeJson(K_EVENTS, list);
  }

  function getConsults() {
    ensureSeed();
    return Array.isArray(readJson(K_CONSULT, [])) ? readJson(K_CONSULT, []) : [];
  }

  function saveConsults(list) {
    writeJson(K_CONSULT, list);
  }

  function getAppLinks() {
    ensureSeed();
    return Array.isArray(readJson(K_LINKS, [])) ? readJson(K_LINKS, []) : [];
  }

  function saveAppLinks(list) {
    writeJson(K_LINKS, list);
  }

  function getClubTeams() {
    ensureSeed();
    return Array.isArray(readJson(K_CLUB, [])) ? readJson(K_CLUB, []) : [];
  }

  function saveClubTeams(list) {
    writeJson(K_CLUB, list);
  }

  function getShuttleRecords() {
    ensureSeed();
    return Array.isArray(readJson(K_SHUTTLE, [])) ? readJson(K_SHUTTLE, []) : [];
  }

  function saveShuttleRecords(list) {
    writeJson(K_SHUTTLE, list);
  }

  function ensureShuttleV2() {
    ensureSeed();
    if (localStorage.getItem(K_SHUTTLE_VEHICLES) === null) writeJson(K_SHUTTLE_VEHICLES, []);
    if (localStorage.getItem(K_SHUTTLE_ROUTES) === null) writeJson(K_SHUTTLE_ROUTES, []);
  }

  function getShuttleVehicles() {
    ensureShuttleV2();
    var list = readJson(K_SHUTTLE_VEHICLES, []);
    return Array.isArray(list) ? list : [];
  }

  function saveShuttleVehicles(list) {
    writeJson(K_SHUTTLE_VEHICLES, list);
  }

  function addShuttleVehicle(data) {
    var list = getShuttleVehicles();
    var row = {
      id: uid("veh"),
      name: (data && data.name ? String(data.name) : "").trim(),
      plate: (data && data.plate ? String(data.plate) : "").trim(),
      driverNote: (data && data.driverNote ? String(data.driverNote) : "").trim(),
      createdAt: new Date().toISOString(),
    };
    list.push(row);
    saveShuttleVehicles(list);
    return row;
  }

  function deleteShuttleVehicle(id) {
    saveShuttleVehicles(
      getShuttleVehicles().filter(function (x) {
        return x.id !== id;
      })
    );
  }

  function getShuttleRoutes() {
    ensureShuttleV2();
    var list = readJson(K_SHUTTLE_ROUTES, []);
    return Array.isArray(list) ? list : [];
  }

  function saveShuttleRoutes(list) {
    writeJson(K_SHUTTLE_ROUTES, list);
  }

  function upsertShuttleRoute(patch) {
    var classId = (patch && patch.classId ? String(patch.classId) : "").trim();
    if (!classId) return null;
    var list = getShuttleRoutes();
    var i = list.findIndex(function (x) {
      return x.classId === classId;
    });
    var row = {
      id: i >= 0 ? list[i].id : uid("shroute"),
      classId: classId,
      vehicleId: patch && patch.vehicleId != null ? String(patch.vehicleId).trim() : "",
      routeText: patch && patch.routeText != null ? String(patch.routeText).trim() : "",
      updatedAt: new Date().toISOString(),
    };
    if (i >= 0) list[i] = row;
    else list.push(row);
    saveShuttleRoutes(list);
    return row;
  }

  function getShuttleRouteByClassId(classId) {
    var cid = (classId || "").trim();
    if (!cid) return null;
    return (
      getShuttleRoutes().find(function (r) {
        return r.classId === cid;
      }) || null
    );
  }

  /** 학부모 공개 페이지용 스냅샷 (클래스·차량·노선) */
  function buildShuttlePublicBundle() {
    return {
      generatedAt: new Date().toISOString(),
      vehicles: getShuttleVehicles(),
      routes: getShuttleRoutes(),
      classes: getClasses().map(function (c) {
        return {
          id: c.id,
          name: c.name,
          weekdays: Array.isArray(c.weekdays) ? c.weekdays.slice() : [],
          startTime: c.startTime || "",
          endTime: c.endTime || "",
        };
      }),
    };
  }

  /** 공유 링크 주소에 쓰는 고정 토큰 (한 번 만들어지면 유지) */
  function getOrCreateShuttleShareToken() {
    try {
      var t = localStorage.getItem(K_SHUTTLE_SHARE_TOKEN);
      if (t && String(t).length >= 6) return String(t);
      t = "jb" + Date.now().toString(36) + Math.random().toString(36).slice(2, 14);
      localStorage.setItem(K_SHUTTLE_SHARE_TOKEN, t);
      return t;
    } catch (e) {
      return "jb" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
    }
  }

  /**
   * 공개용 번들을 고정 토큰 키로 덮어씀.
   * 노선·차량을 저장할 때마다 호출하면 링크 주소는 그대로 두고 내용만 최신으로 유지할 수 있음.
   */
  function publishShuttleShareSnapshot() {
    var bundle = buildShuttlePublicBundle();
    var json = JSON.stringify(bundle);
    if (json.length > 1800000) {
      return Promise.resolve({ ok: false, error: "데이터가 너무 커 공유할 수 없습니다. 노선 텍스트를 줄여 주세요." });
    }
    if (typeof global.JBRemoteSync !== "undefined" && global.JBRemoteSync.enabled && global.JBRemoteSync.enabled()) {
      return global.JBRemoteSync.publishShuttleSnapshot(bundle).then(function () {
        return { ok: true, token: "cloud" };
      });
    }
    var token = getOrCreateShuttleShareToken();
    try {
      localStorage.setItem("jb_shuttle_bundle_" + token, json);
    } catch (e) {
      return Promise.resolve({ ok: false, error: "브라우저 저장에 실패했습니다." });
    }
    return Promise.resolve({ ok: true, token: token });
  }

  function getShuttlePublicShareUrl() {
    var base = "";
    if (global.location && global.location.href) {
      base = global.location.href.replace(/[^/]*$/, "");
    }
    if (typeof global.JBRemoteSync !== "undefined" && global.JBRemoteSync.enabled && global.JBRemoteSync.enabled()) {
      return base + "shuttle-public.html";
    }
    var token = getOrCreateShuttleShareToken();
    return base + "shuttle-public.html?t=" + encodeURIComponent(token);
  }

  function defaultProtectiveInventory() {
    return { knee: { S: 0, M: 0, L: 0 }, elbow: { S: 0, M: 0, L: 0 } };
  }

  function ensureProtectiveInventorySeed() {
    if (localStorage.getItem(K_PROTECTIVE_INV) !== null) return;
    writeJson(K_PROTECTIVE_INV, defaultProtectiveInventory());
  }

  function getProtectiveInventory() {
    ensureSeed();
    ensureProtectiveInventorySeed();
    var o = readJson(K_PROTECTIVE_INV, null);
    if (!o || !o.knee || !o.elbow) return defaultProtectiveInventory();
    ["S", "M", "L"].forEach(function (s) {
      if (typeof o.knee[s] !== "number" || isNaN(o.knee[s])) o.knee[s] = 0;
      if (typeof o.elbow[s] !== "number" || isNaN(o.elbow[s])) o.elbow[s] = 0;
    });
    return o;
  }

  function saveProtectiveInventory(inv) {
    writeJson(K_PROTECTIVE_INV, inv);
  }

  /** 신청서링크: 제목에 '보호대' 또는 '보호자'가 들어간 항목의 URL (학부모에게 안내) */
  function getProtectiveApplicationLink() {
    var links = getAppLinks();
    if (!Array.isArray(links)) return "";
    var i;
    for (i = 0; i < links.length; i++) {
      var title = (links[i].title || "").trim();
      var url = (links[i].url || "").trim();
      if (!url) continue;
      if (title.indexOf("보호대") !== -1 || title.indexOf("보호자") !== -1) return url;
    }
    return "";
  }

  function getProtectiveApplyPageUrl() {
    var base = "";
    if (global.location && global.location.href) {
      base = global.location.href.replace(/[^/]*$/, "");
    }
    return base + "protective-apply.html";
  }

  /**
   * 학부모 웹 접수(protective-apply.html 등) 제출 시. Supabase 동기화 시 관리 화면에 반영됩니다.
   */
  function addProtectiveFromParentSubmission(data) {
    ensureSeed();
    var raw = data || {};
    var applicantName = String(raw.applicantName || raw.name || "").trim();
    var studentName = String(raw.studentName || "").trim();
    var productType = String(raw.productType || "").toLowerCase();
    if (productType !== "knee" && productType !== "elbow") {
      var p = String(raw.product || "");
      if (p.indexOf("무릎") !== -1) productType = "knee";
      else if (p.indexOf("팔꿈치") !== -1) productType = "elbow";
    }
    var size = String(raw.size || "").toUpperCase();
    if (size !== "S" && size !== "M" && size !== "L") return null;
    if (!applicantName) return null;
    if (productType !== "knee" && productType !== "elbow") return null;
    var phone = formatPhoneKr11FromDigits(raw.phone);
    if (!phone) return null;
    var now = new Date().toISOString();
    var rd =
      raw.requestDate && /^\d{4}-\d{2}-\d{2}$/.test(String(raw.requestDate))
        ? String(raw.requestDate)
        : dateKey(new Date());
    var row = {
      id: uid("pr"),
      applicantName: applicantName,
      studentName: studentName,
      phone: phone,
      productType: productType,
      size: size,
      itemSpec: (productType === "knee" ? "무릎보호대" : "팔꿈치보호대") + " · " + size,
      requestDate: rd,
      status: String(raw.status || "접수").trim() || "접수",
      source: "parent",
      createdAt: now,
      paid: false,
      delivered: false,
    };
    var list = getProtectiveRequests();
    list.push(row);
    saveProtectiveRequests(list);
    return row;
  }

  function getProtectiveRequests() {
    ensureSeed();
    return Array.isArray(readJson(K_PROTECTIVE, [])) ? readJson(K_PROTECTIVE, []) : [];
  }

  function saveProtectiveRequests(list) {
    writeJson(K_PROTECTIVE, list);
  }

  function getStudentsRegistry() {
    ensureSeed();
    var list = readJson(K_STUDENTS_REG, []);
    return Array.isArray(list) ? list : [];
  }

  function saveStudentsRegistry(list) {
    writeJson(K_STUDENTS_REG, list);
  }

  function getStudentById(id) {
    return getStudentsRegistry().find(function (x) {
      return x.id === id;
    });
  }

  function upsertStudent(row) {
    var list = getStudentsRegistry();
    var now = new Date().toISOString();
    if (!row.id) row.id = uid("stu");
    row.updatedAt = now;
    if (!row.createdAt) row.createdAt = now;
    if (!row.notesDoc || typeof row.notesDoc !== "object") row.notesDoc = { type: "doc", content: [{ type: "paragraph" }] };
    var i = list.findIndex(function (x) {
      return x.id === row.id;
    });
    if (i < 0) list.push(row);
    else list[i] = row;
    saveStudentsRegistry(list);
    return row;
  }

  function deleteStudentRegistry(id) {
    saveStudentsRegistry(
      getStudentsRegistry().filter(function (x) {
        return x.id !== id;
      })
    );
  }

  function getClassesRegistry() {
    ensureSeed();
    var list = readJson(K_CLASSES_REG, []);
    return Array.isArray(list) ? list : [];
  }

  function saveClassesRegistry(list) {
    writeJson(K_CLASSES_REG, list);
  }

  function getClassRegistryById(id) {
    return getClassesRegistry().find(function (x) {
      return x.id === id;
    });
  }

  function upsertClassRegistry(row) {
    var list = getClassesRegistry();
    var now = new Date().toISOString();
    if (!row.id) row.id = uid("cls");
    row.updatedAt = now;
    if (!row.createdAt) row.createdAt = now;
    if (!Array.isArray(row.studentIds)) row.studentIds = [];
    if (!row.descriptionDoc || typeof row.descriptionDoc !== "object") {
      row.descriptionDoc = { type: "doc", content: [{ type: "paragraph" }] };
    }
    var i = list.findIndex(function (x) {
      return x.id === row.id;
    });
    if (i < 0) list.push(row);
    else list[i] = row;
    saveClassesRegistry(list);
    return row;
  }

  function deleteClassRegistry(id) {
    saveClassesRegistry(
      getClassesRegistry().filter(function (x) {
        return x.id !== id;
      })
    );
  }

  function getNotices() {
    ensureSeed();
    var list = readJson(K_NOTICES, []);
    return Array.isArray(list) ? list : [];
  }

  function saveNotices(list) {
    writeJson(K_NOTICES, list);
  }

  function getNoticeById(id) {
    return getNotices().find(function (x) {
      return x.id === id;
    });
  }

  function upsertNotice(row) {
    var list = getNotices();
    var now = new Date().toISOString();
    if (!row.id) row.id = uid("ntc");
    row.updatedAt = now;
    if (!row.createdAt) row.createdAt = now;
    if (!row.bodyDoc || typeof row.bodyDoc !== "object") {
      row.bodyDoc = { type: "doc", content: [{ type: "paragraph" }] };
    }
    var i = list.findIndex(function (x) {
      return x.id === row.id;
    });
    if (i < 0) list.push(row);
    else list[i] = row;
    saveNotices(list);
    return row;
  }

  function deleteNotice(id) {
    saveNotices(
      getNotices().filter(function (x) {
        return x.id !== id;
      })
    );
  }

  function memberById(id) {
    return getMembers().find(function (m) {
      return m.id === id;
    });
  }

  function dashboardStats(now) {
    now = now || new Date();
    var today = dateKey(now);
    var month = monthKey(now);
    var members = getMembers();
    var attend = getAttendanceRecords();
    var payments = getPayments();

    var todayAttend = attend.filter(function (r) {
      return r.date === today && r.present;
    }).length;

    var monthPaid = 0;
    var unpaidCount = 0;
    for (var i = 0; i < payments.length; i++) {
      var p = payments[i];
      if (p.status === "unpaid") {
        unpaidCount++;
        continue;
      }
      if (p.status === "paid" && p.monthKey === month) {
        monthPaid += Number(p.amount) || 0;
      }
    }

    return {
      totalMembers: members.length,
      todayAttendance: todayAttend,
      monthlyRevenue: monthPaid,
      unpaidCount: unpaidCount,
    };
  }

  function recentMembersRegisteredToday(now) {
    now = now || new Date();
    var today = dateKey(now);
    var members = getMembers();
    return members
      .filter(function (m) {
        if (!m.createdAt) return false;
        return m.createdAt.slice(0, 10) === today;
      })
      .sort(function (a, b) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  }

  function classesForWeekday(dayIndex) {
    return getClasses()
      .filter(function (c) {
        return Array.isArray(c.weekdays) && c.weekdays.indexOf(dayIndex) !== -1;
      })
      .sort(function (a, b) {
        return (a.startTime || "").localeCompare(b.startTime || "");
      });
  }

  function todayClassSchedule(now) {
    now = now || new Date();
    return classesForWeekday(now.getDay());
  }

  function memberHasAnyField(data) {
    var keys = [
      "name",
      "phone",
      "gender",
      "grade",
      "parentPhoneMother",
      "parentPhoneFather",
      "address",
      "school",
      "className",
      "pickupLocation",
      "dropoffLocation",
      "memo",
      "clubJersey",
      "clubUniform",
      "clubJoined",
      "clubRrn",
    ];
    for (var i = 0; i < keys.length; i++) {
      var v = data[keys[i]];
      if (v != null && String(v).trim() !== "") return true;
    }
    if (data.tuition != null && data.tuition !== "" && !isNaN(Number(data.tuition))) return true;
    return false;
  }

  function addMemberFull(data) {
    if (!memberHasAnyField(data || {})) return null;
    var list = getMembers();
    var now = new Date().toISOString();
    var m = {
      id: uid("m"),
      name: (data.name || "").trim(),
      phone: (data.phone || "").trim(),
      enrollmentStatus: data.enrollmentStatus === "inactive" ? "inactive" : "active",
      gender: data.gender || "",
      grade: (data.grade || "").trim(),
      parentPhoneMother: (data.parentPhoneMother || "").trim(),
      parentPhoneFather: (data.parentPhoneFather || "").trim(),
      address: (data.address || "").trim(),
      school: (data.school || "").trim(),
      className: (data.className || "").trim(),
      tuition:
        data.tuition != null && data.tuition !== "" && !isNaN(Number(data.tuition))
          ? Number(data.tuition)
          : null,
      pickupLocation: (data.pickupLocation || "").trim(),
      dropoffLocation: (data.dropoffLocation || "").trim(),
      memo: (data.memo || "").trim(),
      clubJersey: (data.clubJersey || "").trim(),
      clubUniform: (data.clubUniform || "").trim(),
      clubJoined: (data.clubJoined || "").trim(),
      clubRrn: (data.clubRrn || "").trim(),
      createdAt: now,
      updatedAt: now,
    };
    list.push(m);
    saveMembers(list);
    return m;
  }

  function addMember(name, phone, memo) {
    return addMemberFull({
      name: name,
      phone: phone,
      memo: memo,
    });
  }

  function bulkAddMembers(rows) {
    var added = 0;
    for (var i = 0; i < rows.length; i++) {
      if (addMemberFull(rows[i])) added++;
    }
    return added;
  }

  function normalizePhoneDigits(s) {
    return String(s || "").replace(/\D/g, "");
  }

  function findDuplicateMemberByNameParent(name, mother, father) {
    var n = (name || "").trim();
    if (!n) return null;
    var md = normalizePhoneDigits(mother);
    var fd = normalizePhoneDigits(father);
    if (!md && !fd) return null;
    var list = getMembers();
    for (var i = 0; i < list.length; i++) {
      var x = list[i];
      if ((x.name || "").trim() !== n) continue;
      var xm = normalizePhoneDigits(x.parentPhoneMother);
      var xf = normalizePhoneDigits(x.parentPhoneFather);
      if (md && (xm === md || xf === md)) return x;
      if (fd && (xf === fd || xm === fd)) return x;
    }
    return null;
  }

  /** 학부모 전화가 없을 때 이름+클래스로 중복 판별 */
  function findDuplicateMemberByNameClass(name, className) {
    var n = (name || "").trim();
    var cn = (className || "").trim();
    if (!n || !cn) return null;
    var list = getMembers();
    for (var i = 0; i < list.length; i++) {
      var x = list[i];
      if ((x.name || "").trim() !== n) continue;
      if ((x.className || "").trim() !== cn) continue;
      return x;
    }
    return null;
  }

  function updateMember(id, patch) {
    var list = getMembers();
    var i = list.findIndex(function (x) {
      return x.id === id;
    });
    if (i < 0) return null;
    Object.assign(list[i], patch);
    saveMembers(list);
    return list[i];
  }

  function deleteMember(id) {
    var list = getMembers().filter(function (x) {
      return x.id !== id;
    });
    saveMembers(list);
  }

  /** 공백·전각 숫자 등 제거해 학년 맵 조회용 키로 통일 */
  function normalizeGradeKeyForPromote(gradeStr) {
    var s = String(gradeStr || "")
      .replace(/\u00a0/g, " ")
      .trim()
      .replace(/\s+/g, "");
    s = s.replace(/[\uff10-\uff19]/g, function (ch) {
      return String.fromCharCode(ch.charCodeAt(0) - 0xff10 + 48);
    });
    return s;
  }

  /** 알려진 학년 문자열만 한 단계 올림 (6학년→중1, 중3→고1, 고3은 유지). 그 외 값은 변경하지 않음. */
  function promoteGradeOneStep(gradeStr) {
    var s = normalizeGradeKeyForPromote(gradeStr);
    if (!s) return null;
    var map = {
      "1학년": "2학년",
      "2학년": "3학년",
      "3학년": "4학년",
      "4학년": "5학년",
      "5학년": "6학년",
      "6학년": "중1",
      중1: "중2",
      중2: "중3",
      중3: "고1",
      고1: "고2",
      고2: "고3",
      고3: "고3",
    };
    return Object.prototype.hasOwnProperty.call(map, s) ? map[s] : null;
  }

  function promoteAllMemberGradesOneStep() {
    var list = getMembers();
    var now = new Date().toISOString();
    var n = 0;
    for (var i = 0; i < list.length; i++) {
      var next = promoteGradeOneStep(list[i].grade);
      if (next != null && next !== list[i].grade) {
        list[i].grade = next;
        list[i].updatedAt = now;
        n++;
      }
    }
    if (n) saveMembers(list);
    return n;
  }

  function addClassTemplate(data) {
    var raw = readJson(K_CLASSES, []);
    if (!Array.isArray(raw)) raw = [];
    var coaches = Array.isArray(data.coaches) ? data.coaches.map(function (x) { return String(x || "").trim(); }).filter(Boolean).slice(0, 3) : [];
    var c = migrateClassTemplate({
      id: uid("c"),
      name: (data.name || "").trim(),
      weekdays: Array.isArray(data.weekdays) ? data.weekdays.slice() : [1, 2, 3, 4, 5],
      startTime: data.startTime || "09:00",
      endTime: data.endTime || "10:00",
      coaches: coaches,
      capacity: data.capacity,
      tuition: data.tuition,
    });
    raw.push(c);
    saveClasses(raw);
    return c;
  }

  function updateClassTemplate(id, patch) {
    var raw = readJson(K_CLASSES, []);
    if (!Array.isArray(raw)) return null;
    var i = raw.findIndex(function (x) {
      return x.id === id;
    });
    if (i < 0) return null;
    Object.assign(raw[i], patch);
    if (patch.weekdays) raw[i].weekdays = patch.weekdays.slice();
    if (Object.prototype.hasOwnProperty.call(patch, "coaches") && Array.isArray(patch.coaches)) {
      raw[i].coaches = patch.coaches.slice(0, 3);
    }
    raw[i] = migrateClassTemplate(raw[i]);
    saveClasses(raw);
    return raw[i];
  }

  function deleteClassTemplate(id) {
    var raw = readJson(K_CLASSES, []);
    if (!Array.isArray(raw)) raw = [];
    saveClasses(
      raw.filter(function (x) {
        return x.id !== id;
      })
    );
  }

  function setAttendanceForDate(dateStr, memberId, present) {
    var list = readJson(K_ATTEND, []);
    if (!Array.isArray(list)) list = [];
    var filtered = list.filter(function (r) {
      return !(r.date === dateStr && r.memberId === memberId && !r.classId);
    });
    filtered.push(
      migrateAttendanceRecord({
        date: dateStr,
        classId: "",
        rowKey: "m:" + memberId,
        sourceType: "member",
        memberId: memberId,
        present: !!present,
        status: present ? "present" : "absent",
        note: "",
      })
    );
    writeJson(K_ATTEND, filtered);
  }

  function addPayment(data) {
    var list = getPayments();
    var p = {
      id: uid("p"),
      memberId: data.memberId || "",
      memberName: data.memberName || "",
      amount: Number(data.amount) || 0,
      monthKey: data.monthKey || monthKey(new Date()),
      status: data.status === "unpaid" ? "unpaid" : "paid",
      paidAt: data.status === "unpaid" ? "" : new Date().toISOString(),
      memo: (data.memo || "").trim(),
    };
    list.push(p);
    savePayments(list);
    return p;
  }

  function updatePayment(id, patch) {
    var list = getPayments();
    var i = list.findIndex(function (x) {
      return x.id === id;
    });
    if (i < 0) return null;
    Object.assign(list[i], patch);
    if (patch.status === "paid" && !list[i].paidAt) list[i].paidAt = new Date().toISOString();
    savePayments(list);
    return list[i];
  }

  function deletePayment(id) {
    savePayments(
      getPayments().filter(function (x) {
        return x.id !== id;
      })
    );
  }

  function crudGeneric(key, getters, savers, prefix) {
    return {
      list: getters,
      add: function (row) {
        var list = getters();
        row.id = row.id || uid(prefix);
        list.push(row);
        savers(list);
        return row;
      },
      update: function (id, patch) {
        var list = getters();
        var i = list.findIndex(function (x) {
          return x.id === id;
        });
        if (i < 0) return null;
        Object.assign(list[i], patch);
        savers(list);
        return list[i];
      },
      remove: function (id) {
        savers(
          getters().filter(function (x) {
            return x.id !== id;
          })
        );
      },
    };
  }

  global.JBData = {
    ensureSeed: ensureSeed,
    dateKey: dateKey,
    monthKey: monthKey,
    getMembers: getMembers,
    saveMembers: saveMembers,
    memberById: memberById,
    addMember: addMember,
    addMemberFull: addMemberFull,
    bulkAddMembers: bulkAddMembers,
    memberHasAnyField: memberHasAnyField,
    findDuplicateMemberByNameParent: findDuplicateMemberByNameParent,
    findDuplicateMemberByNameClass: findDuplicateMemberByNameClass,
    updateMember: updateMember,
    deleteMember: deleteMember,
    promoteAllMemberGradesOneStep: promoteAllMemberGradesOneStep,
    getClasses: getClasses,
    addClassTemplate: addClassTemplate,
    updateClassTemplate: updateClassTemplate,
    deleteClassTemplate: deleteClassTemplate,
    countActiveMembersByClassName: countActiveMembersByClassName,
    bulkAddClassTemplatesFromNames: bulkAddClassTemplatesFromNames,
    normalizeClassTime: normalizeClassTime,
    dashboardStats: dashboardStats,
    recentMembersRegisteredToday: recentMembersRegisteredToday,
    todayClassSchedule: todayClassSchedule,
    classesForWeekday: classesForWeekday,
    getAttendanceRecords: getAttendanceRecords,
    saveAttendanceSessionBatch: saveAttendanceSessionBatch,
    setAttendanceForDate: setAttendanceForDate,
    getPayments: getPayments,
    addPayment: addPayment,
    updatePayment: updatePayment,
    deletePayment: deletePayment,
    getTrials: getTrials,
    saveTrials: saveTrials,
    getTrialSortTimestamp: getTrialSortTimestamp,
    getTrialConsultations: getTrialConsultations,
    saveTrialConsultations: saveTrialConsultations,
    getTrialApplicationLink: getTrialApplicationLink,
    addTrialFromParentSubmission: addTrialFromParentSubmission,
    getRegularApplicationLink: getRegularApplicationLink,
    getMemberGradeOptions: getMemberGradeOptions,
    normalizePhoneDigits: normalizePhoneDigits,
    isRegisteredMemberPhone: isRegisteredMemberPhone,
    getMakeup: getMakeup,
    saveMakeup: saveMakeup,
    getMakeupSortTimestamp: getMakeupSortTimestamp,
    getMakeupConsultations: getMakeupConsultations,
    saveMakeupConsultations: saveMakeupConsultations,
    getMakeupApplicationLink: getMakeupApplicationLink,
    addMakeupFromParentSubmission: addMakeupFromParentSubmission,
    getEvents: getEvents,
    saveEvents: saveEvents,
    getConsults: getConsults,
    saveConsults: saveConsults,
    getAppLinks: getAppLinks,
    saveAppLinks: saveAppLinks,
    getClubTeams: getClubTeams,
    saveClubTeams: saveClubTeams,
    getShuttleRecords: getShuttleRecords,
    saveShuttleRecords: saveShuttleRecords,
    getShuttleVehicles: getShuttleVehicles,
    saveShuttleVehicles: saveShuttleVehicles,
    addShuttleVehicle: addShuttleVehicle,
    deleteShuttleVehicle: deleteShuttleVehicle,
    getShuttleRoutes: getShuttleRoutes,
    saveShuttleRoutes: saveShuttleRoutes,
    upsertShuttleRoute: upsertShuttleRoute,
    getShuttleRouteByClassId: getShuttleRouteByClassId,
    buildShuttlePublicBundle: buildShuttlePublicBundle,
    getOrCreateShuttleShareToken: getOrCreateShuttleShareToken,
    publishShuttleShareSnapshot: publishShuttleShareSnapshot,
    getShuttlePublicShareUrl: getShuttlePublicShareUrl,
    getProtectiveRequests: getProtectiveRequests,
    saveProtectiveRequests: saveProtectiveRequests,
    getProtectiveInventory: getProtectiveInventory,
    saveProtectiveInventory: saveProtectiveInventory,
    getProtectiveApplicationLink: getProtectiveApplicationLink,
    getProtectiveApplyPageUrl: getProtectiveApplyPageUrl,
    addProtectiveFromParentSubmission: addProtectiveFromParentSubmission,
    getStudentsRegistry: getStudentsRegistry,
    saveStudentsRegistry: saveStudentsRegistry,
    getStudentById: getStudentById,
    upsertStudent: upsertStudent,
    deleteStudentRegistry: deleteStudentRegistry,
    getClassesRegistry: getClassesRegistry,
    saveClassesRegistry: saveClassesRegistry,
    getClassRegistryById: getClassRegistryById,
    upsertClassRegistry: upsertClassRegistry,
    deleteClassRegistry: deleteClassRegistry,
    getNotices: getNotices,
    saveNotices: saveNotices,
    getNoticeById: getNoticeById,
    upsertNotice: upsertNotice,
    deleteNotice: deleteNotice,
  };
})(window);
