from pydantic_settings import BaseSettings

from app.core.params import BASE_DIR


class Settings(BaseSettings):
    DATABASE_URL: str
    QDRANT_URL: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    OTP_EXPIRE_MINUTES: int = 10
    OTP_DEBUG_MODE: bool = True
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    # Google OAuth (Sign in with Google). This must match the OAuth Client ID
    # configured in Google Cloud Console and the VITE_GOOGLE_CLIENT_ID used
    # by the frontend so the token audience check succeeds.
    GOOGLE_CLIENT_ID: str = ""

    class Config:
        env_file = BASE_DIR / ".env"
        extra = "ignore"

settings = Settings()