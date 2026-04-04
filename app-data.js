(function (global) {
  var K_MEMBERS = "jb_center_members";
  var K_CLASSES = "jb_class_templates";
  var K_ATTEND = "jb_attendance_records";
  var K_PAY = "jb_payment_records";
  var K_TRIALS = "jb_trial_records";
  var K_MAKEUP = "jb_makeup_records";
  var K_EVENTS = "jb_schedule_events";
  var K_CONSULT = "jb_consultation_records";
  var K_LINKS = "jb_application_links";
  var K_CLUB = "jb_club_team_records";
  var K_SHUTTLE = "jb_shuttle_records";
  var K_PROTECTIVE = "jb_protective_requests";
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
    localStorage.setItem(key, JSON.stringify(val));
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
      },
      {
        id: uid("c"),
        name: "U-18(여고대표반)",
        weekdays: allDays.slice(),
        startTime: "10:00",
        endTime: "13:00",
      },
      {
        id: uid("c"),
        name: "일3부",
        weekdays: allDays.slice(),
        startTime: "13:00",
        endTime: "14:30",
      },
      {
        id: uid("c"),
        name: "U-15(남중대표반)",
        weekdays: allDays.slice(),
        startTime: "14:30",
        endTime: "16:30",
      },
    ];

    writeJson(K_MEMBERS, members);
    writeJson(K_CLASSES, classes);
    writeJson(K_ATTEND, []);
    writeJson(K_PAY, []);
    writeJson(K_TRIALS, []);
    writeJson(K_MAKEUP, []);
    writeJson(K_EVENTS, []);
    writeJson(K_CONSULT, []);
    writeJson(K_LINKS, [
      { id: uid("l"), title: "체험 신청 구글폼", url: "https://forms.google.com/", note: "예시 링크" },
    ]);
    writeJson(K_CLUB, []);
    writeJson(K_SHUTTLE, []);
    writeJson(K_PROTECTIVE, []);
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

  function getClasses() {
    ensureSeed();
    var list = readJson(K_CLASSES, []);
    return Array.isArray(list) ? list : [];
  }

  function saveClasses(list) {
    writeJson(K_CLASSES, list);
  }

  function getAttendanceRecords() {
    ensureSeed();
    var list = readJson(K_ATTEND, []);
    return Array.isArray(list) ? list : [];
  }

  function saveAttendanceRecords(list) {
    writeJson(K_ATTEND, list);
  }

  function getPayments() {
    ensureSeed();
    var list = readJson(K_PAY, []);
    return Array.isArray(list) ? list : [];
  }

  function savePayments(list) {
    writeJson(K_PAY, list);
  }

  function getTrials() {
    ensureSeed();
    return Array.isArray(readJson(K_TRIALS, [])) ? readJson(K_TRIALS, []) : [];
  }

  function saveTrials(list) {
    writeJson(K_TRIALS, list);
  }

  function getMakeup() {
    ensureSeed();
    return Array.isArray(readJson(K_MAKEUP, [])) ? readJson(K_MAKEUP, []) : [];
  }

  function saveMakeup(list) {
    writeJson(K_MAKEUP, list);
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
    var list = getClasses();
    var c = {
      id: uid("c"),
      name: (data.name || "").trim(),
      weekdays: Array.isArray(data.weekdays) ? data.weekdays.slice() : [1, 2, 3, 4, 5],
      startTime: data.startTime || "09:00",
      endTime: data.endTime || "10:00",
    };
    list.push(c);
    saveClasses(list);
    return c;
  }

  function updateClassTemplate(id, patch) {
    var list = getClasses();
    var i = list.findIndex(function (x) {
      return x.id === id;
    });
    if (i < 0) return null;
    Object.assign(list[i], patch);
    if (patch.weekdays) list[i].weekdays = patch.weekdays.slice();
    saveClasses(list);
    return list[i];
  }

  function deleteClassTemplate(id) {
    saveClasses(
      getClasses().filter(function (x) {
        return x.id !== id;
      })
    );
  }

  function setAttendanceForDate(dateStr, memberId, present) {
    var list = getAttendanceRecords().filter(function (r) {
      return !(r.date === dateStr && r.memberId === memberId);
    });
    list.push({ date: dateStr, memberId: memberId, present: !!present });
    saveAttendanceRecords(list);
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
    dashboardStats: dashboardStats,
    recentMembersRegisteredToday: recentMembersRegisteredToday,
    todayClassSchedule: todayClassSchedule,
    classesForWeekday: classesForWeekday,
    getAttendanceRecords: getAttendanceRecords,
    setAttendanceForDate: setAttendanceForDate,
    getPayments: getPayments,
    addPayment: addPayment,
    updatePayment: updatePayment,
    deletePayment: deletePayment,
    getTrials: getTrials,
    saveTrials: saveTrials,
    getMakeup: getMakeup,
    saveMakeup: saveMakeup,
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
    getProtectiveRequests: getProtectiveRequests,
    saveProtectiveRequests: saveProtectiveRequests,
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
