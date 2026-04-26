import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const BOOT_LINES = [
  { text: 'SPORTSHIELD OS v1.0.0 — INITIALISING', color: '#e8f4fd' },
  { text: 'LOADING FAISS VECTOR INDEX... [100M CAPACITY]', color: '#607d8b' },
  { text: 'SPAWNING NEURAL DETECTION ENGINE... OK', color: '#607d8b' },
  { text: 'CONNECTING TO 23 PLATFORM CRAWLERS... OK', color: '#607d8b' },
  { text: 'DCT WATERMARK ENGINE ONLINE', color: '#607d8b' },
  { text: 'GROQ AI STREAMING READY — LLAMA-3.3-70B-VERSATILE', color: '#607d8b' },
  { text: 'SOCKET.IO LIVE FEED CONNECTED', color: '#607d8b' },
  { text: '> 47,293 ASSETS UNDER ACTIVE PROTECTION', color: '#00b8d4' },
  { text: '> 1,847 VIOLATIONS DETECTED TODAY', color: '#ffab00' },
  { text: '> THREAT LEVEL: ELEVATED — SURVEILLANCE MODE ACTIVE', color: '#ff1744' },
  { text: 'ALL SYSTEMS NOMINAL.', color: '#00ff41' },
]

const LINE_DELAY = 280

export default function BootScreen({ onComplete }) {
  const [visibleLines, setVisibleLines] = useState(0)
  const [exiting, setExiting] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Show lines one by one
    BOOT_LINES.forEach((_, i) => {
      setTimeout(() => setVisibleLines(i + 1), i * LINE_DELAY + 300)
    })

    // Start progress bar
    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(100, p + 2.5))
    }, (BOOT_LINES.length * LINE_DELAY) / 40)

    // Begin exit
    const exitTimer = setTimeout(() => {
      setExiting(true)
      setTimeout(() => onComplete?.(), 700)
    }, BOOT_LINES.length * LINE_DELAY + 700)

    return () => {
      clearTimeout(exitTimer)
      clearInterval(progressInterval)
    }
  }, [])

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.65, ease: 'easeInOut' }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: '#000308',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: '"Share Tech Mono", monospace',
          }}
        >
          {/* Scanlines */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'repeating-linear-gradient(0deg,rgba(0,0,0,0.04) 0px,rgba(0,0,0,0.04) 1px,transparent 1px,transparent 2px)',
            pointerEvents: 'none',
          }} />

          <div style={{ width: 640, padding: '0 24px' }}>
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{ marginBottom: 40 }}
            >
              <div style={{
                fontSize: 36,
                fontFamily: '"Orbitron", sans-serif',
                fontWeight: 900,
                letterSpacing: '0.12em',
                color: '#e8f4fd',
              }}>
                SPORT<span style={{ color: '#00ff41', textShadow: '0 0 20px rgba(0,255,65,0.6)' }}>SHIELD</span>
              </div>
              <div style={{ fontSize: 10, color: '#607d8b', letterSpacing: '0.2em', marginTop: 4 }}>
                AI-POWERED DIGITAL ASSET PROTECTION SYSTEM
              </div>
            </motion.div>

            {/* Boot lines */}
            <div style={{ marginBottom: 28, minHeight: 220 }}>
              {BOOT_LINES.slice(0, visibleLines).map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    marginBottom: 5,
                  }}
                >
                  <span style={{ color: '#00b8d4', fontSize: 10, flexShrink: 0, opacity: 0.7 }}>
                    [{String(i).padStart(2, '0')}]
                  </span>
                  <span style={{ fontSize: 11, color: line.color, lineHeight: 1.4 }}>
                    {line.text}
                    {i === visibleLines - 1 && (
                      <motion.span
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                        style={{ color: '#00b8d4', marginLeft: 4 }}
                      >█</motion.span>
                    )}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Progress bar */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 9, color: '#607d8b', letterSpacing: '0.15em' }}>SYSTEM BOOT SEQUENCE</span>
                <span style={{ fontSize: 9, color: '#00b8d4' }}>{Math.round(progress)}%</span>
              </div>
              <div style={{ height: 2, background: 'rgba(0,184,212,0.15)', position: 'relative', overflow: 'hidden' }}>
                <motion.div
                  style={{
                    position: 'absolute', left: 0, top: 0, height: '100%',
                    background: progress === 100 ? '#00ff41' : '#00b8d4',
                    boxShadow: progress === 100 ? '0 0 8px #00ff41' : '0 0 6px #00b8d4',
                    transition: 'background 0.3s',
                  }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                />
                {/* Shimmer */}
                <motion.div
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                  style={{
                    position: 'absolute', top: 0, width: '30%', height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                  }}
                />
              </div>
            </div>

            {/* Status row */}
            <div style={{ display: 'flex', gap: 24 }}>
              {[
                { label: 'CORE', ok: true },
                { label: 'FAISS', ok: visibleLines > 2 },
                { label: 'CRAWLERS', ok: visibleLines > 4 },
                { label: 'AI', ok: visibleLines > 5 },
                { label: 'SOCKET', ok: visibleLines > 6 },
              ].map(({ label, ok }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: ok ? '#00ff41' : '#607d8b',
                    boxShadow: ok ? '0 0 6px #00ff41' : 'none',
                    transition: 'all 0.3s',
                  }} />
                  <span style={{ fontSize: 9, color: ok ? '#00ff41' : '#607d8b', letterSpacing: '0.1em' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
