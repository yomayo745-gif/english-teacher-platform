import asyncio
import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy import select
from app.core.config import settings
from app.core.database import AsyncSessionLocal, init_db
from app.models import User, Group, GroupMember, Assignment, AssignmentQuestion, VocabularyItem, Lesson, LessonProgress

async def seed_development_data():
    """
    Populates sample development data for testing out all 14 task types,
    groups, and workflows.
    DO NOT RUN IN PRODUCTION.
    """
    print("[DEV SEED] Initializing database tables...")
    await init_db()

    async with AsyncSessionLocal() as session:
        # Check if already seeded
        res = await session.execute(select(User).where(User.telegram_id == settings.ADMIN_TELEGRAM_ID))
        admin_user = res.scalar_one_or_none()

        if not admin_user:
            admin_user = User(
                id=str(uuid.uuid4()),
                telegram_id=settings.ADMIN_TELEGRAM_ID,
                username="teacher_bahrom",
                first_name="Bahrom",
                last_name="Ustoz",
                role="ADMIN",
                language_code="en",
                is_active=True,
                created_at=datetime.now(timezone.utc),
                last_seen_at=datetime.now(timezone.utc)
            )
            session.add(admin_user)
            await session.flush()
            print(f"[DEV SEED] Created Admin Teacher: {admin_user.full_name}")

        # Create sample student
        res_stu = await session.execute(select(User).where(User.telegram_id == 123456789))
        student_user = res_stu.scalar_one_or_none()
        if not student_user:
            student_user = User(
                id=str(uuid.uuid4()),
                telegram_id=123456789,
                username="azizbek_k",
                first_name="Azizbek",
                last_name="Karimov",
                role="STUDENT",
                language_code="en",
                is_active=True,
                created_at=datetime.now(timezone.utc),
                last_seen_at=datetime.now(timezone.utc)
            )
            session.add(student_user)
            await session.flush()
            print(f"[DEV SEED] Created Sample Student: {student_user.full_name}")

        # Create Study Groups
        grp_res = await session.execute(select(Group).where(Group.name == "B1 Intermediate (Evening)"))
        group = grp_res.scalar_one_or_none()
        if not group:
            group = Group(
                id=str(uuid.uuid4()),
                name="B1 Intermediate (Evening)",
                description="General English B1 preparation group",
                level="B1 Intermediate",
                created_at=datetime.now(timezone.utc)
            )
            session.add(group)
            await session.flush()

            # Add student to group
            member = GroupMember(
                id=str(uuid.uuid4()),
                group_id=group.id,
                student_id=student_user.id,
                joined_at=datetime.now(timezone.utc)
            )
            session.add(member)

        # Create Assignment 1: Picture Description
        a1_res = await session.execute(select(Assignment).where(Assignment.title == "Picture Description: Oxford Street"))
        if not a1_res.scalar_one_or_none():
            a1 = Assignment(
                id=str(uuid.uuid4()),
                teacher_id=admin_user.id,
                title="Picture Description: Oxford Street",
                description="Describe the bustling London street scene.",
                instructions="Write at least 60 words describing what people are doing, the weather, and transport visible in the image.",
                type="PICTURE_DESCRIPTION",
                difficulty="Intermediate",
                points=10.0,
                estimated_time_minutes=15,
                deadline=datetime.now(timezone.utc) + timedelta(days=2),
                allow_late_submission=True,
                status="PUBLISHED",
                target_type="ALL",
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            session.add(a1)
            await session.flush()

            q1 = AssignmentQuestion(
                id=str(uuid.uuid4()),
                assignment_id=a1.id,
                order=1,
                type="PICTURE_DESCRIPTION",
                question_text="Describe what you see in the picture in detail.",
                description="Include descriptive adjectives and present continuous sentences.",
                media_url="https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80",
                media_type="image",
                min_words=50,
                max_words=150,
                points=10.0,
                is_required=True
            )
            session.add(q1)

        # Create Assignment 2: Listening Homework
        a2_res = await session.execute(select(Assignment).where(Assignment.title == "Listening Comprehension: Trip to Edinburgh"))
        if not a2_res.scalar_one_or_none():
            a2 = Assignment(
                id=str(uuid.uuid4()),
                teacher_id=admin_user.id,
                title="Listening Comprehension: Trip to Edinburgh",
                description="Listen to the audio dialogue and answer comprehension questions.",
                instructions="Listen carefully up to 3 times and answer the multiple-choice questions.",
                type="LISTENING",
                difficulty="Intermediate",
                points=10.0,
                estimated_time_minutes=15,
                deadline=datetime.now(timezone.utc) + timedelta(days=3),
                allow_late_submission=True,
                audio_play_limit=3,
                show_transcript=False,
                status="PUBLISHED",
                target_type="ALL",
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            session.add(a2)
            await session.flush()

            q2_1 = AssignmentQuestion(
                id=str(uuid.uuid4()),
                assignment_id=a2.id,
                order=1,
                type="LISTENING",
                question_text="How did Sarah travel to Edinburgh?",
                media_url="https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg",
                media_type="audio",
                transcript="Sarah took the early morning express train from King's Cross to Edinburgh Waverley.",
                options=["By express train", "By flight", "By rental car", "By coach bus"],
                correct_answer="By express train",
                points=5.0,
                is_required=True
            )
            q2_2 = AssignmentQuestion(
                id=str(uuid.uuid4()),
                assignment_id=a2.id,
                order=2,
                type="LISTENING",
                question_text="How long was Sarah's stay in Scotland?",
                options=["Two days", "A full week", "One month", "Three weekends"],
                correct_answer="A full week",
                points=5.0,
                is_required=True
            )
            session.add(q2_1)
            session.add(q2_2)

        # Create Assignment 3: Speaking Practice
        a3_res = await session.execute(select(Assignment).where(Assignment.title == "Speaking Practice: My Dream Career"))
        if not a3_res.scalar_one_or_none():
            a3 = Assignment(
                id=str(uuid.uuid4()),
                teacher_id=admin_user.id,
                title="Speaking Practice: My Dream Career",
                description="Record a 1-minute voice answer speaking about your goals.",
                instructions="Speak clearly into your microphone about what job you want in the future and why.",
                type="SPEAKING",
                difficulty="Intermediate",
                points=10.0,
                estimated_time_minutes=10,
                deadline=datetime.now(timezone.utc) + timedelta(days=4),
                allow_late_submission=True,
                status="PUBLISHED",
                target_type="ALL",
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            session.add(a3)
            await session.flush()

            q3 = AssignmentQuestion(
                id=str(uuid.uuid4()),
                assignment_id=a3.id,
                order=1,
                type="SPEAKING",
                question_text="Speak about your dream job for 1 minute.",
                description="Mention why this career inspires you and what skills you need.",
                points=10.0,
                is_required=True
            )
            session.add(q3)

        # Create Assignment 4: Grammar & Sentence Builder
        a4_res = await session.execute(select(Assignment).where(Assignment.title == "Grammar: Sentence Builder & Fill Blank"))
        if not a4_res.scalar_one_or_none():
            a4 = Assignment(
                id=str(uuid.uuid4()),
                teacher_id=admin_user.id,
                title="Grammar: Sentence Builder & Fill Blank",
                description="Sentence structure and vocabulary practice.",
                type="MIXED",
                difficulty="A2 Elementary",
                points=10.0,
                estimated_time_minutes=10,
                deadline=datetime.now(timezone.utc) + timedelta(days=5),
                status="PUBLISHED",
                target_type="ALL",
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            session.add(a4)
            await session.flush()

            q4_1 = AssignmentQuestion(
                id=str(uuid.uuid4()),
                assignment_id=a4.id,
                order=1,
                type="SENTENCE_BUILDER",
                question_text="Rearrange the words into a correct English sentence:",
                options=["study", "English", "I", "every", "day"],
                correct_answer="I study English every day",
                points=5.0,
                is_required=True
            )
            q4_2 = AssignmentQuestion(
                id=str(uuid.uuid4()),
                assignment_id=a4.id,
                order=2,
                type="FILL_BLANK",
                question_text="I ___ to the gym three times a week. (go / goes)",
                correct_answer=["go"],
                points=5.0,
                is_required=True
            )
            session.add(q4_1)
            session.add(q4_2)

        # Seed sample vocabulary items
        v_res = await session.execute(select(VocabularyItem).limit(1))
        if not v_res.scalar_one_or_none():
            v_items = [
                VocabularyItem(id=str(uuid.uuid4()), word="Diligent", translation="Tirishqoq, g'ayratli", part_of_speech="Adjective", example_sentence="She is a diligent student who never misses class.", difficulty="B2"),
                VocabularyItem(id=str(uuid.uuid4()), word="Accomplish", translation="Erishmoq, bajarmoq", part_of_speech="Verb", example_sentence="He accomplished his dream of studying in the UK.", difficulty="B1"),
                VocabularyItem(id=str(uuid.uuid4()), word="Fluent", translation="Ravon, erkin", part_of_speech="Adjective", example_sentence="She became fluent in English after one year of immersion.", difficulty="B2"),
            ]
            session.add_all(v_items)

        # Seed Sample Lessons
        l1_res = await session.execute(select(Lesson).where(Lesson.title == "Lesson 1: Present Perfect vs Past Simple"))
        if not l1_res.scalar_one_or_none():
            ass_found = await session.execute(select(Assignment).where(Assignment.title == "Picture Description: Oxford Street"))
            ass_obj = ass_found.scalar_one_or_none()

            l1 = Lesson(
                id=str(uuid.uuid4()),
                teacher_id=admin_user.id,
                title="Lesson 1: Present Perfect vs Past Simple",
                description="Understand the fundamental differences between actions connected to the present and finished past actions.",
                content="""# Present Perfect vs Past Simple

### 1. When do we use the Past Simple?
We use the **Past Simple** for events that happened at a **definite time in the past** and are completely finished.
* *Example:* I **visited** Samarkand last month.
* *Time markers:* yesterday, ago, last week, in 2021.

### 2. When do we use the Present Perfect?
We use the **Present Perfect** for actions that occurred at an **unspecified time** or actions that have a **direct result in the present**.
* *Structure:* Subject + have/has + Past Participle (V3)
* *Example:* I **have visited** London three times in my life.
* *Time markers:* just, already, yet, ever, never, for, since.

### 3. Comparison Chart
| Past Simple | Present Perfect |
| :--- | :--- |
| Finished time (yesterday) | Unfinished time (this week, today) |
| Specific moment in history | Life experience |
| "Did you see John yesterday?" | "Have you seen John today?" |
""",
                media_type="audio",
                media_url="/static/uploads/sample_listening.mp3",
                media_duration=120.0,
                vocabulary=[
                    {"word": "Experience", "phonetic": "/ɪkˈspɪə.ri.əns/", "translation": "Tajriba / Hayotiy tajriba", "example": "Traveling provides valuable life experience."},
                    {"word": "Recent", "phonetic": "/ˈriː.sənt/", "translation": "Yaqinda bo‘lgan / Yangi", "example": "In recent years, technology has advanced rapidly."},
                    {"word": "Accomplishment", "phonetic": "/əˈkʌm.plɪʃ.mənt/", "translation": "Yutuq / Muvaffaqiyat", "example": "Graduating with honors was a huge accomplishment."}
                ],
                exercises=[
                    {
                        "id": "ex1",
                        "question": "Which sentence is grammatically correct for a finished past action?",
                        "options": ["I have seen him yesterday.", "I saw him yesterday.", "I had see him yesterday."],
                        "correct_answer": "I saw him yesterday."
                    },
                    {
                        "id": "ex2",
                        "question": "Choose the best fit: 'She ___ her keys, so she cannot enter the house right now.'",
                        "options": ["lost", "has lost", "is losing"],
                        "correct_answer": "has lost"
                    }
                ],
                attached_assignment_id=ass_obj.id if ass_obj else None,
                order=1,
                target_type="ALL",
                status="PUBLISHED",
                estimated_time_minutes=25,
                created_at=datetime.now(timezone.utc)
            )
            session.add(l1)
            await session.flush()

            # Add student progress for lesson 1
            prog1 = LessonProgress(
                id=str(uuid.uuid4()),
                lesson_id=l1.id,
                student_id=student_user.id,
                status="IN_PROGRESS",
                progress_percent=60,
                last_accessed_at=datetime.now(timezone.utc)
            )
            session.add(prog1)

        l2_res = await session.execute(select(Lesson).where(Lesson.title == "Lesson 2: Travel & Airport English"))
        if not l2_res.scalar_one_or_none():
            l2 = Lesson(
                id=str(uuid.uuid4()),
                teacher_id=admin_user.id,
                title="Lesson 2: Travel & Airport English",
                description="Essential phrases, boarding procedures, luggage handling, and airport conversations.",
                content="""# Travel & Airport English

### Navigating the Airport
When traveling internationally, you will encounter standard check-in and security checkpoints.

### Key Phrases:
* "Could I see your boarding pass and passport, please?"
* "Do you have any baggage to check in?"
* "Which gate does flight TK 371 depart from?"
* "Is this flight on time, or is there a delay?"
""",
                media_type="audio",
                media_url="/static/uploads/sample_listening.mp3",
                media_duration=180.0,
                vocabulary=[
                    {"word": "Boarding pass", "phonetic": "/ˈbɔː.dɪŋ ˌpɑːs/", "translation": "Samolyotga chiqish taloni", "example": "Please present your boarding pass at gate 4."},
                    {"word": "Luggage allowance", "phonetic": "/ˈlʌɡ.ɪdʒ əˌlaʊ.əns/", "translation": "Yuk me'yori", "example": "The baggage allowance is 23 kilograms per passenger."},
                    {"word": "Departure gate", "phonetic": "/dɪˈpɑː.tʃər ɡeɪt/", "translation": "Uchib ketish darvozasi (gate)", "example": "Proceed to departure gate B12 immediately."}
                ],
                exercises=[
                    {
                        "id": "ex_tr1",
                        "question": "What document do you show to board an airplane?",
                        "options": ["Credit card", "Boarding pass", "Receipt"],
                        "correct_answer": "Boarding pass"
                    }
                ],
                order=2,
                target_type="ALL",
                status="PUBLISHED",
                estimated_time_minutes=20,
                created_at=datetime.now(timezone.utc)
            )
            session.add(l2)

        await session.commit()
        print("[DEV SEED] Sample data populated successfully! All 4 assignments and sample lessons ready.")

if __name__ == "__main__":
    asyncio.run(seed_development_data())
