import { useState, useEffect } from 'react'
import { getActiveNotices } from '../../utils/storage'
import './NoticeBanner.css'

export default function NoticeBanner() {
  const [notices, setNotices] = useState([])
  const [dismissed, setDismissed] = useState(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getActiveNotices().then(setNotices).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const visible = notices.filter(n => !dismissed.has(n.id))

  if (loading) return <div className="notice-banner-wrap"><div className="notice-banner-skeleton" /></div>
  if (visible.length === 0) return null

  function dismiss(id) {
    setDismissed(prev => new Set([...prev, id]))
  }

  return (
    <div className="notice-banner-wrap">
      {visible.map(n => (
        <div key={n.id} className="notice-banner">
          <span className="notice-icon">📢</span>
          <span className="notice-content">{n.content}</span>
          <button className="notice-dismiss" onClick={() => dismiss(n.id)}>✕</button>
        </div>
      ))}
    </div>
  )
}
