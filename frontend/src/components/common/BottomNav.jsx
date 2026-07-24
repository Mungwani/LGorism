import { FaHome, FaClipboardList, FaUsers, FaTicketAlt, FaCalendarAlt } from "react-icons/fa";
import "./BottomNav.css";

const TABS = [
  { id: "dangwan", icon: FaClipboardList, label: "단관" },
  { id: "jungmo", icon: FaUsers, label: "정모" },
  { id: "home", icon: FaHome, label: "홈" },
  { id: "calendar", icon: FaCalendarAlt, label: "캘린더" },
  { id: "transfer", icon: FaTicketAlt, label: "양도" },
];

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="bottom-nav">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isHome = tab.id === "home";
        return (
          <button
            key={tab.id}
            className={`bottom-nav-item ${isHome ? "home-item" : ""} ${active === tab.id ? "active" : ""}`}
            onClick={() => onChange(tab.id)}
          >
            <span className={isHome ? "home-circle" : "bottom-nav-icon-wrap"}>
              <Icon className="bottom-nav-icon" />
            </span>
            {!isHome && <span className="bottom-nav-label">{tab.label}</span>}
          </button>
        );
      })}
    </nav>
  );
}
