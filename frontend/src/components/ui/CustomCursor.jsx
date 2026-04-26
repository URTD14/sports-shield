import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

export default function CustomCursor() {
  const cursorX = useMotionValue(-200)
  const cursorY = useMotionValue(-200)

  const trailX = useSpring(cursorX, { stiffness: 70, damping: 18 })
  const trailY = useSpring(cursorY, { stiffness: 70, damping: 18 })

  const slowX = useSpring(cursorX, { stiffness: 30, damping: 14 })
  const slowY = useSpring(cursorY, { stiffness: 30, damping: 14 })

  const [hovered, setHovered]   = useState(false)
  const [threat,  setThreat]    = useState(false)
  const [clicked, setClicked]   = useState(false)
  const [label,   setLabel]     = useState('')
  const pulseRef  = useRef(null)

  useEffect(() => {
    const move = (e) => {
      cursorX.set(e.clientX)
      cursorY.set(e.clientY)
    }

    const checkHover = (e) => {
      const el = e.target
      const interactive = el.closest('a, button, [role="button"], input, select, textarea, [data-cursor="interactive"]')
      const threatEl    = el.closest('[data-cursor="threat"]')
      setHovered(!!interactive)
      setThreat(!!threatEl)
      setLabel(interactive?.dataset?.cursorLabel || '')
    }

    const down = () => setClicked(true)
    const up   = () => setClicked(false)

    window.addEventListener('mousemove', move)
    window.addEventListener('mouseover', checkHover)
    window.addEventListener('mousedown', down)
    window.addEventListener('mouseup',   up)

    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseover', checkHover)
      window.removeEventListener('mousedown', down)
      window.removeEventListener('mouseup',   up)
    }
  }, [])

  const color     = threat ? 'var(--accent-threat)' : hovered ? 'var(--accent-signal)' : 'var(--accent-data)'
  const ringSize  = clicked ? 18 : hovered ? 52 : 30
  const crossSize = hovered ? 28 : 18

  return (
    <>
      {/* Inner crosshair — snaps to cursor */}
      <motion.div
        style={{
          position: 'fixed', top: 0, left: 0,
          x: cursorX, y: cursorY,
          translateX: '-50%', translateY: '-50%',
          pointerEvents: 'none', zIndex: 99999,
        }}
      >
        {/* Horizontal bar */}
        <div style={{
          position: 'absolute',
          width: crossSize, height: 1,
          background: color,
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          transition: 'width 0.12s, background 0.2s',
          boxShadow: `0 0 8px ${color}`,
        }} />
        {/* Vertical bar */}
        <div style={{
          position: 'absolute',
          width: 1, height: crossSize,
          background: color,
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          transition: 'height 0.12s, background 0.2s',
          boxShadow: `0 0 8px ${color}`,
        }} />
        {/* Center dot */}
        <div style={{
          position: 'absolute',
          width: clicked ? 6 : 3, height: clicked ? 6 : 3,
          borderRadius: '50%',
          background: color,
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          transition: 'all 0.1s',
          boxShadow: `0 0 6px ${color}`,
        }} />

        {/* Corner ticks (appear on hover) */}
        {hovered && ['tl', 'tr', 'bl', 'br'].map((pos) => (
          <div key={pos} style={{
            position: 'absolute',
            width: 6, height: 6,
            ...(pos.includes('t') ? { top: -14 } : { bottom: -14 }),
            ...(pos.includes('l') ? { left: -14 } : { right: -14 }),
            borderTop:    pos.includes('t') ? `1px solid ${color}` : 'none',
            borderBottom: pos.includes('b') ? `1px solid ${color}` : 'none',
            borderLeft:   pos.includes('l') ? `1px solid ${color}` : 'none',
            borderRight:  pos.includes('r') ? `1px solid ${color}` : 'none',
            opacity: 0.8,
          }} />
        ))}
      </motion.div>

      {/* Outer ring — trails with spring */}
      <motion.div
        style={{
          position: 'fixed', top: 0, left: 0,
          x: trailX, y: trailY,
          translateX: '-50%', translateY: '-50%',
          pointerEvents: 'none', zIndex: 99998,
          width: ringSize, height: ringSize,
          border: `1px solid ${color}`,
          borderRadius: threat ? '0%' : '50%',
          opacity: clicked ? 0.3 : 0.55,
          boxShadow: hovered ? `0 0 16px ${color}, inset 0 0 8px ${color}22` : 'none',
          transition: 'width 0.18s, height 0.18s, border-color 0.2s, border-radius 0.2s, opacity 0.1s',
        }}
      />

      {/* Slow outer glow ring — only when hovered */}
      {hovered && (
        <motion.div
          style={{
            position: 'fixed', top: 0, left: 0,
            x: slowX, y: slowY,
            translateX: '-50%', translateY: '-50%',
            pointerEvents: 'none', zIndex: 99997,
          }}
        >
          <motion.div
            animate={{ scale: [1, 1.6, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
            style={{
              width: 60, height: 60,
              borderRadius: '50%',
              border: `1px solid ${color}`,
              translateX: '-50%', translateY: '-50%',
              position: 'absolute', top: 0, left: 0,
            }}
          />
        </motion.div>
      )}

      {/* Threat mode: extra pulse rings */}
      {threat && (
        <motion.div
          style={{
            position: 'fixed', top: 0, left: 0,
            x: trailX, y: trailY,
            translateX: '-50%', translateY: '-50%',
            pointerEvents: 'none', zIndex: 99996,
          }}
        >
          {[1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ scale: [1, 2.2 + i * 0.4], opacity: [0.5, 0] }}
              transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.3, ease: 'easeOut' }}
              style={{
                position: 'absolute', top: 0, left: 0,
                width: 24, height: 24,
                border: '1px solid var(--accent-threat)',
                borderRadius: '0%',
                translateX: '-50%', translateY: '-50%',
              }}
            />
          ))}
        </motion.div>
      )}

      {/* Label */}
      {label && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: 'fixed', top: 0, left: 0,
            x: trailX, y: trailY,
            translateX: '12px', translateY: '12px',
            pointerEvents: 'none', zIndex: 99999,
            fontFamily: '"Share Tech Mono", monospace',
            fontSize: 9,
            color,
            letterSpacing: '0.1em',
            textShadow: `0 0 8px ${color}`,
          }}
        >
          {label}
        </motion.div>
      )}
    </>
  )
}
