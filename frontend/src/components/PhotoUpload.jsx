import { useState, useRef } from "react";
import "./PhotoUpload.css";

/**
 * 인증샷 업로드 컴포넌트
 * Props:
 *   photos        - 현재 날짜의 인증샷 배열 [{ id, base64, nickname, caption, createdAt }]
 *   onUpload      - 업로드 콜백 ({ base64, nickname, caption }) => void
 *   onDelete      - 삭제 콜백 (photoId) => void
 *   selectedDate  - 선택된 날짜
 */
export default function PhotoUpload({ photos, onUpload, onDelete, selectedDate }) {
  const [preview, setPreview] = useState(null);   // 미리보기 base64
  const [nickname, setNickname] = useState("");
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [lightbox, setLightbox] = useState(null); // 확대 보기
  const fileInputRef = useRef(null);

  if (!selectedDate) return null;

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    // 5MB 제한
    if (file.size > 5 * 1024 * 1024) {
      alert("파일 크기는 5MB 이하만 가능해요.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);
  }

  function handleUpload() {
    if (!preview) return;
    setUploading(true);
    setTimeout(() => {
      onUpload({ base64: preview, nickname: nickname.trim(), caption: caption.trim() });
      setPreview(null);
      setNickname("");
      setCaption("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setUploading(false);
    }, 300);
  }

  function cancelPreview() {
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="photo-card">
      <div className="photo-header">
        <h3 className="photo-title">📸 인증샷 갤러리</h3>
        <span className="photo-count">{photos.length}장</span>
      </div>

      {/* 업로드 영역 */}
      {!preview ? (
        <label className="upload-zone" htmlFor="photo-input">
          <span className="upload-icon">📷</span>
          <span className="upload-text">인증샷 업로드</span>
          <span className="upload-sub">JPG, PNG · 최대 5MB</span>
          <input
            id="photo-input"
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </label>
      ) : (
        /* 미리보기 + 정보 입력 */
        <div className="preview-area">
          <div className="preview-img-wrap">
            <img src={preview} alt="미리보기" className="preview-img" />
            <button className="cancel-preview-btn" onClick={cancelPreview}>
              ✕
            </button>
          </div>
          <input
            type="text"
            placeholder="닉네임 (선택)"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="photo-input"
            maxLength={30}
          />
          <input
            type="text"
            placeholder="한마디 (선택) - 예) 오늘도 LG 승리!"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="photo-input"
            maxLength={50}
          />
          <button
            className="upload-btn"
            onClick={handleUpload}
            disabled={uploading}
          >
            {uploading ? "업로드 중..." : "🖼️ 등록하기"}
          </button>
        </div>
      )}

      {/* 인증샷 그리드 */}
      {photos.length === 0 ? (
        <div className="photo-empty">
          <p>아직 인증샷이 없어요 📭</p>
          <p className="photo-empty-sub">경기 후 인증샷을 올려주세요!</p>
        </div>
      ) : (
        <div className="photo-grid">
          {photos.map((photo) => (
            <div key={photo.id} className="photo-item">
              <img
                src={photo.base64}
                alt={photo.caption || "인증샷"}
                className="photo-thumb"
                onClick={() => setLightbox(photo)}
              />
              {photo.nickname && (
                <p className="photo-nick">{photo.nickname}</p>
              )}
              {photo.caption && (
                <p className="photo-caption">"{photo.caption}"</p>
              )}
              <div className="photo-bottom">
                <span className="photo-time">{formatTime(photo.createdAt)}</span>
                <button
                  className="photo-delete-btn"
                  onClick={() => setDeleteTarget(photo)}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">🗑️</div>
            <h4 className="modal-title">인증샷을 삭제할까요?</h4>
            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={() => setDeleteTarget(null)}>
                취소
              </button>
              <button
                className="modal-btn confirm"
                onClick={() => {
                  onDelete(deleteTarget.id);
                  setDeleteTarget(null);
                }}
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 라이트박스 */}
      {lightbox && (
        <div className="lightbox-overlay" onClick={() => setLightbox(null)}>
          <div className="lightbox">
            <img src={lightbox.base64} alt={lightbox.caption || "인증샷"} />
            {lightbox.nickname && <p className="lb-nick">{lightbox.nickname}</p>}
            {lightbox.caption && <p className="lb-caption">"{lightbox.caption}"</p>}
            <button className="lb-close" onClick={() => setLightbox(null)}>✕ 닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}

function formatTime(isoStr) {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}
