import { useState, useEffect, useMemo, useRef } from "react";
import { getTransfers, createTransfer, logAudit } from "../utils/storage";
import { games } from "../data/games";
import { GA } from "../utils/analytics";
import TransferCard from "./TransferCard";
import "./TransferBoard.css";

const today = new Date().toISOString().slice(0, 10);
const upcomingGames = games.filter((g) => !g.isClosed && g.date >= today);
const PAGE_SIZE = 5;

export default function TransferBoard({ onToast }) {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("open"); // 'open' | 'sold'
  const [selectedGameDates, setSelectedGameDates] = useState(new Set());
  const [page, setPage] = useState(1);
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const dateDropdownRef = useRef(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [gameDate, setGameDate] = useState(upcomingGames[0]?.date || "");
  const [seatSection, setSeatSection] = useState("");
  const [seatRow, setSeatRow] = useState("");
  const [seatNumber, setSeatNumber] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  async function loadTransfers() {
    setLoading(true);
    try {
      const data = await getTransfers();
      setTransfers(data);
    } catch {
      onToast?.("❌ 양도글을 불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadTransfers(); }, []);

  const visibleTransfers = useMemo(() => {
    let list = transfers.filter((t) => {
      const isExpired = !t.isSold && t.gameDate < today;
      return statusFilter === "sold"
        ? (t.isSold || isExpired)
        : (!t.isSold && t.gameDate >= today);
    });
    if (statusFilter === "open" && selectedGameDates.size > 0) {
      list = list.filter((t) => selectedGameDates.has(t.gameDate));
    }
    return list.sort((a, b) => a.gameDate.localeCompare(b.gameDate));
  }, [transfers, statusFilter, selectedGameDates]);

  useEffect(() => { setPage(1); }, [statusFilter, selectedGameDates]);

  const totalPages = Math.max(1, Math.ceil(visibleTransfers.length / PAGE_SIZE));
  const pagedTransfers = visibleTransfers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleGameDate(date) {
    setSelectedGameDates((prev) => {
      const next = new Set(prev);
      next.has(date) ? next.delete(date) : next.add(date);
      return next;
    });
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(e.target)) {
        setDateDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    const nextErrors = {};
    if (!gameDate) nextErrors.gameDate = "경기를 선택해주세요";
    if (!seatSection.trim()) nextErrors.seatSection = "블록을 입력해주세요";
    if (!quantity || Number(quantity) < 1) nextErrors.quantity = "매수를 확인해주세요";
    if (!price || Number(price) < 1) nextErrors.price = "가격을 입력해주세요";
    if (!nickname.trim()) nextErrors.nickname = "닉네임을 입력해주세요";
    if (!password.trim()) nextErrors.password = "비밀번호를 설정해주세요";
    if (Object.keys(nextErrors).length > 0) { setErrors(nextErrors); return; }

    setSubmitting(true);
    try {
      await createTransfer({
        gameDate,
        seatSection: seatSection.trim(),
        seatRow: seatRow.trim(),
        seatNumber: seatNumber.trim(),
        quantity,
        price,
        note: note.trim(),
        nickname: nickname.trim(),
        password,
      });
      logAudit('create', 'transfer', gameDate, nickname.trim(), `${seatSection.trim()} ${quantity}매`);
      GA.transferPost(gameDate);
      setSeatSection(""); setSeatRow(""); setSeatNumber(""); setQuantity(1);
      setPrice(""); setNote(""); setNickname(""); setPassword(""); setErrors({});
      setShowCreateForm(false);
      await loadTransfers();
      onToast?.("🎫 양도글이 등록됐어요!");
    } catch {
      onToast?.("❌ 등록에 실패했어요. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="transfer-board">
      <div className="transfer-board-header">
        <h3 className="transfer-board-title">🎫 양도게시판</h3>
        <p className="transfer-board-sub">가지고 계신 티켓을 양도하거나, 필요한 자리를 예약해보세요!</p>
        <div className="transfer-rule-box">
          <p>⚠️ 웃돈 거래 절대 금지</p>
          <p>⚠️ 정가 이하만 양도 가능</p>
        </div>
      </div>

      <div className="transfer-board-filter">
        <button
          className={`transfer-filter-chip ${statusFilter === "open" ? "active" : ""}`}
          onClick={() => setStatusFilter("open")}
        >양도중</button>
        <button
          className={`transfer-filter-chip ${statusFilter === "sold" ? "active" : ""}`}
          onClick={() => setStatusFilter("sold")}
        >양도완료</button>
      </div>

      {statusFilter === "open" && upcomingGames.length > 0 && (
        <div className="transfer-date-dropdown" ref={dateDropdownRef}>
          <button
            type="button"
            className={`transfer-date-dropdown-trigger ${dateDropdownOpen ? "open" : ""}`}
            onClick={() => setDateDropdownOpen((v) => !v)}
          >
            <span>
              {selectedGameDates.size === 0
                ? "전체 경기"
                : `경기 ${selectedGameDates.size}개 선택됨`}
            </span>
            <span className="transfer-date-dropdown-arrow">{dateDropdownOpen ? "▲" : "▼"}</span>
          </button>

          {dateDropdownOpen && (
            <div className="transfer-date-dropdown-panel">
              <label className="transfer-date-option all">
                <input
                  type="checkbox"
                  checked={selectedGameDates.size === 0}
                  onChange={() => setSelectedGameDates(new Set())}
                />
                전체 경기
              </label>
              <div className="transfer-date-dropdown-divider" />
              {upcomingGames.map((g) => (
                <label key={g.date} className="transfer-date-option">
                  <input
                    type="checkbox"
                    checked={selectedGameDates.has(g.date)}
                    onChange={() => toggleGameDate(g.date)}
                  />
                  {g.date} · vs {g.opponent}
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="loading-card">
          <span className="loading-spinner" />
          <p>불러오는 중...</p>
        </div>
      ) : pagedTransfers.length > 0 ? (
        <>
          <div className="transfer-list">
            {pagedTransfers.map((t) => (
              <TransferCard key={t.id} transfer={t} onChanged={loadTransfers} onToast={onToast} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="transfer-pagination">
              <button
                className="transfer-page-btn"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >◀ 이전</button>
              <span className="transfer-page-indicator">{page} / {totalPages}</span>
              <button
                className="transfer-page-btn"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >다음 ▶</button>
            </div>
          )}
        </>
      ) : (
        <div className="jungmo-empty">
          <span>🎫</span>
          <p>{statusFilter === "sold" ? "양도완료된 글이 없어요" : "등록된 양도글이 없어요"}</p>
          <p className="empty-sub">
            {statusFilter === "sold" ? "거래가 끝나면 여기에 모여요" : "아래 버튼으로 양도글을 올려보세요!"}
          </p>
        </div>
      )}

      {!showCreateForm ? (
        <button className="create-jungmo-btn" onClick={() => setShowCreateForm(true)}>
          + 양도글 등록
        </button>
      ) : (
        <form className="create-jungmo-form" onSubmit={handleCreate}>
          <h4 className="create-form-title">양도글 등록</h4>

          <div className={`field ${errors.gameDate ? "error" : ""}`}>
            <label>경기 *</label>
            <select value={gameDate} onChange={(e) => { setGameDate(e.target.value); setErrors((p) => ({ ...p, gameDate: "" })); }}>
              {upcomingGames.map((g) => (
                <option key={g.date} value={g.date}>
                  {g.date} · vs {g.opponent} ({g.stadium})
                </option>
              ))}
            </select>
            {errors.gameDate && <span className="error-msg">{errors.gameDate}</span>}
          </div>

          <div className={`field ${errors.seatSection ? "error" : ""}`}>
            <label>블록 *</label>
            <input
              type="text"
              placeholder="예) 외야 익사이팅존"
              value={seatSection}
              onChange={(e) => { setSeatSection(e.target.value); setErrors((p) => ({ ...p, seatSection: "" })); }}
              maxLength={30}
            />
            {errors.seatSection && <span className="error-msg">{errors.seatSection}</span>}
          </div>

          <div className="transfer-form-row">
            <div className="field">
              <label>열 <span className="optional-tag">(선택)</span></label>
              <input type="text" placeholder="예) 3" value={seatRow} onChange={(e) => setSeatRow(e.target.value)} maxLength={10} />
            </div>
            <div className="field">
              <label>좌석번호 <span className="optional-tag">(선택)</span></label>
              <input type="text" placeholder="예) 12" value={seatNumber} onChange={(e) => setSeatNumber(e.target.value)} maxLength={10} />
            </div>
          </div>

          <div className="transfer-form-row">
            <div className={`field ${errors.quantity ? "error" : ""}`}>
              <label>매수 *</label>
              <input
                type="number"
                min={1}
                max={10}
                value={quantity}
                onChange={(e) => { setQuantity(e.target.value); setErrors((p) => ({ ...p, quantity: "" })); }}
              />
              {errors.quantity && <span className="error-msg">{errors.quantity}</span>}
            </div>
            <div className={`field ${errors.price ? "error" : ""}`}>
              <label>1매 가격 * (원)</label>
              <input
                type="number"
                min={1}
                placeholder="정가 이하로 입력해주세요"
                value={price}
                onChange={(e) => { setPrice(e.target.value); setErrors((p) => ({ ...p, price: "" })); }}
              />
              {errors.price && <span className="error-msg">{errors.price}</span>}
            </div>
          </div>

          {price > 0 && quantity > 0 && (
            <p className="transfer-total-preview">
              총 {quantity}매 · {(Number(price) * Number(quantity)).toLocaleString()}원
            </p>
          )}

          <div className="field">
            <label>설명 <span className="optional-tag">(선택)</span></label>
            <textarea
              placeholder="추가로 전달할 내용을 적어주세요"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              maxLength={200}
            />
          </div>

          <div className={`field ${errors.nickname ? "error" : ""}`}>
            <label>닉네임 *</label>
            <input
              type="text"
              placeholder="닉네임"
              value={nickname}
              onChange={(e) => { setNickname(e.target.value); setErrors((p) => ({ ...p, nickname: "" })); }}
              maxLength={30}
            />
            {errors.nickname && <span className="error-msg">{errors.nickname}</span>}
          </div>

          <div className={`field ${errors.password ? "error" : ""}`}>
            <label>비밀번호 *</label>
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
              {submitting ? "등록 중..." : "양도글 등록"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
