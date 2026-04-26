"""
SportShield FAISS Index
Stores and searches CLIP/histogram embeddings for fast similarity matching.
Persists index to disk between restarts.
"""
import os
import json
import pickle
import numpy as np
from typing import List, Dict, Tuple, Optional

try:
    import faiss
    _FAISS_AVAILABLE = True
except ImportError:
    _FAISS_AVAILABLE = False
    print("[FAISS] Not available — using numpy brute-force search")

FAISS_DIR = os.getenv("FAISS_INDEX_PATH", "faiss_index")
INDEX_FILE = os.path.join(FAISS_DIR, "sportshield.index")
META_FILE = os.path.join(FAISS_DIR, "metadata.pkl")

# In-memory store
_index = None  # faiss.IndexFlatIP or numpy array
_metadata: List[Dict] = []  # [{asset_id, frame_idx, timestamp, phash}]
_embeddings: List[np.ndarray] = []  # for numpy fallback


def _ensure_dir():
    os.makedirs(FAISS_DIR, exist_ok=True)


def _get_dim() -> int:
    from services.fingerprint import get_embedding_dim
    return get_embedding_dim()


def _init_index(dim: int):
    global _index
    if _FAISS_AVAILABLE:
        _index = faiss.IndexFlatIP(dim)  # Inner Product (cosine with normalized vecs)
    else:
        _index = None  # Will use numpy


def load_index():
    """Load persisted index from disk."""
    global _index, _metadata, _embeddings
    _ensure_dir()
    if os.path.exists(META_FILE):
        with open(META_FILE, "rb") as f:
            data = pickle.load(f)
            _metadata = data.get("metadata", [])
            _embeddings = data.get("embeddings", [])

    if _FAISS_AVAILABLE and os.path.exists(INDEX_FILE):
        try:
            _index = faiss.read_index(INDEX_FILE)
            print(f"[FAISS] Loaded index with {_index.ntotal} vectors")
            return
        except Exception as e:
            print(f"[FAISS] Failed to load: {e}")

    # Initialize fresh
    dim = _get_dim()
    _init_index(dim)

    # Re-add embeddings for numpy mode or rebuild faiss
    if _embeddings and _FAISS_AVAILABLE and _index is not None and _index.ntotal == 0:
        arr = np.array(_embeddings, dtype=np.float32)
        _index.add(arr)

    print(f"[FAISS] Index ready ({len(_metadata)} entries)")


def save_index():
    """Persist index to disk."""
    _ensure_dir()
    with open(META_FILE, "wb") as f:
        pickle.dump({"metadata": _metadata, "embeddings": _embeddings}, f)
    if _FAISS_AVAILABLE and _index is not None:
        faiss.write_index(_index, INDEX_FILE)


def add_embeddings(asset_id: str, embeddings: List[np.ndarray], keyframes: List[Dict]):
    """Add all embeddings for an asset to the index."""
    global _index
    if _index is None:
        load_index()
    if _index is None:
        _init_index(len(embeddings[0]))

    for i, (emb, kf) in enumerate(zip(embeddings, keyframes)):
        emb_f32 = np.array(emb, dtype=np.float32).reshape(1, -1)
        meta = {
            "asset_id": asset_id,
            "frame_idx": i,
            "timestamp": kf.get("timestamp", 0.0),
            "phash": kf.get("phash", ""),
        }
        _metadata.append(meta)
        _embeddings.append(emb_f32.flatten())
        if _FAISS_AVAILABLE and _index is not None:
            _index.add(emb_f32)

    save_index()


def search(query_embedding: np.ndarray, k: int = 10) -> List[Tuple[float, Dict]]:
    """
    Search for nearest neighbors.
    Returns list of (similarity_score, metadata) sorted by similarity desc.
    """
    global _index
    if _index is None:
        load_index()

    if not _metadata:
        return []

    q = np.array(query_embedding, dtype=np.float32).reshape(1, -1)

    if _FAISS_AVAILABLE and _index is not None and _index.ntotal > 0:
        k_actual = min(k, _index.ntotal)
        scores, indices = _index.search(q, k_actual)
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx >= 0 and idx < len(_metadata):
                results.append((float(score), _metadata[idx]))
        return results
    elif _embeddings:
        # Numpy brute force cosine similarity
        all_embs = np.array(_embeddings, dtype=np.float32)
        q_norm = q / (np.linalg.norm(q) + 1e-8)
        all_norm = all_embs / (np.linalg.norm(all_embs, axis=1, keepdims=True) + 1e-8)
        sims = (all_norm @ q_norm.T).flatten()
        top_k = min(k, len(sims))
        top_indices = np.argsort(sims)[::-1][:top_k]
        results = [(float(sims[i]), _metadata[i]) for i in top_indices]
        return results

    return []


def search_frames(query_embeddings: List[np.ndarray], k_per_frame: int = 5) -> Dict:
    """
    Search multiple query frames against the index.
    Returns best-matching asset with aggregated confidence.
    """
    if not query_embeddings:
        return {}

    asset_scores: Dict[str, List[float]] = {}
    frame_results = []

    for emb in query_embeddings:
        hits = search(emb, k=k_per_frame)
        for score, meta in hits:
            aid = meta["asset_id"]
            if aid not in asset_scores:
                asset_scores[aid] = []
            asset_scores[aid].append(score)
            frame_results.append({"score": score, "meta": meta})

    if not asset_scores:
        return {}

    # Aggregate: best asset is the one with highest mean top-k scores
    best_asset = max(asset_scores, key=lambda a: np.mean(sorted(asset_scores[a], reverse=True)[:5]))
    best_scores = asset_scores[best_asset]
    confidence = float(np.mean(sorted(best_scores, reverse=True)[:5]))

    # Clamp to [0,1]
    confidence = max(0.0, min(1.0, confidence))

    return {
        "asset_id": best_asset,
        "confidence": confidence,
        "frame_hit_count": len(best_scores),
        "all_asset_scores": {k: float(np.mean(v)) for k, v in asset_scores.items()},
    }


def remove_asset(asset_id: str):
    """Remove all embeddings for an asset (marks for rebuild)."""
    global _metadata, _embeddings
    indices_to_keep = [i for i, m in enumerate(_metadata) if m["asset_id"] != asset_id]
    _metadata = [_metadata[i] for i in indices_to_keep]
    _embeddings = [_embeddings[i] for i in indices_to_keep]

    # Rebuild FAISS index
    if _FAISS_AVAILABLE and _embeddings:
        dim = len(_embeddings[0])
        _init_index(dim)
        arr = np.array(_embeddings, dtype=np.float32)
        _index.add(arr)

    save_index()
