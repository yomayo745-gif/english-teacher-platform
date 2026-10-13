import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.core.config import settings
from app.models.assignment import Assignment, AssignmentTarget
from app.models.submission import Submission
from app.models.user import User
from app.models.group import GroupMember
from app.models.notification import Notification
from app.services.notification_service import create_and_send_notification

logger = logging.getLogger(__name__)

async def run_deadline_reminders(db: AsyncSession):
    """
    Checks assignments whose deadlines are within 24h, 3h, or 1h,
    and sends reminder notifications to students who haven't submitted yet.
    """
    now = datetime.now(timezone.utc)
    
    # Query active published assignments with a deadline in the future
    stmt = select(Assignment).where(
        and_(
            Assignment.status == "PUBLISHED",
            Assignment.deadline.isnot(None),
            Assignment.deadline > now,
            Assignment.deadline <= now + timedelta(hours=25)
        )
    )
    result = await db.execute(stmt)
    assignments = result.scalars().all()

    for assignment in assignments:
        diff_hours = (assignment.deadline - now).total_seconds() / 3600.0
        
        # Determine reminder window
        window_label = None
        if 23.5 <= diff_hours <= 24.5:
            window_label = "24 hours"
        elif 2.5 <= diff_hours <= 3.5:
            window_label = "3 hours"
        elif 0.5 <= diff_hours <= 1.5:
            window_label = "1 hour"

        if not window_label:
            continue

        # Get target students
        target_student_ids = set()
        if assignment.target_type == "ALL":
            res = await db.execute(select(User.id).where(User.role == "STUDENT"))
            target_student_ids.update(res.scalars().all())
        elif assignment.target_type == "GROUP" and assignment.target_group_id:
            res = await db.execute(select(GroupMember.student_id).where(GroupMember.group_id == assignment.target_group_id))
            target_student_ids.update(res.scalars().all())
        elif assignment.target_type == "INDIVIDUAL":
            res = await db.execute(select(AssignmentTarget.student_id).where(AssignmentTarget.assignment_id == assignment.id))
            target_student_ids.update(res.scalars().all())

        for s_id in target_student_ids:
            # Check if student has submitted
            sub_res = await db.execute(
                select(Submission).where(
                    and_(
                        Submission.assignment_id == assignment.id,
                        Submission.student_id == s_id,
                        Submission.status.in_(["SUBMITTED", "REVIEWING", "GRADED"])
                    )
                )
            )
            existing_sub = sub_res.scalar_one_or_none()
            if existing_sub:
                continue  # Already submitted

            # Check if reminder already sent for this window
            notif_title = f"⏰ Homework Reminder ({window_label})"
            recent_notif = await db.execute(
                select(Notification).where(
                    and_(
                        Notification.user_id == s_id,
                        Notification.title == notif_title,
                        Notification.created_at >= now - timedelta(hours=2)
                    )
                )
            )
            if recent_notif.scalar_one_or_none():
                continue

            # Fetch student user
            u_res = await db.execute(select(User).where(User.id == s_id))
            student = u_res.scalar_one_or_none()
            if student:
                deadline_fmt = assignment.deadline.strftime("%H:%M")
                msg = f"Your <b>{assignment.title}</b> homework is due in {window_label} (at {deadline_fmt})."
                link = f"{settings.WEBAPP_URL}#/tasks/{assignment.id}"
                await create_and_send_notification(
                    db=db,
                    user=student,
                    notification_type="DEADLINE_REMINDER",
                    title=notif_title,
                    message=msg,
                    link=link,
                    button_text="Open Homework"
                )
