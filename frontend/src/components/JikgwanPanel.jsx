import { useState } from "react";
import "./JikgwanPanel.css";

export default function JikgwanPanel({ selectedDate, jikgwanList, onAdd, onDelete }) {
  const [nickname, setNickname] = useState("");
  const [section, setSection] = useState("");
  const [isTowelFairy, setIsTowelFairy] = useState(false);
  const [nicknameError, setNicknameError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const towelFairies = jikgwanList.filter((p) => p.isTowelFairy);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!nickname.trim()) {
      setNicknameError("닉네임을 입력해주세요");
      return;
    }
    setSubmitting(true);
    try {
      await onAdd({
        nickname: nickname.trim(),
        section: section.trim(),
        isTowelFairy,
      });
      setNickname("");
      setSection("");
      setIsTowelFairy(false);
      setNicknameError("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="jikgwan-panel">
      {/* 등록 폼 */}
      <form className="jikgwan-form" onSubmit={handleSubmit}>
        <div className="jikgwan-form-header">
          <h3 className="jikgwan-title">🏟 오늘 직관 가요!</h3>
          <p className="jikgwan-subtitle">참여 의사를 남겨보세요</p>
        </div>

        <div className={`field ${nicknameError ? "error" : ""}`}>
          <label htmlFor="jk-nickname">닉네임 *</label>
          <input
            id="jk-nickname"
            type="text"
            placeholder="예) 빨간유니폼박씨"
            value={nickname}
            onChange={(e) => {
              setNickname(e.target.value);
              setNicknameError("");
            }}
            maxLength={30}
          />
          {nicknameError && <span className="error-msg">{nicknameError}</span>}
        </div>

        <div className="field">
          <label htmlFor="jk-section">
            어느 구역? <span className="optional-tag">(선택)</span>
          </label>
          <input
            id="jk-section"
            type="text"
            placeholder="예) 1루 응원석, 외야 A, 내야 3루"
            value={section}
            onChange={(e) => setSection(e.target.value)}
            maxLength={30}
          />
        </div>

        <button
          type="button"
          className={`towel-fairy-btn ${isTowelFairy ? "active" : ""}`}
          onClick={() => setIsTowelFairy((v) => !v)}
        >
          🎽{" "}
          {isTowelFairy ? "수건요정 신청됨! (취소하려면 클릭)" : "제가 수건요정할게요!"}
        </button>

        {towelFairies.length > 0 && !isTowelFairy && (
          <p className="fairy-notice">
            이미 수건요정이 있어요 — {towelFairies.map((p) => p.nickname).join(", ")}
          </p>
        )}
        {isTowelFairy && (
          <p className="fairy-notice active">
            5회말에 모여서 수건 샷 찍어요!
          </p>
        )}

        <button type="submit" className="submit-btn" disabled={submitting}>
          {submitting ? "등록 중..." : "⚾ 직관 등록하기"}
        </button>
      </form>

      {/* 직관 가는 사람 목록 */}
      {jikgwanList.length > 0 ? (
        <div className="jikgwan-list">
          <h4 className="jikgwan-list-title">
            오늘 직관 가는 사람들{" "}
            <span className="jikgwan-count">{jikgwanList.length}명</span>
          </h4>
          {jikgwanList.map((person, i) => (
            <div key={person.id} className="jikgwan-item">
              <span className="jk-num">{i + 1}</span>
              <div className="jk-info">
                <span className="jk-name">{person.nickname}</span>
                <div className="jk-badges">
                  {person.isTowelFairy && (
                    <span className="badge fairy">🎽 수건요정</span>
                  )}
                  {person.section && (
                    <span className="badge section">📍 {person.section}</span>
                  )}
                </div>
              </div>
              <button
                className="jk-delete-btn"
                onClick={() => onDelete(person.id)}
                aria-label="삭제"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="jikgwan-empty">
          <span>🏟</span>
          <p>아직 직관 등록자가 없어요</p>
          <p className="empty-sub">첫 번째로 등록해보세요!</p>
        </div>
      )}
    </div>
  );
}
