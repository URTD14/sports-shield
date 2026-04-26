import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import MetricCard from '../components/ui/MetricCard'
import ContentSpreadMap from '../components/d3/ContentSpreadMap'
import { getIntelligenceOverview, exportViolationsCSV, getIntelligenceReport } from '../services/api'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

const DEFAULT_METRICS = [
  { label: 'TOTAL ASSETS PROTECTED', value: 47293, delta: 12 },
  { label: 'VIOLATIONS — 30 DAYS', value: 3841, delta: 8 },
  { label: 'TAKEDOWNS SUBMITTED', value: 2104, delta: 5 },
  { label: 'TAKEDOWN SUCCESS RATE', value: 87, suffix: '%', delta: 3 },
  { label: 'REVENUE IMPACT PREVENTED', value: 284000, prefix: '$', delta: 22 },
]

const DEFAULT_TIMELINE = Array.from({ length: 30 }, (_, i) => {
  const date = new Date()
  date.setDate(date.getDate() - (29 - i))
  return {
    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    youtube: Math.floor(30 + Math.random() * 40),
    tiktok: Math.floor(20 + Math.random() * 30),
    twitter: Math.floor(10 + Math.random() * 20),
    web: Math.floor(5 + Math.random() * 15),
  }
})

const DEFAULT_PLATFORM_PIE = [
  { name: 'YouTube', value: 1240, color: '#ff0000' },
  { name: 'TikTok', value: 960, color: '#ff0050' },
  { name: 'Twitter', value: 580, color: '#1da1f2' },
  { name: 'Web', value: 420, color: '#607d8b' },
]

const DEFAULT_OFFENDERS = [
  { platform: 'YouTube', violations: 1240, avgResponse: '2.3h', takedownRate: '91%', status: 'cooperative' },
  { platform: 'TikTok', violations: 960, avgResponse: '4.1h', takedownRate: '82%', status: 'cooperative' },
  { platform: 'Twitter', violations: 580, avgResponse: '8.7h', takedownRate: '74%', status: 'slow' },
  { platform: 'Unknown Web', violations: 420, avgResponse: '48h+', takedownRate: '31%', status: 'resistant' },
]

const CUSTOM_TOOLTIP = ({ active, payload, label }) => {
  if (!active || !payload) return null
  return (
    <div
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        padding: '8px 12px',
        fontFamily: '"Share Tech Mono", monospace',
        fontSize: 10,
      }}
    >
      <div style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color }}>
          {p.name.toUpperCase()}: {p.value}
        </div>
      ))}
    </div>
  )
}

export default function Intelligence() {
  const [metrics, setMetrics] = useState(DEFAULT_METRICS)
  const [timeline, setTimeline] = useState(DEFAULT_TIMELINE)
  const [platformPie, setPlatformPie] = useState(DEFAULT_PLATFORM_PIE)
  const [offenders, setOffenders] = useState(DEFAULT_OFFENDERS)
  const [exportingCSV, setExportingCSV] = useState(false)
  const [exportingPDF, setExportingPDF] = useState(false)

  useEffect(() => {
    getIntelligenceOverview()
      .then((res) => {
        const d = res.data
        setMetrics([
          { label: 'TOTAL ASSETS PROTECTED', value: d.total_assets || 47293, delta: 12 },
          { label: 'VIOLATIONS — 30 DAYS', value: d.violations_30d || 3841, delta: 8 },
          { label: 'TAKEDOWNS SUBMITTED', value: d.takedowns_submitted || 2104, delta: 5 },
          { label: 'TAKEDOWN SUCCESS RATE', value: d.takedown_success_rate || 87, suffix: '%', delta: 3 },
          { label: 'REVENUE IMPACT PREVENTED', value: d.revenue_impact_prevented || 284000, prefix: '$', delta: 22 },
        ])
        if (d.violation_timeline?.length) setTimeline(d.violation_timeline)
        if (d.platform_breakdown?.length) setPlatformPie(d.platform_breakdown)
        if (d.top_offenders?.length) {
          setOffenders(d.top_offenders.map((o) => ({
            platform: o.platform,
            violations: o.violations,
            avgResponse: o.avg_response,
            takedownRate: `${o.takedown_rate}%`,
            status: o.takedown_rate >= 80 ? 'cooperative' : o.takedown_rate >= 50 ? 'slow' : 'resistant',
          })))
        }
      })
      .catch(() => {}) // keep defaults on error
  }, [])

  const handleExportCSV = async () => {
    setExportingCSV(true)
    try {
      const res = await exportViolationsCSV()
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `violations-${Date.now()}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('CSV export failed', e)
    } finally {
      setExportingCSV(false)
    }
  }

  const handleExportPDF = async () => {
    setExportingPDF(true)
    try {
      const res = await getIntelligenceReport()
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = 'sportshield-intelligence-report.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('PDF export failed', e)
    } finally {
      setExportingPDF(false)
    }
  }

  return (
    <div style={{ paddingTop: 108, padding: '108px 40px 40px' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <span className="font-data text-xs tracking-widest" style={{ color: 'var(--accent-data)', display: 'block', marginBottom: 4 }}>
            EXECUTIVE INTELLIGENCE
          </span>
          <h1 className="font-orbitron font-bold" style={{ fontSize: 28, letterSpacing: '0.06em' }}>
            GLOBAL THREAT INTELLIGENCE
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            className="btn btn-ghost"
            style={{ padding: '8px 16px', fontSize: 10, opacity: exportingCSV ? 0.6 : 1 }}
            onClick={handleExportCSV}
            disabled={exportingCSV}
            data-cursor="interactive"
          >
            {exportingCSV ? 'EXPORTING...' : 'EXPORT RAW DATA (CSV)'}
          </button>
          <button
            className="btn btn-threat"
            style={{ padding: '8px 16px', fontSize: 10, opacity: exportingPDF ? 0.6 : 1 }}
            onClick={handleExportPDF}
            disabled={exportingPDF}
            data-cursor="interactive"
          >
            {exportingPDF ? 'GENERATING...' : 'GENERATE INTEL REPORT →'}
          </button>
        </div>
      </div>

      {/* Metric cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 12,
          marginBottom: 32,
        }}
      >
        {metrics.map((m, i) => (
          <MetricCard key={m.label} {...m} index={i} />
        ))}
      </div>

      {/* Charts grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: 16,
          marginBottom: 32,
        }}
      >
        {/* Violation timeline */}
        <div className="card" style={{ padding: 20 }}>
          <SectionHeader title="VIOLATION TIMELINE" sub="30 DAYS BY PLATFORM" />
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={timeline} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <defs>
                {[
                  ['youtube', '#ff0000'],
                  ['tiktok', '#ff0050'],
                  ['twitter', '#1da1f2'],
                  ['web', '#607d8b'],
                ].map(([key, color]) => (
                  <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fill: '#607d8b', fontSize: 8, fontFamily: '"Share Tech Mono", monospace' }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(0,184,212,0.15)' }}
                interval={6}
              />
              <YAxis
                tick={{ fill: '#607d8b', fontSize: 8, fontFamily: '"Share Tech Mono", monospace' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CUSTOM_TOOLTIP />} />
              {[
                ['youtube', '#ff0000'],
                ['tiktok', '#ff0050'],
                ['twitter', '#1da1f2'],
                ['web', '#607d8b'],
              ].map(([key, color]) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stackId="1"
                  stroke={color}
                  fill={`url(#grad-${key})`}
                  strokeWidth={1.5}
                  animationDuration={800}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Platform donut */}
        <div className="card" style={{ padding: 20 }}>
          <SectionHeader title="PLATFORM DISTRIBUTION" />
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={platformPie}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                animationDuration={800}
              >
                {platformPie.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip
                formatter={(val, name) => [val, name]}
                contentStyle={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  fontFamily: '"Share Tech Mono", monospace',
                  fontSize: 10,
                }}
              />
              <Legend
                iconType="square"
                iconSize={8}
                wrapperStyle={{ fontFamily: '"Share Tech Mono", monospace', fontSize: 9, color: '#607d8b' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Content Spread Network */}
      <div className="card" style={{ padding: 20, marginBottom: 32 }}>
        <SectionHeader title="GLOBAL CONTENT SPREAD NETWORK" sub="ALL ASSETS — FORCE GRAPH" />
        <ContentSpreadMap height={360} />
      </div>

      {/* Top offenders */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <SectionHeader title="REPEAT OFFENDER PLATFORMS" />
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              {['PLATFORM', 'TOTAL VIOLATIONS', 'AVG RESPONSE TIME', 'TAKEDOWN RATE', 'STATUS'].map((h) => (
                <th
                  key={h}
                  className="font-data"
                  style={{
                    padding: '10px 20px',
                    textAlign: 'left',
                    fontSize: 9,
                    letterSpacing: '0.12em',
                    color: 'var(--text-secondary)',
                    fontWeight: 400,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {offenders.map((row, i) => (
              <motion.tr
                key={row.platform}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                style={{ borderBottom: '1px solid var(--border-subtle)' }}
              >
                <td className="font-mono" style={{ padding: '12px 20px', fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>
                  {row.platform}
                </td>
                <td className="font-orbitron" style={{ padding: '12px 20px', fontSize: 13, color: 'var(--accent-threat)', fontWeight: 700 }}>
                  {row.violations.toLocaleString()}
                </td>
                <td className="font-data" style={{ padding: '12px 20px', fontSize: 11, color: 'var(--text-secondary)' }}>
                  {row.avgResponse}
                </td>
                <td
                  className="font-orbitron"
                  style={{
                    padding: '12px 20px',
                    fontSize: 12,
                    fontWeight: 700,
                    color:
                      parseFloat(row.takedownRate) >= 80
                        ? 'var(--accent-signal)'
                        : parseFloat(row.takedownRate) >= 50
                        ? 'var(--accent-warn)'
                        : 'var(--accent-threat)',
                  }}
                >
                  {row.takedownRate}
                </td>
                <td style={{ padding: '12px 20px' }}>
                  <span
                    className="badge font-data"
                    style={{
                      fontSize: 9,
                      color:
                        row.status === 'cooperative'
                          ? 'var(--accent-signal)'
                          : row.status === 'slow'
                          ? 'var(--accent-warn)'
                          : 'var(--accent-threat)',
                      borderColor:
                        row.status === 'cooperative'
                          ? 'rgba(0,255,65,0.3)'
                          : row.status === 'slow'
                          ? 'rgba(255,171,0,0.3)'
                          : 'rgba(255,23,68,0.3)',
                      background:
                        row.status === 'cooperative'
                          ? 'rgba(0,255,65,0.05)'
                          : row.status === 'slow'
                          ? 'rgba(255,171,0,0.05)'
                          : 'rgba(255,23,68,0.05)',
                    }}
                  >
                    {row.status.toUpperCase()}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SectionHeader({ title, sub }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div className="flex items-center gap-3">
        <div style={{ width: 20, height: 1, background: 'var(--accent-data)' }} />
        <h2 className="font-orbitron font-bold" style={{ fontSize: 12, letterSpacing: '0.1em' }}>
          {title}
        </h2>
        {sub && (
          <span className="font-data" style={{ fontSize: 9, color: 'var(--text-secondary)' }}>
            — {sub}
          </span>
        )}
      </div>
    </div>
  )
}
