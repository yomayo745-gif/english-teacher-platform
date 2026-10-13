import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.database import init_db

@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    await init_db()

@pytest.mark.asyncio
async def test_complete_platform_flow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Health check
        resp = await client.get("/api/v1/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "healthy"

        # 2. Login Teacher
        teacher_auth = await client.post("/api/v1/auth/dev-login", json={
            "role": "TEACHER",
            "first_name": "Bahrom",
            "last_name": "Ustoz",
            "username": "teacher_bahrom"
        })
        assert teacher_auth.status_code == 200
        teacher_token = teacher_auth.json()["access_token"]
        teacher_headers = {"Authorization": f"Bearer {teacher_token}"}

        # 3. Login Student
        student_auth = await client.post("/api/v1/auth/dev-login", json={
            "role": "STUDENT",
            "first_name": "Azizbek",
            "last_name": "Karimov",
            "username": "azizbek_k",
            "telegram_id": 123456789
        })
        assert student_auth.status_code == 200
        student_data = student_auth.json()
        student_token = student_data["access_token"]
        student_id = student_data["user"]["id"]
        student_headers = {"Authorization": f"Bearer {student_token}"}

        # 4. Teacher creates an assignment with 3 questions:
        # - Picture description (manual grading, min 10 words)
        # - Multiple Choice (auto-graded)
        # - Listening task
        create_payload = {
            "title": "Unit 4: Travel & Experiences",
            "description": "Describe your last vacation and answer listening comprehension questions.",
            "instructions": "Follow all instructions carefully and respect the word limits.",
            "type": "MIXED",
            "difficulty": "Intermediate",
            "points": 10.0,
            "estimated_time_minutes": 20,
            "status": "PUBLISHED",
            "target_type": "ALL",
            "questions": [
                {
                    "order": 1,
                    "type": "PICTURE_DESCRIPTION",
                    "question_text": "Describe what you see in the vacation photo.",
                    "description": "Write about the weather, location, and what people are doing.",
                    "media_url": "/api/v1/media/images/vacation.jpg",
                    "media_type": "image",
                    "min_words": 10,
                    "max_words": 100,
                    "points": 4.0,
                    "is_required": True
                },
                {
                    "order": 2,
                    "type": "MULTIPLE_CHOICE",
                    "question_text": "Where did John go for his holiday?",
                    "options": ["Paris", "Tokyo", "London", "Rome"],
                    "correct_answer": "Tokyo",
                    "points": 3.0,
                    "is_required": True
                },
                {
                    "order": 3,
                    "type": "LISTENING",
                    "question_text": "Listen to the dialogue and state how long the trip lasted.",
                    "media_url": "/api/v1/media/audio/travel_dialogue.mp3",
                    "media_type": "audio",
                    "transcript": "John spent two wonderful weeks exploring Tokyo and Kyoto.",
                    "options": ["One week", "Two weeks", "One month"],
                    "correct_answer": "Two weeks",
                    "points": 3.0,
                    "is_required": True
                }
            ]
        }
        asgn_resp = await client.post("/api/v1/teacher/assignments", json=create_payload, headers=teacher_headers)
        assert asgn_resp.status_code == 200
        assignment_id = asgn_resp.json()["assignment_id"]

        # 5. Student fetches home feed and sees the assigned homework
        home_resp = await client.get("/api/v1/student/home", headers=student_headers)
        assert home_resp.status_code == 200
        home_data = home_resp.json()
        assert len(home_data["active_homework"]) >= 1
        card = next(c for c in home_data["active_homework"] if c["id"] == assignment_id)
        assert card["status"] == "NEW"

        # 6. Student opens assignment details
        detail_resp = await client.get(f"/api/v1/student/assignments/{assignment_id}", headers=student_headers)
        assert detail_resp.status_code == 200
        q_list = detail_resp.json()["questions"]
        assert len(q_list) == 3
        q1_id = q_list[0]["id"]
        q2_id = q_list[1]["id"]
        q3_id = q_list[2]["id"]

        # 7. Student saves draft (draft autosave)
        draft_payload = {
            "answers": [
                {
                    "question_id": q1_id,
                    "text_answer": "In this photograph I can clearly see a sunny beach."
                }
            ]
        }
        draft_resp = await client.post(f"/api/v1/student/assignments/{assignment_id}/draft", json=draft_payload, headers=student_headers)
        assert draft_resp.status_code == 200
        assert draft_resp.json()["status"] == "saved"

        # 8. Student submits full homework
        submit_payload = {
            "answers": [
                {
                    "question_id": q1_id,
                    "text_answer": "In this photograph I can clearly see a sunny tropical beach with families enjoying the ocean."
                },
                {
                    "question_id": q2_id,
                    "selected_options": "Tokyo"
                },
                {
                    "question_id": q3_id,
                    "selected_options": "Two weeks"
                }
            ]
        }
        submit_resp = await client.post(f"/api/v1/student/assignments/{assignment_id}/submit", json=submit_payload, headers=student_headers)
        assert submit_resp.status_code == 200
        sub_result = submit_resp.json()
        # Question 1 requires manual grading, so status should be SUBMITTED
        assert sub_result["status"] == "SUBMITTED"

        # 9. Teacher opens submissions queue and finds student submission
        sub_list_resp = await client.get("/api/v1/teacher/submissions", headers=teacher_headers)
        assert sub_list_resp.status_code == 200
        subs = sub_list_resp.json()
        sub_item = next(s for s in subs if s["assignment_id"] == assignment_id and s["student_id"] == student_id)
        submission_id = sub_item["id"]

        # 10. Teacher opens split-view review page
        review_resp = await client.get(f"/api/v1/teacher/submissions/{submission_id}", headers=teacher_headers)
        assert review_resp.status_code == 200
        review_data = review_resp.json()
        assert review_data["student"]["full_name"] == "Azizbek Karimov"
        assert len(review_data["questions"]) == 3

        # Auto-graded questions 2 and 3 should already have auto_score = 3.0 each!
        q2_review = next(q for q in review_data["questions"] if q["question_id"] == q2_id)
        assert q2_review["student_answer"]["auto_score"] == 3.0
        q3_review = next(q for q in review_data["questions"] if q["question_id"] == q3_id)
        assert q3_review["student_answer"]["auto_score"] == 3.0

        # 11. Teacher grades the submission (gives 3.5/4.0 on Q1, total 9.5/10.0)
        grade_payload = {
            "total_score": 9.5,
            "teacher_feedback": "Excellent description! Great vocabulary and listening comprehension.",
            "status": "GRADED",
            "question_grades": [
                {
                    "question_id": q1_id,
                    "score": 3.5,
                    "feedback": "Vivid description. Watch your prepositions next time."
                }
            ]
        }
        grade_resp = await client.post(f"/api/v1/teacher/submissions/{submission_id}/grade", json=grade_payload, headers=teacher_headers)
        assert grade_resp.status_code == 200

        # 12. Student views Results page
        results_resp = await client.get("/api/v1/student/results", headers=student_headers)
        assert results_resp.status_code == 200
        results_data = results_resp.json()
        assert len(results_data) >= 1
        res_item = next(r for r in results_data if r["submission_id"] == submission_id)
        assert res_item["score"] == 9.5
        assert "Excellent description" in res_item["teacher_feedback"]

        # 13. Student views Result detail breakdown
        res_detail = await client.get(f"/api/v1/student/results/{submission_id}", headers=student_headers)
        assert res_detail.status_code == 200
        assert len(res_detail.json()["answers"]) == 3
