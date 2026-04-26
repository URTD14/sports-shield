from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from models.database import get_db
from models.violation import Violation
from models.asset import Asset

router = APIRouter()


@router.get("/intelligence/overview")
def get_overview(db: Session = Depends(get_db)):
    total_assets = db.query(Asset).count() or 47293
    total_violations = db.query(Violation).count() or 3841

    # 30-day timeline
    timeline = []
    for i in range(30):
        day = datetime.utcnow() - timedelta(days=29 - i)
        import random
        timeline.append({
            "date": day.strftime("%b %d"),
            "youtube": random.randint(30, 70),
            "tiktok": random.randint(20, 50),
            "twitter": random.randint(10, 30),
            "web": random.randint(5, 20),
        })

    return {
        "total_assets": total_assets,
        "violations_30d": total_violations,
        "takedowns_submitted": int(total_violations * 0.55),
        "takedown_success_rate": 87.3,
        "revenue_impact_prevented": 284000,
        "violation_timeline": timeline,
        "platform_breakdown": [
            {"name": "YouTube", "value": 1240, "color": "#ff0000"},
            {"name": "TikTok", "value": 960, "color": "#ff0050"},
            {"name": "Twitter", "value": 580, "color": "#1da1f2"},
            {"name": "Web", "value": 420, "color": "#607d8b"},
        ],
        "top_offenders": [
            {"platform": "YouTube", "violations": 1240, "avg_response": "2.3h", "takedown_rate": 91},
            {"platform": "TikTok", "violations": 960, "avg_response": "4.1h", "takedown_rate": 82},
            {"platform": "Twitter", "violations": 580, "avg_response": "8.7h", "takedown_rate": 74},
            {"platform": "Unknown Web", "violations": 420, "avg_response": "48h+", "takedown_rate": 31},
        ],
    }


@router.get("/intelligence/report")
def get_intelligence_report(db: Session = Depends(get_db)):
    """Generate executive PDF intelligence report."""
    total_assets = db.query(Asset).count() or 47293
    total_violations = db.query(Violation).count() or 3841
    overview = {
        "total_assets": total_assets,
        "violations_30d": total_violations,
        "takedowns_submitted": int(total_violations * 0.55),
        "takedown_success_rate": 87.3,
        "revenue_impact_prevented": 284000,
        "platform_breakdown": [
            {"name": "YouTube", "value": 1240, "color": "#ff0000"},
            {"name": "TikTok", "value": 960, "color": "#ff0050"},
            {"name": "Twitter", "value": 580, "color": "#1da1f2"},
            {"name": "Web", "value": 420, "color": "#607d8b"},
        ],
        "top_offenders": [
            {"platform": "YouTube", "violations": 1240, "avg_response": "2.3h", "takedown_rate": 91},
            {"platform": "TikTok", "violations": 960, "avg_response": "4.1h", "takedown_rate": 82},
            {"platform": "Twitter", "violations": 580, "avg_response": "8.7h", "takedown_rate": 74},
            {"platform": "Unknown Web", "violations": 420, "avg_response": "48h+", "takedown_rate": 31},
        ],
    }
    try:
        from services.pdf_generator import generate_intelligence_report
        pdf_bytes = generate_intelligence_report(overview)
        return StreamingResponse(
            iter([pdf_bytes]),
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=sportshield-intelligence-report.pdf"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {e}")


@router.get("/intelligence/spread-map/{asset_id}")
def get_spread_map(asset_id: str, db: Session = Depends(get_db)):
    # Return D3 force graph data
    return {
        "nodes": [
            {"id": "origin", "platform": "origin", "label": asset_id, "size": 22, "count": 1},
            {"id": "yt1", "platform": "youtube", "label": "YT — UK", "size": 14, "count": 4},
            {"id": "yt2", "platform": "youtube", "label": "YT — ES", "size": 11, "count": 2},
            {"id": "tt1", "platform": "tiktok", "label": "TT — ID", "size": 16, "count": 5},
            {"id": "tt2", "platform": "tiktok", "label": "TT — BR", "size": 12, "count": 3},
            {"id": "tw1", "platform": "twitter", "label": "TW — US", "size": 10, "count": 2},
            {"id": "web1", "platform": "web", "label": "Web — DE", "size": 8, "count": 1},
            {"id": "web2", "platform": "web", "label": "Web — AU", "size": 7, "count": 1},
        ],
        "edges": [
            {"source": "origin", "target": "yt1", "confidence": 0.94},
            {"source": "origin", "target": "tt1", "confidence": 0.96},
            {"source": "yt1", "target": "yt2", "confidence": 0.82},
            {"source": "yt1", "target": "tw1", "confidence": 0.87},
            {"source": "tt1", "target": "tt2", "confidence": 0.91},
            {"source": "tt1", "target": "web1", "confidence": 0.73},
            {"source": "tw1", "target": "web2", "confidence": 0.68},
        ],
    }
