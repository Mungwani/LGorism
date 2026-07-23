import { FaClipboardList, FaUsers, FaTicketAlt, FaLandmark } from "react-icons/fa";
import HeroSlider from "./HeroSlider";
import NoticeBanner from "./NoticeBanner";
import WinRate from "./WinRate";
import GameCard from "./GameCard";
import { games, getGameByDate } from "../data/games";
import "./HomeView.css";

const today = new Date().toISOString().slice(0, 10);

const ACTIONS = [
  { view: "dangwan", icon: FaClipboardList, label: "단관신청", color: "purple" },
  { view: "jungmo", icon: FaUsers, label: "정모신청", color: "blue" },
  { view: "transfer", icon: FaTicketAlt, label: "양도", color: "red" },
];

function formatShortDate(dateStr) {
  const [, m, d] = dateStr.split("-");
  return `${parseInt(m)}월 ${parseInt(d)}일`;
}

export default function HomeView({ allDangwanDates, onNavigate, onGoToJikgwan }) {
  const todayGame = getGameByDate(today);
  const nextGame = !todayGame
    ? games.find((g) => g.date > today && !g.isClosed)
    : null;

  return (
    <div className="home-view">
      <HeroSlider />

      <NoticeBanner />

      <WinRate dangwanDates={allDangwanDates} />

      <div className="home-actions">
        {ACTIONS.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.view}
              className={`home-action-btn ${a.color}`}
              onClick={() => onNavigate(a.view)}
            >
              <span className="home-action-icon"><Icon /></span>
              <span className="home-action-label">{a.label}</span>
            </button>
          );
        })}
      </div>

      <div className="home-game-section">
        <h2 className="home-section-heading">⚾ 경기 일정</h2>
        {todayGame ? (
          <>
            <GameCard game={todayGame} date={today} />
            <button className="home-jikgwan-cta" onClick={onGoToJikgwan}>
              <FaLandmark /> 오늘 직관 가요!
            </button>
          </>
        ) : (
          <div className="home-next-game-card">
            <p className="home-next-game-empty">오늘은 경기가 없어요</p>
            {nextGame ? (
              <p className="home-next-game-info">
                다음 경기는 <strong>{formatShortDate(nextGame.date)}</strong>{" "}
                <strong>{nextGame.opponent}</strong>전이에요
              </p>
            ) : (
              <p className="home-next-game-info">예정된 경기가 없어요</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
