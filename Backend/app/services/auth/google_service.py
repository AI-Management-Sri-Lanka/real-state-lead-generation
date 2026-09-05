"""Verification of Google "Sign in with Google" ID tokens.

The frontend uses Google Identity Services to obtain a signed JWT (the
"credential"/ID token) directly from Google after the user picks their
Google account. That token is sent to the backend, which verifies its
signature, issuer, audience, and expiry against Google's public keys before
trusting any of the claims inside it (email, name, sub, etc).
"""
from dataclasses import dataclass

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token

from app.core.config import settings
from app.core.errors import AppException, AppError
from app.core.logger import get_logger

logger = get_logger(__name__)

# Reused across requests; internally caches Google's public certificates.
_google_request = google_requests.Request()


@dataclass
class GoogleProfile:
    google_id: str
    email: str
    email_verified: bool
    full_name: str
    picture: str | None = None


def verify_google_id_token(token: str) -> GoogleProfile:
    """Verify a Google ID token and return the identity it asserts.

    Raises AppException(AUTH_GOOGLE_NOT_CONFIGURED) if the server has no
    GOOGLE_CLIENT_ID set, or AppException(AUTH_GOOGLE_TOKEN_INVALID) if the
    token fails verification for any reason (bad signature, wrong audience,
    wrong issuer, expired, malformed, etc).
    """
    if not settings.GOOGLE_CLIENT_ID:
        raise AppException(error=AppError.AUTH_GOOGLE_NOT_CONFIGURED)

    if not token or not isinstance(token, str):
        raise AppException(error=AppError.AUTH_GOOGLE_TOKEN_INVALID)

    try:
        claims = google_id_token.verify_oauth2_token(
            token,
            _google_request,
            audience=settings.GOOGLE_CLIENT_ID,
        )
    except ValueError as e:
        # Covers bad signature, expired token, audience/issuer mismatch, etc.
        logger.warning("Google ID token verification failed: %s", str(e))
        raise AppException(error=AppError.AUTH_GOOGLE_TOKEN_INVALID) from e
    except Exception as e:
        logger.error("Unexpected error verifying Google ID token: %s", str(e))
        raise AppException(error=AppError.AUTH_GOOGLE_TOKEN_INVALID) from e

    # google-auth already checks `iss` is accounts.google.com /
    # https://accounts.google.com, but double-check defensively.
    issuer = claims.get("iss")
    if issuer not in ("accounts.google.com", "https://accounts.google.com"):
        raise AppException(error=AppError.AUTH_GOOGLE_TOKEN_INVALID)

    email = claims.get("email")
    sub = claims.get("sub")
    if not email or not sub:
        raise AppException(error=AppError.AUTH_GOOGLE_TOKEN_INVALID)

    if not claims.get("email_verified", False):
        raise AppException(
            error=AppError.AUTH_GOOGLE_TOKEN_INVALID,
            custom_message="Your Google account email is not verified.",
        )

    full_name = claims.get("name") or email.split("@")[0]

    return GoogleProfile(
        google_id=sub,
        email=email,
        email_verified=True,
        full_name=full_name,
        picture=claims.get("picture"),
    )