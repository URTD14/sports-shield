"""
SportShield PDF Generator
Generates ownership certificates and violation reports using ReportLab.
"""
import io
import os
import qrcode
from datetime import datetime
from typing import Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.platypus import Image as RLImage
from reportlab.graphics.shapes import Drawing, Rect, String as RLString
from reportlab.graphics import renderPDF

# SportShield color palette
SS_BLACK = colors.HexColor("#000308")
SS_DARK = colors.HexColor("#050a12")
SS_ELEVATED = colors.HexColor("#0a1020")
SS_GREEN = colors.HexColor("#00ff41")
SS_RED = colors.HexColor("#ff1744")
SS_BLUE = colors.HexColor("#00b8d4")
SS_GEMINI = colors.HexColor("#8ab4f8")
SS_GREY = colors.HexColor("#607d8b")
SS_WHITE = colors.HexColor("#e8f4fd")


def _make_qr(url: str, size: int = 80) -> RLImage:
    """Generate QR code image."""
    qr = qrcode.QRCode(version=1, box_size=4, border=2)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return RLImage(buf, width=size, height=size)


def _header_para(text: str, color=SS_GREEN, size: int = 20) -> Paragraph:
    style = ParagraphStyle(
        "header",
        fontName="Helvetica-Bold",
        fontSize=size,
        textColor=color,
        spaceAfter=4,
        leading=size + 4,
    )
    return Paragraph(text, style)


def _body_para(text: str, color=SS_WHITE, size: int = 9) -> Paragraph:
    style = ParagraphStyle(
        "body",
        fontName="Courier",
        fontSize=size,
        textColor=color,
        spaceAfter=2,
        leading=size + 3,
    )
    return Paragraph(text, style)


def _label_para(text: str) -> Paragraph:
    style = ParagraphStyle(
        "label",
        fontName="Helvetica-Bold",
        fontSize=7,
        textColor=SS_GREY,
        spaceAfter=1,
        leading=10,
    )
    return Paragraph(text.upper(), style)


def generate_ownership_certificate(asset_data: dict) -> bytes:
    """Generate PDF ownership certificate for an asset."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=20*mm,
        rightMargin=20*mm,
        topMargin=20*mm,
        bottomMargin=20*mm,
    )

    story = []
    W = A4[0] - 40*mm

    # ── Title ──────────────────────────────────────────────────────────────────
    story.append(_header_para("SPORTSHIELD", SS_GREEN, 28))
    story.append(_body_para("AI-POWERED CONTENT PROTECTION PLATFORM", SS_BLUE, 10))
    story.append(Spacer(1, 6*mm))
    story.append(HRFlowable(width=W, color=SS_GREEN, thickness=1))
    story.append(Spacer(1, 4*mm))
    story.append(_header_para("CERTIFICATE OF DIGITAL OWNERSHIP", SS_WHITE, 16))
    story.append(Spacer(1, 8*mm))

    # ── Asset Info ─────────────────────────────────────────────────────────────
    story.append(_label_para("PROTECTED ASSET"))
    story.append(_header_para(asset_data.get("title", "Unknown Asset"), SS_WHITE, 14))
    story.append(Spacer(1, 4*mm))

    # Metadata table
    meta = [
        ["ASSET ID", asset_data.get("id", "N/A"), "TYPE", asset_data.get("type", "N/A").upper()],
        ["RIGHTS HOLDER", asset_data.get("rights_holder", "Unknown"), "STATUS", "REGISTERED & PROTECTED"],
        ["REGISTRATION DATE", _fmt_date(asset_data.get("uploaded_at")), "KEYFRAMES", str(asset_data.get("keyframe_count", 0))],
        ["WATERMARK ID", asset_data.get("watermark_id", "N/A"), "STRENGTH", f"{asset_data.get('fingerprint_strength', 0)}/5"],
    ]
    t = Table(meta, colWidths=[35*mm, 70*mm, 35*mm, 30*mm])
    t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Courier"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("TEXTCOLOR", (0, 0), (0, -1), SS_GREY),
        ("TEXTCOLOR", (2, 0), (2, -1), SS_GREY),
        ("TEXTCOLOR", (1, 0), (1, -1), SS_WHITE),
        ("TEXTCOLOR", (3, 0), (3, -1), SS_GREEN),
        ("GRID", (0, 0), (-1, -1), 0.25, SS_ELEVATED),
        ("BACKGROUND", (0, 0), (-1, -1), SS_DARK),
        ("PADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(t)
    story.append(Spacer(1, 6*mm))

    # ── SHA-256 fingerprint ────────────────────────────────────────────────────
    story.append(HRFlowable(width=W, color=SS_BLUE, thickness=0.5))
    story.append(Spacer(1, 3*mm))
    story.append(_label_para("SHA-256 CRYPTOGRAPHIC FINGERPRINT"))
    sha256 = asset_data.get("sha256", "N/A")
    story.append(_body_para(sha256 or "NOT AVAILABLE", SS_GREEN, 9))
    story.append(Spacer(1, 4*mm))

    # ── Verification statement ─────────────────────────────────────────────────
    story.append(HRFlowable(width=W, color=SS_ELEVATED, thickness=0.5))
    story.append(Spacer(1, 3*mm))
    story.append(_body_para(
        "This certificate serves as cryptographic proof of original ownership for the above-described "
        "digital asset. The SHA-256 fingerprint, invisible DCT watermark, and FAISS vector index were "
        "generated and registered by SportShield at the time of first upload. This record is immutable "
        "and may be used as evidence of prior ownership in DMCA proceedings.",
        SS_GREY, 8
    ))
    story.append(Spacer(1, 6*mm))

    # ── QR code ───────────────────────────────────────────────────────────────
    asset_id = asset_data.get("id", "unknown")
    qr_url = f"https://sportshield.app/verify/{asset_id}"
    try:
        qr = _make_qr(qr_url, 60)
        qr_table = Table([[qr, _body_para(f"Scan to verify:\n{qr_url}", SS_BLUE, 8)]], colWidths=[25*mm, W-25*mm])
        qr_table.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE")]))
        story.append(qr_table)
    except Exception:
        pass

    story.append(Spacer(1, 6*mm))
    story.append(HRFlowable(width=W, color=SS_GREEN, thickness=1))
    story.append(Spacer(1, 2*mm))
    story.append(_body_para(f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')} | SportShield v1.0", SS_GREY, 7))

    doc.build(story, onFirstPage=_dark_bg, onLaterPages=_dark_bg)
    buf.seek(0)
    return buf.read()


def generate_violation_report(violation_data: dict, asset_data: dict) -> bytes:
    """Generate PDF violation report with DMCA letter."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=20*mm,
        rightMargin=20*mm,
        topMargin=20*mm,
        bottomMargin=20*mm,
    )
    story = []
    W = A4[0] - 40*mm

    story.append(_header_para("SPORTSHIELD", SS_GREEN, 22))
    story.append(_body_para("VIOLATION INTELLIGENCE REPORT", SS_RED, 10))
    story.append(Spacer(1, 4*mm))
    story.append(HRFlowable(width=W, color=SS_RED, thickness=1))
    story.append(Spacer(1, 4*mm))

    # Violation header
    conf = violation_data.get("confidence", 0.0)
    conf_pct = f"{conf * 100:.1f}%"
    story.append(_header_para(f"VIOLATION #{violation_data.get('id', 'UNKNOWN')} — {conf_pct} MATCH CONFIDENCE", SS_RED, 13))
    story.append(Spacer(1, 4*mm))

    # Match details table
    meta = [
        ["ASSET", asset_data.get("title", "Unknown"), "PLATFORM", violation_data.get("platform", "Unknown").upper()],
        ["DETECTED", _fmt_date(violation_data.get("detected_at")), "CONFIDENCE", conf_pct],
        ["WATERMARK", "FOUND" if violation_data.get("watermark_found") else "NOT FOUND", "STATUS", violation_data.get("status", "pending").upper().replace("_", " ")],
    ]
    t = Table(meta, colWidths=[30*mm, 75*mm, 30*mm, 35*mm])
    t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Courier"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("TEXTCOLOR", (0, 0), (0, -1), SS_GREY),
        ("TEXTCOLOR", (2, 0), (2, -1), SS_GREY),
        ("TEXTCOLOR", (1, 0), (1, -1), SS_WHITE),
        ("TEXTCOLOR", (3, 0), (3, -1), SS_RED),
        ("GRID", (0, 0), (-1, -1), 0.25, SS_ELEVATED),
        ("BACKGROUND", (0, 0), (-1, -1), SS_DARK),
        ("PADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(t)
    story.append(Spacer(1, 5*mm))

    # AI Explanation
    if violation_data.get("ai_explanation"):
        story.append(_label_para("AI FORENSIC ANALYSIS"))
        story.append(Spacer(1, 1*mm))
        story.append(_body_para(violation_data["ai_explanation"], SS_WHITE, 8))
        story.append(Spacer(1, 5*mm))

    # DMCA Letter
    if violation_data.get("dmca_letter"):
        story.append(HRFlowable(width=W, color=SS_BLUE, thickness=0.5))
        story.append(Spacer(1, 3*mm))
        story.append(_label_para("DMCA TAKEDOWN NOTICE"))
        story.append(Spacer(1, 1*mm))
        story.append(_body_para(violation_data["dmca_letter"], SS_WHITE, 8))

    story.append(Spacer(1, 6*mm))
    story.append(HRFlowable(width=W, color=SS_GREEN, thickness=1))
    story.append(_body_para(f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')} | SportShield v1.0", SS_GREY, 7))

    doc.build(story, onFirstPage=_dark_bg, onLaterPages=_dark_bg)
    buf.seek(0)
    return buf.read()


def _dark_bg(canvas, doc):
    """Add dark background to every page."""
    canvas.saveState()
    canvas.setFillColor(SS_BLACK)
    canvas.rect(0, 0, A4[0], A4[1], fill=1, stroke=0)
    canvas.restoreState()


def generate_intelligence_report(overview: dict) -> bytes:
    """Generate executive intelligence PDF report."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=20*mm,
        rightMargin=20*mm,
        topMargin=20*mm,
        bottomMargin=20*mm,
    )
    story = []
    W = A4[0] - 40*mm

    story.append(_header_para("SPORTSHIELD", SS_GREEN, 28))
    story.append(_body_para("AI-POWERED CONTENT PROTECTION PLATFORM", SS_BLUE, 10))
    story.append(Spacer(1, 4*mm))
    story.append(HRFlowable(width=W, color=SS_GREEN, thickness=1))
    story.append(Spacer(1, 4*mm))
    story.append(_header_para("EXECUTIVE INTELLIGENCE REPORT", SS_WHITE, 16))
    story.append(_body_para(f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}", SS_GREY, 8))
    story.append(Spacer(1, 8*mm))

    # Key metrics
    story.append(_label_para("PLATFORM SUMMARY"))
    story.append(Spacer(1, 2*mm))
    metrics = [
        ["TOTAL ASSETS PROTECTED", str(overview.get("total_assets", "N/A"))],
        ["VIOLATIONS (30 DAYS)", str(overview.get("violations_30d", "N/A"))],
        ["TAKEDOWNS SUBMITTED", str(overview.get("takedowns_submitted", "N/A"))],
        ["TAKEDOWN SUCCESS RATE", f"{overview.get('takedown_success_rate', 0):.1f}%"],
        ["REVENUE IMPACT PREVENTED", f"${overview.get('revenue_impact_prevented', 0):,}"],
    ]
    t = Table(metrics, colWidths=[90*mm, 80*mm])
    t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Courier"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TEXTCOLOR", (0, 0), (0, -1), SS_GREY),
        ("TEXTCOLOR", (1, 0), (1, -1), SS_GREEN),
        ("FONTNAME", (1, 0), (1, -1), "Courier-Bold"),
        ("FONTSIZE", (1, 0), (1, -1), 11),
        ("GRID", (0, 0), (-1, -1), 0.25, SS_ELEVATED),
        ("BACKGROUND", (0, 0), (-1, -1), SS_DARK),
        ("PADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(t)
    story.append(Spacer(1, 6*mm))

    # Platform breakdown
    pb = overview.get("platform_breakdown", [])
    if pb:
        story.append(HRFlowable(width=W, color=SS_BLUE, thickness=0.5))
        story.append(Spacer(1, 3*mm))
        story.append(_label_para("PLATFORM DISTRIBUTION"))
        story.append(Spacer(1, 2*mm))
        pb_data = [["PLATFORM", "VIOLATIONS", "SHARE"]]
        total_v = sum(p.get("value", 0) for p in pb) or 1
        for p in pb:
            pct = f"{p.get('value', 0) / total_v * 100:.1f}%"
            pb_data.append([p.get("name", ""), str(p.get("value", 0)), pct])
        t2 = Table(pb_data, colWidths=[70*mm, 60*mm, 40*mm])
        t2.setStyle(TableStyle([
            ("FONTNAME", (0, 0), (-1, -1), "Courier"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("TEXTCOLOR", (0, 0), (-1, 0), SS_GREY),
            ("FONTSIZE", (0, 0), (-1, 0), 7),
            ("TEXTCOLOR", (0, 1), (0, -1), SS_WHITE),
            ("TEXTCOLOR", (1, 1), (1, -1), SS_RED),
            ("TEXTCOLOR", (2, 1), (2, -1), SS_BLUE),
            ("FONTNAME", (1, 1), (1, -1), "Courier-Bold"),
            ("GRID", (0, 0), (-1, -1), 0.25, SS_ELEVATED),
            ("BACKGROUND", (0, 0), (-1, -1), SS_DARK),
            ("BACKGROUND", (0, 0), (-1, 0), SS_ELEVATED),
            ("PADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(t2)
        story.append(Spacer(1, 6*mm))

    # Top offenders
    offenders = overview.get("top_offenders", [])
    if offenders:
        story.append(HRFlowable(width=W, color=SS_BLUE, thickness=0.5))
        story.append(Spacer(1, 3*mm))
        story.append(_label_para("REPEAT OFFENDER PLATFORMS"))
        story.append(Spacer(1, 2*mm))
        off_data = [["PLATFORM", "VIOLATIONS", "AVG RESPONSE", "TAKEDOWN RATE"]]
        for o in offenders:
            off_data.append([
                o.get("platform", ""),
                str(o.get("violations", 0)),
                o.get("avg_response", "N/A"),
                f"{o.get('takedown_rate', 0)}%",
            ])
        t3 = Table(off_data, colWidths=[55*mm, 40*mm, 40*mm, 35*mm])
        t3.setStyle(TableStyle([
            ("FONTNAME", (0, 0), (-1, -1), "Courier"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("TEXTCOLOR", (0, 0), (-1, 0), SS_GREY),
            ("FONTSIZE", (0, 0), (-1, 0), 7),
            ("TEXTCOLOR", (0, 1), (0, -1), SS_WHITE),
            ("TEXTCOLOR", (1, 1), (1, -1), SS_RED),
            ("FONTNAME", (1, 1), (1, -1), "Courier-Bold"),
            ("TEXTCOLOR", (3, 1), (3, -1), SS_GREEN),
            ("GRID", (0, 0), (-1, -1), 0.25, SS_ELEVATED),
            ("BACKGROUND", (0, 0), (-1, -1), SS_DARK),
            ("BACKGROUND", (0, 0), (-1, 0), SS_ELEVATED),
            ("PADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(t3)

    story.append(Spacer(1, 8*mm))
    story.append(HRFlowable(width=W, color=SS_GREEN, thickness=1))
    story.append(Spacer(1, 2*mm))
    story.append(_body_para("CONFIDENTIAL — SPORTSHIELD EXECUTIVE INTELLIGENCE REPORT | SportShield v1.0", SS_GREY, 7))

    doc.build(story, onFirstPage=_dark_bg, onLaterPages=_dark_bg)
    buf.seek(0)
    return buf.read()


def _fmt_date(date_str: Optional[str]) -> str:
    if not date_str:
        return "N/A"
    try:
        dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        return dt.strftime("%Y-%m-%d %H:%M UTC")
    except Exception:
        return str(date_str)
