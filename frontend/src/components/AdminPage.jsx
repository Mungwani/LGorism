import { useState, useEffect } from 'react'
import { getAuditLogs, getAllApplications, updatePaymentStatus, logAudit, getDangwanOpenDates, openDangwanDate, closeDangwanDate, getAllNotices, createNotice, updateNotice, toggleNoticeActive, deleteNotice, getGameResults, setGameResult, deleteGameResult } from '../utils/storage'
import { games } from '../data/games'

const today = new Date().toISOString().slice(0, 10)
const homeGames = games.filter(g => g.isHome && g.date >= today).map(g => g.date)
const allHomeGames = games.filter(g => g.isHome).map(g => g.date).sort().reverse()
import './AdminPage.css'

const ADMIN_PW = import.meta.env.VITE_ADMIN_PASSWORD

const CATEGORY_LABELS = {
  dangwan: '단관',
  jikgwan: '직관',
  jungmo: '정모',
}

const ACTION_LABELS = {
  create: '등록',
  update: '수정',
  delete: '삭제',
  pay:    '입금',
}

export default function AdminPage({ onClose, onDangwanChange }) {
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState('')
  const [pwError, setPwError] = useState('')
  const [tab, setTab] = useState('log')

  const [logs, setLogs] = useState([])
  const [logFilter, setLogFilter] = useState('all')
  const [logLoading, setLogLoading] = useState(false)

  const [apps, setApps] = useState([])
  const [payLoading, setPayLoading] = useState(false)

  // 공지 관리
  const [notices, setNotices] = useState([])
  const [noticeInput, setNoticeInput] = useState('')
  const [noticeLoading, setNoticeLoading] = useState(false)
  const [noticeSaving, setNoticeSaving] = useState(false)
  const [editingNoticeId, setEditingNoticeId] = useState(null)
  const [editNoticeContent, setEditNoticeContent] = useState('')
  const [deleteNoticeTarget, setDeleteNoticeTarget] = useState(null)

  // 경기 결과
  const [gameResults, setGameResults] = useState({})
  const [resultsLoading, setResultsLoading] = useState(false)

  // 단관 관리
  const [dangwanOpen, setDangwanOpen] = useState(new Set())
  const [dangwanLoading, setDangwanLoading] = useState(false)
  const [dangwanConfirm, setDangwanConfirm] = useState(null) // { date, willOpen }
  const [dangwanDateInput, setDangwanDateInput] = useState('')

  // 날짜별 접기/펼치기 (기본: 전부 펼침)
  const [collapsedDates, setCollapsedDates] = useState(new Set())

  // 입금 변경 확인 모달
  const [confirmTarget, setConfirmTarget] = useState(null) // { item, gameDate }

  function handleLogin(e) {
    e.preventDefault()
    if (pw === ADMIN_PW) {
      setAuthed(true)
    } else {
      setPwError('비밀번호가 틀렸어요.')
    }
  }

  async function loadLogs() {
    setLogLoading(true)
    try {
      const data = await getAuditLogs(300)
      setLogs(data)
    } finally {
      setLogLoading(false)
    }
  }

  async function loadApps() {
    setPayLoading(true)
    try {
      const data = await getAllApplications()
      setApps(data)
    } finally {
      setPayLoading(false)
    }
  }

  async function loadDangwan() {
    setDangwanLoading(true)
    try {
      const dates = await getDangwanOpenDates()
      setDangwanOpen(dates)
    } finally {
      setDangwanLoading(false)
    }
  }

  async function loadNotices() {
    setNoticeLoading(true)
    try {
      const data = await getAllNotices()
      setNotices(data)
    } finally {
      setNoticeLoading(false)
    }
  }

  async function handleCreateNotice(e) {
    e.preventDefault()
    if (!noticeInput.trim()) return
    setNoticeSaving(true)
    try {
      await createNotice(noticeInput.trim())
      setNoticeInput('')
      await loadNotices()
    } finally {
      setNoticeSaving(false)
    }
  }

  async function handleEditNoticeSubmit(e, id) {
    e.preventDefault()
    if (!editNoticeContent.trim()) return
    await updateNotice(id, editNoticeContent.trim())
    setNotices(prev => prev.map(n => n.id === id ? { ...n, content: editNoticeContent.trim() } : n))
    setEditingNoticeId(null)
  }

  async function handleToggleNotice(id, isActive) {
    await toggleNoticeActive(id, isActive)
    setNotices(prev => prev.map(n => n.id === id ? { ...n, isActive } : n))
  }

  async function confirmDeleteNotice() {
    await deleteNotice(deleteNoticeTarget)
    setNotices(prev => prev.filter(n => n.id !== deleteNoticeTarget))
    setDeleteNoticeTarget(null)
  }

  useEffect(() => {
    if (!authed) return
    if (tab === 'log') loadLogs()
    if (tab === 'pay') loadApps()
    if (tab === 'dangwan') loadDangwan()
    if (tab === 'notice') loadNotices()
    if (tab === 'result') { loadResults(); loadDangwan() }
  }, [tab, authed])

  async function loadResults() {
    setResultsLoading(true)
    try {
      const data = await getGameResults()
      setGameResults(Object.fromEntries(data.map(r => [r.game_date, r.result])))
    } finally {
      setResultsLoading(false)
    }
  }

  async function handleSetResult(date, result) {
    const current = gameResults[date]
    if (current === result) {
      await deleteGameResult(date)
      setGameResults(prev => { const n = { ...prev }; delete n[date]; return n })
    } else {
      await setGameResult(date, result)
      setGameResults(prev => ({ ...prev, [date]: result }))
    }
  }

  async function confirmDangwanToggle() {
    const { date, willOpen } = dangwanConfirm
    setDangwanConfirm(null)
    if (willOpen) {
      await openDangwanDate(date)
    } else {
      await closeDangwanDate(date)
    }
    const updated = await getDangwanOpenDates()
    setDangwanOpen(updated)
    if (onDangwanChange) onDangwanChange(updated)
  }

  function toggleDateCollapse(date) {
    setCollapsedDates(prev => {
      const next = new Set(prev)
      next.has(date) ? next.delete(date) : next.add(date)
      return next
    })
  }

  function handlePayClick(item, gameDate) {
    setConfirmTarget({ item, gameDate })
  }

  async function confirmTogglePay() {
    const { item, gameDate } = confirmTarget
    const newStatus = !item.isPaid
    setConfirmTarget(null)
    await updatePaymentStatus(gameDate, item.id, newStatus)
    logAudit('pay', 'dangwan', gameDate, item.name, newStatus ? '입금완료' : '입금취소')
    setApps(prev => prev.map(a => a.id === item.id ? { ...a, isPaid: newStatus } : a))
  }

  const appsByDate = apps.reduce((acc, app) => {
    const key = app.gameDate
    if (!acc[key]) acc[key] = []
    acc[key].push(app)
    return acc
  }, {})

  const filteredLogs = logFilter === 'all'
    ? logs
    : logFilter === 'pay'
      ? logs.filter(l => l.action === 'pay')
      : logs.filter(l => l.category === logFilter)

  if (!authed) {
    return (
      <div className="admin-overlay">
        <div className="admin-login-card">
          <button className="admin-x-btn" onClick={onClose}>✕</button>
          <div className="admin-login-icon">🛡</div>
          <h2 className="admin-login-title">관리자 페이지</h2>
          <p className="admin-login-sub">관리자 비밀번호를 입력해주세요</p>
          <form className="admin-login-form" onSubmit={handleLogin}>
            <input
              className={`admin-pw-input ${pwError ? 'error' : ''}`}
              type="password"
              placeholder="비밀번호 입력"
              value={pw}
              onChange={e => { setPw(e.target.value); setPwError('') }}
              autoFocus
            />
            {pwError && <p className="admin-pw-error">{pwError}</p>}
            <button type="submit" className="admin-login-btn">입장</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-overlay">
      <div className="admin-page">
        <div className="admin-header">
          <h2 className="admin-title">🛡 관리자</h2>
          <button className="admin-x-btn" onClick={onClose}>✕</button>
        </div>

        <div className="admin-tab-nav">
          <button className={`admin-tab-btn ${tab === 'log' ? 'active' : ''}`} onClick={() => setTab('log')}>
            📋 로그
          </button>
          <button className={`admin-tab-btn ${tab === 'pay' ? 'active' : ''}`} onClick={() => setTab('pay')}>
            💳 입금
          </button>
          <button className={`admin-tab-btn ${tab === 'dangwan' ? 'active' : ''}`} onClick={() => setTab('dangwan')}>
            🎟 단관
          </button>
          <button className={`admin-tab-btn ${tab === 'notice' ? 'active' : ''}`} onClick={() => setTab('notice')}>
            📢 공지
          </button>
          <button className={`admin-tab-btn ${tab === 'result' ? 'active' : ''}`} onClick={() => setTab('result')}>
            🏆 결과
          </button>
        </div>

        {tab === 'log' && (
          <div className="admin-body">
            <div className="log-filter-bar">
              {['all', 'dangwan', 'jikgwan', 'jungmo', 'pay'].map(f => (
                <button
                  key={f}
                  className={`log-filter-chip ${logFilter === f ? 'active ' + f : ''}`}
                  onClick={() => setLogFilter(f)}
                >
                  {f === 'all' ? '전체' : f === 'pay' ? '💳 입금' : CATEGORY_LABELS[f]}
                </button>
              ))}
              <button className="log-refresh-btn" onClick={loadLogs} title="새로고침">↻</button>
            </div>

            {logLoading ? (
              <div className="admin-state">불러오는 중...</div>
            ) : filteredLogs.length === 0 ? (
              <div className="admin-state">로그가 없어요</div>
            ) : (
              <div className="log-list">
                {filteredLogs.map(log => (
                  <div key={log.id} className={`log-item action-${log.action}`}>
                    <div className="log-row-top">
                      <span className={`log-cat cat-${log.category}`}>
                        {CATEGORY_LABELS[log.category] || log.category}
                      </span>
                      <span className={`log-action act-${log.action}`}>
                        {ACTION_LABELS[log.action] || log.action}
                      </span>
                      <span className="log-time">{formatLogTime(log.created_at)}</span>
                    </div>
                    <div className="log-row-bottom">
                      <span className="log-actor">{log.actor_name}</span>
                      {log.game_date && <span className="log-game-date">{log.game_date}</span>}
                      {log.details && <span className="log-details">{log.details}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'pay' && (
          <div className="admin-body">
            <div className="pay-header-bar">
              <span className="pay-header-hint">항목을 눌러 입금 여부를 변경해요</span>
              <button className="log-refresh-btn" onClick={loadApps}>↻</button>
            </div>

            {payLoading ? (
              <div className="admin-state">불러오는 중...</div>
            ) : Object.keys(appsByDate).length === 0 ? (
              <div className="admin-state">신청 내역이 없어요</div>
            ) : (
              Object.entries(appsByDate)
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([date, items]) => {
                  const totalPeople = items.reduce((s, i) => s + (i.count || 0), 0)
                  const paidCount = items.filter(i => i.isPaid).reduce((s, i) => s + (i.count || 0), 0)
                  const isCollapsed = collapsedDates.has(date)
                  return (
                    <div key={date} className="pay-date-group">
                      <button
                        className="pay-date-header"
                        onClick={() => toggleDateCollapse(date)}
                      >
                        <div className="pay-date-left">
                          <span className="pay-date-chevron">{isCollapsed ? '▶' : '▼'}</span>
                          <span className="pay-date">{date}</span>
                        </div>
                        <span className={`pay-date-stat ${paidCount === totalPeople ? 'all-paid' : ''}`}>
                          {paidCount}/{totalPeople}명 입금
                        </span>
                      </button>

                      {!isCollapsed && items.map(item => (
                        <div
                          key={item.id}
                          className={`pay-item ${item.isPaid ? 'paid' : ''}`}
                          onClick={() => handlePayClick(item, date)}
                        >
                          <div className="pay-item-info">
                            <span className="pay-item-name">{item.name}</span>
                            <span className="pay-item-count">{item.count}명</span>
                            {item.request && (
                              <span className="pay-item-req">{item.request}</span>
                            )}
                          </div>
                          <span className={`pay-badge ${item.isPaid ? 'paid' : 'unpaid'}`}>
                            {item.isPaid ? '✓ 입금완료' : '미입금'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                })
            )}
          </div>
        )}

        {tab === 'dangwan' && (
          <div className="admin-body">
            <div className="dangwan-input-row">
              <input
                type="date"
                className="dangwan-date-input"
                value={dangwanDateInput}
                onChange={e => setDangwanDateInput(e.target.value)}
              />
              {dangwanDateInput && (
                <button
                  className={`dangwan-toggle-btn ${dangwanOpen.has(dangwanDateInput) ? 'close' : 'open'}`}
                  onClick={() => setDangwanConfirm({ date: dangwanDateInput, willOpen: !dangwanOpen.has(dangwanDateInput) })}
                >
                  {dangwanOpen.has(dangwanDateInput) ? '🔴 닫기' : '🟢 열기'}
                </button>
              )}
            </div>

            {dangwanLoading ? (
              <div className="admin-state">불러오는 중...</div>
            ) : dangwanOpen.size === 0 ? (
              <div className="admin-state">현재 열린 단관 날짜가 없어요</div>
            ) : (
              <>
                <p className="pay-header-hint" style={{ marginBottom: 6 }}>현재 열린 날짜</p>
                <div className="dangwan-manage-list">
                  {[...dangwanOpen].sort().map(date => (
                    <div
                      key={date}
                      className="dangwan-manage-item open"
                      onClick={() => setDangwanConfirm({ date, willOpen: false })}
                    >
                      <span className="dangwan-manage-date">{date}</span>
                      <span className="dangwan-manage-badge open">🟢 열림</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'notice' && (
          <div className="admin-body">
            <form className="notice-create-form" onSubmit={handleCreateNotice}>
              <textarea
                className="notice-textarea"
                placeholder="공지 내용을 입력하세요"
                value={noticeInput}
                onChange={e => setNoticeInput(e.target.value)}
                rows={3}
                maxLength={300}
              />
              <button type="submit" className="notice-submit-btn" disabled={noticeSaving || !noticeInput.trim()}>
                {noticeSaving ? '등록 중...' : '공지 등록'}
              </button>
            </form>

            {noticeLoading ? (
              <div className="admin-state">불러오는 중...</div>
            ) : notices.length === 0 ? (
              <div className="admin-state">등록된 공지가 없어요</div>
            ) : (
              <div className="notice-list">
                {notices.map(n => (
                  <div key={n.id} className={`notice-admin-item ${n.isActive ? 'active' : 'inactive'}`}>
                    {!n.isActive && <span className="notice-paused-badge">게시 중단</span>}
                    {editingNoticeId === n.id ? (
                      <form onSubmit={e => handleEditNoticeSubmit(e, n.id)} className="notice-edit-form">
                        <textarea
                          className="notice-textarea"
                          value={editNoticeContent}
                          onChange={e => setEditNoticeContent(e.target.value)}
                          rows={3}
                          maxLength={300}
                          autoFocus
                        />
                        <div className="notice-edit-actions">
                          <button type="button" className="notice-action-btn cancel" onClick={() => setEditingNoticeId(null)}>취소</button>
                          <button type="submit" className="notice-action-btn save">저장</button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <p className="notice-admin-content">{n.content}</p>
                        <div className="notice-admin-footer">
                          <span className="notice-admin-time">{formatLogTime(n.createdAt)}</span>
                          <div className="notice-admin-actions">
                            <button
                              className="notice-action-btn edit"
                              onClick={() => { setEditingNoticeId(n.id); setEditNoticeContent(n.content) }}
                            >수정</button>
                            <button
                              className={`notice-action-btn ${n.isActive ? 'pause' : 'resume'}`}
                              onClick={() => handleToggleNotice(n.id, !n.isActive)}
                            >{n.isActive ? '게시 멈춤' : '다시 게시'}</button>
                            <button
                              className="notice-action-btn delete"
                              onClick={() => setDeleteNoticeTarget(n.id)}
                            >삭제</button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'result' && (
          <div className="admin-body">
            <p className="pay-header-hint" style={{ marginBottom: 8 }}>단관 오픈된 경기 결과를 입력해요 (승률에 반영돼요)</p>
            {resultsLoading || dangwanLoading ? (
              <div className="admin-state">불러오는 중...</div>
            ) : dangwanOpen.size === 0 ? (
              <div className="admin-state">단관 오픈된 경기가 없어요</div>
            ) : (
              <div className="result-list">
                {[...dangwanOpen].sort().map(date => {
                  const result = gameResults[date]
                  return (
                    <div key={date} className="result-item">
                      <span className="result-date">{date}</span>
                      <div className="result-btns">
                        {['승', '패', '무'].map(r => (
                          <button
                            key={r}
                            className={`result-btn result-${r} ${result === r ? 'active' : ''}`}
                            onClick={() => handleSetResult(date, r)}
                          >{r}</button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 단관 열기/닫기 확인 모달 */}
      {dangwanConfirm && (
        <div className="admin-confirm-overlay" onClick={() => setDangwanConfirm(null)}>
          <div className="admin-confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon">{dangwanConfirm.willOpen ? '🟢' : '🔴'}</div>
            <h4 className="confirm-title">단관 {dangwanConfirm.willOpen ? '열기' : '닫기'}</h4>
            <p className="confirm-desc">
              <strong>{dangwanConfirm.date}</strong><br />
              단관 신청을 <strong className={dangwanConfirm.willOpen ? 'status-paid' : 'status-unpaid'}>
                {dangwanConfirm.willOpen ? '오픈' : '마감'}
              </strong>하시겠어요?
            </p>
            <div className="confirm-actions">
              <button className="confirm-btn cancel" onClick={() => setDangwanConfirm(null)}>취소</button>
              <button
                className={`confirm-btn ok ${dangwanConfirm.willOpen ? 'pay' : 'revert'}`}
                onClick={confirmDangwanToggle}
              >
                {dangwanConfirm.willOpen ? '열기' : '닫기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 입금 상태 변경 확인 모달 */}
      {confirmTarget && (
        <div className="admin-confirm-overlay" onClick={() => setConfirmTarget(null)}>
          <div className="admin-confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon">{confirmTarget.item.isPaid ? '↩️' : '💳'}</div>
            <h4 className="confirm-title">입금 상태 변경</h4>
            <p className="confirm-desc">
              <strong>{confirmTarget.item.name}</strong>님을<br />
              <strong className={confirmTarget.item.isPaid ? 'status-unpaid' : 'status-paid'}>
                {confirmTarget.item.isPaid ? '미입금' : '입금완료'}
              </strong>
              으로 변경하시겠어요?
            </p>
            <div className="confirm-actions">
              <button className="confirm-btn cancel" onClick={() => setConfirmTarget(null)}>
                취소
              </button>
              <button
                className={`confirm-btn ok ${confirmTarget.item.isPaid ? 'revert' : 'pay'}`}
                onClick={confirmTogglePay}
              >
                변경
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteNoticeTarget && (
        <div className="admin-confirm-overlay" onClick={() => setDeleteNoticeTarget(null)}>
          <div className="admin-confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon">🗑️</div>
            <h4 className="confirm-title">공지 삭제</h4>
            <p className="confirm-desc">이 공지를 삭제하시겠어요?<br />삭제하면 복구할 수 없어요.</p>
            <div className="confirm-actions">
              <button className="confirm-btn cancel" onClick={() => setDeleteNoticeTarget(null)}>취소</button>
              <button className="confirm-btn ok revert" onClick={confirmDeleteNotice}>삭제</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function formatLogTime(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  const M = String(d.getMonth() + 1).padStart(2, '0')
  const D = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${M}/${D} ${h}:${m}`
}
