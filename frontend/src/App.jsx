import { useState, useEffect, useCallback } from "react";
import Calendar from "./components/Calendar";
import GameCard from "./components/GameCard";
import ApplicationForm from "./components/ApplicationForm";
import ApplicationList from "./components/ApplicationList";
import JikgwanPanel from "./components/JikgwanPanel";
import JungmoPanel from "./components/JungmoPanel";
import AllJungmoList from "./components/AllJungmoList";
import DangwanDateList from "./components/DangwanDateList";
import AdminPage from "./components/AdminPage";
import NoticeBanner from "./components/NoticeBanner";
import WinRate from "./components/WinRate";
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
  getAllJungmo,
  logAudit,
  updatePaymentStatus,
  getDangwanOpenDates,
  getAllDangwanDates,
} from "./utils/storage";
import "./App.css";

const FILTER_LABELS = {
  all:     "전체",
  jungmo:  "🎮 정모",
  dangwan: "📋 단관",
};

export default function App() {
  const [selectedDate, setSelectedDate] = useState(null);
  const [activeTab, setActiveTab] = useState("dangwan"); // 'dangwan' | 'jikgwan' | 'jungmo'

  const [dangwanSubTab, setDangwanSubTab] = useState("form");
  const [applications, setApplications] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [editingItem, setEditingItem] = useState(null);

  // 직관 / 정모
  const [jikgwanList, setJikgwanList] = useState([]);
  const [jungmoList, setJungmoList] = useState([]);

  // 달력 요약
  const [dangwanSummary, setDangwanSummary] = useState({});
  const [jikgwanSummary, setJikgwanSummary] = useState({});
  const [jungmoSummary, setJungmoSummary] = useState({});

  // 달력 필터
  const [filterMode, setFilterMode] = useState("all");

  // 정모 전체 리스트 (정모 필터 클릭 시)
  const [allJungmoList, setAllJungmoList] = useState([]);

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [dangwanOpenDates, setDangwanOpenDates] = useState(new Set());
  const [allDangwanDates, setAllDangwanDates] = useState(new Set());

  // 관리자 페이지
  const [showAdmin, setShowAdmin] = useState(false);
  const [logoTapCount, setLogoTapCount] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const date = params.get('date')
    const tab = params.get('tab')
    if (!date) return
    setSelectedDate(date)
    setFilterMode('all')
    setDangwanSubTab('list')
    if (tab === 'dangwan' || tab === 'jikgwan' || tab === 'jungmo') {
      setActiveTab(tab)
    } else {
      setActiveTab(gameDateSet.has(date) ? 'dangwan' : 'jikgwan')
    }
  }, [])

  function handleLogoTap() {
    setLogoTapCount(prev => {
      const next = prev + 1;
      if (next >= 5) {
        setShowAdmin(true);
        return 0;
      }
      return next;
    });
  }

  // ── 날짜 선택 ────────────────────────────────────────────────

  function handleSelectDate(dateStr) {
    setSelectedDate(dateStr);
    setActiveTab(gameDateSet.has(dateStr) ? "dangwan" : "jikgwan");
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

  useEffect(() => {
    getDangwanOpenDates().then(setDangwanOpenDates).catch(() => {});
    getAllDangwanDates()
      .then(rows => setAllDangwanDates(new Set(rows.map(r => r.game_date))))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (filterMode !== "jungmo") return;
    getAllJungmo().then(setAllJungmoList).catch(() => {});
  }, [filterMode]);

  function handleDangwanDateSelect(dateStr) {
    setSelectedDate(dateStr);
    setActiveTab("dangwan");
    setDangwanSubTab("form");
    setEditingItem(null);
    setFilterMode("all");
  }

  function handleJungmoDateSelect(dateStr) {
    setSelectedDate(dateStr);
    setActiveTab("jungmo");
    setFilterMode("all");
    setEditingItem(null);
  }

  // ── 단관 신청 핸들러 ─────────────────────────────────────────

  async function handleDangwanSubmit(formData) {
    try {
      if (editingItem) {
        await updateApplication(selectedDate, editingItem.id, formData);
        logAudit('update', 'dangwan', selectedDate, formData.name, `${formData.count}명`);
        showToast("✅ 신청 내용을 수정했어요!");
        setEditingItem(null);
      } else {
        await saveApplication(selectedDate, formData);
        logAudit('create', 'dangwan', selectedDate, formData.name, `${formData.count}명`);
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

  async function handlePay(id) {
    try {
      const target = applications.find(a => a.id === id);
      const newStatus = !target?.isPaid;
      await updatePaymentStatus(selectedDate, id, newStatus);
      logAudit('pay', 'dangwan', selectedDate, target?.name || '알 수 없음', newStatus ? '입금완료' : '입금취소');
      const apps = await getApplications(selectedDate);
      setApplications(apps);
      setTotalCount(getTotalCount(apps));
      showToast(newStatus ? "💳 입금 완료 처리됐어요!" : "↩️ 입금이 취소됐어요.");
    } catch {
      showToast("❌ 처리에 실패했어요.");
    }
  }

  async function handleDelete(id) {
    try {
      const target = applications.find(a => a.id === id);
      await deleteApplication(selectedDate, id);
      logAudit('delete', 'dangwan', selectedDate, target?.name || '알 수 없음', `${target?.count || 0}명`);
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
      logAudit('create', 'jikgwan', selectedDate, data.nickname, data.section || null);
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
      const target = jikgwanList.find(j => j.id === id);
      await deleteJikgwan(id);
      logAudit('delete', 'jikgwan', selectedDate, target?.nickname || '알 수 없음', null);
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
      logAudit('create', 'jungmo', selectedDate, data.title, null);
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
      const target = jungmoList.find(j => j.id === id);
      await deleteJungmo(id);
      logAudit('delete', 'jungmo', selectedDate, target?.title || '알 수 없음', null);
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
          <div className="header-logo" onClick={handleLogoTap} style={{ cursor: 'pointer', userSelect: 'none' }}>
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

      <NoticeBanner />

      <main className="app-main">
        {/* ── 승률 카드 ────────────────────────────────────── */}
        <section className="section" style={{ paddingTop: 0 }}>
          <WinRate dangwanDates={allDangwanDates} />
        </section>

        {/* ── 달력 + 필터 칩 ───────────────────────────────── */}
        <section className="section">
          <h2 className="section-heading">📅 경기 일정</h2>

          {/* 필터 칩 */}
          <div className="filter-chips">
            {Object.entries(FILTER_LABELS).map(([mode, label]) => (
              <button
                key={mode}
                className={`filter-chip ${filterMode === mode ? "active " + mode : ""}`}
                onClick={() => {
                  setFilterMode(mode);
                  if (mode !== "all") {
                    setSelectedDate(null);
                  }
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {filterMode === "all" && (
            <Calendar
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
              dangwanSummary={dangwanSummary}
              jikgwanSummary={jikgwanSummary}
              jungmoSummary={jungmoSummary}
              dangwanOpenDates={dangwanOpenDates}
            />
          )}

          {filterMode === "jungmo" && (
            <AllJungmoList jungmoList={allJungmoList} onSelectDate={handleJungmoDateSelect} />
          )}

          {filterMode === "dangwan" && (
            <DangwanDateList
              dangwanSummary={dangwanSummary}
              dangwanOpenDates={dangwanOpenDates}
              onSelectDate={handleDangwanDateSelect}
            />
          )}
        </section>

        {/* ── 경기 정보 카드 ───────────────────────────────────── */}
        {selectedGame && filterMode === "all" && (
          <section className="section game-info-section">
            <h2 className="section-heading">⚾ 경기 정보</h2>
            <GameCard game={selectedGame} date={selectedDate} />
          </section>
        )}

        {/* ── 단관·직관·정모 통합 탭 ──────────────────────────── */}
        {selectedDate && filterMode === "all" && (
          <>
            <div className="tab-nav">
              {isHomeGame && (
                <button
                  className={`tab-btn ${activeTab === "dangwan" ? "active" : ""} dangwan-tab`}
                  onClick={() => setActiveTab("dangwan")}
                >
                  📋 단관
                  {totalCount > 0 && <span className="tab-badge">{totalCount}</span>}
                </button>
              )}
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
                  {activeTab === "dangwan" && isHomeGame && (
                    <div className="dangwan-section">
                      {!dangwanOpenDates.has(selectedDate) && applications.length > 0 ? (
                        <>
                          <div className="dangwan-closed-banner">🔴 단관 마감</div>
                          <ApplicationList
                            applications={applications}
                            totalCount={totalCount}
                            selectedDate={selectedDate}
                            readOnly
                          />
                        </>
                      ) : !dangwanOpenDates.has(selectedDate) ? (
                        <div className="dangwan-closed-card">
                          <span className="dangwan-closed-icon">📋</span>
                          <p className="dangwan-closed-text">단관 일정이 없습니다</p>
                          <p className="dangwan-closed-sub">관리자가 단관을 열면 신청할 수 있어요</p>
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
                              onPay={handlePay}
                              selectedDate={selectedDate}
                            />
                          )}
                        </>
                      )}
                    </div>
                  )}
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
        <p>엘고리즘 · 무적엘지</p>
      </footer>


      {toast && (
        <div className="toast" role="status">{toast}</div>
      )}

      {showAdmin && (
        <AdminPage
          onClose={() => setShowAdmin(false)}
          onDangwanChange={(openDates, allDates) => {
            setDangwanOpenDates(openDates)
            if (allDates) setAllDangwanDates(new Set([...allDates].map(r => typeof r === 'string' ? r : r.game_date)))
            getAllDangwanDates().then(rows => setAllDangwanDates(new Set(rows.map(r => r.game_date)))).catch(() => {})
          }}
        />
      )}
    </div>
  );
}
