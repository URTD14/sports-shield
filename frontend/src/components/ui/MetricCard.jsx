import { motion } from 'framer-motion'
import { useCountUpInView } from '../../hooks/useCountUp'

export default function MetricCard({ label, value, delta, prefix = '', suffix = '', decimals = 0, index = 0 }) {
  const { ref, value: displayValue } = useCountUpInView(
    typeof value === 'number' ? value : parseFloat(value) || 0,
    2000,
    decimals
  )

  const isPositiveDelta = delta > 0

  return (
    <motion.div
      ref={ref}
      className="card card-interactive"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      style={{ padding: '20px 24px', position: 'relative', overflow: 'hidden' }}
    >
      {/* Scan sweep on hover */}
      <motion.div
        initial={{ x: '-100%' }}
        whileHover={{ x: '200%' }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        style={{
          position: 'absolute', top: 0, left: 0, width: '40%', height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(0,184,212,0.05), transparent)',
          pointerEvents: 'none',
        }}
      />

      {/* Top glow line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, transparent, var(--accent-data), transparent)',
        opacity: 0.4,
      }} />

      <div className="font-data" style={{ fontSize: 9, color: 'var(--text-secondary)', letterSpacing: '0.14em', marginBottom: 12 }}>
        {label}
      </div>

      <div className="font-orbitron font-bold" style={{
        fontSize: 30, color: 'var(--accent-signal)', lineHeight: 1,
        textShadow: '0 0 20px rgba(0,255,65,0.25)',
      }}>
        {prefix}{typeof displayValue === 'number' ? displayValue.toLocaleString() : displayValue}{suffix}
      </div>

      {delta !== undefined && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.08 + 0.5 }}
          className="font-data"
          style={{ fontSize: 9, marginTop: 8, color: isPositiveDelta ? 'var(--accent-signal)' : 'var(--accent-threat)' }}
        >
          {isPositiveDelta ? '▲' : '▼'} {Math.abs(delta)}% vs yesterday
        </motion.div>
      )}
    </motion.div>
  )
}
