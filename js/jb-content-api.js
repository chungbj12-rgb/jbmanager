/**
 * 학생·클래스·공지 콘텐츠 API (현재: localStorage / JBData)
 * 백엔드 연동 시 이 객체의 메서드만 fetch 기반으로 교체하면 UI는 그대로 사용 가능합니다.
 */
(function (global) {
  function basePath() {
    var p = global.location.pathname || "";
    var i = p.lastIndexOf("/");
    return i >= 0 ? p.slice(0, i + 1) : "";
  }

  function absUrl(rel) {
    return global.location.origin + basePath() + rel;
  }

  global.JBContentApi = {
    mode: "local",

    students: {
      list: function () {
        return global.JBData.getStudentsRegistry().slice().sort(function (a, b) {
          return (b.updatedAt || "").localeCompare(a.updatedAt || "");
        });
      },
      get: function (id) {
        return global.JBData.getStudentById(id);
      },
      save: function (row) {
        return global.JBData.upsertStudent(row);
      },
      remove: function (id) {
        global.JBData.deleteStudentRegistry(id);
      },
      listHref: function () {
        return "students.html";
      },
      formHref: function (id) {
        return id ? "student-form.html?id=" + encodeURIComponent(id) : "student-form.html";
      },
      detailHref: function (id) {
        return "student-detail.html?id=" + encodeURIComponent(id);
      },
      detailUrl: function (id) {
        return absUrl("student-detail.html?id=" + encodeURIComponent(id));
      },
    },

    classesReg: {
      list: function () {
        return global.JBData.getClassesRegistry().slice().sort(function (a, b) {
          return (b.updatedAt || "").localeCompare(a.updatedAt || "");
        });
      },
      get: function (id) {
        return global.JBData.getClassRegistryById(id);
      },
      save: function (row) {
        return global.JBData.upsertClassRegistry(row);
      },
      remove: function (id) {
        global.JBData.deleteClassRegistry(id);
      },
      listHref: function () {
        return "class-registry.html";
      },
      formHref: function (id) {
        return id ? "class-form.html?id=" + encodeURIComponent(id) : "class-form.html";
      },
      detailHref: function (id) {
        return "class-detail.html?id=" + encodeURIComponent(id);
      },
      detailUrl: function (id) {
        return absUrl("class-detail.html?id=" + encodeURIComponent(id));
      },
    },

    notices: {
      list: function () {
        return global.JBData.getNotices().slice().sort(function (a, b) {
          return (b.updatedAt || "").localeCompare(a.updatedAt || "");
        });
      },
      get: function (id) {
        return global.JBData.getNoticeById(id);
      },
      save: function (row) {
        return global.JBData.upsertNotice(row);
      },
      remove: function (id) {
        global.JBData.deleteNotice(id);
      },
      listHref: function () {
        return "notices.html";
      },
      formHref: function (id) {
        return id ? "notice-form.html?id=" + encodeURIComponent(id) : "notice-form.html";
      },
      viewHref: function (id) {
        return "notice-view.html?id=" + encodeURIComponent(id);
      },
      viewUrl: function (id) {
        return absUrl("notice-view.html?id=" + encodeURIComponent(id));
      },
    },
  };
})(window);
