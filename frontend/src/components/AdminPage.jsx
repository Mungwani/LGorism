import { useState, useEffect } from 'react'
import { getAuditLogs, getAllApplications, updatePaymentStatus, logAudit, getDangwanOpenDates, openDangwanDate, closeDangwanDate } from '../utils/storage'
import { games } from '../data/games'

const homeGames = games.filter(g => g.isHome).map(g => g.date)
import './AdminPage.css'

const ADMIN_PW = 'admin60'

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

  // 단관 관리
  const [dangwanOpen, setDangwanOpen] = useState(new Set())
  const [dangwanLoading, setDangwanLoading] = useState(false)
  const [dangwanConfirm, setDangwanConfirm] = useState(null) // { date, willOpen }

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

  useEffect(() => {
    if (!authed) return
    if (tab === 'log') loadLogs()
    if (tab === 'pay') loadApps()
    if (tab === 'dangwan') loadDangwan()
  }, [tab, authed])

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
            <p className="pay-header-hint" style={{ marginBottom: 8 }}>날짜를 눌러 단관 신청을 열거나 닫아요</p>
            {dangwanLoading ? (
              <div className="admin-state">불러오는 중...</div>
            ) : (
              <div className="dangwan-manage-list">
                {homeGames.map(date => {
                  const isOpen = dangwanOpen.has(date)
                  return (
                    <div
                      key={date}
                      className={`dangwan-manage-item ${isOpen ? 'open' : ''}`}
                      onClick={() => setDangwanConfirm({ date, willOpen: !isOpen })}
                    >
                      <span className="dangwan-manage-date">{date}</span>
                      <span className={`dangwan-manage-badge ${isOpen ? 'open' : 'closed'}`}>
                        {isOpen ? '🟢 열림' : '🔴 닫힘'}
                      </span>
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
