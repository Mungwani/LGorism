import { useState, useEffect } from "react";
import "./ApplicationForm.css";

const INITIAL_FORM = {
  name: "",     // 닉네임 (필수)
  count: 1,     // 인원 수 (필수)
  request: "",  // 특이사항
  password: "", // 비밀번호 (필수, 수정·삭제 시 사용)
};

/**
 * 단관 신청 폼
 * Props:
 *   selectedDate    - 선택된 날짜 (YYYY-MM-DD)
 *   editingItem     - 수정 중인 신청 객체 (null이면 새 신청)
 *   onSubmit        - 제출 콜백 (formData) => void
 *   onCancelEdit    - 수정 취소 콜백
 *   isClosed        - 해당 경기 신청 마감 여부
 */
export default function ApplicationForm({
  selectedDate,
  editingItem,
  onSubmit,
  onCancelEdit,
  isClosed,
}) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});

  // 수정 모드 진입 시 기존 데이터 채우기
  useEffect(() => {
    if (editingItem) {
      setForm({
        name: editingItem.name || "",
        count: editingItem.count || 1,
        request: editingItem.request || "",
      });
    } else {
      setForm(INITIAL_FORM);
    }
    setErrors({});
  }, [editingItem, selectedDate]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // 에러 즉시 제거
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function validate() {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "닉네임을 입력해주세요.";
    if (!form.count || Number(form.count) < 1) newErrors.count = "1명 이상 입력해주세요.";
    if (!editingItem && !form.password.trim()) newErrors.password = "비밀번호를 입력해주세요.";
    return newErrors;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onSubmit({ ...form, count: Number(form.count) });
    if (!editingItem) setForm(INITIAL_FORM);
  }

  if (!selectedDate) return null;

  return (
    <div className="form-card">
      <div className="form-header">
        <h3 className="form-title">
          {editingItem ? "✏️ 신청 수정" : "📝 단관 신청하기"}
        </h3>
        {editingItem && (
          <button className="cancel-edit-btn" onClick={onCancelEdit}>
            취소
          </button>
        )}
      </div>

      {isClosed && !editingItem ? (
        <div className="closed-notice">
          <span>🚫</span>
          <p>이 경기는 신청이 마감되었습니다.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          {/* ── 필수 입력 ────────────────────────────────────── */}
          <div className="section-label">필수 정보</div>

          <div className={`field ${errors.name ? "error" : ""}`}>
            <label htmlFor="name">닉네임 *</label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="예) 이블"
              value={form.name}
              onChange={handleChange}
              maxLength={30}
            />
            {errors.name && <span className="error-msg">{errors.name}</span>}
          </div>

          <div className={`field ${errors.count ? "error" : ""}`}>
            <label htmlFor="count">참여 인원 수 *</label>
            <div className="count-input-wrap">
              <button
                type="button"
                className="count-btn"
                onClick={() =>
                  setForm((prev) => ({ ...prev, count: Math.max(1, Number(prev.count) - 1) }))
                }
              >
                −
              </button>
              <input
                id="count"
                name="count"
                type="number"
                min="1"
                max="20"
                value={form.count}
                onChange={handleChange}
              />
              <button
                type="button"
                className="count-btn"
                onClick={() =>
                  setForm((prev) => ({ ...prev, count: Math.min(20, Number(prev.count) + 1) }))
                }
              >
                +
              </button>
            </div>
            {errors.count && <span className="error-msg">{errors.count}</span>}
          </div>

          {/* 비밀번호 — 신규 신청 시에만 표시 */}
          {!editingItem && (
            <div className={`field ${errors.password ? "error" : ""}`}>
              <label htmlFor="password">비밀번호 * <span className="label-hint">(수정·삭제 시 필요)</span></label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="본인만 아는 비밀번호 입력"
                value={form.password}
                onChange={handleChange}
                maxLength={20}
              />
              {errors.password && <span className="error-msg">{errors.password}</span>}
            </div>
          )}

          {/* ── 선택 입력 ────────────────────────────────────── */}
          <div className="section-label optional">선택 정보</div>

          <div className="field">
            <label htmlFor="request">특이사항</label>
            <textarea
              id="request"
              name="request"
              placeholder="예) 친구 2명 데리고 가요"
              value={form.request}
              onChange={handleChange}
              rows={3}
              maxLength={150}
            />
          </div>

          <button type="submit" className="submit-btn">
            {editingItem ? "💾 수정 완료" : "⚾ 신청하기"}
          </button>
        </form>
      )}
    </div>
  );
}
