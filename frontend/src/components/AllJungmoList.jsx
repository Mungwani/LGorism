import "./DangwanDateList.css";

export default function AllJungmoList({ jungmoList, onSelectDate }) {
  if (jungmoList.length === 0) {
    return (
      <div className="ddl-empty">
        <span>🎮</span>
        <p>예정된 정모가 없어요</p>
      </div>
    );
  }

  return (
    <div className="dangwan-date-list">
      <h3 className="ddl-heading">🎮 정모 리스트</h3>
      {jungmoList.map((jungmo) => (
        <div key={jungmo.id} className="ddl-item ddl-item-jungmo">
          <div className="ddl-jungmo-info">
            <span className="ddl-jungmo-name">{jungmo.title}</span>
            <span className="ddl-jungmo-sub">{jungmo.eventDate}</span>
          </div>
          <button className="ddl-goto-btn ddl-goto-jungmo" onClick={() => onSelectDate(jungmo.eventDate)}>
            보러 가기 →
          </button>
        </div>
      ))}
    </div>
  );
}
