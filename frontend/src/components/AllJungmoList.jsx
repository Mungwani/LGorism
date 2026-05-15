import { useState } from "react";
import { getJungmoApplications, addJungmoApplication } from "../utils/storage";
import "./AllJungmoList.css";

function JungmoListItem({ jungmo }) {
  const [expanded, setExpanded] = useState(false);
  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [applyNickname, setApplyNickname] = useState("");
  const [applyNote, setApplyNote] = useState("");
  const [applyError, setApplyError] = useState("");
  const [applying, setApplying] = useState(false);

  async function loadApps() {
    setLoadingApps(true);
    try {
      const apps = await getJungmoApplications(jungmo.id);
      setApplications(apps);
    } finally {
      setLoadingApps(false);
    }
  }

  function toggle() {
    if (!expanded) loadApps();
    setExpanded((v) => !v);
    setShowApplyForm(false);
  }

  async function handleApply(e) {
    e.preventDefault();
    if (!applyNickname.trim()) {
      setApplyError("닉네임을 입력해주세요");
      return;
    }
    setApplying(true);
    try {
      await addJungmoApplication(jungmo.id, {
        nickname: applyNickname.trim(),
        note: applyNote.trim(),
      });
      setApplyNickname("");
      setApplyNote("");
      setApplyError("");
      setShowApplyForm(false);
      loadApps();
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className={`ajl-item ${expanded ? "expanded" : ""}`}>
      <div className="ajl-item-header" onClick={toggle}>
        <span className="ajl-date-chip">{jungmo.eventDate}</span>
        <div className="ajl-item-info">
          <span className="ajl-title">{jungmo.title}</span>
          {jungmo.description && (
            <p className="ajl-desc">{jungmo.description}</p>
          )}
        </div>
        <span className="ajl-chevron">{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && (
        <div className="ajl-item-body">
          {loadingApps ? (
            <p className="ajl-loading">로딩 중...</p>
          ) : (
            <>
              {applications.length > 0 && (
                <div className="ajl-apps">
                  <p className="ajl-apps-count">{applications.length}명 신청 중</p>
                  {applications.map((app, i) => (
                    <div key={app.id} className="ajl-app-row">
                      <span className="ajl-app-num">{i + 1}</span>
                      <span className="ajl-app-nick">{app.nickname}</span>
                      {app.note && (
                        <span className="ajl-app-note">· {app.note}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!showApplyForm ? (
                <button
                  className="ajl-apply-btn"
                  onClick={() => setShowApplyForm(true)}
                >
                  + 나도 참여할게요!
                </button>
              ) : (
                <form className="ajl-apply-form" onSubmit={handleApply}>
                  <div className={`ajl-mini-field ${applyError ? "error" : ""}`}>
                    <input
                      type="text"
                      placeholder="닉네임 *"
                      value={applyNickname}
                      onChange={(e) => {
                        setApplyNickname(e.target.value);
                        setApplyError("");
                      }}
                      maxLength={30}
                      autoFocus
                    />
                    {applyError && (
                      <span className="ajl-mini-error">{applyError}</span>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="한마디 (선택)"
                    value={applyNote}
                    onChange={(e) => setApplyNote(e.target.value)}
                    maxLength={50}
                    className="ajl-note-input"
                  />
                  <div className="ajl-form-actions">
                    <button
                      type="button"
                      className="ajl-cancel-btn"
                      onClick={() => {
                        setShowApplyForm(false);
                        setApplyError("");
                      }}
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className="ajl-confirm-btn"
                      disabled={applying}
                    >
                      {applying ? "신청 중..." : "신청하기"}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function AllJungmoList({ jungmoList }) {
  if (jungmoList.length === 0) {
    return (
      <div className="ajl-empty">
        <span>🎮</span>
        <p>예정된 정모가 없어요</p>
      </div>
    );
  }

  return (
    <div className="all-jungmo-list">
      <h3 className="ajl-heading">🎮 올라온 정모 리스트</h3>
      {jungmoList.map((jungmo) => (
        <JungmoListItem key={jungmo.id} jungmo={jungmo} />
      ))}
    </div>
  );
}
