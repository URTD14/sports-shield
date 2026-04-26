import { useEffect, useState } from 'react'
import useShieldStore from '../../store/useShieldStore'

const SEED_VIOLATIONS = [
  { id: 1, asset: 'UEFA CL Final Highlight', platform: 'YouTube', confidence: 94, time: '2s ago' },
  { id: 2, asset: 'Premier League Goal — Salah', platform: 'TikTok', confidence: 87, time: '18s ago' },
  { id: 3, asset: 'NBA Playoffs Dunk — LeBron', platform: 'Twitter', confidence: 91, time: '1m ago' },
  { id: 4, asset: 'Olympics 100m Final', platform: 'Web', confidence: 78, time: '3m ago' },
  { id: 5, asset: 'UEFA CL Final Highlight', platform: 'TikTok', confidence: 96, time: '5m ago' },
  { id: 6, asset: 'Real Madrid Team Photo', platform: 'Twitter', confidence: 82, time: '7m ago' },
  { id: 7, asset: 'Premier League Goal — Salah', platform: 'YouTube', confidence: 89, time: '9m ago' },
]

export default function ThreatTicker() {
  const { liveViolations } = useShieldStore()
  const [items, setItems] = useState(SEED_VIOLATIONS)

  useEffect(() => {
    if (liveViolations.length > 0) {
      const newItems = liveViolations.slice(0, 5).map((v) => ({
        id: v.violation_id || Math.random(),
        asset: v.asset_title || 'Unknown Asset',
        platform: v.platform || 'Unknown',
        confidence: Math.round((v.confidence || 0.9) * 100),
        time: 'Just now',
      }))
      setItems([...newItems, ...SEED_VIOLATIONS])
    }
  }, [liveViolations])

  const doubled = [...items, ...items] // double for seamless loop

  return (
    <div
      style={{
        position: 'fixed',
        top: 52,
        left: 0,
        right: 0,
        height: 28,
        zIndex: 998,
        background: 'rgba(5,10,18,0.95)',
        borderBottom: '1px solid rgba(255,23,68,0.2)',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Label */}
      <div
        style={{
          padding: '0 12px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(255,23,68,0.1)',
          borderRight: '1px solid rgba(255,23,68,0.3)',
          flexShrink: 0,
          zIndex: 2,
        }}
      >
        <span className="live-dot" />
        <span
          className="font-orbitron"
          style={{ fontSize: 9, color: 'var(--accent-threat)', letterSpacing: '0.15em' }}
        >
          LIVE THREATS
        </span>
      </div>

      {/* Scrolling ticker */}
      <div style={{ overflow: 'hidden', flex: 1, position: 'relative' }}>
        <div className="ticker-track">
          {doubled.map((item, i) => (
            <TickerItem key={`${item.id}-${i}`} item={item} />
          ))}
        </div>
      </div>
    </div>
  )
}

function TickerItem({ item }) {
  const confColor =
    item.confidence >= 85
      ? 'var(--accent-threat)'
      : item.confidence >= 60
      ? 'var(--accent-warn)'
      : 'var(--accent-data)'

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '0 20px',
        borderRight: '1px solid var(--border-subtle)',
        height: 28,
        flexShrink: 0,
        whiteSpace: 'nowrap',
      }}
    >
      <span className="font-data" style={{ fontSize: 9, color: confColor }}>
        ◆
      </span>
      <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-primary)' }}>
        {item.asset}
      </span>
      <span className="font-data" style={{ fontSize: 9, color: 'var(--text-secondary)' }}>
        on {item.platform}
      </span>
      <span className="font-orbitron" style={{ fontSize: 9, color: confColor, fontWeight: 700 }}>
        {item.confidence}%
      </span>
      <span className="font-data" style={{ fontSize: 9, color: 'var(--text-secondary)' }}>
        {item.time}
      </span>
    </div>
  )
}
