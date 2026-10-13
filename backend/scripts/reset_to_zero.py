import sqlite3
import os
import shutil

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "platform.db")
UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")

ADMIN_TELEGRAM_IDS = [1073079396, 6896779142]

def reset_to_zero():
    if not os.path.exists(DB_PATH):
        print(f"Error: {DB_PATH} not found.")
        return

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # 1. Clear relational data
    tables_to_clear = [
        "submission_answers",
        "submissions",
        "assignment_questions",
        "assignment_targets",
        "assignments",
        "lesson_progress",
        "lesson_targets",
        "lessons",
        "vocabulary_items",
        "group_members",
        "groups",
        "notifications",
        "audit_logs"
    ]

    for table in tables_to_clear:
        cur.execute(f"DELETE FROM {table}")
        print(f"Cleared table: {table}")

    # 2. Clean users: KEEP ONLY production admin IDs
    cur.execute(
        f"DELETE FROM users WHERE telegram_id NOT IN ({','.join(map(str, ADMIN_TELEGRAM_IDS))}) OR telegram_id IS NULL"
    )
    
    # 3. Ensure production admins exist and are ADMIN role
    for tg_id in ADMIN_TELEGRAM_IDS:
        cur.execute("SELECT id FROM users WHERE telegram_id = ?", (tg_id,))
        row = cur.fetchone()
        if row:
            cur.execute("""
                UPDATE users 
                SET role = 'ADMIN', status = 'ACTIVE', is_active = 1 
                WHERE telegram_id = ?
            """, (tg_id,))
            print(f"Updated existing admin user with Telegram ID: {tg_id}")
        else:
            import uuid
            from datetime import datetime, timezone
            now = datetime.now(timezone.utc).isoformat()
            user_id = str(uuid.uuid4())
            cur.execute("""
                INSERT INTO users (id, telegram_id, role, status, is_active, created_at, last_seen_at)
                VALUES (?, ?, 'ADMIN', 'ACTIVE', 1, ?, ?)
            """, (user_id, tg_id, now, now))
            print(f"Created clean admin record for Telegram ID: {tg_id}")

    conn.commit()

    # 4. Clean uploads folder (keep subdirectories)
    for sub in ["audio", "docs", "images"]:
        sub_path = os.path.join(UPLOADS_DIR, sub)
        if os.path.exists(sub_path):
            for f in os.listdir(sub_path):
                f_path = os.path.join(sub_path, f)
                try:
                    if os.path.isfile(f_path):
                        os.remove(f_path)
                except Exception as e:
                    print(f"Error removing {f_path}: {e}")
    print("Cleaned demo uploaded files.")

    # 5. Verification
    print("\n--- DATABASE 0-STATE VERIFICATION ---")
    cur.execute("SELECT count(*) FROM users")
    print("Users count (Only Admins):", cur.fetchone()[0])
    cur.execute("SELECT telegram_id, role, status, username FROM users")
    for r in cur.fetchall():
        print("  Admin:", r)
    cur.execute("SELECT count(*) FROM groups")
    print("Groups count:", cur.fetchone()[0])
    cur.execute("SELECT count(*) FROM assignments")
    print("Assignments count:", cur.fetchone()[0])
    cur.execute("SELECT count(*) FROM submissions")
    print("Submissions count:", cur.fetchone()[0])
    cur.execute("SELECT count(*) FROM lessons")
    print("Lessons count:", cur.fetchone()[0])
    cur.execute("SELECT count(*) FROM vocabulary_items")
    print("Vocabulary count:", cur.fetchone()[0])

    conn.close()
    print("\nSUCCESS: System completely reset to 0-state!")

if __name__ == "__main__":
    reset_to_zero()
