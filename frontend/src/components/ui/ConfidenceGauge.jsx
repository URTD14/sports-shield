import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

function interpolateColor(value) {
  // 0→green, 50→amber, 85→red
  if (value < 60) return '#00b8d4' // data blue (low)
  if (value < 85) return '#ffab00' // amber (medium)
  return '#ff1744' // threat red (high)
}

export default function ConfidenceGauge({ value = 0, size = 160 }) {
  const [displayed, setDisplayed] = useState(0)

  useEffect(() => {
    let start = null
    const duration = 1200
    const animate = (timestamp) => {
      if (!start) start = timestamp
      const progress = Math.min((timestamp - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(Math.round(eased * value))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [value])

  const radius = (size - 20) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = circumference
  const strokeDashoffset = circumference * (1 - displayed / 100)
  const color = interpolateColor(displayed)

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(96,125,139,0.2)"
          strokeWidth={6}
        />
        {/* Arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeLinecap="square"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          style={{
            filter: `drop-shadow(0 0 8px ${color})`,
            transition: 'stroke-dashoffset 0.05s, stroke 0.3s',
          }}
        />
      </svg>

      {/* Center text */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          className="font-orbitron font-bold"
          style={{ fontSize: size * 0.22, color, lineHeight: 1 }}
        >
          {displayed}%
        </span>
        <span
          className="font-data"
          style={{ fontSize: 9, color: 'var(--text-secondary)', marginTop: 2, letterSpacing: '0.1em' }}
        >
          MATCH
        </span>
      </div>
    </div>
  )
}
