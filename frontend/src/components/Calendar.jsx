import { useState } from "react";
import { gameDateSet, allGameDateSet } from "../data/games";
import "./Calendar.css";

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];
const MONTHS = [
  "1월","2월","3월","4월","5월","6월",
  "7월","8월","9월","10월","11월","12월",
];

/**
 * 달력 컴포넌트
 * Props:
 *   selectedDate     - 현재 선택된 날짜 (YYYY-MM-DD)
 *   onSelectDate     - 날짜 클릭 시 호출되는 콜백
 *   dangwanSummary   - { "YYYY-MM-DD": { totalPeople } }  (단관 신청)
 *   jikgwanSummary   - { "YYYY-MM-DD": count }            (직관 인원)
 *   jungmoSummary    - { "YYYY-MM-DD": count }            (정모 개수)
 *   showOnlyGames    - true면 경기·이벤트 있는 날만 표시
 */
export default function Calendar({
  selectedDate,
  onSelectDate,
  dangwanSummary = {},
  jikgwanSummary = {},
  jungmoSummary = {},
  showOnlyGames,
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const todayStr = formatDate(today);

  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  }

  const cells = buildCalendarCells(viewYear, viewMonth);

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button className="nav-btn" onClick={prevMonth} aria-label="이전 달">‹</button>
        <span className="calendar-title">{viewYear}년 {MONTHS[viewMonth]}</span>
        <button className="nav-btn" onClick={nextMonth} aria-label="다음 달">›</button>
      </div>

      <div className="calendar-grid">
        {DAYS.map((d, i) => (
          <div
            key={d}
            className={`day-label ${i === 0 ? "sunday" : i === 6 ? "saturday" : ""}`}
          >
            {d}
          </div>
        ))}

        {cells.map((cell, idx) => {
          if (!cell) return <div key={`empty-${idx}`} className="day-cell empty" />;

          const dateStr = formatDate(cell);
          const hasHomeGame = gameDateSet.has(dateStr);
          const hasAnyGame = allGameDateSet.has(dateStr);
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const dayOfWeek = cell.getDay();

          const dangwanCount = dangwanSummary[dateStr]?.totalPeople || 0;
          const jikgwanCount = jikgwanSummary[dateStr] || 0;
          const jungmoCount = jungmoSummary[dateStr] || 0;
          const hasAnyEvent = hasAnyGame || jikgwanCount > 0 || jungmoCount > 0;

          if (showOnlyGames && !hasAnyEvent) {
            return <div key={dateStr} className="day-cell empty" />;
          }

          return (
            <div
              key={dateStr}
              className={[
                "day-cell",
                "clickable",
                hasHomeGame ? "has-home-game" : hasAnyGame ? "has-away-game" : "",
                isToday ? "today" : "",
                isSelected ? "selected" : "",
                dayOfWeek === 0 ? "sunday" : dayOfWeek === 6 ? "saturday" : "",
              ].filter(Boolean).join(" ")}
              onClick={() => onSelectDate(dateStr)}
              role="button"
              aria-label={`${dateStr}${hasHomeGame ? " 홈경기" : hasAnyGame ? " 원정경기" : ""}`}
            >
              <span className="day-number">{cell.getDate()}</span>

              {/* 컬러 점 행 */}
              {(hasHomeGame || jikgwanCount > 0 || jungmoCount > 0) && (
                <div className="day-dots">
                  {hasHomeGame && <span className="dot game-dot" title="홈 경기" />}
                  {jikgwanCount > 0 && <span className="dot jikgwan-dot" title="직관" />}
                  {jungmoCount > 0 && <span className="dot jungmo-dot" title="정모" />}
                </div>
              )}

              {/* 단관 인원 뱃지 */}
              {dangwanCount > 0 && (
                <span className="count-badge">{dangwanCount}명</span>
              )}
            </div>
          );
        })}
      </div>

      {/* 범례 */}
      <div className="calendar-legend">
        <span className="legend-item">
          <span className="legend-dot game" />
          홈 경기
        </span>
        <span className="legend-item">
          <span className="legend-dot jikgwan" />
          직관
        </span>
        <span className="legend-item">
          <span className="legend-dot jungmo" />
          정모
        </span>
        <span className="legend-item">
          <span className="legend-dot today-mark" />
          오늘
        </span>
      </div>
    </div>
  );
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function buildCalendarCells(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= lastDate; d++) cells.push(new Date(year, month, d));
  return cells;
}
