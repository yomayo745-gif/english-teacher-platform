from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from sqlalchemy import event
from app.core.config import settings

# Setup engine arguments depending on DB type
connect_args = {}
if "sqlite" in settings.DATABASE_URL:
    connect_args = {"check_same_thread": False}

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    connect_args=connect_args,
    future=True
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

Base = declarative_base()

async def get_db():
    """FastAPI dependency for providing async database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

def sync_migrate_tables(sync_conn):
    Base.metadata.create_all(sync_conn)
    cursor = sync_conn.connection.cursor()
    cursor.execute("PRAGMA table_info(users)")
    table_info = cursor.fetchall()
    columns = [row[1] for row in table_info]

    tg_row = next((r for r in table_info if r[1] == 'telegram_id'), None)
    if tg_row and tg_row[3] == 1:  # notnull == 1 -> migrate to nullable
        cursor.execute("PRAGMA foreign_keys=OFF")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users_migration (
                id VARCHAR(36) NOT NULL PRIMARY KEY,
                telegram_id BIGINT UNIQUE,
                username VARCHAR(255),
                first_name VARCHAR(255) NOT NULL,
                last_name VARCHAR(255),
                role VARCHAR(32) NOT NULL,
                language_code VARCHAR(10) NOT NULL,
                is_active BOOLEAN NOT NULL,
                created_at DATETIME NOT NULL,
                last_seen_at DATETIME NOT NULL,
                login VARCHAR(100) UNIQUE,
                password_hash VARCHAR(255),
                status VARCHAR(32) DEFAULT 'ACTIVE',
                phone VARCHAR(50),
                notes TEXT,
                created_by_teacher_id VARCHAR(36),
                last_login_at DATETIME
            )
        """)
        cursor.execute("""
            INSERT INTO users_migration (
                id, telegram_id, username, first_name, last_name, role,
                language_code, is_active, created_at, last_seen_at,
                login, password_hash, status, phone, notes,
                created_by_teacher_id, last_login_at
            )
            SELECT 
                id, telegram_id, username, first_name, last_name, role,
                language_code, is_active, created_at, last_seen_at,
                login, password_hash, status, phone, notes,
                created_by_teacher_id, last_login_at
            FROM users
        """)
        cursor.execute("DROP TABLE users")
        cursor.execute("ALTER TABLE users_migration RENAME TO users")
        cursor.execute("PRAGMA foreign_keys=ON")

        # Refresh columns
        cursor.execute("PRAGMA table_info(users)")
        columns = [row[1] for row in cursor.fetchall()]

    if "login" not in columns:
        cursor.execute("ALTER TABLE users ADD COLUMN login VARCHAR(100)")
    if "password_hash" not in columns:
        cursor.execute("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)")
    if "status" not in columns:
        cursor.execute("ALTER TABLE users ADD COLUMN status VARCHAR(32) DEFAULT 'ACTIVE'")
    if "phone" not in columns:
        cursor.execute("ALTER TABLE users ADD COLUMN phone VARCHAR(50)")
    if "notes" not in columns:
        cursor.execute("ALTER TABLE users ADD COLUMN notes TEXT")
    if "created_by_teacher_id" not in columns:
        cursor.execute("ALTER TABLE users ADD COLUMN created_by_teacher_id VARCHAR(36)")
    if "last_login_at" not in columns:
        cursor.execute("ALTER TABLE users ADD COLUMN last_login_at DATETIME")

    cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_login ON users (login)")
    cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_telegram_id ON users (telegram_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS ix_users_status ON users (status)")

async def init_db():
    """Initializes tables on startup with auto-migrations."""
    async with engine.begin() as conn:
        await conn.run_sync(sync_migrate_tables)
