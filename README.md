# English Teacher Homework Platform

A complete, production-ready educational platform designed specifically for an English teacher, consisting of:
1. **Telegram Bot**: Student onboarding, interactive commands (`/start`, `/main`, `/homework`, `/results`, `/profile`, `/help`), inline launch buttons, and automated alerts.
2. **Student Telegram WebApp**: Mobile-first, sleek SaaS design with homework runner for all 14 task types, streaming audio player, speaking voice recorder, draft autosave, submission management, and results/feedback dashboard.
3. **Teacher / Admin Web Panel**: Desktop-first responsive dashboard with KPI metrics, pending review queue, split-view submission review with audio playback, 8-step assignment builder, students directory, study groups, analytics, vocabulary bank, and audit logs.
4. **FastAPI Backend**: Async SQLAlchemy architecture with PostgreSQL / SQLite support, Alembic migrations, JWT authentication, official Telegram WebApp HMAC-SHA256 signature verification, and HTTP 206 Partial Content byte-range audio streaming.
5. **Universal Assignment Engine**: Full support for all 14 task types:
   - 🖼 **Picture Description** (image preview, live word counter, min/max limits)
   - ✍️ **Writing** (live word counter, required minimum words validation)
   - 📖 **Vocabulary** (definition, translation, multiple-choice)
   - 🌐 **Translation** (source text side-by-side with translation textarea)
   - 🔘 **Multiple Choice** (automatic grading)
   - ⚖️ **True / False** (automatic grading)
   - ✏️ **Fill in the Blank** (exact / alternative match grading)
   - 🧩 **Matching** (interactive pair matching)
   - 🧱 **Sentence Builder** (interactive word tile rearrangement)
   - 📚 **Reading Passage** (passage viewer with linked questions)
   - 🎧 **Listening** (streamed audio player, replay limits, transcript toggle, questions)
   - 🎙 **Speaking** (in-browser microphone recording with waveform, preview, and server upload)
   - 📷 **Photo Homework** (photo/scanned homework upload with preview)
   - 💬 **Short Answer** (text input)
   - 🎯 **Mixed Quiz** (combination of multiple question types)

---

## Architecture Overview

```
english-teacher-platform/
├── .env.example              # Environment variables template
├── docker-compose.yml        # Docker compose setup with PostgreSQL, Redis, Backend & Frontend
├── backend/
│   ├── requirements.txt      # Python dependencies
│   ├── alembic.ini           # Alembic database migrations config
│   ├── alembic/              # Migration scripts
│   ├── app/
│   │   ├── main.py           # FastAPI entrypoint, CORS, exception handling & lifecycle
│   │   ├── core/             # Config, security, database, storage (audio range streaming)
│   │   ├── models/           # User, Group, Assignment, Question, Submission, Notification, Audit
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── api/v1/           # REST endpoints (auth, student, teacher, media, common)
│   │   ├── services/         # Grading engine, Telegram notification service, reminders
│   │   ├── bot/              # Telegram Bot handlers and inline WebApp keyboards
│   │   ├── tasks/            # Background deadline reminder scheduler
│   │   └── utils/            # Development database seed script
│   └── tests/                # Automated pytest suite (E2E flows & auto-grading)
└── frontend/
    ├── package.json
    ├── vite.config.ts        # Vite config with backend API proxy
    ├── tailwind.config.js    # Premium Linear/Apple-inspired styling tokens
    ├── index.html            # Includes Telegram WebApp SDK
    └── src/
        ├── api/              # API client with JWT and Telegram initData support
        ├── context/          # AuthContext with Telegram and role management
        ├── components/
        │   ├── ui/           # Reusable Button, Card, Badge, Modal, AudioPlayer, AudioRecorder, FileUploader, WordCounter
        │   ├── layout/       # StudentLayout (mobile-first) & TeacherLayout (desktop-first)
        │   └── assignment/   # UniversalQuestionRunner for all 14 task types
        └── pages/
            ├── student/      # Home, Tasks, TaskDetail (Runner & Drafts), Results, ResultDetail, Profile, Notifications
            └── teacher/      # Dashboard, PendingReviews, ReviewSubmission (Split view), Assignments, Builder, Students, Groups, Analytics, Settings
```

---

## Quick Start (Local Development)

### 1. Backend Setup
```bash
cd backend
python -m pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# (Optional) Seed rich development sample data (all 4 sample tasks, groups, teacher & student)
python -m app.utils.seed_dev

# Run automated tests
python -m pytest

# Start backend server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install

# Build production bundle
npm run build

# Start frontend dev server
npm run dev
```

The frontend will be available at:
- **Student WebApp**: `http://localhost:5173/app`
- **Teacher Admin Panel**: `http://localhost:5173/admin`

*(A quick switcher button is provided in the UI header for convenient testing between Student and Teacher perspectives in any browser).*

---

## Running with Docker Compose

To run the complete platform with PostgreSQL and Redis:
```bash
# Copy environment configuration
cp .env.example .env

# Start all containers
docker compose up --build -d
```

Services:
- Backend: `http://localhost:8000`
- Frontend: `http://localhost:5173`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

---

## Telegram Bot Setup

1. Open [@BotFather](https://t.me/BotFather) on Telegram and create a new bot (`/newbot`).
2. Copy your bot token into `.env`:
   ```env
   TELEGRAM_BOT_TOKEN=1234567890:ABCdefGhIJKlmNoPQRsTUVwxyZ
   ADMIN_TELEGRAM_ID=6896779142
   WEBAPP_URL=https://your-public-url.com/app
   ```
3. In `@BotFather`, configure your bot's Menu Button or WebApp link:
   - `/setmenubutton` -> Send your bot username -> Configure URL to your WebApp URL (`https://your-domain.com/app`).
4. When students start the bot with `/start`, their student account is auto-provisioned and they can open the WebApp with one tap!
5. When the teacher (`ADMIN_TELEGRAM_ID`) starts the bot, they receive the Teacher Management panel buttons.

---

## Security & Verification

- **Telegram WebApp Signature Verification**: Authenticates official Telegram `initData` using HMAC-SHA256 with the secret key derived from `TELEGRAM_BOT_TOKEN`.
- **Role-Based Access Control**: Strict backend guards (`require_student`, `require_teacher_or_admin`, `require_admin`). Student queries are isolated to their own records.
- **Media Streaming**: Audio files are served using HTTP 206 Partial Content range requests, allowing students and teachers to scrub and seek audio without waiting for the full file to download.
- **Automated Tests**: Comprehensive pytest suite covers Telegram authentication, draft saving, submission deadlines, late tracking, auto-grading, and manual teacher review. Run with:
  ```bash
  python -m pytest
  ```
