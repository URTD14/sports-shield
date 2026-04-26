import os
import csv
import io
import uuid
import asyncio
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from models.database import get_db
from models.violation import Violation
from models.asset import Asset

router = APIRouter()


class StatusUpdate(BaseModel):
    status: str


@router.post("/violations")
def create_violation(body: dict, db: Session = Depends(get_db)):
    """Manually create a violation from a scan result."""
    asset_id = body.get("asset_id")
    if not asset_id:
        raise HTTPException(status_code=400, detail="asset_id required")

    vid_id = f"VL-MF-{uuid.uuid4().hex[:8].upper()}"
    v = Violation(
        id=vid_id,
        asset_id=asset_id,
        platform=body.get("platform", "youtube"),
        confidence=float(body.get("confidence", 0.70)),
        infringing_url=body.get("infringing_url", ""),
        thumbnail_url=body.get("thumbnail_url"),
        watermark_found=False,
        status="pending",
        phash_distance=body.get("phash_distance"),
        detected_at=datetime.utcnow(),
        ai_explanation_preview=f"Manually flagged: \"{str(body.get('title', ''))[:80]}\"",
    )
    db.add(v)
    db.commit()
    return {"violation_id": vid_id, "status": "created"}


@router.get("/violations")
def get_violations(
    page: int = 1,
    limit: int = 20,
    asset_id: str = None,
    platform: str = None,
    status: str = None,
    min_confidence: float = None,
    db: Session = Depends(get_db),
):
    query = db.query(Violation)
    if asset_id:
        query = query.filter(Violation.asset_id == asset_id)
    if platform:
        query = query.filter(Violation.platform == platform)
    if status:
        query = query.filter(Violation.status == status)
    if min_confidence is not None:
        query = query.filter(Violation.confidence >= min_confidence)

    total = query.count()
    violations = query.order_by(Violation.detected_at.desc()).offset((page - 1) * limit).limit(limit).all()

    # Enrich with asset titles
    asset_cache = {}
    results = []
    for v in violations:
        if v.asset_id not in asset_cache:
            a = db.query(Asset).filter(Asset.id == v.asset_id).first()
            asset_cache[v.asset_id] = a.title if a else "Unknown Asset"
        d = _v_to_dict(v)
        d["asset_title"] = asset_cache[v.asset_id]
        results.append(d)

    return {"total": total, "page": page, "limit": limit, "violations": results}


@router.get("/violations/export")
def export_violations_csv(
    asset_id: str = None,
    platform: str = None,
    status: str = None,
    db: Session = Depends(get_db),
):
    """Export all violations as CSV."""
    query = db.query(Violation)
    if asset_id:
        query = query.filter(Violation.asset_id == asset_id)
    if platform:
        query = query.filter(Violation.platform == platform)
    if status:
        query = query.filter(Violation.status == status)

    violations = query.order_by(Violation.detected_at.desc()).all()

    # Enrich with asset titles
    asset_cache = {}
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "violation_id", "asset_id", "asset_title", "platform", "confidence",
        "status", "watermark_found", "detected_at", "dmca_submitted_at",
        "resolved_at", "infringing_url",
    ])
    for v in violations:
        if v.asset_id not in asset_cache:
            a = db.query(Asset).filter(Asset.id == v.asset_id).first()
            asset_cache[v.asset_id] = a.title if a else "Unknown Asset"
        writer.writerow([
            v.id,
            v.asset_id,
            asset_cache[v.asset_id],
            v.platform,
            v.confidence,
            v.status,
            v.watermark_found,
            v.detected_at.isoformat() if v.detected_at else "",
            v.dmca_submitted_at.isoformat() if v.dmca_submitted_at else "",
            v.resolved_at.isoformat() if v.resolved_at else "",
            v.infringing_url or "",
        ])

    output.seek(0)
    ts = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=violations-{ts}.csv"},
    )


@router.get("/violations/{violation_id}")
def get_violation(violation_id: str, db: Session = Depends(get_db)):
    v = db.query(Violation).filter(Violation.id == violation_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Violation not found")
    asset = db.query(Asset).filter(Asset.id == v.asset_id).first()
    data = _v_to_dict(v, full=True)
    if asset:
        data["asset_title"] = asset.title
        data["asset_sha256"] = asset.sha256_hash
        data["rights_holder"] = asset.rights_holder
        data["asset_uploaded_at"] = asset.uploaded_at.isoformat() if asset.uploaded_at else None
        data["watermark_id"] = asset.watermark_id
        data["asset_thumbnail_url"] = asset.thumbnail_url
    return data


@router.patch("/violations/{violation_id}/status")
def update_status(violation_id: str, body: StatusUpdate, db: Session = Depends(get_db)):
    v = db.query(Violation).filter(Violation.id == violation_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Violation not found")
    v.status = body.status
    if body.status == "resolved":
        v.resolved_at = datetime.utcnow()
    elif body.status == "dmca_submitted":
        v.dmca_submitted_at = datetime.utcnow()
    db.commit()
    return {"id": violation_id, "status": body.status}


@router.post("/violations/explain")
async def explain_violation(body: dict, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Stream Groq AI explanation for a violation via SSE."""
    violation_id = body.get("violation_id")
    v = db.query(Violation).filter(Violation.id == violation_id).first()

    # If already has explanation, stream it
    if v and v.ai_explanation:
        text = v.ai_explanation

        async def stream_cached():
            for char in text:
                yield f"data: {char}\n\n"
                await asyncio.sleep(0.008)
            yield "data: [DONE]\n\n"

        return StreamingResponse(stream_cached(), media_type="text/event-stream")

    # Build violation data dict
    vdata = _build_violation_dict_for_ai(v, db)

    async def stream_groq():
        from services.ai_service import stream_explanation
        full_text = []
        async for char in stream_explanation(vdata):
            full_text.append(char)
            yield f"data: {char}\n\n"
        yield "data: [DONE]\n\n"

        # Save to DB in background
        background_tasks.add_task(_save_explanation, violation_id, "".join(full_text))

    return StreamingResponse(stream_groq(), media_type="text/event-stream")


@router.post("/violations/dmca")
async def generate_dmca(body: dict, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Stream Groq DMCA letter via SSE."""
    violation_id = body.get("violation_id")
    v = db.query(Violation).filter(Violation.id == violation_id).first()

    # If cached, stream it
    if v and v.dmca_letter:
        text = v.dmca_letter

        async def stream_cached():
            for char in text:
                yield f"data: {char}\n\n"
                await asyncio.sleep(0.008)
            yield "data: [DONE]\n\n"

        return StreamingResponse(stream_cached(), media_type="text/event-stream")

    vdata = _build_violation_dict_for_ai(v, db)

    async def stream_groq():
        from services.ai_service import stream_dmca
        full_text = []
        async for char in stream_dmca(vdata):
            full_text.append(char)
            yield f"data: {char}\n\n"
        yield "data: [DONE]\n\n"
        background_tasks.add_task(_save_dmca, violation_id, "".join(full_text))

    return StreamingResponse(stream_groq(), media_type="text/event-stream")


@router.get("/violations/{violation_id}/report")
def get_report(violation_id: str, db: Session = Depends(get_db)):
    v = db.query(Violation).filter(Violation.id == violation_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Violation not found")
    asset = db.query(Asset).filter(Asset.id == v.asset_id).first()
    asset_data = _asset_to_dict(asset) if asset else {}

    try:
        from services.pdf_generator import generate_violation_report
        vdata = _v_to_dict(v, full=True)
        pdf_bytes = generate_violation_report(vdata, asset_data)
        return StreamingResponse(
            iter([pdf_bytes]),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=violation-{violation_id}.pdf"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {e}")


def _build_violation_dict_for_ai(v, db) -> dict:
    """Build a rich dict for AI prompts."""
    if not v:
        return {"id": "UNKNOWN", "confidence": 0.9, "platform": "Unknown"}

    asset = db.query(Asset).filter(Asset.id == v.asset_id).first()
    d = _v_to_dict(v, full=True)
    if asset:
        d["asset_title"] = asset.title
        d["rights_holder"] = asset.rights_holder
        d["sha256"] = asset.sha256_hash
        d["uploaded_at"] = asset.uploaded_at.isoformat() if asset.uploaded_at else None
    return d


def _save_explanation(violation_id: str, text: str):
    from models.database import SessionLocal
    db = SessionLocal()
    try:
        v = db.query(Violation).filter(Violation.id == violation_id).first()
        if v:
            v.ai_explanation = text
            v.ai_explanation_preview = text[:120].split("\n")[0] if text else ""
            db.commit()
    except Exception as e:
        print(f"[Save explanation] {e}")
    finally:
        db.close()


def _save_dmca(violation_id: str, text: str):
    from models.database import SessionLocal
    db = SessionLocal()
    try:
        v = db.query(Violation).filter(Violation.id == violation_id).first()
        if v:
            v.dmca_letter = text
            v.status = "dmca_submitted"
            v.dmca_submitted_at = datetime.utcnow()
            db.commit()
    except Exception as e:
        print(f"[Save DMCA] {e}")
    finally:
        db.close()


def _v_to_dict(v: Violation, full: bool = False) -> dict:
    data = {
        "id": v.id,
        "asset_id": v.asset_id,
        "platform": v.platform,
        "confidence": v.confidence,
        "detected_at": v.detected_at.isoformat() if v.detected_at else None,
        "status": v.status,
        "infringing_url": v.infringing_url,
        "thumbnail_url": v.thumbnail_url,
        "watermark_found": v.watermark_found,
        "ai_explanation_preview": v.ai_explanation_preview,
    }
    if full:
        data.update({
            "phash_distance": v.phash_distance,
            "clip_similarity": v.clip_similarity,
            "frame_similarity": v.frame_similarity,
            "alterations_detected": v.alterations_detected or [],
            "ai_explanation": v.ai_explanation,
            "dmca_letter": v.dmca_letter,
            "dmca_submitted_at": v.dmca_submitted_at.isoformat() if v.dmca_submitted_at else None,
            "resolved_at": v.resolved_at.isoformat() if v.resolved_at else None,
            "spread_data": v.spread_data,
            "frame_matches": v.frame_matches,
            "is_demo": v.is_demo,
        })
    return data


def _asset_to_dict(a: Asset) -> dict:
    return {
        "id": a.id,
        "title": a.title,
        "type": a.type,
        "rights_holder": a.rights_holder,
        "sha256": a.sha256_hash,
        "watermark_id": a.watermark_id,
        "uploaded_at": a.uploaded_at.isoformat() if a.uploaded_at else None,
        "keyframe_count": a.keyframe_count,
        "fingerprint_strength": a.fingerprint_strength,
    }
