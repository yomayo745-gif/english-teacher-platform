from typing import List, Union, Optional
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
import os
from pathlib import Path

# Base directory of the project
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Application
    APP_NAME: str = "English Teacher Homework Platform"
    APP_ENV: str = "development"
    DEBUG: bool = True
    TIMEZONE: str = "Asia/Tashkent"
    BASE_URL: str = "http://localhost:8000"
    WEBAPP_URL: str = "http://localhost:5173/app"
    STUDENT_WEBAPP_URL: Optional[str] = None
    ADMIN_WEBAPP_URL: Optional[str] = None
    ADMIN_PANEL_URL: str = "http://localhost:5173/admin"

    @property
    def student_url(self) -> str:
        if self.STUDENT_WEBAPP_URL:
            return self.STUDENT_WEBAPP_URL
        base = self.WEBAPP_URL.rstrip('/')
        return f"{base}/app" if not base.endswith("/app") else base

    @property
    def admin_url(self) -> str:
        if self.ADMIN_WEBAPP_URL:
            return self.ADMIN_WEBAPP_URL
        if self.ADMIN_PANEL_URL and self.ADMIN_PANEL_URL != "http://localhost:5173/admin":
            return self.ADMIN_PANEL_URL
        base = self.WEBAPP_URL.rstrip('/')
        return f"{base}/admin" if not base.endswith("/admin") else base

    # Telegram
    TELEGRAM_BOT_TOKEN: str = "sandbox_test_token"
    ADMIN_TELEGRAM_ID: int = 6896779142
    ADMIN_TELEGRAM_IDS: Union[List[int], str] = [1073079396, 6896779142]
    BACKEND_URL: str = "http://localhost:8000"

    @field_validator("ADMIN_TELEGRAM_IDS", mode="before")
    def assemble_admin_ids(cls, v: Union[str, List[int], List[str], int]) -> List[int]:
        if isinstance(v, int):
            return [v]
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("["):
                import json
                try:
                    return [int(x) for x in json.loads(v)]
                except Exception:
                    pass
            return [int(x.strip()) for x in v.split(",") if x.strip().isdigit()]
        if isinstance(v, list):
            return [int(x) for x in v if str(x).isdigit()]
        return [1073079396, 6896779142]

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./platform.db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Security / JWT
    JWT_SECRET: str = "super_secret_production_key_english_teacher_platform_987654321"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30  # 30 days

    # File Storage
    STORAGE_PROVIDER: str = "local"
    UPLOAD_DIR: str = str(BASE_DIR / "backend" / "uploads")
    MAX_UPLOAD_SIZE_BYTES: int = 50 * 1024 * 1024  # 50 MB

    # CORS
    BACKEND_CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "https://web.telegram.org",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, str) and v.startswith("["):
            import json
            try:
                return json.loads(v)
            except Exception:
                return ["*"]
        return v

settings = Settings()
