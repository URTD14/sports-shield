export default function StatusBadge({ status }) {
  const map = {
    monitoring: { label: 'MONITORING', cls: 'badge-data' },
    threat_detected: { label: 'THREAT DETECTED', cls: 'badge-threat' },
    clear: { label: 'CLEAR', cls: 'badge-signal' },
    pending: { label: 'PENDING', cls: 'badge-warn' },
    dmca_submitted: { label: 'DMCA SUBMITTED', cls: 'badge-data' },
    resolved: { label: 'RESOLVED', cls: 'badge-signal' },
    dismissed: { label: 'DISMISSED', cls: '' },
    secured: { label: 'SECURED', cls: 'badge-signal' },
    processing: { label: 'PROCESSING', cls: 'badge-warn' },
  }

  const config = map[status] || { label: status?.toUpperCase() || 'UNKNOWN', cls: '' }

  return (
    <span
      className={`badge ${config.cls}`}
      style={!config.cls ? { color: 'var(--text-secondary)', borderColor: 'rgba(96,125,139,0.3)' } : {}}
    >
      {config.cls === 'badge-threat' && <span className="live-dot" style={{ width: 5, height: 5 }} />}
      {config.label}
    </span>
  )
}
