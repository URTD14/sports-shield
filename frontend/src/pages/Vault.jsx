import { useEffect, useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import AssetCard from '../components/ui/AssetCard'
import { UploadProgress } from '../components/ui/ScanningProgress'
import { getAssets, getSamples, uploadAsset } from '../services/api'

const WATERMARK_TYPES = [
  { id: 'dct', label: 'DCT Frequency Domain', recommended: true },
  { id: 'lsb', label: 'LSB Spatial' },
  { id: 'hybrid', label: 'Hybrid' },
]

const RESILIENCE_CHECKS = ['compression', 'resize', 'crop', 'color grade', 'speed change']

function resilienceAt(strength) {
  if (strength >= 9) return [true, true, true, true, true]
  if (strength >= 7) return [true, true, true, true, false]
  if (strength >= 5) return [true, true, true, false, false]
  if (strength >= 3) return [true, true, false, false, false]
  return [true, false, false, false, false]
}

const STATUS_STEPS = [
  'UPLOADING',
  'EXTRACTING FRAMES',
  'GENERATING FINGERPRINT',
  'EMBEDDING WATERMARK',
  'ASSET SECURED',
]

export default function Vault() {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploadFile, setUploadFile] = useState(null)
  const [uploadState, setUploadState] = useState({ status: 'idle', progress: 0 })
  const [watermarkStrength, setWatermarkStrength] = useState(7)
  const [watermarkType, setWatermarkType] = useState('dct')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadAssets()
  }, [])

  const loadAssets = async () => {
    setLoading(true)
    try {
      // Try real API first
      const [samplesRes, assetsRes] = await Promise.allSettled([
        getSamples(),
        getAssets({ limit: 50 }),
      ])
      const sampleAssets = samplesRes.status === 'fulfilled' ? samplesRes.value.data.assets : []
      const realAssets = assetsRes.status === 'fulfilled' ? assetsRes.value.data.assets : []

      // Merge: real assets first, then demo assets (deduplicate by id)
      const seen = new Set()
      const merged = [...realAssets, ...sampleAssets].filter((a) => {
        if (seen.has(a.id)) return false
        seen.add(a.id)
        return true
      })
      setAssets(merged)
    } catch (err) {
      console.error('Failed to load assets:', err)
    } finally {
      setLoading(false)
    }
  }

  const onDrop = useCallback((accepted) => {
    if (accepted.length > 0) {
      setUploadFile(accepted[0])
      setUploadState({ status: 'idle', progress: 0 })
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'video/*': [], 'image/*': [] },
    maxSize: 500 * 1024 * 1024,
    multiple: false,
  })

  const handleSecure = async () => {
    if (!uploadFile || uploading) return
    setUploading(true)

    // Animate through steps while uploading
    let stepIdx = 0
    const stepInterval = setInterval(() => {
      if (stepIdx < STATUS_STEPS.length - 1) {
        stepIdx++
        setUploadState({
          status: STATUS_STEPS[stepIdx],
          progress: (stepIdx / (STATUS_STEPS.length - 1)) * 100,
        })
      }
    }, 1200)

    setUploadState({ status: STATUS_STEPS[0], progress: 0 })

    try {
      const form = new FormData()
      form.append('file', uploadFile)
      form.append('title', uploadFile.name.replace(/\.[^.]+$/, ''))
      form.append('watermark_strength', watermarkStrength)
      form.append('watermark_type', watermarkType)

      const res = await uploadAsset(form, (pct) => {
        setUploadState({ status: STATUS_STEPS[0], progress: pct * 0.2 })
      })

      clearInterval(stepInterval)
      setUploadState({ status: 'ASSET SECURED', progress: 100 })

      confetti({ particleCount: 100, spread: 80, origin: { y: 0.3 }, colors: ['#00ff41', '#00b8d4'] })

      // Refresh assets after a moment
      setTimeout(loadAssets, 1500)
    } catch (err) {
      clearInterval(stepInterval)
      console.error('Upload failed:', err)
      setUploadState({ status: 'idle', progress: 0 })
    } finally {
      setUploading(false)
    }
  }

  const resilience = resilienceAt(watermarkStrength)
  const totalViolations = assets.reduce((s, a) => s + (a.violation_count || 0), 0)

  return (
    <div style={{ paddingTop: 108, padding: '108px 40px 40px' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <span className="font-data text-xs tracking-widest" style={{ color: 'var(--accent-data)', display: 'block', marginBottom: 4 }}>
            ASSET MANAGEMENT
          </span>
          <h1 className="font-orbitron font-bold" style={{ fontSize: 28, letterSpacing: '0.06em' }}>
            PROTECTED VAULT
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-data text-xs" style={{ color: 'var(--text-secondary)' }}>
            {assets.length} ASSETS REGISTERED
          </span>
          <div style={{ padding: '4px 12px', border: '1px solid var(--border-active)', background: 'rgba(0,255,65,0.07)' }}>
            <span className="font-data text-xs" style={{ color: 'var(--accent-signal)' }}>VAULT SECURE</span>
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="card" style={{ padding: '32px', marginBottom: 32 }}>
        <div
          {...getRootProps()}
          data-cursor="interactive"
          style={{
            border: `2px dashed ${isDragActive ? 'var(--accent-signal)' : 'rgba(0,184,212,0.4)'}`,
            background: isDragActive ? 'rgba(0,20,40,0.8)' : 'var(--bg-void)',
            padding: '48px 32px',
            textAlign: 'center',
            cursor: 'none',
            transition: 'all 0.2s',
            position: 'relative',
          }}
        >
          <input {...getInputProps()} />
          {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((corner) => (
            <div
              key={corner}
              style={{
                position: 'absolute', width: 20, height: 20,
                ...(corner.includes('top') ? { top: 12 } : { bottom: 12 }),
                ...(corner.includes('left') ? { left: 12 } : { right: 12 }),
                borderTop: corner.includes('top') ? `2px solid ${isDragActive ? 'var(--accent-signal)' : 'var(--accent-data)'}` : 'none',
                borderBottom: corner.includes('bottom') ? `2px solid ${isDragActive ? 'var(--accent-signal)' : 'var(--accent-data)'}` : 'none',
                borderLeft: corner.includes('left') ? `2px solid ${isDragActive ? 'var(--accent-signal)' : 'var(--accent-data)'}` : 'none',
                borderRight: corner.includes('right') ? `2px solid ${isDragActive ? 'var(--accent-signal)' : 'var(--accent-data)'}` : 'none',
                transition: 'border-color 0.2s',
              }}
            />
          ))}

          <svg width="48" height="52" viewBox="0 0 48 52" fill="none" style={{ margin: '0 auto 16px', display: 'block' }}>
            <path d="M24 2L4 10V26C4 37.6 13.2 48.3 24 51C34.8 48.3 44 37.6 44 26V10L24 2Z"
              stroke={isDragActive ? 'var(--accent-signal)' : 'var(--accent-data)'}
              strokeWidth="2" fill="none"
              style={{ filter: `drop-shadow(0 0 8px ${isDragActive ? 'var(--accent-signal)' : 'var(--accent-data)'})` }}
            />
            <path d="M24 16V32M16 24H32" stroke={isDragActive ? 'var(--accent-signal)' : 'var(--accent-data)'} strokeWidth="2" strokeLinecap="square" />
          </svg>

          <div className="font-orbitron font-bold" style={{ fontSize: 16, letterSpacing: '0.12em', color: isDragActive ? 'var(--accent-signal)' : 'var(--text-primary)', marginBottom: 8 }}>
            {isDragActive ? 'DROP TO PROTECT' : uploadFile ? uploadFile.name : 'DROP OFFICIAL MEDIA HERE'}
          </div>
          <div className="font-data text-xs" style={{ color: 'var(--text-secondary)', letterSpacing: '0.08em' }}>
            MP4, MOV, AVI, JPG, PNG — MAX 500MB
          </div>
        </div>

        {/* Upload progress */}
        <AnimatePresence>
          {uploadFile && uploadState.status !== 'idle' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginTop: 24 }}>
              <UploadProgress status={uploadState.status} progress={uploadState.progress} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Config panel */}
        <AnimatePresence>
          {uploadFile && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              style={{ marginTop: 24, padding: 20, border: '1px solid var(--border-subtle)', background: 'var(--bg-void)' }}
            >
              <div className="font-data text-xs tracking-widest mb-4" style={{ color: 'var(--accent-data)' }}>
                WATERMARK CONFIGURATION
              </div>
              <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div>
                  <label className="font-data text-xs" style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
                    STRENGTH: {watermarkStrength}/10
                  </label>
                  <input type="range" min={1} max={10} value={watermarkStrength}
                    onChange={(e) => setWatermarkStrength(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent-signal)' }} data-cursor="interactive" />
                </div>
                <div>
                  <label className="font-data text-xs" style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>TYPE</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {WATERMARK_TYPES.map((t) => (
                      <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'none' }} data-cursor="interactive">
                        <input type="radio" name="wm-type" value={t.id} checked={watermarkType === t.id}
                          onChange={() => setWatermarkType(t.id)} style={{ accentColor: 'var(--accent-signal)' }} />
                        <span className="font-data text-xs" style={{ color: watermarkType === t.id ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                          {t.label} {t.recommended && <span style={{ color: 'var(--accent-signal)' }}>(REC)</span>}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 16 }}>
                <div className="font-data text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>RESILIENCE PREVIEW:</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {RESILIENCE_CHECKS.map((check, i) => (
                    <span key={check} className="font-data text-xs" style={{
                      padding: '2px 8px',
                      border: `1px solid ${resilience[i] ? 'rgba(0,255,65,0.3)' : 'rgba(96,125,139,0.3)'}`,
                      color: resilience[i] ? 'var(--accent-signal)' : 'var(--text-secondary)',
                      background: resilience[i] ? 'rgba(0,255,65,0.05)' : 'transparent',
                    }}>
                      {resilience[i] ? '✓' : '✗'} {check}
                    </span>
                  ))}
                </div>
              </div>
              <button
                className="btn btn-signal"
                style={{ width: '100%', marginTop: 20, padding: '12px', fontSize: 12, opacity: uploading ? 0.6 : 1 }}
                onClick={handleSecure}
                disabled={uploading || uploadState.status === 'ASSET SECURED'}
                data-cursor="interactive"
              >
                {uploading ? 'PROCESSING...' : uploadState.status === 'ASSET SECURED' ? 'ASSET SECURED ✓' : 'SECURE THIS ASSET'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Asset Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-orbitron font-bold" style={{ fontSize: 18, letterSpacing: '0.08em' }}>
            PROTECTED VAULT{' '}
            {totalViolations > 0 && (
              <span className="font-data" style={{ fontSize: 12, color: 'var(--accent-threat)', marginLeft: 8, padding: '2px 8px', border: '1px solid rgba(255,23,68,0.3)', background: 'rgba(255,23,68,0.07)' }}>
                {totalViolations} ACTIVE VIOLATIONS
              </span>
            )}
          </h2>
          <button className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: 10 }} onClick={loadAssets} data-cursor="interactive">
            ↺ REFRESH
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center" style={{ height: 200 }}>
            <div className="scanning-bar" style={{ width: 200 }} />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            {assets.map((asset, i) => (
              <AssetCard key={asset.id} asset={asset} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
