import { useState } from "react";
import { FaChevronDown, FaUserFriends } from "react-icons/fa";
import { formatDateKo } from "../../utils/kakao";
import "./AllJungmoList.css";

const PAST_PAGE_SIZE = 3;

function JungmoCard({ jungmo, count, onSelectJungmo }) {
  return (
    <button className="ajl-card" onClick={() => onSelectJungmo(jungmo)}>
      <div className="ajl-card-top">
        <span className="ajl-card-date">{formatDateKo(jungmo.eventDate)}</span>
        <div className="ajl-card-badges">
          {jungmo.isClosed && <span className="ajl-closed-badge">마감</span>}
          {count > 0 && (
            <span className="ajl-count-badge">
              <span className="ajl-count-icon"><FaUserFriends /></span>
              {count}명 참여
            </span>
          )}
        </div>
      </div>
      <h4 className="ajl-card-title">{jungmo.title}</h4>
      {jungmo.description && (
        <p className="ajl-card-desc">{jungmo.description}</p>
      )}
      <span className="ajl-card-cta">자세히 보기 →</span>
    </button>
  );
}

export default function AllJungmoList({ jungmoList, pastJungmoList = [], participantCounts = {}, onSelectJungmo, onCreateJungmo, loading }) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [eventDate, setEventDate] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showPast, setShowPast] = useState(false);
  const [pastPage, setPastPage] = useState(1);

  const pastTotalPages = Math.max(1, Math.ceil(pastJungmoList.length / PAST_PAGE_SIZE));
  const pagedPastJungmo = pastJungmoList.slice((pastPage - 1) * PAST_PAGE_SIZE, pastPage * PAST_PAGE_SIZE);

  async function handleCreate(e) {
    e.preventDefault();
    const nextErrors = {};
    if (!eventDate) nextErrors.eventDate = "날짜를 선택해주세요";
    if (!title.trim()) nextErrors.title = "제목을 입력해주세요";
    if (!password.trim()) nextErrors.password = "관리 비밀번호를 설정해주세요";
    if (Object.keys(nextErrors).length > 0) { setErrors(nextErrors); return; }

    setSubmitting(true);
    try {
      await onCreateJungmo(eventDate, {
        title: title.trim(),
        description: description.trim(),
        password,
      });
      setEventDate(""); setTitle(""); setDescription(""); setPassword(""); setErrors({});
      setShowCreateForm(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="ajl-list">
      <h3 className="ajl-heading">🎮 정모 리스트</h3>

      {!showCreateForm ? (
        <button className="create-jungmo-btn" onClick={() => setShowCreateForm(true)}>
          + 정모 만들기
        </button>
      ) : (
        <form className="create-jungmo-form" onSubmit={handleCreate}>
          <h4 className="create-form-title">정모 만들기</h4>

          <div className={`field ${errors.eventDate ? "error" : ""}`}>
            <label>날짜 *</label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => { setEventDate(e.target.value); setErrors((p) => ({ ...p, eventDate: "" })); }}
            />
            {errors.eventDate && <span className="error-msg">{errors.eventDate}</span>}
          </div>

          <div className={`field ${errors.title ? "error" : ""}`}>
            <label>정모 제목 *</label>
            <input
              type="text"
              placeholder="예) 5/13 스크린야구 가실 분~"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: "" })); }}
              maxLength={50}
            />
            {errors.title && <span className="error-msg">{errors.title}</span>}
          </div>

          <div className="field">
            <label>내용 <span className="optional-tag">(선택)</span></label>
            <textarea
              placeholder="장소, 시간, 모집 인원 등을 적어주세요"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={200}
            />
          </div>

          <div className={`field ${errors.password ? "error" : ""}`}>
            <label>관리 비밀번호 *</label>
            <input
              type="password"
              placeholder="수정·삭제 시 필요한 비밀번호"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: "" })); }}
              maxLength={20}
            />
            {errors.password && <span className="error-msg">{errors.password}</span>}
          </div>

          <div className="create-form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => { setShowCreateForm(false); setErrors({}); }}
            >취소</button>
            <button type="submit" className="confirm-btn blue" disabled={submitting}>
              {submitting ? "생성 중..." : "정모 열기"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="loading-card">
          <span className="loading-spinner" />
          <p>불러오는 중...</p>
        </div>
      ) : jungmoList.length === 0 ? (
        <div className="ajl-empty">
          <span>🎮</span>
          <p>예정된 정모가 없어요</p>
        </div>
      ) : (
        jungmoList.map((jungmo) => (
          <JungmoCard
            key={jungmo.id}
            jungmo={jungmo}
            count={participantCounts[jungmo.id] || 0}
            onSelectJungmo={onSelectJungmo}
          />
        ))
      )}

      {!loading && pastJungmoList.length > 0 && (
        <div className="ajl-past-section">
          <button
            className="ajl-past-toggle"
            onClick={() => { setShowPast((v) => !v); setPastPage(1); }}
          >
            <span className="ajl-past-toggle-line" />
            <span className="ajl-past-toggle-label">지난 정모</span>
            <FaChevronDown className={`ajl-past-chevron ${showPast ? "open" : ""}`} />
          </button>

          {showPast && (
            <>
              <div className="ajl-past-list">
                {pagedPastJungmo.map((jungmo) => (
                  <JungmoCard
                    key={jungmo.id}
                    jungmo={jungmo}
                    count={participantCounts[jungmo.id] || 0}
                    onSelectJungmo={onSelectJungmo}
                  />
                ))}
              </div>

              {pastTotalPages > 1 && (
                <div className="ajl-pagination">
                  <button
                    className="ajl-page-btn"
                    disabled={pastPage === 1}
                    onClick={() => setPastPage((p) => p - 1)}
                  >◀ 이전</button>
                  <span className="ajl-page-indicator">{pastPage} / {pastTotalPages}</span>
                  <button
                    className="ajl-page-btn"
                    disabled={pastPage === pastTotalPages}
                    onClick={() => setPastPage((p) => p + 1)}
                  >다음 ▶</button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
