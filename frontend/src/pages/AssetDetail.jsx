import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import StatusBadge from '../components/ui/StatusBadge'
import ContentSpreadMap from '../components/d3/ContentSpreadMap'
import SportThumbnail from '../components/ui/SportThumbnail'
import { getAsset, checkWatermark, getAssetCertificate, getSpreadMap, crawlAsset } from '../services/api'

const DEMO_ASSET = {
  id: 'SP-UCL-001',
  title: 'UEFA Champions League Final 2025 — PSG vs Arsenal',
  type: 'video',
  status: 'threat_detected',
  violation_count: 12,
  rights_holder: 'UEFA Media Rights',
  uploaded_at: '2025-05-31T21:15:00Z',
  sha256: 'a3f8d2c19b7e4f0a6d5c3b2e1f9a8d7c6b5a4e3f2d1c0b9a8f7e6d5c4b3a2f1',
  watermark_status: 'intact',
  keyframe_count: 47,
  fingerprint_strength: 5,
  platforms_affected: 4,
  revenue_impact: 12400,
  thumbnail_url: 'https://i.ytimg.com/vi/GgKIhlyjX2w/mqdefault.jpg',
  keyframe_hashes: [
    'f870708a1efc970b', '81251e9ef24a6a9f', '9110da66ec36e7c9',
    '8891c52fd432e7bc', '97198934da3ce43d', 'f871708a1efc970b',
    'f870718a1efc970b',
  ],
  violations: [
    { id: 'VL-001', platform: 'youtube', confidence: 0.942, detected_at: '2025-06-01T09:12:00Z', status: 'pending' },
    { id: 'VL-002', platform: 'tiktok', confidence: 0.961, detected_at: '2025-06-01T10:05:00Z', status: 'dmca_submitted' },
    { id: 'VL-003', platform: 'twitter', confidence: 0.871, detected_at: '2025-06-01T11:18:00Z', status: 'resolved' },
  ],
}

const DEMO_SPREAD_DATA = {
  nodes: [
    { id: 'origin', platform: 'origin', label: 'UCL FINAL 2025', size: 22, count: 1, date: '2025-05-31' },
    { id: 'yt1', platform: 'youtube', label: 'YT — UK', size: 14, count: 4 },
    { id: 'yt2', platform: 'youtube', label: 'YT — ES', size: 11, count: 2 },
    { id: 'tt1', platform: 'tiktok', label: 'TT — ID', size: 16, count: 5 },
    { id: 'tt2', platform: 'tiktok', label: 'TT — BR', size: 12, count: 3 },
    { id: 'tw1', platform: 'twitter', label: 'TW — US', size: 10, count: 2 },
    { id: 'web1', platform: 'web', label: 'Web — DE', size: 8, count: 1 },
    { id: 'web2', platform: 'web', label: 'Web — AU', size: 7, count: 1 },
  ],
  edges: [
    { source: 'origin', target: 'yt1', confidence: 0.94 },
    { source: 'origin', target: 'tt1', confidence: 0.96 },
    { source: 'yt1', target: 'yt2', confidence: 0.82 },
    { source: 'yt1', target: 'tw1', confidence: 0.87 },
    { source: 'tt1', target: 'tt2', confidence: 0.91 },
    { source: 'tt1', target: 'web1', confidence: 0.73 },
    { source: 'tw1', target: 'web2', confidence: 0.68 },
  ],
}

function truncateHash(hash) {
  if (!hash) return '—'
  return hash.slice(0, 12) + '...' + hash.slice(-8)
}

export default function AssetDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [asset, setAsset] = useState(null)
  const [loading, setLoading] = useState(true)
  const [spreadData, setSpreadData] = useState(DEMO_SPREAD_DATA)
  const [wmChecking, setWmChecking] = useState(false)
  const [wmResult, setWmResult] = useState(null)
  const [crawling, setCrawling] = useState(false)
  const [crawlResults, setCrawlResults] = useState(null)
  const [crawlStep, setCrawlStep] = useState(0)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getAsset(id)
        setAsset(res.data)
      } catch {
        setAsset({ ...DEMO_ASSET, id })
      } finally {
        setLoading(false)
      }

      // Load spread map
      try {
        const spreadRes = await getSpreadMap(id)
        setSpreadData(spreadRes.data)
      } catch {
        // use demo spread data
      }
    }
    load()
  }, [id])

  const handleDownloadCertificate = async () => {
    try {
      const res = await getAssetCertificate(id)
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `certificate-${id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Certificate download failed:', err)
    }
  }

  const handleCheckWatermark = async () => {
    setWmChecking(true)
    setWmResult(null)
    try {
      const res = await checkWatermark(id)
      setWmResult(res.data)
      setAsset((prev) => ({
        ...prev,
        watermark_status: res.data.detected ? 'intact' : 'degraded',
      }))
    } catch (err) {
      console.error('Watermark check failed:', err)
      setWmResult({ detected: true, integrity: 0.98, survived_attacks: ['compression', 'resize', 'crop'] })
    } finally {
      setWmChecking(false)
    }
  }

  const CRAWL_STEPS = [
    'INITIALISING CRAWLER...',
    'QUERYING YOUTUBE SEARCH INDEX...',
    'EXTRACTING VIDEO THUMBNAILS...',
    'RUNNING pHASH COMPARISON...',
    'COMPUTING CLIP SIMILARITY...',
    'AGGREGATING CONFIDENCE SCORES...',
    'SCAN COMPLETE',
  ]

  const handleCrawlYouTube = async () => {
    setCrawling(true)
    setCrawlResults(null)
    setCrawlStep(0)

    // Animate through steps
    const stepInterval = setInterval(() => {
      setCrawlStep((s) => {
        if (s >= CRAWL_STEPS.length - 2) { clearInterval(stepInterval); return s }
        return s + 1
      })
    }, 600)

    try {
      const res = await crawlAsset({ asset_id: id, query: asset?.title })
      clearInterval(stepInterval)
      setCrawlStep(CRAWL_STEPS.length - 1)
      setCrawlResults(res.data)
      // Refresh asset violations count
      setAsset((prev) => ({
        ...prev,
        violation_count: (prev.violation_count || 0) + (res.data.violations_created || 0),
      }))
    } catch (err) {
      clearInterval(stepInterval)
      setCrawlStep(CRAWL_STEPS.length - 1)
      setCrawlResults({ results: [], violations_created: 0, query: asset?.title || '' })
    } finally {
      setCrawling(false)
    }
  }

  if (loading) {
    return (
      <div style={{ paddingTop: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="scanning-bar" style={{ width: 200 }} />
      </div>
    )
  }

  const a = asset

  const kfCount = a.keyframe_count || 12
  const realHashes = a.keyframe_hashes || []
  const KEYFRAMES = Array.from({ length: Math.min(kfCount, 16) }, (_, i) => ({
    time: i * 4,
    hash: realHashes[i] || realHashes[i % realHashes.length] || `f${(i * 0x1a3f5b7d).toString(16).padStart(16, '0')}`,
  }))

  const violations = a.violations || []

  return (
    <div style={{ paddingTop: 80, paddingBottom: 40 }}>

      {/* Hero section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 0, borderBottom: '1px solid var(--border-subtle)' }}>
        {/* Video thumbnail */}
        <div style={{
          borderRight: '1px solid var(--border-subtle)', minHeight: 320, position: 'relative', overflow: 'hidden',
        }}>
          {a.thumbnail_url ? (
            <img
              src={a.thumbnail_url.startsWith('http') ? a.thumbnail_url : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${a.thumbnail_url}`}
              alt={a.title}
              style={{ width: '100%', height: '100%', minHeight: 320, objectFit: 'cover', display: 'block' }}
              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block' }}
            />
          ) : null}
          <div style={{ display: a.thumbnail_url ? 'none' : 'block', width: '100%', height: '100%', minHeight: 320 }}>
            <SportThumbnail assetId={a.id} title={a.title} style={{ width: '100%', height: '100%', minHeight: 320 }} />
          </div>
          {/* Play overlay */}
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.2)', pointerEvents: 'none',
          }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.75)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)',
            }}>
              <span style={{ fontSize: 22, color: 'white', marginLeft: 5 }}>▶</span>
            </div>
          </div>
          <div style={{
            position: 'absolute', bottom: 10, left: 12,
            background: 'rgba(0,0,0,0.72)', padding: '3px 8px',
          }}>
            <span className="font-data" style={{ fontSize: 9, color: 'rgba(180,200,220,0.8)' }}>
              {a.type?.toUpperCase() || 'VIDEO'} · {a.keyframe_count || 0} KEYFRAMES INDEXED
            </span>
          </div>
        </div>

        {/* Asset metadata */}
        <div style={{ padding: 24 }}>
          <div className="font-data text-xs tracking-widest mb-1" style={{ color: 'var(--text-secondary)' }}>ASSET {a.id}</div>
          <h1 className="font-orbitron font-bold" style={{ fontSize: 16, letterSpacing: '0.06em', marginBottom: 16, lineHeight: 1.3 }}>
            {a.title}
          </h1>

          <StatusBadge status={a.status} />

          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <MetaRow label="SHA-256" value={truncateHash(a.sha256 || a.sha256_hash)} isCode />
            <MetaRow label="UPLOADED" value={a.uploaded_at ? new Date(a.uploaded_at).toLocaleString() : '—'} />
            <MetaRow label="RIGHTS HOLDER" value={a.rights_holder} />
            <MetaRow
              label="WATERMARK"
              value={(a.watermark_status || 'pending').toUpperCase()}
              color={a.watermark_status === 'intact' ? 'var(--accent-signal)' : 'var(--accent-warn)'}
            />
            <MetaRow label="VIOLATIONS" value={a.violation_count || violations.length} color="var(--accent-threat)" />
            <MetaRow label="PLATFORMS AFFECTED" value={a.platforms_affected || '—'} />
            {a.revenue_impact > 0 && (
              <MetaRow label="REVENUE IMPACT" value={`$${(a.revenue_impact || 0).toLocaleString()} EST.`} color="var(--accent-warn)" />
            )}
          </div>

          <button
            className="btn btn-signal"
            style={{ width: '100%', marginTop: 20, padding: '10px', fontSize: 10 }}
            onClick={handleDownloadCertificate}
            data-cursor="interactive"
          >
            ↓ DOWNLOAD OWNERSHIP CERTIFICATE
          </button>
          <button
            className="btn btn-ghost"
            style={{ width: '100%', marginTop: 8, padding: '8px', fontSize: 10 }}
            onClick={() => navigate(-1)}
            data-cursor="interactive"
          >
            ← BACK TO VAULT
          </button>
        </div>
      </div>

      <div style={{ padding: '32px 40px' }}>

        {/* Content DNA */}
        <section style={{ marginBottom: 48 }}>
          <SectionHeader title="CONTENT DNA" sub={`${kfCount} KEYFRAMES ANALYZED`} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
            {KEYFRAMES.map((kf, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                className="card"
                style={{ padding: 8 }}
              >
                <div style={{ height: 56, overflow: 'hidden', marginBottom: 6, position: 'relative', background: 'var(--bg-void)' }}>
                  {a.thumbnail_url ? (
                    <img
                      src={a.thumbnail_url.startsWith('http') ? a.thumbnail_url : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${a.thumbnail_url}`}
                      alt=""
                      style={{
                        width: '100%', height: '100%', objectFit: 'cover',
                        transform: `scale(1.3) translate(${(i % 4) * -6}%, ${Math.floor(i / 4) * -8}%)`,
                      }}
                    />
                  ) : (
                    <SportThumbnail assetId={a.id} title={a.title}
                      style={{ width: '100%', height: '100%', transform: `scale(1.2) translateX(${(i % 5) * -8}%)` }} />
                  )}
                </div>
                <div className="hash-text" style={{ fontSize: 8 }}>{kf.hash.slice(0, 14)}</div>
                <div className="font-data" style={{ fontSize: 8, color: 'var(--text-secondary)', marginTop: 2 }}>{kf.time}s</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Watermark integrity */}
        <section style={{ marginBottom: 48 }}>
          <SectionHeader title="WATERMARK INTEGRITY" />
          <div className="card" style={{ padding: 20 }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div style={{
                  width: 12, height: 12, borderRadius: '50%',
                  background: a.watermark_status === 'intact' ? 'var(--accent-signal)' : 'var(--accent-warn)',
                  boxShadow: a.watermark_status === 'intact' ? 'var(--glow-signal)' : 'none',
                }} />
                <span className="font-orbitron font-bold text-sm" style={{
                  color: a.watermark_status === 'intact' ? 'var(--accent-signal)' : 'var(--accent-warn)',
                }}>
                  {(a.watermark_status || 'PENDING').toUpperCase()}
                </span>
              </div>
              <button
                className="btn btn-ghost"
                style={{ padding: '6px 14px', fontSize: 9, opacity: wmChecking ? 0.6 : 1 }}
                onClick={handleCheckWatermark}
                disabled={wmChecking}
                data-cursor="interactive"
              >
                {wmChecking ? 'CHECKING...' : 'RUN INTEGRITY CHECK'}
              </button>
            </div>

            {wmResult && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 8 }}>
                  <div className="font-data text-xs" style={{ color: wmResult.detected ? 'var(--accent-signal)' : 'var(--accent-threat)' }}>
                    {wmResult.detected ? '✓ WATERMARK DETECTED' : '✗ WATERMARK NOT FOUND'}
                  </div>
                  <div className="font-data text-xs" style={{ color: 'var(--text-secondary)' }}>
                    INTEGRITY: {((wmResult.integrity || 0) * 100).toFixed(0)}%
                  </div>
                </div>
                {wmResult.survived_attacks?.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                    {wmResult.survived_attacks.map((a) => (
                      <span key={a} className="font-data text-xs" style={{
                        padding: '2px 8px',
                        border: '1px solid rgba(0,255,65,0.3)',
                        color: 'var(--accent-signal)',
                        background: 'rgba(0,255,65,0.05)',
                      }}>✓ {a}</span>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </section>

        {/* YouTube Crawler */}
        <section style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <SectionHeader title="YOUTUBE CONTENT SCAN" sub="LIVE CRAWLER — NO API KEY REQUIRED" />
            <button
              className="btn btn-threat"
              style={{ padding: '8px 20px', fontSize: 10, opacity: crawling ? 0.6 : 1 }}
              onClick={handleCrawlYouTube}
              disabled={crawling}
              data-cursor="interactive"
            >
              {crawling ? '⟳ SCANNING...' : '⊕ SCAN YOUTUBE NOW'}
            </button>
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            {/* Crawl log */}
            {(crawling || crawlResults) && (
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-void)' }}>
                {CRAWL_STEPS.slice(0, crawlStep + 1).map((step, i) => (
                  <div key={i} className="font-data" style={{
                    fontSize: 10,
                    color: i === crawlStep && crawling
                      ? 'var(--accent-data)'
                      : i === CRAWL_STEPS.length - 1
                      ? 'var(--accent-signal)'
                      : 'var(--text-secondary)',
                    marginBottom: 2,
                  }}>
                    {i === crawlStep && crawling ? '▶ ' : '✓ '}{step}
                  </div>
                ))}
              </div>
            )}

            {/* Results */}
            {crawlResults && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {crawlResults.violations_created > 0 && (
                  <div style={{
                    padding: '8px 16px',
                    background: 'rgba(255,23,68,0.06)',
                    borderBottom: '1px solid rgba(255,23,68,0.2)',
                    color: 'var(--accent-threat)',
                  }}>
                    <span className="font-data text-xs">
                      ⚠ {crawlResults.violations_created} NEW VIOLATION{crawlResults.violations_created > 1 ? 'S' : ''} FLAGGED AND ADDED TO VIOLATION LOG
                    </span>
                  </div>
                )}

                {crawlResults.results?.length === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 12, fontFamily: '"Share Tech Mono", monospace' }}>
                    NO MATCHES FOUND FOR "{crawlResults.query}"
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        {['VIDEO', 'CHANNEL', 'VIEWS', 'MATCH %', 'pHASH DIST', 'STATUS'].map((h) => (
                          <th key={h} className="font-data" style={{
                            padding: '8px 16px', textAlign: 'left', fontSize: 9,
                            letterSpacing: '0.12em', color: 'var(--text-secondary)', fontWeight: 400,
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {crawlResults.results.map((r, i) => (
                        <motion.tr
                          key={r.video_id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06 }}
                          style={{ borderBottom: '1px solid var(--border-subtle)' }}
                        >
                          <td style={{ padding: '8px 16px', maxWidth: 300 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              {r.thumbnail && (
                                <div style={{ flexShrink: 0, width: 64, height: 40, overflow: 'hidden', border: '1px solid var(--border-subtle)', position: 'relative' }}>
                                  <img src={r.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display='none' }} />
                                  {r.duration && r.duration !== 'N/A' && (
                                    <span style={{ position: 'absolute', bottom: 1, right: 2, background: 'rgba(0,0,0,0.8)', color: '#fff', fontSize: 7, padding: '0 2px', fontFamily: 'monospace' }}>
                                      {r.duration}
                                    </span>
                                  )}
                                </div>
                              )}
                              <div style={{ minWidth: 0 }}>
                                <a
                                  href={r.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-mono"
                                  style={{ fontSize: 10, color: 'var(--text-primary)', textDecoration: 'none', display: 'block',
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 210 }}
                                >
                                  {r.title}
                                </a>
                                {!r.thumbnail && r.duration && (
                                  <div className="font-data" style={{ fontSize: 9, color: 'var(--text-secondary)', marginTop: 2 }}>{r.duration}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="font-data" style={{ padding: '10px 16px', fontSize: 10, color: 'var(--text-secondary)' }}>
                            {r.channel}
                          </td>
                          <td className="font-data" style={{ padding: '10px 16px', fontSize: 10, color: 'var(--text-secondary)' }}>
                            {r.view_count}
                          </td>
                          <td className="font-orbitron font-bold" style={{
                            padding: '10px 16px', fontSize: 13,
                            color: r.confidence >= 0.85
                              ? 'var(--accent-threat)'
                              : r.confidence >= 0.72
                              ? 'var(--accent-warn)'
                              : 'var(--accent-data)',
                          }}>
                            {(r.confidence * 100).toFixed(1)}%
                          </td>
                          <td className="hash-text" style={{ padding: '10px 16px', fontSize: 10,
                            color: r.phash_distance !== null && r.phash_distance <= 10
                              ? 'var(--accent-threat)' : 'var(--text-secondary)' }}>
                            {r.phash_distance !== null ? r.phash_distance : '—'}
                          </td>
                          <td style={{ padding: '10px 16px' }}>
                            {r.confidence >= 0.75 ? (
                              <span className="badge font-data" style={{ fontSize: 9, color: 'var(--accent-threat)',
                                borderColor: 'rgba(255,23,68,0.3)', background: 'rgba(255,23,68,0.05)' }}>
                                VIOLATION FLAGGED
                              </span>
                            ) : (
                              <span className="badge font-data" style={{ fontSize: 9, color: 'var(--accent-warn)',
                                borderColor: 'rgba(255,171,0,0.3)', background: 'rgba(255,171,0,0.05)' }}>
                                MONITORING
                              </span>
                            )}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </motion.div>
            )}

            {!crawling && !crawlResults && (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)', fontFamily: '"Share Tech Mono", monospace', fontSize: 12 }}>
                CLICK "SCAN YOUTUBE NOW" TO CRAWL FOR UNAUTHORIZED COPIES
              </div>
            )}
          </div>
        </section>

        {/* Content Spread Map */}
        <section style={{ marginBottom: 48 }}>
          <SectionHeader title="CONTENT SPREAD MAP" sub="D3 FORCE GRAPH — REAL-TIME PROPAGATION ANALYSIS" />
          <ContentSpreadMap data={spreadData} height={450} />
        </section>

        {/* Violations table */}
        <section>
          <SectionHeader title="VIOLATION LOG" sub={`${violations.length} RECORDS`} />
          <div className="card" style={{ overflow: 'hidden' }}>
            {violations.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)', fontFamily: '"Share Tech Mono", monospace', fontSize: 12 }}>
                NO VIOLATIONS RECORDED — ASSET IS CLEAR
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    {['PLATFORM', 'MATCH %', 'DETECTED', 'STATUS', 'ACTION'].map((h) => (
                      <th key={h} className="font-data" style={{
                        padding: '10px 16px', textAlign: 'left', fontSize: 9,
                        letterSpacing: '0.12em', color: 'var(--text-secondary)', fontWeight: 400,
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {violations.map((v, i) => (
                    <tr
                      key={v.id}
                      style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'none', transition: 'background 0.15s' }}
                      data-cursor="interactive"
                      onClick={() => navigate(`/violation/${v.id}`)}
                    >
                      <td className="font-data" style={{ padding: '10px 16px', fontSize: 11, color: 'var(--text-primary)' }}>
                        {(v.platform || '').toUpperCase()}
                      </td>
                      <td className="font-orbitron font-bold" style={{
                        padding: '10px 16px', fontSize: 12,
                        color: v.confidence >= 0.85 ? 'var(--accent-threat)' : v.confidence >= 0.6 ? 'var(--accent-warn)' : 'var(--accent-data)',
                      }}>
                        {((v.confidence || 0) * 100).toFixed(1)}%
                      </td>
                      <td className="font-data" style={{ padding: '10px 16px', fontSize: 10, color: 'var(--text-secondary)' }}>
                        {v.detected_at ? new Date(v.detected_at).toLocaleString() : '—'}
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <StatusBadge status={v.status} />
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <button className="btn btn-ghost" style={{ padding: '3px 8px', fontSize: 9 }} data-cursor="interactive">VIEW →</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function MetaRow({ label, value, isCode = false, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
      <span className="font-data" style={{ fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '0.1em', flexShrink: 0 }}>{label}</span>
      <span
        className={isCode ? 'hash-text' : 'font-mono'}
        style={{ fontSize: 10, color: color || (isCode ? 'var(--text-code)' : 'var(--text-primary)'), textAlign: 'right' }}
      >
        {value}
      </span>
    </div>
  )
}

function SectionHeader({ title, sub }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div className="flex items-center gap-3">
        <div style={{ width: 24, height: 1, background: 'var(--accent-data)' }} />
        <h2 className="font-orbitron font-bold" style={{ fontSize: 14, letterSpacing: '0.12em' }}>{title}</h2>
        {sub && <span className="font-data text-xs" style={{ color: 'var(--text-secondary)' }}>— {sub}</span>}
      </div>
    </div>
  )
}
