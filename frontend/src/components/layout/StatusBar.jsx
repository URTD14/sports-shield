import { useEffect } from 'react'
import useShieldStore from '../../store/useShieldStore'
import { getAssets, getViolations } from '../../services/api'

export default function StatusBar() {
  const { systemStatus } = useShieldStore()

  const fmt = (n) => typeof n === 'number' ? n.toLocaleString() : n

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 24,
        zIndex: 999,
        background: 'rgba(5,10,18,0.95)',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 24,
        overflow: 'hidden',
      }}
    >
      <StatusItem
        label="ASSETS"
        value={fmt(systemStatus.assetsMonitored)}
        color="var(--accent-signal)"
      />
      <div style={{ width: 1, height: 12, background: 'var(--border-subtle)' }} />
      <StatusItem
        label="VIOLATIONS TODAY"
        value={fmt(systemStatus.violationsToday)}
        color="var(--accent-threat)"
      />
      <div style={{ width: 1, height: 12, background: 'var(--border-subtle)' }} />
      <StatusItem
        label="PLATFORMS"
        value={systemStatus.platformsMonitored}
        color="var(--accent-data)"
      />
      <div style={{ width: 1, height: 12, background: 'var(--border-subtle)' }} />
      <StatusItem
        label="AVG DETECTION"
        value={`${systemStatus.avgDetectionTime}s`}
        color="var(--accent-data)"
      />
      <div style={{ width: 1, height: 12, background: 'var(--border-subtle)' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: systemStatus.crawlerStatus === 'ACTIVE' ? 'var(--accent-signal)' : 'var(--accent-warn)',
            boxShadow: `0 0 4px ${systemStatus.crawlerStatus === 'ACTIVE' ? 'var(--accent-signal)' : 'var(--accent-warn)'}`,
          }}
        />
        <span className="font-data" style={{ fontSize: 9, color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>
          CRAWLER: {systemStatus.crawlerStatus}
        </span>
      </div>
      <div style={{ width: 1, height: 12, background: 'var(--border-subtle)' }} />
      <span className="font-data" style={{ fontSize: 9, color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>
        LAST SCAN:{' '}
        {systemStatus.lastScan ? new Date(systemStatus.lastScan).toLocaleTimeString() : '—'}
      </span>

      {/* Right: SportShield watermark */}
      <div style={{ marginLeft: 'auto' }}>
        <span className="font-orbitron" style={{ fontSize: 9, color: 'rgba(0,255,65,0.3)', letterSpacing: '0.2em' }}>
          SPORTSHIELD v1.0
        </span>
      </div>
    </div>
  )
}

function StatusItem({ label, value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span className="font-data" style={{ fontSize: 9, color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>
        {label}:
      </span>
      <span className="font-data" style={{ fontSize: 9, color, fontWeight: 600 }}>
        {value}
      </span>
    </div>
  )
}
