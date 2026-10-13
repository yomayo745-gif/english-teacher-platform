import asyncio
import os
import sys
import sqlite3
import httpx
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.config import settings
from app.core.security import create_access_token

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "platform.db")
BASE_URL = settings.BASE_URL

def test_zero_state_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("SELECT telegram_id, role, status FROM users")
    users = cur.fetchall()
    print("Users in DB:", users)
    assert len(users) == 2, f"Expected 2 admins, got {len(users)}"
    tg_ids = {u[0] for u in users}
    assert tg_ids == {1073079396, 6896779142}, f"Unexpected admin IDs: {tg_ids}"
    for u in users:
        assert u[1] == "ADMIN", f"User {u[0]} is not ADMIN"
        assert u[2] == "ACTIVE", f"User {u[0]} is not ACTIVE"

    cur.execute("SELECT count(*) FROM groups")
    assert cur.fetchone()[0] == 0, "Groups table is not empty"

    cur.execute("SELECT count(*) FROM assignments")
    assert cur.fetchone()[0] == 0, "Assignments table is not empty"

    cur.execute("SELECT count(*) FROM submissions")
    assert cur.fetchone()[0] == 0, "Submissions table is not empty"

    conn.close()
    print("✓ Zero-state verified: Database is 100% clean with only 2 production admins.")

@pytest.mark.asyncio
async def test_group_crud_api():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT id FROM users WHERE telegram_id = 6896779142")
    admin_id = cur.fetchone()[0]
    conn.close()

    token = create_access_token(data={"sub": admin_id, "role": "ADMIN", "telegram_id": 6896779142})
    headers = {"Authorization": f"Bearer {token}"}

    async with httpx.AsyncClient(base_url="http://127.0.0.1:8000") as client:
        # 1. GET groups (empty)
        resp = await client.get("/api/v1/teacher/groups", headers=headers)
        assert resp.status_code == 200
        assert resp.json() == []
        print("✓ Initial groups list is empty.")

        # 2. CREATE group
        resp = await client.post("/api/v1/teacher/groups", headers=headers, json={
            "name": "IELTS Master 2026",
            "description": "Intensive preparation course",
            "level": "B2 Upper Intermediate"
        })
        assert resp.status_code == 200, resp.text
        created = resp.json()
        group_id = created["id"]
        assert created["name"] == "IELTS Master 2026"
        assert created["level"] == "B2 Upper Intermediate"
        print(f"✓ Created group: {group_id} - {created['name']}")

        # 3. UPDATE group (Edit)
        resp = await client.put(f"/api/v1/teacher/groups/{group_id}", headers=headers, json={
            "name": "IELTS Master 2026 (Updated)",
            "description": "Updated course description",
            "level": "C1 Advanced"
        })
        assert resp.status_code == 200, resp.text
        updated = resp.json()
        assert updated["name"] == "IELTS Master 2026 (Updated)"
        assert updated["level"] == "C1 Advanced"
        assert updated["description"] == "Updated course description"
        print(f"✓ Updated group: {updated['name']} ({updated['level']})")

        # 4. DELETE group
        resp = await client.delete(f"/api/v1/teacher/groups/{group_id}", headers=headers)
        assert resp.status_code == 200, resp.text
        del_data = resp.json()
        assert del_data.get("success") is True
        print(f"✓ Deleted group: {del_data['message']}")

        # 5. Verify empty again
        resp = await client.get("/api/v1/teacher/groups", headers=headers)
        assert resp.status_code == 200
        assert resp.json() == []
        print("✓ Verified groups list is clean (0 groups) after deletion.")

@pytest.mark.asyncio
async def test_live_tunnel_and_spa():
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=15.0) as client:
        # Health check
        resp = await client.get("/api/v1/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "healthy"
        print("✓ Live tunnel health check: 200 OK")

        # Student app SPA
        resp = await client.get("/app")
        assert resp.status_code == 200
        assert "<div id=\"root\"></div>" in resp.text
        print("✓ Live tunnel /app route: 200 OK (SPA loaded)")

        # Admin app SPA
        resp = await client.get("/admin")
        assert resp.status_code == 200
        assert "<div id=\"root\"></div>" in resp.text
        print("✓ Live tunnel /admin route: 200 OK (SPA loaded)")

def run_all():
    test_zero_state_db()
    asyncio.run(test_group_crud_api())
    asyncio.run(test_live_tunnel_and_spa())
    print("\nALL 0-STATE & GROUP CRUD VERIFICATIONS PASSED 100%!")

if __name__ == "__main__":
    run_all()
