import { useState, useEffect } from "react";
import { getJungmoApplications, addJungmoApplication, updateJungmoApplication, deleteJungmoApplication, logAudit } from "../utils/storage";
import { shareContent } from "../utils/kakao";
import "./JungmoPanel.css";

function JungmoItem({ jungmo, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [totalApplicants, setTotalApplicants] = useState(0);

  useEffect(() => {
    getJungmoApplications(jungmo.id).then(apps => {
      setApplications(apps);
      setTotalApplicants(apps.reduce((s, a) => s + (a.count || 1), 0));
    }).catch(() => {});
  }, [jungmo.id]);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [applyNickname, setApplyNickname] = useState("");
  const [applyCount, setApplyCount] = useState(1);
  const [applyNote, setApplyNote] = useState("");
  const [applyPassword, setApplyPassword] = useState("");
  const [applyError, setApplyError] = useState("");
  const [applying, setApplying] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null); // { app }
  const [deletePw, setDeletePw] = useState("");
  const [deletePwError, setDeletePwError] = useState("");

  // 수정 모달
  const [editModal, setEditModal] = useState(null); // { app }
  const [editPw, setEditPw] = useState("");
  const [editPwError, setEditPwError] = useState("");
  const [editStep, setEditStep] = useState("pw"); // 'pw' | 'form'
  const [editNickname, setEditNickname] = useState("");
  const [editCount, setEditCount] = useState(1);
  const [editNote, setEditNote] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [jungmoDeletePw, setJungmoDeletePw] = useState("");
  const [jungmoDeleteError, setJungmoDeleteError] = useState("");

  async function loadApplications() {
    setLoadingApps(true);
    try {
      const apps = await getJungmoApplications(jungmo.id);
      setApplications(apps);
      setTotalApplicants(apps.reduce((s, a) => s + (a.count || 1), 0));
    } finally {
      setLoadingApps(false);
    }
  }

  function toggleExpand() {
    if (!expanded) loadApplications();
    setExpanded((v) => !v);
    setShowApplyForm(false);
  }

  async function handleApply(e) {
    e.preventDefault();
    if (!applyNickname.trim()) { setApplyError("닉네임을 입력해주세요"); return; }
    if (!applyPassword.trim()) { setApplyError("비밀번호를 입력해주세요"); return; }
    setApplying(true);
    try {
      await addJungmoApplication(jungmo.id, {
        nickname: applyNickname.trim(),
        count: applyCount,
        note: applyNote.trim(),
        password: applyPassword.trim(),
      });
      logAudit('create', 'jungmo', jungmo.eventDate, applyNickname.trim(), `${applyCount}명`);
      setApplyNickname(""); setApplyCount(1); setApplyNote(""); setApplyPassword(""); setApplyError("");
      setShowApplyForm(false);
      loadApplications();
    } finally {
      setApplying(false);
    }
  }

  function openEditModal(app) {
    setEditModal({ app });
    setEditPw(""); setEditPwError(""); setEditStep("pw");
    setEditNickname(app.nickname); setEditCount(app.count || 1); setEditNote(app.note || "");
  }

  function handleEditPwConfirm() {
    if (editPw !== editModal.app.password && editPw !== import.meta.env.VITE_ADMIN_PASSWORD) { setEditPwError("비밀번호가 틀렸어요."); return; }
    setEditStep("form");
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    if (!editNickname.trim()) return;
    await updateJungmoApplication(editModal.app.id, {
      nickname: editNickname.trim(), count: editCount, note: editNote.trim(),
    });
    logAudit('update', 'jungmo', jungmo.eventDate, editNickname.trim(), `${editCount}명`);
    setEditModal(null);
    loadApplications();
  }

  async function handleDeleteApp() {
    if (deletePw !== deleteModal.app.password && deletePw !== import.meta.env.VITE_ADMIN_PASSWORD) { setDeletePwError("비밀번호가 틀렸어요."); return; }
    await deleteJungmoApplication(deleteModal.app.id);
    logAudit('delete', 'jungmo', jungmo.eventDate, deleteModal.app.nickname, null);
    setDeleteModal(null); setDeletePw(""); setDeletePwError("");
    loadApplications();
  }

  function handleDeleteConfirm() {
    if (jungmoDeletePw !== jungmo.password && jungmoDeletePw !== import.meta.env.VITE_ADMIN_PASSWORD) {
      setJungmoDeleteError("비밀번호가 틀렸어요");
      return;
    }
    onDelete(jungmo.id);
    setShowDeleteModal(false);
  }

  return (
    <div className={`jungmo-item ${expanded ? "expanded" : ""} ${totalApplicants > 0 ? "has-apps" : ""}`}>
      <div className="jungmo-item-header" onClick={toggleExpand}>
        <div className="jungmo-item-left">
          <span className="jungmo-item-title">{jungmo.title}</span>
          {jungmo.description && (
            <p className="jungmo-item-desc">{jungmo.description}</p>
          )}
        </div>
        <div className="jungmo-item-right">
          {totalApplicants > 0 && (
            <span className="jungmo-app-badge">{totalApplicants}명</span>
          )}
          <button
            className="jungmo-share-btn"
            onClick={e => {
              e.stopPropagation()
              shareContent({
                title: `🎮 ${jungmo.title}`,
                text: `${jungmo.eventDate}${jungmo.description ? '\n' + jungmo.description : ''}\n지금 참여 신청하러 오세요!`,
                url: `https://lgorism.vercel.app?date=${jungmo.eventDate}&tab=jungmo`,
              })
            }}
          >
            공유
          </button>
          <span className="expand-chevron">{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {expanded && (
        <div className="jungmo-item-body">
          {loadingApps ? (
            <p className="loading-text">로딩 중...</p>
          ) : (
            <>
              {applications.length > 0 ? (
                <div className="jungmo-apps">
                  <p className="apps-count">
                    총 {applications.reduce((s, a) => s + (a.count || 1), 0)}명 참석 예정
                  </p>
                  {applications.map((app) => (
                    <div key={app.id} className="jungmo-app-item">
                      <span className="app-nickname">{app.nickname}</span>
                      {app.count > 1 && (
                        <span className="app-count-badge">+{app.count - 1}명</span>
                      )}
                      {app.note && (
                        <span className="app-note">· {app.note}</span>
                      )}
                      <div className="app-item-actions">
                        <button className="app-edit-btn" onClick={() => openEditModal(app)}>수정</button>
                        <button
                          className="app-delete-btn"
                          onClick={() => { setDeleteModal({ app }); setDeletePw(""); setDeletePwError(""); }}
                        >✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-apps-text">아직 신청자가 없어요</p>
              )}

              {!showApplyForm ? (
                <button
                  className="jungmo-apply-btn"
                  onClick={() => setShowApplyForm(true)}
                >
                  + 나도 참여할게요!
                </button>
              ) : (
                <form className="jungmo-apply-form" onSubmit={handleApply}>
                  <div className={`mini-field ${applyError ? "error" : ""}`}>
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
                      <span className="mini-error">{applyError}</span>
                    )}
                  </div>
                  <div className="mini-count-row">
                    <span className="mini-count-label">참석 인원</span>
                    <div className="mini-count-ctrl">
                      <button
                        type="button"
                        className="count-btn"
                        onClick={() => setApplyCount((v) => Math.max(1, v - 1))}
                      >－</button>
                      <span className="count-val">{applyCount}명</span>
                      <button
                        type="button"
                        className="count-btn"
                        onClick={() => setApplyCount((v) => Math.min(10, v + 1))}
                      >＋</button>
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="한마디 (선택)"
                    value={applyNote}
                    onChange={(e) => setApplyNote(e.target.value)}
                    maxLength={50}
                    className="mini-field-input"
                  />
                  <div className="mini-field">
                    <input
                      type="password"
                      placeholder="비밀번호 * (삭제 시 필요)"
                      value={applyPassword}
                      onChange={(e) => { setApplyPassword(e.target.value); setApplyError(""); }}
                      maxLength={20}
                    />
                  </div>
                  <div className="apply-form-actions">
                    <button
                      type="button"
                      className="cancel-btn"
                      onClick={() => {
                        setShowApplyForm(false);
                        setApplyError("");
                      }}
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className="confirm-btn"
                      disabled={applying}
                    >
                      {applying ? "신청 중..." : "신청하기"}
                    </button>
                  </div>
                </form>
              )}

              <button
                className="jungmo-delete-btn"
                onClick={() => {
                  setShowDeleteModal(true);
                  setJungmoDeletePw("");
                  setJungmoDeleteError("");
                }}
              >
                정모 삭제
              </button>
            </>
          )}
        </div>
      )}

      {deleteModal && (
        <div className="jungmo-modal-overlay" onClick={() => setDeleteModal(null)}>
          <div className="jungmo-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">🔒</div>
            <h4 className="modal-title">신청 삭제</h4>
            <p className="modal-desc">
              <strong>{deleteModal.app.nickname}</strong>님,<br />
              신청 시 설정한 비밀번호를 입력해주세요.
            </p>
            <input
              className="pw-input"
              type="password"
              placeholder="비밀번호 입력"
              value={deletePw}
              onChange={(e) => { setDeletePw(e.target.value); setDeletePwError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleDeleteApp()}
              autoFocus
            />
            {deletePwError && <p className="pw-error">{deletePwError}</p>}
            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={() => setDeleteModal(null)}>취소</button>
              <button className="modal-btn confirm red" onClick={handleDeleteApp}>삭제하기</button>
            </div>
          </div>
        </div>
      )}

      {editModal && (
        <div className="jungmo-modal-overlay" onClick={() => setEditModal(null)}>
          <div className="jungmo-modal" onClick={e => e.stopPropagation()}>
            {editStep === "pw" ? (
              <>
                <div className="modal-icon">🔒</div>
                <h4 className="modal-title">본인 확인</h4>
                <p className="modal-desc"><strong>{editModal.app.nickname}</strong>님,<br />신청 시 설정한 비밀번호를 입력해주세요.</p>
                <input className="pw-input" type="password" placeholder="비밀번호 입력"
                  value={editPw} onChange={e => { setEditPw(e.target.value); setEditPwError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleEditPwConfirm()} autoFocus />
                {editPwError && <p className="pw-error">{editPwError}</p>}
                <div className="modal-actions">
                  <button className="modal-btn cancel" onClick={() => setEditModal(null)}>취소</button>
                  <button className="modal-btn confirm blue" onClick={handleEditPwConfirm}>확인</button>
                </div>
              </>
            ) : (
              <>
                <div className="modal-icon">✏️</div>
                <h4 className="modal-title">신청 수정</h4>
                <form onSubmit={handleEditSubmit} style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
                  <input className="pw-input" type="text" placeholder="닉네임"
                    value={editNickname} onChange={e => setEditNickname(e.target.value)} autoFocus />
                  <div className="mini-count-row">
                    <span className="mini-count-label">참석 인원</span>
                    <div className="mini-count-ctrl">
                      <button type="button" className="count-btn" onClick={() => setEditCount(v => Math.max(1, v - 1))}>－</button>
                      <span className="count-val">{editCount}명</span>
                      <button type="button" className="count-btn" onClick={() => setEditCount(v => Math.min(10, v + 1))}>＋</button>
                    </div>
                  </div>
                  <input className="pw-input" type="text" placeholder="한마디 (선택)"
                    value={editNote} onChange={e => setEditNote(e.target.value)} />
                  <div className="modal-actions">
                    <button type="button" className="modal-btn cancel" onClick={() => setEditModal(null)}>취소</button>
                    <button type="submit" className="modal-btn confirm blue">수정하기</button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div
          className="jungmo-modal-overlay"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="jungmo-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-icon">🔒</div>
            <h4 className="modal-title">정모 삭제</h4>
            <p className="modal-desc">
              <strong>{jungmo.title}</strong>
              <br />
              관리 비밀번호를 입력해주세요
            </p>
            <input
              className="pw-input"
              type="password"
              placeholder="비밀번호 입력"
              value={jungmoDeletePw}
              onChange={(e) => {
                setJungmoDeletePw(e.target.value);
                setJungmoDeleteError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleDeleteConfirm()}
              autoFocus
            />
            {jungmoDeleteError && <p className="pw-error">{jungmoDeleteError}</p>}
            <div className="modal-actions">
              <button
                className="modal-btn cancel"
                onClick={() => setShowDeleteModal(false)}
              >
                취소
              </button>
              <button
                className="modal-btn confirm red"
                onClick={handleDeleteConfirm}
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function JungmoPanel({
  selectedDate,
  jungmoList,
  onCreateJungmo,
  onDeleteJungmo,
}) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [password, setPassword] = useState("");
  const [titleError, setTitleError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate(e) {
    e.preventDefault();
    let hasError = false;
    if (!title.trim()) {
      setTitleError("제목을 입력해주세요");
      hasError = true;
    }
    if (!password.trim()) {
      setPasswordError("관리 비밀번호를 설정해주세요");
      hasError = true;
    }
    if (hasError) return;

    setSubmitting(true);
    try {
      await onCreateJungmo({
        title: title.trim(),
        description: description.trim(),
        password,
      });
      setTitle("");
      setDescription("");
      setPassword("");
      setShowCreateForm(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="jungmo-panel">
      <div className="jungmo-panel-header">
        <h3 className="jungmo-panel-title">🎮 정모</h3>
        <p className="jungmo-panel-sub">
          스크린야구, 뒷풀이 등 다양한 모임을 열어보세요!
        </p>
      </div>

      {jungmoList.length > 0 && (
        <div className="jungmo-list">
          {jungmoList.map((jungmo) => (
            <JungmoItem
              key={jungmo.id}
              jungmo={jungmo}
              onDelete={onDeleteJungmo}
            />
          ))}
        </div>
      )}

      {jungmoList.length === 0 && !showCreateForm && (
        <div className="jungmo-empty">
          <span>🎮</span>
          <p>이 날 열린 정모가 없어요</p>
          <p className="empty-sub">아래 버튼으로 정모를 열어보세요!</p>
        </div>
      )}

      {!showCreateForm ? (
        <button
          className="create-jungmo-btn"
          onClick={() => setShowCreateForm(true)}
        >
          + 정모 만들기
        </button>
      ) : (
        <form className="create-jungmo-form" onSubmit={handleCreate}>
          <h4 className="create-form-title">정모 만들기</h4>

          <div className={`field ${titleError ? "error" : ""}`}>
            <label>정모 제목 *</label>
            <input
              type="text"
              placeholder="예) 5/13 스크린야구 가실 분~"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setTitleError("");
              }}
              maxLength={50}
              autoFocus
            />
            {titleError && <span className="error-msg">{titleError}</span>}
          </div>

          <div className="field">
            <label>
              내용 <span className="optional-tag">(선택)</span>
            </label>
            <textarea
              placeholder="장소, 시간, 모집 인원 등을 적어주세요"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={200}
            />
          </div>

          <div className={`field ${passwordError ? "error" : ""}`}>
            <label>관리 비밀번호 *</label>
            <input
              type="password"
              placeholder="정모 삭제 시 필요한 비밀번호"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError("");
              }}
              maxLength={20}
            />
            {passwordError && (
              <span className="error-msg">{passwordError}</span>
            )}
          </div>

          <div className="create-form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => {
                setShowCreateForm(false);
                setTitle("");
                setDescription("");
                setPassword("");
                setTitleError("");
                setPasswordError("");
              }}
            >
              취소
            </button>
            <button
              type="submit"
              className="confirm-btn blue"
              disabled={submitting}
            >
              {submitting ? "생성 중..." : "정모 열기"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
