from __future__ import annotations

import io
import os
from datetime import timezone
from decimal import Decimal
from pathlib import Path

from django.conf import settings
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

from payments.models import PaymentTransaction


def _to_decimal(value, default: str = "0.00") -> Decimal:
    try:
        return Decimal(str(value or default))
    except Exception:
        return Decimal(default)


def _invoice_number(transaction: PaymentTransaction) -> str:
    created = transaction.created_at.astimezone(timezone.utc)
    return f"INV-{created:%y%m%d}-{transaction.id:04d}"


def _safe_logo_path() -> str | None:
    configured = str(getattr(settings, "WEBSITE_LOGO_PATH", "")).strip()
    if not configured:
        return None
    path = Path(configured)
    return str(path) if path.exists() else None


def _wrap_text(c: canvas.Canvas, text: str, max_width: float, font_name: str, font_size: int) -> list[str]:
    normalized = str(text or "-").strip() or "-"
    words = normalized.split()
    if not words:
        return ["-"]
    lines: list[str] = []
    current = words[0]
    for word in words[1:]:
        candidate = f"{current} {word}"
        if c.stringWidth(candidate, font_name, font_size) <= max_width:
            current = candidate
        else:
            lines.append(current)
            current = word
    lines.append(current)
    return lines


def _format_amount(value: Decimal, currency: str) -> str:
    return f"{currency} {value:.2f}"


def _number_to_words_upto_9999(value: int) -> str:
    units = [
        "zero",
        "one",
        "two",
        "three",
        "four",
        "five",
        "six",
        "seven",
        "eight",
        "nine",
        "ten",
        "eleven",
        "twelve",
        "thirteen",
        "fourteen",
        "fifteen",
        "sixteen",
        "seventeen",
        "eighteen",
        "nineteen",
    ]
    tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]

    if value < 20:
        return units[value]
    if value < 100:
        return tens[value // 10] + ("" if value % 10 == 0 else f" {units[value % 10]}")
    if value < 1000:
        rest = value % 100
        return f"{units[value // 100]} hundred" + ("" if rest == 0 else f" {_number_to_words_upto_9999(rest)}")
    rest = value % 1000
    return f"{units[value // 1000]} thousand" + ("" if rest == 0 else f" {_number_to_words_upto_9999(rest)}")


def _amount_in_words(amount: Decimal, currency: str) -> str:
    whole = int(amount)
    paisa = int((amount - Decimal(whole)) * 100)
    whole_words = _number_to_words_upto_9999(abs(whole)).title()
    if paisa > 0:
        paisa_words = _number_to_words_upto_9999(abs(paisa)).title()
        return f"{whole_words} and {paisa_words} Paise Only"
    return f" {whole_words} Only"


def _env_value(key: str, fallback: str = "") -> str:
    # Read latest value directly from backend/.env so invoice branding updates
    # reflect even without full server restart.
    env_file = Path(getattr(settings, "BASE_DIR")) / ".env"
    value = ""
    if env_file.exists():
        try:
            for line in env_file.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                env_key, env_val = line.split("=", 1)
                if env_key.strip() == key:
                    value = env_val.strip()
        except Exception:
            value = ""
    if value:
        return value
    return str(os.getenv(key, getattr(settings, key, fallback)) or fallback).strip()


def _display_company_name() -> str:
    raw_name = _env_value("COMPANY_LEGAL_NAME", "SIA Software Innovations Private Limited")
    return raw_name.replace("SIA Software", "Sia Software")


def build_invoice_pdf(transaction: PaymentTransaction) -> bytes:
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    margin = 16 * mm
    x_left = margin
    x_right = width - margin
    content_width = x_right - x_left
    y = height - margin

    # Header
    c.setStrokeColor(colors.HexColor("#D9E2EC"))
    c.setFillColor(colors.HexColor("#0F172A"))

    logo_path = _safe_logo_path()
    logo_x = x_left
    logo_y = y - 20 * mm
    logo_w = 18 * mm
    logo_h = 18 * mm
    logo_r = 5 * mm  # ~32px style rounded appearance in PDF scale
    if logo_path:
        try:
            c.saveState()
            clip = c.beginPath()
            clip.roundRect(logo_x, logo_y, logo_w, logo_h, logo_r)
            c.clipPath(clip, stroke=0, fill=0)
            c.drawImage(ImageReader(logo_path), logo_x, logo_y, width=logo_w, height=logo_h, preserveAspectRatio=True, mask="auto")
            c.restoreState()
            c.setStrokeColor(colors.HexColor("#CBD5E1"))
            c.roundRect(logo_x, logo_y, logo_w, logo_h, logo_r, fill=0, stroke=1)
        except Exception:
            pass

    c.setFont("Helvetica-Bold", 15)
    c.drawString(x_left + 24 * mm, y - 6 * mm, _display_company_name())
    c.setFont("Helvetica", 9)
    c.setFillColor(colors.HexColor("#334E68"))
    c.drawString(x_left + 24 * mm, y - 12 * mm, str(getattr(settings, "COMPANY_TAGLINE", "ACCESS BEYOND LIMITS")))

    c.setFillColor(colors.HexColor("#0F172A"))
    c.setFont("Helvetica-Bold", 18)
    c.drawRightString(x_right, y - 6 * mm, "TAX INVOICE")
    c.setFont("Helvetica", 10)
    c.drawRightString(x_right, y - 12 * mm, _invoice_number(transaction))

    y -= 26 * mm
    c.setLineWidth(1)
    c.line(x_left, y, x_right, y)
    y -= 8 * mm

    # Billed By / Billed To
    gap = 10 * mm
    col_w = (content_width - gap) / 2
    by_x = x_left
    to_x = x_left + col_w + gap

    c.setFont("Helvetica-Bold", 11)
    c.drawString(by_x, y, "Billed By")
    c.drawString(to_x, y, "Billed To")
    y -= 6 * mm

    company_raw = [
        _display_company_name(),
        _env_value("COMPANY_ADDRESS_LINE1", ""),
        _env_value("COMPANY_ADDRESS_LINE2", ""),
        _env_value("COMPANY_ADDRESS_LINE3", ""),
        f"Email: {_env_value('INVOICE_CONTACT_EMAIL', 'info@siasoftwareinnovations.com')}",
        f"GSTIN: {_env_value('COMPANY_GSTIN', '-') or '-'}",
    ]
    company_lines: list[str] = []
    company_line_keys: set[str] = set()
    for line in company_raw:
        normalized = line.strip()
        if not normalized:
            continue
        dedupe_key = normalized.lower()
        if dedupe_key in company_line_keys:
            continue
        company_lines.append(normalized)
        company_line_keys.add(dedupe_key)

    student_lines = [
        str(transaction.user.name or transaction.user.username),
        f"Email: {transaction.user.email}",
        f"Mobile: {transaction.user.phone}",
    ]

    by_y = y
    to_y = y
    c.setFont("Helvetica", 10)
    line_h = 4.8 * mm

    for line in company_lines:
        for chunk in _wrap_text(c, line, col_w - 2 * mm, "Helvetica", 10):
            c.drawString(by_x, by_y, chunk)
            by_y -= line_h

    for line in student_lines:
        for chunk in _wrap_text(c, line, col_w - 2 * mm, "Helvetica", 10):
            c.drawString(to_x, to_y, chunk)
            to_y -= line_h

    y = min(by_y, to_y) - 3 * mm
    c.setLineWidth(0.8)
    c.line(x_left, y, x_right, y)
    y -= 8 * mm

    # Pricing summary
    pricing = (transaction.metadata or {}).get("pricing") or {}
    amount = _to_decimal(pricing.get("amount", transaction.amount))
    discount_amount = _to_decimal(pricing.get("discount_amount", amount - transaction.total))
    coupon_discount = _to_decimal(pricing.get("coupon_discount", (transaction.metadata or {}).get("coupon_discount")))
    subtotal = _to_decimal(pricing.get("subtotal", transaction.total - transaction.tax))
    tax = _to_decimal(pricing.get("tax", transaction.tax))
    total = _to_decimal(pricing.get("total", transaction.total))
    tax_rate_percent = _to_decimal(pricing.get("tax_rate_percent", settings.DEFAULT_TAX_RATE))
    if tax_rate_percent <= Decimal("1.00"):
        tax_rate_percent = (tax_rate_percent * Decimal("100")).quantize(Decimal("0.01"))

    currency = str(transaction.currency or "INR").upper()
    course_title = str(transaction.course.title or "Course")

    c.setFont("Helvetica-Bold", 12)
    c.setFillColor(colors.HexColor("#1F2937"))
    c.drawString(x_left, y, "Invoice Summary")
    y -= 7 * mm

    label_col_w = 58 * mm
    value_col_w = content_width - label_col_w - 8 * mm

    rows = [
        ("Course", course_title, False),
        ("Base Price", _format_amount(amount, currency), True),
    ]
    if discount_amount > Decimal("0.00"):
        rows.append(("Course Discount", _format_amount(discount_amount, currency), True))
    if coupon_discount > Decimal("0.00"):
        rows.append(("Coupon Discount", _format_amount(coupon_discount, currency), True))
    rows.extend(
        [
            ("Subtotal (Excl. GST)", _format_amount(subtotal, currency), True),
            (f"GST ({tax_rate_percent:.0f}%)", _format_amount(tax, currency), True),
            ("Total Payable", _format_amount(total, currency), True),
        ]
    )

    row_heights: list[float] = []
    for _, value, _ in rows:
        line_count = len(_wrap_text(c, value, value_col_w, "Helvetica", 10))
        row_heights.append(max(7 * mm, (line_count * 4.6 * mm) + 2 * mm))

    table_h = sum(row_heights)
    c.setFillColor(colors.HexColor("#F8FAFC"))
    c.setStrokeColor(colors.HexColor("#D9E2EC"))
    c.roundRect(x_left, y - table_h, content_width, table_h, 2 * mm, fill=1, stroke=1)

    cursor_y = y
    for idx, (label, value, is_amount) in enumerate(rows):
        row_h = row_heights[idx]
        if idx > 0:
            c.setStrokeColor(colors.HexColor("#E5EAF0"))
            c.line(x_left, cursor_y, x_right, cursor_y)
        c.setFillColor(colors.HexColor("#111827"))
        c.setFont("Helvetica-Bold", 10)
        c.drawString(x_left + 4 * mm, cursor_y - 5 * mm, label)

        c.setFont("Helvetica", 10)
        wrapped_values = _wrap_text(c, value, value_col_w - 2 * mm, "Helvetica", 10)
        val_y = cursor_y - 5 * mm
        if is_amount and len(wrapped_values) == 1:
            c.drawRightString(x_right - 4 * mm, val_y, wrapped_values[0])
        else:
            for line in wrapped_values:
                c.drawString(x_left + label_col_w + 6 * mm, val_y, line)
                val_y -= 4.6 * mm
        cursor_y -= row_h

    y -= table_h + 8 * mm
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(colors.HexColor("#1F2937"))
    c.drawString(x_left, y, "Amount in Words")
    c.setFont("Helvetica", 9)
    c.drawString(x_left + 30 * mm, y, _amount_in_words(total, currency))
    y -= 6 * mm
    c.setStrokeColor(colors.HexColor("#D9E2EC"))
    c.line(x_left, y, x_right, y)
    y -= 8 * mm

    # Minimal transaction details
    c.setFont("Helvetica-Bold", 11)
    c.drawString(x_left, y, "Payment Details")
    y -= 6 * mm

    details = [
        ("Invoice No", _invoice_number(transaction)),
        ("Transaction ID", str(transaction.id)),
        ("Invoice Date", transaction.created_at.strftime("%d %b %Y, %I:%M %p UTC")),
        ("Status", str(transaction.payment_status).capitalize()),
        ("Order Ref", str(transaction.razorpay_order_id or "-")),
        ("Payment Ref", str(transaction.razorpay_payment_id or "-")),
    ]
    coupon_code = str((transaction.metadata or {}).get("coupon_code") or "").strip()
    if coupon_code:
        details.append(("Coupon Code", coupon_code))
    key_w = 45 * mm
    for key, value in details:
        c.setFont("Helvetica-Bold", 10)
        c.drawString(x_left, y, key)
        c.setFont("Helvetica", 10)
        wrapped = _wrap_text(c, value, content_width - key_w - 4 * mm, "Helvetica", 10)
        for i, line in enumerate(wrapped):
            c.drawString(x_left + key_w, y - (i * 4.6 * mm), line)
        y -= max(6 * mm, (len(wrapped) * 4.6 * mm) + 1 * mm)

    y -= 4 * mm
    c.setFont("Helvetica", 8)
    c.setFillColor(colors.HexColor("#486581"))
    c.drawString(x_left, y, "This is a computer-generated tax invoice.")
    y -= 4 * mm
    c.drawString(
        x_left,
        y,
        f"Support: {_env_value('INVOICE_CONTACT_EMAIL', 'info@siasoftwareinnovations.com')} | CIN: {_env_value('COMPANY_CIN', '-') or '-'} | DPIIT: {_env_value('COMPANY_DPIIT', '-') or '-'}",
    )

    c.showPage()
    c.save()
    return buffer.getvalue()
