import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.core.database import AsyncSessionLocal
from app.services.reminder_service import run_deadline_reminders

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

async def scheduled_reminder_job():
    """Background task to send deadline reminder notifications."""
    try:
        async with AsyncSessionLocal() as session:
            await run_deadline_reminders(session)
    except Exception as e:
        logger.error(f"Error in scheduled deadline reminder job: {e}")

def start_scheduler():
    """Starts the background scheduler."""
    scheduler.add_job(scheduled_reminder_job, "interval", minutes=10, id="deadline_reminders", replace_existing=True)
    scheduler.start()
    logger.info("Background deadline reminder scheduler started.")

def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Background scheduler shut down.")
