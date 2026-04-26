/**
 * SportThumbnail — Realistic broadcast-style video frame mockups
 * Renders entirely in SVG — no external image dependencies.
 * Looks like an actual TV broadcast still from professional sports.
 */

function SoccerFrame({ id = 'st', modified = false }) {
  const green   = modified ? '#1a5c2a' : '#1e7a34'
  const sky     = modified ? '#1a0a2e' : '#0d1b2a'
  const cast    = modified ? 'rgba(120,0,180,0.18)' : 'transparent'
  const sat     = modified ? 'saturate(1.7) hue-rotate(-15deg)' : 'none'

  return (
    <svg viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: '100%', display: 'block', filter: sat }}>
      <defs>
        <radialGradient id={`${id}sky`} cx="50%" cy="20%" r="70%">
          <stop offset="0%" stopColor="#1a3a5c" />
          <stop offset="100%" stopColor={sky} />
        </radialGradient>
        <radialGradient id={`${id}l1`} cx="12%" cy="8%" r="22%">
          <stop offset="0%" stopColor="#fff8d0" stopOpacity="0.55" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}l2`} cx="88%" cy="8%" r="22%">
          <stop offset="0%" stopColor="#fff8d0" stopOpacity="0.55" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}pitch`} cx="50%" cy="50%" r="65%">
          <stop offset="0%" stopColor="#24903e" />
          <stop offset="100%" stopColor={green} />
        </radialGradient>
        <filter id={`${id}blur`}>
          <feGaussianBlur stdDeviation="0.8" />
        </filter>
        <linearGradient id={`${id}vign`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="rgba(0,0,0,0.55)" />
          <stop offset="28%"  stopColor="rgba(0,0,0,0)"    />
          <stop offset="72%"  stopColor="rgba(0,0,0,0)"    />
          <stop offset="100%" stopColor="rgba(0,0,0,0.7)"  />
        </linearGradient>
        <clipPath id={`${id}clip`}>
          <rect width="640" height="360" />
        </clipPath>
      </defs>

      <g clipPath={`url(#${id}clip)`}>
        {/* Sky background */}
        <rect width="640" height="360" fill={`url(#${id}sky)`} />

        {/* Stadium crowd — blurred rows */}
        {[0,1,2,3,4,5,6,7].map((r) => (
          <rect key={r} x="0" y={r * 20} width="640" height="20"
            fill={r % 2 === 0 ? 'rgba(30,60,100,0.45)' : 'rgba(20,45,80,0.45)'}
            filter={`url(#${id}blur)`} />
        ))}
        {/* Crowd speckle — simulated people */}
        {Array.from({length: 200}).map((_, i) => (
          <circle key={i}
            cx={Math.sin(i * 7.3) * 310 + 320}
            cy={Math.sin(i * 5.1) * 60 + 80}
            r="2.5"
            fill={`hsl(${(i * 37) % 360},40%,${40 + (i % 20)}%)`}
            opacity="0.6" />
        ))}

        {/* Pitch */}
        <rect x="0" y="155" width="640" height="205" fill={`url(#${id}pitch)`} />

        {/* Pitch stripes */}
        {[0,1,2,3,4,5,6,7].map((s) => (
          <rect key={s} x={s * 80} y="155" width="40" height="205"
            fill="rgba(0,0,0,0.06)" />
        ))}

        {/* Center circle */}
        <circle cx="320" cy="260" r="52" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
        <circle cx="320" cy="260" r="2"  fill="rgba(255,255,255,0.7)" />
        {/* Center line */}
        <line x1="0" y1="260" x2="640" y2="260" stroke="rgba(255,255,255,0.45)" strokeWidth="2" />

        {/* Left penalty box */}
        <rect x="0" y="205" width="110" height="110" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
        <rect x="0" y="228" width="44"  height="64"  fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
        <circle cx="88" cy="260" r="22" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"
          strokeDasharray="8 4" />

        {/* Right penalty box */}
        <rect x="530" y="205" width="110" height="110" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
        <rect x="596" y="228" width="44"  height="64"  fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
        <circle cx="552" cy="260" r="22" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"
          strokeDasharray="8 4" />

        {/* Players — team A (white) */}
        {[[160,225],[240,215],[320,210],[400,215],[480,225],
          [200,248],[310,245],[420,248],[260,270],[380,270],[320,295]].map(([cx,cy],i) => (
          <g key={`a${i}`}>
            <circle cx={cx} cy={cy-8} r="5.5" fill="#e8eaed" />
            <ellipse cx={cx} cy={cy} rx="7" ry="5" fill="#e8eaed" />
            <rect x={cx-3} y={cy+4} width="6" height="8" rx="1" fill="#1a5fb4" />
          </g>
        ))}

        {/* Players — team B (red/yellow) */}
        {[[180,240],[290,232],[370,228],[450,236],[520,242],
          [230,262],[340,258],[440,260]].map(([cx,cy],i) => (
          <g key={`b${i}`}>
            <circle cx={cx} cy={cy-8} r="5.5" fill="#f5c518" />
            <ellipse cx={cx} cy={cy} rx="7" ry="5" fill="#f5c518" />
            <rect x={cx-3} y={cy+4} width="6" height="8" rx="1" fill="#c0392b" />
          </g>
        ))}

        {/* Ball */}
        <circle cx="310" cy="248" r="5" fill="white" stroke="#333" strokeWidth="0.8" />

        {/* Stadium lights */}
        <rect x="0"   y="0" width="640" height="360" fill={`url(#${id}l1)`} />
        <rect x="0"   y="0" width="640" height="360" fill={`url(#${id}l2)`} />

        {/* Modified color cast overlay */}
        {modified && <rect width="640" height="360" fill={cast} />}

        {/* Vignette */}
        <rect width="640" height="360" fill={`url(#${id}vign)`} />

        {/* Score bug */}
        <rect x="18" y="312" width="240" height="34" rx="3" fill="rgba(5,10,22,0.88)" />
        <rect x="18" y="312" width="4"   height="34" rx="1" fill={modified ? '#9b59b6' : '#00b8d4'} />
        <text x="30" y="325" fontFamily="monospace" fontSize="9" fill="rgba(180,200,220,0.8)" fontWeight="600">
          UEFA CHAMPIONS LEAGUE
        </text>
        <text x="30" y="340" fontFamily="monospace" fontSize="13" fill="white" fontWeight="700">
          MAN CITY  <tspan fill="#f5c518">1</tspan>  —  <tspan fill="#f5c518">0</tspan>  REAL MADRID
        </text>

        {/* LIVE badge */}
        <rect x="270" y="312" width="46" height="14" rx="2" fill={modified ? '#9b59b6' : '#e53935'} />
        <text x="293" y="323" fontFamily="monospace" fontSize="9" fill="white" fontWeight="700"
          textAnchor="middle">{modified ? 'MOD' : 'LIVE'}</text>

        {/* Time */}
        <text x="328" y="324" fontFamily="monospace" fontSize="12" fill="white" fontWeight="600">
          67'
        </text>

        {/* Modified badge */}
        {modified && (
          <>
            <rect x="490" y="16" width="132" height="22" rx="3" fill="rgba(155,0,220,0.85)" />
            <text x="556" y="31" fontFamily="monospace" fontSize="10" fill="white" fontWeight="700"
              textAnchor="middle">⚠ MODIFIED 9:16</text>
          </>
        )}

        {/* Watermark grid overlay (for watermark step) */}
      </g>
    </svg>
  )
}

function BasketballFrame({ id = 'bk' }) {
  return (
    <svg viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: '100%', display: 'block' }}>
      <defs>
        <radialGradient id={`${id}court`} cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#c8a96e" />
          <stop offset="100%" stopColor="#a07840" />
        </radialGradient>
        <radialGradient id={`${id}arena`} cx="50%" cy="0%" r="80%">
          <stop offset="0%" stopColor="#1a1a2e" />
          <stop offset="100%" stopColor="#050510" />
        </radialGradient>
        <radialGradient id={`${id}spot`} cx="50%" cy="30%" r="45%">
          <stop offset="0%" stopColor="rgba(255,220,120,0.35)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <linearGradient id={`${id}vign`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="rgba(0,0,0,0.5)" />
          <stop offset="20%"  stopColor="rgba(0,0,0,0)"   />
          <stop offset="75%"  stopColor="rgba(0,0,0,0)"   />
          <stop offset="100%" stopColor="rgba(0,0,0,0.65)" />
        </linearGradient>
      </defs>

      {/* Arena dark background */}
      <rect width="640" height="360" fill={`url(#${id}arena)`} />

      {/* Arena crowd lights speckle */}
      {Array.from({length: 300}).map((_, i) => (
        <circle key={i}
          cx={Math.sin(i * 6.7) * 310 + 320}
          cy={Math.sin(i * 4.3) * 100 + 100}
          r="1.5"
          fill={`hsl(${(i*41)%360},70%,${55+(i%25)}%)`}
          opacity="0.55" />
      ))}

      {/* Court floor */}
      <rect x="40" y="160" width="560" height="200" fill={`url(#${id}court)`} />

      {/* Court lines */}
      <line x1="40" y1="260" x2="600" y2="260" stroke="rgba(255,255,255,0.6)" strokeWidth="2" />
      <circle cx="320" cy="260" r="40" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />

      {/* Left key */}
      <rect x="40" y="210" width="90" height="100" fill="rgba(200,80,20,0.3)" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
      <circle cx="130" cy="260" r="30" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"
        strokeDasharray="6 4" />

      {/* Right key */}
      <rect x="510" y="210" width="90" height="100" fill="rgba(200,80,20,0.3)" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
      <circle cx="510" cy="260" r="30" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"
        strokeDasharray="6 4" />

      {/* Left basket */}
      <line x1="40" y1="245" x2="60" y2="245" stroke="rgba(255,100,30,0.9)" strokeWidth="3" />
      <circle cx="60" cy="245" r="9" fill="none" stroke="rgba(255,100,30,0.9)" strokeWidth="2.5" />
      <line x1="40" y1="200" x2="40" y2="295" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
      <rect x="30" y="195" width="14" height="64" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />

      {/* Right basket */}
      <line x1="600" y1="245" x2="580" y2="245" stroke="rgba(255,100,30,0.9)" strokeWidth="3" />
      <circle cx="580" cy="245" r="9" fill="none" stroke="rgba(255,100,30,0.9)" strokeWidth="2.5" />
      <line x1="600" y1="200" x2="600" y2="295" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
      <rect x="596" y="195" width="14" height="64" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />

      {/* Spotlight */}
      <rect width="640" height="360" fill={`url(#${id}spot)`} />

      {/* Players */}
      {[[240,230],[290,240],[340,225],[380,238],[430,235],
        [200,258],[310,248],[420,252],[270,268],[360,265]].map(([cx,cy],i) => (
        <g key={i}>
          <circle cx={cx} cy={cy-10} r="6" fill={i<5 ? '#4a90d9' : '#e74c3c'} />
          <ellipse cx={cx} cy={cy} rx="8" ry="5.5" fill={i<5 ? '#4a90d9' : '#e74c3c'} />
          <rect x={cx-4} y={cy+4} width="8" height="10" rx="1" fill={i<5 ? '#2c3e50' : '#1a1a1a'} />
        </g>
      ))}

      {/* Ball mid-air */}
      <circle cx="310" cy="205" r="10" fill="#e07020" stroke="#c05010" strokeWidth="1.5" />
      <path d="M302,205 Q310,195 318,205" fill="none" stroke="#8B4513" strokeWidth="1" />
      <path d="M302,205 Q310,215 318,205" fill="none" stroke="#8B4513" strokeWidth="1" />

      {/* Vignette */}
      <rect width="640" height="360" fill={`url(#${id}vign)`} />

      {/* Score bug */}
      <rect x="18" y="312" width="220" height="34" rx="3" fill="rgba(5,10,22,0.88)" />
      <rect x="18" y="312" width="4"   height="34" fill="#e74c3c" />
      <text x="30" y="325" fontFamily="monospace" fontSize="9" fill="rgba(180,200,220,0.8)" fontWeight="600">
        NBA PLAYOFFS · GAME 6
      </text>
      <text x="30" y="340" fontFamily="monospace" fontSize="13" fill="white" fontWeight="700">
        LAL  <tspan fill="#f5c518">108</tspan>  —  <tspan fill="#f5c518">104</tspan>  BOS
      </text>
      <rect x="246" y="318" width="44" height="14" rx="2" fill="#e53935" />
      <text x="268" y="329" fontFamily="monospace" fontSize="9" fill="white" fontWeight="700"
        textAnchor="middle">LIVE</text>
      <text x="300" y="330" fontFamily="monospace" fontSize="11" fill="white">Q4 2:34</text>
    </svg>
  )
}

function AthleticsFrame({ id = 'at' }) {
  const lanes = ['#c0392b','#e67e22','#f1c40f','#27ae60','#2980b9','#8e44ad','#16a085','#2c3e50']
  return (
    <svg viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: '100%', display: 'block' }}>
      <defs>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0d2137" />
          <stop offset="100%" stopColor="#1a3a5c" />
        </linearGradient>
        <linearGradient id={`${id}vign`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="rgba(0,0,0,0.6)" />
          <stop offset="30%"  stopColor="rgba(0,0,0,0)"   />
          <stop offset="70%"  stopColor="rgba(0,0,0,0)"   />
          <stop offset="100%" stopColor="rgba(0,0,0,0.7)" />
        </linearGradient>
        <radialGradient id={`${id}spot`} cx="50%" cy="25%" r="50%">
          <stop offset="0%" stopColor="rgba(255,240,200,0.3)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>

      <rect width="640" height="360" fill={`url(#${id}sky)`} />

      {/* Stadium crowd */}
      {Array.from({length: 250}).map((_, i) => (
        <circle key={i}
          cx={Math.sin(i * 8.1) * 310 + 320}
          cy={Math.sin(i * 5.7) * 55 + 75}
          r="2"
          fill={`hsl(${(i*29)%360},35%,${45+(i%20)}%)`}
          opacity="0.5" />
      ))}

      {/* Track — perspective view */}
      {lanes.map((color, i) => (
        <g key={i}>
          <path
            d={`M ${40 + i*70} 165 L ${600 + i*5} 165 L ${600 + (i+1)*5} 195 L ${40 + (i+1)*70} 195 Z`}
            fill={`hsl(10,65%,${35 + i*3}%)`}
            stroke="rgba(255,255,255,0.55)"
            strokeWidth="1.5"
          />
          {/* Lane number */}
          <text
            x={45 + i * 70 + 28}
            y={185}
            fontFamily="monospace" fontSize="14" fill="rgba(255,255,255,0.7)"
            fontWeight="700" textAnchor="middle"
          >{i + 1}</text>
        </g>
      ))}

      {/* Finish line tape */}
      <line x1="335" y1="160" x2="335" y2="200" stroke="white" strokeWidth="3" />
      <line x1="345" y1="160" x2="345" y2="200" stroke="#e74c3c" strokeWidth="3" />
      {/* Tape string */}
      <line x1="320" y1="178" x2="360" y2="178" stroke="rgba(255,50,50,0.9)" strokeWidth="4"
        strokeDasharray="3 2" />

      {/* Athletes running */}
      {[0,1,2,3,4].map((i) => {
        const laneY = 167 + i * 8
        const laneX = 260 + i * 18
        return (
          <g key={i} transform={`translate(${laneX},${laneY})`}>
            {/* Body */}
            <ellipse cx="0" cy="-12" rx="4" ry="6" fill={lanes[i]} />
            {/* Head */}
            <circle cx="0" cy="-21" r="4" fill="#f5c99b" />
            {/* Arms */}
            <line x1="-4" y1="-14" x2="-10" y2="-8" stroke={lanes[i]} strokeWidth="2" />
            <line x1="4"  y1="-14" x2="10"  y2="-20" stroke={lanes[i]} strokeWidth="2" />
            {/* Legs */}
            <line x1="-2" y1="-6" x2="-5"  y2="4"  stroke={lanes[i]} strokeWidth="2.5" />
            <line x1="2"  y1="-6" x2="6"   y2="-1" stroke={lanes[i]} strokeWidth="2.5" />
          </g>
        )
      })}

      <rect width="640" height="360" fill={`url(#${id}spot)`} />
      <rect width="640" height="360" fill={`url(#${id}vign)`} />

      {/* Score bug */}
      <rect x="18" y="312" width="220" height="34" rx="3" fill="rgba(5,10,22,0.88)" />
      <rect x="18" y="312" width="4"   height="34" fill="#f1c40f" />
      <text x="30" y="325" fontFamily="monospace" fontSize="9" fill="rgba(180,200,220,0.8)" fontWeight="600">
        TOKYO 2025 · 100M FINAL
      </text>
      <text x="30" y="340" fontFamily="monospace" fontSize="12" fill="white" fontWeight="700">
        FINISH LINE · 9.84s WR PACE
      </text>
      <rect x="246" y="318" width="44" height="14" rx="2" fill="#f1c40f" />
      <text x="268" y="329" fontFamily="monospace" fontSize="9" fill="#111" fontWeight="700"
        textAnchor="middle">LIVE</text>
    </svg>
  )
}

function TeamPhotoFrame({ id = 'tm' }) {
  return (
    <svg viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: '100%', display: 'block' }}>
      <defs>
        <radialGradient id={`${id}bg`} cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#1a2a4a" />
          <stop offset="100%" stopColor="#060e1c" />
        </radialGradient>
        <linearGradient id={`${id}floor`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e7a34" />
          <stop offset="100%" stopColor="#145a26" />
        </linearGradient>
        <radialGradient id={`${id}spot`} cx="50%" cy="20%" r="60%">
          <stop offset="0%" stopColor="rgba(255,230,180,0.4)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      <rect width="640" height="360" fill={`url(#${id}bg)`} />
      <rect x="0" y="240" width="640" height="120" fill={`url(#${id}floor)`} />
      <rect width="640" height="360" fill={`url(#${id}spot)`} />

      {/* Pitch line in foreground */}
      <rect x="200" y="252" width="240" height="2" fill="rgba(255,255,255,0.55)" />

      {/* Back row players */}
      {[100,178,256,320,384,448,526].map((x,i) => (
        <g key={`b${i}`} transform={`translate(${x},190)`}>
          <circle cx="0" cy="-18" r="14" fill="#f0d9b8" />
          <rect x="-14" y="-4" width="28" height="26" rx="3" fill="white" />
          <text x="0" y="10" fontFamily="monospace" fontSize="9" fill="#111" textAnchor="middle" fontWeight="700">{i+1}</text>
        </g>
      ))}

      {/* Front row players */}
      {[140,220,300,370,450,530].map((x,i) => (
        <g key={`f${i}`} transform={`translate(${x},240)`}>
          <circle cx="0" cy="-18" r="13" fill="#f0d9b8" />
          <rect x="-13" y="-4" width="26" height="24" rx="3" fill="white" />
          <text x="0" y="10" fontFamily="monospace" fontSize="9" fill="#111" textAnchor="middle" fontWeight="700">{i+8}</text>
        </g>
      ))}

      {/* Club badge area */}
      <rect x="280" y="290" width="80" height="50" rx="4" fill="rgba(0,0,0,0.6)" />
      <text x="320" y="312" fontFamily="monospace" fontSize="10" fill="white" textAnchor="middle" fontWeight="700">PARIS</text>
      <text x="320" y="328" fontFamily="monospace" fontSize="10" fill="#0047ab" textAnchor="middle" fontWeight="700">PSG</text>
      <text x="320" y="340" fontFamily="monospace" fontSize="8"  fill="rgba(255,255,255,0.5)" textAnchor="middle">2025 — 2026</text>

      <rect x="18" y="16" width="210" height="24" rx="3" fill="rgba(5,10,22,0.75)" />
      <text x="28" y="32" fontFamily="monospace" fontSize="11" fill="white" fontWeight="600">OFFICIAL SQUAD PHOTO 2025</text>
    </svg>
  )
}

const FRAMES = {
  soccer:     SoccerFrame,
  football:   SoccerFrame,
  basketball: BasketballFrame,
  athletics:  AthleticsFrame,
  team:       TeamPhotoFrame,
  image:      TeamPhotoFrame,
}

function detectSport(assetId = '', title = '') {
  const s = (assetId + title).toLowerCase()
  if (s.includes('nba') || s.includes('basket'))   return 'basketball'
  if (s.includes('oly') || s.includes('100m'))      return 'athletics'
  if (s.includes('img') || s.includes('photo') || s.includes('madrid')) return 'image'
  return 'soccer'
}

export default function SportThumbnail({ assetId, title, sport, modified = false, style }) {
  const key   = sport || detectSport(assetId, title)
  const Frame = FRAMES[key] || SoccerFrame
  const uid   = (assetId || key || 'x').replace(/[^a-z0-9]/gi, '')

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden', ...style }}>
      <Frame id={uid} modified={modified} />
    </div>
  )
}

export { detectSport }
