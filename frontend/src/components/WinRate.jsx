import { useState, useEffect } from 'react'
import { getGameResults } from '../utils/storage'
import './WinRate.css'

export default function WinRate({ dangwanDates }) {
  const [results, setResults] = useState([])

  useEffect(() => {
    getGameResults().then(setResults).catch(() => {})
  }, [])

  const openDates = [...dangwanDates]
  const resultMap = Object.fromEntries(results.map(r => [r.game_date, r.result]))

  const datesWithResult = openDates.filter(d => resultMap[d])
  const wins   = datesWithResult.filter(d => resultMap[d] === '승').length
  const losses = datesWithResult.filter(d => resultMap[d] === '패').length
  const draws  = datesWithResult.filter(d => resultMap[d] === '무').length
  const total  = datesWithResult.length
  const rate   = total > 0 ? Math.round((wins / total) * 100) : null

  if (openDates.length === 0) return null

  return (
    <div className="winrate-card">
      <div className="winrate-header">
        <span className="winrate-title">⚾ 단체관람 승률</span>
      </div>

      <div className="winrate-stats">
        <div className="winrate-stat win"><span className="stat-num">{wins}</span><span className="stat-label">승</span></div>
        <div className="winrate-divider" />
        <div className="winrate-stat loss"><span className="stat-num">{losses}</span><span className="stat-label">패</span></div>
        <div className="winrate-divider" />
        <div className="winrate-stat draw"><span className="stat-num">{draws}</span><span className="stat-label">무</span></div>
        <div className="winrate-divider" />
        <div className="winrate-stat total"><span className="stat-num">{openDates.length}</span><span className="stat-label">전체</span></div>
      </div>

      {rate !== null && (
        <div className="winrate-bar-wrap">
          <div className="winrate-bar-bg">
            <div className="winrate-bar-fill" style={{ width: `${rate}%` }} />
          </div>
          <span className="winrate-pct">{rate}%</span>
        </div>
      )}
    </div>
  )
}
