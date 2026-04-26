import { motion } from 'framer-motion'

const STEPS = [
  'UPLOADING',
  'EXTRACTING FRAMES',
  'GENERATING FINGERPRINT',
  'EMBEDDING WATERMARK',
  'ASSET SECURED',
]

export function ScanningBar({ className = '' }) {
  return (
    <div className={`scanning-bar ${className}`} />
  )
}

export function UploadProgress({ status, progress }) {
  const stepIndex = STEPS.findIndex((s) => s === status?.toUpperCase().replace(/_/g, ' '))
  const currentStep = stepIndex >= 0 ? stepIndex : 0
  const isComplete = status === 'secured' || status === 'ASSET SECURED'

  return (
    <div className="space-y-3">
      {/* Step labels */}
      <div className="flex items-center justify-between">
        <span
          className="font-data text-xs tracking-widest"
          style={{ color: isComplete ? 'var(--accent-signal)' : 'var(--accent-data)' }}
        >
          {isComplete ? 'ASSET SECURED ✓' : (STEPS[currentStep] || 'PROCESSING') + '...'}
        </span>
        <span className="font-data text-xs" style={{ color: 'var(--text-secondary)' }}>
          {isComplete ? '100%' : `${Math.round(progress || 0)}%`}
        </span>
      </div>

      {/* Progress track */}
      <div
        style={{
          height: 2,
          background: 'rgba(0,184,212,0.15)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Fill */}
        <motion.div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            background: isComplete ? 'var(--accent-signal)' : 'var(--accent-data)',
            boxShadow: isComplete ? 'var(--glow-signal)' : 'var(--glow-data)',
          }}
          animate={{ width: `${isComplete ? 100 : progress || 0}%` }}
          transition={{ duration: 0.4 }}
        />

        {/* Scanning beam (only while in progress) */}
        {!isComplete && (
          <motion.div
            style={{
              position: 'absolute',
              top: 0,
              width: '8%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(0,184,212,0.8), transparent)',
              boxShadow: '0 0 10px var(--accent-data)',
            }}
            animate={{ left: ['-10%', '110%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />
        )}
      </div>

      {/* Step dots */}
      <div className="flex gap-2">
        {STEPS.map((step, i) => (
          <div
            key={step}
            style={{
              flex: 1,
              height: 2,
              background:
                i < currentStep || isComplete
                  ? 'var(--accent-signal)'
                  : i === currentStep
                  ? 'var(--accent-data)'
                  : 'rgba(96,125,139,0.3)',
              transition: 'background 0.3s',
              boxShadow:
                i < currentStep || isComplete ? '0 0 4px var(--accent-signal)' : 'none',
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default ScanningBar
