import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.database import init_db

@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    await init_db()

@pytest.mark.asyncio
async def test_dedicated_assignments_flow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Login Teacher
        teacher_auth = await client.post("/api/v1/auth/dev-login", json={
            "role": "TEACHER",
            "first_name": "Teacher",
            "last_name": "Nova",
            "username": "teacher_nova"
        })
        assert teacher_auth.status_code == 200
        teacher_token = teacher_auth.json()["access_token"]
        teacher_headers = {"Authorization": f"Bearer {teacher_token}"}

        # 2. Create Picture Description assignment
        pic_payload = {
            "title": "Summer Holiday Picture Description",
            "description": "Describe the scene in the picture in at least 50 words.",
            "instructions": "Use present continuous tense.",
            "type": "PICTURE_DESCRIPTION",
            "difficulty": "Intermediate",
            "points": 10.0,
            "estimated_time_minutes": 15,
            "status": "PUBLISHED",
            "target_type": "ALL",
            "questions": [
                {
                    "order": 1,
                    "type": "PICTURE_DESCRIPTION",
                    "question_text": "Describe the activities in this photo",
                    "media_url": "https://example.com/summer.jpg",
                    "media_type": "image",
                    "min_words": 50,
                    "max_words": 150,
                    "points": 10.0,
                    "is_required": True
                }
            ]
        }
        res = await client.post("/api/v1/teacher/assignments", json=pic_payload, headers=teacher_headers)
        assert res.status_code == 200, res.text
        pic_assignment_id = res.json().get("assignment_id") or res.json().get("id")
        assert pic_assignment_id is not None

        # 3. Get single teacher assignment detail
        detail_res = await client.get(f"/api/v1/teacher/assignments/{pic_assignment_id}", headers=teacher_headers)
        assert detail_res.status_code == 200
        detail = detail_res.json()
        assert detail["title"] == "Summer Holiday Picture Description"
        assert detail["type"] == "PICTURE_DESCRIPTION"
        assert len(detail["questions"]) == 1
        assert detail["questions"][0]["min_words"] == 50

        # 4. Duplicate assignment
        dup_res = await client.post(f"/api/v1/teacher/assignments/{pic_assignment_id}/duplicate", headers=teacher_headers)
        assert dup_res.status_code == 200
        dup_id = dup_res.json().get("assignment_id") or dup_res.json().get("id")
        assert dup_id is not None

        dup_detail = (await client.get(f"/api/v1/teacher/assignments/{dup_id}", headers=teacher_headers)).json()
        assert dup_detail["status"] == "DRAFT"
        assert "[Copy]" in dup_detail["title"]
        assert len(dup_detail["questions"]) == 1

        # 5. Update assignment
        update_payload = {
            "title": "Updated Summer Holiday Description",
            "difficulty": "Advanced",
            "points": 15.0,
            "questions": [
                {
                    "order": 1,
                    "type": "PICTURE_DESCRIPTION",
                    "question_text": "Describe the activities in detail",
                    "media_url": "https://example.com/summer2.jpg",
                    "min_words": 80,
                    "points": 15.0,
                    "is_required": True
                }
            ]
        }
        update_res = await client.put(f"/api/v1/teacher/assignments/{dup_id}", json=update_payload, headers=teacher_headers)
        assert update_res.status_code == 200
        
        updated_detail = (await client.get(f"/api/v1/teacher/assignments/{dup_id}", headers=teacher_headers)).json()
        assert updated_detail["title"] == "Updated Summer Holiday Description"
        assert updated_detail["difficulty"] == "Advanced"
        assert updated_detail["points"] == 15.0

        # 6. Filter assignments by type
        filter_res = await client.get("/api/v1/teacher/assignments?type=PICTURE_DESCRIPTION", headers=teacher_headers)
        assert filter_res.status_code == 200
        filtered_items = filter_res.json()
        assert all(item["type"] == "PICTURE_DESCRIPTION" for item in filtered_items)

        # 7. Filter assignments by search
        search_res = await client.get("/api/v1/teacher/assignments?search=Holiday", headers=teacher_headers)
        assert search_res.status_code == 200
        search_items = search_res.json()
        assert len(search_items) >= 2
        assert all("Holiday" in item["title"] for item in search_items)
