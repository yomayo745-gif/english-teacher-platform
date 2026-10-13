import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import init_db
from app.core.storage import UPLOAD_DIR
from app.api.v1.auth import router as auth_router
from app.api.v1.student import router as student_router
from app.api.v1.teacher import router as teacher_router
from app.api.v1.media import router as media_router
from app.api.v1.common import router as common_router
from app.api.v1.lessons import router as lessons_router
from app.tasks.scheduler import start_scheduler, stop_scheduler
from app.bot.telegram_bot import start_telegram_bot

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("english_platform")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database tables
    logger.info("Initializing database tables...")
    await init_db()
    logger.info("Database initialized successfully.")

    # Start background scheduler
    try:
        start_scheduler()
    except Exception as e:
        logger.warning(f"Could not start background scheduler: {e}")

    # Start Telegram Bot in background task if token configured
    bot_task = None
    if settings.TELEGRAM_BOT_TOKEN and not settings.TELEGRAM_BOT_TOKEN.startswith("sandbox_"):
        bot_task = asyncio.create_task(start_telegram_bot())

    yield

    # Shutdown
    stop_scheduler()
    if bot_task:
        bot_task.cancel()

app = FastAPI(
    title="English Teacher Homework Platform API",
    description="Production-grade API for Student WebApp, Teacher Panel, and Telegram Bot.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
origins = settings.BACKEND_CORS_ORIGINS if isinstance(settings.BACKEND_CORS_ORIGINS, list) else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded static media files
app.mount("/static/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Include API v1 routers
app.include_router(common_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")
app.include_router(student_router, prefix="/api/v1")
app.include_router(teacher_router, prefix="/api/v1")
app.include_router(lessons_router, prefix="/api/v1")
app.include_router(media_router, prefix="/api/v1")

# Global error handler for unhandled exceptions (Rule 54: Never show raw stack traces to users)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Something went wrong. Please try again."}
    )

# Magic short link redirect for teacher full-screen login
from fastapi.responses import FileResponse, HTMLResponse
from app.core.security import get_magic_token

@app.get("/m/{code}", response_class=HTMLResponse, include_in_schema=False)
async def magic_login_redirect(code: str):
    token = get_magic_token(code)
    if not token:
        return HTMLResponse(
            "<!DOCTYPE html><html><body style='font-family:sans-serif;text-align:center;padding:50px;'>"
            "<h2>⚠️ Havola eskirgan yoki topilmadi</h2>"
            "<p>Iltimos, Telegram botdan yangi havola oling (/start yoki /admin).</p>"
            "</body></html>",
            status_code=404
        )
    return HTMLResponse(f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Kirilmoqda...</title></head>
<body style="font-family:sans-serif;text-align:center;padding:50px;background:#f8fafc;color:#1e293b;">
  <div style="max-width:400px;margin:100px auto;background:#fff;padding:30px;border-radius:16px;box-shadow:0 4px 12px rgba(0,0,0,0.05);border:1px solid #e2e8f0;">
    <h3 style="margin-top:0;">✅ O‘qituvchi paneliga kirilmoqda...</h3>
    <p style="font-size:13px;color:#64748b;">Brauzerda to‘liq ekran ochilmoqda, kuting...</p>
  </div>
  <script>
    try {{
      localStorage.setItem('token', '{token}');
    }} catch (e) {{}}
    window.location.replace('/admin');
  </script>
</body>
</html>""")

# Mount frontend SPA if dist exists
FRONTEND_DIST = settings.BASE_DIR / "frontend" / "dist"
if FRONTEND_DIST.exists():
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        if full_path.startswith("api") or full_path.startswith("static"):
            return JSONResponse(status_code=404, content={"detail": "Not found"})
        target_file = (FRONTEND_DIST / full_path).resolve()
        if target_file.is_file() and str(target_file).startswith(str(FRONTEND_DIST)):
            return FileResponse(target_file)
        return FileResponse(FRONTEND_DIST / "index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
