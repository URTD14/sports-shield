import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import StatusBadge from './StatusBadge'
import SportThumbnail from './SportThumbnail'

function FingerprintDots({ strength = 3 }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <motion.div
          key={i}
          animate={i <= strength ? { opacity: [1, 0.5, 1] } : {}}
          transition={{ duration: 2 + i * 0.3, repeat: Infinity, delay: i * 0.2 }}
          style={{
            width: 6, height: 6, borderRadius: '50%',
            background: i <= strength ? 'var(--accent-signal)' : 'rgba(96,125,139,0.25)',
            boxShadow: i <= strength ? '0 0 5px var(--accent-signal)' : 'none',
          }}
        />
      ))}
    </div>
  )
}

export default function AssetCard({ asset, index = 0 }) {
  const navigate   = useNavigate()
  const [hovered, setHovered] = useState(false)
  const hasThreats = asset.status === 'threat_detected' || (asset.violation_count > 0)

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 32, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.07, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      style={{ cursor: 'none', position: 'relative', overflow: 'hidden' }}
      data-cursor="interactive"
      onClick={() => navigate(`/asset/${asset.id}`)}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ y: -4, boxShadow: hasThreats
        ? '0 12px 40px rgba(255,23,68,0.15), 0 0 0 1px rgba(255,23,68,0.25)'
        : '0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,184,212,0.25)',
        transition: { duration: 0.15 },
      }}
    >
      {/* Corner bracket — top left */}
      <motion.div
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.15 }}
        style={{ position: 'absolute', top: 6, left: 6, width: 10, height: 10, zIndex: 5,
          borderTop: '2px solid var(--accent-data)', borderLeft: '2px solid var(--accent-data)', pointerEvents: 'none' }}
      />
      {/* Corner bracket — bottom right */}
      <motion.div
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.15 }}
        style={{ position: 'absolute', bottom: 6, right: 6, width: 10, height: 10, zIndex: 5,
          borderBottom: '2px solid var(--accent-data)', borderRight: '2px solid var(--accent-data)', pointerEvents: 'none' }}
      />

      {/* Thumbnail */}
      <div style={{
        width: '100%', paddingTop: '56.25%',
        background: 'var(--bg-void)', position: 'relative',
        borderBottom: '1px solid var(--border-subtle)',
        overflow: 'hidden',
      }}>
        {asset.thumbnail_url ? (
          <motion.img
            src={asset.thumbnail_url}
            alt={asset.title}
            animate={{ scale: hovered ? 1.06 : 1 }}
            transition={{ duration: 0.4 }}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            <SportThumbnail
              assetId={asset.id}
              title={asset.title}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        )}

        {/* Asset ID badge */}
        <div style={{
          position: 'absolute', top: 8, right: 8,
          background: 'rgba(0,3,8,0.88)', border: '1px solid var(--border-subtle)',
          padding: '2px 7px',
        }}>
          <span className="font-data" style={{ fontSize: 8, color: 'var(--text-code)' }}>{asset.id}</span>
        </div>

        {/* Violation badge — pulsing */}
        {asset.violation_count > 0 && (
          <motion.div
            animate={{ boxShadow: ['0 0 8px rgba(255,23,68,0.6)', '0 0 20px rgba(255,23,68,0.9)', '0 0 8px rgba(255,23,68,0.6)'] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            style={{
              position: 'absolute', top: 8, left: 8,
              background: 'var(--accent-threat)', color: 'var(--bg-void)',
              padding: '2px 7px', fontSize: 9,
              fontFamily: 'Orbitron, sans-serif', fontWeight: 700,
            }}
          >
            {asset.violation_count} ⚠
          </motion.div>
        )}

        {/* Hover overlay */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(0deg, rgba(0,0,0,0.7) 0%, transparent 50%)',
                display: 'flex', alignItems: 'flex-end', padding: '12px',
              }}
            >
              <motion.div
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 4, opacity: 0 }}
                className="font-orbitron"
                style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.16em',
                  color: 'var(--accent-data)',
                  textShadow: '0 0 10px var(--accent-data)',
                }}
              >
                VIEW DETAILS →
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scan line on hover */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ top: '-1px', opacity: 1 }}
              animate={{ top: '102%', opacity: 0.6 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeIn' }}
              style={{
                position: 'absolute', left: 0, right: 0, height: 1, pointerEvents: 'none',
                background: 'linear-gradient(90deg, transparent, rgba(0,184,212,0.8), rgba(255,255,255,0.5), rgba(0,184,212,0.8), transparent)',
                boxShadow: '0 0 10px rgba(0,184,212,0.6)',
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Info */}
      <div style={{ padding: '12px 14px' }}>
        <div className="font-mono" style={{
          fontSize: 12, fontWeight: 600, color: 'var(--text-primary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          marginBottom: 8,
        }}>
          {asset.title}
        </div>

        <div className="flex items-center justify-between mb-8px">
          <StatusBadge status={asset.status} />
          <span className="font-data" style={{ fontSize: 9, color: 'var(--text-secondary)' }}>
            {asset.type?.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center justify-between" style={{ marginTop: 8 }}>
          <FingerprintDots strength={asset.fingerprint_strength || 4} />
          <span className="font-data" style={{ fontSize: 9, color: 'var(--text-secondary)' }}>
            {asset.last_scanned ? formatRelative(asset.last_scanned) : 'Scanning...'}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

function formatRelative(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}
