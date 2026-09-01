from unittest.mock import patch

import pytest

from app.core.config import settings
from app.services.auth.otp_service import generate_otp, hash_otp, verify_otp, send_otp_email


def test_generate_otp_returns_six_digit_code():
    code = generate_otp()
    assert isinstance(code, str)
    assert len(code) == 6
    assert code.isdigit()


def test_hash_and_verify_otp_work():
    plain_otp = "123456"
    hashed = hash_otp(plain_otp)

    assert hashed != plain_otp
    assert verify_otp(plain_otp, hashed) is True
    assert verify_otp("654321", hashed) is False


def test_verify_otp_rejects_invalid_input():
    with pytest.raises(ValueError):
        verify_otp("12", "hashed")


def test_send_otp_email_sends_email_message():
    with patch.object(settings, "SMTP_HOST", "smtp.example.com"), \
         patch.object(settings, "SMTP_PORT", 587), \
         patch.object(settings, "SMTP_USER", "user@example.com"), \
         patch.object(settings, "SMTP_PASSWORD", "secret"), \
         patch.object(settings, "SMTP_FROM_EMAIL", "user@example.com"), \
         patch("smtplib.SMTP") as mock_smtp:
        mock_client = mock_smtp.return_value.__enter__.return_value
        send_otp_email("user@example.com", "123456", expires_minutes=10)

        assert mock_smtp.called
        assert mock_client.send_message.called
