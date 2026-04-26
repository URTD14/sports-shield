from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, Boolean, JSON
from models.database import Base


class Asset(Base):
    __tablename__ = "assets"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    type = Column(String, nullable=False)  # video | image
    status = Column(String, default="processing")  # processing | monitoring | threat_detected | clear
    rights_holder = Column(String, default="Unknown")
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    last_scanned = Column(DateTime, nullable=True)

    # Fingerprinting
    sha256_hash = Column(String, nullable=True)
    watermark_id = Column(String, nullable=True)
    watermark_status = Column(String, default="pending")  # pending | intact | degraded | not_detected
    watermark_strength = Column(Integer, default=7)
    watermark_type = Column(String, default="dct")
    keyframe_count = Column(Integer, default=0)
    fingerprint_strength = Column(Integer, default=0)  # 1-5

    # File info
    original_filename = Column(String, nullable=True)
    file_size = Column(Integer, nullable=True)
    file_path = Column(String, nullable=True)
    thumbnail_url = Column(String, nullable=True)

    # Statistics (denormalized for performance)
    violation_count = Column(Integer, default=0)
    platforms_affected = Column(Integer, default=0)
    revenue_impact = Column(Float, default=0.0)

    # FAISS index data (stored as JSON blob for simplicity)
    faiss_index_id = Column(String, nullable=True)

    # Keyframe hashes (JSON array)
    keyframe_hashes = Column(JSON, nullable=True)

    # Demo flag
    is_demo = Column(Boolean, default=False)
