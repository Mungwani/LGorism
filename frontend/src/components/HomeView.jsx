import HeroSlider from "./HeroSlider";
import WinRate from "./WinRate";
import GameCard from "./GameCard";
import { getGameByDate } from "../data/games";
import "./HomeView.css";

const today = new Date().toISOString().slice(0, 10);

const ACTIONS = [
  { view: "dangwan", icon: "📋", label: "단관신청", color: "purple" },
  { view: "jungmo", icon: "🎮", label: "정모신청", color: "blue" },
  { view: "transfer", icon: "🎫", label: "양도", color: "red" },
];

export default function HomeView({ allDangwanDates, onNavigate }) {
  const todayGame = getGameByDate(today);

  return (
    <div className="home-view">
      <HeroSlider />

      <WinRate dangwanDates={allDangwanDates} />

      {todayGame && (
        <div className="home-today-section">
          <h2 className="home-section-heading">⚾ 오늘의 경기</h2>
          <GameCard game={todayGame} date={today} />
        </div>
      )}

      <div className="home-actions">
        {ACTIONS.map((a) => (
          <button
            key={a.view}
            className={`home-action-btn ${a.color}`}
            onClick={() => onNavigate(a.view)}
          >
            <span className="home-action-icon">{a.icon}</span>
            <span className="home-action-label">{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
