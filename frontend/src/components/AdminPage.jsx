import { useState, useEffect, useRef } from 'react'
import { FaImage, FaTrash, FaShieldAlt, FaClipboardList, FaCreditCard, FaTicketAlt, FaBullhorn, FaTrophy, FaCircle, FaUndo } from 'react-icons/fa'
import { getAuditLogs, getAllApplications, updatePaymentStatus, logAudit, getDangwanOpenDates, getAllDangwanDates, openDangwanDate, closeDangwanDate, getAllNotices, createNotice, updateNotice, toggleNoticeActive, deleteNotice, getGameResults, setGameResult, deleteGameResult, getAllJungmoApplicationsWithInfo, updateJungmoPaymentStatus, getAllBanners, createBanner, updateBanner, toggleBannerActive, deleteBanner } from '../utils/storage'
import { fileToWebpBase64 } from '../utils/image'
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
  transfer: '양도',
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
  const adminPageRef = useRef(null)

  const [logs, setLogs] = useState([])
  const [logFilter, setLogFilter] = useState('all')
  const [logLoading, setLogLoading] = useState(false)

  const [apps, setApps] = useState([])
  const [payLoading, setPayLoading] = useState(false)
  const [payCategory, setPayCategory] = useState('dangwan')
  const [jungmoApps, setJungmoApps] = useState([])
  const [jungmoPayLoading, setJungmoPayLoading] = useState(false)
  const [jungmoConfirmTarget, setJungmoConfirmTarget] = useState(null) // { item, jungmoId, jungmoTitle, eventDate }
  const [expandedJungmos, setExpandedJungmos] = useState(new Set())

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

  // 배너 관리
  const [banners, setBanners] = useState([])
  const [bannerLoading, setBannerLoading] = useState(false)
  const [bannerSaving, setBannerSaving] = useState(false)
  const [bannerTitle, setBannerTitle] = useState('')
  const [bannerDescription, setBannerDescription] = useState('')
  const [bannerPreview, setBannerPreview] = useState(null)
  const [bannerFileError, setBannerFileError] = useState('')
  const [deleteBannerTarget, setDeleteBannerTarget] = useState(null)
  const [editingBannerId, setEditingBannerId] = useState(null)
  const [editBannerTitle, setEditBannerTitle] = useState('')
  const [editBannerDescription, setEditBannerDescription] = useState('')
  const bannerFileInputRef = useRef(null)

  // 단관 관리
  const [dangwanOpen, setDangwanOpen] = useState(new Set())
  const [allDangwanArr, setAllDangwanArr] = useState([])
  const [dangwanLoading, setDangwanLoading] = useState(false)
  const [dangwanConfirm, setDangwanConfirm] = useState(null) // { date, willOpen }
  const [dangwanDateInput, setDangwanDateInput] = useState('')
  const [showDangwanInput, setShowDangwanInput] = useState(false)

  // 날짜별 접기/펼치기 (기본: 전부 펼침)
  const [expandedDates, setExpandedDates] = useState(new Set())

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

  async function loadJungmoApps() {
    setJungmoPayLoading(true)
    try {
      const data = await getAllJungmoApplicationsWithInfo()
      setJungmoApps(data)
    } finally {
      setJungmoPayLoading(false)
    }
  }

  async function loadDangwan() {
    setDangwanLoading(true)
    try {
      const [openDates, allDates] = await Promise.all([
        getDangwanOpenDates(),
        getAllDangwanDates(),
      ])
      setDangwanOpen(openDates)
      setAllDangwanArr(allDates)
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

  async function loadBanners() {
    setBannerLoading(true)
    try {
      const data = await getAllBanners()
      setBanners(data)
    } finally {
      setBannerLoading(false)
    }
  }

  async function handleBannerFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 8 * 1024 * 1024) {
      setBannerFileError('파일 크기는 8MB 이하만 가능해요.')
      return
    }
    setBannerFileError('')
    try {
      const webp = await fileToWebpBase64(file)
      setBannerPreview(webp)
    } catch {
      setBannerFileError('이미지를 불러오지 못했어요.')
    }
  }

  function cancelBannerPreview() {
    setBannerPreview(null)
    if (bannerFileInputRef.current) bannerFileInputRef.current.value = ''
  }

  async function handleCreateBanner(e) {
    e.preventDefault()
    if (!bannerPreview) { setBannerFileError('이미지를 선택해주세요.'); return }
    setBannerSaving(true)
    try {
      await createBanner({ imageBase64: bannerPreview, title: bannerTitle.trim(), description: bannerDescription.trim() })
      setBannerTitle('')
      setBannerDescription('')
      cancelBannerPreview()
      await loadBanners()
    } finally {
      setBannerSaving(false)
    }
  }

  async function handleToggleBanner(id, isActive) {
    await toggleBannerActive(id, isActive)
    setBanners(prev => prev.map(b => b.id === id ? { ...b, isActive } : b))
  }

  function startEditBanner(b) {
    setEditingBannerId(b.id)
    setEditBannerTitle(b.title)
    setEditBannerDescription(b.description)
  }

  async function handleEditBannerSubmit(e, id) {
    e.preventDefault()
    const title = editBannerTitle.trim()
    const description = editBannerDescription.trim()
    await updateBanner(id, { title, description })
    setBanners(prev => prev.map(b => b.id === id ? { ...b, title, description } : b))
    setEditingBannerId(null)
  }

  async function confirmDeleteBanner() {
    await deleteBanner(deleteBannerTarget)
    setBanners(prev => prev.filter(b => b.id !== deleteBannerTarget))
    setDeleteBannerTarget(null)
  }

  useEffect(() => {
    if (!authed) return
    if (tab === 'log') loadLogs()
    if (tab === 'pay') { loadApps(); loadJungmoApps() }
    if (tab === 'dangwan') loadDangwan()
    if (tab === 'notice') loadNotices()
    if (tab === 'result') { loadResults(); loadDangwan() }
    if (tab === 'banner') loadBanners()
  }, [tab, authed])

  useEffect(() => {
    const page = adminPageRef.current
    if (!page) return
    const setBodyHeight = () => {
      const header = page.querySelector('.admin-header')
      const tabNav = page.querySelector('.admin-tab-nav')
      const body = page.querySelector('.admin-body')
      if (!header || !tabNav || !body) return
      body.style.height = (page.clientHeight - header.offsetHeight - tabNav.offsetHeight) + 'px'
    }
    setBodyHeight()
    window.addEventListener('resize', setBodyHeight)
    return () => window.removeEventListener('resize', setBodyHeight)
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
    try {
      const current = gameResults[date]
      if (current === result) {
        await deleteGameResult(date)
        setGameResults(prev => { const n = { ...prev }; delete n[date]; return n })
      } else {
        await setGameResult(date, result)
        setGameResults(prev => ({ ...prev, [date]: result }))
      }
    } catch (e) {
      alert('결과 저장 오류: ' + e.message)
    }
  }

  async function confirmDangwanToggle() {
    const { date, willOpen } = dangwanConfirm
    setDangwanConfirm(null)
    try {
      if (willOpen) {
        await openDangwanDate(date)
      } else {
        await closeDangwanDate(date)
      }
      const [openDates, allDates] = await Promise.all([getDangwanOpenDates(), getAllDangwanDates()])
      setDangwanOpen(openDates)
      setAllDangwanArr(allDates)
      if (onDangwanChange) onDangwanChange(openDates)
    } catch (e) {
      alert('단관 변경 오류: ' + e.message)
    }
  }

  function toggleDateCollapse(date) {
    setExpandedDates(prev => {
      const next = new Set(prev)
      next.has(date) ? next.delete(date) : next.add(date)
      return next
    })
  }

  function toggleJungmoCollapse(jungmoId) {
    setExpandedJungmos(prev => {
      const next = new Set(prev)
      next.has(jungmoId) ? next.delete(jungmoId) : next.add(jungmoId)
      return next
    })
  }

  async function confirmToggleJungmoPay() {
    const { item, jungmoTitle, eventDate } = jungmoConfirmTarget
    const newStatus = !item.isPaid
    setJungmoConfirmTarget(null)
    await updateJungmoPaymentStatus(item.id, newStatus)
    logAudit('pay', 'jungmo', eventDate, item.nickname, newStatus ? '입금완료' : '입금취소')
    setJungmoApps(prev => prev.map(a => a.id === item.id ? { ...a, isPaid: newStatus } : a))
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

  const jungmoAppsByJungmo = jungmoApps.reduce((acc, app) => {
    const key = app.jungmoId
    if (!acc[key]) acc[key] = { title: app.jungmoTitle, eventDate: app.eventDate, apps: [] }
    acc[key].apps.push(app)
    return acc
  }, {})

  const dangwanDateEntries = Object.entries(appsByDate).sort(([a], [b]) => b.localeCompare(a))
  const dangwanUpcoming = dangwanDateEntries.filter(([date]) => date >= today)
  const dangwanPast = dangwanDateEntries.filter(([date]) => date < today)

  const jungmoEntries = Object.entries(jungmoAppsByJungmo).sort(([, a], [, b]) => b.eventDate.localeCompare(a.eventDate))
  const jungmoUpcoming = jungmoEntries.filter(([, v]) => v.eventDate >= today)
  const jungmoPast = jungmoEntries.filter(([, v]) => v.eventDate < today)

  function renderDangwanGroup([date, items], isPast) {
    const totalPeople = items.reduce((s, i) => s + (i.count || 0), 0)
    const paidCount = items.filter(i => i.isPaid).reduce((s, i) => s + (i.count || 0), 0)
    const isCollapsed = !expandedDates.has(date)
    return (
      <div key={date} className={`pay-date-group ${isPast ? 'past' : ''}`}>
        <button className="pay-date-header" onClick={() => toggleDateCollapse(date)}>
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
  }

  function renderJungmoGroup([jungmoId, { title, eventDate, apps }], isPast) {
    const totalPeople = apps.reduce((s, i) => s + (i.count || 0), 0)
    const paidCount = apps.filter(i => i.isPaid).reduce((s, i) => s + (i.count || 0), 0)
    const isCollapsed = !expandedJungmos.has(jungmoId)
    return (
      <div key={jungmoId} className={`pay-date-group ${isPast ? 'past' : ''}`}>
        <button className="pay-date-header" onClick={() => toggleJungmoCollapse(jungmoId)}>
          <div className="pay-date-left">
            <span className="pay-date-chevron">{isCollapsed ? '▶' : '▼'}</span>
            <div className="pay-date-title-wrap">
              <span className="pay-date">{title}</span>
              <span className="pay-jungmo-date">{eventDate}</span>
            </div>
          </div>
          <span className={`pay-date-stat ${paidCount === totalPeople && totalPeople > 0 ? 'all-paid' : ''}`}>
            {paidCount}/{totalPeople}명 입금
          </span>
        </button>

        {!isCollapsed && apps.map(item => (
          <div
            key={item.id}
            className={`pay-item ${item.isPaid ? 'paid' : ''}`}
            onClick={() => setJungmoConfirmTarget({ item, jungmoId, jungmoTitle: title, eventDate })}
          >
            <div className="pay-item-info">
              <span className="pay-item-name">{item.nickname}</span>
              <span className="pay-item-count">{item.count}명</span>
              {item.note && (
                <span className="pay-item-req">{item.note}</span>
              )}
            </div>
            <span className={`pay-badge ${item.isPaid ? 'paid' : 'unpaid'}`}>
              {item.isPaid ? '✓ 입금완료' : '미입금'}
            </span>
          </div>
        ))}
      </div>
    )
  }

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
          <div className="admin-login-icon"><FaShieldAlt /></div>
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
      <div className="admin-page" ref={adminPageRef}>
        <div className="admin-header">
          <h2 className="admin-title"><FaShieldAlt /> 관리자</h2>
          <button className="admin-x-btn" onClick={onClose}>✕</button>
        </div>

        <div className="admin-tab-nav">
          <button className={`admin-tab-btn ${tab === 'log' ? 'active' : ''}`} onClick={() => setTab('log')}>
            <FaClipboardList /> 로그
          </button>
          <button className={`admin-tab-btn ${tab === 'pay' ? 'active' : ''}`} onClick={() => setTab('pay')}>
            <FaCreditCard /> 입금
          </button>
          <button className={`admin-tab-btn ${tab === 'dangwan' ? 'active' : ''}`} onClick={() => setTab('dangwan')}>
            <FaTicketAlt /> 단관
          </button>
          <button className={`admin-tab-btn ${tab === 'notice' ? 'active' : ''}`} onClick={() => setTab('notice')}>
            <FaBullhorn /> 공지
          </button>
          <button className={`admin-tab-btn ${tab === 'result' ? 'active' : ''}`} onClick={() => setTab('result')}>
            <FaTrophy /> 결과
          </button>
          <button className={`admin-tab-btn ${tab === 'banner' ? 'active' : ''}`} onClick={() => setTab('banner')}>
            <FaImage /> 배너
          </button>
        </div>

        {tab === 'log' && (
          <div className="admin-body">
            <div className="log-filter-bar">
              {['all', 'dangwan', 'jikgwan', 'jungmo', 'transfer', 'pay'].map(f => (
                <button
                  key={f}
                  className={`log-filter-chip ${logFilter === f ? 'active ' + f : ''}`}
                  onClick={() => setLogFilter(f)}
                >
                  {f === 'all' ? '전체' : f === 'pay' ? <><FaCreditCard /> 입금</> : CATEGORY_LABELS[f]}
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
              <button className="log-refresh-btn" onClick={() => { loadApps(); loadJungmoApps() }}>↻</button>
            </div>

            <div className="pay-cat-switch">
              <button className={`pay-cat-btn ${payCategory === 'dangwan' ? 'active' : ''}`} onClick={() => setPayCategory('dangwan')}>단관</button>
              <button className={`pay-cat-btn ${payCategory === 'jungmo' ? 'active' : ''}`} onClick={() => setPayCategory('jungmo')}>정모</button>
            </div>

            {payCategory === 'dangwan' && (
              payLoading ? (
                <div className="admin-state">불러오는 중...</div>
              ) : dangwanDateEntries.length === 0 ? (
                <div className="admin-state">신청 내역이 없어요</div>
              ) : (
                <>
                  {dangwanUpcoming.length === 0 ? (
                    <div className="admin-state">진행 예정인 단관이 없어요</div>
                  ) : (
                    dangwanUpcoming.map(entry => renderDangwanGroup(entry, false))
                  )}
                  {dangwanPast.length > 0 && (
                    <>
                      <div className="pay-section-divider"><span>지난 단관</span></div>
                      {dangwanPast.map(entry => renderDangwanGroup(entry, true))}
                    </>
                  )}
                </>
              )
            )}

            {payCategory === 'jungmo' && (
              jungmoPayLoading ? (
                <div className="admin-state">불러오는 중...</div>
              ) : jungmoEntries.length === 0 ? (
                <div className="admin-state">정모 신청 내역이 없어요</div>
              ) : (
                <>
                  {jungmoUpcoming.length === 0 ? (
                    <div className="admin-state">진행 예정인 정모가 없어요</div>
                  ) : (
                    jungmoUpcoming.map(entry => renderJungmoGroup(entry, false))
                  )}
                  {jungmoPast.length > 0 && (
                    <>
                      <div className="pay-section-divider"><span>지난 정모</span></div>
                      {jungmoPast.map(entry => renderJungmoGroup(entry, true))}
                    </>
                  )}
                </>
              )
            )}
          </div>
        )}

        {tab === 'dangwan' && (
          <div className="admin-body">
            {showDangwanInput ? (
              <div className="dangwan-open-form">
                <p className="dangwan-open-label">오픈할 날짜를 선택하세요</p>
                <div className="dangwan-input-row">
                  <input
                    type="date"
                    className="dangwan-date-input"
                    value={dangwanDateInput}
                    onChange={e => setDangwanDateInput(e.target.value)}
                    autoFocus
                  />
                  <button
                    className="dangwan-toggle-btn open"
                    disabled={!dangwanDateInput}
                    onClick={() => {
                      setShowDangwanInput(false)
                      setDangwanConfirm({ date: dangwanDateInput, willOpen: true })
                      setDangwanDateInput('')
                    }}
                  >확인</button>
                  <button
                    className="dangwan-toggle-btn cancel"
                    onClick={() => { setShowDangwanInput(false); setDangwanDateInput('') }}
                  >취소</button>
                </div>
              </div>
            ) : (
              <button
                className="dangwan-open-trigger-btn"
                onClick={() => setShowDangwanInput(true)}
              >+ 단관 날짜 오픈하기</button>
            )}

            {dangwanLoading ? (
              <div className="admin-state">불러오는 중...</div>
            ) : allDangwanArr.length === 0 ? (
              <div className="admin-state" style={{ marginTop: 16 }}>등록된 단관 날짜가 없어요</div>
            ) : (
              <>
                <p className="pay-header-hint" style={{ margin: '14px 0 6px' }}>단관 날짜 목록</p>
                <div className="dangwan-manage-list">
                  {allDangwanArr.map(({ game_date, is_open }) => (
                    <div
                      key={game_date}
                      className={`dangwan-manage-item ${is_open ? 'open' : ''}`}
                      onClick={() => setDangwanConfirm({ date: game_date, willOpen: !is_open })}
                    >
                      <span className="dangwan-manage-date">{game_date}</span>
                      <span className={`dangwan-manage-badge ${is_open ? 'open' : 'closed'}`}>
                        {is_open ? <><FaCircle /> 열림</> : <><FaCircle /> 마감</>}
                      </span>
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
            ) : allDangwanArr.length === 0 ? (
              <div className="admin-state">단관 날짜가 없어요</div>
            ) : (
              <div className="result-list">
                {allDangwanArr.map(({ game_date }) => {
                  const result = gameResults[game_date]
                  return (
                    <div key={game_date} className="result-item">
                      <span className="result-date">{game_date}</span>
                      <div className="result-btns">
                        {['승', '패', '무'].map(r => (
                          <button
                            key={r}
                            className={`result-btn result-${r} ${result === r ? 'active' : ''}`}
                            onClick={() => handleSetResult(game_date, r)}
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

        {tab === 'banner' && (
          <div className="admin-body">
            <form className="notice-create-form" onSubmit={handleCreateBanner}>
              {bannerPreview ? (
                <div className="preview-img-wrap">
                  <img src={bannerPreview} alt="미리보기" className="preview-img" />
                  <button type="button" className="cancel-preview-btn" onClick={cancelBannerPreview}>✕</button>
                </div>
              ) : (
                <label className="upload-zone" htmlFor="banner-file-input">
                  <span className="upload-icon"><FaImage /></span>
                  <span className="upload-text">배너 이미지 선택</span>
                  <span className="upload-sub">JPG, PNG · 최대 8MB (WebP로 자동 변환)</span>
                  <input
                    id="banner-file-input"
                    ref={bannerFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBannerFileChange}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
              {bannerFileError && <p className="admin-pw-error">{bannerFileError}</p>}

              <input
                type="text"
                className="notice-textarea"
                placeholder="제목 (선택)"
                value={bannerTitle}
                onChange={e => setBannerTitle(e.target.value)}
                maxLength={40}
              />
              <textarea
                className="notice-textarea"
                placeholder="설명 (선택)"
                value={bannerDescription}
                onChange={e => setBannerDescription(e.target.value)}
                rows={2}
                maxLength={80}
              />
              <button type="submit" className="notice-submit-btn" disabled={bannerSaving || !bannerPreview}>
                {bannerSaving ? '등록 중...' : '배너 등록'}
              </button>
            </form>

            {bannerLoading ? (
              <div className="admin-state">불러오는 중...</div>
            ) : banners.length === 0 ? (
              <div className="admin-state">등록된 배너가 없어요</div>
            ) : (
              <div className="notice-list">
                {banners.map(b => (
                  <div key={b.id} className={`notice-admin-item ${b.isActive ? 'active' : 'inactive'}`}>
                    {!b.isActive && <span className="notice-paused-badge">게시 중단</span>}
                    <img src={b.imageBase64} alt={b.title || '배너'} className="preview-img" style={{ marginBottom: 8 }} />
                    {editingBannerId === b.id ? (
                      <form onSubmit={e => handleEditBannerSubmit(e, b.id)} className="notice-edit-form">
                        <input
                          type="text"
                          className="notice-textarea"
                          placeholder="제목 (선택)"
                          value={editBannerTitle}
                          onChange={e => setEditBannerTitle(e.target.value)}
                          maxLength={40}
                          autoFocus
                        />
                        <textarea
                          className="notice-textarea"
                          placeholder="설명 (선택)"
                          value={editBannerDescription}
                          onChange={e => setEditBannerDescription(e.target.value)}
                          rows={2}
                          maxLength={80}
                        />
                        <div className="notice-edit-actions">
                          <button type="button" className="notice-action-btn cancel" onClick={() => setEditingBannerId(null)}>취소</button>
                          <button type="submit" className="notice-action-btn save">저장</button>
                        </div>
                      </form>
                    ) : (
                      <>
                        {(b.title || b.description) && (
                          <p className="notice-admin-content">
                            {b.title && <strong>{b.title}</strong>}
                            {b.title && b.description && ' — '}
                            {b.description}
                          </p>
                        )}
                        <div className="notice-admin-footer">
                          <span className="notice-admin-time">{formatLogTime(b.createdAt)}</span>
                          <div className="notice-admin-actions">
                            <button
                              className="notice-action-btn edit"
                              onClick={() => startEditBanner(b)}
                            >수정</button>
                            <button
                              className={`notice-action-btn ${b.isActive ? 'pause' : 'resume'}`}
                              onClick={() => handleToggleBanner(b.id, !b.isActive)}
                            >{b.isActive ? '게시 멈춤' : '다시 게시'}</button>
                            <button
                              className="notice-action-btn delete"
                              onClick={() => setDeleteBannerTarget(b.id)}
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
      </div>

      {/* 단관 열기/닫기 확인 모달 */}
      {dangwanConfirm && (
        <div className="admin-confirm-overlay" onClick={() => setDangwanConfirm(null)}>
          <div className="admin-confirm-modal" onClick={e => e.stopPropagation()}>
            <div className={`confirm-icon ${dangwanConfirm.willOpen ? 'status-paid' : 'status-unpaid'}`}><FaCircle /></div>
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
            <div className="confirm-icon">{confirmTarget.item.isPaid ? <FaUndo /> : <FaCreditCard />}</div>
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

      {/* 정모 입금 상태 변경 확인 모달 */}
      {jungmoConfirmTarget && (
        <div className="admin-confirm-overlay" onClick={() => setJungmoConfirmTarget(null)}>
          <div className="admin-confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon">{jungmoConfirmTarget.item.isPaid ? <FaUndo /> : <FaCreditCard />}</div>
            <h4 className="confirm-title">입금 상태 변경</h4>
            <p className="confirm-desc">
              <strong>{jungmoConfirmTarget.item.nickname}</strong>님을<br />
              <strong className={jungmoConfirmTarget.item.isPaid ? 'status-unpaid' : 'status-paid'}>
                {jungmoConfirmTarget.item.isPaid ? '미입금' : '입금완료'}
              </strong>
              으로 변경하시겠어요?
            </p>
            <div className="confirm-actions">
              <button className="confirm-btn cancel" onClick={() => setJungmoConfirmTarget(null)}>취소</button>
              <button
                className={`confirm-btn ok ${jungmoConfirmTarget.item.isPaid ? 'revert' : 'pay'}`}
                onClick={confirmToggleJungmoPay}
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
            <div className="confirm-icon"><FaTrash /></div>
            <h4 className="confirm-title">공지 삭제</h4>
            <p className="confirm-desc">이 공지를 삭제하시겠어요?<br />삭제하면 복구할 수 없어요.</p>
            <div className="confirm-actions">
              <button className="confirm-btn cancel" onClick={() => setDeleteNoticeTarget(null)}>취소</button>
              <button className="confirm-btn ok revert" onClick={confirmDeleteNotice}>삭제</button>
            </div>
          </div>
        </div>
      )}

      {deleteBannerTarget && (
        <div className="admin-confirm-overlay" onClick={() => setDeleteBannerTarget(null)}>
          <div className="admin-confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon"><FaTrash /></div>
            <h4 className="confirm-title">배너 삭제</h4>
            <p className="confirm-desc">이 배너를 삭제하시겠어요?<br />삭제하면 복구할 수 없어요.</p>
            <div className="confirm-actions">
              <button className="confirm-btn cancel" onClick={() => setDeleteBannerTarget(null)}>취소</button>
              <button className="confirm-btn ok revert" onClick={confirmDeleteBanner}>삭제</button>
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
