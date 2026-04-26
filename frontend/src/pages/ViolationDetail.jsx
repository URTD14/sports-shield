import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import ConfidenceGauge from '../components/ui/ConfidenceGauge'
import StreamingText from '../components/ui/StreamingText'
import { useStreamSSE } from '../hooks/useStreamSSE'
import StatusBadge from '../components/ui/StatusBadge'
import SportThumbnail from '../components/ui/SportThumbnail'
import { getViolation, updateViolationStatus, getViolationReport } from '../services/api'

// Fallback thumbnail map for known sample assets (used when API doesn't return asset_thumbnail_url)
const ASSET_THUMBNAILS = {
  'SP-IPL-001': 'https://i.ytimg.com/vi/IEpw6y-cCyw/mqdefault.jpg',
  'SP-T20-002': 'https://i.ytimg.com/vi/IEpw6y-cCyw/mqdefault.jpg',
  'SP-PKL-003': 'https://i.ytimg.com/vi/IEpw6y-cCyw/mqdefault.jpg',
  'SP-UCL-001': 'https://i.ytimg.com/vi/GgKIhlyjX2w/mqdefault.jpg',
  'SP-EPL-002': 'https://i.ytimg.com/vi/GgKIhlyjX2w/mqdefault.jpg',
  'SP-NBA-003': 'https://i.ytimg.com/vi/HhCKBBGZ3mY/hqdefault.jpg',
  'SP-POL-001': 'https://i.ytimg.com/vi/avzufy3tPKw/mqdefault.jpg',
  'SP-POL-002': 'https://i.ytimg.com/vi/avzufy3tPKw/mqdefault.jpg',
  'SP-POL-003': 'https://i.ytimg.com/vi/avzufy3tPKw/mqdefault.jpg',
  'SP-IMG-005': 'https://i.ytimg.com/vi/XqZsoesa55w/hqdefault.jpg',
}

const DEMO_VIOLATION = {
  id: 'VL-001',
  asset_id: 'SP-UCL-001',
  asset_title: 'UEFA Champions League Final 2025 — PSG vs Arsenal',
  platform: 'YouTube',
  infringing_url: 'https://www.youtube.com/watch?v=████████',
  detected_at: '2025-06-01T09:12:00Z',
  confidence: 0.942,
  status: 'pending',
  phash_distance: 3,
  clip_similarity: 0.941,
  frame_similarity: 0.96,
  watermark_found: true,
  alterations_detected: [
    'Aspect ratio modified: 16:9 → 9:16 (portrait crop)',
    'Color saturation increased by ~38%',
    'Playback speed reduced to 0.85x',
    'Audio track replaced entirely',
  ],
  ai_explanation: null,
  dmca_letter: null,
  asset_sha256: 'a3f8d2c19b7e4f0a6d5c3b2e1f9a8d7c6b5a4e3f2d1c0b9a8f7e6d5c4b3a2f1',
  watermark_id: 'WM-UCL-001-20250531',
  rights_holder: 'UEFA Media Rights',
  asset_uploaded_at: '2025-05-31T21:15:00Z',
}

function buildSignals(v) {
  const conf = v.confidence || 0.942
  return [
    { label: 'Visual Frame Similarity', value: Math.round((v.frame_similarity || conf * 1.02) * 100) },
    { label: 'Perceptual Hash Distance', value: Math.round(Math.max(0, 1 - (v.phash_distance || 3) / 64) * 100) },
    { label: 'CLIP Embedding Cosine Similarity', value: Math.round((v.clip_similarity || conf) * 100) },
    { label: 'Watermark Detection', value: v.watermark_found ? 100 : 0, found: v.watermark_found },
  ]
}

function buildTimeline(v) {
  const events = []
  if (v.asset_uploaded_at) {
    events.push({ event: 'Asset Protected', time: v.asset_uploaded_at, color: 'var(--accent-signal)' })
  }
  if (v.detected_at) {
    events.push({ event: 'Violation Detected', time: v.detected_at, color: 'var(--accent-threat)' })
  }
  if (v.dmca_submitted_at) {
    events.push({ event: 'DMCA Submitted', time: v.dmca_submitted_at, color: 'var(--accent-warn)' })
  }
  if (v.resolved_at) {
    events.push({ event: 'Resolved', time: v.resolved_at, color: 'var(--accent-signal)' })
  }
  return events.length > 0 ? events : [
    { event: 'Asset Protected', time: '2025-05-31T21:15:00Z', color: 'var(--accent-signal)' },
    { event: 'Violation Detected', time: '2025-06-01T09:12:00Z', color: 'var(--accent-threat)' },
    { event: 'AI Analysis Completed', time: '2025-06-01T09:12:11Z', color: 'var(--accent-gemini)' },
  ]
}

export default function ViolationDetail() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [sliderX, setSliderX] = useState(50)
  const [violation, setViolation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [statusUpdating, setStatusUpdating] = useState(false)

  const explanation = useStreamSSE()
  const dmca = useStreamSSE()

  // Load violation from API
  useEffect(() => {
    const load = async () => {
      try {
        const res = await getViolation(id)
        setViolation(res.data)
      } catch {
        setViolation({ ...DEMO_VIOLATION, id })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  // Auto-trigger DMCA generation if coming from action=dmca
  useEffect(() => {
    if (!violation || loading) return
    if (searchParams.get('action') === 'dmca' && !dmca.text && !dmca.streaming) {
      setTimeout(() => handleGenerateDMCA(), 600)
    }
  }, [violation, loading])

  const handleSlider = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    setSliderX(Math.max(5, Math.min(95, x)))
  }

  const handleGenerateExplanation = () => {
    if (!violation) return
    explanation.startStream('/api/violations/explain', { violation_id: violation.id })
  }

  const handleGenerateDMCA = () => {
    if (!violation) return
    dmca.startStream('/api/violations/dmca', { violation_id: violation.id })
  }

  const handleStatusUpdate = async (status) => {
    if (!violation || statusUpdating) return
    setStatusUpdating(true)
    try {
      await updateViolationStatus(violation.id, status)
      setViolation((prev) => ({ ...prev, status }))
    } catch (err) {
      console.error('Status update failed:', err)
    } finally {
      setStatusUpdating(false)
    }
  }

  const handleDownloadReport = async () => {
    if (!violation) return
    try {
      const res = await getViolationReport(violation.id)
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `violation-${violation.id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Report download failed:', err)
    }
  }

  const handleCopyDMCA = () => {
    const text = dmca.text || violation?.dmca_letter || ''
    if (text) navigator.clipboard.writeText(text)
  }

  if (loading) {
    return (
      <div style={{ paddingTop: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="scanning-bar" style={{ width: 200 }} />
      </div>
    )
  }

  const v = violation
  const conf = v.confidence || 0.942
  const confPct = conf * 100
  const signals = buildSignals(v)
  const timeline = buildTimeline(v)
  const alterations = v.alterations_detected || DEMO_VIOLATION.alterations_detected
  const sha256 = v.asset_sha256 || v.sha256 || DEMO_VIOLATION.asset_sha256
  const wmId = v.watermark_id || DEMO_VIOLATION.watermark_id
  const rightsHolder = v.rights_holder || DEMO_VIOLATION.rights_holder

  // While streaming, show only the live text (so cursor blinks even before first char).
  // When not streaming, fall back to the cached DB value.
  const explanationText = explanation.streaming
    ? explanation.text
    : explanation.text || (v.ai_explanation ? v.ai_explanation : '')
  const dmcaText = dmca.streaming
    ? dmca.text
    : dmca.text || (v.dmca_letter ? v.dmca_letter : '')

  return (
    <div style={{ paddingTop: 80, paddingBottom: 40 }}>

      {/* Comparison hero */}
      <div style={{ borderBottom: '1px solid var(--border-subtle)', padding: '24px 40px' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-data text-xs tracking-widest mb-1" style={{ color: 'var(--text-secondary)' }}>
              VIOLATION {v.id}
            </div>
            <h1 className="font-orbitron font-bold" style={{ fontSize: 18, letterSpacing: '0.06em' }}>
              {v.asset_title || DEMO_VIOLATION.asset_title}
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <StatusBadge status={v.status} />
            <button
              className="btn btn-ghost"
              style={{ padding: '6px 14px', fontSize: 10 }}
              onClick={() => navigate(-1)}
              data-cursor="interactive"
            >
              ← BACK
            </button>
          </div>
        </div>

        {/* Comparison slider */}
        <div
          style={{
            position: 'relative', height: 240, overflow: 'hidden',
            border: '1px solid var(--border-subtle)', cursor: 'ew-resize',
          }}
          onMouseMove={handleSlider}
        >
          {/* Original — use asset thumbnail from API or fallback map */}
          {(() => {
            const origThumb = v.asset_thumbnail_url || ASSET_THUMBNAILS[v.asset_id]
            return (
              <div style={{ position: 'absolute', inset: 0, border: '2px solid var(--accent-signal)', overflow: 'hidden' }}>
                {origThumb ? (
                  <img src={origThumb} alt="original"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                ) : (
                  <SportThumbnail assetId={v.asset_id} title={v.asset_title} modified={false}
                    style={{ width: '100%', height: '100%' }} />
                )}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0,
                  padding: '6px 10px', background: 'rgba(0,0,0,0.7)' }}>
                  <span className="font-data" style={{ fontSize: 9, color: 'var(--accent-signal)', letterSpacing: '0.1em' }}>
                    ORIGINAL — OFFICIAL · {rightsHolder}
                  </span>
                </div>
              </div>
            )
          })()}

          {/* Unauthorized — use violation's YouTube thumbnail with distortion filter */}
          {(() => {
            const infrThumb = v.thumbnail_url
            return (
              <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 0 0 ${sliderX}%)`,
                border: '2px solid var(--accent-threat)', overflow: 'hidden' }}>
                {infrThumb ? (
                  <>
                    <img src={infrThumb} alt="unauthorized"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                        filter: 'hue-rotate(10deg) saturate(1.35) brightness(0.88)',
                        transform: 'scale(1.06)' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,23,68,0.10)' }} />
                  </>
                ) : (
                  <SportThumbnail assetId={v.asset_id} title={v.asset_title} modified={true}
                    style={{ width: '100%', height: '100%' }} />
                )}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0,
                  padding: '6px 10px', background: 'rgba(0,0,0,0.7)' }}>
                  <span className="font-data" style={{ fontSize: 9, color: 'var(--accent-threat)', letterSpacing: '0.1em' }}>
                    UNAUTHORIZED · {(v.platform || '').toUpperCase()} · {confPct.toFixed(1)}% Match
                  </span>
                </div>
              </div>
            )
          })()}

          {/* Divider */}
          <div style={{
            position: 'absolute', top: 0, bottom: 0, left: `${sliderX}%`,
            width: 2, background: 'var(--accent-data)', boxShadow: 'var(--glow-data)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 28, height: 28, background: 'var(--accent-data)', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--bg-void)', fontSize: 12, flexShrink: 0,
            }}>⟺</div>
          </div>
        </div>

        <div className="font-data text-xs text-center mt-2" style={{ color: 'var(--text-secondary)' }}>DRAG TO COMPARE</div>
      </div>

      <div style={{ padding: '32px 40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>

        {/* LEFT column */}
        <div>
          {/* Match confidence */}
          <section style={{ marginBottom: 32 }}>
            <SectionHeader title="MATCH CONFIDENCE BREAKDOWN" />
            <div className="card" style={{ padding: 24 }}>
              <div className="flex items-start gap-8">
                <ConfidenceGauge value={confPct} size={140} />
                <div style={{ flex: 1 }}>
                  {signals.map((sig, i) => (
                    <div key={sig.label} style={{ marginBottom: 12 }}>
                      <div className="flex justify-between mb-1">
                        <span className="font-data" style={{ fontSize: 9, color: 'var(--text-secondary)', letterSpacing: '0.08em' }}>
                          {sig.label}
                        </span>
                        <span className="font-orbitron" style={{ fontSize: 10, color: sig.value >= 85 ? 'var(--accent-threat)' : 'var(--accent-warn)', fontWeight: 700 }}>
                          {sig.found !== undefined ? (sig.found ? 'FOUND' : 'NOT FOUND') : `${sig.value}%`}
                        </span>
                      </div>
                      {sig.found === undefined && (
                        <div style={{ height: 2, background: 'rgba(96,125,139,0.2)', overflow: 'hidden' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${sig.value}%` }}
                            transition={{ duration: 0.8, delay: i * 0.15 }}
                            style={{ height: '100%', background: sig.value >= 85 ? 'var(--accent-threat)' : sig.value >= 60 ? 'var(--accent-warn)' : 'var(--accent-data)' }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Alterations */}
          <section style={{ marginBottom: 32 }}>
            <SectionHeader title="ALTERATIONS DETECTED" />
            <div className="card" style={{ padding: 20 }}>
              {alterations.map((alt, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                  <span style={{ color: 'var(--accent-warn)', flexShrink: 0 }}>▸</span>
                  <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {typeof alt === 'string' ? alt.replace(/_/g, ' ') : alt}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Ownership proof */}
          <section style={{ marginBottom: 32 }}>
            <SectionHeader title="OWNERSHIP PROOF" />
            <div className="card" style={{ padding: 20 }}>
              <div style={{ marginBottom: 12 }}>
                <div className="font-data text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>SHA-256 FINGERPRINT</div>
                <div className="hash-text" style={{ wordBreak: 'break-all', fontSize: 10, lineHeight: 1.6 }}>
                  {sha256}
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div className="font-data text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>WATERMARK ID</div>
                <div className="hash-text" style={{ fontSize: 10 }}>{wmId}</div>
              </div>
              <button
                className="btn btn-signal"
                style={{ width: '100%', padding: '8px', fontSize: 10 }}
                onClick={handleDownloadReport}
                data-cursor="interactive"
              >
                ↓ DOWNLOAD VIOLATION REPORT (PDF)
              </button>
            </div>
          </section>

          {/* Violation timeline */}
          <section>
            <SectionHeader title="VIOLATION TIMELINE" />
            <div className="card" style={{ padding: 20 }}>
              {timeline.map((event, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, marginBottom: i < timeline.length - 1 ? 16 : 0, position: 'relative' }}>
                  {i < timeline.length - 1 && (
                    <div style={{ position: 'absolute', left: 6, top: 14, bottom: -16, width: 1, background: 'var(--border-subtle)' }} />
                  )}
                  <div style={{
                    width: 12, height: 12, borderRadius: '50%', background: event.color,
                    boxShadow: `0 0 6px ${event.color}`, flexShrink: 0, marginTop: 2,
                  }} />
                  <div>
                    <div className="font-mono text-xs" style={{ color: 'var(--text-primary)' }}>{event.event}</div>
                    <div className="font-data" style={{ fontSize: 9, color: 'var(--text-secondary)', marginTop: 1 }}>
                      {new Date(event.time).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* RIGHT column */}
        <div>
          {/* AI Explanation */}
          <section style={{ marginBottom: 32 }}>
            <SectionHeader title="WHY THIS WAS FLAGGED" gemini />
            <div style={{
              background: 'rgba(138,180,248,0.04)',
              border: '1px solid rgba(138,180,248,0.2)',
              padding: 20,
              boxShadow: '0 0 30px rgba(138,180,248,0.05)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'var(--accent-gemini)', fontSize: 16 }}>✦</span>
                  <span className="font-data text-xs tracking-widest" style={{ color: 'var(--accent-gemini)' }}>
                    AI FORENSIC ANALYSIS
                  </span>
                  {explanation.streaming && (
                    <motion.span
                      animate={{ opacity: [1, 0.3] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className="font-data"
                      style={{ fontSize: 9, color: 'var(--accent-gemini)' }}
                    >
                      GENERATING...
                    </motion.span>
                  )}
                </div>
                {!explanation.streaming && (
                  <button
                    className="btn btn-ghost"
                    style={{ padding: '4px 10px', fontSize: 9, borderColor: 'rgba(138,180,248,0.3)', color: 'var(--accent-gemini)' }}
                    onClick={handleGenerateExplanation}
                    data-cursor="interactive"
                  >
                    {explanationText ? '↺ REGENERATE' : '✦ ANALYZE'}
                  </button>
                )}
              </div>

              {(explanationText || explanation.streaming) ? (
                <StreamingText text={explanationText} streaming={explanation.streaming} />
              ) : (
                <div
                  style={{ color: 'var(--text-secondary)', fontFamily: '"Share Tech Mono", monospace', fontSize: 11, lineHeight: 1.7, cursor: 'none' }}
                  data-cursor="interactive"
                  onClick={handleGenerateExplanation}
                >
                  Click ANALYZE to generate AI forensic analysis...
                </div>
              )}
            </div>
          </section>

          {/* Legal response */}
          <section style={{ marginBottom: 32 }}>
            <SectionHeader title="AUTOMATED LEGAL RESPONSE" />
            <div className="card" style={{ padding: 20 }}>
              {!dmcaText && !dmca.streaming ? (
                <button
                  className="btn btn-threat"
                  style={{ width: '100%', padding: '12px', fontSize: 12 }}
                  onClick={handleGenerateDMCA}
                  data-cursor="interactive"
                >
                  GENERATE DMCA TAKEDOWN NOTICE
                </button>
              ) : (
                <>
                  <div
                    style={{
                      background: 'var(--bg-void)',
                      border: '1px solid var(--border-subtle)',
                      padding: 16,
                      fontFamily: '"Share Tech Mono", monospace',
                      fontSize: 10,
                      color: 'var(--text-primary)',
                      lineHeight: 1.8,
                      maxHeight: 320,
                      overflow: 'auto',
                      marginBottom: 12,
                      whiteSpace: 'pre-wrap',
                    }}
                    className="scroll-area"
                  >
                    {dmcaText}
                    {dmca.streaming && (
                      <motion.span
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                        style={{ color: 'var(--accent-gemini)' }}
                      >|</motion.span>
                    )}
                  </div>

                  {dmca.done && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                      <button
                        className="btn btn-ghost"
                        style={{ padding: '6px', fontSize: 9 }}
                        onClick={handleCopyDMCA}
                        data-cursor="interactive"
                      >
                        COPY
                      </button>
                      <button
                        className="btn btn-ghost"
                        style={{ padding: '6px', fontSize: 9 }}
                        onClick={handleDownloadReport}
                        data-cursor="interactive"
                      >
                        DOWNLOAD PDF
                      </button>
                      <button
                        className="btn btn-signal"
                        style={{ padding: '6px', fontSize: 9, opacity: statusUpdating ? 0.6 : 1 }}
                        onClick={() => handleStatusUpdate('dmca_submitted')}
                        disabled={statusUpdating || v.status === 'dmca_submitted'}
                        data-cursor="interactive"
                      >
                        {v.status === 'dmca_submitted' ? 'SUBMITTED ✓' : 'MARK SUBMITTED'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          {/* Status actions */}
          <section>
            <SectionHeader title="ENFORCEMENT ACTIONS" />
            <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                className="btn btn-signal"
                style={{ width: '100%', padding: '10px', fontSize: 10, opacity: statusUpdating ? 0.6 : 1 }}
                onClick={() => handleStatusUpdate('resolved')}
                disabled={statusUpdating || v.status === 'resolved'}
                data-cursor="interactive"
              >
                {v.status === 'resolved' ? '✓ MARKED RESOLVED' : 'MARK AS RESOLVED'}
              </button>
              <button
                className="btn btn-ghost"
                style={{ width: '100%', padding: '10px', fontSize: 10 }}
                onClick={() => navigate(`/asset/${v.asset_id}`)}
                data-cursor="interactive"
              >
                VIEW PROTECTED ASSET →
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function SectionHeader({ title, gemini }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div className="flex items-center gap-3">
        <div style={{ width: 24, height: 1, background: gemini ? 'var(--accent-gemini)' : 'var(--accent-data)' }} />
        <h2 className="font-orbitron font-bold" style={{ fontSize: 13, letterSpacing: '0.1em' }}>{title}</h2>
      </div>
    </div>
  )
}
