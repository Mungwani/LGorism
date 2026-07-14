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
import HomeView from "./components/HomeView";
import BottomNav from "./components/BottomNav";
import TransferBoard from "./components/TransferBoard";
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
  updateJikgwan,
  deleteJikgwan,
  getJikgwanSummary,
  getJungmoList,
  createJungmo,
  updateJungmo,
  deleteJungmo,
  getJungmoSummary,
  getAllJungmo,
  getJungmoParticipantCounts,
  logAudit,
  updatePaymentStatus,
  getDangwanOpenDates,
  getAllDangwanDates,
} from "./utils/storage";
import { GA } from "./utils/analytics";
import "./App.css";

export default function App() {
  const [mainView, setMainView] = useState("home"); // 'home' | 'calendar' | 'dangwan' | 'jungmo' | 'transfer'
  const [selectedDate, setSelectedDate] = useState(null);
  const [activeTab, setActiveTab] = useState("dangwan"); // 'dangwan' | 'jikgwan' | 'jungmo' (캘린더 탭 전용)

  const [dangwanSubTab, setDangwanSubTab] = useState("form");
  const [applications, setApplications] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [editingItem, setEditingItem] = useState(null);

  // 직관 / 정모
  const [jikgwanList, setJikgwanList] = useState([]);
  const [jungmoList, setJungmoList] = useState([]);
  const [jungmoFocusId, setJungmoFocusId] = useState(null);

  // 달력 요약
  const [dangwanSummary, setDangwanSummary] = useState({});
  const [jikgwanSummary, setJikgwanSummary] = useState({});
  const [jungmoSummary, setJungmoSummary] = useState({});

  // 정모 전체 리스트 (정모 탭 목록)
  const [allJungmoList, setAllJungmoList] = useState([]);
  const [jungmoParticipantCounts, setJungmoParticipantCounts] = useState({});

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
    setDangwanSubTab('list')
    if (tab === 'dangwan' || tab === 'jikgwan' || tab === 'jungmo') {
      setMainView('calendar')
      setActiveTab(tab)
    } else {
      setMainView('calendar')
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

  // ── 하단 탭 전환 ─────────────────────────────────────────────

  function handleNavChange(view) {
    GA.mainViewSwitch(view);
    setMainView(view);
    setSelectedDate(null);
    setEditingItem(null);
    setJungmoFocusId(null);
  }

  // ── 날짜 선택 (캘린더 탭) ────────────────────────────────────

  function handleSelectDate(dateStr) {
    GA.dateSelect(dateStr);
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
    if (mainView !== "jungmo") return;
    Promise.all([getAllJungmo(), getJungmoParticipantCounts()])
      .then(([list, counts]) => {
        setAllJungmoList(list);
        setJungmoParticipantCounts(counts);
      })
      .catch(() => {});
  }, [mainView]);

  function handleDangwanDateSelect(dateStr) {
    setSelectedDate(dateStr);
    setActiveTab("dangwan");
    setDangwanSubTab("form");
    setEditingItem(null);
  }

  function handleJungmoSelect(jungmo) {
    setSelectedDate(jungmo.eventDate);
    setJungmoFocusId(jungmo.id);
    setActiveTab("jungmo");
    setEditingItem(null);
  }

  // ── 단관 신청 핸들러 ─────────────────────────────────────────

  async function handleDangwanSubmit(formData) {
    try {
      if (editingItem) {
        await updateApplication(selectedDate, editingItem.id, formData);
        logAudit('update', 'dangwan', selectedDate, formData.name, `${formData.count}명`);
        GA.dangwanEdit(selectedDate);
        showToast("✅ 신청 내용을 수정했어요!");
        setEditingItem(null);
      } else {
        await saveApplication(selectedDate, formData);
        logAudit('create', 'dangwan', selectedDate, formData.name, `${formData.count}명`);
        GA.dangwanApply(selectedDate, formData.count);
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
      GA.dangwanPay(selectedDate, newStatus);
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
      GA.dangwanDelete(selectedDate);
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
      GA.jikgwanRegister(selectedDate);
      const updated = await getJikgwanList(selectedDate);
      setJikgwanList(updated);
      await refreshSummary();
      showToast("🏟 직관 등록 완료! 오늘도 엘지 화이팅!");
    } catch (e) {
      const msg = e?.message || e?.details || JSON.stringify(e) || "알 수 없는 오류";
      showToast("❌ 직관 등록 실패: " + msg);
    }
  }

  async function handleJikgwanUpdate(id, fields) {
    try {
      await updateJikgwan(id, fields);
      const updated = await getJikgwanList(selectedDate);
      setJikgwanList(updated);
      showToast("✅ 수정됐어요!");
    } catch {
      showToast("❌ 수정에 실패했어요.");
    }
  }

  async function handleJikgwanDelete(id) {
    try {
      const target = jikgwanList.find(j => j.id === id);
      await deleteJikgwan(id);
      logAudit('delete', 'jikgwan', selectedDate, target?.nickname || '알 수 없음', null);
      GA.jikgwanDelete(selectedDate);
      const updated = await getJikgwanList(selectedDate);
      setJikgwanList(updated);
      await refreshSummary();
      showToast("🗑️ 직관 등록이 삭제됐어요.");
    } catch {
      showToast("❌ 삭제에 실패했어요.");
    }
  }

  // ── 정모 핸들러 ──────────────────────────────────────────────

  async function handleCreateJungmo(eventDate, data) {
    try {
      await createJungmo(eventDate, data);
      logAudit('create', 'jungmo', eventDate, data.title, null);
      GA.jungmoCreate(eventDate);
      if (selectedDate === eventDate) {
        const updated = await getJungmoList(eventDate);
        setJungmoList(updated);
      }
      const [list, counts] = await Promise.all([getAllJungmo(), getJungmoParticipantCounts()]);
      setAllJungmoList(list);
      setJungmoParticipantCounts(counts);
      await refreshSummary();
      showToast("🎮 정모가 열렸어요!");
    } catch (e) {
      showToast("❌ 정모 생성 실패: " + (e?.message || "테이블이 없을 수 있어요"));
    }
  }

  async function handleUpdateJungmo(id, data) {
    try {
      await updateJungmo(id, data);
      logAudit('update', 'jungmo', selectedDate, data.title, null);
      if (selectedDate) {
        const updated = await getJungmoList(selectedDate);
        setJungmoList(updated);
      }
      const list = await getAllJungmo();
      setAllJungmoList(list);
      showToast("✅ 정모 내용을 수정했어요!");
    } catch {
      showToast("❌ 수정에 실패했어요.");
    }
  }

  async function handleDeleteJungmo(id) {
    try {
      const target = jungmoList.find(j => j.id === id) || allJungmoList.find(j => j.id === id);
      await deleteJungmo(id);
      logAudit('delete', 'jungmo', selectedDate, target?.title || '알 수 없음', null);
      GA.jungmoDelete(selectedDate);
      if (selectedDate) {
        const updated = await getJungmoList(selectedDate);
        setJungmoList(updated);
      }
      const [list, counts] = await Promise.all([getAllJungmo(), getJungmoParticipantCounts()]);
      setAllJungmoList(list);
      setJungmoParticipantCounts(counts);
      await refreshSummary();
      if (jungmoFocusId === id) {
        setJungmoFocusId(null);
        setSelectedDate(null);
      }
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
            <span className="header-brand-ko">엘고리즘</span>
            <span className="header-brand-en">LGORISM</span>
          </div>
        </div>
      </header>

      <main className="app-main">
        {/* ── 홈 ───────────────────────────────────────────── */}
        {mainView === "home" && (
          <HomeView allDangwanDates={allDangwanDates} onNavigate={handleNavChange} />
        )}

        {/* ── 캘린더 ───────────────────────────────────────── */}
        {mainView === "calendar" && (
          <>
            <section className="section" style={{ paddingTop: 0 }}>
              <h2 className="section-heading">📅 경기 일정</h2>
              <Calendar
                selectedDate={selectedDate}
                onSelectDate={handleSelectDate}
                dangwanSummary={dangwanSummary}
                jikgwanSummary={jikgwanSummary}
                jungmoSummary={jungmoSummary}
                dangwanOpenDates={dangwanOpenDates}
              />
            </section>

            {selectedGame && (
              <section className="section game-info-section">
                <h2 className="section-heading">⚾ 경기 정보</h2>
                <GameCard game={selectedGame} date={selectedDate} />
              </section>
            )}

            {selectedDate && (
              <>
                <div className="tab-nav">
                  {isHomeGame && (
                    <button
                      className={`tab-btn ${activeTab === "dangwan" ? "active" : ""} dangwan-tab`}
                      onClick={() => { GA.tabSwitch("dangwan"); setActiveTab("dangwan"); }}
                    >
                      📋 단관
                      {totalCount > 0 && <span className="tab-badge">{totalCount}</span>}
                    </button>
                  )}
                  <button
                    className={`tab-btn ${activeTab === "jikgwan" ? "active" : ""} jikgwan-tab`}
                    onClick={() => { GA.tabSwitch("jikgwan"); setActiveTab("jikgwan"); }}
                  >
                    🏟 직관
                    {jikgwanList.length > 0 && (
                      <span className="tab-badge">{jikgwanList.length}</span>
                    )}
                  </button>
                  <button
                    className={`tab-btn ${activeTab === "jungmo" ? "active" : ""} jungmo-tab`}
                    onClick={() => { GA.tabSwitch("jungmo"); setActiveTab("jungmo"); }}
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
                        <DangwanApplyBlock
                          selectedDate={selectedDate}
                          dangwanOpenDates={dangwanOpenDates}
                          applications={applications}
                          totalCount={totalCount}
                          dangwanSubTab={dangwanSubTab}
                          setDangwanSubTab={setDangwanSubTab}
                          editingItem={editingItem}
                          setEditingItem={setEditingItem}
                          onSubmit={handleDangwanSubmit}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onPay={handlePay}
                        />
                      )}
                      {activeTab === "jikgwan" && (
                        <JikgwanPanel
                          selectedDate={selectedDate}
                          jikgwanList={jikgwanList}
                          onAdd={handleJikgwanAdd}
                          onUpdate={handleJikgwanUpdate}
                          onDelete={handleJikgwanDelete}
                        />
                      )}
                      {activeTab === "jungmo" && (
                        <JungmoPanel
                          selectedDate={selectedDate}
                          jungmoList={jungmoList}
                          onCreateJungmo={handleCreateJungmo}
                          onDeleteJungmo={handleDeleteJungmo}
                          onUpdateJungmo={handleUpdateJungmo}
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
          </>
        )}

        {/* ── 단관 (목록 → 신청) ──────────────────────────────── */}
        {mainView === "dangwan" && (
          <section className="section" style={{ paddingTop: 0 }}>
            {!selectedDate ? (
              <DangwanDateList
                dangwanSummary={dangwanSummary}
                dangwanOpenDates={dangwanOpenDates}
                onSelectDate={handleDangwanDateSelect}
              />
            ) : (
              <>
                <button className="back-to-list-btn" onClick={() => setSelectedDate(null)}>← 목록으로</button>
                {selectedGame && (
                  <div style={{ marginTop: 12, marginBottom: 14 }}>
                    <GameCard game={selectedGame} date={selectedDate} />
                  </div>
                )}
                {loading ? (
                  <div className="loading-card">
                    <span className="loading-spinner" />
                    <p>불러오는 중...</p>
                  </div>
                ) : (
                  <DangwanApplyBlock
                    selectedDate={selectedDate}
                    dangwanOpenDates={dangwanOpenDates}
                    applications={applications}
                    totalCount={totalCount}
                    dangwanSubTab={dangwanSubTab}
                    setDangwanSubTab={setDangwanSubTab}
                    editingItem={editingItem}
                    setEditingItem={setEditingItem}
                    onSubmit={handleDangwanSubmit}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onPay={handlePay}
                  />
                )}
              </>
            )}
          </section>
        )}

        {/* ── 정모 (목록 → 상세) ──────────────────────────────── */}
        {mainView === "jungmo" && (
          <section className="section" style={{ paddingTop: 0 }}>
            {!selectedDate ? (
              <AllJungmoList
                jungmoList={allJungmoList}
                participantCounts={jungmoParticipantCounts}
                onSelectJungmo={handleJungmoSelect}
                onCreateJungmo={handleCreateJungmo}
              />
            ) : (
              <>
                <button
                  className="back-to-list-btn"
                  onClick={() => { setSelectedDate(null); setJungmoFocusId(null); }}
                >← 목록으로</button>
                <div style={{ marginTop: 12 }}>
                  <JungmoPanel
                    selectedDate={selectedDate}
                    jungmoList={jungmoList}
                    focusId={jungmoFocusId}
                    onCreateJungmo={handleCreateJungmo}
                    onDeleteJungmo={handleDeleteJungmo}
                    onUpdateJungmo={handleUpdateJungmo}
                  />
                </div>
              </>
            )}
          </section>
        )}

        {/* ── 양도 ─────────────────────────────────────────── */}
        {mainView === "transfer" && (
          <section className="section">
            <TransferBoard onToast={showToast} />
          </section>
        )}
      </main>

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

      <BottomNav active={mainView} onChange={handleNavChange} />
    </div>
  );
}

// ── 단관 신청 블록 (캘린더 탭 / 단관 탭 공용) ─────────────────────
function DangwanApplyBlock({
  selectedDate,
  dangwanOpenDates,
  applications,
  totalCount,
  dangwanSubTab,
  setDangwanSubTab,
  editingItem,
  setEditingItem,
  onSubmit,
  onEdit,
  onDelete,
  onPay,
}) {
  const selectedGame = getGameByDate(selectedDate);
  return (
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
              onSubmit={onSubmit}
              onCancelEdit={() => { setEditingItem(null); setDangwanSubTab("list"); }}
              isClosed={selectedGame?.isClosed || false}
            />
          )}
          {dangwanSubTab === "list" && (
            <ApplicationList
              applications={applications}
              totalCount={totalCount}
              onEdit={onEdit}
              onDelete={onDelete}
              onPay={onPay}
              selectedDate={selectedDate}
            />
          )}
        </>
      )}
    </div>
  );
}
