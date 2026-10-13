from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime, timezone

from app.core.database import get_db
from app.models.user import User
from app.models.lesson import Lesson, LessonProgress, LessonTarget
from app.models.assignment import Assignment
from app.models.submission import Submission
from app.models.group import GroupMember
from app.schemas.lesson import (
    LessonCreate,
    LessonUpdate,
    LessonProgressUpdate,
    LessonResponse,
    StudentLessonListItem,
    StudentLessonDetail,
    AttachedAssignmentSummary,
)
from app.core.security import require_teacher_or_admin, require_student, get_current_user

router = APIRouter(tags=["Lessons"])

# ==========================================
# TEACHER / ADMIN LESSON ENDPOINTS
# ==========================================

@router.get("/teacher/lessons", response_model=List[LessonResponse])
async def get_teacher_lessons(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_teacher_or_admin)
):
    """Retrieve all lessons created for teaching with attached homework metadata."""
    stmt = (
        select(Lesson)
        .options(selectinload(Lesson.attached_assignment))
        .order_by(Lesson.order.asc(), Lesson.created_at.asc())
    )
    result = await db.execute(stmt)
    lessons = result.scalars().all()

    response = []
    for l in lessons:
        att = None
        if l.attached_assignment:
            att = AttachedAssignmentSummary(
                id=l.attached_assignment.id,
                title=l.attached_assignment.title,
                type=l.attached_assignment.type,
                points=l.attached_assignment.points,
                deadline=l.attached_assignment.deadline,
            )
        response.append(
            LessonResponse(
                id=l.id,
                teacher_id=l.teacher_id,
                title=l.title,
                description=l.description,
                content=l.content,
                media_type=l.media_type,
                media_url=l.media_url,
                media_duration=l.media_duration,
                vocabulary=l.vocabulary or [],
                exercises=l.exercises or [],
                attached_assignment_id=l.attached_assignment_id,
                order=l.order,
                target_type=l.target_type,
                target_group_id=l.target_group_id,
                status=l.status,
                estimated_time_minutes=l.estimated_time_minutes,
                created_at=l.created_at,
                updated_at=l.updated_at,
                attached_assignment=att,
            )
        )
    return response


@router.post("/teacher/lessons", response_model=LessonResponse, status_code=status.HTTP_201_CREATED)
async def create_lesson(
    payload: LessonCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_teacher_or_admin)
):
    """Create a new lesson with rich content, media, vocabulary, exercises, and attached homework."""
    lesson = Lesson(
        teacher_id=current_user.id,
        title=payload.title,
        description=payload.description,
        content=payload.content,
        media_type=payload.media_type,
        media_url=payload.media_url,
        media_duration=payload.media_duration,
        vocabulary=payload.vocabulary,
        exercises=payload.exercises,
        attached_assignment_id=payload.attached_assignment_id,
        order=payload.order,
        target_type=payload.target_type,
        target_group_id=payload.target_group_id,
        status=payload.status,
        estimated_time_minutes=payload.estimated_time_minutes,
    )
    db.add(lesson)
    await db.flush()

    if payload.target_type == "INDIVIDUAL" and payload.target_student_ids:
        for s_id in payload.target_student_ids:
            target = LessonTarget(lesson_id=lesson.id, student_id=s_id)
            db.add(target)

    await db.commit()
    await db.refresh(lesson)

    att = None
    if lesson.attached_assignment_id:
        ass_res = await db.execute(select(Assignment).where(Assignment.id == lesson.attached_assignment_id))
        ass = ass_res.scalar_one_or_none()
        if ass:
            att = AttachedAssignmentSummary(
                id=ass.id,
                title=ass.title,
                type=ass.type,
                points=ass.points,
                deadline=ass.deadline,
            )

    return LessonResponse(
        id=lesson.id,
        teacher_id=lesson.teacher_id,
        title=lesson.title,
        description=lesson.description,
        content=lesson.content,
        media_type=lesson.media_type,
        media_url=lesson.media_url,
        media_duration=lesson.media_duration,
        vocabulary=lesson.vocabulary or [],
        exercises=lesson.exercises or [],
        attached_assignment_id=lesson.attached_assignment_id,
        order=lesson.order,
        target_type=lesson.target_type,
        target_group_id=lesson.target_group_id,
        status=lesson.status,
        estimated_time_minutes=lesson.estimated_time_minutes,
        created_at=lesson.created_at,
        updated_at=lesson.updated_at,
        attached_assignment=att,
    )


@router.get("/teacher/lessons/{lesson_id}", response_model=LessonResponse)
async def get_teacher_lesson_detail(
    lesson_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_teacher_or_admin)
):
    """Get single lesson details for editing or viewing."""
    stmt = (
        select(Lesson)
        .options(selectinload(Lesson.attached_assignment))
        .where(Lesson.id == lesson_id)
    )
    res = await db.execute(stmt)
    lesson = res.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    att = None
    if lesson.attached_assignment:
        att = AttachedAssignmentSummary(
            id=lesson.attached_assignment.id,
            title=lesson.attached_assignment.title,
            type=lesson.attached_assignment.type,
            points=lesson.attached_assignment.points,
            deadline=lesson.attached_assignment.deadline,
        )

    return LessonResponse(
        id=lesson.id,
        teacher_id=lesson.teacher_id,
        title=lesson.title,
        description=lesson.description,
        content=lesson.content,
        media_type=lesson.media_type,
        media_url=lesson.media_url,
        media_duration=lesson.media_duration,
        vocabulary=lesson.vocabulary or [],
        exercises=lesson.exercises or [],
        attached_assignment_id=lesson.attached_assignment_id,
        order=lesson.order,
        target_type=lesson.target_type,
        target_group_id=lesson.target_group_id,
        status=lesson.status,
        estimated_time_minutes=lesson.estimated_time_minutes,
        created_at=lesson.created_at,
        updated_at=lesson.updated_at,
        attached_assignment=att,
    )


@router.put("/teacher/lessons/{lesson_id}", response_model=LessonResponse)
async def update_lesson(
    lesson_id: str,
    payload: LessonUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_teacher_or_admin)
):
    """Update lesson parameters, content, media, exercises, and publishing status."""
    stmt = select(Lesson).where(Lesson.id == lesson_id)
    res = await db.execute(stmt)
    lesson = res.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    update_data = payload.model_dump(exclude_unset=True)
    target_student_ids = update_data.pop("target_student_ids", None)

    for field, val in update_data.items():
        setattr(lesson, field, val)

    if lesson.target_type == "INDIVIDUAL" and target_student_ids is not None:
        await db.execute(LessonTarget.__table__.delete().where(LessonTarget.lesson_id == lesson.id))
        for s_id in target_student_ids:
            target = LessonTarget(lesson_id=lesson.id, student_id=s_id)
            db.add(target)

    await db.commit()
    await db.refresh(lesson)

    att = None
    if lesson.attached_assignment_id:
        ass_res = await db.execute(select(Assignment).where(Assignment.id == lesson.attached_assignment_id))
        ass = ass_res.scalar_one_or_none()
        if ass:
            att = AttachedAssignmentSummary(
                id=ass.id,
                title=ass.title,
                type=ass.type,
                points=ass.points,
                deadline=ass.deadline,
            )

    return LessonResponse(
        id=lesson.id,
        teacher_id=lesson.teacher_id,
        title=lesson.title,
        description=lesson.description,
        content=lesson.content,
        media_type=lesson.media_type,
        media_url=lesson.media_url,
        media_duration=lesson.media_duration,
        vocabulary=lesson.vocabulary or [],
        exercises=lesson.exercises or [],
        attached_assignment_id=lesson.attached_assignment_id,
        order=lesson.order,
        target_type=lesson.target_type,
        target_group_id=lesson.target_group_id,
        status=lesson.status,
        estimated_time_minutes=lesson.estimated_time_minutes,
        created_at=lesson.created_at,
        updated_at=lesson.updated_at,
        attached_assignment=att,
    )


@router.delete("/teacher/lessons/{lesson_id}", status_code=status.HTTP_200_OK)
async def delete_lesson(
    lesson_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_teacher_or_admin)
):
    """Delete a lesson."""
    stmt = select(Lesson).where(Lesson.id == lesson_id)
    res = await db.execute(stmt)
    lesson = res.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    await db.delete(lesson)
    await db.commit()
    return {"message": "Lesson deleted successfully"}


@router.get("/teacher/lessons/{lesson_id}/progress")
async def get_teacher_lesson_progress(
    lesson_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_teacher_or_admin)
):
    """Get all student progress records for a specific lesson."""
    stmt = (
        select(LessonProgress)
        .options(selectinload(LessonProgress.student))
        .where(LessonProgress.lesson_id == lesson_id)
    )
    res = await db.execute(stmt)
    records = res.scalars().all()

    return [
        {
            "student_id": r.student_id,
            "student_name": f"{r.student.first_name} {r.student.last_name or ''}".strip() if r.student else "Student",
            "username": r.student.username if r.student else None,
            "status": r.status,
            "progress_percent": r.progress_percent,
            "last_accessed_at": r.last_accessed_at.isoformat(),
            "completed_at": r.completed_at.isoformat() if r.completed_at else None,
        }
        for r in records
    ]


# ==========================================
# STUDENT LESSON ENDPOINTS
# ==========================================

@router.get("/student/lessons", response_model=List[StudentLessonListItem])
async def get_student_lessons(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """Retrieve all published lessons available to the logged-in student with progress indicators."""
    # Find student's groups
    grp_res = await db.execute(select(GroupMember.group_id).where(GroupMember.student_id == current_user.id))
    group_ids = [r[0] for r in grp_res.all()]

    # Query published lessons matching targeting criteria
    stmt = (
        select(Lesson)
        .options(selectinload(Lesson.attached_assignment))
        .where(
            and_(
                Lesson.status == "PUBLISHED",
                or_(
                    Lesson.target_type == "ALL",
                    and_(Lesson.target_type == "GROUP", Lesson.target_group_id.in_(group_ids)),
                    and_(
                        Lesson.target_type == "INDIVIDUAL",
                        Lesson.id.in_(
                            select(LessonTarget.lesson_id).where(LessonTarget.student_id == current_user.id)
                        ),
                    ),
                ),
            )
        )
        .order_by(Lesson.order.asc(), Lesson.created_at.asc())
    )
    res = await db.execute(stmt)
    lessons = res.scalars().all()

    # Query student's progress for these lessons
    lesson_ids = [l.id for l in lessons]
    progress_map = {}
    if lesson_ids:
        prog_stmt = select(LessonProgress).where(
            and_(
                LessonProgress.student_id == current_user.id,
                LessonProgress.lesson_id.in_(lesson_ids)
            )
        )
        prog_res = await db.execute(prog_stmt)
        for p in prog_res.scalars().all():
            progress_map[p.lesson_id] = p

    response = []
    for l in lessons:
        prog = progress_map.get(l.id)
        has_audio = l.media_type == "audio" or bool(l.media_url and (l.media_url.endswith(".mp3") or l.media_url.endswith(".wav")))
        has_voc = bool(l.vocabulary and len(l.vocabulary) > 0)
        has_ex = bool(l.exercises and len(l.exercises) > 0)

        response.append(
            StudentLessonListItem(
                id=l.id,
                order=l.order,
                title=l.title,
                description=l.description,
                media_type=l.media_type,
                estimated_time_minutes=l.estimated_time_minutes,
                has_audio=has_audio,
                has_vocabulary=has_voc,
                has_exercises=has_ex,
                attached_assignment_id=l.attached_assignment_id,
                attached_assignment_title=l.attached_assignment.title if l.attached_assignment else None,
                student_status=prog.status if prog else "NOT_STARTED",
                progress_percent=prog.progress_percent if prog else 0,
                completed_at=prog.completed_at if prog else None,
            )
        )

    return response


@router.get("/student/lessons/{lesson_id}", response_model=StudentLessonDetail)
async def get_student_lesson_detail(
    lesson_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """Open a lesson, retrieve theory, media, vocabulary, exercises, and mark progress as IN_PROGRESS."""
    stmt = (
        select(Lesson)
        .options(selectinload(Lesson.attached_assignment))
        .where(and_(Lesson.id == lesson_id, Lesson.status == "PUBLISHED"))
    )
    res = await db.execute(stmt)
    lesson = res.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    # Record or update progress to IN_PROGRESS if not already completed
    prog_stmt = select(LessonProgress).where(
        and_(LessonProgress.lesson_id == lesson_id, LessonProgress.student_id == current_user.id)
    )
    prog_res = await db.execute(prog_stmt)
    prog = prog_res.scalar_one_or_none()

    now = datetime.now(timezone.utc)
    if not prog:
        prog = LessonProgress(
            lesson_id=lesson_id,
            student_id=current_user.id,
            status="IN_PROGRESS",
            progress_percent=30,
            last_accessed_at=now,
        )
        db.add(prog)
        await db.commit()
        await db.refresh(prog)
    else:
        prog.last_accessed_at = now
        await db.commit()

    # If homework is attached, check student's submission status on that homework
    att = None
    if lesson.attached_assignment:
        sub_stmt = select(Submission).where(
            and_(
                Submission.assignment_id == lesson.attached_assignment.id,
                Submission.student_id == current_user.id
            )
        )
        sub_res = await db.execute(sub_stmt)
        sub = sub_res.scalar_one_or_none()

        att = AttachedAssignmentSummary(
            id=lesson.attached_assignment.id,
            title=lesson.attached_assignment.title,
            type=lesson.attached_assignment.type,
            points=lesson.attached_assignment.points,
            deadline=lesson.attached_assignment.deadline,
            status=sub.status if sub else "NOT_STARTED",
            score=sub.total_score if sub else None,
        )

    return StudentLessonDetail(
        id=lesson.id,
        order=lesson.order,
        title=lesson.title,
        description=lesson.description,
        content=lesson.content,
        media_type=lesson.media_type,
        media_url=lesson.media_url,
        media_duration=lesson.media_duration,
        vocabulary=lesson.vocabulary or [],
        exercises=lesson.exercises or [],
        estimated_time_minutes=lesson.estimated_time_minutes,
        student_status=prog.status,
        progress_percent=prog.progress_percent,
        completed_at=prog.completed_at,
        attached_assignment=att,
    )


@router.post("/student/lessons/{lesson_id}/progress")
async def update_student_lesson_progress(
    lesson_id: str,
    payload: LessonProgressUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """Mark lesson as completed or update completion percentage."""
    stmt = select(Lesson).where(and_(Lesson.id == lesson_id, Lesson.status == "PUBLISHED"))
    res = await db.execute(stmt)
    lesson = res.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    prog_stmt = select(LessonProgress).where(
        and_(LessonProgress.lesson_id == lesson_id, LessonProgress.student_id == current_user.id)
    )
    prog_res = await db.execute(prog_stmt)
    prog = prog_res.scalar_one_or_none()

    now = datetime.now(timezone.utc)
    if not prog:
        prog = LessonProgress(
            lesson_id=lesson_id,
            student_id=current_user.id,
            status=payload.status,
            progress_percent=payload.progress_percent,
            last_accessed_at=now,
            completed_at=now if payload.status == "COMPLETED" else None,
            notes=payload.notes,
        )
        db.add(prog)
    else:
        prog.status = payload.status
        prog.progress_percent = payload.progress_percent
        prog.last_accessed_at = now
        if payload.status == "COMPLETED" and not prog.completed_at:
            prog.completed_at = now
        if payload.notes:
            prog.notes = payload.notes

    await db.commit()
    await db.refresh(prog)

    return {
        "status": prog.status,
        "progress_percent": prog.progress_percent,
        "completed_at": prog.completed_at.isoformat() if prog.completed_at else None,
        "message": "Lesson progress updated successfully ✓",
    }
