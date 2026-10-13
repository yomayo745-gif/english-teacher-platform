import uuid
import csv
import io
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, desc, asc, func, update, delete
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.user import User
from app.models.group import Group, GroupMember
from app.models.lesson import Lesson
from app.models.assignment import Assignment, AssignmentQuestion, AssignmentTarget
from app.models.submission import Submission, SubmissionAnswer
from app.models.audit import AuditLog, VocabularyItem
from app.schemas.assignment import (
    AssignmentCreate,
    AssignmentUpdate,
    AssignmentResponse,
    AssignmentDetailResponse
)
from app.schemas.submission import (
    SubmissionResponse,
    SubmissionDetailResponse,
    SubmissionGradeRequest
)
from app.schemas.group import GroupCreate, GroupUpdate, GroupResponse, GroupDetailResponse
from app.schemas.analytics import DashboardStats, AnalyticsData, CategoryProgress
from app.schemas.user import (
    StudentCreateRequest,
    StudentUpdateRequest,
    StudentResetPasswordRequest,
    StudentStatusUpdateRequest
)
from app.core.security import (
    require_teacher_or_admin,
    get_current_user,
    hash_password,
    generate_random_password,
    generate_base_login
)
from app.services.grading_service import generate_ai_writing_assist
from app.services.notification_service import (
    notify_students_new_assignment,
    notify_student_homework_reviewed
)

router = APIRouter(prefix="/teacher", tags=["Teacher Panel"])

async def log_action(db: AsyncSession, actor_id: str, action: str, target_type: str, target_id: Optional[str] = None, metadata: Optional[dict] = None):
    log = AuditLog(
        id=str(uuid.uuid4()),
        actor_id=actor_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        metadata_json=metadata or {},
        created_at=datetime.now(timezone.utc)
    )
    db.add(log)
    await db.commit()

# ==============================================================================
# DASHBOARD
# ==============================================================================

@router.get("/dashboard")
async def get_dashboard_data(
    teacher: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Teacher Dashboard: returns 7 KPI statistics and recent submissions feed.
    """
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # 1. Total Students
    res_students = await db.execute(select(func.count(User.id)).where(User.role == "STUDENT"))
    total_students = res_students.scalar() or 0

    # 2. Active Assignments
    res_active = await db.execute(
        select(func.count(Assignment.id)).where(
            and_(
                Assignment.status == "PUBLISHED",
                or_(Assignment.deadline.is_(None), Assignment.deadline >= now)
            )
        )
    )
    active_assignments = res_active.scalar() or 0

    # 3. Pending Reviews
    res_pending = await db.execute(
        select(func.count(Submission.id)).where(Submission.status.in_(["SUBMITTED", "REVIEWING"]))
    )
    pending_reviews = res_pending.scalar() or 0

    # 4. Completed Today
    res_completed_today = await db.execute(
        select(func.count(Submission.id)).where(
            and_(
                Submission.status == "GRADED",
                Submission.graded_at >= today_start
            )
        )
    )
    completed_today = res_completed_today.scalar() or 0

    # 5. Average Score & Total Graded
    res_scores = await db.execute(
        select(Submission.total_score, Submission.max_score).where(
            and_(
                Submission.status == "GRADED",
                Submission.total_score.isnot(None),
                Submission.max_score > 0
            )
        )
    )
    graded_rows = res_scores.all()
    if graded_rows:
        pcts = [(r[0] / r[1]) * 10.0 for r in graded_rows]  # normalized on 10-point scale
        average_score = round(sum(pcts) / len(pcts), 1)
    else:
        average_score = 0.0

    # 6. Completion Rate
    res_total_subs = await db.execute(
        select(func.count(Submission.id)).where(Submission.status != "DRAFT")
    )
    total_subs = res_total_subs.scalar() or 0
    completion_rate = round((total_subs / max(total_students * max(active_assignments, 1), 1)) * 100, 1)
    completion_rate = min(completion_rate, 100.0)

    # 7. Late Submissions
    res_late = await db.execute(
        select(func.count(Submission.id)).where(
            and_(
                Submission.status != "DRAFT",
                Submission.is_late == True
            )
        )
    )
    late_submissions = res_late.scalar() or 0

    # Recent Submissions Feed
    recent_stmt = (
        select(Submission)
        .options(
            selectinload(Submission.student),
            selectinload(Submission.assignment)
        )
        .where(Submission.status != "DRAFT")
        .order_by(desc(Submission.submitted_at))
        .limit(10)
    )
    recent_res = await db.execute(recent_stmt)
    recent_submissions = []
    for s in recent_res.scalars().all():
        recent_submissions.append({
            "id": s.id,
            "student_name": s.student.full_name if s.student else "Student",
            "student_username": s.student.username if s.student else "",
            "assignment_title": s.assignment.title if s.assignment else "Assignment",
            "assignment_type": s.assignment.type if s.assignment else "WRITING",
            "submitted_at": s.submitted_at.isoformat() if s.submitted_at else s.created_at.isoformat(),
            "status": s.status,
            "is_late": s.is_late,
            "total_score": s.total_score,
            "max_score": s.max_score
        })

    return {
        "stats": {
            "total_students": total_students,
            "active_assignments": active_assignments,
            "pending_reviews": pending_reviews,
            "completed_today": completed_today,
            "average_score": average_score,
            "completion_rate": completion_rate,
            "late_submissions": late_submissions
        },
        "recent_submissions": recent_submissions
    }

# ==============================================================================
# SUBMISSIONS & REVIEW
# ==============================================================================

@router.get("/submissions")
async def list_submissions(
    status: Optional[str] = Query(None, description="SUBMITTED, REVIEWING, GRADED, or ALL"),
    assignment_id: Optional[str] = None,
    student_id: Optional[str] = None,
    task_type: Optional[str] = None,
    sort_by: str = Query("newest", description="newest, oldest, deadline, student"),
    teacher: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns list of submissions with filters and sorting.
    """
    stmt = (
        select(Submission)
        .options(
            selectinload(Submission.student),
            selectinload(Submission.assignment)
        )
        .where(Submission.status != "DRAFT")
    )

    if status and status != "ALL":
        if status in ["PENDING", "SUBMITTED", "PENDING_REVIEWS", "UNREVIEWED"]:
            stmt = stmt.where(Submission.status.in_(["SUBMITTED", "REVIEWING"]))
        else:
            stmt = stmt.where(Submission.status == status)

    if assignment_id:
        stmt = stmt.where(Submission.assignment_id == assignment_id)

    if student_id:
        stmt = stmt.where(Submission.student_id == student_id)

    if task_type:
        stmt = stmt.join(Assignment, Submission.assignment_id == Assignment.id).where(Assignment.type == task_type)

    if sort_by == "oldest":
        stmt = stmt.order_by(asc(Submission.submitted_at))
    else:
        stmt = stmt.order_by(desc(Submission.submitted_at))

    result = await db.execute(stmt)
    submissions = result.scalars().all()

    items = []
    for s in submissions:
        items.append({
            "id": s.id,
            "student_id": s.student_id,
            "student_name": s.student.full_name if s.student else "Unknown",
            "student_username": s.student.username if s.student else "",
            "student_telegram_id": s.student.telegram_id if s.student else None,
            "assignment_id": s.assignment_id,
            "assignment_title": s.assignment.title if s.assignment else "",
            "task_type": s.assignment.type if s.assignment else "WRITING",
            "status": s.status,
            "is_late": s.is_late,
            "late_by_minutes": s.late_by_minutes,
            "submitted_at": s.submitted_at.isoformat() if s.submitted_at else s.created_at.isoformat(),
            "deadline": s.assignment.deadline.isoformat() if (s.assignment and s.assignment.deadline) else None,
            "total_score": s.total_score,
            "max_score": s.max_score,
            "teacher_feedback": s.teacher_feedback
        })
    return items

@router.get("/submissions/{submission_id}")
async def get_submission_review(
    submission_id: str,
    teacher: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Submission Review Split-View:
    Left: Assignment prompt, questions, media (audio/image/passage).
    Right: Student submission, answers, word count, uploaded audio/image.
    Also returns the next submission ID for fast continuous grading!
    """
    stmt = (
        select(Submission)
        .options(
            selectinload(Submission.student),
            selectinload(Submission.assignment).selectinload(Assignment.questions),
            selectinload(Submission.answers).selectinload(SubmissionAnswer.question)
        )
        .where(Submission.id == submission_id)
    )
    res = await db.execute(stmt)
    sub = res.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    # Mark as REVIEWING if currently SUBMITTED
    if sub.status == "SUBMITTED":
        sub.status = "REVIEWING"
        await db.commit()

    # Find the next pending submission for fast workflow "Save Grade & Next"
    next_stmt = (
        select(Submission.id)
        .where(
            and_(
                Submission.id != sub.id,
                Submission.status.in_(["SUBMITTED", "REVIEWING"])
            )
        )
        .order_by(asc(Submission.submitted_at))
        .limit(1)
    )
    next_res = await db.execute(next_stmt)
    next_submission_id = next_res.scalar_one_or_none()

    # Organize answers by question ID
    answers_map = {ans.question_id: ans for ans in sub.answers}

    questions_review = []
    total_words = 0

    for q in sorted(sub.assignment.questions, key=lambda x: x.order):
        ans = answers_map.get(q.id)
        w_count = ans.word_count if ans else 0
        total_words += (w_count or 0)

        questions_review.append({
            "question_id": q.id,
            "order": q.order,
            "type": q.type,
            "question_text": q.question_text,
            "description": q.description,
            "passage": q.passage,
            "media_url": q.media_url,
            "media_type": q.media_type,
            "transcript": q.transcript,
            "options": q.options,
            "correct_answer": q.correct_answer,
            "min_words": q.min_words,
            "max_words": q.max_words,
            "points": q.points,
            # Student's answer
            "student_answer": {
                "answer_id": ans.id if ans else None,
                "text_answer": ans.text_answer if ans else None,
                "selected_options": ans.selected_options if ans else None,
                "audio_url": ans.audio_url if ans else None,
                "audio_duration": ans.audio_duration if ans else None,
                "file_url": ans.file_url if ans else None,
                "word_count": w_count,
                "audio_plays_count": ans.audio_plays_count if ans else 0,
                "auto_score": ans.auto_score if ans else None,
                "manual_score": ans.manual_score if ans else None,
                "feedback": ans.feedback if ans else None
            }
        })

    return {
        "submission": {
            "id": sub.id,
            "status": sub.status,
            "submitted_at": sub.submitted_at.isoformat() if sub.submitted_at else sub.created_at.isoformat(),
            "is_late": sub.is_late,
            "late_by_minutes": sub.late_by_minutes,
            "total_score": sub.total_score,
            "max_score": sub.max_score,
            "teacher_feedback": sub.teacher_feedback,
            "total_word_count": total_words
        },
        "student": {
            "id": sub.student.id,
            "full_name": sub.student.full_name,
            "username": sub.student.username,
            "telegram_id": sub.student.telegram_id,
            "joined_date": sub.student.created_at.strftime("%d %B %Y")
        },
        "assignment": {
            "id": sub.assignment.id,
            "title": sub.assignment.title,
            "type": sub.assignment.type,
            "instructions": sub.assignment.instructions,
            "difficulty": sub.assignment.difficulty,
            "points": sub.assignment.points,
            "deadline": sub.assignment.deadline.isoformat() if sub.assignment.deadline else None,
            "show_transcript": sub.assignment.show_transcript
        },
        "questions": questions_review,
        "next_submission_id": next_submission_id
    }

@router.post("/submissions/{submission_id}/grade")
async def grade_submission(
    submission_id: str,
    payload: SubmissionGradeRequest,
    teacher: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Grades a student submission.
    Saves score and teacher feedback, updates status, and sends Telegram alert to the student.
    """
    stmt = (
        select(Submission)
        .options(
            selectinload(Submission.student),
            selectinload(Submission.assignment),
            selectinload(Submission.answers)
        )
        .where(Submission.id == submission_id)
    )
    res = await db.execute(stmt)
    sub = res.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    sub.total_score = payload.total_score
    sub.teacher_feedback = payload.teacher_feedback
    sub.status = payload.status
    sub.graded_at = datetime.now(timezone.utc)
    sub.graded_by = teacher.id

    # Update per-question grades if provided
    if payload.question_grades:
        ans_map = {ans.question_id: ans for ans in sub.answers}
        for qg in payload.question_grades:
            if qg.question_id in ans_map:
                ans_map[qg.question_id].manual_score = qg.score
                if qg.feedback:
                    ans_map[qg.question_id].feedback = qg.feedback

    await db.commit()
    await db.refresh(sub)

    # Log action
    await log_action(
        db,
        actor_id=teacher.id,
        action="GRADE_SUBMITTED",
        target_type="SUBMISSION",
        target_id=sub.id,
        metadata={"score": sub.total_score, "status": sub.status}
    )

    # Notify student via Telegram
    if sub.status == "GRADED":
        await notify_student_homework_reviewed(db, sub, sub.assignment, sub.student)

    # Find next pending submission
    next_res = await db.execute(
        select(Submission.id).where(
            and_(
                Submission.id != sub.id,
                Submission.status.in_(["SUBMITTED", "REVIEWING"])
            )
        ).order_by(asc(Submission.submitted_at)).limit(1)
    )
    next_id = next_res.scalar_one_or_none()

    return {
        "status": "success",
        "message": "Grade and feedback saved successfully ✓",
        "submission_id": sub.id,
        "next_submission_id": next_id
    }

@router.post("/submissions/{submission_id}/ai-assist")
async def get_ai_writing_suggestions(
    submission_id: str,
    question_id: Optional[str] = None,
    teacher: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Provides AI writing and grammar assistance suggestions for teacher review.
    """
    stmt = (
        select(Submission)
        .options(
            selectinload(Submission.assignment).selectinload(Assignment.questions),
            selectinload(Submission.answers)
        )
        .where(Submission.id == submission_id)
    )
    res = await db.execute(stmt)
    sub = res.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    target_ans = None
    target_q = None

    if question_id:
        target_ans = next((a for a in sub.answers if a.question_id == question_id), None)
        target_q = next((q for q in sub.assignment.questions if q.id == question_id), None)
    else:
        # Default to first writing or picture description answer
        for ans in sub.answers:
            if ans.text_answer and len(ans.text_answer.strip()) > 0:
                target_ans = ans
                target_q = next((q for q in sub.assignment.questions if q.id == ans.question_id), None)
                break

    if not target_ans or not target_ans.text_answer:
        raise HTTPException(status_code=400, detail="No written answer found to evaluate")

    analysis = generate_ai_writing_assist(
        text=target_ans.text_answer,
        task_instructions=target_q.description if target_q else None,
        min_words=target_q.min_words if target_q else None
    )

    return {
        "analysis": analysis,
        "answer_text": target_ans.text_answer,
        "word_count": target_ans.word_count
    }

# ==============================================================================
# ASSIGNMENT MANAGEMENT & BUILDER
# ==============================================================================

@router.get("/assignments")
async def list_teacher_assignments(
    status: Optional[str] = None,
    type: Optional[str] = None,
    group_id: Optional[str] = None,
    search: Optional[str] = None,
    teacher: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """Lists all assignments with submission and questions count, filtered by status, type, group, or search."""
    stmt = (
        select(Assignment)
        .options(
            selectinload(Assignment.questions),
            selectinload(Assignment.submissions),
            selectinload(Assignment.teacher),
            selectinload(Assignment.target_group)
        )
        .order_by(desc(Assignment.created_at))
    )
    if status and status != "ALL":
        if status == "COMPLETED":
            stmt = stmt.where(Assignment.status == "COMPLETED")
        elif status == "SCHEDULED":
            now = datetime.now(timezone.utc)
            stmt = stmt.where(and_(Assignment.status == "PUBLISHED", Assignment.start_date > now))
        else:
            stmt = stmt.where(Assignment.status == status)

    if type and type != "ALL":
        stmt = stmt.where(Assignment.type == type)

    if group_id:
        stmt = stmt.where(Assignment.target_group_id == group_id)

    if search:
        search_filter = f"%{search}%"
        stmt = stmt.where(Assignment.title.ilike(search_filter))

    res = await db.execute(stmt)
    assignments = res.scalars().all()

    items = []
    for a in assignments:
        items.append({
            "id": a.id,
            "title": a.title,
            "description": a.description,
            "instructions": a.instructions,
            "type": a.type,
            "difficulty": a.difficulty,
            "points": a.points,
            "estimated_time_minutes": a.estimated_time_minutes,
            "deadline": a.deadline.isoformat() if a.deadline else None,
            "status": a.status,
            "target_type": a.target_type,
            "target_group_id": a.target_group_id,
            "target_group_name": a.target_group.name if a.target_group else None,
            "questions_count": len(a.questions),
            "submissions_count": len(a.submissions),
            "created_at": a.created_at.isoformat()
        })
    return items

@router.get("/assignments/{assignment_id}")
async def get_teacher_assignment(
    assignment_id: str,
    teacher: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """Returns single assignment with all questions and targeting detail."""
    stmt = (
        select(Assignment)
        .options(
            selectinload(Assignment.questions),
            selectinload(Assignment.targets),
            selectinload(Assignment.target_group)
        )
        .where(Assignment.id == assignment_id)
    )
    res = await db.execute(stmt)
    assignment = res.scalar_one_or_none()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    selected_student_ids = [t.student_id for t in assignment.targets]

    questions_data = []
    for q in sorted(assignment.questions, key=lambda x: x.order):
        questions_data.append({
            "id": q.id,
            "order": q.order,
            "type": q.type,
            "question_text": q.question_text,
            "description": q.description,
            "passage": q.passage,
            "media_url": q.media_url,
            "media_type": q.media_type,
            "media_duration": q.media_duration,
            "transcript": q.transcript,
            "options": q.options,
            "correct_answer": q.correct_answer,
            "min_words": q.min_words,
            "max_words": q.max_words,
            "points": q.points,
            "is_required": q.is_required
        })

    return {
        "id": assignment.id,
        "title": assignment.title,
        "description": assignment.description,
        "instructions": assignment.instructions,
        "type": assignment.type,
        "difficulty": assignment.difficulty,
        "points": assignment.points,
        "estimated_time_minutes": assignment.estimated_time_minutes,
        "start_date": assignment.start_date.isoformat() if assignment.start_date else None,
        "deadline": assignment.deadline.isoformat() if assignment.deadline else None,
        "allow_late_submission": assignment.allow_late_submission,
        "allow_edit_after_submit": assignment.allow_edit_after_submit,
        "audio_play_limit": assignment.audio_play_limit,
        "show_transcript": assignment.show_transcript,
        "status": assignment.status,
        "target_type": assignment.target_type,
        "target_group_id": assignment.target_group_id,
        "selected_student_ids": selected_student_ids,
        "questions": questions_data
    }

@router.put("/assignments/{assignment_id}")
async def update_assignment(
    assignment_id: str,
    payload: AssignmentUpdate,
    teacher: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """Updates an existing assignment with its questions and targets."""
    stmt = (
        select(Assignment)
        .options(
            selectinload(Assignment.questions),
            selectinload(Assignment.targets)
        )
        .where(Assignment.id == assignment_id)
    )
    res = await db.execute(stmt)
    assignment = res.scalar_one_or_none()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    if payload.title is not None:
        assignment.title = payload.title
    if payload.description is not None:
        assignment.description = payload.description
    if payload.instructions is not None:
        assignment.instructions = payload.instructions
    if payload.type is not None:
        assignment.type = payload.type
    if payload.difficulty is not None:
        assignment.difficulty = payload.difficulty
    if payload.points is not None:
        assignment.points = payload.points
    if payload.estimated_time_minutes is not None:
        assignment.estimated_time_minutes = payload.estimated_time_minutes
    if payload.start_date is not None:
        assignment.start_date = payload.start_date
    if payload.deadline is not None:
        assignment.deadline = payload.deadline
    if payload.allow_late_submission is not None:
        assignment.allow_late_submission = payload.allow_late_submission
    if payload.allow_edit_after_submit is not None:
        assignment.allow_edit_after_submit = payload.allow_edit_after_submit
    if payload.audio_play_limit is not None:
        assignment.audio_play_limit = payload.audio_play_limit
    if payload.show_transcript is not None:
        assignment.show_transcript = payload.show_transcript
    if payload.status is not None:
        assignment.status = payload.status
    if payload.target_type is not None:
        assignment.target_type = payload.target_type
    if payload.target_group_id is not None:
        assignment.target_group_id = payload.target_group_id

    assignment.updated_at = datetime.now(timezone.utc)

    # Update questions if provided
    if payload.questions is not None:
        for old_q in list(assignment.questions):
            await db.delete(old_q)
        for idx, q_data in enumerate(payload.questions, start=1):
            new_q = AssignmentQuestion(
                id=str(uuid.uuid4()),
                assignment_id=assignment.id,
                order=q_data.order or idx,
                type=q_data.type,
                question_text=q_data.question_text,
                description=q_data.description,
                passage=q_data.passage,
                media_url=q_data.media_url,
                media_type=q_data.media_type,
                media_duration=q_data.media_duration,
                transcript=q_data.transcript,
                options=q_data.options,
                correct_answer=q_data.correct_answer,
                min_words=q_data.min_words,
                max_words=q_data.max_words,
                points=q_data.points,
                is_required=q_data.is_required
            )
            db.add(new_q)

    # Update targets if provided
    if payload.selected_student_ids is not None:
        for old_t in list(assignment.targets):
            await db.delete(old_t)
        if assignment.target_type == "INDIVIDUAL":
            for sid in payload.selected_student_ids:
                new_t = AssignmentTarget(
                    id=str(uuid.uuid4()),
                    assignment_id=assignment.id,
                    student_id=sid,
                    created_at=datetime.now(timezone.utc)
                )
                db.add(new_t)

    await db.commit()
    await db.refresh(assignment)

    await log_action(
        db,
        actor_id=teacher.id,
        action="ASSIGNMENT_UPDATED",
        target_type="ASSIGNMENT",
        target_id=assignment.id,
        metadata={"title": assignment.title, "type": assignment.type, "status": assignment.status}
    )

    return {"status": "success", "message": "Assignment updated successfully ✓", "assignment_id": assignment.id}

@router.post("/assignments/{assignment_id}/duplicate")
async def duplicate_assignment(
    assignment_id: str,
    teacher: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """Duplicates an existing assignment and its questions into a new DRAFT assignment."""
    stmt = (
        select(Assignment)
        .options(
            selectinload(Assignment.questions),
            selectinload(Assignment.targets)
        )
        .where(Assignment.id == assignment_id)
    )
    res = await db.execute(stmt)
    orig = res.scalar_one_or_none()
    if not orig:
        raise HTTPException(status_code=404, detail="Assignment not found")

    new_id = str(uuid.uuid4())
    new_assignment = Assignment(
        id=new_id,
        teacher_id=teacher.id,
        title=f"[Copy] {orig.title}",
        description=orig.description,
        instructions=orig.instructions,
        type=orig.type,
        difficulty=orig.difficulty,
        points=orig.points,
        estimated_time_minutes=orig.estimated_time_minutes,
        start_date=datetime.now(timezone.utc),
        deadline=orig.deadline,
        allow_late_submission=orig.allow_late_submission,
        allow_edit_after_submit=orig.allow_edit_after_submit,
        audio_play_limit=orig.audio_play_limit,
        show_transcript=orig.show_transcript,
        status="DRAFT",
        target_type=orig.target_type,
        target_group_id=orig.target_group_id,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    db.add(new_assignment)
    await db.flush()

    for q in orig.questions:
        cloned_q = AssignmentQuestion(
            id=str(uuid.uuid4()),
            assignment_id=new_id,
            order=q.order,
            type=q.type,
            question_text=q.question_text,
            description=q.description,
            passage=q.passage,
            media_url=q.media_url,
            media_type=q.media_type,
            media_duration=q.media_duration,
            transcript=q.transcript,
            options=q.options,
            correct_answer=q.correct_answer,
            min_words=q.min_words,
            max_words=q.max_words,
            points=q.points,
            is_required=q.is_required
        )
        db.add(cloned_q)

    for t in orig.targets:
        cloned_t = AssignmentTarget(
            id=str(uuid.uuid4()),
            assignment_id=new_id,
            student_id=t.student_id,
            created_at=datetime.now(timezone.utc)
        )
        db.add(cloned_t)

    await db.commit()

    await log_action(
        db,
        actor_id=teacher.id,
        action="ASSIGNMENT_DUPLICATED",
        target_type="ASSIGNMENT",
        target_id=new_id,
        metadata={"title": new_assignment.title, "original_id": orig.id}
    )

    return {
        "status": "success",
        "message": f"Assignment '{orig.title}' duplicated as draft ✓",
        "assignment_id": new_id
    }

@router.post("/assignments")
async def create_assignment(
    payload: AssignmentCreate,
    teacher: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Creates an assignment with questions, attachments, and student targeting.
    If published, immediately notifies targeted students via Telegram.
    """
    assignment = Assignment(
        id=str(uuid.uuid4()),
        teacher_id=teacher.id,
        title=payload.title,
        description=payload.description,
        instructions=payload.instructions,
        type=payload.type,
        difficulty=payload.difficulty,
        points=payload.points,
        estimated_time_minutes=payload.estimated_time_minutes,
        start_date=payload.start_date or datetime.now(timezone.utc),
        deadline=payload.deadline,
        allow_late_submission=payload.allow_late_submission,
        allow_edit_after_submit=payload.allow_edit_after_submit,
        audio_play_limit=payload.audio_play_limit,
        show_transcript=payload.show_transcript,
        status=payload.status,
        target_type=payload.target_type,
        target_group_id=payload.target_group_id,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    db.add(assignment)
    await db.flush()

    # Add questions
    for idx, q_data in enumerate(payload.questions, start=1):
        q = AssignmentQuestion(
            id=str(uuid.uuid4()),
            assignment_id=assignment.id,
            order=q_data.order or idx,
            type=q_data.type,
            question_text=q_data.question_text,
            description=q_data.description,
            passage=q_data.passage,
            media_url=q_data.media_url,
            media_type=q_data.media_type,
            media_duration=q_data.media_duration,
            transcript=q_data.transcript,
            options=q_data.options,
            correct_answer=q_data.correct_answer,
            min_words=q_data.min_words,
            max_words=q_data.max_words,
            points=q_data.points,
            is_required=q_data.is_required
        )
        db.add(q)

    # Add individual targets if target_type == INDIVIDUAL
    target_students = []
    if payload.target_type == "INDIVIDUAL" and payload.selected_student_ids:
        for sid in payload.selected_student_ids:
            target = AssignmentTarget(
                id=str(uuid.uuid4()),
                assignment_id=assignment.id,
                student_id=sid,
                created_at=datetime.now(timezone.utc)
            )
            db.add(target)
        stu_res = await db.execute(select(User).where(User.id.in_(payload.selected_student_ids)))
        target_students = stu_res.scalars().all()
    elif payload.target_type == "GROUP" and payload.target_group_id:
        stu_res = await db.execute(
            select(User).join(GroupMember, User.id == GroupMember.student_id).where(GroupMember.group_id == payload.target_group_id)
        )
        target_students = stu_res.scalars().all()
    elif payload.target_type == "ALL":
        stu_res = await db.execute(select(User).where(User.role == "STUDENT"))
        target_students = stu_res.scalars().all()

    await db.commit()
    await db.refresh(assignment)

    # Log action
    await log_action(
        db,
        actor_id=teacher.id,
        action="ASSIGNMENT_CREATED",
        target_type="ASSIGNMENT",
        target_id=assignment.id,
        metadata={"title": assignment.title, "type": assignment.type, "status": assignment.status}
    )

    # If published, notify students
    if assignment.status == "PUBLISHED" and target_students:
        await notify_students_new_assignment(db, assignment, target_students)

    return {"status": "success", "assignment_id": assignment.id, "message": "Assignment created successfully ✓"}

@router.delete("/assignments/{assignment_id}")
async def delete_assignment(
    assignment_id: str,
    teacher: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """Deletes an assignment and associated records."""
    res = await db.execute(select(Assignment).where(Assignment.id == assignment_id))
    assignment = res.scalar_one_or_none()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    title = assignment.title
    await db.delete(assignment)
    await db.commit()

    await log_action(
        db,
        actor_id=teacher.id,
        action="ASSIGNMENT_DELETED",
        target_type="ASSIGNMENT",
        target_id=assignment_id,
        metadata={"title": title}
    )

    return {"status": "success", "message": f"Assignment '{title}' deleted."}

# ==============================================================================
# STUDENTS & GROUPS
# ==============================================================================

@router.get("/students")
async def list_students(
    search: Optional[str] = None,
    group_id: Optional[str] = None,
    teacher: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """Lists all students with stats (completed assignments, average score)."""
    stmt = (
        select(User)
        .options(
            selectinload(User.group_memberships).selectinload(GroupMember.group),
            selectinload(User.submissions)
        )
        .where(User.role == "STUDENT")
    )
    if search:
        search_filter = f"%{search}%"
        stmt = stmt.where(
            or_(
                User.first_name.ilike(search_filter),
                User.last_name.ilike(search_filter),
                User.username.ilike(search_filter)
            )
        )

    res = await db.execute(stmt)
    students = res.scalars().all()

    items = []
    for stu in students:
        # Group filter check
        stu_groups = [gm.group.name for gm in stu.group_memberships if gm.group]
        if group_id and not any(gm.group_id == group_id for gm in stu.group_memberships):
            continue

        graded_subs = [s for s in stu.submissions if s.status == "GRADED" and s.total_score is not None]
        avg_score = round(sum(s.total_score for s in graded_subs) / len(graded_subs), 1) if graded_subs else 0.0

        items.append({
            "id": stu.id,
            "login": stu.login,
            "initial_password": stu.initial_password or "Pass2026!",
            "telegram_id": stu.telegram_id,
            "full_name": stu.full_name,
            "first_name": stu.first_name,
            "last_name": stu.last_name,
            "username": stu.username,
            "status": stu.status or "ACTIVE",
            "phone": stu.phone,
            "notes": stu.notes,
            "groups": stu_groups,
            "total_submissions": len(stu.submissions),
            "completed": len(graded_subs),
            "average_score": avg_score,
            "created_at": stu.created_at.strftime("%d %b %Y"),
            "last_seen": stu.last_seen_at.strftime("%d %b, %H:%M"),
            "last_login": stu.last_login_at.strftime("%d %b, %H:%M") if stu.last_login_at else None
        })
    return items

@router.get("/students/generate-credentials")
async def generate_student_credentials(
    first_name: Optional[str] = None,
    last_name: Optional[str] = None,
    teacher: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """Generates a suggested unique login and secure password for a new student."""
    base = generate_base_login(first_name or "student", last_name)
    suggested_login = base
    counter = 1
    while True:
        res = await db.execute(select(User).where(func.lower(User.login) == suggested_login.lower()))
        if not res.scalar_one_or_none():
            break
        counter += 1
        suggested_login = f"{base}{counter}"

    suggested_password = generate_random_password(8)
    return {
        "suggested_login": suggested_login,
        "suggested_password": suggested_password
    }

@router.post("/students")
async def create_student(
    payload: StudentCreateRequest,
    teacher: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Creates a new student account with credentials and optional group membership.
    Returns generated password once for teacher to distribute.
    """
    first_name = payload.first_name.strip()
    if not first_name:
        raise HTTPException(status_code=400, detail="First name is required.")

    # Determine login
    if payload.login and payload.login.strip():
        login_clean = payload.login.strip()
    else:
        login_clean = generate_base_login(first_name, payload.last_name)
        # Ensure unique
        counter = 1
        orig_login = login_clean
        while True:
            res = await db.execute(select(User).where(func.lower(User.login) == login_clean.lower()))
            if not res.scalar_one_or_none():
                break
            counter += 1
            login_clean = f"{orig_login}{counter}"

    # Verify uniqueness of login
    res_login = await db.execute(select(User).where(func.lower(User.login) == login_clean.lower()))
    if res_login.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"Login '{login_clean}' is already taken.")

    # Verify Telegram ID uniqueness if provided
    if payload.telegram_id:
        res_tg = await db.execute(select(User).where(User.telegram_id == payload.telegram_id))
        if res_tg.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="This Telegram ID is already linked to another account.")

    # Password setup
    plain_password = payload.password.strip() if (payload.password and payload.password.strip()) else generate_random_password(8)
    hashed_pwd = hash_password(plain_password)

    new_student = User(
        id=str(uuid.uuid4()),
        login=login_clean,
        password_hash=hashed_pwd,
        initial_password=plain_password,
        username=login_clean,
        first_name=first_name,
        last_name=payload.last_name.strip() if payload.last_name else None,
        role="STUDENT",
        status=payload.status or "ACTIVE",
        phone=payload.phone.strip() if payload.phone else None,
        notes=payload.notes,
        telegram_id=payload.telegram_id,
        is_active=(payload.status != "DISABLED"),
        created_by_teacher_id=teacher.id,
        created_at=datetime.now(timezone.utc),
        last_seen_at=datetime.now(timezone.utc)
    )
    db.add(new_student)
    await db.flush()

    # Add to group if specified
    group_name = None
    if payload.group_id:
        grp_res = await db.execute(select(Group).where(Group.id == payload.group_id))
        grp = grp_res.scalar_one_or_none()
        if grp:
            membership = GroupMember(
                id=str(uuid.uuid4()),
                group_id=grp.id,
                student_id=new_student.id,
                joined_at=datetime.now(timezone.utc)
            )
            db.add(membership)
            group_name = grp.name

    await db.commit()
    await db.refresh(new_student)

    # Log action
    await log_action(
        db,
        actor_id=teacher.id,
        action="STUDENT_CREATED",
        target_type="USER",
        target_id=new_student.id,
        metadata={"login": new_student.login, "full_name": new_student.full_name, "group": group_name}
    )

    return {
        "status": "success",
        "message": f"Student '{new_student.full_name}' created successfully ✓",
        "student": {
            "id": new_student.id,
            "login": new_student.login,
            "full_name": new_student.full_name,
            "first_name": new_student.first_name,
            "last_name": new_student.last_name,
            "telegram_id": new_student.telegram_id,
            "status": new_student.status,
            "group": group_name,
            "phone": new_student.phone
        },
        "plain_password": plain_password
    }

@router.put("/students/{student_id}")
async def update_student(
    student_id: str,
    payload: StudentUpdateRequest,
    teacher: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """Updates student profile information, group assignment, and status."""
    res = await db.execute(select(User).options(selectinload(User.group_memberships)).where(User.id == student_id))
    student = res.scalar_one_or_none()
    if not student or student.role != "STUDENT":
        raise HTTPException(status_code=404, detail="Student not found.")

    if payload.first_name is not None and payload.first_name.strip():
        student.first_name = payload.first_name.strip()
    if payload.last_name is not None:
        student.last_name = payload.last_name.strip() if payload.last_name.strip() else None
    if payload.phone is not None:
        student.phone = payload.phone.strip() if payload.phone.strip() else None
    if payload.notes is not None:
        student.notes = payload.notes
    if payload.status is not None:
        student.status = payload.status
        student.is_active = (payload.status != "DISABLED")

    # Update login if changed
    if payload.login is not None and payload.login.strip():
        new_login = payload.login.strip()
        if new_login.lower() != (student.login or "").lower():
            res_chk = await db.execute(select(User).where(func.lower(User.login) == new_login.lower()))
            if res_chk.scalar_one_or_none():
                raise HTTPException(status_code=400, detail=f"Login '{new_login}' is already in use.")
            student.login = new_login

    # Update Telegram ID if changed
    if payload.telegram_id is not None:
        if payload.telegram_id != student.telegram_id:
            res_tg = await db.execute(select(User).where(User.telegram_id == payload.telegram_id))
            if res_tg.scalar_one_or_none():
                raise HTTPException(status_code=400, detail="This Telegram ID is already linked to another account.")
            student.telegram_id = payload.telegram_id

    # Update group membership
    if payload.group_id is not None:
        # Remove existing memberships
        for gm in list(student.group_memberships):
            await db.delete(gm)
        if payload.group_id.strip():
            new_gm = GroupMember(
                id=str(uuid.uuid4()),
                group_id=payload.group_id,
                student_id=student.id,
                joined_at=datetime.now(timezone.utc)
            )
            db.add(new_gm)

    await db.commit()
    await db.refresh(student)

    await log_action(
        db,
        actor_id=teacher.id,
        action="STUDENT_UPDATED",
        target_type="USER",
        target_id=student.id,
        metadata={"login": student.login, "status": student.status}
    )

    return {"status": "success", "message": "Student updated successfully ✓"}

@router.post("/students/{student_id}/reset-password")
async def reset_student_password(
    student_id: str,
    payload: StudentResetPasswordRequest,
    teacher: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """Resets student password and returns new password once for teacher."""
    res = await db.execute(select(User).where(User.id == student_id))
    student = res.scalar_one_or_none()
    if not student or student.role != "STUDENT":
        raise HTTPException(status_code=404, detail="Student not found.")

    new_pwd = payload.password.strip() if (payload.password and payload.password.strip()) else generate_random_password(8)
    student.password_hash = hash_password(new_pwd)
    student.initial_password = new_pwd
    await db.commit()

    await log_action(
        db,
        actor_id=teacher.id,
        action="PASSWORD_RESET",
        target_type="USER",
        target_id=student.id,
        metadata={"student_name": student.full_name, "login": student.login}
    )

    return {
        "status": "success",
        "message": f"Password reset successfully for {student.full_name} ✓",
        "new_password": new_pwd
    }

@router.put("/students/{student_id}/status")
async def update_student_status(
    student_id: str,
    payload: StudentStatusUpdateRequest,
    teacher: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """Enables or disables a student account."""
    res = await db.execute(select(User).where(User.id == student_id))
    student = res.scalar_one_or_none()
    if not student or student.role != "STUDENT":
        raise HTTPException(status_code=404, detail="Student not found.")

    student.status = payload.status
    student.is_active = (payload.status == "ACTIVE")
    await db.commit()

    action_name = "ACCOUNT_ENABLED" if student.status == "ACTIVE" else "ACCOUNT_DISABLED"
    await log_action(
        db,
        actor_id=teacher.id,
        action=action_name,
        target_type="USER",
        target_id=student.id,
        metadata={"status": student.status}
    )

    return {"status": "success", "message": f"Student status changed to {student.status} ✓", "student_status": student.status}

@router.get("/students/{student_id}")
async def get_student_profile(
    student_id: str,
    teacher: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Detailed student profile view:
    Stats, average score, skill breakdown, and full assignment history.
    """
    stmt = (
        select(User)
        .options(
            selectinload(User.group_memberships).selectinload(GroupMember.group),
            selectinload(User.submissions).selectinload(Submission.assignment)
        )
        .where(User.id == student_id)
    )
    res = await db.execute(stmt)
    stu = res.scalar_one_or_none()
    if not stu:
        raise HTTPException(status_code=404, detail="Student not found")

    graded_subs = [s for s in stu.submissions if s.status == "GRADED"]
    scores = [s.total_score for s in graded_subs if s.total_score is not None]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0.0

    history = []
    for s in sorted(stu.submissions, key=lambda x: x.submitted_at or x.created_at, reverse=True):
        history.append({
            "submission_id": s.id,
            "assignment_id": s.assignment_id,
            "assignment_title": s.assignment.title if s.assignment else "Homework",
            "type": s.assignment.type if s.assignment else "WRITING",
            "score": s.total_score,
            "max_score": s.max_score,
            "status": s.status,
            "is_late": s.is_late,
            "submitted_at": s.submitted_at.strftime("%d %b %Y, %H:%M") if s.submitted_at else "-",
            "teacher_feedback": s.teacher_feedback
        })

    # Skill categories radar
    skills = [
        {"category": "Grammar", "score": min(10.0, avg_score + 0.5) if scores else 8.0, "total_tasks": len(graded_subs)},
        {"category": "Vocabulary", "score": avg_score if scores else 8.5, "total_tasks": len(graded_subs)},
        {"category": "Writing", "score": max(5.0, avg_score - 0.5) if scores else 7.8, "total_tasks": len(graded_subs)},
        {"category": "Reading", "score": min(10.0, avg_score + 0.8) if scores else 9.0, "total_tasks": len(graded_subs)},
        {"category": "Listening", "score": avg_score if scores else 8.2, "total_tasks": len(graded_subs)},
        {"category": "Speaking", "score": max(6.0, avg_score - 0.2) if scores else 8.0, "total_tasks": len(graded_subs)}
    ]

    return {
        "student": {
            "id": stu.id,
            "login": stu.login,
            "initial_password": stu.initial_password or "Pass2026!",
            "status": stu.status or "ACTIVE",
            "telegram_id": stu.telegram_id,
            "full_name": stu.full_name,
            "first_name": stu.first_name,
            "last_name": stu.last_name,
            "username": stu.username,
            "phone": stu.phone,
            "notes": stu.notes,
            "joined_date": stu.created_at.strftime("%d %B %Y"),
            "last_seen": stu.last_seen_at.strftime("%d %b %Y, %H:%M"),
            "last_login": stu.last_login_at.strftime("%d %b %Y, %H:%M") if stu.last_login_at else None,
            "groups": [gm.group.name for gm in stu.group_memberships if gm.group],
            "group_id": stu.group_memberships[0].group_id if stu.group_memberships else None
        },
        "stats": {
            "total_assigned": len(stu.submissions),
            "completed": len(graded_subs),
            "pending": len([s for s in stu.submissions if s.status in ["SUBMITTED", "REVIEWING"]]),
            "late": len([s for s in stu.submissions if s.is_late]),
            "average_score": avg_score,
            "completion_rate": round((len(graded_subs) / max(len(stu.submissions), 1)) * 100, 1)
        },
        "skills": skills,
        "history": history
    }

@router.get("/groups", response_model=List[GroupResponse])
async def list_groups(
    teacher: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """Lists all study groups."""
    stmt = select(Group).options(selectinload(Group.members)).order_by(asc(Group.name))
    res = await db.execute(stmt)
    groups = res.scalars().all()

    items = []
    for g in groups:
        items.append(GroupResponse(
            id=g.id,
            name=g.name,
            description=g.description,
            level=g.level,
            created_at=g.created_at,
            member_count=len(g.members)
        ))
    return items

@router.post("/groups", response_model=GroupResponse)
async def create_group(
    payload: GroupCreate,
    teacher: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """Creates a new study group."""
    group = Group(
        id=str(uuid.uuid4()),
        name=payload.name,
        description=payload.description,
        level=payload.level,
        created_at=datetime.now(timezone.utc)
    )
    db.add(group)
    await db.commit()
    await db.refresh(group)

    await log_action(db, teacher.id, "GROUP_CREATED", "GROUP", group.id, {"name": group.name})

    return GroupResponse(
        id=group.id,
        name=group.name,
        description=group.description,
        level=group.level,
        created_at=group.created_at,
        member_count=0
    )

@router.put("/groups/{group_id}", response_model=GroupResponse)
async def update_group(
    group_id: str,
    payload: GroupUpdate,
    teacher: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """Updates an existing study group."""
    stmt = select(Group).options(selectinload(Group.members)).where(Group.id == group_id)
    res = await db.execute(stmt)
    group = res.scalar_one_or_none()

    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study group not found."
        )

    if payload.name is not None:
        group.name = payload.name.strip()
    if payload.description is not None:
        group.description = payload.description.strip() if payload.description else None
    if payload.level is not None:
        group.level = payload.level

    await db.commit()
    await db.refresh(group)

    await log_action(db, teacher.id, "GROUP_UPDATED", "GROUP", group.id, {
        "name": group.name,
        "level": group.level
    })

    return GroupResponse(
        id=group.id,
        name=group.name,
        description=group.description,
        level=group.level,
        created_at=group.created_at,
        member_count=len(group.members)
    )

@router.delete("/groups/{group_id}")
async def delete_group(
    group_id: str,
    teacher: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """Deletes an existing study group and safely unlinks associated records."""
    stmt = select(Group).where(Group.id == group_id)
    res = await db.execute(stmt)
    group = res.scalar_one_or_none()

    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study group not found."
        )

    # 1. Unlink target_group_id from assignments
    await db.execute(
        update(Assignment).where(Assignment.target_group_id == group_id).values(target_group_id=None)
    )

    # 2. Unlink target_group_id from lessons
    await db.execute(
        update(Lesson).where(Lesson.target_group_id == group_id).values(target_group_id=None)
    )

    # 3. Delete group memberships
    await db.execute(
        delete(GroupMember).where(GroupMember.group_id == group_id)
    )

    group_name = group.name
    # 4. Delete the group
    await db.delete(group)
    await db.commit()

    await log_action(db, teacher.id, "GROUP_DELETED", "GROUP", group_id, {"name": group_name})

    return {"success": True, "message": f"Group '{group_name}' successfully deleted."}

# ==============================================================================
# ANALYTICS & EXPORT
# ==============================================================================

@router.get("/analytics")
async def get_teacher_analytics(
    teacher: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Teacher analytics with radar breakdown, completion rates, and performance trends.
    Calculates live statistics directly from actual submissions in the database.
    Starts cleanly from 0 when no submissions exist.
    """
    res_scores = await db.execute(
        select(Submission.total_score, Submission.max_score).where(
            and_(Submission.status == "GRADED", Submission.total_score.isnot(None))
        )
    )
    graded_rows = res_scores.all()
    avg_score = round(sum(r[0] for r in graded_rows) / max(len(graded_rows), 1), 1) if graded_rows else 0.0

    categories = [
        ("Grammar", ["GRAMMAR", "FILL_BLANKS", "TRUE_FALSE"]),
        ("Vocabulary", ["VOCABULARY", "MATCHING"]),
        ("Writing", ["WRITING", "PICTURE_DESCRIPTION"]),
        ("Reading", ["READING", "MULTIPLE_CHOICE"]),
        ("Listening", ["LISTENING"]),
        ("Speaking", ["SPEAKING", "VOICE"])
    ]

    skills = []
    for cat_name, type_filters in categories:
        stmt = (
            select(Submission.total_score, Submission.max_score)
            .join(Assignment, Submission.assignment_id == Assignment.id)
            .where(
                and_(
                    Submission.status == "GRADED",
                    Submission.total_score.isnot(None),
                    or_(*[Assignment.type.ilike(f"%{tf}%") for tf in type_filters])
                )
            )
        )
        cat_res = await db.execute(stmt)
        cat_rows = cat_res.all()
        if cat_rows:
            scores_10 = [(r[0] / max(r[1], 1)) * 10 for r in cat_rows if r[1] and r[1] > 0]
            cat_avg = round(sum(scores_10) / len(scores_10), 1) if scores_10 else 0.0
            cat_count = len(cat_rows)
        else:
            cat_avg = 0.0
            cat_count = 0
        skills.append({"category": cat_name, "score": cat_avg, "total_tasks": cat_count})

    now = datetime.now(timezone.utc)
    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    week_ago = now - timedelta(days=7)

    sub_res = await db.execute(
        select(Submission.submitted_at).where(
            and_(Submission.submitted_at.isnot(None), Submission.submitted_at >= week_ago)
        )
    )
    sub_dates = [r[0] for r in sub_res.all()]

    day_counts = {d: 0 for d in day_names}
    for sd in sub_dates:
        if sd:
            d_name = sd.strftime("%a")
            if d_name in day_counts:
                day_counts[d_name] += 1

    weekly_submissions = [{"day": d, "count": day_counts[d]} for d in day_names]
    total_this_week = sum(w["count"] for w in weekly_submissions)

    return {
        "skills_radar": skills,
        "average_score": avg_score,
        "weekly_submissions": weekly_submissions,
        "total_this_week": total_this_week
    }

@router.get("/export-csv")
async def export_submissions_csv(
    teacher: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Exports student submission results as a downloadable CSV.
    """
    stmt = (
        select(Submission)
        .options(
            selectinload(Submission.student),
            selectinload(Submission.assignment)
        )
        .where(Submission.status != "DRAFT")
        .order_by(desc(Submission.submitted_at))
    )
    res = await db.execute(stmt)
    subs = res.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Student Name",
        "Username",
        "Telegram ID",
        "Assignment Title",
        "Task Type",
        "Status",
        "Score",
        "Max Score",
        "Is Late",
        "Submitted At",
        "Reviewed At",
        "Teacher Feedback"
    ])

    for s in subs:
        writer.writerow([
            s.student.full_name if s.student else "Unknown",
            s.student.username or "",
            s.student.telegram_id if s.student else "",
            s.assignment.title if s.assignment else "",
            s.assignment.type if s.assignment else "",
            s.status,
            s.total_score if s.total_score is not None else "",
            s.max_score,
            "YES" if s.is_late else "NO",
            s.submitted_at.strftime("%Y-%m-%d %H:%M:%S") if s.submitted_at else "",
            s.graded_at.strftime("%Y-%m-%d %H:%M:%S") if s.graded_at else "",
            s.teacher_feedback or ""
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=student_results.csv"}
    )

# ==============================================================================
# AUDIT LOGS & VOCABULARY BANK
# ==============================================================================

@router.get("/audit-logs")
async def get_audit_logs(
    limit: int = 50,
    teacher: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """Returns recent teacher audit logs."""
    stmt = select(AuditLog).order_by(desc(AuditLog.created_at)).limit(limit)
    res = await db.execute(stmt)
    return res.scalars().all()

@router.get("/vocabulary")
async def list_vocabulary(
    teacher: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """Returns vocabulary bank items."""
    stmt = select(VocabularyItem).order_by(desc(VocabularyItem.created_at))
    res = await db.execute(stmt)
    return res.scalars().all()
