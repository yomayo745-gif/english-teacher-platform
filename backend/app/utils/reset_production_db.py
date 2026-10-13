"""
Production Database Reset Script
Clears all demo, test, and placeholder data.
Seeds only the designated production admins.
"""

import asyncio
import logging
import uuid
from datetime import datetime, timezone
import sqlite3
from pathlib import Path

from app.core.config import settings

logger = logging.getLogger("reset_production_db")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

PRODUCTION_ADMINS = [
    {
        "telegram_id": 1073079396,
        "first_name": "Admin",
        "last_name": "(1073079396)",
        "role": "ADMIN",
        "status": "ACTIVE",
        "language_code": "uz"
    },
    {
        "telegram_id": 6896779142,
        "first_name": "Admin",
        "last_name": "(6896779142)",
        "role": "ADMIN",
        "status": "ACTIVE",
        "language_code": "uz"
    }
]

TABLES_TO_TRUNCATE = [
    "submission_answers",
    "submissions",
    "assignment_questions",
    "assignment_targets",
    "assignments",
    "lesson_targets",
    "lesson_progress",
    "lessons",
    "vocabulary_items",
    "group_members",
    "groups",
    "notifications",
    "audit_logs",
    "users"
]

def reset_database():
    db_file = Path("platform.db")
    if not db_file.exists():
        logger.error(f"Database file not found: {db_file.resolve()}")
        return

    conn = sqlite3.connect(str(db_file))
    cursor = conn.cursor()

    try:
        cursor.execute("PRAGMA foreign_keys = OFF;")

        # 1. Truncate all business tables
        for table in TABLES_TO_TRUNCATE:
            cursor.execute(f"DELETE FROM \"{table}\";")
            logger.info(f"Cleared table: {table}")

        # 2. Seed production admins
        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        for admin in PRODUCTION_ADMINS:
            admin_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO users (
                    id, telegram_id, login, password_hash, username, first_name, last_name,
                    role, status, phone, notes, language_code, is_active, created_by_teacher_id,
                    created_at, last_seen_at, last_login_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                admin_id,
                admin["telegram_id"],
                f"admin_{admin['telegram_id']}",
                None,  # No hardcoded password - Telegram identity authentication
                None,
                admin["first_name"],
                admin["last_name"],
                admin["role"],
                admin["status"],
                None,
                "Production System Administrator",
                admin["language_code"],
                1,
                None,
                now_str,
                now_str,
                None
            ))
            logger.info(f"Seeded Production Admin: Telegram ID {admin['telegram_id']}")

        # 3. Add system audit log
        audit_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO audit_logs (
                id, actor_id, action, target_type, target_id, metadata_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            audit_id,
            "SYSTEM",
            "PRODUCTION_DATABASE_RESET",
            "DATABASE",
            "platform.db",
            '{"event": "Clean 0-state reset and production admins initialized"}',
            now_str
        ))

        cursor.execute("PRAGMA foreign_keys = ON;")
        conn.commit()

        logger.info("--- PRODUCTION RESET VERIFICATION ---")
        for table in TABLES_TO_TRUNCATE:
            cnt = conn.execute(f"SELECT count(*) FROM \"{table}\";").fetchone()[0]
            logger.info(f"Table '{table}': {cnt} rows")

        admin_count = conn.execute("SELECT count(*) FROM users WHERE role = 'ADMIN';").fetchone()[0]
        logger.info(f"Total Admins: {admin_count}")
        assert admin_count == len(PRODUCTION_ADMINS), "Admin count mismatch!"
        logger.info("PRODUCTION DATABASE RESET SUCCESSFUL!")

    except Exception as e:
        conn.rollback()
        logger.error(f"Error during production reset: {e}", exc_info=True)
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    reset_database()
