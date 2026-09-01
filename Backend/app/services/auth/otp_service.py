import random
import re
import smtplib
from email.message import EmailMessage

from passlib.context import CryptContext
from datetime import datetime, timedelta

from app.core.config import settings

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def send_otp_email(to_email: str, otp: str, expires_minutes: int = 10) -> None:
    """Send a password-reset OTP by SMTP.

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

    message = EmailMessage()
    message["Subject"] = "Your password reset OTP"
    message["From"] = sender_email
    message["To"] = to_email
    message.set_content(
        f"Your password reset OTP is: {otp}\n\n"
        f"This code expires in {expires_minutes} minutes. "
        "If you did not request this, you can ignore this email."
    )

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
