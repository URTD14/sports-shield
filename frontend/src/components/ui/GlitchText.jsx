import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&!?'

function randomGlyph() {
  return GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
}

function GlitchLetter({ char, delay, className }) {
  const [display, setDisplay] = useState(' ')
  const [settled, setSettled] = useState(false)
  const cycles = 5
  const cycleMs = 80

  useEffect(() => {
    let count = 0
    const start = setTimeout(() => {
      const interval = setInterval(() => {
        if (count >= cycles) {
          setDisplay(char)
          setSettled(true)
          clearInterval(interval)
        } else {
          setDisplay(randomGlyph())
          count++
        }
      }, cycleMs)
      return () => clearInterval(interval)
    }, delay)
    return () => clearTimeout(start)
  }, [char, delay])

  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: settled ? [1, 0.95, 1] : 1 }}
      transition={
        settled
          ? { opacity: { duration: 4, repeat: Infinity, delay: Math.random() * 4 } }
          : { opacity: { duration: 0.01 } }
      }
      style={{
        display: 'inline-block',
        color: settled ? undefined : 'var(--accent-data)',
        textShadow: settled
          ? '0 0 20px rgba(232, 244, 253, 0.3)'
          : '0 0 20px var(--accent-data)',
      }}
      className={className}
    >
      {display === ' ' ? '\u00A0' : display}
    </motion.span>
  )
}

export default function GlitchText({ text, className = '', letterDelay = 40 }) {
  return (
    <span className={className} aria-label={text}>
      {text.split('').map((char, i) => (
        <GlitchLetter
          key={i}
          char={char === ' ' ? ' ' : char}
          delay={i * letterDelay}
          className=""
        />
      ))}
    </span>
  )
}
