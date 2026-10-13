from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from datetime import datetime, timezone
from app.core.config import settings
from app.core.database import get_db

router = APIRouter(tags=["Common & Settings"])

@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """
    Comprehensive health check probing database, Telegram Bot configuration, and core services.
    """
    components = {}
    overall_status = "healthy"

    # 1. Database Check
    try:
        await db.execute(text("SELECT 1"))
        components["database"] = {"status": "connected", "type": "sqlite" if "sqlite" in settings.DATABASE_URL else "postgresql"}
    except Exception as e:
        components["database"] = {"status": "error", "error": str(e)}
        overall_status = "unhealthy"

    # 2. Telegram Bot Configuration Check
    bot_configured = bool(settings.TELEGRAM_BOT_TOKEN and not settings.TELEGRAM_BOT_TOKEN.startswith("sandbox_"))
    components["telegram_bot"] = {
        "status": "ready" if bot_configured else "sandbox_or_unconfigured",
        "configured": bot_configured,
        "admin_ids_count": len(settings.ADMIN_TELEGRAM_IDS)
    }

    # 3. Redis Check (Optional)
    components["redis"] = {"status": "configured" if settings.REDIS_URL else "disabled"}

    return {
        "status": overall_status,
        "app_name": settings.APP_NAME,
        "env": settings.APP_ENV,
        "timezone": settings.TIMEZONE,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "components": components
    }

@router.get("/settings")
async def get_system_settings():
    """Public system settings."""
    return {
        "app_name": settings.APP_NAME,
        "timezone": settings.TIMEZONE,
        "webapp_url": settings.WEBAPP_URL,
        "admin_panel_url": settings.ADMIN_PANEL_URL,
        "max_upload_size_mb": settings.MAX_UPLOAD_SIZE_BYTES / (1024 * 1024)
    }
