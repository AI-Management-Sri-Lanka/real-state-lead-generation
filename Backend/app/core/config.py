from pydantic_settings import BaseSettings

from app.core.params import BASE_DIR


class Settings(BaseSettings):
    DATABASE_URL: str
    QDRANT_URL: str

    class Config:
        env_file = BASE_DIR / ".env"
        extra = "ignore"

settings = Settings()