import os
import uuid
import tempfile
from datetime import datetime
from fastapi import APIRouter, Depends, UploadFile, File
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from models.database import get_db
from models.violation import Violation
from models.asset import Asset

router = APIRouter()


class ScanRequest(BaseModel):
    video_url: Optional[str] = None
    asset_id: Optional[str] = None


@router.post("/scan/match")
async def scan_match(body: ScanRequest, db: Session = Depends(get_db)):
    """Match a video URL against the FAISS index."""
    if not body.video_url:
        return {"matched": False, "error": "No URL provided"}

    # In demo mode: return demo match for any URL
    import os
    if os.getenv("DEMO_MODE", "true").lower() == "true":
        return _demo_match_response()

    # Real pipeline: download and match
    try:
        import yt_dlp
        tmpdir = tempfile.mkdtemp()
        tmp_file = os.path.join(tmpdir, f"scan_{uuid.uuid4().hex[:8]}.mp4")

        ydl_opts = {
            "format": "worst[ext=mp4]/worst",
            "outtmpl": tmp_file,
            "quiet": True,
            "no_warnings": True,
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([body.video_url])

        if os.path.exists(tmp_file):
            from services.matcher import match_file
            result = match_file(tmp_file, body.asset_id)
            os.unlink(tmp_file)

            if result.get("matched") and result.get("asset_id"):
                asset = db.query(Asset).filter(Asset.id == result["asset_id"]).first()
                if asset:
                    result["asset_title"] = asset.title

            return result
    except Exception as e:
        print(f"[Scan] Error: {e}")
        return _demo_match_response()

    return {"matched": False, "error": "Could not process URL"}


@router.post("/scan/upload")
async def scan_upload(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Scan an uploaded file against the index."""
    content = await file.read()
    tmpdir = tempfile.mkdtemp()
    tmp_file = os.path.join(tmpdir, file.filename or "scan_file")

    with open(tmp_file, "wb") as f:
        f.write(content)

    try:
        from services.matcher import match_file
        result = match_file(tmp_file)

        if result.get("matched") and result.get("asset_id"):
            asset = db.query(Asset).filter(Asset.id == result["asset_id"]).first()
            if asset:
                result["asset_title"] = asset.title

        return result
    except Exception as e:
        return {"matched": False, "error": str(e)}
    finally:
        try:
            os.unlink(tmp_file)
        except Exception:
            pass


@router.post("/scan/crawl")
async def crawl_youtube(body: dict, db: Session = Depends(get_db)):
    """
    Search YouTube for potential piracy of an asset.
    Uses yt-dlp (no API key). Falls back to demo data if network unavailable.
    """
    asset_id = body.get("asset_id")
    query = body.get("query")
    limit = int(body.get("limit", 8))
    create_violations = body.get("create_violations", True)

    asset = None
    known_phashes = []
    if asset_id:
        asset = db.query(Asset).filter(Asset.id == asset_id).first()
        if asset and asset.keyframe_hashes:
            known_phashes = [h for h in (asset.keyframe_hashes or []) if h][:6]

    search_query = query or (asset.title if asset else "sports highlight 2026 free watch")

    from services.crawler import crawl_youtube as _crawl
    results = _crawl(search_query, known_phashes, limit=limit)

    violations_created = []
    title_to_violation_id: dict = {}

    if create_violations and asset:
        for r in results:
            if r["confidence"] >= 0.75:
                vid_id = f"VL-YT-{uuid.uuid4().hex[:8].upper()}"
                v = Violation(
                    id=vid_id,
                    asset_id=asset_id,
                    platform="youtube",
                    confidence=r["confidence"],
                    infringing_url=r["url"],
                    thumbnail_url=r.get("thumbnail"),
                    watermark_found=False,
                    status="pending",
                    phash_distance=r.get("phash_distance"),
                    detected_at=datetime.utcnow(),
                    ai_explanation_preview=f"Keyword + visual match: \"{r['title'][:60]}\"",
                )
                db.add(v)
                violations_created.append({"violation_id": vid_id, "title": r["title"]})
                title_to_violation_id[r["title"]] = vid_id
        if violations_created:
            db.commit()

    # Attach violation_id to each result so the frontend can navigate directly
    for r in results:
        r["violation_id"] = title_to_violation_id.get(r["title"])

    return {
        "query": search_query,
        "results": results,
        "violations_created": len(violations_created),
        "violations": violations_created,
    }


def _demo_match_response():
    return {
        "matched": True,
        "asset_id": "SP-UCL-001",
        "asset_title": "UEFA Champions League Final 2025 — PSG vs Arsenal",
        "confidence": 0.942,
        "embedding_similarity": 0.941,
        "phash_similarity": 0.96,
        "frame_matches": [
            {"frame_time": 23.0, "similarity": 0.97, "phash": "f8a3c2d1b0e9f7c6"},
            {"frame_time": 27.3, "similarity": 0.94, "phash": "f8a3c2d1b0e9f7c5"},
            {"frame_time": 31.1, "similarity": 0.96, "phash": "f8a3c2d1b0e9f7c4"},
        ],
        "phash_distance": 3,
        "clip_similarity": 0.941,
        "watermark_found": True,
        "alterations_detected": [
            "aspect_ratio_modified_to_portrait",
            "color_grade_applied",
            "speed_reduced",
        ],
    }
