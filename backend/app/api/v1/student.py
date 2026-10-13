import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, desc
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import require_student, get_current_user
from app.models.user import User
from app.models.group import GroupMember
from app.models.assignment import Assignment, AssignmentQuestion, AssignmentTarget
from app.models.submission import Submission, SubmissionAnswer
from app.models.notification import Notification
from app.schemas.assignment import AssignmentResponse, AssignmentDetailResponse
from app.schemas.submission import (
    SubmissionResponse,
    SubmissionDetailResponse,
    DraftSaveRequest,
    SubmitRequest,
    AnswerResponse
)
from app.schemas.notification import NotificationResponse, NotificationMarkReadRequest
from app.services.grading_service import grade_question_answer, count_words
from app.services.notification_service import notify_teacher_new_submission

router = APIRouter(prefix="/student", tags=["Student WebApp"])

async def get_student_assigned_assignments(db: AsyncSession, student: User):
    """
    Returns all published assignments targeted to this student (ALL, their GROUP, or INDIVIDUAL).
    """
    # 1. Get student's group IDs
    grp_res = await db.execute(
        select(GroupMember.group_id).where(GroupMember.student_id == student.id)
    )
    group_ids = [r[0] for r in grp_res.all()]

    # 2. Query assignments matching targeting
    stmt = (
        select(Assignment)
        .options(selectinload(Assignment.questions), selectinload(Assignment.teacher))
        .where(
            and_(
                Assignment.status == "PUBLISHED",
                or_(
                    Assignment.target_type == "ALL",
                    and_(
                        Assignment.target_type == "GROUP",
                        Assignment.target_group_id.in_(group_ids) if group_ids else False
                    ),
                    and_(
                        Assignment.target_type == "INDIVIDUAL",
                        Assignment.id.in_(
                            select(AssignmentTarget.assignment_id).where(AssignmentTarget.student_id == student.id)
                        )
                    )
                )
            )
        )
        .order_by(desc(Assignment.created_at))
    )
    result = await db.execute(stmt)
    return result.scalars().all()

async def verify_student_assignment_access(db: AsyncSession, assignment: Assignment, student: User) -> bool:
    """Verifies that the student is allowed to view/submit this assignment."""
    if student.role in ["TEACHER", "ADMIN"]:
        return True

    if assignment.status != "PUBLISHED":
        return False

    if assignment.target_type == "ALL":
        return True

    if assignment.target_type == "GROUP" and assignment.target_group_id:
        gm_res = await db.execute(
            select(GroupMember).where(
                and_(
                    GroupMember.group_id == assignment.target_group_id,
                    GroupMember.student_id == student.id
                )
            )
        )
        return gm_res.scalar_one_or_none() is not None

    if assignment.target_type == "INDIVIDUAL":
        t_res = await db.execute(
            select(AssignmentTarget).where(
                and_(
                    AssignmentTarget.assignment_id == assignment.id,
                    AssignmentTarget.student_id == student.id
                )
            )
        )
        return t_res.scalar_one_or_none() is not None

    return False

def compute_student_assignment_status(assignment: Assignment, submission: Optional[Submission]) -> tuple[str, int, Optional[float]]:
    """
    Determines assignment status for student:
    NEW, IN PROGRESS, SUBMITTED, REVIEWING, GRADED, LATE, MISSED
    Returns: (status, progress_percent, score)
    """
    now = datetime.now(timezone.utc)
    dl = assignment.deadline
    if dl is not None and dl.tzinfo is None:
        dl = dl.replace(tzinfo=timezone.utc)
    is_past_deadline = dl is not None and now > dl

    if not submission:
        if is_past_deadline:
            return "MISSED", 0, None
        return "NEW", 0, None

    if submission.status == "GRADED":
        return "GRADED", 100, submission.total_score
    elif submission.status == "REVIEWING":
        return "REVIEWING", 100, None
    elif submission.status == "SUBMITTED":
        return "SUBMITTED", 100, None
    elif submission.status == "RETURNED":
        return "RETURNED", 50, None
    elif submission.status == "DRAFT":
        total_q = len(assignment.questions) if assignment.questions else 1
        answered_q = 0
        if submission.answers:
            for a in submission.answers:
                if (a.text_answer and a.text_answer.strip()) or a.selected_options is not None or a.audio_url or a.file_url:
                    answered_q += 1
        real_progress = min(int((answered_q / total_q) * 100), 99)
        stat = "LATE" if is_past_deadline else "IN PROGRESS"
        return stat, max(real_progress, 10 if answered_q > 0 else 0), None

    return "NEW", 0, None

@router.get("/home")
async def get_student_home(student: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """
    Home page feed: Active homework list with clean card data,
    status badges, progress indicators, deadlines, and student name.
    """
    assignments = await get_student_assigned_assignments(db, student)
    
    # Fetch student's submissions
    sub_res = await db.execute(
        select(Submission)
        .options(selectinload(Submission.answers))
        .where(Submission.student_id == student.id)
    )
    submissions_by_assignment = {sub.assignment_id: sub for sub in sub_res.scalars().all()}

    assignment_cards = []
    total_completed = 0
    total_scores = []

    for a in assignments:
        sub = submissions_by_assignment.get(a.id)
        stat, progress, score = compute_student_assignment_status(a, sub)
        
        if stat == "GRADED" and score is not None:
            total_completed += 1
            total_scores.append((score / a.points) * 100)
        elif stat in ["SUBMITTED", "REVIEWING"]:
            total_completed += 1

        assignment_cards.append({
            "id": a.id,
            "title": a.title,
            "description": a.description,
            "type": a.type,
            "difficulty": a.difficulty,
            "teacher_name": a.teacher.full_name if a.teacher else "English Teacher",
            "deadline": a.deadline.isoformat() if a.deadline else None,
            "points": a.points,
            "estimated_time_minutes": a.estimated_time_minutes,
            "status": stat,
            "progress_percent": progress,
            "score": score,
            "submission_id": sub.id if sub else None,
            "allow_late_submission": a.allow_late_submission
        })

    avg_score = round(sum(total_scores) / len(total_scores), 1) if total_scores else 0.0

    return {
        "student": {
            "id": student.id,
            "full_name": student.full_name,
            "first_name": student.first_name,
            "username": student.username,
        },
        "stats": {
            "total_assigned": len(assignments),
            "completed": total_completed,
            "pending": len(assignments) - total_completed,
            "average_score_percent": avg_score
        },
        "active_homework": [c for c in assignment_cards if c["status"] not in ["GRADED"]],
        "all_homework": assignment_cards
    }

@router.get("/assignments/{assignment_id}")
async def get_assignment_detail(
    assignment_id: str,
    student: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns single assignment detail including questions, media, and
    existing draft answers if any.
    """
    stmt = (
        select(Assignment)
        .options(
            selectinload(Assignment.questions),
            selectinload(Assignment.teacher)
        )
        .where(Assignment.id == assignment_id)
    )
    res = await db.execute(stmt)
    assignment = res.scalar_one_or_none()

    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    has_access = await verify_student_assignment_access(db, assignment, student)
    if not has_access:
        raise HTTPException(status_code=403, detail="You do not have access to this assignment")

    # Fetch existing submission/draft
    sub_stmt = (
        select(Submission)
        .options(selectinload(Submission.answers))
        .where(
            and_(
                Submission.assignment_id == assignment_id,
                Submission.student_id == student.id
            )
        )
    )
    sub_res = await db.execute(sub_stmt)
    submission = sub_res.scalar_one_or_none()

    existing_answers = {}
    if submission:
        for ans in submission.answers:
            existing_answers[ans.question_id] = {
                "id": ans.id,
                "text_answer": ans.text_answer,
                "selected_options": ans.selected_options,
                "audio_url": ans.audio_url,
                "audio_duration": ans.audio_duration,
                "file_url": ans.file_url,
                "word_count": ans.word_count,
                "audio_plays_count": ans.audio_plays_count
            }

    stat, progress, score = compute_student_assignment_status(assignment, submission)

    # Questions list (masking correct answers if not graded)
    questions_data = []
    for q in sorted(assignment.questions, key=lambda x: x.order):
        q_dict = {
            "id": q.id,
            "order": q.order,
            "type": q.type,
            "question_text": q.question_text,
            "description": q.description,
            "passage": q.passage,
            "media_url": q.media_url,
            "media_type": q.media_type,
            "media_duration": q.media_duration,
            "transcript": q.transcript if assignment.show_transcript else None,
            "options": q.options,
            "min_words": q.min_words,
            "max_words": q.max_words,
            "points": q.points,
            "is_required": q.is_required,
            "saved_answer": existing_answers.get(q.id)
        }
        questions_data.append(q_dict)

    return {
        "assignment": {
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
            "teacher_name": assignment.teacher.full_name if assignment.teacher else "English Teacher"
        },
        "student_status": stat,
        "submission": {
            "id": submission.id if submission else None,
            "status": submission.status if submission else "NEW",
            "submitted_at": submission.submitted_at.isoformat() if (submission and submission.submitted_at) else None,
            "total_score": submission.total_score if submission else None,
            "teacher_feedback": submission.teacher_feedback if submission else None
        } if submission else None,
        "questions": questions_data
    }

@router.post("/assignments/{assignment_id}/draft")
async def save_draft(
    assignment_id: str,
    payload: DraftSaveRequest,
    student: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Debounced autosave endpoint for homework answers.
    Saves state with status='DRAFT' without final submission.
    """
    res = await db.execute(select(Assignment).where(Assignment.id == assignment_id))
    assignment = res.scalar_one_or_none()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    has_access = await verify_student_assignment_access(db, assignment, student)
    if not has_access:
        raise HTTPException(status_code=403, detail="You do not have access to this assignment")

    # Find or create draft submission
    sub_res = await db.execute(
        select(Submission)
        .options(selectinload(Submission.answers))
        .where(
            and_(
                Submission.assignment_id == assignment_id,
                Submission.student_id == student.id
            )
        )
    )
    submission = sub_res.scalar_one_or_none()

    if submission and submission.status in ["SUBMITTED", "REVIEWING", "GRADED"] and not assignment.allow_edit_after_submit:
        raise HTTPException(status_code=400, detail="Cannot save draft: Homework already submitted")

    if not submission:
        submission = Submission(
            id=str(uuid.uuid4()),
            assignment_id=assignment_id,
            student_id=student.id,
            status="DRAFT",
            max_score=assignment.points,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        db.add(submission)
        await db.flush()

    # Update or insert answers
    ans_stmt = select(SubmissionAnswer).where(SubmissionAnswer.submission_id == submission.id)
    ans_res = await db.execute(ans_stmt)
    existing_answers_map = {ans.question_id: ans for ans in ans_res.scalars().all()}
    for ans_input in payload.answers:
        w_count = count_words(ans_input.text_answer) if ans_input.text_answer else None
        if ans_input.question_id in existing_answers_map:
            db_ans = existing_answers_map[ans_input.question_id]
            db_ans.text_answer = ans_input.text_answer
            db_ans.selected_options = ans_input.selected_options
            db_ans.audio_url = ans_input.audio_url
            db_ans.audio_duration = ans_input.audio_duration
            db_ans.file_url = ans_input.file_url
            db_ans.word_count = w_count
            db_ans.audio_plays_count = ans_input.audio_plays_count or db_ans.audio_plays_count
        else:
            db_ans = SubmissionAnswer(
                id=str(uuid.uuid4()),
                submission_id=submission.id,
                question_id=ans_input.question_id,
                text_answer=ans_input.text_answer,
                selected_options=ans_input.selected_options,
                audio_url=ans_input.audio_url,
                audio_duration=ans_input.audio_duration,
                file_url=ans_input.file_url,
                word_count=w_count,
                audio_plays_count=ans_input.audio_plays_count or 0
            )
            db.add(db_ans)

    submission.updated_at = datetime.now(timezone.utc)
    await db.commit()

    return {"status": "saved", "message": "Draft saved ✓", "submission_id": submission.id}

@router.post("/assignments/{assignment_id}/submit")
async def submit_homework(
    assignment_id: str,
    payload: SubmitRequest,
    student: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Submits homework for grading.
    Validates deadline, calculates late status, evaluates auto-gradable questions,
    and alerts the teacher.
    """
    res = await db.execute(
        select(Assignment)
        .options(selectinload(Assignment.questions), selectinload(Assignment.teacher))
        .where(Assignment.id == assignment_id)
    )
    assignment = res.scalar_one_or_none()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    has_access = await verify_student_assignment_access(db, assignment, student)
    if not has_access:
        raise HTTPException(status_code=403, detail="You do not have access to this assignment")

    now = datetime.now(timezone.utc)
    is_late = False
    late_minutes = 0

    dl = assignment.deadline
    if dl is not None and dl.tzinfo is None:
        dl = dl.replace(tzinfo=timezone.utc)

    if dl and now > dl:
        if not assignment.allow_late_submission:
            raise HTTPException(
                status_code=400,
                detail="The deadline for this assignment has passed and late submissions are closed."
            )
        is_late = True
        late_minutes = int((now - dl).total_seconds() / 60)

    # Find or create submission
    sub_res = await db.execute(
        select(Submission)
        .options(selectinload(Submission.answers))
        .where(
            and_(
                Submission.assignment_id == assignment_id,
                Submission.student_id == student.id
            )
        )
    )
    submission = sub_res.scalar_one_or_none()

    if submission and submission.status in ["SUBMITTED", "REVIEWING", "GRADED"] and not assignment.allow_edit_after_submit:
        raise HTTPException(status_code=400, detail="Assignment has already been submitted.")

    if not submission:
        submission = Submission(
            id=str(uuid.uuid4()),
            assignment_id=assignment_id,
            student_id=student.id,
            max_score=assignment.points,
            created_at=now
        )
        db.add(submission)
        await db.flush()

    submission.is_late = is_late
    submission.late_by_minutes = late_minutes
    submission.submitted_at = now
    submission.updated_at = now

    # Map existing questions and answers
    questions_map = {q.id: q for q in assignment.questions}
    ans_stmt = select(SubmissionAnswer).where(SubmissionAnswer.submission_id == submission.id)
    ans_res = await db.execute(ans_stmt)
    existing_answers_map = {ans.question_id: ans for ans in ans_res.scalars().all()}

    for ans_input in payload.answers:
        q = questions_map.get(ans_input.question_id)
        if not q:
            continue

        w_count = count_words(ans_input.text_answer) if ans_input.text_answer else None

        # Validate minimum word limit if required (e.g. Writing / Picture Description)
        if q.min_words and (w_count or 0) < q.min_words:
            raise HTTPException(
                status_code=400,
                detail=f"Question '{q.question_text[:30]}...' requires at least {q.min_words} words. Current count: {w_count or 0} words."
            )

        if ans_input.question_id in existing_answers_map:
            db_ans = existing_answers_map[ans_input.question_id]
            db_ans.text_answer = ans_input.text_answer
            db_ans.selected_options = ans_input.selected_options
            db_ans.audio_url = ans_input.audio_url
            db_ans.audio_duration = ans_input.audio_duration
            db_ans.file_url = ans_input.file_url
            db_ans.word_count = w_count
            db_ans.audio_plays_count = ans_input.audio_plays_count or db_ans.audio_plays_count
        else:
            db_ans = SubmissionAnswer(
                id=str(uuid.uuid4()),
                submission_id=submission.id,
                question_id=ans_input.question_id,
                text_answer=ans_input.text_answer,
                selected_options=ans_input.selected_options,
                audio_url=ans_input.audio_url,
                audio_duration=ans_input.audio_duration,
                file_url=ans_input.file_url,
                word_count=w_count,
                audio_plays_count=ans_input.audio_plays_count or 0
            )
            db.add(db_ans)

        # Run auto-grading evaluation
        auto_score, auto_feedback = grade_question_answer(q, db_ans)
        if auto_score is not None:
            db_ans.auto_score = auto_score
            db_ans.feedback = auto_feedback

    await db.flush()

    # Determine if all questions were auto-graded or need teacher review
    await db.refresh(submission)
    sub_ans_res = await db.execute(select(SubmissionAnswer).where(SubmissionAnswer.submission_id == submission.id))
    all_answers = sub_ans_res.scalars().all()

    all_auto_graded = True
    total_auto_score = 0.0

    for a in all_answers:
        if a.auto_score is None:
            all_auto_graded = False
        else:
            total_auto_score += a.auto_score

    if all_auto_graded and len(all_answers) == len(assignment.questions):
        submission.status = "GRADED"
        submission.total_score = min(total_auto_score, assignment.points)
        submission.graded_at = now
        submission.teacher_feedback = "Automatically evaluated ✓"
    else:
        submission.status = "SUBMITTED"

    await db.commit()
    await db.refresh(submission)

    # Notify teacher asynchronously
    await notify_teacher_new_submission(db, submission, assignment, student, assignment.teacher)

    return {
        "status": submission.status,
        "submission_id": submission.id,
        "message": "✓ Homework submitted successfully",
        "submitted_at": submission.submitted_at.isoformat(),
        "is_late": submission.is_late,
        "total_score": submission.total_score
    }

@router.get("/results")
async def get_student_results(
    student: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns list of all completed/reviewed homework with scores and teacher feedback.
    """
    stmt = (
        select(Submission)
        .options(
            selectinload(Submission.assignment),
            selectinload(Submission.grader)
        )
        .where(
            and_(
                Submission.student_id == student.id,
                Submission.status.in_(["GRADED", "REVIEWING"])
            )
        )
        .order_by(desc(Submission.graded_at), desc(Submission.submitted_at))
    )
    result = await db.execute(stmt)
    submissions = result.scalars().all()

    items = []
    for sub in submissions:
        items.append({
            "submission_id": sub.id,
            "assignment_id": sub.assignment_id,
            "title": sub.assignment.title if sub.assignment else "Homework",
            "type": sub.assignment.type if sub.assignment else "WRITING",
            "score": sub.total_score,
            "max_score": sub.max_score,
            "percentage": round((sub.total_score / sub.max_score) * 100, 1) if (sub.total_score and sub.max_score) else None,
            "status": sub.status,
            "teacher_feedback": sub.teacher_feedback,
            "submitted_at": sub.submitted_at.isoformat() if sub.submitted_at else None,
            "graded_at": sub.graded_at.isoformat() if sub.graded_at else None,
        })
    return items

@router.get("/results/{submission_id}")
async def get_submission_result_detail(
    submission_id: str,
    student: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns detailed view of a submission with per-question reviews and answers.
    """
    stmt = (
        select(Submission)
        .options(
            selectinload(Submission.assignment).selectinload(Assignment.questions),
            selectinload(Submission.answers).selectinload(SubmissionAnswer.question),
            selectinload(Submission.grader)
        )
        .where(
            and_(
                Submission.id == submission_id,
                Submission.student_id == student.id
            )
        )
    )
    res = await db.execute(stmt)
    sub = res.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission result not found")

    answers_data = []
    for a in sub.answers:
        q = a.question
        answers_data.append({
            "question_id": a.question_id,
            "question_text": q.question_text if q else "",
            "type": q.type if q else "",
            "media_url": q.media_url if q else None,
            "student_answer": a.text_answer,
            "selected_options": a.selected_options,
            "audio_url": a.audio_url,
            "file_url": a.file_url,
            "word_count": a.word_count,
            "score": a.manual_score if a.manual_score is not None else a.auto_score,
            "max_points": q.points if q else 1.0,
            "feedback": a.feedback
        })

    return {
        "submission_id": sub.id,
        "assignment_title": sub.assignment.title if sub.assignment else "",
        "assignment_type": sub.assignment.type if sub.assignment else "",
        "status": sub.status,
        "is_late": sub.is_late,
        "total_score": sub.total_score,
        "max_score": sub.max_score,
        "teacher_feedback": sub.teacher_feedback,
        "submitted_at": sub.submitted_at.isoformat() if sub.submitted_at else None,
        "graded_at": sub.graded_at.isoformat() if sub.graded_at else None,
        "answers": answers_data
    }

@router.get("/notifications", response_model=List[NotificationResponse])
async def get_student_notifications(
    student: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Returns in-app notifications for student."""
    stmt = (
        select(Notification)
        .where(Notification.user_id == student.id)
        .order_by(desc(Notification.created_at))
        .limit(50)
    )
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("/notifications/read")
async def mark_notifications_read(
    payload: NotificationMarkReadRequest,
    student: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Marks student notifications as read."""
    if payload.notification_ids:
        stmt = (
            select(Notification)
            .where(
                and_(
                    Notification.user_id == student.id,
                    Notification.id.in_(payload.notification_ids)
                )
            )
        )
    else:
        stmt = select(Notification).where(Notification.user_id == student.id)

    res = await db.execute(stmt)
    for notif in res.scalars().all():
        notif.is_read = True

    await db.commit()
    return {"status": "ok"}
