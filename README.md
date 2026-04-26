# SportShield

> AI-powered sports content piracy detection and enforcement platform

SportShield monitors, detects, and analyzes unauthorized distribution of premium sports content across the internet in real time. Built for the Google Hackathon — India 2026.

---

## Features

- **Live Crawler** — continuously searches YouTube for infringing content using yt-dlp (no API key needed)
- **Perceptual Hashing** — pHash-based fingerprinting detects re-encoded, cropped, and watermark-removed copies
- **FAISS Similarity Search** — sub-millisecond nearest-neighbor lookup across millions of fingerprints
- **AI Intelligence** — Groq-powered (llama-3.3-70b-versatile) streaming analysis, takedown drafts, and legal summaries
- **Invisible Watermarking** — embed invisible forensic watermarks in video frames
- **Real-time Alerts** — Socket.IO broadcasts violations to all connected dashboards instantly
- **PDF Reports** — one-click enforceable DMCA takedown report generation via ReportLab
- **Surveillance Brutalism UI** — React 18 + Three.js globe, D3 spread map, animated threat feed

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend API | Python 3.11+, FastAPI, Uvicorn |
| Real-time | python-socketio (Socket.IO) |
| Database | SQLAlchemy + SQLite |
| AI / LLM | Groq API (`llama-3.3-70b-versatile`) |
| Fingerprinting | imagehash (pHash), FAISS |
| Watermarking | invisible-watermark |
| Scraping | yt-dlp |
| PDF | ReportLab |
| Frontend | React 18, Vite |
| State | Zustand |
| Animation | Framer Motion |
| 3D Globe | Three.js (`@react-three/fiber`) |
| Charts | D3, Recharts |
| Styling | Tailwind CSS |

---

## Prerequisites

- Python 3.11+
- Node.js 18+
- A [Groq API key](https://console.groq.com/) (free tier available)

---

## Quick Start

### 1. Clone

```bash
git clone https://github.com/URTD14/sports-shield.git
cd sportshield
```

### 2. Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and set GROQ_API_KEY=<your_key>

# Seed demo data (first run only)
python -m seed.seed_demo_data

# Start server
uvicorn main:app --reload --port 8000
```

Backend runs at **http://localhost:8000**
API docs at **http://localhost:8000/docs**

### 3. Frontend

```bash
# In a new terminal, from the project root
cd frontend

npm install
npm run dev
```

Frontend runs at **http://localhost:5173**

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in:

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | Yes | Primary Groq API key |
| `GROQ_FALLBACK_KEY` | No | Fallback key if primary is rate-limited |
| `GROQ_PRIMARY_MODEL` | No | Defaults to `llama-3.3-70b-versatile` |

---

## Project Structure

```
sportshield/
├── backend/
│   ├── main.py                  # FastAPI app, Socket.IO, background crawlers
│   ├── socket_manager.py        # Socket.IO broadcast helpers
│   ├── requirements.txt
│   ├── models/
│   │   ├── asset.py             # Protected asset model
│   │   ├── violation.py         # Detected violation model
│   │   └── database.py          # SQLAlchemy engine + session
│   ├── routes/
│   │   ├── assets.py            # CRUD for protected assets
│   │   ├── violations.py        # Violations list + detail
│   │   ├── scan.py              # Manual scan trigger
│   │   ├── intelligence.py      # AI analysis + SSE streaming
│   │   └── samples.py           # Sample upload endpoint
│   ├── services/
│   │   ├── crawler.py           # yt-dlp YouTube search
│   │   ├── ai_service.py        # Groq streaming responses
│   │   ├── fingerprint.py       # pHash computation
│   │   ├── matcher.py           # FAISS similarity matching
│   │   ├── watermark.py         # Invisible watermark embed/detect
│   │   ├── faiss_store.py       # FAISS index management
│   │   └── pdf_generator.py     # ReportLab PDF reports
│   └── seed/
│       └── seed_demo_data.py    # Idempotent demo data seeder
│
└── frontend/
    ├── src/
    │   ├── App.jsx              # Routes
    │   ├── pages/
    │   │   ├── Landing.jsx      # Home / hero
    │   │   ├── Monitor.jsx      # Live violation feed
    │   │   ├── Vault.jsx        # Protected assets catalog
    │   │   ├── AssetDetail.jsx  # Per-asset detail + fingerprints
    │   │   ├── ViolationDetail.jsx  # Violation detail + AI report
    │   │   ├── Intelligence.jsx # AI analysis dashboard
    │   │   └── Demo.jsx         # Guided demo flow
    │   ├── components/
    │   │   ├── layout/          # Navbar, StatusBar, ThreatTicker
    │   │   ├── ui/              # ThreatCard, AssetCard, StreamingText, etc.
    │   │   ├── three/           # GlobeScene (Three.js)
    │   │   └── d3/              # ContentSpreadMap (D3)
    │   ├── hooks/
    │   │   ├── useSocket.js     # Socket.IO connection + events
    │   │   ├── useStreamSSE.js  # SSE AI text streaming
    │   │   └── useCountUp.js    # Animated number counter
    │   ├── store/
    │   │   └── useShieldStore.js  # Zustand global state
    │   └── services/
    │       └── api.js           # Axios API client
    └── vite.config.js
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/assets` | List all protected assets |
| `GET` | `/api/assets/{id}` | Asset detail + fingerprints |
| `GET` | `/api/violations` | List violations (filterable) |
| `GET` | `/api/violations/{id}` | Violation detail |
| `POST` | `/api/scan` | Trigger manual scan for an asset |
| `GET` | `/api/intelligence/stream` | SSE stream: AI analysis |
| `POST` | `/api/samples/upload` | Upload a sample for fingerprinting |

Socket.IO events emitted by server:

| Event | Payload |
|---|---|
| `violation_detected` | Full violation object |
| `scan_progress` | `{ asset_id, progress, message }` |
| `keepalive` | `{ timestamp }` |

---

## Data Model

**Asset** — a piece of protected sports content:
- `id` — format `SP-{TYPE}-{NUM}` (e.g., `SP-IPL-001`)
- `keyframe_hashes` — JSON array of pHash hex strings
- `watermark_key` — invisible watermark seed

**Violation** — a detected infringing copy:
- `id` — format `VL-{TYPE}-{NUM}` (e.g., `VL-PL-001`)
- `confidence` — float 0.0–1.0 (≥0.85 high, ≥0.60 medium, else low)
- `platform` — `youtube` | `twitter` | `tiktok` | `instagram` | `hotstar` | `jiocinema` | `web`

---

## Resetting Demo Data

```bash
rm backend/sportshield.db
cd backend && python -m seed.seed_demo_data
```

---

## License

MIT
