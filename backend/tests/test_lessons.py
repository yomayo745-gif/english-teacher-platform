import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.database import init_db

@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    await init_db()

@pytest.mark.asyncio
async def test_lesson_lifecycle():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Login Teacher
        teacher_auth = await client.post("/api/v1/auth/dev-login", json={
            "role": "TEACHER",
            "first_name": "Bahrom",
            "last_name": "Teacher",
            "username": "teacher_bahrom"
        })
        assert teacher_auth.status_code == 200
        teacher_token = teacher_auth.json()["access_token"]
        teacher_headers = {"Authorization": f"Bearer {teacher_token}"}

        # 2. Login Student
        student_auth = await client.post("/api/v1/auth/dev-login", json={
            "role": "STUDENT",
            "first_name": "Jasur",
            "last_name": "Aliyev",
            "username": "jasur_a",
            "telegram_id": 987654321
        })
        assert student_auth.status_code == 200
        student_token = student_auth.json()["access_token"]
        student_headers = {"Authorization": f"Bearer {student_token}"}

        # 3. Teacher creates a lesson
        create_payload = {
            "title": "Modal Verbs: Can, Could, and Would",
            "description": "Master polite requests and possibilities in English.",
            "content": "## Modal Verbs Rules\n\n- Can: ability in present\n- Could: polite request or past ability\n- Would: hypothetical or polite offer",
            "media_type": "audio",
            "media_url": "/media/audio/modal_verbs.mp3",
            "order": 5,
            "estimated_time_minutes": 25,
            "status": "PUBLISHED",
            "target_type": "ALL",
            "vocabulary": [
                {
                    "word": "Request",
                    "phonetic": "/rɪˈkwest/",
                    "translation": "Iltimos qilmoq",
                    "example": "He made a polite request for assistance."
                }
            ],
            "exercises": [
                {
                    "question": "Which verb is most polite for making a request at a restaurant?",
                    "options": ["Can I have", "Could I have", "Give me", "I want"],
                    "correct_answer": "Could I have",
                    "explanation": "'Could I have' is softer and more polite than 'Can I'."
                }
            ]
        }

        create_resp = await client.post("/api/v1/teacher/lessons", json=create_payload, headers=teacher_headers)
        assert create_resp.status_code == 201
        lesson_data = create_resp.json()
        assert lesson_data["title"] == create_payload["title"]
        lesson_id = lesson_data["id"]

        # 4. Teacher lists lessons
        t_list_resp = await client.get("/api/v1/teacher/lessons", headers=teacher_headers)
        assert t_list_resp.status_code == 200
        lessons = t_list_resp.json()
        assert any(l["id"] == lesson_id for l in lessons)

        # 5. Student views available lessons
        s_list_resp = await client.get("/api/v1/student/lessons", headers=student_headers)
        assert s_list_resp.status_code == 200
        student_lessons = s_list_resp.json()
        assert any(l["id"] == lesson_id for l in student_lessons)

        # 6. Student views single lesson detail
        s_detail_resp = await client.get(f"/api/v1/student/lessons/{lesson_id}", headers=student_headers)
        assert s_detail_resp.status_code == 200
        detail = s_detail_resp.json()
        assert detail["title"] == create_payload["title"]
        assert len(detail["vocabulary"]) == 1
        assert len(detail["exercises"]) == 1

        # 7. Student updates progress to COMPLETED
        prog_resp = await client.post(
            f"/api/v1/student/lessons/{lesson_id}/progress",
            json={"status": "COMPLETED", "progress_percent": 100},
            headers=student_headers
        )
        assert prog_resp.status_code == 200
        assert prog_resp.json()["status"] == "COMPLETED"
        assert prog_resp.json()["progress_percent"] == 100

        # 8. Teacher views student progress
        prog_list_resp = await client.get(f"/api/v1/teacher/lessons/{lesson_id}/progress", headers=teacher_headers)
        assert prog_list_resp.status_code == 200
        progs = prog_list_resp.json()
        assert len(progs) >= 1
        assert any(p["status"] == "COMPLETED" for p in progs)
