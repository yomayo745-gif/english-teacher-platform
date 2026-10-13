import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.database import init_db

@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    await init_db()

@pytest.mark.asyncio
async def test_admin_and_teacher_panel_authorization():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Create Student
        stu_auth = await client.post("/api/v1/auth/dev-login", json={
            "role": "STUDENT",
            "first_name": "Student",
            "username": "student_admin_test"
        })
        stu_token = stu_auth.json()["access_token"]
        stu_headers = {"Authorization": f"Bearer {stu_token}"}

        # 2. Create Teacher
        tch_auth = await client.post("/api/v1/auth/dev-login", json={
            "role": "TEACHER",
            "first_name": "Teacher",
            "username": "teacher_admin_test"
        })
        tch_token = tch_auth.json()["access_token"]
        tch_headers = {"Authorization": f"Bearer {tch_token}"}

        # 3. Create Admin
        adm_auth = await client.post("/api/v1/auth/dev-login", json={
            "role": "ADMIN",
            "first_name": "Admin",
            "username": "admin_test"
        })
        adm_token = adm_auth.json()["access_token"]
        adm_headers = {"Authorization": f"Bearer {adm_token}"}

        # Endpoints that MUST be restricted to Teacher/Admin only
        restricted_get_endpoints = [
            "/api/v1/teacher/dashboard",
            "/api/v1/teacher/submissions",
            "/api/v1/teacher/assignments",
            "/api/v1/teacher/students",
            "/api/v1/teacher/groups",
            "/api/v1/teacher/analytics",
            "/api/v1/teacher/audit-logs",
            "/api/v1/teacher/lessons",
        ]

        for ep in restricted_get_endpoints:
            # Anonymous access -> 401
            anon_res = await client.get(ep)
            assert anon_res.status_code == 401, f"Expected 401 for anonymous {ep}, got {anon_res.status_code}"

            # Student access -> 403 Forbidden
            stu_res = await client.get(ep, headers=stu_headers)
            assert stu_res.status_code == 403, f"Expected 403 for student {ep}, got {stu_res.status_code}"

            # Teacher access -> 200 OK
            tch_res = await client.get(ep, headers=tch_headers)
            assert tch_res.status_code == 200, f"Expected 200 for teacher {ep}, got {tch_res.status_code}"

            # Admin access -> 200 OK
            adm_res = await client.get(ep, headers=adm_headers)
            assert adm_res.status_code == 200, f"Expected 200 for admin {ep}, got {adm_res.status_code}"

@pytest.mark.asyncio
async def test_teacher_student_management_and_groups():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Teacher auth
        tch_auth = await client.post("/api/v1/auth/dev-login", json={
            "role": "TEACHER",
            "first_name": "TeacherGroup",
            "username": "teacher_group"
        })
        tch_headers = {"Authorization": f"Bearer {tch_auth.json()['access_token']}"}

        # 1. Create a study group
        grp_payload = {
            "name": "IELTS Band 7 Morning",
            "description": "Intensive IELTS preparation cohort",
            "level": "Upper-Intermediate"
        }
        create_grp_res = await client.post("/api/v1/teacher/groups", json=grp_payload, headers=tch_headers)
        assert create_grp_res.status_code == 200
        grp_data = create_grp_res.json()
        assert grp_data["name"] == "IELTS Band 7 Morning"
        group_id = grp_data["id"]

        # 2. List groups
        list_grp_res = await client.get("/api/v1/teacher/groups", headers=tch_headers)
        assert list_grp_res.status_code == 200
        assert any(g["id"] == group_id for g in list_grp_res.json())

        # 3. List students
        stu_list_res = await client.get("/api/v1/teacher/students", headers=tch_headers)
        assert stu_list_res.status_code == 200
