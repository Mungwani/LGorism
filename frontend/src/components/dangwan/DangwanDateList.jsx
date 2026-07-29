import "./DangwanDateList.css";

export default function DangwanDateList({ dangwanSummary, dangwanOpenDates, onSelectDate, loading }) {
  const dates = Object.entries(dangwanSummary)
    .filter(([date, info]) => info.totalPeople > 0 && dangwanOpenDates.has(date))
    .sort(([a], [b]) => a.localeCompare(b));

  if (loading) {
    return (
      <div className="loading-card">
        <span className="loading-spinner" />
        <p>불러오는 중...</p>
      </div>
    );
  }

  if (dates.length === 0) {
    return (
      <div className="ddl-empty">
        <span>📋</span>
        <p>단관 일정이 없어요</p>
      </div>
    );
  }

  return (
    <div className="dangwan-date-list">
      <h3 className="ddl-heading">📋 단관 신청 목록</h3>
      {dates.map(([dateStr, info]) => (
        <div key={dateStr} className="ddl-item">
          <div className="ddl-item-info">
            <span className="ddl-date">{dateStr}</span>
            <span className="ddl-count">{info.totalPeople}명</span>
          </div>
          <button className="ddl-goto-btn" onClick={() => onSelectDate(dateStr)}>
            신청하러 가기 →
          </button>
        </div>
      ))}
    </div>
  );
}
