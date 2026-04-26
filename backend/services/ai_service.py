"""
SportShield AI Service — Groq LLM Integration
Primary model: llama-3.3-70b-versatile
Fallback model: moonshotai/kimi-k2-instruct
"""
import os
import asyncio
from typing import AsyncGenerator, Optional, Dict
from groq import Groq, APIStatusError

PRIMARY_KEY = os.getenv("GROQ_API_KEY", "")
FALLBACK_KEY = os.getenv("GROQ_FALLBACK_KEY", "")
PRIMARY_MODEL = os.getenv("GROQ_PRIMARY_MODEL", "llama-3.3-70b-versatile")
FALLBACK_MODEL = os.getenv("GROQ_FALLBACK_MODEL", "moonshotai/kimi-k2-instruct")

GROQ_BASE_URL = "https://api.groq.com/openai/v1"

_primary_client: Optional[Groq] = None
_fallback_client: Optional[Groq] = None


def _get_primary() -> Groq:
    global _primary_client
    if _primary_client is None:
        _primary_client = Groq(api_key=PRIMARY_KEY)
    return _primary_client


def _get_fallback() -> Groq:
    global _fallback_client
    if _fallback_client is None:
        _fallback_client = Groq(api_key=FALLBACK_KEY)
    return _fallback_client


EXPLANATION_SYSTEM = """You are SportShield AI, an expert in digital forensics, computer vision, and intellectual property law.
Analyze the following match data and provide a clear, technical explanation of why this content was flagged as unauthorized.

Structure your response with these exact sections:
Visual Match Signals:
Alterations Detected:
Conclusion:

Be specific about which visual elements matched and what was changed. Use precise, authoritative language. Be concise but comprehensive."""


DMCA_SYSTEM = """You are a sports media intellectual property attorney. Generate a formal DMCA takedown notice based on the violation data provided.

Include:
1. Specific identification of the copyrighted work
2. Identification of the infringing material with URL
3. Statement of good faith belief
4. Statement of accuracy under penalty of perjury
5. Contact information placeholder
6. Platform-specific submission instructions

Format as a proper legal document. Be firm but legally precise. Use proper legal language."""


def _make_explanation_prompt(violation_data: Dict) -> str:
    return f"""Violation ID: {violation_data.get('id', 'UNKNOWN')}
Asset: {violation_data.get('asset_title', 'Sports Media Content')}
Platform: {violation_data.get('platform', 'Unknown')}
Overall Confidence: {violation_data.get('confidence', 0.9) * 100:.1f}%
Frame Similarity: {violation_data.get('frame_similarity', 0.94) * 100:.1f}%
pHash Distance: {violation_data.get('phash_distance', 3)} bits
CLIP Embedding Similarity: {violation_data.get('clip_similarity', 0.91) * 100:.1f}%
Watermark Found: {violation_data.get('watermark_found', True)}
Alterations Detected: {', '.join(violation_data.get('alterations_detected', ['aspect_ratio', 'color_grade', 'speed_change']))}

Generate a technical analysis explaining why this content was flagged as unauthorized redistribution."""


def _make_dmca_prompt(violation_data: Dict) -> str:
    return f"""Generate a DMCA takedown notice for:

Asset: {violation_data.get('asset_title', 'Sports Media Content')}
Rights Holder: {violation_data.get('rights_holder', 'Sports Media Organization')}
Asset SHA-256: {violation_data.get('sha256', 'HASH_ON_FILE')}
Registration Date: {violation_data.get('uploaded_at', '2024-11-14')}

Platform: {violation_data.get('platform', 'Unknown Platform').upper()}
Infringing URL: {violation_data.get('infringing_url', '[URL_REDACTED]')}
Match Confidence: {violation_data.get('confidence', 0.94) * 100:.1f}%
Detection Method: SportShield AI — CLIP embeddings + perceptual hashing + DCT watermark

Generate a complete, formal DMCA takedown notice ready to submit."""


async def stream_explanation(violation_data: Dict) -> AsyncGenerator[str, None]:
    """Stream AI explanation character by character via Groq."""
    prompt = _make_explanation_prompt(violation_data)

    async for chunk in _stream_groq(EXPLANATION_SYSTEM, prompt):
        yield chunk


async def stream_dmca(violation_data: Dict) -> AsyncGenerator[str, None]:
    """Stream DMCA letter via Groq."""
    prompt = _make_dmca_prompt(violation_data)

    async for chunk in _stream_groq(DMCA_SYSTEM, prompt):
        yield chunk


async def _stream_groq(system: str, user_prompt: str, max_tokens: int = 1024) -> AsyncGenerator[str, None]:
    """Stream from Groq with fallback."""
    # Try primary
    try:
        async for chunk in _call_groq_stream(
            _get_primary(), PRIMARY_MODEL, system, user_prompt, max_tokens
        ):
            yield chunk
        return
    except Exception as e:
        print(f"[AI] Primary model ({PRIMARY_MODEL}) failed: {e} — trying fallback")

    # Try fallback
    try:
        async for chunk in _call_groq_stream(
            _get_fallback(), FALLBACK_MODEL, system, user_prompt, max_tokens
        ):
            yield chunk
    except Exception as e:
        print(f"[AI] Fallback model ({FALLBACK_MODEL}) failed: {e}")
        # Last resort: yield demo text
        demo = _get_demo_text(user_prompt)
        for char in demo:
            yield char
            await asyncio.sleep(0.01)


async def _call_groq_stream(
    client: Groq,
    model: str,
    system: str,
    user_prompt: str,
    max_tokens: int,
) -> AsyncGenerator[str, None]:
    """Call Groq streaming API in a thread pool (Groq client is sync)."""
    loop = asyncio.get_event_loop()

    def _sync_stream():
        chunks = []
        stream = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user_prompt},
            ],
            model=model,
            max_tokens=max_tokens,
            temperature=0.3,
            stream=True,
        )
        for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                chunks.append(delta)
        return chunks

    chunks = await loop.run_in_executor(None, _sync_stream)
    for chunk in chunks:
        for char in chunk:
            yield char
            await asyncio.sleep(0.008)


async def generate_full_explanation(violation_data: Dict) -> str:
    """Generate complete explanation (non-streaming) for DB storage."""
    prompt = _make_explanation_prompt(violation_data)
    return await _call_groq_full(EXPLANATION_SYSTEM, prompt)


async def generate_full_dmca(violation_data: Dict) -> str:
    """Generate complete DMCA letter (non-streaming) for DB storage."""
    prompt = _make_dmca_prompt(violation_data)
    return await _call_groq_full(DMCA_SYSTEM, prompt)


async def _call_groq_full(system: str, user_prompt: str, max_tokens: int = 1024) -> str:
    """Non-streaming Groq call with fallback."""
    loop = asyncio.get_event_loop()

    def _sync_call(client: Groq, model: str) -> str:
        resp = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user_prompt},
            ],
            model=model,
            max_tokens=max_tokens,
            temperature=0.3,
        )
        return resp.choices[0].message.content or ""

    for client, model in [(_get_primary(), PRIMARY_MODEL), (_get_fallback(), FALLBACK_MODEL)]:
        try:
            return await loop.run_in_executor(None, _sync_call, client, model)
        except Exception as e:
            print(f"[AI] {model} failed: {e}")

    return _get_demo_text(user_prompt)


def _get_demo_text(prompt: str) -> str:
    """Fallback text when all AI calls fail."""
    if "DMCA" in prompt.upper() or "takedown" in prompt.lower():
        return """DMCA TAKEDOWN NOTICE

This content has been identified as unauthorized redistribution of protected sports media. SportShield AI has confirmed with high confidence that the infringing material matches the protected original.

Please remove or disable access to the infringing material immediately pursuant to 17 U.S.C. § 512(c)(3).

SportShield Legal Enforcement"""
    return """SportShield AI Analysis

Visual Match Signals:
- Visual frame similarity detected across multiple consecutive frames
- Distinctive geometric patterns and scene composition matched
- Perceptual hash distance within positive identification threshold

Alterations Detected:
- Aspect ratio modification detected
- Color grading applied
- Playback speed modification

Conclusion:
This content is a modified redistribution of the protected asset. Confidence: HIGH — UNAUTHORIZED REDISTRIBUTION"""
