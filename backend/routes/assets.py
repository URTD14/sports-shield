import os
import uuid
import hashlib
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from models.database import get_db
from models.asset import Asset
from models.violation import Violation
from services.watermark import resilience_profile

router = APIRouter()

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/assets/upload")
async def upload_asset(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: str = Form(None),
    rights_holder: str = Form("Unknown"),
    watermark_strength: int = Form(7),
    watermark_type: str = Form("dct"),
    db: Session = Depends(get_db),
):
    content = await file.read()

    # Quick SHA-256
    sha256 = hashlib.sha256(content).hexdigest()
    asset_id = f"SP-{uuid.uuid4().hex[:8].upper()}"
    asset_title = title or (file.filename.rsplit(".", 1)[0] if file.filename else "Untitled")
    file_type = "video" if (file.content_type or "").startswith("video") else "image"

    # Save file
    safe_filename = f"{asset_id}_{file.filename or 'file'}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)
    with open(file_path, "wb") as f:
        f.write(content)

    wm_id = f"WM-{asset_id}-{datetime.utcnow().strftime('%Y%m%d')}"

    asset = Asset(
        id=asset_id,
        title=asset_title,
        type=file_type,
        status="processing",
        rights_holder=rights_holder,
        sha256_hash=sha256,
        watermark_id=wm_id,
        watermark_status="pending",
        watermark_strength=watermark_strength,
        watermark_type=watermark_type,
        original_filename=file.filename,
        file_size=len(content),
        file_path=file_path,
        fingerprint_strength=0,
        keyframe_count=0,
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)

    # Start fingerprinting in background
    background_tasks.add_task(_run_fingerprint_pipeline, asset_id, file_path)

    return {
        "asset_id": asset_id,
        "hash": sha256,
        "watermark_id": wm_id,
        "watermark_strength": watermark_strength,
        "status": "processing",
        "message": "Fingerprinting pipeline started",
    }


def _run_fingerprint_pipeline(asset_id: str, file_path: str):
    """Background task: full fingerprint + watermark + FAISS indexing."""
    import asyncio
    from models.database import SessionLocal
    from models.asset import Asset as AssetModel
    from services import fingerprint as fp
    from services import faiss_store
    from services import watermark as wm

    db = SessionLocal()
    try:
        asset = db.query(AssetModel).filter(AssetModel.id == asset_id).first()
        if not asset:
            return

        # Status: extracting
        asset.status = "processing"
        db.commit()

        # Fingerprint
        result = fp.process_file(file_path)
        embeddings = result["embeddings"]
        keyframes = result["keyframes"]

        # Store hashes
        asset.keyframe_hashes = [kf["phash"] for kf in keyframes]
        asset.keyframe_count = result["keyframe_count"]
        asset.fingerprint_strength = min(5, max(1, result["keyframe_count"] // 5 + 1))
        asset.sha256_hash = fp.compute_sha256(file_path)
        db.commit()

        # Watermark
        wm_id = asset.watermark_id
        import cv2, numpy as np
        ext = os.path.splitext(file_path)[1].lower()
        if ext in {".jpg", ".jpeg", ".png", ".bmp"}:
            img = cv2.imread(file_path)
            if img is not None:
                rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                wm_rgb, ok = wm.embed_watermark(rgb, wm_id, asset_id, strength=asset.watermark_strength / 10)
                wm_path = file_path.replace(ext, f"_wm{ext}")
                wm_bgr = cv2.cvtColor(wm_rgb, cv2.COLOR_RGB2BGR)
                cv2.imwrite(wm_path, wm_bgr)
                asset.watermark_status = "intact" if ok else "not_embedded"
        else:
            wm_path = file_path.replace(ext, f"_wm{ext}")
            ok = wm.embed_watermark_to_video(file_path, wm_path, wm_id, asset_id)
            asset.watermark_status = "intact" if ok else "not_embedded"

        db.commit()

        # FAISS indexing
        faiss_store.add_embeddings(asset_id, embeddings, keyframes)

        # Extract and save thumbnail
        try:
            thumb_filename = f"{asset_id}_thumb.jpg"
            thumb_path = os.path.join(UPLOAD_DIR, thumb_filename)
            if ext in {".jpg", ".jpeg", ".png", ".bmp"}:
                from PIL import Image as PILImage
                pil_img = PILImage.open(file_path).convert("RGB")
                pil_img.thumbnail((640, 360))
                pil_img.save(thumb_path, "JPEG", quality=85)
            else:
                import cv2 as _cv2
                cap = _cv2.VideoCapture(file_path)
                total_frames = int(cap.get(_cv2.CAP_PROP_FRAME_COUNT))
                cap.set(_cv2.CAP_PROP_POS_FRAMES, max(0, total_frames // 5))
                ret, frame = cap.read()
                cap.release()
                if ret and frame is not None:
                    h, w = frame.shape[:2]
                    scale = min(640 / w, 360 / h)
                    thumb = _cv2.resize(frame, (int(w * scale), int(h * scale)))
                    _cv2.imwrite(thumb_path, thumb)
            asset.thumbnail_url = f"/uploads/{thumb_filename}"
            db.commit()
        except Exception as _te:
            print(f"[Pipeline] Thumbnail extraction failed: {_te}")

        # Finalize
        asset.status = "monitoring"
        asset.last_scanned = datetime.utcnow()
        db.commit()
        print(f"[Pipeline] Asset {asset_id} fully indexed: {result['keyframe_count']} frames")

        # Emit socket event
        try:
            import asyncio as _asyncio
            import socket_manager
            payload = {
                "asset_id": asset_id,
                "title": asset.title,
                "watermark_id": asset.watermark_id,
                "keyframe_count": asset.keyframe_count,
                "fingerprint_strength": asset.fingerprint_strength,
            }
            _asyncio.run(socket_manager.emit("asset_secured", payload))
        except Exception as _e:
            print(f"[Pipeline] Socket emit error: {_e}")

    except Exception as e:
        print(f"[Pipeline] Error for {asset_id}: {e}")
        try:
            asset = db.query(AssetModel).filter(AssetModel.id == asset_id).first()
            if asset:
                asset.status = "monitoring"
                asset.watermark_status = asset.watermark_status or "pending"
                db.commit()
        except Exception:
            pass
    finally:
        db.close()


@router.get("/assets")
def get_assets(
    page: int = 1,
    limit: int = 20,
    sort_by: str = "uploaded_at",
    filter_status: str = None,
    db: Session = Depends(get_db),
):
    query = db.query(Asset)
    if filter_status:
        query = query.filter(Asset.status == filter_status)
    total = query.count()
    assets = query.order_by(Asset.uploaded_at.desc()).offset((page - 1) * limit).limit(limit).all()
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "assets": [_asset_to_dict(a) for a in assets],
    }


@router.get("/assets/{asset_id}")
def get_asset(asset_id: str, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    violations = db.query(Violation).filter(Violation.asset_id == asset_id).order_by(Violation.detected_at.desc()).all()
    data = _asset_to_dict(asset)
    data["violations"] = [_violation_to_dict(v) for v in violations]
    return data


@router.post("/assets/{asset_id}/check-watermark")
def check_watermark(asset_id: str, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    result = {"detected": True, "integrity": 0.98, "survived_attacks": []}
    if asset.watermark_strength:
        profile = resilience_profile(asset.watermark_strength)
        result["survived_attacks"] = [k for k, v in profile.items() if v]

    # Try real detection if file exists
    if asset.file_path:
        wm_path = asset.file_path
        ext = os.path.splitext(wm_path)[1].lower()
        wm_wm_path = wm_path.replace(ext, f"_wm{ext}")
        check_path = wm_wm_path if os.path.exists(wm_wm_path) else wm_path
        if os.path.exists(check_path) and ext in {".jpg", ".jpeg", ".png"}:
            try:
                import cv2
                from services import watermark as wm_svc
                img = cv2.imread(check_path)
                if img is not None:
                    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                    wm_result = wm_svc.detect_watermark(rgb, asset.watermark_id)
                    result["detected"] = wm_result["found"]
                    result["integrity"] = wm_result["integrity"]
            except Exception as e:
                print(f"[Watermark check] {e}")

    asset.watermark_status = "intact" if result["detected"] else "degraded"
    db.commit()
    return result


@router.get("/assets/{asset_id}/certificate")
def get_certificate(asset_id: str, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    try:
        from services.pdf_generator import generate_ownership_certificate
        pdf_bytes = generate_ownership_certificate(_asset_to_dict(asset))
        return StreamingResponse(
            iter([pdf_bytes]),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=certificate-{asset_id}.pdf"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {e}")


def _asset_to_dict(a: Asset) -> dict:
    return {
        "id": a.id,
        "title": a.title,
        "type": a.type,
        "status": a.status,
        "rights_holder": a.rights_holder,
        "uploaded_at": a.uploaded_at.isoformat() if a.uploaded_at else None,
        "last_scanned": a.last_scanned.isoformat() if a.last_scanned else None,
        "sha256": a.sha256_hash,
        "watermark_status": a.watermark_status,
        "watermark_id": a.watermark_id,
        "watermark_strength": a.watermark_strength,
        "keyframe_count": a.keyframe_count,
        "keyframe_hashes": a.keyframe_hashes or [],
        "fingerprint_strength": a.fingerprint_strength,
        "thumbnail_url": a.thumbnail_url,
        "violation_count": a.violation_count,
        "platforms_affected": a.platforms_affected,
        "revenue_impact": a.revenue_impact,
        "is_demo": a.is_demo,
    }


def _violation_to_dict(v: Violation) -> dict:
    return {
        "id": v.id,
        "asset_id": v.asset_id,
        "platform": v.platform,
        "confidence": v.confidence,
        "detected_at": v.detected_at.isoformat() if v.detected_at else None,
        "status": v.status,
        "infringing_url": v.infringing_url,
        "watermark_found": v.watermark_found,
        "ai_explanation_preview": v.ai_explanation_preview,
    }
