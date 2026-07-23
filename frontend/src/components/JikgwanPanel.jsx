import { useState } from "react";
import "./JikgwanPanel.css";

export default function JikgwanPanel({ selectedDate, jikgwanList, onAdd, onUpdate, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [nickname, setNickname] = useState("");
  const [section, setSection] = useState("");
  const [password, setPassword] = useState("");
  const [isTowelFairy, setIsTowelFairy] = useState(false);
  const [towelMeetingArea, setTowelMeetingArea] = useState("");
  const [towelInning, setTowelInning] = useState("5회말");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // 삭제 모달 상태
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletePw, setDeletePw] = useState("");
  const [deleteError, setDeleteError] = useState("");

  // 수정 모달 상태
  const [editTarget, setEditTarget] = useState(null);
  const [editPw, setEditPw] = useState("");
  const [editPwError, setEditPwError] = useState("");
  const [editIsTowelFairy, setEditIsTowelFairy] = useState(false);
  const [editMeetingArea, setEditMeetingArea] = useState("");
  const [editInning, setEditInning] = useState("5회말");
  const [editSubmitting, setEditSubmitting] = useState(false);

  const towelFairies = jikgwanList.filter((p) => p.isTowelFairy);

  async function handleSubmit(e) {
    e.preventDefault();
    const newErrors = {};
    if (!nickname.trim()) newErrors.nickname = "닉네임을 입력해주세요";
    if (!password.trim()) newErrors.password = "비밀번호를 입력해주세요";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setSubmitting(true);
    try {
      await onAdd({ nickname: nickname.trim(), section: section.trim(), isTowelFairy, towelMeetingArea: towelMeetingArea.trim(), towelInning: towelInning.trim(), password });
      setNickname("");
      setSection("");
      setPassword("");
      setIsTowelFairy(false);
      setTowelMeetingArea("");
      setTowelInning("5회말");
      setErrors({});
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  }

  // 삭제 모달
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

  async function handleDeleteConfirm() {
    const ok = await onDelete(deleteTarget.id, deletePw);
    if (!ok) {
      setDeleteError("비밀번호가 틀렸어요");
      return;
    }
    closeDeleteModal();
  }

  // 수정 모달
  function openEditModal(person) {
    setEditTarget(person);
    setEditPw("");
    setEditPwError("");
    setEditIsTowelFairy(person.isTowelFairy);
    setEditMeetingArea(person.towelMeetingArea || "");
    setEditInning(person.towelInning || "5회말");
    setEditSubmitting(false);
  }

  function closeEditModal() {
    setEditTarget(null);
    setEditPw("");
    setEditPwError("");
    setEditSubmitting(false);
  }

  async function handleEditConfirm() {
    setEditSubmitting(true);
    try {
      const ok = await onUpdate(editTarget.id, editPw, { isTowelFairy: editIsTowelFairy, towelMeetingArea: editMeetingArea.trim(), towelInning: editInning.trim() });
      if (!ok) {
        setEditPwError("비밀번호가 틀렸어요");
        return;
      }
      closeEditModal();
    } finally {
      setEditSubmitting(false);
    }
  }

  return (
    <div className="jikgwan-panel">
      {/* 등록 토글 버튼 */}
      <button
        className={`jikgwan-toggle-btn ${showForm ? "open" : ""}`}
        onClick={() => setShowForm((v) => !v)}
      >
        🏟 오늘 직관 가요!
        <span className="jikgwan-toggle-chevron">{showForm ? "▲" : "▼"}</span>
      </button>

      {/* 등록 폼 */}
      {showForm && (
      <form className="jikgwan-form" onSubmit={handleSubmit}>
        <div className="jikgwan-form-header">
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
            비밀번호 * <span className="label-hint">(삭제·수정 시 필요)</span>
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
          onClick={() => { setIsTowelFairy((v) => !v); setTowelMeetingArea(""); setTowelInning("5회말"); }}
        >
          🎽 {isTowelFairy ? "수건대장 신청됨! (취소하려면 클릭)" : "제가 수건대장할게요!"}
        </button>

        {/* 수건대장 집합 정보 입력 */}
        {isTowelFairy && (
          <div className="towel-meeting-field">
            <div className="field">
              <label htmlFor="jk-inning">몇 회 끝나고 모이나요?</label>
              <input
                id="jk-inning"
                type="text"
                value={towelInning}
                onChange={(e) => setTowelInning(e.target.value)}
                maxLength={10}
                autoFocus
              />
            </div>
            <div className="field">
              <label htmlFor="jk-meeting-area">
                어느 구역에서 모일건가요? <span className="optional-tag">(선택)</span>
              </label>
              <input
                id="jk-meeting-area"
                type="text"
                placeholder="예) 1루 응원석 계단 앞, 3루 입구"
                value={towelMeetingArea}
                onChange={(e) => setTowelMeetingArea(e.target.value)}
                maxLength={50}
              />
            </div>
          </div>
        )}

        {towelFairies.length > 0 && !isTowelFairy && (
          <p className="fairy-notice">
            이미 수건대장이 있어요 — {towelFairies.map((p) => p.nickname).join(", ")}
          </p>
        )}

        <button type="submit" className="submit-btn" disabled={submitting}>
          {submitting ? "등록 중..." : "⚾ 직관 등록하기"}
        </button>
      </form>
      )}

      {/* 수건대장 집합 안내 배너 */}
      {towelFairies.length > 0 && (
        <div className="towel-callout">
          <div className="towel-callout-header">🎽 수건대장</div>
          {towelFairies.map((f) => (
            <div key={f.id} className="towel-callout-row">
              <span className="towel-callout-name">{f.nickname}</span>
              <span className="towel-callout-inning">🕐 {f.towelInning || '5회말'} 이후</span>
              {f.towelMeetingArea ? (
                <span className="towel-callout-place">📍 {f.towelMeetingArea}</span>
              ) : (
                <span className="towel-callout-no-place">장소 미정</span>
              )}
            </div>
          ))}
        </div>
      )}

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
                    <span className="badge fairy">🎽 수건대장</span>
                  )}
                  {person.section && (
                    <span className="badge section">📍 {person.section}</span>
                  )}
                </div>
              </div>
              <div className="jk-actions">
                <button
                  className="jk-edit-btn"
                  onClick={() => openEditModal(person)}
                  aria-label="수정"
                >
                  ✏️
                </button>
                <button
                  className="jk-delete-btn"
                  onClick={() => openDeleteModal(person)}
                  aria-label="삭제"
                >
                  ✕
                </button>
              </div>
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

      {/* 수정 모달 */}
      {editTarget && (
        <div className="jk-modal-overlay" onClick={closeEditModal}>
          <div className="jk-modal jk-edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">✏️</div>
            <h4 className="modal-title">{editTarget.nickname}님 수정</h4>
            <p className="modal-desc">
              비밀번호 확인 후 수정할 수 있어요
            </p>
            <input
              className={`pw-input ${editPwError ? "error" : ""}`}
              type="password"
              placeholder="비밀번호 입력"
              value={editPw}
              onChange={(e) => { setEditPw(e.target.value); setEditPwError(""); }}
              autoFocus
            />
            {editPwError && <p className="pw-error">{editPwError}</p>}

            {/* 수건대장 토글 */}
            <button
              type="button"
              className={`towel-fairy-btn edit-towel-btn ${editIsTowelFairy ? "active" : ""}`}
              onClick={() => { setEditIsTowelFairy((v) => !v); if (editIsTowelFairy) { setEditMeetingArea(""); setEditInning("5회말"); } }}
            >
              🎽 {editIsTowelFairy ? "수건대장 취소하기" : "수건대장 신청하기"}
            </button>

            {/* 집합 정보 수정 */}
            {editIsTowelFairy && (
              <div className="edit-meeting-field">
                <label className="edit-meeting-label">몇 회 끝나고 모이나요?</label>
                <input
                  className="edit-meeting-input"
                  type="text"
                  value={editInning}
                  onChange={(e) => setEditInning(e.target.value)}
                  maxLength={10}
                />
                <label className="edit-meeting-label" style={{ marginTop: 8 }}>어느 구역에서 모일건가요?</label>
                <input
                  className="edit-meeting-input"
                  type="text"
                  placeholder="예) 1루 응원석 계단 앞"
                  value={editMeetingArea}
                  onChange={(e) => setEditMeetingArea(e.target.value)}
                  maxLength={50}
                />
              </div>
            )}

            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={closeEditModal}>
                취소
              </button>
              <button
                className="modal-btn confirm"
                onClick={handleEditConfirm}
                disabled={editSubmitting}
              >
                {editSubmitting ? "저장 중..." : "저장하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
