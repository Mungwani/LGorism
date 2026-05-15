import "./GameCard.css";

/**
 * 선택한 날짜의 경기 정보 카드
 * Props:
 *   game - games.js 의 경기 객체 (null이면 경기 없음)
 *   date - 선택된 날짜 문자열 (YYYY-MM-DD)
 */
export default function GameCard({ game, date }) {
  if (!date) {
    return (
      <div className="game-card empty-card">
        <p className="empty-text">달력에서 날짜를 선택하세요</p>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="game-card empty-card">
        <span className="no-game-icon">😴</span>
        <p className="empty-text">{formatKorDate(date)}</p>
        <p className="empty-sub">경기가 없는 날입니다</p>
      </div>
    );
  }

  return (
    <div className="game-card">
      {/* 홈/원정 배지 */}
      <div className="game-badges">
        <span className={`badge ${game.isHome ? "home" : "away"}`}>
          {game.isHome ? "🏠 홈" : "✈️ 원정"}
        </span>
      </div>

      {/* 경기 정보 */}
      <div className="game-info">
        <div className="matchup">
          <span className="team lg">LG</span>
          <span className="vs">VS</span>
          <span className="team opponent">{game.opponent}</span>
        </div>

        <div className="game-meta">
          <div className="meta-item">
            <span className="meta-icon">📅</span>
            <span>{formatKorDate(date)} ({getDayOfWeek(date)})</span>
          </div>
          <div className="meta-item">
            <span className="meta-icon">🕐</span>
            <span>{game.time}</span>
          </div>
          <div className="meta-item">
            <span className="meta-icon">📍</span>
            <span>{game.stadium}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 유틸 ──────────────────────────────────────────────────────

function formatKorDate(dateStr) {
  const [y, m, d] = dateStr.split("-");
  return `${y}년 ${Number(m)}월 ${Number(d)}일`;
}

function getDayOfWeek(dateStr) {
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return days[new Date(dateStr).getDay()];
}
