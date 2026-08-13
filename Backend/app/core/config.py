from pydantic_settings import BaseSettings

from app.core.params import BASE_DIR


class Settings(BaseSettings):
    DATABASE_URL: str
    QDRANT_URL: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    GOOGLE_CLIENT_ID: str = ""

    class Config:
        env_file = BASE_DIR / ".env"
        extra = "ignore"

settings = Settings()