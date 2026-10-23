"""Configuration management for SURAKSHA AI backend."""
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "SURAKSHA AI Disaster Safety Backend"
    APP_ENV: str = "development"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ALLOWED_ORIGINS: str = "*"

    # Gemini settings (kept strictly server-side)
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-2.5-flash"
    GEMINI_TIMEOUT_SECONDS: float = 12.0
    RATE_LIMIT_TEST_SECONDS: int = 5

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def is_gemini_configured(self) -> bool:
        """Returns True only if a valid, non-placeholder API key is set."""
        if not self.GEMINI_API_KEY:
            return False
        clean = self.GEMINI_API_KEY.strip()
        if not clean or clean.startswith("replace_") or "your_key" in clean:
            return False
        return len(clean) >= 10


settings = Settings()
