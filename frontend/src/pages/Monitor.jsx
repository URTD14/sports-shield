import { useEffect, useLayoutEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ThreatCard from '../components/ui/ThreatCard'
import ConfidenceGauge from '../components/ui/ConfidenceGauge'
import StreamingText from '../components/ui/StreamingText'
import SportThumbnail from '../components/ui/SportThumbnail'
import { useStreamSSE } from '../hooks/useStreamSSE'
import useShieldStore from '../store/useShieldStore'
import { getViolations, getViolation, updateViolationStatus, scanMatch } from '../services/api'

// ─── Seed violations for demo feed ───────────────────────────────────────────
const DEMO_VIOLATIONS = [
  // Camera-on-TV LIVE stream pirates (random spam accounts recording TV screen)
  { id: 'VL-001', asset_id: 'SP-IPL-001', asset_title: 'IPL 2026 — RCB vs MI Live Match', platform: 'youtube', confidence: 0.979, detected_at: new Date(Date.now() - 15000).toISOString(), thumbnail_url: 'https://i.ytimg.com/vi/IEpw6y-cCyw/mqdefault.jpg', ai_explanation_preview: 'Camera recording TV screen detected — Star Sports scorebug visible, crowd audio matching. Live re-broadcast in progress.', is_live: true },
  { id: 'VL-002', asset_id: 'SP-IPL-001', asset_title: 'IPL 2026 — KKR vs CSK Full Match', platform: 'youtube', confidence: 0.951, detected_at: new Date(Date.now() - 90000).toISOString(), thumbnail_url: 'https://i.ytimg.com/vi/IEpw6y-cCyw/mqdefault.jpg', ai_explanation_preview: 'Phone camera aimed at television. TV reflection visible in bottom-right corner. Star Sports watermark decoded in 9 frames.', is_live: true },
  // VOD re-uploads
  { id: 'VL-003', asset_id: 'SP-NBA-003', asset_title: 'NBA Playoffs 2026 — OKC Thunder vs Celtics', platform: 'twitter', confidence: 0.913, detected_at: new Date(Date.now() - 180000).toISOString(), thumbnail_url: 'https://i.ytimg.com/vi/HhCKBBGZ3mY/hqdefault.jpg', ai_explanation_preview: 'Court markings + player silhouette pHash distance: 3/64 bits. Color-graded repost.' },
  { id: 'VL-004', asset_id: 'SP-T20-002', asset_title: 'India vs England T20 2026 — Full Match', platform: 'web', confidence: 0.871, detected_at: new Date(Date.now() - 420000).toISOString(), thumbnail_url: 'https://i.ytimg.com/vi/IEpw6y-cCyw/mqdefault.jpg', ai_explanation_preview: 'CLIP embedding cosine similarity 0.91 — portrait crop + watermark burn-in detected' },
  { id: 'VL-005', asset_id: 'SP-IPL-001', asset_title: 'IPL 2026 — MI vs SRH Super Over', platform: 'hotstar', confidence: 0.961, detected_at: new Date(Date.now() - 600000).toISOString(), thumbnail_url: 'https://i.ytimg.com/vi/IEpw6y-cCyw/mqdefault.jpg', ai_explanation_preview: 'Perceptual hash distance: 2/64 — near-identical copy uploaded within 6 min of broadcast' },
  { id: 'VL-006', asset_id: 'SP-POL-001', asset_title: 'Lok Sabha Session 2026 — Budget Debate', platform: 'youtube', confidence: 0.934, detected_at: new Date(Date.now() - 780000).toISOString(), thumbnail_url: 'https://i.ytimg.com/vi/avzufy3tPKw/mqdefault.jpg', ai_explanation_preview: 'Sansad TV lower-third graphic matched. Unauthorized redistribution of parliamentary feed.' },
  { id: 'VL-007', asset_id: 'SP-UCL-001', asset_title: 'UCL 2025-26 QF — Real Madrid vs PSG', platform: 'instagram', confidence: 0.887, detected_at: new Date(Date.now() - 960000).toISOString(), thumbnail_url: 'https://i.ytimg.com/vi/GgKIhlyjX2w/mqdefault.jpg', ai_explanation_preview: 'UEFA scorebug overlay detected in 23 frames. Reel cropped to 9:16 for Instagram.' },
  // Live stream piracy - kabaddi
  { id: 'VL-008', asset_id: 'SP-PKL-003', asset_title: 'Pro Kabaddi League Season 12 Final 2026', platform: 'youtube', confidence: 0.923, detected_at: new Date(Date.now() - 1200000).toISOString(), thumbnail_url: 'https://i.ytimg.com/vi/IEpw6y-cCyw/mqdefault.jpg', ai_explanation_preview: 'Low-quality camera-on-TV re-broadcast. PKL scoreboard overlay matched in 17 keyframes. Audio analysis confirms Star Sports feed.', is_live: true },
]

const FILTERS = ['ALL', 'VIDEO', 'IMAGE', 'HIGH CONFIDENCE', 'UNRESOLVED']

const SCAN_STEPS = [
  { label: 'EXTRACTING FRAMES', duration: 1400 },
  { label: 'GENERATING FINGERPRINT', duration: 1200 },
  { label: 'COMPUTING CLIP EMBEDDINGS', duration: 1600 },
  { label: 'SEARCHING FAISS INDEX', duration: 900 },
  { label: 'RUNNING pHASH COMPARISON', duration: 700 },
  { label: 'DETECTING WATERMARK', duration: 600 },
  { label: 'AGGREGATING CONFIDENCE', duration: 400 },
]

const DEMO_URLS = [
  'https://www.youtube.com/watch?v=IPL2026_pirated',
  'https://www.tiktok.com/@user/video/12345678',
  'https://twitter.com/user/status/987654321',
]

// ─── Scan Panel ──────────────────────────────────────────────────────────────
function ScanPanel({ onMatchFound }) {
  const [url, setUrl] = useState('')
  const [phase, setPhase] = useState('idle') // idle | scanning | matched | not_matched
  const [stepIdx, setStepIdx] = useState(0)
  const [result, setResult] = useState(null)
  const stepTimers = useRef([])

  const clearTimers = () => stepTimers.current.forEach(clearTimeout)

  const runScan = async () => {
    if (!url.trim() && phase === 'idle') {
      setUrl(DEMO_URLS[0])
      return
    }
    const target = url.trim() || DEMO_URLS[0]
    setPhase('scanning')
    setStepIdx(0)
    clearTimers()

    // Animate through steps
    let cumulative = 0
    SCAN_STEPS.forEach((step, i) => {
      const t = setTimeout(() => setStepIdx(i), cumulative)
      stepTimers.current.push(t)
      cumulative += step.duration
    })

    // Run actual API call (or get demo result)
    try {
      const res = await scanMatch({ video_url: target })
      const data = res.data
      // Wait until animation catches up
      const remaining = Math.max(0, cumulative - 800)
      const t = setTimeout(() => {
        setResult(data)
        setPhase(data.matched ? 'matched' : 'not_matched')
        if (data.matched) onMatchFound(data)
      }, remaining)
      stepTimers.current.push(t)
    } catch {
      // Use demo result
      setTimeout(() => {
        const demo = {
          matched: true,
          asset_id: 'SP-IPL-001',
          asset_title: 'IPL 2026 — Live Match Highlights',
          confidence: 0.979,
          phash_distance: 3,
          clip_similarity: 0.976,
          watermark_found: true,
          alterations_detected: ['aspect_ratio_modified_to_portrait', 'color_grade_applied', 'speed_reduced'],
        }
        setResult(demo)
        setPhase('matched')
        onMatchFound(demo)
      }, cumulative)
    }
  }

  const reset = () => {
    clearTimers()
    setPhase('idle')
    setStepIdx(0)
    setResult(null)
    setUrl('')
  }

  return (
    <div style={{ padding: '20px 24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div className="font-data text-xs tracking-widest mb-2" style={{ color: 'var(--accent-data)' }}>
          PIRACY SCANNER
        </div>
        <p className="font-mono" style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Paste any video URL. SportShield extracts frames, computes CLIP embeddings and runs
          multi-layer fingerprint matching against the protected asset index.
        </p>
      </div>

      {/* URL Input */}
      <AnimatePresence mode="wait">
        {phase === 'idle' && (
          <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runScan()}
                placeholder="https://www.youtube.com/watch?v=..."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'var(--bg-void)',
                  border: '1px solid var(--border-active)',
                  color: 'var(--text-primary)',
                  fontFamily: '"Share Tech Mono", monospace',
                  fontSize: 11,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <button
              className="btn btn-threat"
              style={{ width: '100%', padding: '12px', fontSize: 12, letterSpacing: '0.12em' }}
              onClick={runScan}
              data-cursor="interactive"
            >
              {url ? 'SCAN FOR PIRACY →' : 'LOAD DEMO URL + SCAN →'}
            </button>
          </motion.div>
        )}

        {phase === 'scanning' && (
          <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ flex: 1 }}>
            <div className="font-data text-xs tracking-widest mb-4" style={{ color: 'var(--accent-warn)' }}>
              ANALYSIS IN PROGRESS
            </div>
            <div style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: 10, color: 'var(--text-secondary)', wordBreak: 'break-all', marginBottom: 16 }}>
              {url || DEMO_URLS[0]}
            </div>
            {SCAN_STEPS.map((step, i) => (
              <div key={step.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{
                  width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                  border: `1px solid ${i < stepIdx ? 'var(--accent-signal)' : i === stepIdx ? 'var(--accent-data)' : 'var(--border-subtle)'}`,
                  background: i < stepIdx ? 'var(--accent-signal)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.3s',
                }}>
                  {i < stepIdx && <span style={{ color: 'var(--bg-void)', fontSize: 9, fontWeight: 700 }}>✓</span>}
                  {i === stepIdx && (
                    <motion.div
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity }}
                      style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-data)' }}
                    />
                  )}
                </div>
                <span className="font-data" style={{
                  fontSize: 9, letterSpacing: '0.1em',
                  color: i < stepIdx ? 'var(--accent-signal)' : i === stepIdx ? 'var(--accent-data)' : 'var(--text-secondary)',
                  transition: 'color 0.3s',
                }}>
                  {step.label}
                  {i < stepIdx && ' — COMPLETE'}
                </span>
              </div>
            ))}

            {/* Scanning beam */}
            <div style={{ height: 2, background: 'rgba(0,184,212,0.15)', position: 'relative', overflow: 'hidden', marginTop: 16 }}>
              <motion.div
                animate={{ left: ['-10%', '110%'] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                style={{
                  position: 'absolute', top: 0, width: '12%', height: '100%',
                  background: 'linear-gradient(90deg, transparent, var(--accent-data), transparent)',
                }}
              />
            </div>
          </motion.div>
        )}

        {phase === 'matched' && result && (
          <motion.div key="matched" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {/* Alert flash */}
            <motion.div
              initial={{ opacity: 0.4 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              style={{
                position: 'fixed', inset: 0, background: 'var(--accent-threat)',
                pointerEvents: 'none', zIndex: 500,
              }}
            />

            <div style={{
              border: '2px solid var(--accent-threat)',
              padding: 16,
              background: 'rgba(255,23,68,0.05)',
              marginBottom: 16,
              boxShadow: 'var(--glow-threat)',
            }}>
              <div className="font-orbitron font-bold" style={{ fontSize: 14, color: 'var(--accent-threat)', marginBottom: 4, letterSpacing: '0.1em' }}>
                ⚠ UNAUTHORIZED COPY DETECTED
              </div>
              <div className="font-data text-xs" style={{ color: 'var(--text-secondary)' }}>
                Match found against protected asset
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div className="font-data text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>MATCHED ASSET</div>
              <div className="font-mono" style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>
                {result.asset_title}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <MatchStat label="CONFIDENCE" value={`${((result.confidence || 0.942) * 100).toFixed(1)}%`} color="var(--accent-threat)" />
              <MatchStat label="HASH DIST" value={`${result.phash_distance ?? 3}/64 bits`} color="var(--accent-warn)" />
              <MatchStat label="CLIP SIM" value={`${((result.clip_similarity || 0.941) * 100).toFixed(1)}%`} color="var(--accent-data)" />
              <MatchStat label="WATERMARK" value={result.watermark_found ? 'FOUND ✓' : 'NOT FOUND'} color={result.watermark_found ? 'var(--accent-signal)' : 'var(--text-secondary)'} />
            </div>

            {result.alterations_detected?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div className="font-data text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>ALTERATIONS DETECTED</div>
                {result.alterations_detected.map((alt) => (
                  <div key={alt} className="font-data text-xs" style={{ color: 'var(--accent-warn)', marginBottom: 4 }}>
                    ▸ {alt.replace(/_/g, ' ')}
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                className="btn btn-threat"
                style={{ width: '100%', padding: '10px', fontSize: 11 }}
                onClick={() => window.open(`/violation/VL-001?action=dmca`, '_self')}
                data-cursor="interactive"
              >
                GENERATE DMCA TAKEDOWN →
              </button>
              <button
                className="btn btn-ghost"
                style={{ width: '100%', padding: '8px', fontSize: 10 }}
                onClick={reset}
                data-cursor="interactive"
              >
                SCAN ANOTHER URL
              </button>
            </div>
          </motion.div>
        )}

        {phase === 'not_matched' && (
          <motion.div key="no-match" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{
              border: '1px solid var(--accent-signal)',
              padding: 16,
              background: 'rgba(0,255,65,0.04)',
              marginBottom: 16,
            }}>
              <div className="font-orbitron font-bold" style={{ fontSize: 13, color: 'var(--accent-signal)', letterSpacing: '0.1em' }}>
                ✓ NO VIOLATIONS FOUND
              </div>
              <div className="font-data text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                Content does not match any protected assets
              </div>
            </div>
            <button className="btn btn-ghost" style={{ width: '100%', padding: '8px', fontSize: 10 }} onClick={reset} data-cursor="interactive">
              SCAN ANOTHER URL
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MatchStat({ label, value, color }) {
  return (
    <div style={{ padding: '10px 12px', border: '1px solid var(--border-subtle)', background: 'var(--bg-void)' }}>
      <div className="font-data" style={{ fontSize: 8, color: 'var(--text-secondary)', letterSpacing: '0.1em', marginBottom: 4 }}>{label}</div>
      <div className="font-orbitron font-bold" style={{ fontSize: 13, color }}>{value}</div>
    </div>
  )
}

// ─── Violation Detail Panel ───────────────────────────────────────────────────
function DetailPanel({ selected, onClose }) {
  const navigate = useNavigate()
  const [fullViolation, setFullViolation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const dmca = useStreamSSE()

  useEffect(() => {
    if (!selected) return
    setFullViolation(null)
    setLoading(true)

    getViolation(selected.id)
      .then((res) => setFullViolation(res.data))
      .catch(() => setFullViolation(null))
      .finally(() => setLoading(false))
  }, [selected?.id])

  const handleMarkResolved = async () => {
    if (!selected || statusUpdating) return
    setStatusUpdating(true)
    try {
      await updateViolationStatus(selected.id, 'resolved')
    } catch { /* demo mode */ }
    setStatusUpdating(false)
  }

  const handleDMCA = () => {
    if (!selected) return
    dmca.startStream('/api/violations/dmca', { violation_id: selected.id })
  }

  const v = fullViolation || selected
  const conf = (v?.confidence || 0.9) * 100
  const explanation = fullViolation?.ai_explanation || selected?.ai_explanation_preview || ''

  const signals = fullViolation ? [
    { label: 'Frame Similarity', value: Math.round((fullViolation.frame_similarity || conf / 100) * 100) },
    { label: 'pHash Distance', value: Math.round(Math.max(0, 1 - (fullViolation.phash_distance || 3) / 64) * 100) },
    { label: 'CLIP Cosine Similarity', value: Math.round((fullViolation.clip_similarity || conf / 100) * 100) },
  ] : []

  return (
    <motion.div
      key={selected?.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.25 }}
      style={{ padding: '20px 24px', height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 0 }}
      className="scroll-area"
    >
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div className="font-data text-xs tracking-widest mb-1" style={{ color: 'var(--text-secondary)' }}>
          VIOLATION {v?.id}
        </div>
        <div className="font-mono font-semibold" style={{ color: 'var(--text-primary)', fontSize: 13 }}>
          {v?.asset_title || 'Unknown Asset'}
        </div>
        <div className="font-data text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
          {(v?.platform || '').toUpperCase()} · {v?.detected_at ? new Date(v.detected_at).toLocaleTimeString() : ''}
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div style={{ marginBottom: 16 }}>
          <div className="scanning-bar" style={{ width: '100%', height: 2 }} />
          <div className="font-data text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>FETCHING VIOLATION DETAILS...</div>
        </div>
      )}

      {/* Confidence */}
      <div className="flex items-center gap-6 mb-4">
        <ConfidenceGauge value={conf} size={110} />
        <div style={{ flex: 1 }}>
          {signals.map((sig) => (
            <div key={sig.label} style={{ marginBottom: 8 }}>
              <div className="flex justify-between mb-1">
                <span className="font-data" style={{ fontSize: 9, color: 'var(--text-secondary)' }}>{sig.label}</span>
                <span className="font-data" style={{ fontSize: 9, color: sig.value >= 85 ? 'var(--accent-threat)' : 'var(--accent-data)' }}>{sig.value}%</span>
              </div>
              <div style={{ height: 2, background: 'rgba(96,125,139,0.2)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${sig.value}%` }}
                  transition={{ duration: 0.7 }}
                  style={{ height: '100%', background: sig.value >= 85 ? 'var(--accent-threat)' : 'var(--accent-data)' }}
                />
              </div>
            </div>
          ))}
          {fullViolation && (
            <div className="flex items-center gap-2 mt-1">
              <div style={{
                width: 7, height: 7, borderRadius: '50%',
                background: fullViolation.watermark_found ? 'var(--accent-signal)' : 'var(--accent-threat)',
              }} />
              <span className="font-data" style={{ fontSize: 9, color: 'var(--text-secondary)' }}>
                Watermark: {fullViolation.watermark_found ? 'FOUND' : 'NOT FOUND'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Thumbnails */}
      <div className="grid gap-2 mb-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div>
          <div className="font-data text-xs mb-1" style={{ color: 'var(--accent-signal)' }}>ORIGINAL</div>
          <div style={{ height: 72, border: '2px solid var(--accent-signal)', overflow: 'hidden', background: 'var(--bg-void)' }}>
            {v?.thumbnail_url ? (
              <img src={v.thumbnail_url} alt="original" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { e.target.style.display='none' }} />
            ) : (
              <SportThumbnail assetId={selected?.asset_id} title={selected?.asset_title} modified={false}
                style={{ width: '100%', height: '100%' }} />
            )}
          </div>
        </div>
        <div>
          <div className="font-data text-xs mb-1" style={{ color: 'var(--accent-threat)' }}>UNAUTHORIZED COPY</div>
          <div style={{ height: 72, border: '2px solid var(--accent-threat)', overflow: 'hidden', background: 'var(--bg-void)', position: 'relative' }}>
            {v?.thumbnail_url ? (
              <>
                <img src={v.thumbnail_url} alt="pirated copy" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'hue-rotate(12deg) saturate(1.3) brightness(0.9)', transform: 'scale(1.05)' }}
                  onError={(e) => { e.target.style.display='none' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,23,68,0.12)', pointerEvents: 'none' }} />
              </>
            ) : (
              <SportThumbnail assetId={selected?.asset_id} title={selected?.asset_title} modified={true}
                style={{ width: '100%', height: '100%' }} />
            )}
          </div>
        </div>
      </div>

      {/* AI Explanation */}
      {explanation && (
        <div style={{
          background: 'rgba(138,180,248,0.04)',
          border: '1px solid rgba(138,180,248,0.2)',
          padding: 12,
          marginBottom: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{ color: 'var(--accent-gemini)', fontSize: 12 }}>✦</span>
            <span className="font-data" style={{ fontSize: 9, letterSpacing: '0.12em', color: 'var(--accent-gemini)' }}>AI ANALYSIS</span>
          </div>
          <StreamingText text={explanation} streaming={false} />
        </div>
      )}

      {/* DMCA streaming panel */}
      {(dmca.text || dmca.streaming) && (
        <div style={{
          background: 'var(--bg-void)',
          border: '1px solid var(--border-subtle)',
          padding: 12,
          marginBottom: 12,
          fontFamily: '"Share Tech Mono", monospace',
          fontSize: 9,
          color: 'var(--text-primary)',
          lineHeight: 1.8,
          maxHeight: 160,
          overflow: 'auto',
          whiteSpace: 'pre-wrap',
        }} className="scroll-area">
          {dmca.text}
          {dmca.streaming && (
            <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }} style={{ color: 'var(--accent-gemini)' }}>|</motion.span>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto', paddingTop: 8 }}>
        {!dmca.text && !dmca.streaming ? (
          <button
            className="btn btn-threat"
            style={{ width: '100%', padding: '9px', fontSize: 10 }}
            onClick={handleDMCA}
            data-cursor="interactive"
          >
            GENERATE DMCA NOTICE
          </button>
        ) : dmca.done && (
          <button
            className="btn btn-signal"
            style={{ width: '100%', padding: '9px', fontSize: 10 }}
            onClick={() => navigate(`/violation/${selected.id}?action=dmca`)}
            data-cursor="interactive"
          >
            OPEN FULL DMCA EDITOR →
          </button>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button
            className="btn btn-signal"
            style={{ padding: '8px', fontSize: 10, opacity: statusUpdating ? 0.6 : 1 }}
            onClick={handleMarkResolved}
            disabled={statusUpdating}
            data-cursor="interactive"
          >
            MARK RESOLVED
          </button>
          <button
            className="btn btn-ghost"
            style={{ padding: '8px', fontSize: 10 }}
            onClick={() => navigate(`/violation/${selected.id}`)}
            data-cursor="interactive"
          >
            FULL DETAILS →
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main Monitor Component ───────────────────────────────────────────────────
export default function Monitor() {
  const navigate = useNavigate()
  const [violations, setViolations] = useState(DEMO_VIOLATIONS)
  const [filter, setFilter] = useState('ALL')
  const [selected, setSelected] = useState(null)
  const [isFlashing, setIsFlashing] = useState(false)
  const [rightMode, setRightMode] = useState('detail') // 'detail' | 'scan'
  const { liveViolations } = useShieldStore()
  const feedRef = useRef(null)
  const timerRef = useRef(null)
  // Saves scroll state just before a prepend so we can restore it after render
  const scrollSaveRef = useRef(null)

  // After every violations state change, if the user was scrolled down,
  // adjust scrollTop by the height the new card pushed things down.
  useLayoutEffect(() => {
    const el = feedRef.current
    const saved = scrollSaveRef.current
    if (!el || !saved) return
    if (saved.top > 8) {
      el.scrollTop = saved.top + (el.scrollHeight - saved.height)
    }
    scrollSaveRef.current = null
  }, [violations])

  // Helper: prepend a violation while preserving scroll position
  const prependViolation = useCallback((newV) => {
    if (feedRef.current) {
      scrollSaveRef.current = {
        top: feedRef.current.scrollTop,
        height: feedRef.current.scrollHeight,
      }
    }
    setViolations((prev) => {
      if (prev.some((v) => v.id === newV.id)) return prev
      return [newV, ...prev.slice(0, 49)]
    })
  }, [])

  // Load real violations from API on mount
  useEffect(() => {
    getViolations({ limit: 20 })
      .then((res) => {
        const apiViolations = res.data.violations || []
        setViolations((prev) => {
          const ids = new Set(apiViolations.map((v) => v.id))
          const demoOnly = prev.filter((v) => !ids.has(v.id))
          return [...apiViolations, ...demoOnly]
        })
      })
      .catch(() => {/* keep demo violations */})
  }, [])

  // Demo simulator: new violations every 8-15s
  useEffect(() => {
    const simulateNext = () => {
      const delay = 8000 + Math.random() * 7000
      timerRef.current = setTimeout(() => {
        const base = DEMO_VIOLATIONS[Math.floor(Math.random() * DEMO_VIOLATIONS.length)]
        const newV = {
          ...base,
          id: `VL-LIVE-${Date.now()}`,
          detected_at: new Date().toISOString(),
          confidence: 0.75 + Math.random() * 0.22,
          isNew: true,
        }
        prependViolation(newV)
        if (newV.confidence > 0.9) {
          setIsFlashing(true)
          setTimeout(() => setIsFlashing(false), 600)
        }
        simulateNext()
      }, delay)
    }
    simulateNext()
    return () => clearTimeout(timerRef.current)
  }, [prependViolation])

  // Pick up socket violations
  useEffect(() => {
    if (liveViolations.length === 0) return
    const latest = liveViolations[0]
    const mapped = {
      id: latest.violation_id,
      asset_title: latest.asset_title || 'Unknown Asset',
      platform: latest.platform,
      confidence: latest.confidence || 0.9,
      detected_at: new Date().toISOString(),
      isNew: true,
      thumbnail_url: latest.thumbnail_url || null,
      infringing_title: latest.infringing_title || null,
      channel: latest.channel || null,
      view_count: latest.view_count || null,
      phash_distance: latest.phash_distance || null,
      is_live: latest.is_live || false,
      ai_explanation_preview: latest.infringing_title
        ? `pHash match: "${latest.infringing_title.slice(0, 55)}..."`
        : latest.ai_explanation_preview || null,
    }
    prependViolation(mapped)
  }, [liveViolations, prependViolation])

  const handleMatchFound = useCallback((result) => {
    // Create a synthetic violation entry from scan result
    const synth = {
      id: 'VL-001',
      asset_title: result.asset_title || 'IPL 2026 — Live Match Highlights',
      platform: 'youtube',
      confidence: result.confidence || 0.942,
      detected_at: new Date().toISOString(),
      isNew: true,
      ai_explanation_preview: 'Scan match: multi-layer fingerprint confirmed',
    }
    prependViolation(synth)
    setSelected(synth)
    setRightMode('detail')
    setIsFlashing(true)
    setTimeout(() => setIsFlashing(false), 800)
  }, [])

  const filtered = violations.filter((v) => {
    if (filter === 'HIGH CONFIDENCE') return v.confidence >= 0.85
    if (filter === 'UNRESOLVED') return !v.status || v.status === 'pending'
    return true
  })

  return (
    <div style={{
      paddingTop: 80,
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: '60% 40%',
    }}>
      {/* Flash overlay */}
      <AnimatePresence>
        {isFlashing && (
          <motion.div
            initial={{ opacity: 0.35 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
            style={{ position: 'fixed', inset: 0, background: 'var(--accent-threat)', pointerEvents: 'none', zIndex: 500 }}
          />
        )}
      </AnimatePresence>

      {/* LEFT: Live feed */}
      <div style={{
        borderRight: '1px solid var(--border-subtle)',
        height: 'calc(100vh - 80px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="live-dot" />
            <span className="font-orbitron font-bold" style={{ fontSize: 13, letterSpacing: '0.12em', color: 'var(--accent-threat)' }}>
              LIVE THREAT FEED
            </span>
            <span className="font-data" style={{ fontSize: 9, color: 'var(--text-secondary)', marginLeft: 4 }}>
              {filtered.length} ACTIVE
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="font-data text-xs" style={{ color: 'var(--text-secondary)' }}>
              {new Date().toLocaleTimeString()}
            </span>
            <button
              className="btn"
              style={{
                padding: '4px 12px',
                fontSize: 9,
                background: rightMode === 'scan' ? 'rgba(255,23,68,0.15)' : 'transparent',
                border: `1px solid ${rightMode === 'scan' ? 'var(--accent-threat)' : 'var(--border-subtle)'}`,
                color: rightMode === 'scan' ? 'var(--accent-threat)' : 'var(--text-secondary)',
                letterSpacing: '0.1em',
              }}
              onClick={() => setRightMode(rightMode === 'scan' ? 'detail' : 'scan')}
              data-cursor="interactive"
            >
              {rightMode === 'scan' ? '✕ CLOSE SCANNER' : '⊕ SCAN URL'}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{
          padding: '8px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          gap: 8,
          flexShrink: 0,
        }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              className="font-data"
              data-cursor="interactive"
              onClick={() => setFilter(f)}
              style={{
                padding: '3px 10px',
                fontSize: 9,
                letterSpacing: '0.1em',
                border: `1px solid ${filter === f ? 'var(--accent-data)' : 'var(--border-subtle)'}`,
                background: filter === f ? 'rgba(0,184,212,0.1)' : 'transparent',
                color: filter === f ? 'var(--accent-data)' : 'var(--text-secondary)',
                cursor: 'none',
                transition: 'all 0.15s',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Feed */}
        <div ref={feedRef} className="scroll-area" style={{ flex: 1, padding: '12px 24px' }}>
          <AnimatePresence initial={false}>
            {filtered.map((v, i) => (
              <ThreatCard
                key={v.id}
                violation={v}
                index={i}
                isNew={v.isNew}
                onClick={() => { setSelected(v); setRightMode('detail') }}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* RIGHT: Detail or Scan panel */}
      <div style={{ height: 'calc(100vh - 80px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <AnimatePresence mode="wait">
          {rightMode === 'scan' ? (
            <motion.div
              key="scan"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              style={{ flex: 1, overflow: 'hidden' }}
            >
              {/* Scan panel header */}
              <div style={{
                padding: '16px 24px',
                borderBottom: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'var(--accent-threat)', fontSize: 14 }}>⊕</span>
                  <span className="font-orbitron font-bold" style={{ fontSize: 13, letterSpacing: '0.1em', color: 'var(--accent-threat)' }}>
                    PIRACY SCANNER
                  </span>
                </div>
              </div>
              <div style={{ flex: 1, overflow: 'auto' }} className="scroll-area">
                <ScanPanel onMatchFound={handleMatchFound} />
              </div>
            </motion.div>
          ) : selected ? (
            <motion.div
              key={`detail-${selected.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            >
              {/* Detail panel header */}
              <div style={{
                padding: '16px 24px',
                borderBottom: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
              }}>
                <span className="font-orbitron font-bold" style={{ fontSize: 12, letterSpacing: '0.1em' }}>VIOLATION INSPECTOR</span>
                <button
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 14, cursor: 'none', padding: 4 }}
                  onClick={() => setSelected(null)}
                  data-cursor="interactive"
                >✕</button>
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <DetailPanel selected={selected} onClose={() => setSelected(null)} />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 20,
                padding: 24,
              }}
            >
              <div style={{ fontSize: 48, opacity: 0.15 }}>◎</div>
              <div className="font-data text-xs tracking-widest" style={{ color: 'var(--text-secondary)' }}>
                SELECT A VIOLATION TO INSPECT
              </div>
              <button
                className="btn btn-threat"
                style={{ padding: '10px 20px', fontSize: 10, marginTop: 8 }}
                onClick={() => setRightMode('scan')}
                data-cursor="interactive"
              >
                ⊕ SCAN A URL FOR PIRACY
              </button>
              <button
                className="btn btn-ghost"
                style={{ padding: '8px 20px', fontSize: 10 }}
                onClick={() => navigate('/demo')}
                data-cursor="interactive"
              >
                LAUNCH 90s DEMO →
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
