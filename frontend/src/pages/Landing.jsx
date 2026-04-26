import { Suspense, useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useAuth } from '@clerk/clerk-react'
import GlobeScene from '../components/three/GlobeScene'
import GlitchText from '../components/ui/GlitchText'
import { useCountUp } from '../hooks/useCountUp'

const STATS = [
  { label: 'ASSETS PROTECTED', value: 47293, suffix: '' },
  { label: 'VIOLATIONS TODAY', value: 1847, suffix: '' },
  { label: 'PLATFORMS MONITORED', value: 23, suffix: '' },
  { label: 'AVG DETECTION TIME', value: 8.3, suffix: 's', decimals: 1 },
]

function StatCounter({ label, value, suffix, decimals = 0 }) {
  const count = useCountUp(value, 3000, decimals)
  return (
    <div>
      <div
        className="font-orbitron font-bold"
        style={{ fontSize: 28, color: 'var(--accent-signal)', lineHeight: 1 }}
      >
        {typeof count === 'number' ? count.toLocaleString() : count}{suffix}
      </div>
      <div className="font-data" style={{ fontSize: 9, color: 'var(--text-secondary)', marginTop: 4, letterSpacing: '0.12em' }}>
        {label}
      </div>
    </div>
  )
}

const SCALE_METRICS = [
  { value: '< 100ms', label: 'FAISS SEARCH LATENCY', desc: 'Sub-100ms similarity search across the full vector index' },
  { value: '100M+', label: 'MAX INDEX CAPACITY', desc: 'FAISS flat index scales to 100M+ fingerprint vectors' },
  { value: '11s', label: 'END-TO-END DETECTION', desc: 'Upload → fingerprint → watermark → indexed in 11 seconds' },
  { value: '99.7%', label: 'WATERMARK SURVIVAL', desc: 'DCT steganographic watermark survives compression, crop, resize' },
  { value: '64-bit', label: 'PHASH PRECISION', desc: 'Perceptual hash survives re-encoding, color grading, speed changes' },
  { value: '256-bit', label: 'SHA-256 STRENGTH', desc: 'Cryptographic proof of original ownership, court-admissible' },
]

const PIPELINE_STEPS = [
  { label: 'INGEST', tech: 'Any format', color: 'var(--accent-signal)' },
  { label: 'SHA-256', tech: 'hashlib', color: 'var(--accent-data)' },
  { label: 'KEYFRAMES', tech: 'OpenCV', color: 'var(--accent-data)' },
  { label: 'pHASH', tech: 'imagehash', color: 'var(--accent-data)' },
  { label: 'CLIP EMBED', tech: 'ViT-B/32', color: 'var(--accent-data)' },
  { label: 'FAISS INDEX', tech: 'faiss-cpu', color: 'var(--accent-warn)' },
  { label: 'DCT WATERMARK', tech: 'invisible-wm', color: 'var(--accent-signal)' },
  { label: 'MONITOR', tech: 'yt-dlp crawler', color: 'var(--accent-threat)' },
]

function ScaleSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} style={{ padding: '80px 60px', borderTop: '1px solid var(--border-subtle)', position: 'relative', overflow: 'hidden' }}>
      {/* Background grid */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: 'linear-gradient(rgba(0,184,212,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,184,212,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div className="flex items-center gap-4 mb-12">
          <div style={{ width: 40, height: 1, background: 'var(--accent-signal)' }} />
          <span className="font-data text-xs tracking-widest" style={{ color: 'var(--accent-signal)' }}>
            ENGINEERED FOR SCALE
          </span>
        </div>

        {/* Metrics grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', marginBottom: 48 }}>
          {SCALE_METRICS.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              style={{
                padding: '28px 24px',
                borderRight: i < 5 ? '1px solid var(--border-subtle)' : 'none',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <div className="font-orbitron font-bold" style={{ fontSize: 26, color: 'var(--accent-signal)', lineHeight: 1, marginBottom: 6 }}>
                {m.value}
              </div>
              <div className="font-data" style={{ fontSize: 9, color: 'var(--accent-data)', letterSpacing: '0.1em', marginBottom: 8 }}>
                {m.label}
              </div>
              <p className="font-mono" style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {m.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Pipeline bar */}
        <div>
          <div className="font-data text-xs tracking-widest mb-4" style={{ color: 'var(--text-secondary)' }}>
            DETECTION PIPELINE
          </div>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0 }}>
            {PIPELINE_STEPS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.6 + i * 0.07, duration: 0.3 }}
                style={{ display: 'flex', alignItems: 'center' }}
              >
                <div style={{
                  padding: '8px 14px',
                  border: `1px solid ${step.color}22`,
                  background: `${step.color}08`,
                  whiteSpace: 'nowrap',
                }}>
                  <div className="font-data" style={{ fontSize: 10, color: step.color, letterSpacing: '0.08em' }}>{step.label}</div>
                  <div className="font-data" style={{ fontSize: 8, color: 'var(--text-secondary)', marginTop: 2 }}>{step.tech}</div>
                </div>
                {i < PIPELINE_STEPS.length - 1 && (
                  <div style={{ width: 20, height: 1, background: 'var(--border-subtle)', flexShrink: 0 }} />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

const HOW_IT_WORKS = [
  {
    num: '01',
    title: 'INGEST',
    desc: 'Upload official sports media. Any format — video, image, highlight reel.',
  },
  {
    num: '02',
    title: 'FINGERPRINT',
    desc: 'AI extracts a unique visual DNA — perceptual hashes + CLIP embeddings + invisible DCT watermark.',
  },
  {
    num: '03',
    title: 'PROTECT',
    desc: 'Background workers monitor 23 platforms. Matches flagged in under 15 seconds.',
  },
]

function HowItWorks() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section ref={ref} style={{ padding: '80px 60px', position: 'relative' }}>
      <div className="flex items-center gap-4 mb-12">
        <div style={{ width: 40, height: 1, background: 'var(--accent-data)' }} />
        <span className="font-data text-xs tracking-widest" style={{ color: 'var(--accent-data)' }}>
          HOW IT WORKS
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, position: 'relative' }}>
        {HOW_IT_WORKS.map((step, i) => (
          <div key={i} style={{ position: 'relative', padding: '0 40px 0 0' }}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: i * 0.2, duration: 0.5 }}
            >
              <div
                className="font-orbitron"
                style={{ fontSize: 64, fontWeight: 900, color: 'rgba(0,184,212,0.08)', lineHeight: 1, marginBottom: 8 }}
              >
                {step.num}
              </div>
              <div
                className="font-orbitron font-bold"
                style={{ fontSize: 18, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '0.1em' }}
              >
                {step.title}
              </div>
              <p className="font-mono" style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                {step.desc}
              </p>
            </motion.div>

            {/* Connector line (not for last item) */}
            {i < 2 && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={isInView ? { scaleX: 1 } : {}}
                transition={{ delay: i * 0.2 + 0.3, duration: 0.5 }}
                style={{
                  position: 'absolute',
                  top: 40,
                  right: 0,
                  width: 40,
                  height: 1,
                  background: 'var(--accent-data)',
                  transformOrigin: 'left',
                }}
              />
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

const LIVE_THREATS = [
  { platform: 'YOUTUBE',  match: '97.9%', asset: 'IPL 2026 Live',    delay: 2.2 },
  { platform: 'TIKTOK',   match: '94.2%', asset: 'UCL Final 2025',   delay: 3.4 },
  { platform: 'HOTSTAR',  match: '96.1%', asset: 'Champions Trophy', delay: 4.8 },
]

export default function Landing() {
  const navigate   = useNavigate()
  const { isSignedIn } = useAuth()
  const [sweepDone, setSweepDone] = useState(false)
  const [threatIdx, setThreatIdx] = useState(-1)
  const [clock, setClock] = useState('')

  const handleProtectClick = () => {
    navigate(isSignedIn ? '/vault' : '/login')
  }

  const handleMonitorClick = () => {
    navigate(isSignedIn ? '/monitor' : '/login')
  }

  // Live clock
  useEffect(() => {
    const tick = () => setClock(new Date().toUTCString().slice(17, 25) + ' UTC')
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // Stagger floating threat popups
  useEffect(() => {
    LIVE_THREATS.forEach((t, i) => {
      setTimeout(() => setThreatIdx(i), t.delay * 1000)
    })
  }, [])

  return (
    <div style={{ paddingTop: 52, paddingBottom: 24, minHeight: '100vh' }}>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', height: 'calc(100vh - 52px)', overflow: 'hidden' }}>

        {/* Globe — full background */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <Suspense fallback={null}><GlobeScene /></Suspense>
        </div>

        {/* Vignette */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 70% 80% at 65% 50%, transparent 30%, rgba(0,3,8,0.85) 100%)',
        }} />

        {/* One-time scan sweep */}
        {!sweepDone && (
          <motion.div
            initial={{ top: '-2px' }}
            animate={{ top: '102%' }}
            transition={{ duration: 2.2, ease: 'easeIn', delay: 0.3 }}
            onAnimationComplete={() => setSweepDone(true)}
            style={{
              position: 'absolute', left: 0, right: 0, height: 2, zIndex: 10,
              background: 'linear-gradient(90deg, transparent, rgba(0,184,212,0.9), rgba(255,255,255,0.6), rgba(0,184,212,0.9), transparent)',
              boxShadow: '0 0 24px rgba(0,184,212,0.8), 0 0 60px rgba(0,184,212,0.3)',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* ── Corner HUD — top left ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          style={{ position: 'absolute', top: 20, left: 28, zIndex: 3 }}
        >
          <div className="font-data" style={{ fontSize: 9, color: 'rgba(0,184,212,0.5)', letterSpacing: '0.15em', marginBottom: 3 }}>
            SYSTEM TIME: {clock}
          </div>
          <div className="font-data" style={{ fontSize: 9, color: 'rgba(0,184,212,0.5)', letterSpacing: '0.15em' }}>
            MODE: SURVEILLANCE ● THREAT LVL: ELEVATED
          </div>
        </motion.div>

        {/* ── Corner HUD — top right ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          style={{ position: 'absolute', top: 20, right: 28, zIndex: 3, textAlign: 'right' }}
        >
          <div className="font-data" style={{ fontSize: 9, color: 'rgba(0,184,212,0.5)', letterSpacing: '0.1em' }}>
            23 PLATFORMS MONITORED
          </div>
          <div className="font-data" style={{ fontSize: 9, color: 'rgba(0,255,65,0.6)', letterSpacing: '0.1em', marginTop: 3 }}>
            ● LIVE FEED ACTIVE
          </div>
        </motion.div>

        {/* ── Hero text ── */}
        <div style={{
          position: 'absolute',
          top: '50%', left: 60,
          transform: 'translateY(-52%)',
          zIndex: 4, maxWidth: 600,
        }}>
          {/* Data label */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}
          >
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-threat)', boxShadow: '0 0 10px var(--accent-threat)' }}
            />
            <span className="font-data" style={{ fontSize: 10, color: 'var(--accent-data)', letterSpacing: '0.22em' }}>
              AI-POWERED CONTENT PROTECTION SYSTEM
            </span>
          </motion.div>

          {/* SPORT */}
          <motion.div
            initial={{ clipPath: 'inset(0 100% 0 0)', opacity: 1 }}
            animate={{ clipPath: 'inset(0 0% 0 0)' }}
            transition={{ delay: 0.8, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="font-orbitron" style={{ fontSize: 80, fontWeight: 900, lineHeight: 1.0, letterSpacing: '0.04em', marginBottom: 0 }}>
              <GlitchText text="SPORT" />
            </h1>
          </motion.div>

          {/* SHIELD */}
          <motion.div
            initial={{ clipPath: 'inset(0 100% 0 0)', opacity: 1 }}
            animate={{ clipPath: 'inset(0 0% 0 0)' }}
            transition={{ delay: 1.05, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="font-orbitron" style={{ fontSize: 80, fontWeight: 900, lineHeight: 1.0, letterSpacing: '0.04em', marginBottom: 20 }}>
              <span style={{
                color: 'var(--accent-signal)',
                textShadow: '0 0 30px rgba(0,255,65,0.5), 0 0 80px rgba(0,255,65,0.2)',
              }}>
                <GlitchText text="SHIELD" letterDelay={55} />
              </span>
            </h1>
          </motion.div>

          {/* Tagline */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.6 }}
            style={{ marginBottom: 36 }}
          >
            <p className="font-mono" style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 6 }}>
              Every stolen clip. Every unauthorized redistribution.
            </p>
            <p className="font-orbitron" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.06em' }}>
              Found. Flagged. Stopped.
            </p>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.7, duration: 0.5 }}
            style={{ display: 'flex', gap: 16, alignItems: 'center' }}
          >
            <button
              className="btn btn-signal animate-glow-breathe"
              style={{ fontSize: 11, padding: '13px 32px' }}
              onClick={handleProtectClick}
              data-cursor="interactive"
            >
              PROTECT YOUR CONTENT →
            </button>
            <button
              className="btn btn-ghost"
              style={{ fontSize: 11, padding: '13px 28px' }}
              onClick={() => navigate('/demo')}
              data-cursor="interactive"
            >
              ▶ LIVE DEMO
            </button>
            <button
              className="btn"
              style={{ fontSize: 11, padding: '13px 24px', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
              onClick={handleMonitorClick}
              data-cursor="interactive"
            >
              MONITOR →
            </button>
          </motion.div>
        </div>

        {/* ── Floating threat alerts — right side ── */}
        <div style={{ position: 'absolute', top: '22%', right: 32, zIndex: 4, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {LIVE_THREATS.map((t, i) => (
            <AnimatePresence key={i}>
              {threatIdx >= i && (
                <motion.div
                  initial={{ opacity: 0, x: 40, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  style={{
                    padding: '10px 14px',
                    background: 'rgba(5,10,18,0.88)',
                    border: '1px solid rgba(255,23,68,0.35)',
                    backdropFilter: 'blur(8px)',
                    minWidth: 240,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <motion.div
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-threat)', boxShadow: '0 0 6px var(--accent-threat)' }}
                    />
                    <span className="font-data" style={{ fontSize: 9, color: 'var(--accent-threat)', letterSpacing: '0.15em' }}>
                      VIOLATION DETECTED
                    </span>
                  </div>
                  <div className="font-mono" style={{ fontSize: 11, color: 'var(--text-primary)', marginBottom: 2 }}>
                    {t.asset}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="font-data" style={{ fontSize: 9, color: 'var(--text-secondary)' }}>{t.platform}</span>
                    <span className="font-orbitron" style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-threat)' }}>{t.match}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          ))}
        </div>

        {/* ── Stats widget — bottom left ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.9, duration: 0.6 }}
          style={{
            position: 'absolute', bottom: 36, left: 60, zIndex: 4,
            background: 'rgba(5,10,18,0.82)',
            border: '1px solid var(--border-subtle)',
            backdropFilter: 'blur(16px)',
            padding: '18px 24px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '14px 36px',
            minWidth: 380,
          }}
        >
          {/* Top border accent */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 1,
            background: 'linear-gradient(90deg, transparent, var(--accent-signal), transparent)',
          }} />
          <div className="font-data" style={{
            position: 'absolute', top: -18, left: 0,
            fontSize: 8, color: 'var(--accent-data)', letterSpacing: '0.15em',
          }}>
            LIVE METRICS
          </div>
          {STATS.map((stat) => (
            <StatCounter key={stat.label} {...stat} />
          ))}
        </motion.div>

        {/* ── Scroll indicator ── */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 2 }}
          style={{
            position: 'absolute', bottom: 36, right: 60, zIndex: 4,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          }}
        >
          <div style={{ width: 1, height: 48, background: 'linear-gradient(to bottom, var(--accent-data), transparent)' }} />
          <span className="font-data" style={{ fontSize: 9, color: 'var(--text-secondary)', letterSpacing: '0.15em', writingMode: 'vertical-rl' }}>
            SCROLL
          </span>
        </motion.div>

        {/* ── Radar rings — center right near globe ── */}
        <div style={{ position: 'absolute', top: '50%', left: '58%', zIndex: 1, pointerEvents: 'none' }}>
          {[0, 0.6, 1.2].map((delay, i) => (
            <motion.div
              key={i}
              animate={{ scale: [1, 3], opacity: [0.15, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                width: 80, height: 80,
                borderRadius: '50%',
                border: '1px solid var(--accent-data)',
                top: '-40px', left: '-40px',
              }}
            />
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <HowItWorks />

      {/* ── Scale ── */}
      <ScaleSection />

      {/* ── CTA footer ── */}
      <section style={{ padding: '80px 60px', borderTop: '1px solid var(--border-subtle)', position: 'relative', overflow: 'hidden' }}>
        {/* Background accent */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: 'radial-gradient(ellipse 60% 60% at 50% 100%, rgba(255,23,68,0.06), transparent)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div className="flex items-center justify-center gap-4 mb-6">
            <div style={{ width: 60, height: 1, background: 'linear-gradient(to right, transparent, var(--accent-threat))' }} />
            <span className="font-data text-xs tracking-widest" style={{ color: 'var(--accent-threat)' }}>
              GLOBAL THREAT INTELLIGENCE
            </span>
            <div style={{ width: 60, height: 1, background: 'linear-gradient(to left, transparent, var(--accent-threat))' }} />
          </div>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-orbitron"
            style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '0.06em' }}
          >
            See how your content spreads.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="font-mono"
            style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 36 }}
          >
            Real-time D3 force graph. Global piracy network. Executive PDF reports.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.3 }}
            style={{ display: 'flex', gap: 16, justifyContent: 'center' }}
          >
            <button
              className="btn"
              style={{ fontSize: 11, padding: '12px 32px', border: '1px solid rgba(255,23,68,0.5)', color: 'var(--accent-threat)', background: 'rgba(255,23,68,0.06)' }}
              onClick={() => navigate('/login')}
              data-cursor="interactive"
            >
              VIEW INTELLIGENCE DASHBOARD →
            </button>
            <button
              className="btn btn-ghost"
              style={{ fontSize: 11, padding: '12px 28px' }}
              onClick={() => navigate('/demo')}
              data-cursor="interactive"
            >
              ▶ 90-SECOND DEMO
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
