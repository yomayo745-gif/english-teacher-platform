import uuid
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, func

from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    verify_telegram_init_data,
    create_access_token,
    get_current_user,
    verify_password,
    check_login_rate_limit,
    record_failed_login,
    clear_failed_logins
)
from app.models.user import User
from app.models.audit import AuditLog
from app.schemas.user import (
    TelegramAuthRequest,
    DevAuthRequest,
    TokenResponse,
    UserResponse,
    StudentLoginRequest,
    TelegramCheckRequest
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/telegram", response_model=TokenResponse)
async def authenticate_telegram(req: TelegramAuthRequest, db: AsyncSession = Depends(get_db)):
    """
    Authenticates a user via official Telegram WebApp initData.
    Verifies HMAC-SHA256 signature, creates or updates the user, and returns a JWT access token.
    """
    user_info = verify_telegram_init_data(req.init_data, settings.TELEGRAM_BOT_TOKEN)
    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Telegram authentication data"
        )

    telegram_id = user_info.get("id")
    if not telegram_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing telegram ID in init data"
        )

    # Find existing user
    result = await db.execute(select(User).where(User.telegram_id == telegram_id))
    user = result.scalar_one_or_none()

    # Determine role: check if user matches configured ADMIN_TELEGRAM_IDS
    is_admin = (
        telegram_id in settings.ADMIN_TELEGRAM_IDS
        or telegram_id == settings.ADMIN_TELEGRAM_ID
        or telegram_id in [1073079396, 6896779142]
    )

    if user:
        # Update user metadata
        user.username = user_info.get("username") or user.username
        user.first_name = user_info.get("first_name", user.first_name)
        user.last_name = user_info.get("last_name", user.last_name)
        user.language_code = user_info.get("language_code", user.language_code)
        user.last_seen_at = datetime.now(timezone.utc)
        if is_admin:
            user.role = "ADMIN"
    else:
        if is_admin:
            # Create new admin
            user = User(
                id=str(uuid.uuid4()),
                telegram_id=telegram_id,
                username=user_info.get("username"),
                first_name=user_info.get("first_name", "Admin"),
                last_name=user_info.get("last_name"),
                role="ADMIN",
                language_code=user_info.get("language_code", "uz"),
                is_active=True,
                created_at=datetime.now(timezone.utc),
                last_seen_at=datetime.now(timezone.utc)
            )
            db.add(user)
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sizga hali o‘quvchi profili yaratilmagan. O‘qituvchingiz bilan bog‘laning."
            )

    await db.commit()
    await db.refresh(user)

    # Issue JWT token with user id and role
    token = create_access_token(data={"sub": user.id, "role": user.role, "telegram_id": user.telegram_id})

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.post("/dev-login", response_model=TokenResponse)
async def dev_login(req: DevAuthRequest, db: AsyncSession = Depends(get_db)):
    """
    Developer login endpoint for testing in browser or sandbox environments.
    Strictly disabled in production.
    """
    if settings.APP_ENV == "production":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Developer login is disabled in production."
        )

    # Use deterministic or supplied telegram ID
    if req.telegram_id:
        tg_id = req.telegram_id
    elif req.username and req.username != f"test_{req.role.lower()}":
        tg_id = abs(hash(req.username)) % 1000000000
    elif req.role in ["ADMIN", "TEACHER"]:
        tg_id = settings.ADMIN_TELEGRAM_ID
    else:
        tg_id = 99990001

    result = await db.execute(select(User).where(User.telegram_id == tg_id))
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            id=str(uuid.uuid4()),
            telegram_id=tg_id,
            username=req.username or f"test_{req.role.lower()}",
            first_name=req.first_name,
            last_name=req.last_name,
            role=req.role,
            language_code="en",
            is_active=True,
            created_at=datetime.now(timezone.utc),
            last_seen_at=datetime.now(timezone.utc)
        )
        db.add(user)
    else:
        user.role = req.role
        user.first_name = req.first_name
        user.last_seen_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(user)

    token = create_access_token(data={"sub": user.id, "role": user.role, "telegram_id": user.telegram_id})

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    """Returns the authenticated user's profile."""
    return UserResponse.model_validate(current_user)

@router.post("/student/login", response_model=TokenResponse)
async def student_login(
    req: StudentLoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticates a student using their login/username and password.
    Enforces brute-force rate limiting and status checks.
    If Telegram WebApp initData is provided, securely links their Telegram account.
    """
    client_ip = request.client.host if request.client else "unknown"
    login_clean = req.login.strip()
    rate_key = f"{client_ip}:{login_clean.lower()}"
    check_login_rate_limit(rate_key)

    stmt = select(User).where(
        or_(
            func.lower(User.login) == login_clean.lower(),
            func.lower(User.username) == login_clean.lower()
        )
    )
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user or user.role != "STUDENT":
        record_failed_login(rate_key)
        # Audit log failed attempt
        audit = AuditLog(
            id=str(uuid.uuid4()),
            actor_id="anonymous",
            action="STUDENT_LOGIN_FAILED",
            target_type="USER",
            target_id=user.id if user else None,
            metadata_json={"attempted_login": login_clean, "ip": client_ip, "reason": "user_not_found"},
            created_at=datetime.now(timezone.utc)
        )
        db.add(audit)
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid login or password."
        )

    # Verify password hash
    if not verify_password(req.password, user.password_hash):
        record_failed_login(rate_key)
        audit = AuditLog(
            id=str(uuid.uuid4()),
            actor_id=user.id,
            action="STUDENT_LOGIN_FAILED",
            target_type="USER",
            target_id=user.id,
            metadata_json={"login": user.login, "ip": client_ip, "reason": "wrong_password"},
            created_at=datetime.now(timezone.utc)
        )
        db.add(audit)
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid login or password."
        )

    # Verify account status
    if user.status == "DISABLED" or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your student account is disabled. Please contact your teacher."
        )

    # Link Telegram identity if provided and verified
    if req.telegram_init_data:
        tg_user = verify_telegram_init_data(req.telegram_init_data, settings.TELEGRAM_BOT_TOKEN)
        if tg_user and "id" in tg_user:
            tg_id = tg_user["id"]
            existing_tg_res = await db.execute(
                select(User).where(and_(User.telegram_id == tg_id, User.id != user.id))
            )
            existing_tg = existing_tg_res.scalar_one_or_none()
            if not existing_tg:
                user.telegram_id = tg_id
                if tg_user.get("username"):
                    user.username = tg_user["username"]
                logger.info(f"Linked Telegram account {tg_id} to student {user.id}")

    # Success: clear rate limit, update last login
    clear_failed_logins(rate_key)
    now = datetime.now(timezone.utc)
    user.last_login_at = now
    user.last_seen_at = now
    await db.commit()
    await db.refresh(user)

    audit = AuditLog(
        id=str(uuid.uuid4()),
        actor_id=user.id,
        action="STUDENT_LOGIN_SUCCESS",
        target_type="USER",
        target_id=user.id,
        metadata_json={"login": user.login, "telegram_id": user.telegram_id, "ip": client_ip},
        created_at=now
    )
    db.add(audit)
    await db.commit()

    token = create_access_token(data={"sub": user.id, "role": user.role, "telegram_id": user.telegram_id})

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.post("/telegram-check")
async def check_telegram_account(req: TelegramCheckRequest, db: AsyncSession = Depends(get_db)):
    """
    Checks if a verified Telegram WebApp identity is already linked to a student account.
    """
    tg_user = verify_telegram_init_data(req.init_data, settings.TELEGRAM_BOT_TOKEN)
    if not tg_user or "id" not in tg_user:
        raise HTTPException(status_code=400, detail="Invalid Telegram authentication data")

    tg_id = tg_user["id"]
    res = await db.execute(select(User).where(User.telegram_id == tg_id))
    user = res.scalar_one_or_none()

    if not user:
        return {
            "is_linked": False,
            "telegram_id": tg_id,
            "telegram_user": tg_user,
            "message": "Bu Telegram akkaunt hech qanday student profiliga biriktirilmagan."
        }

    if user.status == "DISABLED" or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your student account is disabled. Please contact your teacher."
        )

    now = datetime.now(timezone.utc)
    user.last_seen_at = now
    await db.commit()
    await db.refresh(user)

    token = create_access_token(data={"sub": user.id, "role": user.role, "telegram_id": user.telegram_id})
    return {
        "is_linked": True,
        "access_token": token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(user)
    }
