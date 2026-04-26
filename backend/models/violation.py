from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, Boolean, ForeignKey, JSON
from models.database import Base


class Violation(Base):
    __tablename__ = "violations"

    id = Column(String, primary_key=True, index=True)
    asset_id = Column(String, ForeignKey("assets.id"), nullable=False, index=True)

    # Detection
    platform = Column(String, nullable=False)  # youtube | twitter | tiktok | web
    infringing_url = Column(String, nullable=True)
    thumbnail_url = Column(String, nullable=True)
    detected_at = Column(DateTime, default=datetime.utcnow)

    # Match scores
    confidence = Column(Float, nullable=False)  # 0.0 - 1.0
    phash_distance = Column(Integer, nullable=True)  # bits different (lower = closer)
    clip_similarity = Column(Float, nullable=True)
    frame_similarity = Column(Float, nullable=True)
    audio_match = Column(Float, nullable=True)
    watermark_found = Column(Boolean, default=False)

    # Frame-level matches (JSON array)
    frame_matches = Column(JSON, nullable=True)

    # Alterations detected (JSON array of strings)
    alterations_detected = Column(JSON, nullable=True)

    # AI analysis
    ai_explanation = Column(Text, nullable=True)
    ai_explanation_preview = Column(String, nullable=True)

    # Legal
    status = Column(String, default="pending")  # pending | dmca_submitted | resolved | dismissed
    dmca_letter = Column(Text, nullable=True)
    dmca_submitted_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)

    # Spread map data (JSON)
    spread_data = Column(JSON, nullable=True)

    # Geographic data
    geographic_data = Column(JSON, nullable=True)

    # Demo flag
    is_demo = Column(Boolean, default=False)
