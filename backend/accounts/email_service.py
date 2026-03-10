from __future__ import annotations

import base64
from dataclasses import dataclass
from email.mime.image import MIMEImage
from html import escape
import logging
from pathlib import Path
from decimal import Decimal

import requests
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.utils.html import strip_tags

from courses.models import Course

logger = logging.getLogger(__name__)
LOGO_CID = "sia-edu-logo"


@dataclass
class FeaturedCourseContext:
    course_name: str
    course_description: str
    course_link: str


def _safe(value) -> str:
    return escape(str(value or ""))


def _shorten(text: str, length: int = 210) -> str:
    cleaned = " ".join((text or "").split())
    if len(cleaned) <= length:
        return cleaned
    return f"{cleaned[: length - 3].rstrip()}..."


def _get_featured_course() -> FeaturedCourseContext:
    course = (
        Course.objects.filter(is_deleted=False, is_active=True)
        .select_related("category")
        .order_by("-created_at")
        .first()
    )

    base_url = str(getattr(settings, "FRONTEND_BASE_URL", "http://localhost:5173")).rstrip("/")
    if not course:
        return FeaturedCourseContext(
            course_name="AI and Quantum Learning Path",
            course_description=(
                "Discover practical, job-focused programs across Data Science, Machine Learning, "
                "Deep Learning, Prompt Engineering, and Quantum Computing."
            ),
            course_link=f"{base_url}/",
        )

    description = course.short_description or course.description or "Explore this featured learning path."
    return FeaturedCourseContext(
        course_name=course.title,
        course_description=_shorten(description, 210),
        course_link=f"{base_url}/course/{course.id}",
    )


def _resolve_logo_source() -> tuple[str, str | None]:
    configured_path = str(getattr(settings, "WEBSITE_LOGO_PATH", "")).strip()
    base_dir = Path(getattr(settings, "BASE_DIR"))
    if configured_path:
        candidate = Path(configured_path)
        logo_path = candidate if candidate.is_absolute() else (base_dir / candidate).resolve()
    else:
        logo_path = (base_dir / ".." / "frontend" / "src" / "assets" / "image.png").resolve()

    if logo_path.exists() and logo_path.is_file():
        return f"cid:{LOGO_CID}", str(logo_path)

    logo_url = str(
        getattr(
            settings,
            "WEBSITE_LOGO_URL",
            "https://dummyimage.com/96x96/0b1220/ffffff.png&text=SIA",
        )
    )
    return logo_url, None


def _mail_branding_context() -> dict:
    featured = _get_featured_course()
    logo_src, logo_path = _resolve_logo_source()
    return {
        "website_name": str(getattr(settings, "WEBSITE_NAME", "SIA_EDU")),
        "logo_src": logo_src,
        "logo_path": logo_path,
        "contact_email": str(getattr(settings, "CONTACT_EMAIL", settings.DEFAULT_FROM_EMAIL)),
        "instagram_link": str(
            getattr(
                settings,
                "INSTAGRAM_LINK",
                "https://www.instagram.com/siasoftwareinnovations?igsh=enZrY2JkZDZ3Y2F0",
            )
        ),
        "linkedin_link": str(
            getattr(
                settings,
                "LINKEDIN_LINK",
                "https://www.linkedin.com/company/sia-software-innovations-private-limited/",
            )
        ),
        "youtube_link": str(
            getattr(
                settings,
                "YOUTUBE_LINK",
                "https://www.youtube.com/channel/UCljQ1Lrvl_1wO-gcQ0EGuYw",
            )
        ),
        "course_name": featured.course_name,
        "course_description": featured.course_description,
        "course_link": featured.course_link,
    }


def _render_header(website_name: str, logo_src: str) -> str:
    return f"""
      <tr>
        <td align="center" style="padding:28px 24px 18px 24px;background-color:#0b1220;">
          <img src="{_safe(logo_src)}" alt="{_safe(website_name)} logo" width="72" height="72" style="display:block;border:0;outline:none;text-decoration:none;border-radius:14px;background-color:#ffffff;padding:6px;" />
          <p style="margin:14px 0 0 0;font-size:24px;line-height:30px;font-weight:700;color:#ffffff;letter-spacing:0.3px;">{_safe(website_name)}</p>
        </td>
      </tr>
    """


def _render_featured_course_card(course_name: str, course_description: str, course_link: str, cta_text: str) -> str:
    return f"""
      <tr>
        <td style="padding:22px 28px 0 28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0f172a;border-radius:14px;">
            <tr>
              <td style="padding:20px;">
                <p style="margin:0 0 8px 0;font-size:16px;line-height:22px;font-weight:700;color:#ffffff;">Explore Our Featured Course</p>
                <p style="margin:0 0 8px 0;font-size:18px;line-height:26px;font-weight:700;color:#93c5fd;">{_safe(course_name)}</p>
                <p style="margin:0 0 16px 0;font-size:14px;line-height:22px;color:#cbd5e1;">{_safe(course_description)}</p>
                <a href="{_safe(course_link)}" style="display:inline-block;background-color:#2563eb;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;line-height:20px;padding:10px 18px;border-radius:10px;">{_safe(cta_text)}</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    """


def _render_social_section(instagram_link: str, linkedin_link: str, youtube_link: str) -> str:
    return f"""
      <tr>
        <td style="padding:22px 28px 0 28px;">
          <p style="margin:0 0 10px 0;font-size:14px;line-height:22px;color:#475569;">
            Stay connected with us for updates, learning tips, and exclusive content.
          </p>
          <a href="{_safe(linkedin_link)}" style="display:inline-block;margin:0 8px 8px 0;padding:8px 12px;border:1px solid #e2e8f0;border-radius:999px;font-size:13px;font-weight:700;color:#0f172a;text-decoration:none;background-color:#ffffff;">
            <span style="display:inline-block;min-width:18px;height:18px;line-height:18px;text-align:center;border-radius:50%;background-color:#0a66c2;color:#ffffff;font-size:11px;font-weight:700;margin-right:6px;">in</span>LinkedIn
          </a>
          <a href="{_safe(instagram_link)}" style="display:inline-block;margin:0 8px 8px 0;padding:8px 12px;border:1px solid #e2e8f0;border-radius:999px;font-size:13px;font-weight:700;color:#0f172a;text-decoration:none;background-color:#ffffff;">
            <span style="display:inline-block;min-width:18px;height:18px;line-height:18px;text-align:center;border-radius:50%;background-color:#e1306c;color:#ffffff;font-size:11px;font-weight:700;margin-right:6px;">ig</span>Instagram
          </a>
          <a href="{_safe(youtube_link)}" style="display:inline-block;margin:0 8px 8px 0;padding:8px 12px;border:1px solid #e2e8f0;border-radius:999px;font-size:13px;font-weight:700;color:#0f172a;text-decoration:none;background-color:#ffffff;">
            <span style="display:inline-block;min-width:18px;height:18px;line-height:18px;text-align:center;border-radius:50%;background-color:#ff0000;color:#ffffff;font-size:11px;font-weight:700;margin-right:6px;">yt</span>YouTube
          </a>
        </td>
      </tr>
    """


def _render_footer(website_name: str) -> str:
    return f"""
      <tr>
        <td style="padding:22px 28px 26px 28px;">
          <p style="margin:0;font-size:12px;line-height:18px;color:#94a3b8;text-align:center;">
            (c) {_safe(website_name)}. All rights reserved.
          </p>
        </td>
      </tr>
    """


def _wrap_email_document(body: str) -> str:
    return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin:0;padding:0;background-color:#f3f6fb;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f6fb;margin:0;padding:0;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;background-color:#ffffff;border:1px solid #e5eaf3;border-radius:18px;overflow:hidden;">
            {body}
          </table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;">
            <tr>
              <td style="padding:12px 0 0 0;text-align:center;">
                <p style="margin:0;font-size:11px;line-height:16px;color:#94a3b8;">This is an automated message from {_safe(getattr(settings, "WEBSITE_NAME", "SIA_EDU"))}.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>"""


def _build_verification_code_email_html(
    *,
    user_name: str,
    verification_code: str,
    website_name: str,
    logo_src: str,
    course_name: str,
    course_description: str,
    course_link: str,
    contact_email: str,
    instagram_link: str,
    linkedin_link: str,
    youtube_link: str,
    purpose_title: str,
    purpose_description: str,
) -> str:
    body = f"""
      {_render_header(website_name, logo_src)}
      <tr>
        <td style="padding:28px 28px 8px 28px;">
          <p style="margin:0 0 12px 0;font-size:20px;line-height:28px;font-weight:700;color:#0f172a;">Hello {_safe(user_name)},</p>
          <p style="margin:0 0 18px 0;font-size:15px;line-height:24px;color:#334155;">{_safe(purpose_description)}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 28px 8px 28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fbff;border:1px solid #d9e6ff;border-radius:14px;">
            <tr>
              <td align="center" style="padding:22px 18px 20px 18px;">
                <p style="margin:0 0 10px 0;font-size:17px;line-height:24px;font-weight:700;color:#0f172a;">{_safe(purpose_title)}</p>
                <p style="margin:0;font-size:40px;line-height:46px;font-weight:800;letter-spacing:9px;color:#1d4ed8;">{_safe(verification_code)}</p>
                <p style="margin:14px 0 0 0;font-size:14px;line-height:20px;color:#475569;">This code will expire in 10 minutes.</p>
                <p style="margin:6px 0 0 0;font-size:13px;line-height:20px;color:#b91c1c;font-weight:700;">Never share your verification code with anyone.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 28px 0 28px;">
          <p style="margin:0;font-size:14px;line-height:22px;color:#475569;">
            If you did not request this, please contact us immediately at
            <a href="mailto:{_safe(contact_email)}" style="color:#1d4ed8;text-decoration:none;font-weight:700;">{_safe(contact_email)}</a>
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 28px 0 28px;">
          <p style="margin:0;font-size:15px;line-height:24px;color:#334155;">
            Thank you for choosing {_safe(website_name)}.<br />
            We're excited to have you with us.
          </p>
        </td>
      </tr>
      {_render_featured_course_card(course_name, course_description, course_link, "Explore Course")}
      {_render_social_section(instagram_link, linkedin_link, youtube_link)}
      {_render_footer(website_name)}
    """
    return _wrap_email_document(body)


def _build_registration_success_email_html(
    *,
    user_name: str,
    website_name: str,
    logo_src: str,
    course_name: str,
    course_description: str,
    course_link: str,
    contact_email: str,
    instagram_link: str,
    linkedin_link: str,
    youtube_link: str,
) -> str:
    body = f"""
      {_render_header(website_name, logo_src)}
      <tr>
        <td style="padding:28px 28px 8px 28px;">
          <p style="margin:0 0 10px 0;font-size:20px;line-height:28px;font-weight:700;color:#0f172a;">Hello {_safe(user_name)},</p>
          <p style="margin:0 0 14px 0;font-size:30px;line-height:36px;font-weight:800;color:#047857;">Registration Successful!</p>
          <p style="margin:0 0 12px 0;font-size:15px;line-height:24px;color:#334155;">
            Your account has been successfully verified and your registration with {_safe(website_name)} is complete.
          </p>
          <p style="margin:0 0 12px 0;font-size:15px;line-height:24px;color:#334155;">
            Thank you for choosing {_safe(website_name)}. We appreciate your trust and look forward to helping you grow your skills with confidence.
          </p>
          <p style="margin:0;font-size:15px;line-height:24px;color:#334155;">
            Explore your dashboard and start learning from curated, practical course paths designed for real outcomes.
          </p>
        </td>
      </tr>
      {_render_featured_course_card(course_name, course_description, course_link, "Start Learning Now")}
      {_render_social_section(instagram_link, linkedin_link, youtube_link)}
      <tr>
        <td style="padding:16px 28px 0 28px;">
          <p style="margin:0;font-size:14px;line-height:22px;color:#475569;">
            Need assistance? Contact us at
            <a href="mailto:{_safe(contact_email)}" style="color:#1d4ed8;text-decoration:none;font-weight:700;">{_safe(contact_email)}</a>
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 28px 0 28px;">
          <p style="margin:0;font-size:15px;line-height:24px;color:#334155;">Welcome to the community.</p>
        </td>
      </tr>
      {_render_footer(website_name)}
    """
    return _wrap_email_document(body)


def _build_payment_success_email_html(
    *,
    user_name: str,
    website_name: str,
    logo_src: str,
    course_name: str,
    total_amount: str,
    currency: str,
    invoice_number: str,
    transaction_id: str,
    payment_ref: str,
    payment_date: str,
    payment_history_link: str,
    contact_email: str,
    instagram_link: str,
    linkedin_link: str,
    youtube_link: str,
) -> str:
    body = f"""
      {_render_header(website_name, logo_src)}
      <tr>
        <td style="padding:28px 28px 8px 28px;">
          <p style="margin:0 0 10px 0;font-size:20px;line-height:28px;font-weight:700;color:#0f172a;">Hello {_safe(user_name)},</p>
          <p style="margin:0 0 14px 0;font-size:30px;line-height:36px;font-weight:800;color:#047857;">Payment Successful</p>
          <p style="margin:0 0 10px 0;font-size:15px;line-height:24px;color:#334155;">
            Your payment has been confirmed and your enrollment is active.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 28px 0 28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fbff;border:1px solid #d9e6ff;border-radius:14px;">
            <tr><td style="padding:16px 18px 4px 18px;font-size:14px;line-height:22px;color:#334155;"><strong>Course:</strong> {_safe(course_name)}</td></tr>
            <tr><td style="padding:2px 18px;font-size:14px;line-height:22px;color:#334155;"><strong>Total Paid:</strong> {_safe(currency)} {_safe(total_amount)}</td></tr>
            <tr><td style="padding:2px 18px;font-size:14px;line-height:22px;color:#334155;"><strong>Invoice No:</strong> {_safe(invoice_number)}</td></tr>
            <tr><td style="padding:2px 18px;font-size:14px;line-height:22px;color:#334155;"><strong>Transaction ID:</strong> {_safe(transaction_id)}</td></tr>
            <tr><td style="padding:2px 18px;font-size:14px;line-height:22px;color:#334155;"><strong>Payment Ref:</strong> {_safe(payment_ref)}</td></tr>
            <tr><td style="padding:2px 18px 16px 18px;font-size:14px;line-height:22px;color:#334155;"><strong>Date:</strong> {_safe(payment_date)}</td></tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 28px 0 28px;">
          <a href="{_safe(payment_history_link)}" style="display:inline-block;background-color:#2563eb;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;line-height:20px;padding:10px 18px;border-radius:10px;">Open Payment History</a>
          <p style="margin:12px 0 0 0;font-size:13px;line-height:20px;color:#475569;">
            Your invoice PDF is attached to this email.
          </p>
        </td>
      </tr>
      {_render_social_section(instagram_link, linkedin_link, youtube_link)}
      <tr>
        <td style="padding:16px 28px 0 28px;">
          <p style="margin:0;font-size:14px;line-height:22px;color:#475569;">
            Need assistance? Contact us at
            <a href="mailto:{_safe(contact_email)}" style="color:#1d4ed8;text-decoration:none;font-weight:700;">{_safe(contact_email)}</a>
          </p>
        </td>
      </tr>
      {_render_footer(website_name)}
    """
    return _wrap_email_document(body)


def _send_html_email(
    *,
    to_email: str,
    subject: str,
    html_body: str,
    inline_logo_path: str | None = None,
    attachments: list[tuple[str, bytes, str]] | None = None,
) -> None:
    plain_body = strip_tags(html_body)
    attachments = attachments or []

    # Prefer Brevo API when key is configured.
    brevo_api_key = str(getattr(settings, "BREVO_API_KEY", "")).strip()
    brevo_api_url = str(getattr(settings, "BREVO_API_URL", "https://api.brevo.com/v3/smtp/email")).strip()
    brevo_sender_email = str(getattr(settings, "BREVO_SENDER_EMAIL", settings.DEFAULT_FROM_EMAIL)).strip()
    brevo_sender_name = str(getattr(settings, "BREVO_SENDER_NAME", "")).strip()
    if brevo_api_key and brevo_api_url and brevo_sender_email:
        try:
            brevo_html = html_body
            if f"cid:{LOGO_CID}" in brevo_html:
                brevo_logo_url = str(
                    getattr(
                        settings,
                        "WEBSITE_LOGO_URL",
                        "https://dummyimage.com/96x96/0b1220/ffffff.png&text=SIA",
                    )
                ).strip()
                if brevo_logo_url:
                    brevo_html = brevo_html.replace(f"cid:{LOGO_CID}", brevo_logo_url)

            sender_payload: dict[str, str] = {"email": brevo_sender_email}
            if brevo_sender_name:
                sender_payload["name"] = brevo_sender_name

            brevo_payload: dict = {
                "sender": sender_payload,
                "to": [{"email": to_email}],
                "subject": subject,
                "htmlContent": brevo_html,
                "textContent": plain_body,
            }

            if attachments:
                brevo_payload["attachment"] = [
                    {
                        "name": filename,
                        "content": base64.b64encode(payload).decode("ascii"),
                    }
                    for filename, payload, content_type in attachments
                ]

            response = requests.post(
                brevo_api_url,
                headers={
                    "api-key": brevo_api_key,
                    "Content-Type": "application/json",
                },
                json=brevo_payload,
                timeout=int(getattr(settings, "EMAIL_TIMEOUT", 20)),
            )
            response.raise_for_status()
            return
        except Exception:
            logger.exception(
                "Failed to send account email via Brevo to %s with subject '%s'. Falling back to Resend/SMTP.",
                to_email,
                subject,
            )

    # Fallbacks are intentionally disabled to force Brevo API usage.
    # Uncomment the blocks below to re-enable Resend/SMTP in the future.

    # # Prefer Resend API when key is configured (works on Render free plan where SMTP is blocked).
    # resend_api_key = str(getattr(settings, "RESEND_API_KEY", "")).strip()
    # resend_api_url = str(getattr(settings, "RESEND_API_URL", "https://api.resend.com/emails")).strip()
    # resend_from_email = str(getattr(settings, "RESEND_FROM_EMAIL", settings.DEFAULT_FROM_EMAIL)).strip()
    # if resend_api_key and resend_api_url and resend_from_email:
    #     try:
    #         resend_html = html_body
    #         if f"cid:{LOGO_CID}" in resend_html:
    #             resend_logo_url = str(
    #                 getattr(
    #                     settings,
    #                     "WEBSITE_LOGO_URL",
    #                     "https://dummyimage.com/96x96/0b1220/ffffff.png&text=SIA",
    #                 )
    #             ).strip()
    #             if resend_logo_url:
    #                 resend_html = resend_html.replace(f"cid:{LOGO_CID}", resend_logo_url)
    #
    #         resend_payload: dict = {
    #             "from": resend_from_email,
    #             "to": [to_email],
    #             "subject": subject,
    #             "html": resend_html,
    #             "text": plain_body,
    #         }
    #
    #         if attachments:
    #             resend_payload["attachments"] = [
    #                 {
    #                     "filename": filename,
    #                     "content": base64.b64encode(payload).decode("ascii"),
    #                     "content_type": content_type,
    #                 }
    #                 for filename, payload, content_type in attachments
    #             ]
    #
    #         response = requests.post(
    #             resend_api_url,
    #             headers={
    #                 "Authorization": f"Bearer {resend_api_key}",
    #                 "Content-Type": "application/json",
    #             },
    #             json=resend_payload,
    #             timeout=int(getattr(settings, "EMAIL_TIMEOUT", 20)),
    #         )
    #         response.raise_for_status()
    #         return
    #     except Exception:
    #         logger.exception(
    #             "Failed to send account email via Resend to %s with subject '%s'. Falling back to Django backend.",
    #             to_email,
    #             subject,
    #         )
    #
    # message = EmailMultiAlternatives(
    #     subject=subject,
    #     body=plain_body,
    #     from_email=settings.DEFAULT_FROM_EMAIL,
    #     to=[to_email],
    # )
    # message.attach_alternative(html_body, "text/html")
    # if inline_logo_path:
    #     logo_file = Path(inline_logo_path)
    #     if logo_file.exists() and logo_file.is_file():
    #         with logo_file.open("rb") as file_obj:
    #             image = MIMEImage(file_obj.read(), _subtype=logo_file.suffix.lstrip(".").lower() or "png")
    #         image.add_header("Content-ID", f"<{LOGO_CID}>")
    #         image.add_header("Content-Disposition", "inline", filename=logo_file.name)
    #         image.add_header("X-Attachment-Id", LOGO_CID)
    #         message.attach(image)
    # for attachment in attachments:
    #     filename, payload, content_type = attachment
    #     message.attach(filename, payload, content_type)
    # try:
    #     message.send(fail_silently=False)
    # except Exception:
    #     logger.exception("Failed to send account email to %s with subject '%s'", to_email, subject)

    raise RuntimeError("Email delivery failed or Brevo is not configured. Brevo-only mode is enabled.")


def send_verification_code_email(user, verification_code: str) -> None:
    context = _mail_branding_context()
    html_body = _build_verification_code_email_html(
        user_name=user.name or user.username,
        verification_code=verification_code,
        website_name=context["website_name"],
        logo_src=context["logo_src"],
        course_name=context["course_name"],
        course_description=context["course_description"],
        course_link=context["course_link"],
        contact_email=context["contact_email"],
        instagram_link=context["instagram_link"],
        linkedin_link=context["linkedin_link"],
        youtube_link=context["youtube_link"],
        purpose_title="Your Verification Code",
        purpose_description=(
            f"You are receiving this email to verify your {context['website_name']} account securely. "
            "Please use the verification details below to continue."
        ),
    )
    _send_html_email(
        to_email=user.email,
        subject=f"{context['website_name']} email verification code",
        html_body=html_body,
        inline_logo_path=context["logo_path"],
    )


def send_password_reset_verification_code_email(user, verification_code: str) -> None:
    context = _mail_branding_context()
    html_body = _build_verification_code_email_html(
        user_name=user.name or user.username,
        verification_code=verification_code,
        website_name=context["website_name"],
        logo_src=context["logo_src"],
        course_name=context["course_name"],
        course_description=context["course_description"],
        course_link=context["course_link"],
        contact_email=context["contact_email"],
        instagram_link=context["instagram_link"],
        linkedin_link=context["linkedin_link"],
        youtube_link=context["youtube_link"],
        purpose_title="Password Reset Verification Code",
        purpose_description=(
            f"You requested a password reset for your {context['website_name']} account. "
            "Use the verification details below to continue securely."
        ),
    )
    _send_html_email(
        to_email=user.email,
        subject=f"{context['website_name']} password reset verification code",
        html_body=html_body,
        inline_logo_path=context["logo_path"],
    )


def send_registration_success_email(user) -> None:
    context = _mail_branding_context()
    html_body = _build_registration_success_email_html(
        user_name=user.name or user.username,
        website_name=context["website_name"],
        logo_src=context["logo_src"],
        course_name=context["course_name"],
        course_description=context["course_description"],
        course_link=context["course_link"],
        contact_email=context["contact_email"],
        instagram_link=context["instagram_link"],
        linkedin_link=context["linkedin_link"],
        youtube_link=context["youtube_link"],
    )
    _send_html_email(
        to_email=user.email,
        subject=f"Registration Successful - Welcome to {context['website_name']}",
        html_body=html_body,
        inline_logo_path=context["logo_path"],
    )


def send_payment_success_email(*, transaction, invoice_pdf: bytes) -> None:
    context = _mail_branding_context()
    pricing = (transaction.metadata or {}).get("pricing") or {}
    total = Decimal(str(pricing.get("total", transaction.total or 0))).quantize(Decimal("0.01"))
    currency = str(pricing.get("currency", transaction.currency or "INR")).upper()
    payment_ref = str(transaction.razorpay_payment_id or transaction.razorpay_order_id or transaction.id)
    payment_history_link = f"{str(getattr(settings, 'FRONTEND_BASE_URL', 'http://localhost:5173')).rstrip('/')}/user/payment-history?invoice={transaction.id}"
    created_display = transaction.created_at.strftime("%d %b %Y, %I:%M %p UTC")
    invoice_number = f"INV-{transaction.created_at:%y%m%d}-{transaction.id:04d}"

    html_body = _build_payment_success_email_html(
        user_name=transaction.user.name or transaction.user.username,
        website_name=context["website_name"],
        logo_src=context["logo_src"],
        course_name=transaction.course.title,
        total_amount=f"{total:.2f}",
        currency=currency,
        invoice_number=invoice_number,
        transaction_id=str(transaction.id),
        payment_ref=payment_ref,
        payment_date=created_display,
        payment_history_link=payment_history_link,
        contact_email=context["contact_email"],
        instagram_link=context["instagram_link"],
        linkedin_link=context["linkedin_link"],
        youtube_link=context["youtube_link"],
    )

    _send_html_email(
        to_email=transaction.user.email,
        subject=f"Payment Successful - Invoice {invoice_number}",
        html_body=html_body,
        inline_logo_path=context["logo_path"],
        attachments=[(f"{invoice_number}.pdf", invoice_pdf, "application/pdf")],
    )

