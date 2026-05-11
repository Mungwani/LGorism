import { useState } from "react";
import { gameDateSet } from "../data/games";
import "./Calendar.css";

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];
const MONTHS = ["1월", "2월", "3월", "4월", "5월", "6월",
                "7월", "8월", "9월", "10월", "11월", "12월"];

/**
 * 달력 컴포넌트
 * Props:
 *   selectedDate   - 현재 선택된 날짜 (YYYY-MM-DD)
 *   onSelectDate   - 날짜 클릭 시 호출되는 콜백
 *   summary        - { "YYYY-MM-DD": { applicantCount, totalPeople } }
 *   showOnlyGames  - true면 경기 있는 날만 필터 표시
 */
export default function Calendar({ selectedDate, onSelectDate, summary = {}, showOnlyGames }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-based

  const todayStr = formatDate(today);

  // 이전 달로
  function prevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  // 다음 달로
  function nextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  // 이번 달 달력 날짜 배열 생성
  const cells = buildCalendarCells(viewYear, viewMonth);

  return (
    <div className="calendar">
      {/* 헤더: 연월 + 이전/다음 버튼 */}
      <div className="calendar-header">
        <button className="nav-btn" onClick={prevMonth} aria-label="이전 달">
          ‹
        </button>
        <span className="calendar-title">
          {viewYear}년 {MONTHS[viewMonth]}
        </span>
        <button className="nav-btn" onClick={nextMonth} aria-label="다음 달">
          ›
        </button>
      </div>

      {/* 요일 행 */}
      <div className="calendar-grid">
        {DAYS.map((d, i) => (
          <div
            key={d}
            className={`day-label ${i === 0 ? "sunday" : i === 6 ? "saturday" : ""}`}
          >
            {d}
          </div>
        ))}

        {/* 날짜 셀 */}
        {cells.map((cell, idx) => {
          if (!cell) {
            return <div key={`empty-${idx}`} className="day-cell empty" />;
          }

          const dateStr = formatDate(cell);
          const hasGame = gameDateSet.has(dateStr);
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const daySummary = summary[dateStr];
          const dayOfWeek = cell.getDay();

          // 경기만 보기 필터
          if (showOnlyGames && !hasGame) {
            return <div key={dateStr} className="day-cell empty" />;
          }

          return (
            <div
              key={dateStr}
              className={[
                "day-cell",
                hasGame ? "has-game" : "",
                isToday ? "today" : "",
                isSelected ? "selected" : "",
                dayOfWeek === 0 ? "sunday" : dayOfWeek === 6 ? "saturday" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => hasGame && onSelectDate(dateStr)}
              role={hasGame ? "button" : undefined}
              aria-label={hasGame ? `${dateStr} 경기` : undefined}
            >
              <span className="day-number">{cell.getDate()}</span>
              {hasGame && <span className="game-dot" />}
              {/* 신청 인원 뱃지 */}
              {daySummary && daySummary.totalPeople > 0 && (
                <span className="count-badge">{daySummary.totalPeople}명</span>
              )}
            </div>
          );
        })}
      </div>

      {/* 범례 */}
      <div className="calendar-legend">
        <span className="legend-item">
          <span className="legend-dot game" />
          경기 있음
        </span>
        <span className="legend-item">
          <span className="legend-dot today-mark" />
          오늘
        </span>
        <span className="legend-item">
          <span className="legend-dot count-mark" />
          신청 인원
        </span>
      </div>
    </div>
  );
}

// ── 유틸 ──────────────────────────────────────────────────────

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * 해당 월의 달력 셀 배열 반환
 * 앞쪽 빈 칸은 null, 나머지는 Date 객체
 */
function buildCalendarCells(year, month) {
  const firstDay = new Date(year, month, 1).getDay(); // 0=일 ~ 6=토
  const lastDate = new Date(year, month + 1, 0).getDate();
  const cells = [];

  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= lastDate; d++) cells.push(new Date(year, month, d));

  return cells;
}
