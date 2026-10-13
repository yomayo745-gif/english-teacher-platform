import sqlite3

conn = sqlite3.connect("platform.db")
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
tables = [r[0] for r in cursor.fetchall()]
for t in tables:
    count = conn.execute(f'SELECT count(*) FROM "{t}"').fetchone()[0]
    print(f"{t}: {count}")
conn.close()
