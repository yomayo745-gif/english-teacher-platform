import pytest
from app.models.assignment import AssignmentQuestion
from app.models.submission import SubmissionAnswer
from app.services.grading_service import grade_question_answer, count_words, generate_ai_writing_assist

def test_count_words():
    assert count_words("Hello world") == 2
    assert count_words("This is a production-ready test for English homework.") == 8
    assert count_words("") == 0
    assert count_words(None) == 0

def test_multiple_choice_grading():
    q = AssignmentQuestion(
        type="MULTIPLE_CHOICE",
        correct_answer="Option B",
        points=2.0
    )
    ans_correct = SubmissionAnswer(selected_options="Option B")
    score, feedback = grade_question_answer(q, ans_correct)
    assert score == 2.0
    assert "Correct" in feedback

    ans_wrong = SubmissionAnswer(selected_options="Option A")
    score, feedback = grade_question_answer(q, ans_wrong)
    assert score == 0.0

def test_true_false_grading():
    q = AssignmentQuestion(
        type="TRUE_FALSE",
        correct_answer="true",
        points=1.0
    )
    ans = SubmissionAnswer(selected_options="True")
    score, _ = grade_question_answer(q, ans)
    assert score == 1.0

def test_fill_in_the_blank_grading():
    q = AssignmentQuestion(
        type="FILL_BLANK",
        correct_answer=["studies", "is studying"],
        points=1.5
    )
    ans = SubmissionAnswer(text_answer="studies")
    score, _ = grade_question_answer(q, ans)
    assert score == 1.5

    ans_alt = SubmissionAnswer(text_answer="Is Studying")
    score_alt, _ = grade_question_answer(q, ans_alt)
    assert score_alt == 1.5

def test_sentence_builder_grading():
    q = AssignmentQuestion(
        type="SENTENCE_BUILDER",
        correct_answer="I study English every day.",
        points=2.0
    )
    ans = SubmissionAnswer(text_answer="I study English every day")
    score, _ = grade_question_answer(q, ans)
    assert score == 2.0

def test_ai_writing_assist():
    text = "In this picture, there is a student who studies English in the library. She has alot of books on the desk."
    res = generate_ai_writing_assist(text, min_words=10)
    assert res["word_count"] > 15
    assert res["grammar_score"] > 0
    assert any("alot" in c["found"] for c in res["possible_corrections"])
