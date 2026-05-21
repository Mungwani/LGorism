import { useState } from "react";
import { shareContent, formatDateKo } from "../utils/kakao";
import "./ApplicationList.css";

export default function ApplicationList({
  applications,
  totalCount,
  onEdit,
  onDelete,
  onPay,
  selectedDate,
  readOnly = false,
}) {
  const [pwModal, setPwModal] = useState(null); // { type: 'edit'|'delete'|'pay', item }
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState('');

  if (!selectedDate) return null;

  function openPwModal(type, item) {
    setPwModal({ type, item });
    setPwInput('');
    setPwError('');
  }

  function closePwModal() {
    setPwModal(null);
    setPwInput('');
    setPwError('');
  }

  function handlePwConfirm() {
    if (pwInput !== pwModal.item.password && pwInput !== import.meta.env.VITE_ADMIN_PASSWORD) {
      setPwError('비밀번호가 틀렸어요.');
      return;
    }
    if (pwModal.type === 'edit') {
      onEdit(pwModal.item);
    } else if (pwModal.type === 'delete') {
      onDelete(pwModal.item.id);
    } else if (pwModal.type === 'pay') {
      onPay(pwModal.item.id);
    }
    closePwModal();
  }

  return (
    <div className="list-card">
      {/* 헤더 */}
      <div className="list-header">
        <h3 className="list-title">⚾ 신청 현황</h3>
        <div className="list-header-right">
          <div className="total-badge">
            총 <strong>{totalCount}</strong>명
          </div>
          <button
            className="share-btn"
            onClick={() => shareContent({
              title: `⚾ ${formatDateKo(selectedDate)} 단관 신청 모집 중!`,
              text: `현재 ${totalCount}명 신청했어요\n지금 바로 신청하러 오세요!`,
              url: `https://lgorism.vercel.app?date=${selectedDate}&tab=dangwan`,
            })}
          >
            카카오 공유
          </button>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="list-empty">
          <span>📋</span>
          <p>아직 신청자가 없어요</p>
          <p className="list-empty-sub">첫 번째로 신청해보세요!</p>
        </div>
      ) : (
        <div className="application-list">
          {applications.map((item, index) => (
            <div key={item.id} className={`application-item ${item.isPaid ? 'is-paid' : ''}`}>
              {/* 순번 + 이름 */}
              <div className="item-header">
                <div className="item-left">
                  <span className="item-number">{index + 1}</span>
                  <div>
                    <span className="item-name">{item.name}</span>
                    <span className="item-count">{item.count}명</span>
                  </div>
                </div>
                <div className="item-actions">
                  {readOnly ? (
                    item.isPaid && <span className="action-btn paid-badge">✓ 입금완료</span>
                  ) : (
                    <>
                      {item.isPaid ? (
                        <span className="action-btn paid-badge">✓ 입금완료</span>
                      ) : (
                        <button
                          className="action-btn pay"
                          onClick={() => openPwModal('pay', item)}
                          aria-label="입금완료"
                        >
                          💳 입금
                        </button>
                      )}
                      <button
                        className="action-btn edit"
                        onClick={() => openPwModal('edit', item)}
                        aria-label="수정"
                      >
                        수정
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => openPwModal('delete', item)}
                        aria-label="삭제"
                      >
                        삭제
                      </button>
                    </>
                  )}
                </div>
              </div>

              {item.request && (
                <p className="item-request">📌 {item.request}</p>
              )}

              <p className="item-time">
                {item.updatedAt
                  ? `${formatTime(item.updatedAt)} 수정됨`
                  : formatTime(item.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* 비밀번호 확인 모달 */}
      {pwModal && (
        <div className="modal-overlay" onClick={closePwModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">
              {pwModal.type === 'pay' ? '💳' : '🔒'}
            </div>
            <h4 className="modal-title">
              {pwModal.type === 'pay' ? '입금 확인' : '본인 확인'}
            </h4>
            <p className="modal-desc">
              <strong>{pwModal.item.name}</strong>님,
              {pwModal.type === 'pay'
                ? ' 신청 시 설정한 비밀번호로 입금완료 처리해요.'
                : ' 신청 시 설정한 비밀번호를 입력해주세요.'}
            </p>
            <input
              className="pw-input"
              type="password"
              placeholder="비밀번호 입력"
              value={pwInput}
              onChange={(e) => { setPwInput(e.target.value); setPwError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handlePwConfirm()}
              autoFocus
            />
            {pwError && <p className="pw-error">{pwError}</p>}
            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={closePwModal}>
                취소
              </button>
              <button
                className={`modal-btn confirm ${pwModal.type === 'delete' ? 'red' : pwModal.type === 'pay' ? 'green' : 'blue'}`}
                onClick={handlePwConfirm}
              >
                {pwModal.type === 'edit' ? '수정하기' : pwModal.type === 'pay' ? '입금완료' : '삭제하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatTime(isoStr) {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${m}/${day} ${h}:${min}`;
}
