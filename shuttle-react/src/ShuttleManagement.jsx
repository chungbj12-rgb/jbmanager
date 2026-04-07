import { useState, useMemo } from "react";
import "./ShuttleManagement.css";

/** 화 ~ 일 (관리 화면과 동일 범위) */
const DAYS = ["화요일", "수요일", "목요일", "금요일", "토요일", "일요일"];

/** 예시: 요일별 클래스 (실제 연동 시 API·부모 앱과 교체) */
const CLASS_BY_DAY = {
  화요일: ["클래스 A", "클래스 B"],
  수요일: ["클래스 C", "클래스 D"],
  목요일: ["클래스 E"],
  금요일: ["클래스 F", "클래스 G", "클래스 H"],
  토요일: ["클래스 I", "클래스 J"],
  일요일: ["클래스 K"],
};

export default function ShuttleManagement() {
  const [activeTab, setActiveTab] = useState("parent");
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedClass, setSelectedClass] = useState("");

  const classOptions = useMemo(() => {
    if (!selectedDay) return [];
    return CLASS_BY_DAY[selectedDay] ?? [];
  }, [selectedDay]);

  function onDayChange(e) {
    const day = e.target.value;
    setSelectedDay(day);
    setSelectedClass("");
  }

  function onClassChange(e) {
    setSelectedClass(e.target.value);
  }

  return (
    <div className="shuttle-management">
      <header className="shuttle-management__head">
        <h1 className="shuttle-management__title">셔틀관리</h1>
        <p className="shuttle-management__sub">
          React 전용 미리보기. 실제 회원·노선 데이터는 기존{" "}
          <code className="shuttle-management__code">shuttle.html</code> 앱과 연동하려면 API를
          연결하세요.
        </p>
      </header>

      <div className="shuttle-management__tabs" role="tablist" aria-label="셔틀 구분">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "parent"}
          className={
            "shuttle-management__tab" +
            (activeTab === "parent" ? " shuttle-management__tab--active" : "")
          }
          onClick={() => setActiveTab("parent")}
        >
          학부모 차량표
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "teacher"}
          className={
            "shuttle-management__tab" +
            (activeTab === "teacher" ? " shuttle-management__tab--active" : "")
          }
          onClick={() => setActiveTab("teacher")}
        >
          차량쌤 차량표
        </button>
      </div>

      {activeTab === "parent" && (
        <section className="shuttle-management__panel" role="tabpanel">
          <div className="shuttle-management__row">
            <label className="shuttle-management__label" htmlFor="day-select">
              요일 선택
            </label>
            <select
              id="day-select"
              className="shuttle-management__select"
              value={selectedDay}
              onChange={onDayChange}
            >
              <option value="">— 요일 선택 —</option>
              {DAYS.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </div>

          {selectedDay && (
            <div className="shuttle-management__row">
              <label className="shuttle-management__label" htmlFor="class-select">
                클래스 선택
              </label>
              <select
                id="class-select"
                className="shuttle-management__select"
                value={selectedClass}
                onChange={onClassChange}
              >
                <option value="">— 클래스 선택 —</option>
                {classOptions.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedDay && selectedClass && (
            <p className="shuttle-management__summary">
              <strong>{selectedDay}</strong> · <strong>{selectedClass}</strong> 선택됨 (노선·차량 UI는
              여기에 이어서 구현)
            </p>
          )}
        </section>
      )}

      {activeTab === "teacher" && (
        <section className="shuttle-management__panel shuttle-management__panel--muted" role="tabpanel">
          <p className="shuttle-management__placeholder">
            차량쌤 차량표 관련 내용을 여기에 구현하세요.
          </p>
        </section>
      )}
    </div>
  );
}
