from fastapi import APIRouter
from datetime import datetime, timedelta

router = APIRouter()


@router.get("/samples")
def get_samples():
    """Return preloaded demo assets — always available without uploads."""
    now = datetime.utcnow()
    return {
        "assets": [
            {
                "id": "SP-IPL-001",
                "title": "TATA IPL 2026 — RCB vs MI Live Match Highlights",
                "type": "video",
                "status": "threat_detected",
                "rights_holder": "Board of Control for Cricket in India (BCCI)",
                "violation_count": 41,
                "fingerprint_strength": 5,
                "watermark_status": "intact",
                "sha256": "f1e2d3c4b5a6f7e8d9c0b1a2f3e4d5c6b7a8f9e0d1c2b3a4f5e6d7c8b9a0f1e2",
                "uploaded_at": (now - timedelta(hours=18)).isoformat(),
                "last_scanned": (now - timedelta(minutes=1)).isoformat(),
                "platforms_affected": 5,
                "revenue_impact": 48700,
                "thumbnail_url": "https://i.ytimg.com/vi/IEpw6y-cCyw/mqdefault.jpg",
                "keyframe_hashes": [
                    "d0f42eb8b46c63c3", "d1f42eb8b46c63c3", "d0f43eb8b46c63c3",
                    "d0f42eb9b46c63c3", "d0f42eb8b46c64c3",
                ],
                "keyframe_count": 62,
                "is_demo": True,
            },
            {
                "id": "SP-UCL-001",
                "title": "UEFA Champions League 2025-26 Quarterfinals — PSG vs Man City",
                "type": "video",
                "status": "threat_detected",
                "rights_holder": "UEFA Media Rights",
                "violation_count": 12,
                "fingerprint_strength": 5,
                "watermark_status": "intact",
                "sha256": "a3f8d2c19b7e4f0a6d5c3b2e1f9a8d7c6b5a4e3f2d1c0b9a8f7e6d5c4b3a2f1",
                "uploaded_at": (now - timedelta(hours=48)).isoformat(),
                "last_scanned": (now - timedelta(minutes=2)).isoformat(),
                "platforms_affected": 4,
                "revenue_impact": 12400,
                "thumbnail_url": "https://i.ytimg.com/vi/GgKIhlyjX2w/mqdefault.jpg",
                "keyframe_hashes": [
                    "f870708a1efc970b", "81251e9ef24a6a9f", "9110da66ec36e7c9",
                    "8891c52fd432e7bc", "97198934da3ce43d", "f871708a1efc970b",
                ],
                "keyframe_count": 47,
                "is_demo": True,
            },
            {
                "id": "SP-POL-001",
                "title": "Delhi Assembly Election 2025 — BJP Victory & Results Coverage",
                "type": "video",
                "status": "threat_detected",
                "rights_holder": "Doordarshan National / Election Commission of India",
                "violation_count": 134,
                "fingerprint_strength": 5,
                "watermark_status": "intact",
                "sha256": "c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4",
                "uploaded_at": (now - timedelta(hours=10)).isoformat(),
                "last_scanned": (now - timedelta(minutes=4)).isoformat(),
                "platforms_affected": 6,
                "revenue_impact": 0,
                "thumbnail_url": "https://i.ytimg.com/vi/avzufy3tPKw/mqdefault.jpg",
                "keyframe_hashes": [
                    "fde565e88a072e22", "ed95eca8e2c3432c", "9993a79ea09fce01",
                    "c4be9757ba80eac0", "fde565e88a072e23",
                ],
                "keyframe_count": 58,
                "is_demo": True,
            },
            {
                "id": "SP-NBA-003",
                "title": "NBA Playoffs 2026 — OKC Thunder vs Boston Celtics Game 5",
                "type": "video",
                "status": "threat_detected",
                "rights_holder": "NBA Entertainment",
                "violation_count": 23,
                "fingerprint_strength": 4,
                "watermark_status": "intact",
                "sha256": "c5f0a4e3d2c1b0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6",
                "uploaded_at": (now - timedelta(hours=72)).isoformat(),
                "last_scanned": (now - timedelta(minutes=1)).isoformat(),
                "platforms_affected": 4,
                "revenue_impact": 24600,
                "thumbnail_url": "https://i.ytimg.com/vi/HhCKBBGZ3mY/hqdefault.jpg",
                "keyframe_hashes": [
                    "d6c1b0a9f8e7d5c4", "d6c1b0a9f8e7d5c3", "d7c2b1aaf9e8d6c5",
                    "d5c0b0a8f7e6d4c3", "d6c1b0a9f8e7d5c4", "d7c2b1aaf9e8d6c5",
                ],
                "keyframe_count": 56,
                "is_demo": True,
            },
            {
                "id": "SP-IMG-005",
                "title": "Official PSG Champions League Victory Photo 2025",
                "type": "image",
                "status": "monitoring",
                "rights_holder": "Paris Saint-Germain F.C.",
                "violation_count": 3,
                "fingerprint_strength": 4,
                "watermark_status": "intact",
                "sha256": "e7b2c6d5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8",
                "uploaded_at": (now - timedelta(hours=12)).isoformat(),
                "last_scanned": (now - timedelta(minutes=30)).isoformat(),
                "platforms_affected": 2,
                "revenue_impact": 1800,
                "thumbnail_url": "https://i.ytimg.com/vi/XqZsoesa55w/hqdefault.jpg",
                "keyframe_hashes": [
                    "b4a9f8e7d6c5b3a2",
                ],
                "keyframe_count": 1,
                "is_demo": True,
            },
        ]
    }
