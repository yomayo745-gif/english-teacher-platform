import hmac
import hashlib
import json
import urllib.parse
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

import secrets
import string
import re
import bcrypt
from app.core.config import settings
from app.core.database import get_db

security_bearer = HTTPBearer(auto_error=False)

# In-memory rate limiting dictionary for failed logins
FAILED_LOGIN_ATTEMPTS: Dict[str, List[float]] = {}
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_DURATION_SECONDS = 300  # 5 minutes

def check_login_rate_limit(identifier: str):
    """Checks if the user/IP has exceeded maximum failed login attempts."""
    now = datetime.now(timezone.utc).timestamp()
    attempts = FAILED_LOGIN_ATTEMPTS.get(identifier, [])
    recent_attempts = [ts for ts in attempts if now - ts < LOCKOUT_DURATION_SECONDS]
    FAILED_LOGIN_ATTEMPTS[identifier] = recent_attempts
    if len(recent_attempts) >= MAX_FAILED_ATTEMPTS:
        remaining_seconds = int(LOCKOUT_DURATION_SECONDS - (now - recent_attempts[0]))
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many failed login attempts. Please try again in {max(remaining_seconds, 1)} seconds."
        )

def record_failed_login(identifier: str):
    """Records a failed login attempt for rate limiting."""
    now = datetime.now(timezone.utc).timestamp()
    attempts = FAILED_LOGIN_ATTEMPTS.get(identifier, [])
    attempts.append(now)
    FAILED_LOGIN_ATTEMPTS[identifier] = attempts

def clear_failed_logins(identifier: str):
    """Clears failed login attempts upon successful authentication."""
    if identifier in FAILED_LOGIN_ATTEMPTS:
        del FAILED_LOGIN_ATTEMPTS[identifier]

def hash_password(password: str) -> str:
    """Hashes a password using bcrypt with salt."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: Optional[str]) -> bool:
    """Verifies a plain-text password against a bcrypt hash."""
    if not hashed_password:
        return False
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def generate_random_password(length: int = 8) -> str:
    """
    Generates a secure, readable password containing uppercase, lowercase,
    and digits without ambiguous characters.
    """
    chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    return "".join(secrets.choice(chars) for _ in range(max(length, 8)))

def generate_base_login(first_name: str, last_name: Optional[str] = None) -> str:
    """Generates a clean sanitized login slug based on first and last name."""
    clean_fn = re.sub(r"[^a-zA-Z0-9]", "", first_name.lower().strip()) or "student"
    if last_name:
        clean_ln = re.sub(r"[^a-zA-Z0-9]", "", last_name.lower().strip())
        if clean_ln:
            return f"{clean_fn}.{clean_ln[0]}"
    return clean_fn

def verify_telegram_init_data(init_data: str, bot_token: str) -> Optional[Dict[str, Any]]:
    """
    Validates Telegram WebApp initData string using HMAC-SHA256 signature verification.
    Returns parsed user dict if valid, else None.
    """
    if not init_data:
        return None

    # Development sandbox mode allowance if configured
    if settings.APP_ENV == "development" and init_data.startswith("sandbox_user:"):
        try:
            payload = json.loads(init_data.replace("sandbox_user:", ""))
            return payload
        except Exception:
            pass

    try:
        parsed_params = dict(urllib.parse.parse_qsl(init_data, keep_blank_values=True))
        if "hash" not in parsed_params:
            return None

        received_hash = parsed_params.pop("hash")
        
        # Sort keys lexicographically and construct data check string
        sorted_items = sorted(parsed_params.items())
        data_check_string = "\n".join(f"{k}={v}" for k, v in sorted_items)

        # Secret key: HMAC-SHA256 with key "WebAppData" and msg bot_token
        secret_key = hmac.new(
            key=b"WebAppData",
            msg=bot_token.encode("utf-8"),
            digestmod=hashlib.sha256
        ).digest()

        # Calculated hash
        calculated_hash = hmac.new(
            key=secret_key,
            msg=data_check_string.encode("utf-8"),
            digestmod=hashlib.sha256
        ).hexdigest()

        if calculated_hash != received_hash:
            # If bot_token is sandbox default and in dev mode, allow graceful fallback for browser dev
            if settings.APP_ENV == "development" and bot_token.startswith("sandbox_"):
                if "user" in parsed_params:
                    return json.loads(parsed_params["user"])
            return None

        # Replay attack protection: reject init_data older than 24 hours (86400s)
        auth_date = parsed_params.get("auth_date")
        if auth_date:
            try:
                auth_ts = float(auth_date)
                now_ts = datetime.now(timezone.utc).timestamp()
                if (now_ts - auth_ts) > 86400 or (auth_ts - now_ts) > 300: # not older than 24h, not >5m in future
                    return None
            except (ValueError, TypeError):
                return None

        user_data = json.loads(parsed_params.get("user", "{}"))
        return user_data

    except Exception:
        return None

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None

async def get_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: AsyncSession = Depends(get_db)
):
    """Dependency to retrieve authenticated user from JWT bearer."""
    # Local import to prevent circular dependency
    from app.models.user import User

    if not auth or not auth.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is missing",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(auth.credentials)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload["sub"]
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Update last seen timestamp
    user.last_seen_at = datetime.now(timezone.utc)
    await db.commit()

    return user

def require_role(allowed_roles: List[str]):
    """Role-based authorization guard."""
    async def role_checker(current_user = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker

require_admin = require_role(["ADMIN"])
require_teacher_or_admin = require_role(["TEACHER", "ADMIN"])
require_student = require_role(["STUDENT"])
