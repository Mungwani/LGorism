import { useState, useEffect, useCallback } from "react";
import Calendar from "./components/Calendar";
import GameCard from "./components/GameCard";
import ApplicationForm from "./components/ApplicationForm";
import ApplicationList from "./components/ApplicationList";
import { getGameByDate } from "./data/games";
import {
  getApplications,
  saveApplication,
  updateApplication,
  deleteApplication,
  getTotalCount,
  getApplicationSummary,
} from "./utils/storage";
import "./App.css";

export default function App() {
  const [selectedDate, setSelectedDate] = useState(null);
  const [applications, setApplications] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [editingItem, setEditingItem] = useState(null);
  const [summary, setSummary] = useState({});
  const [toast, setToast] = useState(null);
  const [showOnlyGames, setShowOnlyGames] = useState(false);
  const [activeTab, setActiveTab] = useState("form");
  const [loading, setLoading] = useState(false);

  // 날짜 선택 시 해당 날짜 신청 목록 불러오기
  useEffect(() => {
    if (!selectedDate) return;
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      try {
        const apps = await getApplications(selectedDate);
        if (!cancelled) {
          setApplications(apps);
          setTotalCount(getTotalCount(apps));
          setEditingItem(null);
          setActiveTab("form");
        }
      } catch (e) {
        if (!cancelled) showToast("❌ 데이터를 불러오지 못했어요.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, [selectedDate]);

  // 달력 뱃지 요약 (전체 날짜)
  const refreshSummary = useCallback(async () => {
    try {
      const s = await getApplicationSummary();
      setSummary(s);
    } catch (_) {}
  }, []);

  useEffect(() => {
    refreshSummary();
  }, [refreshSummary]);

  // ── 신청 핸들러 ──────────────────────────────────────────────

  async function handleSubmit(formData) {
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
      setActiveTab("list");
    } catch (e) {
      showToast("❌ 저장에 실패했어요. 다시 시도해주세요.");
    }
  }

  function handleEdit(item) {
    setEditingItem(item);
    setActiveTab("form");
    setTimeout(() => {
      document.querySelector(".form-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  async function handleDelete(id) {
    try {
      await deleteApplication(selectedDate, id);
      const apps = await getApplications(selectedDate);
      setApplications(apps);
      setTotalCount(getTotalCount(apps));
      await refreshSummary();
      showToast("🗑️ 신청이 삭제됐어요.");
    } catch (e) {
      showToast("❌ 삭제에 실패했어요. 다시 시도해주세요.");
    }
  }

  // ── 토스트 ───────────────────────────────────────────────────

  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(null), 2800);
  }

  const selectedGame = selectedDate ? getGameByDate(selectedDate) : null;

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
            <p className="header-sub">단관 신청 ⚾</p>
          </div>
        </div>
      </header>

      <main className="app-main">
        {/* ── 달력 ─────────────────────────────────────────── */}
        <section className="section">
          <div className="section-top">
            <h2 className="section-heading">📅 경기 일정</h2>
            <button
              className={`filter-btn ${showOnlyGames ? "active" : ""}`}
              onClick={() => setShowOnlyGames((v) => !v)}
            >
              {showOnlyGames ? "전체 보기" : "경기만 보기"}
            </button>
          </div>
          <Calendar
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            summary={summary}
            showOnlyGames={showOnlyGames}
          />
        </section>

        {/* ── 경기 정보 카드 ────────────────────────────────── */}
        <section className="section">
          <h2 className="section-heading">⚾ 경기 정보</h2>
          <GameCard game={selectedGame} date={selectedDate} />
        </section>

        {/* ── 날짜 선택 후 ──────────────────────────────────── */}
        {selectedDate && (
          <>
            <div className="tab-nav">
              <button
                className={`tab-btn ${activeTab === "form" ? "active" : ""}`}
                onClick={() => setActiveTab("form")}
              >
                📝 신청하기
                {editingItem && <span className="tab-dot" />}
              </button>
              <button
                className={`tab-btn ${activeTab === "list" ? "active" : ""}`}
                onClick={() => setActiveTab("list")}
              >
                👥 신청 목록
                {totalCount > 0 && (
                  <span className="tab-badge">{totalCount}</span>
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
                  {activeTab === "form" && (
                    <ApplicationForm
                      selectedDate={selectedDate}
                      editingItem={editingItem}
                      onSubmit={handleSubmit}
                      onCancelEdit={() => {
                        setEditingItem(null);
                        setActiveTab("list");
                      }}
                      isClosed={selectedGame?.isClosed || false}
                    />
                  )}
                  {activeTab === "list" && (
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
          </>
        )}

        {!selectedDate && (
          <div className="guide-card">
            <span className="guide-icon">☝️</span>
            <p className="guide-text">달력에서 경기 날짜를 눌러보세요!</p>
            <p className="guide-sub">빨간 점이 있는 날에 경기가 있어요</p>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>LG 트윈스 팬 단관 신청 · 오늘도 엘지 화이팅! 🔴⚾</p>
      </footer>

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
