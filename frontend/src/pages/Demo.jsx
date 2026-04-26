/**
 * SportShield — Guided 90-Second Demo Flow
 * Walks judges/audience through the full piracy detection pipeline step-by-step.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ConfidenceGauge from '../components/ui/ConfidenceGauge'
import StreamingText from '../components/ui/StreamingText'
import { useStreamSSE } from '../hooks/useStreamSSE'
import SportThumbnail from '../components/ui/SportThumbnail'

// ─── Demo step definitions ────────────────────────────────────────────────────
const STEPS = [
  {
    id: 'intro',
    label: 'INTRO',
    title: 'SPORTSHIELD LIVE DEMO',
    subtitle: 'AI-POWERED SPORTS MEDIA PROTECTION',
    duration: 4000,
  },
  {
    id: 'upload',
    label: 'INGEST',
    title: '01 — UPLOAD OFFICIAL MEDIA',
    subtitle: 'UEFA CHAMPIONS LEAGUE FINAL 2025 — PSG VS ARSENAL',
    duration: 5000,
  },
  {
    id: 'fingerprint',
    label: 'FINGERPRINT',
    title: '02 — AI FINGERPRINTING',
    subtitle: 'EXTRACTING VISUAL DNA FROM 47 KEYFRAMES',
    duration: 6000,
  },
  {
    id: 'watermark',
    label: 'WATERMARK',
    title: '03 — INVISIBLE WATERMARK EMBEDDED',
    subtitle: 'DCT FREQUENCY-DOMAIN STEGANOGRAPHY',
    duration: 4000,
  },
  {
    id: 'piracy',
    label: 'DETECT',
    title: '04 — PIRATED VERSION DETECTED',
    subtitle: 'MODIFIED: CROPPED • COLOR GRADED • SPEED ALTERED',
    duration: 5000,
  },
  {
    id: 'match',
    label: 'MATCH',
    title: '05 — 94.2% MATCH CONFIRMED',
    subtitle: 'MULTI-LAYER FINGERPRINT MATCH — UNAUTHORIZED REDISTRIBUTION',
    duration: 6000,
  },
  {
    id: 'ai',
    label: 'AI ANALYSIS',
    title: '06 — AI FORENSIC ANALYSIS',
    subtitle: 'GROQ llama-3.3-70b — STREAMING EXPLANATION',
    duration: 12000,
  },
  {
    id: 'spread',
    label: 'SPREAD',
    title: '07 — CONTENT SPREAD MAP',
    subtitle: 'CLIP FOUND ON 4 PLATFORMS — 19 COPIES',
    duration: 5000,
  },
  {
    id: 'certificate',
    label: 'PROOF',
    title: '08 — OWNERSHIP CERTIFICATE',
    subtitle: 'SHA-256 CRYPTOGRAPHIC PROOF OF OWNERSHIP',
    duration: 4000,
  },
  {
    id: 'dmca',
    label: 'DMCA',
    title: '09 — DMCA NOTICE GENERATED',
    subtitle: 'AI-DRAFTED LEGAL TAKEDOWN — READY TO SEND',
    duration: 10000,
  },
  {
    id: 'done',
    label: 'DONE',
    title: 'TOTAL TIME: 11 SECONDS',
    subtitle: 'FROM PIRACY DETECTION TO LEGAL ACTION',
    duration: 99999,
  },
]

const FINGERPRINT_STEPS = [
  { label: 'EXTRACTING FRAMES', time: 0 },
  { label: 'COMPUTING pHASH', time: 800 },
  { label: 'GENERATING CLIP EMBEDDINGS', time: 1600 },
  { label: 'BUILDING FAISS INDEX', time: 2800 },
  { label: 'EMBEDDING DCT WATERMARK', time: 4000 },
  { label: 'FINGERPRINT COMPLETE ✓', time: 5200 },
]

const DEMO_AI_EXPLANATION = `SportShield AI Analysis — Violation #VL-001

Visual Match Signals:
- Jersey pattern on player #9 (left forward position) matched across 14 consecutive frames at 97.3% confidence
- Corner flag geometry and pitch line curvature identical to source frames at timestamp 0:23-0:31
- Crowd density pattern in northwest stand matches source at 99.1% structural similarity
- Net geometry and goal post proportions: hash distance 2/64 bits (near-identical)

Alterations Detected:
- Aspect ratio modified: 16:9 → 9:16 (portrait crop for mobile distribution)
- Color saturation increased by approximately 38% using HSL manipulation
- Playback speed reduced to 0.85× (11 frames per second reduction)
- Audio track replaced entirely with royalty-free music

Conclusion:
This content is a modified redistribution of the protected asset. The modifications are insufficient to defeat SportShield's multi-layer fingerprint matching. The perceptual hash distance is only 3/64 bits — well within our 8-bit threshold for positive identification.

Confidence: 94.2% — UNAUTHORIZED REDISTRIBUTION`

const DEMO_DMCA = `DMCA TAKEDOWN NOTICE

Date: ${new Date().toDateString()}
Platform: YouTube
Infringing URL: https://www.youtube.com/watch?v=████████

To Whom It May Concern at YouTube LLC,

I am writing pursuant to 17 U.S.C. § 512(c)(3) to notify you that the content at the URL listed above infringes upon the copyright of UEFA Media Rights ("Rights Holder") in the audiovisual work titled "UEFA Champions League Final 2025 — PSG vs Arsenal" (the "Work").

IDENTIFICATION OF COPYRIGHTED WORK:
The copyrighted work is a video recording of the UEFA Champions League Final 2025. The Rights Holder is the exclusive owner of all intellectual property rights in this Work.
Registration date: May 31, 2025 21:15:00 UTC
SHA-256 fingerprint: a3f8d2c19b7e4f0a6d5c3b2e1f9a8d7c6b5a4e3f2d1c0b9a8f7e6d5c4b3a2f1
Watermark ID: WM-UCL-001-20250531

IDENTIFICATION OF INFRINGING MATERIAL:
The infringing material is located at the URL above. SportShield AI has determined with 94.2% confidence that this content is an unauthorized redistribution of the protected Work, modified with aspect ratio changes, color grading, and speed reduction.

STATEMENT OF GOOD FAITH BELIEF:
I have a good faith belief that the use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.

STATEMENT OF ACCURACY:
I swear, under penalty of perjury, that the information in this notification is accurate and that I am authorized to act on behalf of the owner of the exclusive right that is allegedly infringed.

CONTACT INFORMATION:
UEFA Media Rights — Nyon, Switzerland — legal@uefa.com

Electronic Signature: /s/ UEFA Legal Department`

// ─── Step renderers ───────────────────────────────────────────────────────────

function StepIntro() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 40px' }}>
      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6 }}>
        <svg width="80" height="88" viewBox="0 0 80 88" fill="none" style={{ margin: '0 auto 24px', display: 'block' }}>
          <path d="M40 4L8 16V40C8 61.5 22.4 81.3 40 86C57.6 81.3 72 61.5 72 40V16L40 4Z"
            stroke="var(--accent-signal)" strokeWidth="2" fill="none"
            style={{ filter: 'drop-shadow(0 0 16px var(--accent-signal))' }} />
          <path d="M26 44L36 54L56 34" stroke="var(--accent-signal)" strokeWidth="3" strokeLinecap="square" />
        </svg>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <div className="font-orbitron font-bold" style={{ fontSize: 48, letterSpacing: '0.08em', lineHeight: 1 }}>
          SPORT<span style={{ color: 'var(--accent-signal)', textShadow: 'var(--glow-signal)' }}>SHIELD</span>
        </div>
        <div className="font-data" style={{ fontSize: 13, color: 'var(--accent-data)', letterSpacing: '0.2em', marginTop: 12 }}>
          AI-POWERED PIRACY DETECTION
        </div>
        <div className="font-mono" style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 20, lineHeight: 1.7 }}>
          Every stolen clip. Every unauthorized redistribution.<br />
          <span style={{ color: 'var(--text-primary)' }}>Found. Flagged. Stopped.</span>
        </div>
      </motion.div>
    </div>
  )
}

function StepUpload() {
  return (
    <div style={{ padding: '40px' }}>
      <div style={{
        border: '2px solid var(--accent-signal)',
        background: 'rgba(0,255,65,0.03)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Corner brackets */}
        {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((c) => (
          <div key={c} style={{
            position: 'absolute', width: 20, height: 20, zIndex: 3,
            ...(c.includes('top') ? { top: 8 } : { bottom: 8 }),
            ...(c.includes('left') ? { left: 8 } : { right: 8 }),
            borderTop: c.includes('top') ? '2px solid var(--accent-signal)' : 'none',
            borderBottom: c.includes('bottom') ? '2px solid var(--accent-signal)' : 'none',
            borderLeft: c.includes('left') ? '2px solid var(--accent-signal)' : 'none',
            borderRight: c.includes('right') ? '2px solid var(--accent-signal)' : 'none',
          }} />
        ))}

        {/* Actual video thumbnail */}
        <div style={{ width: '100%', height: 220, position: 'relative' }}>
          <SportThumbnail assetId="SP-UCL-001" title="UEFA Champions League Final" sport="soccer"
            style={{ width: '100%', height: '100%' }} />
          {/* Play overlay */}
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.25)', zIndex: 2,
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.5)',
            }}>
              <span style={{ fontSize: 20, color: 'white', marginLeft: 4 }}>▶</span>
            </div>
          </div>
          {/* Top info bar */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3,
            padding: '8px 12px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)',
          }}>
            <div className="font-data" style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.12em' }}>
              INGESTING ● MP4 · 1920×1080 · 47 SEC · UEFA MEDIA RIGHTS
            </div>
          </div>
        </div>

        {/* Upload progress bar */}
        <div style={{ padding: '14px 16px' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 3.5, ease: 'easeInOut' }}
            style={{ height: 2, background: 'var(--accent-signal)', boxShadow: 'var(--glow-signal)', marginBottom: 8 }}
          />
          <div className="font-data text-xs" style={{ color: 'var(--accent-signal)' }}>UPLOAD COMPLETE ✓</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 20 }}>
        {[
          { label: 'FILE SIZE', value: '24.7 MB' },
          { label: 'DURATION', value: '47 SEC' },
          { label: 'RIGHTS HOLDER', value: 'UEFA' },
        ].map((m) => (
          <div key={m.label} style={{ padding: '12px', border: '1px solid var(--border-subtle)', background: 'var(--bg-void)' }}>
            <div className="font-data text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>{m.label}</div>
            <div className="font-orbitron font-bold" style={{ fontSize: 16, color: 'var(--accent-signal)' }}>{m.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function StepFingerprint({ elapsed }) {
  const done = FINGERPRINT_STEPS.filter((s) => elapsed >= s.time)
  const current = done.length < FINGERPRINT_STEPS.length ? FINGERPRINT_STEPS[done.length] : null

  return (
    <div style={{ padding: '40px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Steps */}
        <div>
          {FINGERPRINT_STEPS.map((step, i) => {
            const complete = elapsed >= step.time
            const active = current && i === done.length
            return (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: complete || active ? 1 : 0.3, x: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                  border: `1px solid ${complete ? 'var(--accent-signal)' : active ? 'var(--accent-data)' : 'var(--border-subtle)'}`,
                  background: complete ? 'var(--accent-signal)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {complete && <span style={{ color: 'var(--bg-void)', fontSize: 10, fontWeight: 700 }}>✓</span>}
                  {active && (
                    <motion.div animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.5, repeat: Infinity }}
                      style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-data)' }} />
                  )}
                </div>
                <span className="font-data" style={{
                  fontSize: 10, letterSpacing: '0.1em',
                  color: complete ? 'var(--accent-signal)' : active ? 'var(--accent-data)' : 'var(--text-secondary)',
                }}>
                  {step.label}
                </span>
              </motion.div>
            )
          })}
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: 'KEYFRAMES EXTRACTED', value: Math.min(47, Math.floor(elapsed / 120)), max: 47 },
            { label: 'EMBEDDINGS COMPUTED', value: Math.min(47, Math.floor(elapsed / 130)), max: 47 },
            { label: 'FAISS INDEX SIZE', value: Math.min(47, Math.floor(elapsed / 128)), max: 47 },
          ].map((stat) => (
            <div key={stat.label} style={{ padding: '12px', border: '1px solid var(--border-subtle)', background: 'var(--bg-void)' }}>
              <div className="font-data text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>{stat.label}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="font-orbitron font-bold" style={{ fontSize: 22, color: 'var(--accent-data)', width: 48 }}>
                  {stat.value}
                </div>
                <div style={{ flex: 1, height: 2, background: 'rgba(0,184,212,0.15)' }}>
                  <motion.div
                    style={{ height: '100%', background: 'var(--accent-data)', transformOrigin: 'left' }}
                    animate={{ width: `${(stat.value / stat.max) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <span className="font-data text-xs" style={{ color: 'var(--text-secondary)' }}>/{stat.max}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {elapsed >= 5200 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginTop: 20, padding: '16px', border: '1px solid var(--accent-signal)',
            background: 'rgba(0,255,65,0.05)', display: 'flex', alignItems: 'center', gap: 12,
          }}
        >
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-signal)', boxShadow: 'var(--glow-signal)' }} />
          <div>
            <div className="font-orbitron font-bold" style={{ fontSize: 13, color: 'var(--accent-signal)' }}>FINGERPRINT COMPLETE</div>
            <div className="font-data text-xs" style={{ color: 'var(--text-secondary)', marginTop: 2 }}>
              SHA-256: a3f8d2c1...a2f1 · WM-UCL-001-20250531 · 47 KEYFRAMES INDEXED
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

function StepWatermark() {
  return (
    <div style={{ padding: '40px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div>
          <div className="font-data text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>ORIGINAL FRAME</div>
          <div style={{
            height: 160, border: '1px solid var(--border-subtle)',
            position: 'relative', overflow: 'hidden',
          }}>
            <SportThumbnail assetId="SP-UCL-001" sport="soccer"
              style={{ width: '100%', height: '100%' }} />
            <div className="font-data" style={{ position: 'absolute', bottom: 8, right: 8, fontSize: 8,
              color: 'rgba(0,255,65,0.5)', background: 'rgba(0,0,0,0.6)', padding: '2px 6px' }}>
              NO WATERMARK
            </div>
          </div>
        </div>
        <div>
          <div className="font-data text-xs mb-2" style={{ color: 'var(--accent-signal)' }}>WATERMARKED FRAME (INVISIBLE)</div>
          <div style={{
            height: 160, border: '2px solid var(--accent-signal)', boxShadow: '0 0 20px rgba(0,255,65,0.2)',
            position: 'relative', overflow: 'hidden',
          }}>
            <SportThumbnail assetId="SP-UCL-001" sport="soccer"
              style={{ width: '100%', height: '100%' }} />
            {/* Watermark overlay effect */}
            <motion.div
              animate={{ opacity: [0, 0.18, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                position: 'absolute', inset: 0,
                background: 'repeating-linear-gradient(45deg, rgba(0,255,65,0.04) 0px, rgba(0,255,65,0.04) 1px, transparent 1px, transparent 8px)',
              }}
            />
            <div className="font-data" style={{ position: 'absolute', bottom: 8, right: 8, fontSize: 8,
              color: 'var(--accent-signal)', background: 'rgba(0,0,0,0.7)', padding: '2px 6px' }}>
              WM EMBEDDED ✓
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {['COMPRESSION', 'RESIZE', 'CROP', 'COLOR GRADE'].map((attack) => (
          <div key={attack} style={{ padding: '10px', border: '1px solid rgba(0,255,65,0.3)', background: 'rgba(0,255,65,0.05)', textAlign: 'center' }}>
            <div className="font-data text-xs" style={{ color: 'var(--accent-signal)', marginBottom: 4 }}>✓</div>
            <div className="font-data" style={{ fontSize: 8, color: 'var(--text-secondary)', letterSpacing: '0.08em' }}>{attack}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, padding: '12px 16px', border: '1px solid var(--accent-data)', background: 'rgba(0,184,212,0.04)' }}>
        <div className="font-data text-xs" style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>WATERMARK ID</div>
        <div className="hash-text" style={{ fontSize: 11 }}>WM-UCL-001-20250531 · DCT FREQUENCY DOMAIN · STRENGTH 9/10</div>
      </div>
    </div>
  )
}

function StepPiracy() {
  const [sliderX, setSliderX] = useState(50)

  return (
    <div style={{ padding: '40px' }}>
      <div className="font-mono" style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.7 }}>
        A modified version was uploaded to YouTube — cropped to portrait, color-graded,
        speed reduced. <span style={{ color: 'var(--accent-threat)' }}>Looks completely different.</span>
      </div>

      <div
        style={{ position: 'relative', height: 200, border: '1px solid var(--border-subtle)', cursor: 'ew-resize', overflow: 'hidden' }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          setSliderX(Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100)))
        }}
      >
        {/* Original side */}
        <div style={{ position: 'absolute', inset: 0, border: '2px solid var(--accent-signal)', overflow: 'hidden' }}>
          <SportThumbnail assetId="SP-UCL-001" sport="soccer" modified={false}
            style={{ width: '100%', height: '100%' }} />
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '6px 10px', background: 'rgba(0,0,0,0.7)',
          }}>
            <span className="font-data" style={{ fontSize: 9, color: 'var(--accent-signal)', letterSpacing: '0.1em' }}>
              ORIGINAL · 16:9 · NORMAL SPEED · NATURAL COLOR
            </span>
          </div>
        </div>
        {/* Pirated side (clipped left) */}
        <div style={{
          position: 'absolute', inset: 0, clipPath: `inset(0 0 0 ${sliderX}%)`,
          border: '2px solid var(--accent-threat)', overflow: 'hidden',
        }}>
          <SportThumbnail assetId="SP-UCL-001" sport="soccer" modified={true}
            style={{ width: '100%', height: '100%' }} />
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '6px 10px', background: 'rgba(0,0,0,0.7)',
          }}>
            <span className="font-data" style={{ fontSize: 9, color: 'var(--accent-threat)', letterSpacing: '0.1em' }}>
              PIRATED · 9:16 CROP · 0.85× SPEED · OVER-SATURATED
            </span>
          </div>
        </div>
        <div style={{
          position: 'absolute', top: 0, bottom: 0, left: `${sliderX}%`,
          width: 2, background: 'var(--accent-data)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--accent-data)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--bg-void)' }}>⟺</div>
        </div>
      </div>
      <div className="font-data text-xs text-center mt-2" style={{ color: 'var(--text-secondary)' }}>DRAG TO COMPARE</div>
    </div>
  )
}

function StepMatch() {
  return (
    <div style={{ padding: '40px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 32, alignItems: 'center' }}>
        <ConfidenceGauge value={94.2} size={200} />
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'VISUAL FRAME SIMILARITY', value: 96, color: 'var(--accent-threat)' },
              { label: 'PERCEPTUAL HASH DISTANCE', value: 95, color: 'var(--accent-threat)' },
              { label: 'CLIP EMBEDDING SIMILARITY', value: 94, color: 'var(--accent-threat)' },
              { label: 'DCT WATERMARK', value: 100, label2: 'FOUND', color: 'var(--accent-signal)' },
            ].map((sig, i) => (
              <div key={sig.label}>
                <div className="flex justify-between mb-1">
                  <span className="font-data" style={{ fontSize: 9, color: 'var(--text-secondary)', letterSpacing: '0.08em' }}>{sig.label}</span>
                  <span className="font-orbitron font-bold" style={{ fontSize: 10, color: sig.color }}>{sig.label2 || `${sig.value}%`}</span>
                </div>
                {!sig.label2 && (
                  <div style={{ height: 2, background: 'rgba(96,125,139,0.2)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${sig.value}%` }}
                      transition={{ duration: 0.8, delay: i * 0.15 }}
                      style={{ height: '100%', background: sig.color }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            style={{
              marginTop: 16, padding: '12px 16px',
              border: '2px solid var(--accent-threat)',
              background: 'rgba(255,23,68,0.08)',
              boxShadow: 'var(--glow-threat)',
            }}
          >
            <div className="font-orbitron font-bold" style={{ fontSize: 14, color: 'var(--accent-threat)', letterSpacing: '0.1em' }}>
              ⚠ UNAUTHORIZED REDISTRIBUTION CONFIRMED
            </div>
            <div className="font-data text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              PLATFORM: YOUTUBE · ASSET: UEFA CL FINAL 2025 — PSG VS ARSENAL
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

function StepAI({ elapsed }) {
  const charsToShow = Math.min(DEMO_AI_EXPLANATION.length, Math.floor(elapsed / 9))
  const text = DEMO_AI_EXPLANATION.slice(0, charsToShow)
  const streaming = charsToShow < DEMO_AI_EXPLANATION.length

  return (
    <div style={{ padding: '40px' }}>
      <div style={{
        background: 'rgba(138,180,248,0.04)',
        border: '1px solid rgba(138,180,248,0.3)',
        padding: 24,
        boxShadow: '0 0 40px rgba(138,180,248,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <span style={{ color: 'var(--accent-gemini)', fontSize: 20 }}>✦</span>
          <span className="font-data" style={{ fontSize: 11, letterSpacing: '0.2em', color: 'var(--accent-gemini)' }}>
            AI FORENSIC ANALYSIS — Groq llama-3.3-70b-versatile
          </span>
          {streaming && (
            <motion.span animate={{ opacity: [1, 0.3] }} transition={{ duration: 0.6, repeat: Infinity }}
              className="font-data" style={{ fontSize: 9, color: 'var(--accent-gemini)', marginLeft: 8 }}>
              GENERATING...
            </motion.span>
          )}
        </div>
        <StreamingText text={text} streaming={streaming} />
      </div>
    </div>
  )
}

function StepSpread() {
  const platforms = [
    { name: 'YouTube', copies: 7, confidence: 0.942, color: '#ff0000' },
    { name: 'TikTok', copies: 6, confidence: 0.961, color: '#ff0050' },
    { name: 'Twitter', copies: 4, confidence: 0.871, color: '#1da1f2' },
    { name: 'Web', copies: 2, confidence: 0.783, color: '#607d8b' },
  ]

  return (
    <div style={{ padding: '40px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {platforms.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.3 }}
            style={{ padding: '16px 20px', border: `1px solid ${p.color}33`, background: `${p.color}08` }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span className="font-mono font-bold" style={{ fontSize: 14, color: p.color }}>{p.name}</span>
              <span className="font-orbitron font-bold" style={{ fontSize: 18, color: p.color }}>{p.copies}</span>
            </div>
            <div className="font-data text-xs" style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
              {p.copies} UNAUTHORIZED COPIES · {(p.confidence * 100).toFixed(0)}% AVG MATCH
            </div>
            <div style={{ height: 2, background: `${p.color}22` }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(p.copies / 7) * 100}%` }}
                transition={{ duration: 0.8, delay: i * 0.3 + 0.3 }}
                style={{ height: '100%', background: p.color }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        style={{ marginTop: 20, padding: '16px 20px', border: '1px solid var(--border-subtle)', background: 'var(--bg-void)' }}
      >
        <div style={{ display: 'flex', gap: 32 }}>
          <div>
            <div className="font-data text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>TOTAL COPIES</div>
            <div className="font-orbitron font-bold" style={{ fontSize: 28, color: 'var(--accent-threat)' }}>19</div>
          </div>
          <div>
            <div className="font-data text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>PLATFORMS</div>
            <div className="font-orbitron font-bold" style={{ fontSize: 28, color: 'var(--accent-warn)' }}>4</div>
          </div>
          <div>
            <div className="font-data text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>EST. REVENUE IMPACT</div>
            <div className="font-orbitron font-bold" style={{ fontSize: 28, color: 'var(--accent-warn)' }}>$12,400</div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function StepCertificate() {
  return (
    <div style={{ padding: '40px' }}>
      <div style={{
        border: '1px solid var(--accent-signal)',
        background: 'rgba(0,255,65,0.03)',
        padding: '24px 28px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(0,255,65,0.2)' }}>
          <svg width="32" height="36" viewBox="0 0 32 36" fill="none">
            <path d="M16 2L2 8V18C2 27.3 8.5 35.1 16 37C23.5 35.1 30 27.3 30 18V8L16 2Z"
              stroke="var(--accent-signal)" strokeWidth="1.5" fill="none" style={{ filter: 'drop-shadow(0 0 6px var(--accent-signal))' }} />
            <path d="M10 18L14 22L22 14" stroke="var(--accent-signal)" strokeWidth="2" strokeLinecap="square" />
          </svg>
          <div>
            <div className="font-orbitron font-bold" style={{ fontSize: 14, letterSpacing: '0.1em' }}>CERTIFICATE OF DIGITAL OWNERSHIP</div>
            <div className="font-data text-xs" style={{ color: 'var(--text-secondary)', marginTop: 2 }}>SPORTSHIELD DIGITAL RIGHTS REGISTRY</div>
          </div>
        </div>

        {[
          ['ASSET', 'UEFA Champions League Final 2025 — PSG vs Arsenal'],
          ['RIGHTS HOLDER', 'UEFA Media Rights'],
          ['REGISTERED', new Date('2025-05-31T21:15:00Z').toLocaleString() + ' UTC'],
          ['WATERMARK ID', 'WM-UCL-001-20250531'],
          ['FINGERPRINT STRENGTH', '5/5 ●●●●●'],
        ].map(([label, val]) => (
          <div key={label} style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
            <span className="font-data text-xs" style={{ color: 'var(--text-secondary)', width: 140, flexShrink: 0 }}>{label}</span>
            <span className="font-mono text-xs" style={{ color: 'var(--text-primary)' }}>{val}</span>
          </div>
        ))}

        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(0,255,65,0.2)' }}>
          <div className="font-data text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>SHA-256 CRYPTOGRAPHIC FINGERPRINT</div>
          <div className="hash-text" style={{ fontSize: 10, wordBreak: 'break-all', color: 'var(--accent-signal)', lineHeight: 1.6 }}>
            a3f8d2c19b7e4f0a6d5c3b2e1f9a8d7c6b5a4e3f2d1c0b9a8f7e6d5c4b3a2f1
          </div>
        </div>
      </div>
    </div>
  )
}

function StepDMCA({ elapsed }) {
  const charsToShow = Math.min(DEMO_DMCA.length, Math.floor(elapsed / 8))
  const text = DEMO_DMCA.slice(0, charsToShow)
  const streaming = charsToShow < DEMO_DMCA.length

  return (
    <div style={{ padding: '40px' }}>
      <div style={{
        background: 'var(--bg-void)',
        border: '1px solid var(--border-subtle)',
        padding: 20,
        fontFamily: '"Share Tech Mono", monospace',
        fontSize: 10,
        color: 'var(--text-primary)',
        lineHeight: 1.9,
        maxHeight: 340,
        overflow: 'auto',
        whiteSpace: 'pre-wrap',
      }} className="scroll-area">
        {text}
        {streaming && (
          <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }}
            style={{ color: 'var(--accent-gemini)' }}>|</motion.span>
        )}
      </div>
    </div>
  )
}

function StepDone({ onRestart }) {
  const navigate = useNavigate()
  return (
    <div style={{ padding: '60px 40px', textAlign: 'center' }}>
      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
        <div className="font-orbitron font-bold" style={{ fontSize: 56, color: 'var(--accent-signal)', textShadow: 'var(--glow-signal)', lineHeight: 1, marginBottom: 8 }}>
          11s
        </div>
        <div className="font-data" style={{ fontSize: 11, letterSpacing: '0.2em', color: 'var(--text-secondary)', marginBottom: 32 }}>
          FROM PIRACY DETECTION TO LEGAL ACTION
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, maxWidth: 480, margin: '0 auto 32px' }}>
          {[
            { label: 'ASSETS PROTECTED', value: '47,293' },
            { label: 'VIOLATIONS/DAY', value: '1,847' },
            { label: 'TAKEDOWN RATE', value: '87%' },
          ].map((s) => (
            <div key={s.label} style={{ padding: '16px', border: '1px solid var(--border-subtle)' }}>
              <div className="font-orbitron font-bold" style={{ fontSize: 22, color: 'var(--accent-signal)' }}>{s.value}</div>
              <div className="font-data" style={{ fontSize: 8, color: 'var(--text-secondary)', letterSpacing: '0.1em', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn btn-signal" style={{ padding: '12px 28px', fontSize: 11 }} onClick={() => navigate('/vault')} data-cursor="interactive">
            PROTECT YOUR CONTENT →
          </button>
          <button className="btn btn-ghost" style={{ padding: '12px 28px', fontSize: 11 }} onClick={onRestart} data-cursor="interactive">
            ↺ REPLAY DEMO
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Main Demo Component ──────────────────────────────────────────────────────
export default function Demo() {
  const [stepIdx, setStepIdx] = useState(0)
  const [stepElapsed, setStepElapsed] = useState(0)
  const [paused, setPaused] = useState(false)
  const [autoPlay, setAutoPlay] = useState(true)
  const intervalRef = useRef(null)
  const stepStartRef = useRef(Date.now())

  const currentStep = STEPS[stepIdx]
  const navigate = useNavigate()

  // Auto-advance steps
  useEffect(() => {
    if (paused || !autoPlay) return
    const tick = () => {
      const elapsed = Date.now() - stepStartRef.current
      setStepElapsed(elapsed)
      if (elapsed >= currentStep.duration && stepIdx < STEPS.length - 1) {
        goNext()
      }
    }
    intervalRef.current = setInterval(tick, 50)
    return () => clearInterval(intervalRef.current)
  }, [stepIdx, paused, autoPlay, currentStep.duration])

  const goNext = useCallback(() => {
    setStepIdx((i) => Math.min(STEPS.length - 1, i + 1))
    setStepElapsed(0)
    stepStartRef.current = Date.now()
  }, [])

  const goPrev = useCallback(() => {
    setStepIdx((i) => Math.max(0, i - 1))
    setStepElapsed(0)
    stepStartRef.current = Date.now()
  }, [])

  const goTo = useCallback((idx) => {
    setStepIdx(idx)
    setStepElapsed(0)
    stepStartRef.current = Date.now()
  }, [])

  const restart = useCallback(() => {
    goTo(0)
    setAutoPlay(true)
    setPaused(false)
  }, [goTo])

  const progress = Math.min(100, (stepElapsed / currentStep.duration) * 100)

  function renderStep() {
    const id = currentStep.id
    if (id === 'intro') return <StepIntro />
    if (id === 'upload') return <StepUpload />
    if (id === 'fingerprint') return <StepFingerprint elapsed={stepElapsed} />
    if (id === 'watermark') return <StepWatermark />
    if (id === 'piracy') return <StepPiracy />
    if (id === 'match') return <StepMatch />
    if (id === 'ai') return <StepAI elapsed={stepElapsed} />
    if (id === 'spread') return <StepSpread />
    if (id === 'certificate') return <StepCertificate />
    if (id === 'dmca') return <StepDMCA elapsed={stepElapsed} />
    if (id === 'done') return <StepDone onRestart={restart} />
    return null
  }

  return (
    <div style={{ paddingTop: 80, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Step progress bar */}
      <div style={{
        position: 'fixed', top: 80, left: 0, right: 0, height: 3, zIndex: 990,
        background: 'rgba(0,184,212,0.1)',
      }}>
        <motion.div
          style={{ height: '100%', background: 'var(--accent-data)', boxShadow: 'var(--glow-data)' }}
          animate={{ width: `${((stepIdx) / (STEPS.length - 1)) * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Step dots nav */}
      <div style={{
        padding: '12px 40px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        overflowX: 'auto',
      }}>
        {STEPS.map((step, i) => (
          <button
            key={step.id}
            onClick={() => goTo(i)}
            data-cursor="interactive"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 10px',
              background: i === stepIdx ? 'rgba(0,184,212,0.15)' : 'transparent',
              border: `1px solid ${i === stepIdx ? 'var(--accent-data)' : i < stepIdx ? 'rgba(0,255,65,0.3)' : 'var(--border-subtle)'}`,
              cursor: 'none', whiteSpace: 'nowrap', transition: 'all 0.2s',
            }}
          >
            <span className="font-data" style={{ fontSize: 8, letterSpacing: '0.1em', color: i === stepIdx ? 'var(--accent-data)' : i < stepIdx ? 'var(--accent-signal)' : 'var(--text-secondary)' }}>
              {i < stepIdx ? '✓ ' : ''}{step.label}
            </span>
          </button>
        ))}
      </div>

      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Step title */}
        <div style={{
          padding: '24px 40px 0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <AnimatePresence mode="wait">
              <motion.div key={currentStep.id} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                <div className="font-orbitron font-bold" style={{ fontSize: 22, letterSpacing: '0.08em' }}>
                  {currentStep.title}
                </div>
                <div className="font-data text-xs mt-1" style={{ color: 'var(--text-secondary)', letterSpacing: '0.12em' }}>
                  {currentStep.subtitle}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Step timer bar */}
          {currentStep.id !== 'done' && (
            <div style={{ width: 120, height: 2, background: 'rgba(0,184,212,0.15)', position: 'relative', overflow: 'hidden' }}>
              <motion.div
                style={{ position: 'absolute', top: 0, left: 0, height: '100%', background: 'var(--accent-data)' }}
                animate={{ width: paused ? undefined : `${progress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          )}
        </div>

        {/* Step content */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              style={{ height: '100%', overflow: 'auto' }}
              className="scroll-area"
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Control bar */}
      <div style={{
        borderTop: '1px solid var(--border-subtle)',
        padding: '12px 40px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: 'var(--bg-surface)',
      }}>
        <button
          className="btn btn-ghost"
          style={{ padding: '6px 16px', fontSize: 10 }}
          onClick={goPrev}
          disabled={stepIdx === 0}
          data-cursor="interactive"
        >
          ← PREV
        </button>

        <button
          className="btn"
          style={{
            padding: '6px 16px', fontSize: 10,
            background: paused ? 'rgba(0,255,65,0.1)' : 'rgba(0,184,212,0.1)',
            border: `1px solid ${paused ? 'var(--accent-signal)' : 'var(--border-subtle)'}`,
            color: paused ? 'var(--accent-signal)' : 'var(--text-secondary)',
          }}
          onClick={() => setPaused((p) => !p)}
          data-cursor="interactive"
        >
          {paused ? '▶ RESUME' : '⏸ PAUSE'}
        </button>

        <button
          className="btn btn-ghost"
          style={{ padding: '6px 16px', fontSize: 10 }}
          onClick={goNext}
          disabled={stepIdx === STEPS.length - 1}
          data-cursor="interactive"
        >
          NEXT →
        </button>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <span className="font-data text-xs" style={{ color: 'var(--text-secondary)', alignSelf: 'center' }}>
            {stepIdx + 1} / {STEPS.length}
          </span>
          <button className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: 10 }} onClick={() => navigate('/monitor')} data-cursor="interactive">
            EXIT
          </button>
        </div>
      </div>
    </div>
  )
}
