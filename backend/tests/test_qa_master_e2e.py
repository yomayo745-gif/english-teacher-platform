import io
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.database import init_db
from app.services.grading_service import grade_question_answer
from app.models.assignment import AssignmentQuestion
from app.models.submission import SubmissionAnswer

@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    await init_db()

@pytest.mark.asyncio
async def test_qa_test4_all_13_homework_types():
    """TEST 4: Homework Creation for all 13 dedicated homework types."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Teacher auth
        teacher_auth = await client.post("/api/v1/auth/dev-login", json={
            "role": "TEACHER",
            "first_name": "QA",
            "last_name": "Teacher",
            "username": "qa_teacher_all13"
        })
        assert teacher_auth.status_code == 200
        headers = {"Authorization": f"Bearer {teacher_auth.json()['access_token']}"}

        types = [
            ("PICTURE_DESCRIPTION", "Picture Description Task", "Describe what people are doing in the park.", "WRITING", {"min_words": 15}),
            ("WRITING", "Essay on Environment", "Write 50 words about recycling.", "WRITING", {"min_words": 20}),
            ("VOCABULARY", "IELTS Word Matching", "Match terms with definitions.", "VOCABULARY", {"options": ["abandon", "accumulate"]}),
            ("TRANSLATION", "Translate to Uzbek", "Translate: Knowledge is power.", "TRANSLATION", {"correct_answer": "Bilim bu kuch"}),
            ("MULTIPLE_CHOICE", "Grammar Quiz", "Choose the correct tense.", "MULTIPLE_CHOICE", {"options": ["is", "are", "were"], "correct_answer": "is"}),
            ("TRUE_FALSE", "Statement Verification", "The sun rises in the east.", "TRUE_FALSE", {"correct_answer": "true"}),
            ("FILL_BLANKS", "Fill the Blank", "She ___ to school every day.", "FILL_BLANK", {"correct_answer": ["goes", "walks"]}),
            ("MATCHING", "Match Synonyms", "Match words to synonyms.", "MATCHING", {"correct_answer": {"start": "begin", "end": "finish"}}),
            ("READING", "Short Story Reading", "Read the story and answer.", "READING", {"passage": "Long ago in Samarkand...", "options": ["A", "B"], "correct_answer": "A"}),
            ("LISTENING", "Dialogue Listening", "Listen to audio track.", "LISTENING", {"media_url": "/api/v1/media/audio/track.mp3", "options": ["Yes", "No"], "correct_answer": "Yes"}),
            ("SPEAKING", "Describe your Hometown", "Record 1 minute speaking.", "SPEAKING", {}),
            ("PHOTO", "Handwritten Homework Photo", "Upload photo of your notebook.", "PHOTO", {}),
            ("SHORT_ANSWER", "Short Explanation", "Explain what renewable energy is.", "SHORT_ANSWER", {})
        ]

        for hw_type, title, desc, q_type, extra_q in types:
            q_payload = {
                "order": 1,
                "type": q_type,
                "question_text": desc,
                "points": 5.0,
                "is_required": True,
                **extra_q
            }
            create_resp = await client.post("/api/v1/teacher/assignments", json={
                "title": title,
                "description": desc,
                "instructions": "Complete all parts",
                "type": hw_type,
                "difficulty": "Intermediate",
                "points": 10.0,
                "estimated_time_minutes": 15,
                "status": "PUBLISHED",
                "target_type": "ALL",
                "questions": [q_payload]
            }, headers=headers)
            assert create_resp.status_code == 200, f"Failed creating {hw_type}: {create_resp.text}"
            data = create_resp.json()
            assert data["status"] == "success"
            assert "assignment_id" in data

@pytest.mark.asyncio
async def test_qa_test5_assignment_targeting_and_isolation():
    """TEST 5: Homework Assignment Targeting & Student Isolation."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Login Teacher
        t_resp = await client.post("/api/v1/auth/dev-login", json={
            "role": "TEACHER", "first_name": "Target", "last_name": "Teacher", "username": "t_target"
        })
        t_headers = {"Authorization": f"Bearer {t_resp.json()['access_token']}"}

        # 2. Login Student A & Student B
        s_a_resp = await client.post("/api/v1/auth/dev-login", json={
            "role": "STUDENT", "first_name": "Student", "last_name": "A", "username": "student_a_unique", "telegram_id": 10001
        })
        s_a_data = s_a_resp.json()
        s_a_headers = {"Authorization": f"Bearer {s_a_data['access_token']}"}
        student_a_id = s_a_data["user"]["id"]

        s_b_resp = await client.post("/api/v1/auth/dev-login", json={
            "role": "STUDENT", "first_name": "Student", "last_name": "B", "username": "student_b_unique", "telegram_id": 10002
        })
        s_b_headers = {"Authorization": f"Bearer {s_b_resp.json()['access_token']}"}

        # 3. Create INDIVIDUAL assignment targeted ONLY to Student A
        indiv_resp = await client.post("/api/v1/teacher/assignments", json={
            "title": "Private Task for Student A Only",
            "description": "Exclusive test",
            "type": "WRITING",
            "difficulty": "Intermediate",
            "points": 10.0,
            "estimated_time_minutes": 15,
            "status": "PUBLISHED",
            "target_type": "INDIVIDUAL",
            "selected_student_ids": [student_a_id],
            "questions": [{
                "order": 1,
                "type": "WRITING",
                "question_text": "Write a short note.",
                "points": 10.0,
                "is_required": True
            }]
        }, headers=t_headers)
        assert indiv_resp.status_code == 200
        indiv_id = indiv_resp.json()["assignment_id"]

        # Student A can view
        res_a = await client.get(f"/api/v1/student/assignments/{indiv_id}", headers=s_a_headers)
        assert res_a.status_code == 200
        assert res_a.json()["assignment"]["id"] == indiv_id

        # Student B is FORBIDDEN (403)
        res_b = await client.get(f"/api/v1/student/assignments/{indiv_id}", headers=s_b_headers)
        assert res_b.status_code == 403

        # Student B cannot save draft (403)
        draft_b = await client.post(f"/api/v1/student/assignments/{indiv_id}/draft", json={
            "answers": []
        }, headers=s_b_headers)
        assert draft_b.status_code == 403

        # Student B cannot submit (403)
        sub_b = await client.post(f"/api/v1/student/assignments/{indiv_id}/submit", json={
            "answers": []
        }, headers=s_b_headers)
        assert sub_b.status_code == 403

@pytest.mark.asyncio
async def test_qa_test6_draft_autosave_and_submission_locking():
    """TEST 6: Student Homework Flow: Draft, Autosave, Submit, Re-submit guard."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        t_resp = await client.post("/api/v1/auth/dev-login", json={
            "role": "TEACHER", "first_name": "T6", "last_name": "Teacher", "username": "t6_teach"
        })
        t_headers = {"Authorization": f"Bearer {t_resp.json()['access_token']}"}

        s_resp = await client.post("/api/v1/auth/dev-login", json={
            "role": "STUDENT", "first_name": "S6", "last_name": "Student", "username": "s6_student"
        })
        s_headers = {"Authorization": f"Bearer {s_resp.json()['access_token']}"}

        # Create assignment with allow_edit_after_submit=False
        create_resp = await client.post("/api/v1/teacher/assignments", json={
            "title": "Strict Submission Assignment",
            "type": "WRITING",
            "difficulty": "Beginner",
            "points": 10.0,
            "estimated_time_minutes": 10,
            "status": "PUBLISHED",
            "target_type": "ALL",
            "allow_edit_after_submit": False,
            "questions": [{
                "order": 1,
                "type": "WRITING",
                "question_text": "Write a greeting message.",
                "points": 10.0,
                "is_required": True,
                "min_words": 2
            }]
        }, headers=t_headers)
        assert create_resp.status_code == 200
        hw_id = create_resp.json()["assignment_id"]

        detail = await client.get(f"/api/v1/student/assignments/{hw_id}", headers=s_headers)
        q_id = detail.json()["questions"][0]["id"]

        # 1. Autosave draft
        draft_res = await client.post(f"/api/v1/student/assignments/{hw_id}/draft", json={
            "answers": [{
                "question_id": q_id,
                "text_answer": "Hello my dear teacher!"
            }]
        }, headers=s_headers)
        assert draft_res.status_code == 200
        assert draft_res.json()["status"] == "saved"

        # Check draft persisted
        detail_after_draft = await client.get(f"/api/v1/student/assignments/{hw_id}", headers=s_headers)
        saved_ans = detail_after_draft.json()["questions"][0]["saved_answer"]
        assert saved_ans is not None
        assert saved_ans["text_answer"] == "Hello my dear teacher!"
        assert saved_ans["word_count"] == 4

        # 2. Final Submit
        submit_res = await client.post(f"/api/v1/student/assignments/{hw_id}/submit", json={
            "answers": [{
                "question_id": q_id,
                "text_answer": "Hello my dear teacher! This is my final submission."
            }]
        }, headers=s_headers)
        assert submit_res.status_code == 200
        assert submit_res.json()["status"] in ["SUBMITTED", "GRADED"]

        # 3. Attempt re-submit when allow_edit_after_submit=False -> Must be rejected with 400!
        resubmit_res = await client.post(f"/api/v1/student/assignments/{hw_id}/submit", json={
            "answers": [{
                "question_id": q_id,
                "text_answer": "Trying to edit after submission"
            }]
        }, headers=s_headers)
        assert resubmit_res.status_code == 400

@pytest.mark.asyncio
async def test_qa_test7_test8_test9_media_and_streaming():
    """TEST 7, 8, 9: Media upload security, disallowed extensions, Range streaming, and path traversal."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Disallowed extension: .exe or .sh must be rejected with 400
        malicious_file = io.BytesIO(b"malicious executable payload")
        bad_upload = await client.post(
            "/api/v1/media/upload",
            files={"file": ("malware.exe", malicious_file, "application/octet-stream")}
        )
        assert bad_upload.status_code == 400
        assert "not supported" in bad_upload.json()["detail"].lower()

        # 2. Allowed image upload: .png
        valid_img = io.BytesIO(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDRtestimagebytes")
        img_upload = await client.post(
            "/api/v1/media/upload",
            files={"file": ("test_pic.png", valid_img, "image/png")}
        )
        assert img_upload.status_code == 200
        img_data = img_upload.json()
        assert img_data["category"] == "images"
        filename = img_data["filename"]

        # 3. Path traversal attack attempt -> Must be rejected with 403 or 404
        traversal = await client.get("/api/v1/media/images/../../platform.db")
        assert traversal.status_code in [403, 404]

        # 4. Stream media with HTTP 206 Range Request
        range_resp = await client.get(
            f"/api/v1/media/images/{filename}",
            headers={"Range": "bytes=0-10"}
        )
        assert range_resp.status_code == 206
        assert "Content-Range" in range_resp.headers
        assert "bytes 0-10/" in range_resp.headers["Content-Range"]
        assert len(range_resp.content) == 11

@pytest.mark.asyncio
async def test_qa_test10_grading_logic_and_boolean_false():
    """TEST 10: Auto-grading evaluation, including boolean False fix."""
    # 1. True/False question where correct is False
    q_tf_false = AssignmentQuestion(
        id="q1",
        assignment_id="a1",
        order=1,
        type="TRUE_FALSE",
        question_text="The earth is flat.",
        points=5.0,
        correct_answer=False
    )
    # Student answers False (as boolean)
    ans_false = SubmissionAnswer(id="ans1", submission_id="s1", question_id="q1", selected_options=False)
    score, feedback = grade_question_answer(q_tf_false, ans_false)
    assert score == 5.0
    assert "Correct!" in feedback

    # Student answers True (as boolean) -> Incorrect
    ans_true = SubmissionAnswer(id="ans2", submission_id="s1", question_id="q1", selected_options=True)
    score_wrong, _ = grade_question_answer(q_tf_false, ans_true)
    assert score_wrong == 0.0

    # 2. Fill in the blank with variations
    q_fib = AssignmentQuestion(
        id="q2",
        assignment_id="a1",
        order=2,
        type="FILL_BLANK",
        question_text="He ___ to market.",
        points=4.0,
        correct_answer=["goes", "walks", "went"]
    )
    ans_fib = SubmissionAnswer(id="ans3", submission_id="s1", question_id="q2", text_answer="Walks")
    score_fib, fb_fib = grade_question_answer(q_fib, ans_fib)
    assert score_fib == 4.0
    assert "Correct!" in fb_fib

    # 3. Matching
    q_match = AssignmentQuestion(
        id="q3",
        assignment_id="a1",
        order=3,
        type="MATCHING",
        question_text="Match opposites",
        points=6.0,
        correct_answer={"hot": "cold", "big": "small", "fast": "slow"}
    )
    ans_match = SubmissionAnswer(
        id="ans4",
        submission_id="s1",
        question_id="q3",
        selected_options={"hot": "cold", "big": "small", "fast": "wrong"}
    )
    score_match, fb_match = grade_question_answer(q_match, ans_match)
    assert score_match == 4.0
    assert "2 out of 3" in fb_match
