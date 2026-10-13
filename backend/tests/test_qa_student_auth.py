import pytest
import pytest_asyncio
import uuid
import time
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.database import init_db

@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    await init_db()

@pytest.mark.asyncio
async def test_complete_student_management_and_auth_flow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Unique test identifiers
        test_uid = uuid.uuid4().hex[:6]
        test_login = f"jasur_{test_uid}"
        test_tg_id = int(time.time() * 1000) % 1000000000

        # 1. Login Teacher
        t_auth = await client.post("/api/v1/auth/dev-login", json={
            "role": "TEACHER",
            "first_name": "Bahrom",
            "last_name": "Teacher",
            "username": f"teacher_bahrom_{test_uid}"
        })
        assert t_auth.status_code == 200
        t_token = t_auth.json()["access_token"]
        t_headers = {"Authorization": f"Bearer {t_token}"}

        # 2. Get suggested credentials
        sugg = await client.get("/api/v1/teacher/students/generate-credentials?first_name=Jasur&last_name=Aliyev", headers=t_headers)
        assert sugg.status_code == 200
        sugg_data = sugg.json()
        assert "suggested_login" in sugg_data
        assert "suggested_password" in sugg_data
        assert len(sugg_data["suggested_password"]) >= 8

        # 3. Create Group
        grp_res = await client.post("/api/v1/teacher/groups", json={
            "name": f"IELTS Target {test_uid}",
            "description": "Intensive prep",
            "level": "B2"
        }, headers=t_headers)
        assert grp_res.status_code == 200
        group_id = grp_res.json()["id"]

        # 4. Teacher creates student with custom login and password
        create_res = await client.post("/api/v1/teacher/students", json={
            "first_name": "Jasur",
            "last_name": "Aliyev",
            "login": test_login,
            "password": "SecurePassword123!",
            "group_id": group_id,
            "telegram_id": test_tg_id,
            "phone": "+998901234567",
            "notes": "Excellent grammar background"
        }, headers=t_headers)
        assert create_res.status_code == 200
        created = create_res.json()
        assert created["status"] == "success"
        assert created["student"]["login"] == test_login
        assert created["plain_password"] == "SecurePassword123!"
        student_id = created["student"]["id"]

        # 5. Duplicate login check -> Should fail with 400
        dup_res = await client.post("/api/v1/teacher/students", json={
            "first_name": "Jasur2",
            "login": test_login
        }, headers=t_headers)
        assert dup_res.status_code == 400
        assert "already taken" in dup_res.json()["detail"].lower()

        # 6. Student Login with wrong password -> 401
        wrong_login = await client.post("/api/v1/auth/student/login", json={
            "login": test_login,
            "password": "WrongPassword!"
        })
        assert wrong_login.status_code == 401

        # 7. Student Login with correct credentials -> 200 & JWT
        good_login = await client.post("/api/v1/auth/student/login", json={
            "login": test_login,
            "password": "SecurePassword123!"
        })
        assert good_login.status_code == 200
        good_data = good_login.json()
        student_token = good_data["access_token"]
        assert good_data["user"]["id"] == student_id
        assert good_data["user"]["role"] == "STUDENT"
        s_headers = {"Authorization": f"Bearer {student_token}"}

        # 8. Student can access their own home
        home_res = await client.get("/api/v1/student/home", headers=s_headers)
        assert home_res.status_code == 200
        assert home_res.json()["student"]["id"] == student_id

        # 9. Teacher resets password
        reset_res = await client.post(f"/api/v1/teacher/students/{student_id}/reset-password", json={
            "password": "BrandNewPassword2026!"
        }, headers=t_headers)
        assert reset_res.status_code == 200
        assert reset_res.json()["new_password"] == "BrandNewPassword2026!"

        # Old password should now fail (401)
        old_attempt = await client.post("/api/v1/auth/student/login", json={
            "login": test_login,
            "password": "SecurePassword123!"
        })
        assert old_attempt.status_code == 401

        # New password succeeds (200)
        new_attempt = await client.post("/api/v1/auth/student/login", json={
            "login": test_login,
            "password": "BrandNewPassword2026!"
        })
        assert new_attempt.status_code == 200

        # 10. Disable Account
        disable_res = await client.put(f"/api/v1/teacher/students/{student_id}/status", json={
            "status": "DISABLED"
        }, headers=t_headers)
        assert disable_res.status_code == 200

        # Disabled account login must receive 403 Forbidden
        disabled_login = await client.post("/api/v1/auth/student/login", json={
            "login": test_login,
            "password": "BrandNewPassword2026!"
        })
        assert disabled_login.status_code == 403
        assert "disabled" in disabled_login.json()["detail"].lower()

        # 11. Re-enable Account
        enable_res = await client.put(f"/api/v1/teacher/students/{student_id}/status", json={
            "status": "ACTIVE"
        }, headers=t_headers)
        assert enable_res.status_code == 200

        active_login = await client.post("/api/v1/auth/student/login", json={
            "login": test_login,
            "password": "BrandNewPassword2026!"
        })
        assert active_login.status_code == 200
