import { useState } from "react";
import { FaUser, FaThumbtack, FaHandPaper, FaLock, FaHandshake } from "react-icons/fa";
import {
  getTransferReservations,
  addTransferReservation,
  deleteTransferReservation,
  toggleTransferSold,
  deleteTransfer,
  logAudit,
} from "../../utils/storage";
import { isTransferExpired } from "../../utils/transfer";
import { formatDateKo } from "../../utils/kakao";
import { getGameByDate } from "../../data/games";
import { GA } from "../../utils/analytics";
import "./TransferCard.css";

export default function TransferCard({ transfer, onChanged, onToast }) {
  const [expanded, setExpanded] = useState(false);
  const [reservations, setReservations] = useState([]);
  const [loadingReservations, setLoadingReservations] = useState(false);

  const [showReserveForm, setShowReserveForm] = useState(false);
  const [reserveNickname, setReserveNickname] = useState("");
  const [reservePassword, setReservePassword] = useState("");
  const [reserveError, setReserveError] = useState("");
  const [reserving, setReserving] = useState(false);

  const [cancelTarget, setCancelTarget] = useState(null); // { reservation }
  const [cancelPw, setCancelPw] = useState("");
  const [cancelPwError, setCancelPwError] = useState("");

  const [ownerModal, setOwnerModal] = useState(null); // 'sold' | 'delete'
  const [ownerStep, setOwnerStep] = useState("pw"); // 'buyer' | 'pw' — 'sold'로 표시할 때만 'buyer' 단계가 붙음
  const [soldToMode, setSoldToMode] = useState("reservation"); // 'reservation' | 'none'
  const [soldToReservationId, setSoldToReservationId] = useState("");
  const [ownerPw, setOwnerPw] = useState("");
  const [ownerPwError, setOwnerPwError] = useState("");

  const game = getGameByDate(transfer.gameDate);
  const unitPrice = Number(transfer.price) || 0;
  const totalPrice = unitPrice * (Number(transfer.quantity) || 1);
  const isExpired = isTransferExpired(transfer);

  async function loadReservations() {
    setLoadingReservations(true);
    try {
      const data = await getTransferReservations(transfer.id);
      setReservations(data);
    } finally {
      setLoadingReservations(false);
    }
  }

  function toggleExpand() {
    if (!expanded) loadReservations();
    setExpanded((v) => !v);
    setShowReserveForm(false);
  }

  async function handleReserve(e) {
    e.preventDefault();
    if (!reserveNickname.trim()) { setReserveError("닉네임을 입력해주세요"); return; }
    if (!reservePassword.trim()) { setReserveError("비밀번호를 입력해주세요"); return; }
    setReserving(true);
    try {
      await addTransferReservation(transfer.id, {
        nickname: reserveNickname.trim(),
        password: reservePassword.trim(),
      });
      logAudit('create', 'transfer', transfer.gameDate, reserveNickname.trim(), '예약');
      GA.transferReserve(transfer.gameDate);
      setReserveNickname(""); setReservePassword(""); setReserveError("");
      setShowReserveForm(false);
      await loadReservations();
      onToast?.("예약이 등록됐어요!");
    } catch {
      onToast?.("예약에 실패했어요.");
    } finally {
      setReserving(false);
    }
  }

  async function handleCancelReservation() {
    if (!cancelPw.trim()) { setCancelPwError("비밀번호를 입력해주세요."); return; }
    const ok = await deleteTransferReservation(cancelTarget.reservation.id, cancelPw);
    if (!ok) { setCancelPwError("비밀번호가 틀렸어요."); return; }
    logAudit('delete', 'transfer', transfer.gameDate, cancelTarget.reservation.nickname, '예약취소');
    setCancelTarget(null); setCancelPw(""); setCancelPwError("");
    await loadReservations();
    onToast?.("예약이 취소됐어요.");
  }

  function openOwnerModal(kind) {
    setOwnerModal(kind);
    setOwnerPw(""); setOwnerPwError("");
    if (kind === 'sold' && !transfer.isSold) {
      // 판매완료 처리 → 누구에게 팔았는지 먼저 선택
      setSoldToMode(reservations.length > 0 ? "reservation" : "none");
      setSoldToReservationId(reservations[0]?.id || "");
      setOwnerStep("buyer");
    } else {
      setOwnerStep("pw");
    }
  }

  function confirmBuyerStep() {
    setOwnerStep("pw");
  }

  async function handleOwnerConfirm() {
    if (!ownerPw.trim()) { setOwnerPwError("비밀번호를 입력해주세요."); return; }

    if (ownerModal === 'sold') {
      const nextSold = !transfer.isSold;
      let soldTo = "";
      if (nextSold && soldToMode === "reservation") {
        soldTo = reservations.find(r => r.id === soldToReservationId)?.nickname || "";
      }
      const ok = await toggleTransferSold(transfer.id, ownerPw, nextSold, soldTo);
      if (!ok) { setOwnerPwError("비밀번호가 틀렸어요."); return; }
      logAudit('update', 'transfer', transfer.gameDate, transfer.nickname, nextSold ? `양도완료${soldTo ? ' → ' + soldTo : ''}` : '양도중 전환');
      GA.transferSold(transfer.gameDate, nextSold);
      onToast?.(nextSold ? "양도완료 처리했어요!" : "양도중으로 되돌렸어요.");
    } else {
      const ok = await deleteTransfer(transfer.id, ownerPw);
      if (!ok) { setOwnerPwError("비밀번호가 틀렸어요."); return; }
      logAudit('delete', 'transfer', transfer.gameDate, transfer.nickname, `${transfer.quantity}매`);
      GA.transferDelete(transfer.gameDate);
      onToast?.("양도글이 삭제됐어요.");
    }
    setOwnerModal(null); setOwnerPw(""); setOwnerPwError("");
    onChanged();
  }

  return (
    <div className={`transfer-card ${expanded ? "expanded" : ""} ${transfer.isSold ? "sold" : ""} ${isExpired ? "expired" : ""}`}>
      <div className="transfer-card-header" onClick={toggleExpand}>
        <div className="transfer-card-left">
          <div className="transfer-card-game">
            {formatDateKo(transfer.gameDate)}
            {game && ` vs ${game.opponent}`}
            {transfer.isSold && (
              <span className="transfer-sold-badge">
                양도완료{transfer.soldTo ? ` · ${transfer.soldTo}님` : ''}
              </span>
            )}
            {isExpired && <span className="transfer-expired-badge">취소</span>}
          </div>
          <div className="transfer-card-seat">
            {transfer.seatSection}
            {transfer.seatRow && ` · ${transfer.seatRow}열`}
            {transfer.seatNumber && ` · ${transfer.seatNumber}번`}
            <span className="transfer-card-qty">{transfer.quantity}매</span>
          </div>
          <div className="transfer-card-author"><FaUser /> {transfer.nickname}</div>
        </div>
        <div className="transfer-card-right">
          <span className="transfer-card-price">{totalPrice.toLocaleString()}원</span>
          <span className="transfer-card-unit-price">{unitPrice.toLocaleString()}원 / 매</span>
          <span className="expand-chevron">{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {expanded && (
        <div className="transfer-card-body">
          {transfer.note && <p className="transfer-card-note"><FaThumbtack /> {transfer.note}</p>}

          {loadingReservations ? (
            <p className="loading-text">로딩 중...</p>
          ) : (
            <>
              {reservations.length > 0 ? (
                <div className="transfer-reservation-list">
                  {reservations.map((r, index) => (
                    <div key={r.id} className="transfer-reservation-item">
                      <div className="jungmo-item-left">
                        <span className="jungmo-item-num">{index + 1}</span>
                        <span className="jungmo-item-name">{r.nickname}</span>
                      </div>
                      <button
                        className="jungmo-action-btn delete"
                        onClick={() => { setCancelTarget({ reservation: r }); setCancelPw(""); setCancelPwError(""); }}
                      >취소</button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-apps-text">아직 예약자가 없어요</p>
              )}

              {isExpired ? (
                <p className="no-apps-text">경기가 지나 더 이상 예약할 수 없어요</p>
              ) : !showReserveForm ? (
                <button className="jungmo-apply-btn" onClick={() => setShowReserveForm(true)}>
                  <FaHandPaper /> 예약하기
                </button>
              ) : (
                <form className="jungmo-apply-form" onSubmit={handleReserve}>
                  <div className={`mini-field ${reserveError ? "error" : ""}`}>
                    <input
                      type="text"
                      placeholder="닉네임 *"
                      value={reserveNickname}
                      onChange={(e) => { setReserveNickname(e.target.value); setReserveError(""); }}
                      maxLength={30}
                      autoFocus
                    />
                    {reserveError && <span className="mini-error">{reserveError}</span>}
                  </div>
                  <div className="mini-field">
                    <input
                      type="password"
                      placeholder="비밀번호 * (취소 시 필요)"
                      value={reservePassword}
                      onChange={(e) => { setReservePassword(e.target.value); setReserveError(""); }}
                      maxLength={20}
                    />
                  </div>
                  <div className="apply-form-actions">
                    <button type="button" className="cancel-btn" onClick={() => { setShowReserveForm(false); setReserveError(""); }}>취소</button>
                    <button type="submit" className="confirm-btn" disabled={reserving}>
                      {reserving ? "예약 중..." : "예약하기"}
                    </button>
                  </div>
                </form>
              )}

              <div className="transfer-owner-actions">
                <button
                  className="jungmo-delete-btn"
                  onClick={() => openOwnerModal('sold')}
                >{transfer.isSold ? "양도중으로 되돌리기" : "양도완료 처리"}</button>
                <button
                  className="jungmo-delete-btn"
                  onClick={() => openOwnerModal('delete')}
                >양도글 삭제</button>
              </div>
            </>
          )}
        </div>
      )}

      {cancelTarget && (
        <div className="jungmo-modal-overlay" onClick={() => setCancelTarget(null)}>
          <div className="jungmo-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon"><FaLock /></div>
            <h4 className="modal-title">예약 취소</h4>
            <p className="modal-desc">
              <strong>{cancelTarget.reservation.nickname}</strong>님,<br />
              예약 시 설정한 비밀번호를 입력해주세요.
            </p>
            <input
              className="pw-input"
              type="password"
              placeholder="비밀번호 입력"
              value={cancelPw}
              onChange={(e) => { setCancelPw(e.target.value); setCancelPwError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleCancelReservation()}
              autoFocus
            />
            {cancelPwError && <p className="pw-error">{cancelPwError}</p>}
            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={() => setCancelTarget(null)}>취소</button>
              <button className="modal-btn confirm red" onClick={handleCancelReservation}>취소하기</button>
            </div>
          </div>
        </div>
      )}

      {ownerModal && ownerStep === 'buyer' && (
        <div className="jungmo-modal-overlay" onClick={() => setOwnerModal(null)}>
          <div className="jungmo-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon"><FaHandshake /></div>
            <h4 className="modal-title">누구에게 양도했나요?</h4>
            <div className="soldto-picker">
              {reservations.length > 0 && (
                <label className={`soldto-option ${soldToMode === 'reservation' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    checked={soldToMode === 'reservation'}
                    onChange={() => setSoldToMode('reservation')}
                  />
                  <select
                    value={soldToReservationId}
                    onChange={(e) => { setSoldToMode('reservation'); setSoldToReservationId(e.target.value); }}
                  >
                    {reservations.map((r) => (
                      <option key={r.id} value={r.id}>{r.nickname}</option>
                    ))}
                  </select>
                </label>
              )}
              <label className={`soldto-option ${soldToMode === 'none' ? 'active' : ''}`}>
                <input
                  type="radio"
                  checked={soldToMode === 'none'}
                  onChange={() => setSoldToMode('none')}
                />
                <span>표시 안 함</span>
              </label>
            </div>
            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={() => setOwnerModal(null)}>취소</button>
              <button className="modal-btn confirm blue" onClick={confirmBuyerStep}>다음</button>
            </div>
          </div>
        </div>
      )}

      {ownerModal && ownerStep === 'pw' && (
        <div className="jungmo-modal-overlay" onClick={() => setOwnerModal(null)}>
          <div className="jungmo-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon"><FaLock /></div>
            <h4 className="modal-title">{ownerModal === 'sold' ? '양도 상태 변경' : '양도글 삭제'}</h4>
            <p className="modal-desc">
              <strong>{transfer.nickname}</strong>님,<br />
              작성 시 설정한 비밀번호를 입력해주세요.
            </p>
            <input
              className="pw-input"
              type="password"
              placeholder="비밀번호 입력"
              value={ownerPw}
              onChange={(e) => { setOwnerPw(e.target.value); setOwnerPwError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleOwnerConfirm()}
              autoFocus
            />
            {ownerPwError && <p className="pw-error">{ownerPwError}</p>}
            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={() => setOwnerModal(null)}>취소</button>
              <button
                className={`modal-btn confirm ${ownerModal === 'delete' ? 'red' : 'blue'}`}
                onClick={handleOwnerConfirm}
              >확인</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
