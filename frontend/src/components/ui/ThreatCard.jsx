import { motion, useAnimation } from 'framer-motion'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBadge from './StatusBadge'

const PLATFORM_ICONS = { youtube: '▶', twitter: '𝕏', tiktok: '♪', web: '◈', instagram: '◉', hotstar: '★', jiocinema: '◆' }
const PLATFORM_COLORS = { youtube: '#ff0000', twitter: '#1da1f2', tiktok: '#ff0050', web: '#607d8b', instagram: '#e1306c', hotstar: '#1f80e0', jiocinema: '#6c2dc7' }

export default function ThreatCard({ violation, onClick, index = 0, isNew = false }) {
  const navigate   = useNavigate()
  const controls   = useAnimation()
  const conf       = violation.confidence * 100
  const severity   = conf >= 85 ? 'severity-high' : conf >= 60 ? 'severity-medium' : 'severity-low'
  const confColor  = conf >= 85 ? 'var(--accent-threat)' : conf >= 60 ? 'var(--accent-warn)' : 'var(--accent-data)'
  const platColor  = PLATFORM_COLORS[violation.platform] || '#607d8b'

  // Flash red on new
  useEffect(() => {
    if (isNew) {
      controls.start({
        backgroundColor: ['rgba(255,23,68,0.25)', 'rgba(255,23,68,0.1)', 'rgba(10,16,32,1)'],
        transition: { duration: 1.8, ease: 'easeOut' },
      })
    }
  }, [isNew])

  return (
    <motion.div
      layout
      initial={isNew
        ? { opacity: 0, x: 40, scale: 0.96 }
        : { opacity: 0, y: 16 }}
      animate={isNew
        ? { opacity: 1, x: 0, scale: 1, ...controls }
        : { opacity: 1, y: 0 }}
      transition={{ duration: 0.32, type: 'spring', stiffness: 220, damping: 26, delay: index * 0.04 }}
      className={`card ${severity}`}
      style={{ padding: '12px 14px', cursor: 'none', marginBottom: 8, position: 'relative', overflow: 'hidden' }}
      onClick={onClick}
      data-cursor="interactive"
      whileHover={{ x: 3, borderColor: 'rgba(0,184,212,0.35)', transition: { duration: 0.1 } }}
    >
      {/* Shimmer sweep on hover */}
      <motion.div
        initial={{ x: '-100%' }}
        whileHover={{ x: '250%' }}
        transition={{ duration: 0.55, ease: 'easeInOut' }}
        style={{
          position: 'absolute', top: 0, left: 0, width: '30%', height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)',
          pointerEvents: 'none',
        }}
      />

      <div className="flex items-start gap-3">
        {/* Thumbnail or platform icon */}
        <div style={{
          width: 72, height: 46, background: 'var(--bg-void)',
          border: `1px solid ${platColor}33`,
          flexShrink: 0, position: 'relative', overflow: 'hidden',
          boxShadow: `inset 0 0 12px ${platColor}11`,
        }}>
          {violation.thumbnail_url ? (
            <img
              src={violation.thumbnail_url}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
              onError={(e) => { e.target.style.display = 'none' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: platColor }}>
              {PLATFORM_ICONS[violation.platform] || '◈'}
            </div>
          )}
          {/* Platform badge over thumbnail */}
          <div style={{
            position: 'absolute', bottom: 2, right: 2,
            background: 'rgba(0,0,0,0.75)', padding: '1px 4px',
            fontSize: 8, color: platColor, fontFamily: 'monospace',
          }}>
            {PLATFORM_ICONS[violation.platform]} {violation.platform?.toUpperCase()}
          </div>
          {violation.is_live && (
            <div style={{
              position: 'absolute', top: 2, left: 2,
              background: 'rgba(255,23,68,0.85)', padding: '1px 4px',
              fontSize: 7, color: '#fff', fontFamily: 'monospace', letterSpacing: '0.05em',
            }}>
              LIVE
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-mono" style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {violation.asset_title || 'Unknown Asset'}
            </span>
            <motion.span
              className="font-orbitron font-bold"
              style={{ fontSize: 13, color: confColor, flexShrink: 0, textShadow: conf >= 85 ? '0 0 8px rgba(255,23,68,0.5)' : 'none' }}
              animate={conf >= 90 ? { opacity: [1, 0.7, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {conf.toFixed(0)}%
            </motion.span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-data" style={{ fontSize: 9, color: platColor }}>
              {PLATFORM_ICONS[violation.platform]} {violation.platform?.toUpperCase()}
            </span>
            <span style={{ color: 'var(--border-subtle)', fontSize: 10 }}>·</span>
            <span className="font-data" style={{ fontSize: 9, color: 'var(--text-secondary)' }}>
              {violation.detected_at ? formatRelative(violation.detected_at) : 'Just now'}
            </span>
            {isNew && (
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.6, repeat: Infinity }}
                className="font-data"
                style={{ fontSize: 8, color: 'var(--accent-threat)', letterSpacing: '0.1em', marginLeft: 4 }}
              >
                ● NEW
              </motion.span>
            )}
          </div>

          {(violation.infringing_title || violation.ai_explanation_preview) && (
            <p className="font-mono" style={{ fontSize: 9, color: 'var(--text-secondary)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {violation.infringing_title || violation.ai_explanation_preview}
            </p>
          )}
          {violation.channel && violation.view_count && (
            <p className="font-data" style={{ fontSize: 8, color: 'var(--text-secondary)', marginTop: 2, opacity: 0.7 }}>
              {violation.channel} · {violation.view_count}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <button
          className="btn btn-ghost"
          style={{ padding: '4px 10px', fontSize: 9 }}
          onClick={(e) => { e.stopPropagation(); navigate(`/violation/${violation.id}`) }}
          data-cursor="interactive"
        >
          VIEW
        </button>
        <button
          className="btn btn-threat"
          style={{ padding: '4px 10px', fontSize: 9 }}
          onClick={(e) => { e.stopPropagation(); navigate(`/violation/${violation.id}?action=dmca`) }}
          data-cursor="interactive"
        >
          TAKEDOWN
        </button>
      </div>
    </motion.div>
  )
}

function formatRelative(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const secs = Math.floor(diff / 1000)
  if (secs < 60) return `${secs}s ago`
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ago`
}
