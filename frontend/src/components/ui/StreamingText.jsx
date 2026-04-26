import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

export default function StreamingText({ text, streaming, className = '' }) {
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [text])

  // Parse sections (lines starting with uppercase words followed by colon)
  const renderText = (raw) => {
    if (!raw) return null
    const lines = raw.split('\n')
    return lines.map((line, i) => {
      const isSectionHeader = /^[A-Z][A-Z\s]+:/.test(line.trim())
      if (isSectionHeader) {
        return (
          <div key={i} style={{ marginTop: i > 0 ? 16 : 0, marginBottom: 4 }}>
            <span
              className="font-data text-xs tracking-widest"
              style={{ color: 'var(--accent-gemini)' }}
            >
              {line}
            </span>
          </div>
        )
      }
      return (
        <div key={i} style={{ marginBottom: line === '' ? 8 : 0 }}>
          <span className="font-mono text-sm" style={{ color: 'var(--text-primary)' }}>
            {line}
          </span>
        </div>
      )
    })
  }

  return (
    <div className={`${className}`} style={{ fontFamily: '"IBM Plex Mono", monospace', lineHeight: 1.7 }}>
      {renderText(text)}
      {streaming && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          style={{ color: 'var(--accent-gemini)', marginLeft: 2 }}
        >
          |
        </motion.span>
      )}
      <div ref={endRef} />
    </div>
  )
}
