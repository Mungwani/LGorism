import { useState } from "react";
import "./JikgwanPanel.css";

export default function JikgwanPanel({ selectedDate, jikgwanList, onAdd, onDelete }) {
  const [nickname, setNickname] = useState("");
  const [section, setSection] = useState("");
  const [password, setPassword] = useState("");
  const [isTowelFairy, setIsTowelFairy] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // 삭제 모달 상태
  const [deleteTarget, setDeleteTarget] = useState(null); // jikgwan item
  const [deletePw, setDeletePw] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const towelFairies = jikgwanList.filter((p) => p.isTowelFairy);

  async function handleSubmit(e) {
    e.preventDefault();
    const newErrors = {};
    if (!nickname.trim()) newErrors.nickname = "닉네임을 입력해주세요";
    if (!password.trim()) newErrors.password = "비밀번호를 입력해주세요";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setSubmitting(true);
    try {
      await onAdd({ nickname: nickname.trim(), section: section.trim(), isTowelFairy, password });
      setNickname("");
      setSection("");
      setPassword("");
      setIsTowelFairy(false);
      setErrors({});
    } finally {
      setSubmitting(false);
    }
  }

  function openDeleteModal(person) {
    setDeleteTarget(person);
    setDeletePw("");
    setDeleteError("");
  }

  function closeDeleteModal() {
    setDeleteTarget(null);
    setDeletePw("");
    setDeleteError("");
  }

  function handleDeleteConfirm() {
    if (deletePw !== deleteTarget.password) {
      setDeleteError("비밀번호가 틀렸어요");
      return;
    }
    onDelete(deleteTarget.id);
    closeDeleteModal();
  }

  return (
    <div className="jikgwan-panel">
      {/* 등록 폼 */}
      <form className="jikgwan-form" onSubmit={handleSubmit}>
        <div className="jikgwan-form-header">
          <h3 className="jikgwan-title">🏟 오늘 직관 가요!</h3>
          <p className="jikgwan-subtitle">참여 의사를 남겨보세요</p>
        </div>

        <div className={`field ${errors.nickname ? "error" : ""}`}>
          <label htmlFor="jk-nickname">닉네임 *</label>
          <input
            id="jk-nickname"
            type="text"
            placeholder="예) 빨간유니폼박씨"
            value={nickname}
            onChange={(e) => { setNickname(e.target.value); setErrors((p) => ({ ...p, nickname: "" })); }}
            maxLength={30}
          />
          {errors.nickname && <span className="error-msg">{errors.nickname}</span>}
        </div>

        <div className="field">
          <label htmlFor="jk-section">
            어느 구역? <span className="optional-tag">(선택)</span>
          </label>
          <input
            id="jk-section"
            type="text"
            placeholder="예) 1루 응원석, 1루 레드석"
            value={section}
            onChange={(e) => setSection(e.target.value)}
            maxLength={30}
          />
        </div>

        <div className={`field ${errors.password ? "error" : ""}`}>
          <label htmlFor="jk-password">
            비밀번호 * <span className="label-hint">(삭제 시 필요)</span>
          </label>
          <input
            id="jk-password"
            type="password"
            placeholder="본인만 아는 비밀번호"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: "" })); }}
            maxLength={20}
          />
          {errors.password && <span className="error-msg">{errors.password}</span>}
        </div>

        <button
          type="button"
          className={`towel-fairy-btn ${isTowelFairy ? "active" : ""}`}
          onClick={() => setIsTowelFairy((v) => !v)}
        >
          🎽 {isTowelFairy ? "수건요정 신청됨! (취소하려면 클릭)" : "제가 수건요정할게요!"}
        </button>

        {towelFairies.length > 0 && !isTowelFairy && (
          <p className="fairy-notice">
            이미 수건요정이 있어요 — {towelFairies.map((p) => p.nickname).join(", ")}
          </p>
        )}
        {isTowelFairy && (
          <p className="fairy-notice active">5회말에 모여서 수건 샷 찍어요!</p>
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
                onClick={() => openDeleteModal(person)}
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

      {/* 삭제 비밀번호 모달 */}
      {deleteTarget && (
        <div className="jk-modal-overlay" onClick={closeDeleteModal}>
          <div className="jk-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">🔒</div>
            <h4 className="modal-title">직관 등록 삭제</h4>
            <p className="modal-desc">
              <strong>{deleteTarget.nickname}</strong>님,<br />
              등록 시 설정한 비밀번호를 입력해주세요
            </p>
            <input
              className={`pw-input ${deleteError ? "error" : ""}`}
              type="password"
              placeholder="비밀번호 입력"
              value={deletePw}
              onChange={(e) => { setDeletePw(e.target.value); setDeleteError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleDeleteConfirm()}
              autoFocus
            />
            {deleteError && <p className="pw-error">{deleteError}</p>}
            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={closeDeleteModal}>
                취소
              </button>
              <button className="modal-btn confirm red" onClick={handleDeleteConfirm}>
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
