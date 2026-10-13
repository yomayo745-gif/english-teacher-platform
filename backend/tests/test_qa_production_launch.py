import time
import json
import uuid
import hmac
import hashlib
import urllib.parse
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.config import settings
from app.core.database import init_db
from app.bot.telegram_bot import resolve_user
from aiogram.types import User as AiogramUser

@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    await init_db()

def generate_valid_tg_init_data(user_dict: dict, bot_token: str) -> str:
    params = {
        "auth_date": str(int(time.time())),
        "query_id": "AAHdF6IQAAAAAN0XohDhrOrc",
        "user": json.dumps(user_dict, separators=(',', ':'))
    }
    data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(params.items()))
    secret_key = hmac.new(b"WebAppData", bot_token.encode("utf-8"), hashlib.sha256).digest()
    hash_val = hmac.new(secret_key, data_check_string.encode("utf-8"), hashlib.sha256).hexdigest()
    params["hash"] = hash_val
    return urllib.parse.urlencode(params)


@pytest.mark.asyncio
async def test_full_production_launch_flow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:

        # -----------------------------------------------------------------
        # TEST 1 & 2: Production Admin Authorization (1073079396 & 6896779142)
        # -----------------------------------------------------------------
        # Admin 1
        admin1_tg = {"id": 1073079396, "first_name": "Bahrom", "username": "admin_bahrom"}
        admin1_init = generate_valid_tg_init_data(admin1_tg, settings.TELEGRAM_BOT_TOKEN)
        admin1_resp = await client.post("/api/v1/auth/telegram", json={"init_data": admin1_init})
        assert admin1_resp.status_code == 200, f"Admin 1 login failed: {admin1_resp.text}"
        admin1_data = admin1_resp.json()
        assert admin1_data["user"]["role"] == "ADMIN"
        admin1_token = admin1_data["access_token"]
        admin1_headers = {"Authorization": f"Bearer {admin1_token}"}

        # Verify Admin 1 has full admin capabilities
        a1_dash = await client.get("/api/v1/teacher/dashboard", headers=admin1_headers)
        assert a1_dash.status_code == 200

        # Admin 2
        admin2_tg = {"id": 6896779142, "first_name": "SuperAdmin", "username": "admin_two"}
        admin2_init = generate_valid_tg_init_data(admin2_tg, settings.TELEGRAM_BOT_TOKEN)
        admin2_resp = await client.post("/api/v1/auth/telegram", json={"init_data": admin2_init})
        assert admin2_resp.status_code == 200, f"Admin 2 login failed: {admin2_resp.text}"
        admin2_data = admin2_resp.json()
        assert admin2_data["user"]["role"] == "ADMIN"
        admin2_token = admin2_data["access_token"]
        admin2_headers = {"Authorization": f"Bearer {admin2_token}"}

        a2_dash = await client.get("/api/v1/teacher/dashboard", headers=admin2_headers)
        assert a2_dash.status_code == 200

        # -----------------------------------------------------------------
        # TEST 3: Teacher creation & Student creation with credentials
        # -----------------------------------------------------------------
        # Dev login teacher (or teacher role)
        teacher_resp = await client.post("/api/v1/auth/dev-login", json={
            "role": "TEACHER",
            "first_name": "Nodir",
            "last_name": "Teacher",
            "username": "nodir_teacher_prod"
        })
        assert teacher_resp.status_code == 200
        teacher_token = teacher_resp.json()["access_token"]
        teacher_headers = {"Authorization": f"Bearer {teacher_token}"}

        # Teacher creates group
        grp_res = await client.post("/api/v1/teacher/groups", json={
            "name": "IELTS Band 7.5+",
            "level": "B2",
            "description": "Production group"
        }, headers=teacher_headers)
        assert grp_res.status_code == 200
        group_id = grp_res.json()["id"]

        # Teacher creates Student A
        test_uid = uuid.uuid4().hex[:6]
        stu_login_a = f"stu_a_{test_uid}"
        create_stu_a = await client.post("/api/v1/teacher/students", json={
            "first_name": "Bekzod",
            "last_name": "Toshmatov",
            "login": stu_login_a,
            "password": "PasswordA123!",
            "group_id": group_id,
            "phone": "+998901112233"
        }, headers=teacher_headers)
        assert create_stu_a.status_code == 200
        student_a_id = create_stu_a.json()["student"]["id"]

        # Teacher creates Student B (for IDOR testing)
        stu_login_b = f"stu_b_{test_uid}"
        create_stu_b = await client.post("/api/v1/teacher/students", json={
            "first_name": "Sardor",
            "last_name": "Rahimov",
            "login": stu_login_b,
            "password": "PasswordB123!",
            "group_id": group_id,
            "phone": "+998904445566"
        }, headers=teacher_headers)
        assert create_stu_b.status_code == 200
        student_b_id = create_stu_b.json()["student"]["id"]

        # -----------------------------------------------------------------
        # TEST 4: Student Telegram WebApp flow & Login
        # -----------------------------------------------------------------
        # Student A opens WebApp inside Telegram
        student_a_tg_id = int(time.time() * 1000) % 1000000000
        tg_data_a = {"id": student_a_tg_id, "first_name": "Bekzod", "username": "bekzod_tg"}
        init_data_a = generate_valid_tg_init_data(tg_data_a, settings.TELEGRAM_BOT_TOKEN)

        # 1. Telegram check -> Initially not linked
        chk_a = await client.post("/api/v1/auth/telegram-check", json={"init_data": init_data_a})
        assert chk_a.status_code == 200
        assert chk_a.json()["is_linked"] is False

        # 2. Student logs in with teacher-provided credentials + Telegram initData
        login_a = await client.post("/api/v1/auth/student/login", json={
            "login": stu_login_a,
            "password": "PasswordA123!",
            "telegram_init_data": init_data_a
        })
        assert login_a.status_code == 200
        stu_a_token = login_a.json()["access_token"]
        stu_a_headers = {"Authorization": f"Bearer {stu_a_token}"}

        # 3. Next time student opens WebApp -> telegram-check returns is_linked: True
        chk_a_again = await client.post("/api/v1/auth/telegram-check", json={"init_data": init_data_a})
        assert chk_a_again.status_code == 200
        assert chk_a_again.json()["is_linked"] is True

        # Student A dashboard
        stu_home = await client.get("/api/v1/student/home", headers=stu_a_headers)
        assert stu_home.status_code == 200
        assert stu_home.json()["student"]["id"] == student_a_id

        # -----------------------------------------------------------------
        # TEST 5: Teacher creates Homework & assigns to Student
        # -----------------------------------------------------------------
        asg_res = await client.post("/api/v1/teacher/assignments", json={
            "title": "Production Picture Description Essay",
            "type": "PICTURE_DESCRIPTION",
            "target_type": "ALL",
            "instructions": "Describe this historic landmark in at least 50 words.",
            "points": 100.0,
            "status": "PUBLISHED",
            "difficulty": "B2",
            "estimated_time_minutes": 20,
            "questions": [
                {
                    "type": "PICTURE_DESCRIPTION",
                    "question_text": "What landmark is shown?",
                    "points": 100.0,
                    "order": 1,
                    "min_words": 10
                }
            ]
        }, headers=teacher_headers)
        assert asg_res.status_code == 200
        assignment_id = asg_res.json()["assignment_id"]

        # Student A views homework
        stu_asg = await client.get(f"/api/v1/student/assignments/{assignment_id}", headers=stu_a_headers)
        assert stu_asg.status_code == 200
        assert stu_asg.json()["assignment"]["title"] == "Production Picture Description Essay"

        # -----------------------------------------------------------------
        # TEST 6: Student submits homework
        # -----------------------------------------------------------------
        q_id = stu_asg.json()["questions"][0]["id"]
        sub_res = await client.post(f"/api/v1/student/assignments/{assignment_id}/submit", json={
            "answers": [
                {
                    "question_id": q_id,
                    "text_answer": "This is a majestic ancient architectural monument constructed during the Silk Road era."
                }
            ]
        }, headers=stu_a_headers)
        assert sub_res.status_code == 200
        submission_id = sub_res.json()["submission_id"]

        # -----------------------------------------------------------------
        # TEST 7: Teacher grades submission
        # -----------------------------------------------------------------
        grade_res = await client.post(f"/api/v1/teacher/submissions/{submission_id}/grade", json={
            "total_score": 95.0,
            "status": "GRADED",
            "teacher_feedback": "Outstanding vocabulary and grammatical accuracy!"
        }, headers=teacher_headers)
        assert grade_res.status_code == 200
        assert grade_res.json()["status"] == "success"

        # -----------------------------------------------------------------
        # TEST 8: Student views results
        # -----------------------------------------------------------------
        result_res = await client.get(f"/api/v1/student/results/{submission_id}", headers=stu_a_headers)
        assert result_res.status_code == 200
        assert result_res.json()["total_score"] == 95.0
        assert "Outstanding" in result_res.json()["teacher_feedback"]

        # -----------------------------------------------------------------
        # TEST 9: Security & IDOR: Student B tries to access Student A's submission
        # -----------------------------------------------------------------
        # Student B logs in
        login_b = await client.post("/api/v1/auth/student/login", json={
            "login": stu_login_b,
            "password": "PasswordB123!"
        })
        assert login_b.status_code == 200
        stu_b_token = login_b.json()["access_token"]
        stu_b_headers = {"Authorization": f"Bearer {stu_b_token}"}

        # Student B accessing Student A's submission MUST FAIL with 403 or 404 (IDOR protected)
        idor_attempt = await client.get(f"/api/v1/student/results/{submission_id}", headers=stu_b_headers)
        assert idor_attempt.status_code in [403, 404], f"IDOR Vulnerability detected! Status: {idor_attempt.status_code}"

        # -----------------------------------------------------------------
        # TEST 10: Disabled student login blocked (403 Forbidden)
        # -----------------------------------------------------------------
        # Teacher disables Student A
        dis_res = await client.put(f"/api/v1/teacher/students/{student_a_id}/status", json={
            "status": "DISABLED"
        }, headers=teacher_headers)
        assert dis_res.status_code == 200

        # Student A login must now be blocked with 403 Forbidden
        blocked_login = await client.post("/api/v1/auth/student/login", json={
            "login": stu_login_a,
            "password": "PasswordA123!"
        })
        assert blocked_login.status_code == 403
        assert "disabled" in blocked_login.json()["detail"].lower()

        # -----------------------------------------------------------------
        # BONUS: Telegram Bot /start with Unregistered User
        # -----------------------------------------------------------------
        fake_aiogram_user = AiogramUser(
            id=999888777,
            is_bot=False,
            first_name="RogueUser",
            username="rogue_user"
        )
        resolved_u, resolved_role = await resolve_user(fake_aiogram_user)
        assert resolved_role == "GUEST"
        assert resolved_u is None
        # Confirms no rogue student created in DB
