import logging
import httpx
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.models.notification import Notification
from app.models.user import User

logger = logging.getLogger(__name__)

async def send_telegram_message(telegram_id: Optional[int], text: str, reply_markup: Optional[dict] = None) -> bool:
    """
    Sends a message to a user via Telegram Bot API.
    """
    if not telegram_id:
        return False

    if not settings.TELEGRAM_BOT_TOKEN or settings.TELEGRAM_BOT_TOKEN == "sandbox_test_token":
        logger.info(f"[SANDBOX NOTIFICATION] Telegram {telegram_id}: {text}")
        return True

    url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": telegram_id,
        "text": text,
        "parse_mode": "HTML",
    }
    if reply_markup:
        payload["reply_markup"] = reply_markup

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                return True
            else:
                logger.warning(f"Telegram API responded with {resp.status_code}: {resp.text}")
                return False
    except Exception as e:
        logger.error(f"Failed to send Telegram message to {telegram_id}: {e}")
        return False

async def create_and_send_notification(
    db: AsyncSession,
    user: User,
    notification_type: str,
    title: str,
    message: str,
    link: Optional[str] = None,
    button_text: Optional[str] = None
) -> Notification:
    """
    Persists an in-app notification and dispatches a Telegram message.
    """
    notification = Notification(
        user_id=user.id,
        type=notification_type,
        title=title,
        message=message,
        link=link,
        is_read=False,
        telegram_sent=False
    )
    db.add(notification)
    await db.flush()

    # Build reply markup if link provided
    reply_markup = None
    if link and button_text:
        reply_markup = {
            "inline_keyboard": [
                [{"text": button_text, "web_app": {"url": link} if "http" in link else "url"}]
            ]
        }
        # Fallback if standard URL
        if not reply_markup["inline_keyboard"][0][0].get("web_app"):
            reply_markup = {
                "inline_keyboard": [
                    [{"text": button_text, "url": link}]
                ]
            }

    formatted_text = f"<b>{title}</b>\n\n{message}"
    sent = await send_telegram_message(user.telegram_id, formatted_text, reply_markup)
    notification.telegram_sent = sent
    await db.commit()
    await db.refresh(notification)
    return notification

async def notify_students_new_assignment(db: AsyncSession, assignment, student_users: List[User]):
    """Notifies students that a new homework was published."""
    try:
        deadline_str = assignment.deadline.strftime("%d %B, %H:%M") if assignment.deadline else "No deadline"
        title = "📚 New Homework"
        msg = (
            f"Title: <b>{assignment.title}</b>\n"
            f"Type: {assignment.type.replace('_', ' ').title()}\n"
            f"Deadline: {deadline_str}\n"
            f"Estimated time: ~{assignment.estimated_time_minutes} min"
        )
        link = f"{settings.WEBAPP_URL}#/tasks/{assignment.id}"
        for student in student_users:
            try:
                await create_and_send_notification(
                    db=db,
                    user=student,
                    notification_type="NEW_HOMEWORK",
                    title=title,
                    message=msg,
                    link=link,
                    button_text="Open Homework"
                )
            except Exception as e:
                logger.error(f"Error notifying student {student.id}: {e}")
    except Exception as e:
        logger.error(f"Failed in notify_students_new_assignment: {e}")

async def notify_teacher_new_submission(db: AsyncSession, submission, assignment, student: User, teacher: Optional[User]):
    """Notifies teacher when student submits homework."""
    try:
        target_user = teacher
        if not target_user:
            res = await db.execute(select(User).where(User.telegram_id.in_(settings.ADMIN_TELEGRAM_IDS)))
            target_user = res.scalars().first()

        if not target_user:
            return

        sub_time = datetime.now(timezone.utc).strftime("%H:%M")
        status_tag = " (Late)" if submission.is_late else ""
        title = "📥 New Submission"
        msg = (
            f"Student: <b>{student.full_name}</b> (@{student.username or 'no_username'})\n"
            f"Assignment: <b>{assignment.title}</b>\n"
            f"Submitted: {sub_time}{status_tag}"
        )
        link = f"{settings.ADMIN_PANEL_URL}#/submissions/{submission.id}"
        await create_and_send_notification(
            db=db,
            user=target_user,
            notification_type="NEW_SUBMISSION",
            title=title,
            message=msg,
            link=link,
            button_text="Review Submission"
        )
    except Exception as e:
        logger.error(f"Failed in notify_teacher_new_submission: {e}")

async def notify_student_homework_reviewed(db: AsyncSession, submission, assignment, student: User):
    """Notifies student after their homework has been graded."""
    try:
        title = "✅ Homework Reviewed"
        msg = (
            f"Assignment: <b>{assignment.title}</b>\n"
            f"Score: <b>{submission.total_score}</b> / {submission.max_score}\n"
            f"Teacher feedback:\n<i>{submission.teacher_feedback or 'Great work!'}</i>"
        )
        link = f"{settings.WEBAPP_URL}#/results/{submission.id}"
        await create_and_send_notification(
            db=db,
            user=student,
            notification_type="HOMEWORK_REVIEWED",
            title=title,
            message=msg,
            link=link,
            button_text="View Result"
        )
    except Exception as e:
        logger.error(f"Failed in notify_student_homework_reviewed: {e}")
