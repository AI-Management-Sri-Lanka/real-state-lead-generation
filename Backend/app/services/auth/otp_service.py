import random
import re
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from passlib.context import CryptContext
from datetime import datetime, timedelta

from app.core.config import settings

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def send_otp_email(to_email: str, otp: str, expires_minutes: int = 10) -> None:
    """Send a password-reset OTP by SMTP, as a styled HTML email with a
    plain-text fallback for clients that don't render HTML.

    If SMTP settings are missing, the function raises a clear ValueError so the app
    can fall back to debug behavior or return a controlled error.
    """
    smtp_host = getattr(settings, "SMTP_HOST", None)
    smtp_port = getattr(settings, "SMTP_PORT", None)
    smtp_user = getattr(settings, "SMTP_USER", None)
    smtp_password = getattr(settings, "SMTP_PASSWORD", None)
    sender_email = getattr(settings, "SMTP_FROM_EMAIL", smtp_user)

    if not smtp_host or not smtp_port or not smtp_user or not smtp_password or not sender_email:
        raise ValueError("SMTP configuration is incomplete. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, and SMTP_FROM_EMAIL.")

    subject = "Your password reset code"

    # Build as a classic multipart/alternative message — this is the most
    # widely-compatible pattern across SMTP relays and email clients.
    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = sender_email
    message["To"] = to_email

    # Plain-text fallback (shown by clients that block/can't render HTML)
    plain_text = (
        f"Your password reset code is: {otp}\n\n"
        f"This code expires in {expires_minutes} minutes. "
        "If you did not request this, you can safely ignore this email."
    )

    # Styled HTML version
    otp_digits = "".join(
        f'<td style="padding:0 4px;"><div style="width:40px;height:48px;background:#f8fafc;'
        f'border:1px solid #e2e8f0;border-radius:8px;display:flex;align-items:center;'
        f'justify-content:center;font-family:\'Courier New\',monospace;font-size:24px;'
        f'font-weight:700;color:#4338ca;line-height:48px;text-align:center;">{d}</div></td>'
        for d in otp
    )

    html = f"""\
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0"
                 style="max-width:480px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;
                        box-shadow:0 4px 24px rgba(15,23,42,0.08);">

            <!-- Header -->
            <tr>
              <td style="background:linear-gradient(135deg,#4f46e5,#6366f1);padding:32px 32px 28px;text-align:center;">
                <div style="width:56px;height:56px;background:rgba(255,255,255,0.15);border-radius:14px;
                            display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
                  <span style="font-size:28px;line-height:56px;">🔐</span>
                </div>
                <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">Password Reset Request</h1>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:36px 32px 8px;text-align:center;">
                <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.6;">
                  Use the verification code below to reset your password.
                  This code is valid for <strong style="color:#334155;">{expires_minutes} minutes</strong>.
                </p>

                <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 8px;">
                  <tr>{otp_digits}</tr>
                </table>

                <p style="margin:20px 0 0;color:#94a3b8;font-size:12px;letter-spacing:0.2px;">
                  Enter this code in the app to continue.
                </p>
              </td>
            </tr>

            <!-- Divider -->
            <tr>
              <td style="padding:28px 32px 0;">
                <hr style="border:none;border-top:1px solid #e2e8f0;margin:0;" />
              </td>
            </tr>

            <!-- Security note -->
            <tr>
              <td style="padding:20px 32px 32px;">
                <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;text-align:center;">
                  Didn't request this? You can safely ignore this email — your password
                  will remain unchanged. Never share this code with anyone, including
                  our support team.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background:#f8fafc;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0;">
                <p style="margin:0;color:#94a3b8;font-size:11px;">
                  This is an automated message, please do not reply directly to this email.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
"""

    # Email clients render the LAST attached alternative they support, so
    # attach plain text first, then HTML — HTML-capable clients (nearly all)
    # will show the styled version, text-only clients fall back gracefully.
    message.attach(MIMEText(plain_text, "plain", "utf-8"))
    message.attach(MIMEText(html, "html", "utf-8"))

    with smtplib.SMTP(smtp_host, int(smtp_port)) as server:
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.send_message(message)


def generate_otp(length: int = 6) -> str:
    if length <= 0:
        raise ValueError("OTP length must be greater than zero")
    return "".join(str(random.randint(0, 9)) for _ in range(length))


def hash_otp(otp: str) -> str:
    if not isinstance(otp, str) or not otp or not otp.isdigit():
        raise ValueError("OTP must be a numeric string")
    return pwd_context.hash(otp)


def verify_otp(otp: str, hashed_otp: str) -> bool:
    if not isinstance(otp, str) or not re.fullmatch(r"\d{6}", otp):
        raise ValueError("OTP must be a 6-digit numeric string")
    return pwd_context.verify(otp, hashed_otp)


def get_otp_expiration(minutes: int = 10) -> datetime:
    return datetime.utcnow() + timedelta(minutes=minutes)