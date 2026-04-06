from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    """Централизованная конфигурация приложения из environment переменных"""

    # Database
    DATABASE_URL: str

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 дней

    # CORS
    CORS_ORIGINS: str

    # Google OAuth
    GOOGLE_CLIENT_ID: str

    # VAPID Push Notifications
    VAPID_EMAIL: str
    VAPID_PRIVATE_KEY: str
    VAPID_PUBLIC_KEY: str

    # Gemini API
    GEMINI_API_KEY: str

    # Rate Limiting
    RATE_LIMIT_LOGIN_ATTEMPTS: int = 5
    RATE_LIMIT_LOGIN_WINDOW: int = 300  # 5 минут в секундах

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True
    )

    @property
    def cors_origins_list(self) -> List[str]:
        """Преобразует строку CORS_ORIGINS в список"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]


# Singleton instance
settings = Settings()
