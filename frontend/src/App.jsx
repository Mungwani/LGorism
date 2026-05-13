import { useState, useEffect, useCallback } from "react";
import Calendar from "./components/Calendar";
import GameCard from "./components/GameCard";
import ApplicationForm from "./components/ApplicationForm";
import ApplicationList from "./components/ApplicationList";
import JikgwanPanel from "./components/JikgwanPanel";
import JungmoPanel from "./components/JungmoPanel";
import { getGameByDate, gameDateSet } from "./data/games";
import {
  getApplications,
  saveApplication,
  updateApplication,
  deleteApplication,
  getTotalCount,
  getApplicationSummary,
  getJikgwanList,
  addJikgwan,
  deleteJikgwan,
  getJikgwanSummary,
  getJungmoList,
  createJungmo,
  deleteJungmo,
  getJungmoSummary,
} from "./utils/storage";
import "./App.css";

const DANGWAN_PASSWORD = "admin60";

const FILTER_LABELS = {
  all:     "전체",
  games:   "⚾ 경기",
  jikgwan: "🏟 직관",
  jungmo:  "🎮 정모",
  dangwan: "📋 단관",
};

export default function App() {
  const [selectedDate, setSelectedDate] = useState(null);
  const [activeTab, setActiveTab] = useState("jikgwan"); // 'jikgwan' | 'jungmo'

  // 단관 — 날짜별 localStorage
  const [unlockedDates, setUnlockedDates] = useState(
    () => new Set(JSON.parse(localStorage.getItem("dangwan_unlocked_dates") || "[]"))
  );
  const isDangwanUnlocked = unlockedDates.has(selectedDate);
  const [dangwanSubTab, setDangwanSubTab] = useState("form");
  const [applications, setApplications] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [editingItem, setEditingItem] = useState(null);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState("");

  // 직관 / 정모
  const [jikgwanList, setJikgwanList] = useState([]);
  const [jungmoList, setJungmoList] = useState([]);

  // 달력 요약
  const [dangwanSummary, setDangwanSummary] = useState({});
  const [jikgwanSummary, setJikgwanSummary] = useState({});
  const [jungmoSummary, setJungmoSummary] = useState({});

  // 달력 필터
  const [filterMode, setFilterMode] = useState("all");

  // 단관 패널 열기/닫기
  const [showDangwan, setShowDangwan] = useState(false);

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // ── 날짜 선택 ────────────────────────────────────────────────

  function handleSelectDate(dateStr) {
    setSelectedDate(dateStr);
    setActiveTab("jikgwan");
    setShowDangwan(false);
    setPwInput("");
    setPwError("");
    setDangwanSubTab("form");
    setEditingItem(null);
  }

  useEffect(() => {
    if (!selectedDate) return;
    let cancelled = false;
    async function loadData() {
      setLoading(true);
      try {
        const [apps, jikgwan, jungmo] = await Promise.all([
          getApplications(selectedDate),
          getJikgwanList(selectedDate),
          getJungmoList(selectedDate),
        ]);
        if (!cancelled) {
          setApplications(apps);
          setTotalCount(getTotalCount(apps));
          setJikgwanList(jikgwan);
          setJungmoList(jungmo);
        }
      } catch {
        if (!cancelled) showToast("❌ 데이터를 불러오지 못했어요.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, [selectedDate]);

  const refreshSummary = useCallback(async () => {
    try {
      const [dangwan, jikgwan, jungmo] = await Promise.all([
        getApplicationSummary(),
        getJikgwanSummary(),
        getJungmoSummary(),
      ]);
      setDangwanSummary(dangwan);
      setJikgwanSummary(jikgwan);
      setJungmoSummary(jungmo);
    } catch (_) {}
  }, []);

  useEffect(() => { refreshSummary(); }, [refreshSummary]);

  // ── 단관 비밀번호 ─────────────────────────────────────────────

  function handleDangwanUnlock(e) {
    e.preventDefault();
    if (pwInput === DANGWAN_PASSWORD) {
      const next = new Set([...unlockedDates, selectedDate]);
      localStorage.setItem("dangwan_unlocked_dates", JSON.stringify([...next]));
      setUnlockedDates(next);
      setPwInput("");
      setPwError("");
      setDangwanSubTab("form");
    } else {
      setPwError("비밀번호가 틀렸어요.");
    }
  }

  // ── 단관 신청 핸들러 ─────────────────────────────────────────

  async function handleDangwanSubmit(formData) {
    try {
      if (editingItem) {
        await updateApplication(selectedDate, editingItem.id, formData);
        showToast("✅ 신청 내용을 수정했어요!");
        setEditingItem(null);
      } else {
        await saveApplication(selectedDate, formData);
        showToast("⚾ 단관 신청이 완료됐어요!");
      }
      const apps = await getApplications(selectedDate);
      setApplications(apps);
      setTotalCount(getTotalCount(apps));
      await refreshSummary();
      setDangwanSubTab("list");
    } catch {
      showToast("❌ 저장에 실패했어요. 다시 시도해주세요.");
    }
  }

  function handleEdit(item) {
    setEditingItem(item);
    setDangwanSubTab("form");
  }

  async function handleDelete(id) {
    try {
      await deleteApplication(selectedDate, id);
      const apps = await getApplications(selectedDate);
      setApplications(apps);
      setTotalCount(getTotalCount(apps));
      await refreshSummary();
      showToast("🗑️ 신청이 삭제됐어요.");
    } catch {
      showToast("❌ 삭제에 실패했어요. 다시 시도해주세요.");
    }
  }

  // ── 직관 핸들러 ──────────────────────────────────────────────

  async function handleJikgwanAdd(data) {
    try {
      await addJikgwan(selectedDate, data);
      const updated = await getJikgwanList(selectedDate);
      setJikgwanList(updated);
      await refreshSummary();
      showToast("🏟 직관 등록 완료! 오늘도 엘지 화이팅!");
    } catch (e) {
      const msg = e?.message || e?.details || JSON.stringify(e) || "알 수 없는 오류";
      showToast("❌ 직관 등록 실패: " + msg);
    }
  }

  async function handleJikgwanDelete(id) {
    try {
      await deleteJikgwan(id);
      const updated = await getJikgwanList(selectedDate);
      setJikgwanList(updated);
      await refreshSummary();
      showToast("🗑️ 직관 등록이 삭제됐어요.");
    } catch {
      showToast("❌ 삭제에 실패했어요.");
    }
  }

  // ── 정모 핸들러 ──────────────────────────────────────────────

  async function handleCreateJungmo(data) {
    try {
      await createJungmo(selectedDate, data);
      const updated = await getJungmoList(selectedDate);
      setJungmoList(updated);
      await refreshSummary();
      showToast("🎮 정모가 열렸어요!");
    } catch (e) {
      showToast("❌ 정모 생성 실패: " + (e?.message || "테이블이 없을 수 있어요"));
    }
  }

  async function handleDeleteJungmo(id) {
    try {
      await deleteJungmo(id);
      const updated = await getJungmoList(selectedDate);
      setJungmoList(updated);
      await refreshSummary();
      showToast("🗑️ 정모가 삭제됐어요.");
    } catch {
      showToast("❌ 삭제에 실패했어요.");
    }
  }

  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(null), 2800);
  }

  const selectedGame = selectedDate ? getGameByDate(selectedDate) : null;
  const isHomeGame = selectedDate ? gameDateSet.has(selectedDate) : false;

  return (
    <div className="app">
      {/* ── 헤더 ────────────────────────────────────────────── */}
      <header className="app-header">
        <div className="header-inner">
          <div className="header-logo">
            <span className="logo-lg">LG</span>
            <span className="logo-twins">TWINS</span>
          </div>
          <div className="header-text">
            <div className="header-brand-wrap">
              <span className="header-brand-ko">엘고리즘</span>
              <span className="header-brand-en">LGorism</span>
            </div>
            <p className="header-sub">단관 · 직관 · 정모 ⚾</p>
          </div>
        </div>
      </header>

      <main className="app-main">
        {/* ── 달력 + 필터 칩 ───────────────────────────────── */}
        <section className="section">
          <h2 className="section-heading">📅 경기 일정</h2>

          {/* 필터 칩 */}
          <div className="filter-chips">
            {Object.entries(FILTER_LABELS).map(([mode, label]) => (
              <button
                key={mode}
                className={`filter-chip ${filterMode === mode ? "active " + mode : ""}`}
                onClick={() => setFilterMode(mode)}
              >
                {label}
              </button>
            ))}
          </div>

          <Calendar
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
            dangwanSummary={dangwanSummary}
            jikgwanSummary={jikgwanSummary}
            jungmoSummary={jungmoSummary}
            filterMode={filterMode}
          />
        </section>

        {/* ── 경기 정보 카드 + 단관 열기 ──────────────────────── */}
        {selectedGame && (
          <section className="section game-info-section">
            <h2 className="section-heading">⚾ 경기 정보</h2>
            <GameCard game={selectedGame} date={selectedDate} />

            {/* 홈 경기에만 단관 버튼 표시 */}
            {isHomeGame && (
              <button
                className={`dangwan-open-btn ${showDangwan ? "open" : ""}`}
                onClick={() => setShowDangwan((v) => !v)}
              >
                📋 단관 신청 받기
                <span className="dangwan-chevron">{showDangwan ? "▲" : "▼"}</span>
              </button>
            )}
          </section>
        )}

        {/* ── 단관 신청 패널 (인라인) ──────────────────────────── */}
        {showDangwan && selectedDate && isHomeGame && (
          <section className="section dangwan-section">
            {!isDangwanUnlocked ? (
              <div className="dangwan-gate">
                <div className="gate-icon">🔐</div>
                <h3 className="gate-title">관리자 비밀번호</h3>
                <p className="gate-desc">이 날짜의 단관 신청을 열어요</p>
                <form className="gate-form" onSubmit={handleDangwanUnlock}>
                  <input
                    className={`gate-input ${pwError ? "error" : ""}`}
                    type="password"
                    placeholder="비밀번호 입력"
                    value={pwInput}
                    onChange={(e) => { setPwInput(e.target.value); setPwError(""); }}
                    autoFocus
                  />
                  {pwError && <p className="gate-error">{pwError}</p>}
                  <button type="submit" className="gate-btn">입장하기</button>
                </form>
              </div>
            ) : (
              <>
                <div className="sub-tab-nav">
                  <button
                    className={`sub-tab-btn ${dangwanSubTab === "form" ? "active" : ""}`}
                    onClick={() => setDangwanSubTab("form")}
                  >
                    📝 신청하기
                    {editingItem && <span className="tab-dot" />}
                  </button>
                  <button
                    className={`sub-tab-btn ${dangwanSubTab === "list" ? "active" : ""}`}
                    onClick={() => setDangwanSubTab("list")}
                  >
                    👥 신청 목록
                    {totalCount > 0 && <span className="tab-badge">{totalCount}</span>}
                  </button>
                </div>
                {dangwanSubTab === "form" && (
                  <ApplicationForm
                    selectedDate={selectedDate}
                    editingItem={editingItem}
                    onSubmit={handleDangwanSubmit}
                    onCancelEdit={() => { setEditingItem(null); setDangwanSubTab("list"); }}
                    isClosed={selectedGame?.isClosed || false}
                  />
                )}
                {dangwanSubTab === "list" && (
                  <ApplicationList
                    applications={applications}
                    totalCount={totalCount}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    selectedDate={selectedDate}
                  />
                )}
              </>
            )}
          </section>
        )}

        {/* ── 날짜 선택 후 — 직관·정모 탭만 ───────────────── */}
        {selectedDate && (
          <>
            <div className="tab-nav">
              <button
                className={`tab-btn ${activeTab === "jikgwan" ? "active" : ""} jikgwan-tab`}
                onClick={() => setActiveTab("jikgwan")}
              >
                🏟 직관
                {jikgwanList.length > 0 && (
                  <span className="tab-badge">{jikgwanList.length}</span>
                )}
              </button>
              <button
                className={`tab-btn ${activeTab === "jungmo" ? "active" : ""} jungmo-tab`}
                onClick={() => setActiveTab("jungmo")}
              >
                🎮 정모
                {jungmoList.length > 0 && (
                  <span className="tab-badge">{jungmoList.length}</span>
                )}
              </button>
            </div>

            <section className="section tab-content">
              {loading ? (
                <div className="loading-card">
                  <span className="loading-spinner" />
                  <p>불러오는 중...</p>
                </div>
              ) : (
                <>
                  {activeTab === "jikgwan" && (
                    <JikgwanPanel
                      selectedDate={selectedDate}
                      jikgwanList={jikgwanList}
                      onAdd={handleJikgwanAdd}
                      onDelete={handleJikgwanDelete}
                    />
                  )}
                  {activeTab === "jungmo" && (
                    <JungmoPanel
                      selectedDate={selectedDate}
                      jungmoList={jungmoList}
                      onCreateJungmo={handleCreateJungmo}
                      onDeleteJungmo={handleDeleteJungmo}
                    />
                  )}
                </>
              )}
            </section>
          </>
        )}

        {!selectedDate && (
          <div className="guide-card">
            <span className="guide-icon">☝️</span>
            <p className="guide-text">날짜를 눌러보세요!</p>
            <p className="guide-sub">경기 관람, 직관 인증, 정모까지 한 곳에서!</p>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>LG 트윈스 팬 모임 · 엘고리즘 · 오늘도 엘지 화이팅! 🔴⚾</p>
      </footer>


      {toast && (
        <div className="toast" role="status">{toast}</div>
      )}
    </div>
  );
}
