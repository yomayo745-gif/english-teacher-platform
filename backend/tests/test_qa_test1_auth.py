import time
import json
import hmac
import hashlib
import urllib.parse
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.config import settings
from app.core.database import init_db
from app.core.security import verify_telegram_init_data, create_access_token, decode_access_token

@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    await init_db()

def generate_valid_telegram_init_data(user_dict: dict, bot_token: str, auth_date: int = None) -> str:
    """Generates an authentic Telegram WebApp initData string with valid HMAC-SHA256 hash."""
    if auth_date is None:
        auth_date = int(time.time())
    
    params = {
        "auth_date": str(auth_date),
        "query_id": "AAHdF6IQAAAAAN0XohDhrOrc",
        "user": json.dumps(user_dict, separators=(',', ':'))
    }
    
    # Sort items
    data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(params.items()))
    secret_key = hmac.new(b"WebAppData", bot_token.encode("utf-8"), hashlib.sha256).digest()
    hash_val = hmac.new(secret_key, data_check_string.encode("utf-8"), hashlib.sha256).hexdigest()
    params["hash"] = hash_val
    
    return urllib.parse.urlencode(params)

@pytest.mark.asyncio
async def test_telegram_auth_valid_and_invalid():
    test_token = "123456789:ABCdefGHIjklMNOpqrSTUvwxYZ_123456"
    test_user = {"id": 88881111, "first_name": "Vali", "last_name": "Aliyev", "username": "valialiyev"}
    
    # 1. Valid initData
    valid_data = generate_valid_telegram_init_data(test_user, test_token)
    parsed = verify_telegram_init_data(valid_data, test_token)
    assert parsed is not None
    assert parsed["id"] == 88881111
    assert parsed["first_name"] == "Vali"

    # 2. Tampered / Invalid initData (altered user id)
    tampered_data = valid_data.replace("88881111", "99999999")
    # Set APP_ENV to production temporarily to test signature enforcement
    orig_env = settings.APP_ENV
    settings.APP_ENV = "production"
    try:
        assert verify_telegram_init_data(tampered_data, test_token) is None
        # Missing hash
        assert verify_telegram_init_data("user=123&auth_date=123", test_token) is None
        # Empty string
        assert verify_telegram_init_data("", test_token) is None
    finally:
        settings.APP_ENV = orig_env

@pytest.mark.asyncio
async def test_auth_api_endpoints():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Unauthorized /auth/me
        unauth_resp = await client.get("/api/v1/auth/me")
        assert unauth_resp.status_code == 401

        # 2. Invalid bearer token
        bad_token_resp = await client.get("/api/v1/auth/me", headers={"Authorization": "Bearer invalid.jwt.token"})
        assert bad_token_resp.status_code == 401

        # 3. Dev login (Student)
        stu_resp = await client.post("/api/v1/auth/dev-login", json={
            "role": "STUDENT",
            "first_name": "TestStudent",
            "username": "student_qa"
        })
        assert stu_resp.status_code == 200
        stu_data = stu_resp.json()
        assert stu_data["access_token"] is not None
        assert stu_data["user"]["role"] == "STUDENT"
        stu_token = stu_data["access_token"]

        # 4. Verified /auth/me for student
        me_resp = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {stu_token}"})
        assert me_resp.status_code == 200
        assert me_resp.json()["first_name"] == "TestStudent"

        # 5. Student attempting to access Teacher Dashboard must get 403 Forbidden
        teacher_forbidden = await client.get("/api/v1/teacher/dashboard", headers={"Authorization": f"Bearer {stu_token}"})
        assert teacher_forbidden.status_code == 403

        # 6. Dev login (Teacher)
        tch_resp = await client.post("/api/v1/auth/dev-login", json={
            "role": "TEACHER",
            "first_name": "TestTeacher",
            "username": "teacher_qa"
        })
        assert tch_resp.status_code == 200
        tch_token = tch_resp.json()["access_token"]

        # 7. Teacher accessing Teacher Dashboard must succeed
        teacher_dash = await client.get("/api/v1/teacher/dashboard", headers={"Authorization": f"Bearer {tch_token}"})
        assert teacher_dash.status_code == 200

        # 8. Dev login disabled in production
        orig_env = settings.APP_ENV
        settings.APP_ENV = "production"
        try:
            prod_dev_resp = await client.post("/api/v1/auth/dev-login", json={
                "role": "ADMIN",
                "first_name": "Hacker"
            })
            assert prod_dev_resp.status_code == 403
        finally:
            settings.APP_ENV = orig_env

@pytest.mark.asyncio
async def test_telegram_auth_replay_protection():
    test_token = "123456789:ABCdefGHIjklMNOpqrSTUvwxYZ_123456"
    test_user = {"id": 88882222, "first_name": "ReplayUser"}
    
    # 48 hours in the past
    old_time = int(time.time()) - (48 * 3600)
    expired_init_data = generate_valid_telegram_init_data(test_user, test_token, auth_date=old_time)
    
    orig_env = settings.APP_ENV
    settings.APP_ENV = "production"
    try:
        assert verify_telegram_init_data(expired_init_data, test_token) is None
    finally:
        settings.APP_ENV = orig_env
