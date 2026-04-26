"""
SportShield Fingerprint Pipeline
Phase 2: Frame extraction → pHash → CLIP embeddings → FAISS indexing
"""
import os
import io
import hashlib
import tempfile
import numpy as np
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from PIL import Image

import imagehash
import cv2

# ── CLIP optional import ──────────────────────────────────────────────────────
try:
    import torch
    import clip as openai_clip
    _CLIP_MODEL = None
    _CLIP_PREPROCESS = None
    _CLIP_AVAILABLE = True
except ImportError:
    _CLIP_AVAILABLE = False
    _CLIP_MODEL = None

FRAME_RATE = 1  # frames per second to extract
CLIP_DIM = 512  # CLIP ViT-B/32 output dimension


def _load_clip():
    global _CLIP_MODEL, _CLIP_PREPROCESS
    if not _CLIP_AVAILABLE or _CLIP_MODEL is not None:
        return _CLIP_MODEL is not None
    try:
        device = "cuda" if torch.cuda.is_available() else "cpu"
        _CLIP_MODEL, _CLIP_PREPROCESS = openai_clip.load("ViT-B/32", device=device)
        print("[Fingerprint] CLIP model loaded")
        return True
    except Exception as e:
        print(f"[Fingerprint] CLIP load failed: {e} — using pHash-only mode")
        return False


def extract_frames_from_video(file_path: str, fps: int = FRAME_RATE) -> List[Tuple[float, np.ndarray]]:
    """Extract frames from a video file. Returns list of (timestamp_seconds, frame_array)."""
    frames = []
    cap = cv2.VideoCapture(file_path)
    if not cap.isOpened():
        return frames

    video_fps = cap.get(cv2.CAP_PROP_FPS) or 30
    frame_interval = max(1, int(video_fps / fps))
    frame_num = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        if frame_num % frame_interval == 0:
            timestamp = frame_num / video_fps
            # Convert BGR to RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            frames.append((timestamp, rgb_frame))
        frame_num += 1

    cap.release()
    return frames


def compute_phash(image: np.ndarray) -> str:
    """Compute perceptual hash (pHash) of an image."""
    pil_img = Image.fromarray(image) if isinstance(image, np.ndarray) else image
    return str(imagehash.phash(pil_img))


def compute_dhash(image: np.ndarray) -> str:
    """Compute difference hash (dHash) of an image."""
    pil_img = Image.fromarray(image) if isinstance(image, np.ndarray) else image
    return str(imagehash.dhash(pil_img))


def phash_distance(hash1: str, hash2: str) -> int:
    """Compute hamming distance between two pHash strings. Lower = more similar."""
    try:
        h1 = imagehash.hex_to_hash(hash1)
        h2 = imagehash.hex_to_hash(hash2)
        return h1 - h2
    except Exception:
        return 64  # max distance on error


def compute_clip_embedding(image: np.ndarray) -> Optional[np.ndarray]:
    """Compute CLIP embedding for an image. Returns None if CLIP unavailable."""
    if not _load_clip():
        return None
    try:
        import torch
        pil_img = Image.fromarray(image) if isinstance(image, np.ndarray) else image
        device = "cuda" if torch.cuda.is_available() else "cpu"
        processed = _CLIP_PREPROCESS(pil_img).unsqueeze(0).to(device)
        with torch.no_grad():
            embedding = _CLIP_MODEL.encode_image(processed)
        emb = embedding.cpu().numpy().flatten().astype(np.float32)
        # L2 normalize
        norm = np.linalg.norm(emb)
        return emb / norm if norm > 0 else emb
    except Exception as e:
        print(f"[Fingerprint] CLIP embedding failed: {e}")
        return None


def image_to_color_histogram(image: np.ndarray, bins: int = 16) -> np.ndarray:
    """Fallback: color histogram as embedding when CLIP unavailable."""
    img = cv2.resize(image, (224, 224))
    hist_r = np.histogram(img[:, :, 0], bins=bins, range=(0, 256))[0]
    hist_g = np.histogram(img[:, :, 1], bins=bins, range=(0, 256))[0]
    hist_b = np.histogram(img[:, :, 2], bins=bins, range=(0, 256))[0]
    hist = np.concatenate([hist_r, hist_g, hist_b]).astype(np.float32)
    norm = np.linalg.norm(hist)
    return hist / norm if norm > 0 else hist


def get_embedding_dim() -> int:
    """Return dimension used for FAISS index."""
    if _CLIP_AVAILABLE:
        return CLIP_DIM
    return 16 * 3  # color histogram dim


def process_image_file(file_path: str) -> Dict:
    """Full fingerprinting pipeline for an image."""
    img = cv2.imread(file_path)
    if img is None:
        raise ValueError(f"Cannot read image: {file_path}")
    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    phash = compute_phash(rgb)
    dhash = compute_dhash(rgb)
    embedding = compute_clip_embedding(rgb) or image_to_color_histogram(rgb)

    return {
        "type": "image",
        "keyframes": [{"timestamp": 0.0, "phash": phash, "dhash": dhash}],
        "embeddings": [embedding],
        "keyframe_count": 1,
    }


def process_video_file(file_path: str) -> Dict:
    """Full fingerprinting pipeline for a video."""
    frames = extract_frames_from_video(file_path)
    if not frames:
        raise ValueError(f"No frames extracted from: {file_path}")

    keyframes = []
    embeddings = []

    for timestamp, frame in frames:
        phash = compute_phash(frame)
        dhash = compute_dhash(frame)
        embedding = compute_clip_embedding(frame) or image_to_color_histogram(frame)
        keyframes.append({"timestamp": timestamp, "phash": phash, "dhash": dhash})
        embeddings.append(embedding)

    return {
        "type": "video",
        "keyframes": keyframes,
        "embeddings": embeddings,
        "keyframe_count": len(keyframes),
    }


def process_file(file_path: str) -> Dict:
    """Auto-detect and process file."""
    ext = Path(file_path).suffix.lower()
    video_exts = {".mp4", ".mov", ".avi", ".mkv", ".webm", ".flv"}
    if ext in video_exts:
        return process_video_file(file_path)
    return process_image_file(file_path)


def compute_sha256(file_path: str) -> str:
    """Compute SHA-256 hash of a file."""
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            sha256.update(chunk)
    return sha256.hexdigest()
