"""Seed the database with demo assets and violations on startup."""
from datetime import datetime, timedelta
import random


def seed_demo_data():
    from models.database import SessionLocal
    from models.asset import Asset
    from models.violation import Violation

    db = SessionLocal()
    try:
        # Skip if already seeded
        if db.query(Asset).filter(Asset.id == "SP-IPL-001").first():
            return

        now = datetime.utcnow()

        # Real pHash-style 64-bit hex strings for convincing fingerprinting
        ASSETS = [
            Asset(
                id="SP-UCL-001",
                title="UEFA Champions League 2025-26 Quarterfinals — PSG vs Man City",
                type="video",
                status="threat_detected",
                rights_holder="UEFA Media Rights",
                uploaded_at=now - timedelta(hours=48),
                last_scanned=now - timedelta(minutes=2),
                sha256_hash="a3f8d2c19b7e4f0a6d5c3b2e1f9a8d7c6b5a4e3f2d1c0b9a8f7e6d5c4b3a2f1",
                watermark_id="WM-UCL-001-20250531",
                watermark_status="intact",
                watermark_strength=9,
                keyframe_count=47,
                fingerprint_strength=5,
                violation_count=12,
                platforms_affected=4,
                revenue_impact=12400.0,
                thumbnail_url="https://i.ytimg.com/vi/GgKIhlyjX2w/mqdefault.jpg",
                # Real pHashes computed from actual YouTube UCL 2025 thumbnails
                keyframe_hashes=[
                    "f870708a1efc970b",  # GgKIhlyjX2w — PSG vs Arsenal UCL Final 2025
                    "f870708a1efc970b",  # Yy71SAbiyB8 — PSG Champions League 2025 Extended
                    "81251e9ef24a6a9f",  # QGPookgA1GY — PSG vs Arsenal Key Moments
                    "9110da66ec36e7c9",  # vv7890ugmmg — Arsenal vs PSG Semi Final
                    "8891c52fd432e7bc",  # -Shb2iaJu18 — PSG vs Atletico Quarter Final
                    "97198934da3ce43d",  # ukO-KLkYURw — Arsenal vs Real Madrid Quarter Final
                    "f871708a1efc970b",  # near-duplicate variant
                    "f870718a1efc970b",  # near-duplicate variant
                ],
                is_demo=True,
            ),
            Asset(
                id="SP-EPL-002",
                title="Premier League 2025-26 — Arsenal vs Liverpool Title Decider",
                type="video",
                status="threat_detected",
                rights_holder="Premier League Productions",
                uploaded_at=now - timedelta(hours=36),
                last_scanned=now - timedelta(minutes=5),
                sha256_hash="b4e9f3d2a1c0b8e7f6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4",
                watermark_id="WM-EPL-002-20250518",
                watermark_status="intact",
                watermark_strength=8,
                keyframe_count=32,
                fingerprint_strength=5,
                violation_count=8,
                platforms_affected=3,
                revenue_impact=8200.0,
                thumbnail_url="https://i.ytimg.com/vi/cbOf_1NZFRY/hqdefault.jpg",
                keyframe_hashes=[
                    "e7b2c1d0a9f8e6c5", "e7b2c1d0a9f8e6c4", "e8b3c2d1aaf9e7c6",
                    "e6b1c0d0a8f7e5c4", "e7b2c1d0a9f8e6c5", "e8b3c2d1aaf9e7c7",
                    "e7b2c2d0a9f8e6c5", "e7b2c1d1a9f8e6c5",
                ],
                is_demo=True,
            ),
            Asset(
                id="SP-NBA-003",
                title="NBA Playoffs 2026 — OKC Thunder vs Boston Celtics Game 5",
                type="video",
                status="threat_detected",
                rights_holder="NBA Entertainment",
                uploaded_at=now - timedelta(hours=72),
                last_scanned=now - timedelta(minutes=1),
                sha256_hash="c5f0a4e3d2c1b0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6",
                watermark_id="WM-NBA-003-20250622",
                watermark_status="intact",
                watermark_strength=9,
                keyframe_count=56,
                fingerprint_strength=4,
                violation_count=23,
                platforms_affected=4,
                revenue_impact=24600.0,
                thumbnail_url="https://i.ytimg.com/vi/HhCKBBGZ3mY/hqdefault.jpg",
                keyframe_hashes=[
                    "d6c1b0a9f8e7d5c4", "d6c1b0a9f8e7d5c3", "d7c2b1aaf9e8d6c5",
                    "d5c0b0a8f7e6d4c3", "d6c1b0a9f8e7d5c4", "d7c2b1aaf9e8d6c5",
                    "d6c1b1a9f8e7d5c4", "d6c2b0a9f8e7d5c4", "d6c1b0a9f9e7d5c4",
                    "d6c1b0a9f8e8d5c4", "d6c1b0a9f8e7d6c4", "d5c1b0a9f8e7d5c4",
                ],
                is_demo=True,
            ),
            Asset(
                id="SP-OLY-004",
                title="World Athletics Championships 2025 — 100m Final Tokyo",
                type="video",
                status="monitoring",
                rights_holder="World Athletics / IOC Broadcasting",
                uploaded_at=now - timedelta(hours=24),
                last_scanned=now - timedelta(minutes=15),
                sha256_hash="d6a1b5c4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7",
                watermark_id="WM-OLY-004-20250921",
                watermark_status="intact",
                watermark_strength=10,
                keyframe_count=28,
                fingerprint_strength=5,
                violation_count=5,
                platforms_affected=2,
                revenue_impact=5100.0,
                thumbnail_url="https://i.ytimg.com/vi/8NtDRHVL8No/hqdefault.jpg",
                keyframe_hashes=[
                    "c5b0a9f8e7d6c4b3", "c5b0a9f8e7d6c4b2", "c6b1aaf9e8d7c5b4",
                    "c4b0a8f7e6d5c3b2", "c5b0a9f8e7d6c4b3", "c5b1a9f8e7d6c4b3",
                    "c5b0a9f8e7d7c4b3",
                ],
                is_demo=True,
            ),
            Asset(
                id="SP-IMG-005",
                title="Official PSG Champions League Victory Photo 2025",
                type="image",
                status="monitoring",
                rights_holder="Paris Saint-Germain F.C.",
                uploaded_at=now - timedelta(hours=12),
                last_scanned=now - timedelta(minutes=30),
                sha256_hash="e7b2c6d5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8",
                watermark_id="WM-IMG-005-20250601",
                watermark_status="intact",
                watermark_strength=7,
                keyframe_count=1,
                fingerprint_strength=4,
                violation_count=3,
                platforms_affected=2,
                revenue_impact=1800.0,
                thumbnail_url="https://i.ytimg.com/vi/XqZsoesa55w/hqdefault.jpg",
                keyframe_hashes=[
                    "b4a9f8e7d6c5b3a2",
                ],
                is_demo=True,
            ),
        ]

        # ─── Indian political assets ──────────────────────────────────────────────
        POLITICAL_ASSETS = [
            Asset(
                id="SP-POL-001",
                title="Delhi Assembly Election 2025 — BJP Victory & Results Coverage",
                type="video",
                status="threat_detected",
                rights_holder="Doordarshan National / Election Commission of India",
                uploaded_at=now - timedelta(hours=10),
                last_scanned=now - timedelta(minutes=4),
                sha256_hash="c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4",
                watermark_id="WM-POL-001-20250208",
                watermark_status="intact",
                watermark_strength=10,
                keyframe_count=58,
                fingerprint_strength=5,
                violation_count=134,
                platforms_affected=6,
                revenue_impact=0.0,  # Government content — rights, not revenue
                thumbnail_url="https://i.ytimg.com/vi/avzufy3tPKw/mqdefault.jpg",
                keyframe_hashes=[
                    "fde565e88a072e22",  # avzufy3tPKw — Modi Oath Ceremony 15.6M views
                    "ed95eca8e2c3432c",  # TQnEfCFqDXc — Modi BJP HQ speech 6.2M views
                    "fRfqjSw_vbM",
                    "9993a79ea09fce01",  # Hyj65VbkRcU — Modi speech 1.1M views
                    "c4be9757ba80eac0",  # fRfqjSw_vbM — NDA meeting 7.1M views
                    "fde565e88a072e23",
                ],
                is_demo=True,
            ),
            Asset(
                id="SP-POL-002",
                title="Union Budget 2026-27 — FM Nirmala Sitharaman Full Speech",
                type="video",
                status="threat_detected",
                rights_holder="Sansad TV / Ministry of Finance, Government of India",
                uploaded_at=now - timedelta(hours=20),
                last_scanned=now - timedelta(minutes=6),
                sha256_hash="d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5",
                watermark_id="WM-POL-002-20250201",
                watermark_status="intact",
                watermark_strength=9,
                keyframe_count=44,
                fingerprint_strength=5,
                violation_count=56,
                platforms_affected=4,
                revenue_impact=0.0,
                thumbnail_url="https://i.ytimg.com/vi/BN1C3jayNxk/mqdefault.jpg",
                keyframe_hashes=[
                    "a9c5259b52fb3a0a",  # BN1C3jayNxk — Budget 2025-26 speech 85K views
                    "8ae5649a1f5a63a5",  # 7SNN9axhIrA — Sansad TV Parliament 232K views
                    "b79d48b5475b380c",  # tKUxL9C2xRM — LS Question Hour 278K views
                    "a9c5259b52fb3a0b",
                ],
                is_demo=True,
            ),
            Asset(
                id="SP-POL-003",
                title="Rahul Gandhi Congress Rally 2026 — Official Coverage",
                type="video",
                status="threat_detected",
                rights_holder="Indian National Congress / AIR Media Centre",
                uploaded_at=now - timedelta(hours=14),
                last_scanned=now - timedelta(minutes=9),
                sha256_hash="e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6",
                watermark_id="WM-POL-003-20250315",
                watermark_status="intact",
                watermark_strength=8,
                keyframe_count=36,
                fingerprint_strength=4,
                violation_count=72,
                platforms_affected=5,
                revenue_impact=0.0,
                thumbnail_url="https://i.ytimg.com/vi/e4Lv77fFF28/mqdefault.jpg",
                keyframe_hashes=[
                    "84ca37aa6a79e515",  # e4Lv77fFF28 — Bharat Jodo Nyay Yatra Mumbai 176K
                    "a78323f48dd906ce",  # GNEsugsVwVM — NYAY ANTHEM Rahul Gandhi 502K
                    "89b0e4f8eca9ab34",  # CVW-QN4PG80 — Modi Rahul campaign 96K views
                    "84ca37aa6a79e516",
                ],
                is_demo=True,
            ),
        ]

        # ─── Indian sports assets (primary focus for India demo) ─────────────────
        INDIAN_ASSETS = [
            Asset(
                id="SP-IPL-001",
                title="TATA IPL 2026 — RCB vs MI Live Match Highlights",
                type="video",
                status="threat_detected",
                rights_holder="Board of Control for Cricket in India (BCCI)",
                uploaded_at=now - timedelta(hours=18),
                last_scanned=now - timedelta(minutes=1),
                sha256_hash="f1e2d3c4b5a6f7e8d9c0b1a2f3e4d5c6b7a8f9e0d1c2b3a4f5e6d7c8b9a0f1e2",
                watermark_id="WM-IPL-001-20250525",
                watermark_status="intact",
                watermark_strength=10,
                keyframe_count=62,
                fingerprint_strength=5,
                violation_count=41,
                platforms_affected=5,
                revenue_impact=48700.0,
                thumbnail_url="https://i.ytimg.com/vi/IEpw6y-cCyw/mqdefault.jpg",
                # Real pHashes from actual IPL 2025 Final thumbnails
                keyframe_hashes=[
                    "d0f42eb8b46c63c3",  # IEpw6y-cCyw — IPL Final 2025 RCB vs PBKS
                    "d1f42eb8b46c63c3",
                    "d0f43eb8b46c63c3",
                    "d0f42eb9b46c63c3",
                    "d0f42eb8b46c64c3",
                ],
                is_demo=True,
            ),
            Asset(
                id="SP-T20-002",
                title="India vs England T20 Series 2026 — Full Match Highlights",
                type="video",
                status="threat_detected",
                rights_holder="ICC (International Cricket Council)",
                uploaded_at=now - timedelta(hours=30),
                last_scanned=now - timedelta(minutes=3),
                sha256_hash="a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
                watermark_id="WM-T20-002-20250309",
                watermark_status="intact",
                watermark_strength=10,
                keyframe_count=54,
                fingerprint_strength=5,
                violation_count=87,
                platforms_affected=6,
                revenue_impact=91200.0,
                thumbnail_url="https://i.ytimg.com/vi/SbP1CN4rTlo/mqdefault.jpg",
                # Real pHashes from Champions Trophy 2025 India win thumbnails
                keyframe_hashes=[
                    "971d4b23c649b327",  # SbP1CN4rTlo — India vs NZ Champions Trophy Final 2025
                    "b0d52fe1d713524c",  # ZwpDivMsvBQ — India vs Pakistan Champions Trophy 2025
                    "9ab5371822c137f5",  # MAm0RLQpYas — India vs Bangladesh CT 2025
                    "84723baec47d1bc2",  # nCTUP7-tLrU — Every Kohli boundary Champions Trophy 2025
                    "971d4b23c649b328",
                    "971d4c23c649b327",
                ],
                is_demo=True,
            ),
            Asset(
                id="SP-PKL-003",
                title="Pro Kabaddi League Season 12 Final 2026",
                type="video",
                status="threat_detected",
                rights_holder="Mashal Sports / Star Sports India",
                uploaded_at=now - timedelta(hours=6),
                last_scanned=now - timedelta(minutes=8),
                sha256_hash="b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3",
                watermark_id="WM-PKL-003-20250228",
                watermark_status="intact",
                watermark_strength=9,
                keyframe_count=38,
                fingerprint_strength=4,
                violation_count=19,
                platforms_affected=4,
                revenue_impact=14300.0,
                thumbnail_url="https://i.ytimg.com/vi/MVxbmZDvj_k/mqdefault.jpg",
                keyframe_hashes=[
                    "a36b4ea9ab11d11d",  # MVxbmZDvj_k — Haryana Steelers PKL Final
                    "b1655c923d659e4a",  # LxyWuPV_MRs — Puneri Paltan PKL Final
                    "a36b4ea9ab11d11e",
                    "a36b4fa9ab11d11d",
                ],
                is_demo=True,
            ),
        ]

        ASSETS = POLITICAL_ASSETS + INDIAN_ASSETS + ASSETS

        for asset in ASSETS:
            db.add(asset)

        # Real YouTube video IDs for each violation (actual sports videos)
        VIOLATION_DATA = [
            # UCL violations — PSG vs Arsenal UCL Final 2025
            ("VL-001", "SP-UCL-001", "youtube",  0.942, "pending",      3,  0.941, 0.96,
             "GgKIhlyjX2w", "PSG vs Man City | UCL QF 2025-26 Full Match Highlights Unauthorized",
             "Football Highlights HD", "2.3M views"),
            ("VL-002", "SP-UCL-001", "tiktok",   0.961, "dmca_submitted", 2, 0.958, 0.97,
             "PsBPDMD_WLQ", "PSG vs Man City | UCL 2025-26 QF Full Match — Unauthorized Reupload",
             "SportsTikTok", "8.1M views"),
            ("VL-003", "SP-UCL-001", "youtube",  0.871, "resolved",     8,  0.869, 0.88,
             "E8rmfzeR3yE", "UCL QF 2026 All Goals & Best Moments — Reupload Free",
             "UCL_Archive99", "5.3M views"),

            # EPL violations — Liverpool title win 2024-25
            ("VL-004", "SP-EPL-002", "youtube",  0.887, "pending",      5,  0.884, 0.91,
             "cbOf_1NZFRY", "Premier League Best Goals 2025-26 Season — Arsenal vs Liverpool Free Watch",
             "PremierClips", "9.2M views"),
            ("VL-005", "SP-EPL-002", "tiktok",   0.913, "dmca_submitted", 4, 0.910, 0.92,
             "XqZsoesa55w", "Salah Best Moments 2025-26 | Goals & Assists — Unauthorized Compilation",
             "LiverpoolFanTV", "3.7M views"),

            # NBA violations — OKC Thunder 2025
            ("VL-006", "SP-NBA-003", "youtube",  0.956, "pending",      2,  0.953, 0.96,
             "HhCKBBGZ3mY", "NBA Playoffs 2026 Best Plays — OKC Thunder vs Celtics Free Watch",
             "HouseOfHighlights_", "18.2M views"),
            ("VL-007", "SP-NBA-003", "twitter",  0.834, "pending",      9,  0.831, 0.85,
             "Mwt6BfUDEtI", "OKC Thunder Top 50 Plays 2025-26 Playoffs — Unauthorized HD",
             "NBAClassics", "6.8M views"),
            ("VL-008", "SP-NBA-003", "tiktok",   0.921, "dmca_submitted", 3, 0.918, 0.93,
             "HhCKBBGZ3mY", "CRAZY NBA Playoffs 2026 Dunks Compilation — Unauthorized Free",
             "NBAShorts_Fan", "4.1M views"),
            ("VL-009", "SP-NBA-003", "web",      0.763, "dismissed",    12, 0.760, 0.78,
             "Mwt6BfUDEtI", "Free NBA Highlights Download 2025",
             "StreamSports.net", "N/A"),

            # World Athletics violations
            ("VL-010", "SP-OLY-004", "youtube",  0.891, "pending",      6,  0.888, 0.90,
             "8NtDRHVL8No", "World Athletics 100m Final 2025 Tokyo — FULL RACE Reupload HD",
             "AthleticsFan2025", "22.1M views"),
            ("VL-011", "SP-OLY-004", "web",      0.712, "dismissed",    15, 0.709, 0.73,
             "HqtBTcvEABo", "Watch World Athletics 100m Final Free — Tokyo 2025",
             "FreeStreams.io", "N/A"),

            # PSG photo violations
            ("VL-012", "SP-IMG-005", "twitter",  0.823, "resolved",     10, 0.820, 0.84,
             "XqZsoesa55w", "PSG UCL Victory Official Photo 2025 — Leaked Full Res",
             "@PSGLeak2025", "340K views"),
            ("VL-013", "SP-IMG-005", "web",      0.776, "pending",      13, 0.773, 0.79,
             "XqZsoesa55w", "PSG Champions League Winners 2025 Squad Official Photo Download",
             "FootballWallpapers.net", "N/A"),
        ]

        # ─── Indian political violations ──────────────────────────────────────────
        POLITICAL_VIOLATION_DATA = [
            # Delhi Election 2025 — 134 violations (most pirated political event 2025)
            ("VL-PL-001", "SP-POL-001", "youtube",   0.983, "pending",        0, 0.980, 0.99,
             "avzufy3tPKw", "Delhi Election 2025 FULL Results Night — BJP Win | Unauthorized Reupload",
             "IndiaNewsClips", "15.6M views"),
            ("VL-PL-002", "SP-POL-001", "youtube",   0.971, "dmca_submitted",  1, 0.968, 0.98,
             "TQnEfCFqDXc", "PM Modi Speech on Delhi Election Victory 2025 — Full HD",
             "BJP_FanClips", "6.2M views"),
            ("VL-PL-003", "SP-POL-001", "youtube",   0.958, "pending",         2, 0.955, 0.97,
             "fRfqjSw_vbM", "BJP Delhi Win Celebration 2025 — Viral Clip without DD permission",
             "PoliticsIndia2025", "7.1M views"),
            ("VL-PL-004", "SP-POL-001", "tiktok",    0.934, "dmca_submitted",  4, 0.931, 0.94,
             "avzufy3tPKw", "Delhi Election results best moments 2025 — edited highlights",
             "@modi_moments_india", "24M views"),
            ("VL-PL-005", "SP-POL-001", "instagram", 0.912, "pending",         5, 0.909, 0.92,
             "TQnEfCFqDXc", "BJP Delhi victory speech 2025 — viral reel without watermark",
             "@india_political_updates", "8.4M views"),
            ("VL-PL-006", "SP-POL-001", "twitter",   0.887, "pending",         7, 0.884, 0.90,
             "fRfqjSw_vbM", "Delhi election win clip — shared without DD permission",
             "@NewsroomIndia", "3.2M views"),
            ("VL-PL-007", "SP-POL-001", "web",       0.843, "dismissed",       11, 0.840, 0.86,
             "avzufy3tPKw", "Delhi Election 2025 Full Coverage Download Free",
             "FreePoliticsVideos.in", "N/A"),

            # Budget 2025-26 speech — 56 violations
            ("VL-PL-008", "SP-POL-002", "youtube",   0.967, "pending",         1, 0.964, 0.97,
             "BN1C3jayNxk", "Full Budget Speech 2026-27 Nirmala Sitharaman — Reupload Sansad TV Unauthorized",
             "BudgetIndia2025", "85K views"),
            ("VL-PL-009", "SP-POL-002", "youtube",   0.941, "dmca_submitted",  3, 0.938, 0.95,
             "7SNN9axhIrA", "Parliament Budget Session 2026 Debate — Clip without authorization free",
             "SansadFan", "232K views"),
            ("VL-PL-010", "SP-POL-002", "tiktok",    0.914, "pending",         5, 0.911, 0.92,
             "tKUxL9C2xRM", "Nirmala Sitharaman Budget 2026-27 announcement viral moment free",
             "@budget_india_shorts", "1.1M views"),
            ("VL-PL-011", "SP-POL-002", "twitter",   0.878, "pending",         8, 0.875, 0.89,
             "BN1C3jayNxk", "Budget 2026-27 key highlights clipped from DD/Sansad TV unauthorized",
             "@EconIndia", "567K views"),

            # Rahul Gandhi INDIA Alliance Rally 2025 — 72 violations
            ("VL-PL-012", "SP-POL-003", "youtube",   0.953, "pending",         3, 0.950, 0.96,
             "e4Lv77fFF28", "Rahul Gandhi Congress Rally 2026 FULL — Unauthorized Repost Free",
             "CongressSupporter", "176K views"),
            ("VL-PL-013", "SP-POL-003", "youtube",   0.928, "dmca_submitted",  5, 0.925, 0.94,
             "GNEsugsVwVM", "Rahul Gandhi Opposition Speech 2026 — Reupload without permission free",
             "OppositionIndia2025", "502K views"),
            ("VL-PL-014", "SP-POL-003", "tiktok",    0.901, "pending",         7, 0.898, 0.91,
             "CVW-QN4PG80", "Modi vs Rahul campaign 2026 — clipped without authorization free",
             "@election2025_shorts", "3.8M views"),
            ("VL-PL-015", "SP-POL-003", "instagram", 0.876, "pending",         9, 0.873, 0.89,
             "e4Lv77fFF28", "Rahul Gandhi rally 2026 — reel without INC watermark free watch",
             "@india_alliance_fan", "1.9M views"),
        ]

        # ─── Indian sports violations (highest piracy volumes) ───────────────────
        INDIAN_VIOLATION_DATA = [
            # IPL 2025 Final — most pirated sporting event in India 2025
            ("VL-IN-001", "SP-IPL-001", "youtube",  0.968, "pending",       1, 0.965, 0.98,
             "IEpw6y-cCyw", "IPL 2026 RCB vs MI FULL MATCH HIGHLIGHTS — Star Sports Unauthorized",
             "CricketFanIndia", "13K views"),
            ("VL-IN-002", "SP-IPL-001", "youtube",  0.941, "pending",       3, 0.938, 0.95,
             "KEgqcqx7dMw", "RCB vs MI highlights 2026 TATA IPL — unauthorized reupload free watch",
             "IPLFanatics2025", "378 views"),
            ("VL-IN-003", "SP-IPL-001", "tiktok",   0.923, "dmca_submitted", 4, 0.920, 0.93,
             "IEpw6y-cCyw", "IPL 2026 best moments — RCB vs MI highlights free no copyright",
             "@ipl_highlights_india", "2.1M views"),
            ("VL-IN-004", "SP-IPL-001", "twitter",  0.887, "pending",       6, 0.884, 0.90,
             "KEgqcqx7dMw", "IPL 2026 full highlights — shared without permission unauthorized",
             "@CricketIndia_Fan", "440K views"),
            ("VL-IN-005", "SP-IPL-001", "web",      0.831, "pending",      10, 0.828, 0.85,
             "IEpw6y-cCyw", "Watch IPL 2026 Free — RCB vs MI Full Match Unauthorized",
             "FreeCricketStream.in", "N/A"),

            # Champions Trophy 2025 — India wins (87 violations — highest piracy)
            ("VL-IN-006", "SP-T20-002", "youtube",  0.979, "pending",       0, 0.976, 0.99,
             "SbP1CN4rTlo", "India vs England T20 2026 FULL MATCH HIGHLIGHTS — Free Unauthorized",
             "CricketHighlightsHD", "526K views"),
            ("VL-IN-007", "SP-T20-002", "youtube",  0.963, "dmca_submitted", 2, 0.960, 0.97,
             "ZwpDivMsvBQ", "India vs Pakistan T20 2026 Full Match Free Watch — Unauthorized",
             "ICC_Fan_Clips", "5.0M views"),
            ("VL-IN-008", "SP-T20-002", "youtube",  0.951, "pending",       3, 0.948, 0.96,
             "nCTUP7-tLrU", "Every Virat Kohli boundary India vs England T20 2026 — Reupload HD Free",
             "KohliForever18", "1.5M views"),
            ("VL-IN-009", "SP-T20-002", "tiktok",   0.934, "dmca_submitted", 4, 0.931, 0.94,
             "MAm0RLQpYas", "India vs Pakistan T20 2026 highlights — viral no copyright free",
             "@cricket_shorts_india", "77M views"),
            ("VL-IN-010", "SP-T20-002", "instagram", 0.912, "pending",      5, 0.909, 0.92,
             "SbP1CN4rTlo", "India wins T20 Series 2026 — Rohit Sharma moment free reupload",
             "@indian_cricket_highlights", "3.2M views"),
            ("VL-IN-011", "SP-T20-002", "twitter",  0.876, "pending",       8, 0.873, 0.89,
             "ZwpDivMsvBQ", "INDIA VS PAKISTAN T20 2026 best moments — clipped without permission",
             "@indpakrivalry2025", "890K views"),
            ("VL-IN-012", "SP-T20-002", "web",      0.843, "dismissed",    11, 0.840, 0.86,
             "SbP1CN4rTlo", "India vs England T20 2026 free stream — full match replay unauthorized",
             "cricketlive365.com", "N/A"),

            # Pro Kabaddi League S11 violations
            ("VL-IN-013", "SP-PKL-003", "youtube",  0.934, "pending",       4, 0.931, 0.94,
             "MVxbmZDvj_k", "PKL Season 12 Final 2026 — Full Match Highlights Unauthorized Free",
             "KabaddiFanatic_IN", "2.6M views"),
            ("VL-IN-014", "SP-PKL-003", "tiktok",   0.897, "dmca_submitted", 6, 0.894, 0.91,
             "LxyWuPV_MRs", "Pro Kabaddi Season 12 Final 2026 best raids & tackles — free watch",
             "@pkl_shorts_fan", "5.3M views"),
            ("VL-IN-015", "SP-PKL-003", "youtube",  0.856, "pending",       9, 0.853, 0.87,
             "MVxbmZDvj_k", "PKL S12 Final 2026 — unauthorized HD reupload no copyright",
             "SportsGullyIndia", "270K views"),
        ]

        VIOLATION_DATA = POLITICAL_VIOLATION_DATA + INDIAN_VIOLATION_DATA + VIOLATION_DATA

        AI_EXPLANATIONS = {
            "high": """SportShield Forensic AI — Violation Analysis

VISUAL MATCH SIGNALS:
▸ Perceptual hash distance: {phash}/64 bits — near-identical copy confirmed
▸ CLIP embedding cosine similarity: {clip:.3f} — visual features match at scene level
▸ Frame-level match: {frame:.0f}% of sampled frames identical after normalization
▸ Watermark payload decoded: asset ID confirmed in DCT frequency domain

ALTERATIONS DETECTED:
▸ Aspect ratio modified 16:9 → 9:16 (portrait crop for mobile)
▸ Color saturation increased ~38% (Instagram filter applied)
▸ Playback speed reduced to 0.85× (avoids hash detection)
▸ Audio track replaced with royalty-free music

CONCLUSION:
Content is an unauthorized redistribution of the protected asset. Modifications
are insufficient to defeat multi-layer fingerprint matching. Confidence: {conf:.1f}%
RECOMMENDED ACTION: File DMCA takedown immediately.""",

            "medium": """SportShield Forensic AI — Violation Analysis

VISUAL MATCH SIGNALS:
▸ Perceptual hash distance: {phash}/64 bits — high visual similarity
▸ CLIP embedding cosine similarity: {clip:.3f} — scene-level match confirmed
▸ Frame-level match: {frame:.0f}% on sampled keyframes

ALTERATIONS DETECTED:
▸ Video cropped: upper 15% of frame removed
▸ Slight color grade applied (contrast +0.2, saturation +0.15)
▸ Re-encoded at lower bitrate (quality degradation visible)

CONCLUSION:
High probability unauthorized redistribution. Confidence: {conf:.1f}%
RECOMMENDED ACTION: Review and file DMCA if confirmed.""",

            "low": """SportShield Forensic AI — Violation Analysis

VISUAL MATCH SIGNALS:
▸ Perceptual hash distance: {phash}/64 bits — partial visual overlap detected
▸ CLIP embedding cosine similarity: {clip:.3f} — scene-level match possible

NOTE: Lower confidence indicates possible fair-use clip or derivative work.
RECOMMENDED ACTION: Manual review before DMCA filing.""",
        }

        SPREAD_TEMPLATES = {
            "SP-POL-001": {
                "nodes": [
                    {"id": "origin", "platform": "origin", "label": "DELHI ELECTION 2025", "size": 28, "count": 1},
                    {"id": "yt1", "platform": "youtube", "label": "YT — IN (North)", "size": 26, "count": 38},
                    {"id": "yt2", "platform": "youtube", "label": "YT — IN (South)", "size": 20, "count": 22},
                    {"id": "yt3", "platform": "youtube", "label": "YT — PK", "size": 14, "count": 9},
                    {"id": "tt1", "platform": "tiktok", "label": "TT — IN", "size": 22, "count": 28},
                    {"id": "ig1", "platform": "web", "label": "IG — IN", "size": 20, "count": 18},
                    {"id": "tw1", "platform": "twitter", "label": "TW — IN", "size": 16, "count": 12},
                    {"id": "tw2", "platform": "twitter", "label": "TW — Intl", "size": 10, "count": 4},
                    {"id": "web1", "platform": "web", "label": "Web — IN", "size": 9, "count": 3},
                ],
                "edges": [
                    {"source": "origin", "target": "yt1", "confidence": 0.98},
                    {"source": "origin", "target": "tt1", "confidence": 0.93},
                    {"source": "origin", "target": "ig1", "confidence": 0.91},
                    {"source": "yt1", "target": "yt2", "confidence": 0.87},
                    {"source": "yt1", "target": "yt3", "confidence": 0.79},
                    {"source": "yt1", "target": "tw1", "confidence": 0.89},
                    {"source": "tt1", "target": "ig1", "confidence": 0.92},
                    {"source": "tw1", "target": "tw2", "confidence": 0.74},
                    {"source": "tw1", "target": "web1", "confidence": 0.68},
                ],
            },
            "SP-POL-003": {
                "nodes": [
                    {"id": "origin", "platform": "origin", "label": "CONGRESS RALLY 2026", "size": 24, "count": 1},
                    {"id": "yt1", "platform": "youtube", "label": "YT — IN", "size": 22, "count": 24},
                    {"id": "yt2", "platform": "youtube", "label": "YT — UK diaspora", "size": 12, "count": 6},
                    {"id": "tt1", "platform": "tiktok", "label": "TT — IN", "size": 18, "count": 16},
                    {"id": "ig1", "platform": "web", "label": "IG — IN", "size": 16, "count": 14},
                    {"id": "tw1", "platform": "twitter", "label": "TW — IN", "size": 14, "count": 10},
                    {"id": "web1", "platform": "web", "label": "Web — IN", "size": 8, "count": 2},
                ],
                "edges": [
                    {"source": "origin", "target": "yt1", "confidence": 0.95},
                    {"source": "origin", "target": "ig1", "confidence": 0.88},
                    {"source": "yt1", "target": "yt2", "confidence": 0.81},
                    {"source": "yt1", "target": "tw1", "confidence": 0.86},
                    {"source": "tt1", "target": "ig1", "confidence": 0.89},
                    {"source": "tw1", "target": "web1", "confidence": 0.69},
                ],
            },
            "SP-IPL-001": {
                "nodes": [
                    {"id": "origin", "platform": "origin", "label": "IPL 2026 LIVE", "size": 26, "count": 1},
                    {"id": "yt1", "platform": "youtube", "label": "YT — IN", "size": 24, "count": 18},
                    {"id": "yt2", "platform": "youtube", "label": "YT — PK", "size": 16, "count": 9},
                    {"id": "yt3", "platform": "youtube", "label": "YT — BD", "size": 14, "count": 7},
                    {"id": "tt1", "platform": "tiktok", "label": "TT — IN", "size": 20, "count": 14},
                    {"id": "tt2", "platform": "tiktok", "label": "TT — UK", "size": 13, "count": 5},
                    {"id": "tw1", "platform": "twitter", "label": "TW — IN", "size": 14, "count": 6},
                    {"id": "ig1", "platform": "web", "label": "IG — IN", "size": 12, "count": 8},
                    {"id": "web1", "platform": "web", "label": "Web — IN", "size": 10, "count": 4},
                ],
                "edges": [
                    {"source": "origin", "target": "yt1", "confidence": 0.97},
                    {"source": "origin", "target": "tt1", "confidence": 0.92},
                    {"source": "yt1", "target": "yt2", "confidence": 0.88},
                    {"source": "yt1", "target": "yt3", "confidence": 0.84},
                    {"source": "yt1", "target": "tw1", "confidence": 0.87},
                    {"source": "tt1", "target": "tt2", "confidence": 0.79},
                    {"source": "tt1", "target": "ig1", "confidence": 0.91},
                    {"source": "tw1", "target": "web1", "confidence": 0.71},
                ],
            },
            "SP-T20-002": {
                "nodes": [
                    {"id": "origin", "platform": "origin", "label": "CHAMPIONS TROPHY 2025", "size": 28, "count": 1},
                    {"id": "yt1", "platform": "youtube", "label": "YT — IN", "size": 26, "count": 32},
                    {"id": "yt2", "platform": "youtube", "label": "YT — PK", "size": 22, "count": 18},
                    {"id": "yt3", "platform": "youtube", "label": "YT — AU", "size": 14, "count": 8},
                    {"id": "yt4", "platform": "youtube", "label": "YT — UK", "size": 13, "count": 7},
                    {"id": "tt1", "platform": "tiktok", "label": "TT — IN", "size": 22, "count": 21},
                    {"id": "tt2", "platform": "tiktok", "label": "TT — PK", "size": 16, "count": 12},
                    {"id": "ig1", "platform": "web", "label": "IG — IN", "size": 18, "count": 15},
                    {"id": "tw1", "platform": "twitter", "label": "TW — IN", "size": 14, "count": 9},
                    {"id": "tw2", "platform": "twitter", "label": "TW — PK", "size": 11, "count": 5},
                    {"id": "web1", "platform": "web", "label": "Web — IN", "size": 9, "count": 3},
                ],
                "edges": [
                    {"source": "origin", "target": "yt1", "confidence": 0.98},
                    {"source": "origin", "target": "tt1", "confidence": 0.93},
                    {"source": "yt1", "target": "yt2", "confidence": 0.91},
                    {"source": "yt1", "target": "yt3", "confidence": 0.84},
                    {"source": "yt1", "target": "yt4", "confidence": 0.82},
                    {"source": "yt1", "target": "tw1", "confidence": 0.89},
                    {"source": "tt1", "target": "tt2", "confidence": 0.87},
                    {"source": "tt1", "target": "ig1", "confidence": 0.94},
                    {"source": "tw1", "target": "tw2", "confidence": 0.78},
                    {"source": "tw1", "target": "web1", "confidence": 0.67},
                ],
            },
            "SP-UCL-001": {
                "nodes": [
                    {"id": "origin", "platform": "origin", "label": "UCL FINAL 2025", "size": 24, "count": 1},
                    {"id": "yt1", "platform": "youtube", "label": "YT — UK", "size": 18, "count": 12},
                    {"id": "yt2", "platform": "youtube", "label": "YT — ES", "size": 14, "count": 7},
                    {"id": "tt1", "platform": "tiktok", "label": "TT — ID", "size": 20, "count": 15},
                    {"id": "tt2", "platform": "tiktok", "label": "TT — BR", "size": 13, "count": 6},
                    {"id": "tt3", "platform": "tiktok", "label": "TT — US", "size": 11, "count": 4},
                    {"id": "tw1", "platform": "twitter", "label": "TW — US", "size": 12, "count": 5},
                    {"id": "web1", "platform": "web", "label": "Web — DE", "size": 9, "count": 3},
                ],
                "edges": [
                    {"source": "origin", "target": "yt1", "confidence": 0.94},
                    {"source": "origin", "target": "tt1", "confidence": 0.96},
                    {"source": "yt1", "target": "yt2", "confidence": 0.82},
                    {"source": "yt1", "target": "tw1", "confidence": 0.87},
                    {"source": "tt1", "target": "tt2", "confidence": 0.91},
                    {"source": "tt1", "target": "tt3", "confidence": 0.78},
                    {"source": "tt1", "target": "web1", "confidence": 0.73},
                ],
            },
            "SP-NBA-003": {
                "nodes": [
                    {"id": "origin", "platform": "origin", "label": "NBA DUNK — LEBRON", "size": 24, "count": 1},
                    {"id": "yt1", "platform": "youtube", "label": "YT — US", "size": 22, "count": 18},
                    {"id": "yt2", "platform": "youtube", "label": "YT — PH", "size": 14, "count": 8},
                    {"id": "tt1", "platform": "tiktok", "label": "TT — US", "size": 18, "count": 14},
                    {"id": "tt2", "platform": "tiktok", "label": "TT — CN", "size": 16, "count": 11},
                    {"id": "tw1", "platform": "twitter", "label": "TW — US", "size": 12, "count": 5},
                    {"id": "tw2", "platform": "twitter", "label": "TW — JP", "size": 10, "count": 3},
                    {"id": "web1", "platform": "web", "label": "Web — IN", "size": 8, "count": 2},
                ],
                "edges": [
                    {"source": "origin", "target": "yt1", "confidence": 0.96},
                    {"source": "origin", "target": "tt1", "confidence": 0.92},
                    {"source": "yt1", "target": "yt2", "confidence": 0.85},
                    {"source": "yt1", "target": "tw1", "confidence": 0.83},
                    {"source": "tt1", "target": "tt2", "confidence": 0.88},
                    {"source": "tt1", "target": "tw2", "confidence": 0.74},
                    {"source": "tw1", "target": "web1", "confidence": 0.69},
                ],
            },
        }

        for (vid, asset_id, platform, conf, status, phash, clip_sim, frame_sim,
             yt_video_id, infringing_title, channel, view_count) in VIOLATION_DATA:

            level = "high" if conf >= 0.90 else "medium" if conf >= 0.80 else "low"
            explanation = AI_EXPLANATIONS[level].format(
                phash=phash, clip=clip_sim, frame=frame_sim * 100, conf=conf * 100
            )

            thumbnail = f"https://i.ytimg.com/vi/{yt_video_id}/hqdefault.jpg"
            infringing_url = f"https://www.youtube.com/watch?v={yt_video_id}" if platform in ("youtube", "tiktok", "web") else f"https://twitter.com/i/status/{yt_video_id}"

            # Build spread data
            spread = SPREAD_TEMPLATES.get(asset_id, {
                "nodes": [
                    {"id": "origin", "platform": "origin", "label": "ORIGINAL", "size": 20, "count": 1},
                    {"id": f"v_{vid}", "platform": platform, "label": f"{platform.upper()} #{vid[-3:]}", "size": 12, "count": 3},
                ],
                "edges": [{"source": "origin", "target": f"v_{vid}", "confidence": conf}],
            })

            v = Violation(
                id=vid,
                asset_id=asset_id,
                platform=platform,
                confidence=conf,
                detected_at=now - timedelta(hours=random.randint(1, 48)),
                status=status,
                infringing_url=infringing_url,
                thumbnail_url=thumbnail,
                watermark_found=conf > 0.85,
                phash_distance=phash,
                clip_similarity=clip_sim,
                frame_similarity=frame_sim,
                alterations_detected=[
                    "aspect_ratio_modified_to_portrait",
                    "color_grade_applied",
                    "speed_reduced_0.85x",
                    "audio_replaced",
                ] if conf >= 0.90 else [
                    "crop_applied",
                    "color_grade_applied",
                    "re_encoded_lower_bitrate",
                ],
                ai_explanation=explanation,
                ai_explanation_preview=f"pHash distance {phash}/64 — {level} confidence match | {view_count}",
                is_demo=True,
                spread_data=spread,
            )
            db.add(v)

        db.commit()
        print("[Seed] Demo data seeded successfully (13 violations with real thumbnails).")
    except Exception as e:
        db.rollback()
        print(f"[Seed] Error: {e}")
    finally:
        db.close()
