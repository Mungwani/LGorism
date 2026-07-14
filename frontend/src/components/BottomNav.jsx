import "./BottomNav.css";

const TABS = [
  { id: "home", icon: "🏠", label: "홈" },
  { id: "dangwan", icon: "📋", label: "단관" },
  { id: "jungmo", icon: "🎮", label: "정모" },
  { id: "transfer", icon: "🎫", label: "양도" },
  { id: "calendar", icon: "📅", label: "캘린더" },
];

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="bottom-nav">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={`bottom-nav-item ${active === tab.id ? "active" : ""}`}
          onClick={() => onChange(tab.id)}
        >
          <span className="bottom-nav-icon">{tab.icon}</span>
          <span className="bottom-nav-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
