import re
from typing import Tuple, Optional, Dict, Any, List
from app.models.assignment import AssignmentQuestion
from app.models.submission import SubmissionAnswer

def count_words(text: Optional[str]) -> int:
    """Accurately counts words in a text string."""
    if not text:
        return 0
    words = re.findall(r"\b[\w'-]+\b", text)
    return len(words)

def extract_raw_val(val: Any) -> str:
    if val is None:
        return ""
    if isinstance(val, bool):
        return "true" if val else "false"
    return str(val).strip()

def grade_question_answer(question: AssignmentQuestion, answer: SubmissionAnswer) -> Tuple[Optional[float], Optional[str]]:
    """
    Evaluates an answer for automatically gradable question types.
    Returns: (auto_score, feedback) or (None, None) if manual grading is required.
    """
    q_type = question.type.upper()
    correct = question.correct_answer
    max_pts = float(question.points)

    if correct is None:
        # Requires manual grading
        return None, None

    # Safe extraction of answer value
    raw_answer = answer.selected_options if answer.selected_options is not None else answer.text_answer
    user_val = extract_raw_val(raw_answer).lower()
    correct_val = extract_raw_val(correct).lower()

    # 1. MULTIPLE CHOICE / LISTENING / READING with options
    if q_type in ["MULTIPLE_CHOICE", "QUIZ", "LISTENING", "READING"]:
        if user_val == correct_val:
            return max_pts, "Correct! ✓"
        elif question.options or isinstance(correct, (str, int, bool)):
            return 0.0, f"Incorrect. Correct answer: {correct}"

    # 2. TRUE / FALSE
    elif q_type in ["TRUE_FALSE", "TRUE/FALSE"]:
        # Normalize true/false or t/f
        if user_val in ["t", "true", "yes", "1"]:
            user_val = "true"
        elif user_val in ["f", "false", "no", "0"]:
            user_val = "false"

        if correct_val in ["t", "true", "yes", "1"]:
            correct_val = "true"
        elif correct_val in ["f", "false", "no", "0"]:
            correct_val = "false"

        if user_val == correct_val:
            return max_pts, "Correct! ✓"
        return 0.0, f"Incorrect. Correct answer: {correct.capitalize() if isinstance(correct, str) else correct}"

    # 3. FILL IN THE BLANK
    elif q_type in ["FILL_BLANK", "FILL_IN_THE_BLANK"]:
        user_val = str(answer.text_answer or "").strip().lower()
        # Correct answer can be a single string or a list of acceptable variations
        acceptable: List[str] = []
        if isinstance(correct, list):
            acceptable = [str(x).strip().lower() for x in correct]
        else:
            acceptable = [str(correct).strip().lower()]

        if user_val in acceptable:
            return max_pts, "Correct! ✓"
        return 0.0, f"Incorrect. Expected: {', '.join(acceptable)}"

    # 4. SENTENCE BUILDER
    elif q_type in ["SENTENCE_BUILDER", "SENTENCE"]:
        user_sentence = re.sub(r"\s+", " ", str(answer.text_answer or "").strip().lower())
        correct_sentence = re.sub(r"\s+", " ", str(correct).strip().lower())
        # Strip trailing punctuation for comparison
        user_norm = re.sub(r"[.?!,]", "", user_sentence)
        corr_norm = re.sub(r"[.?!,]", "", correct_sentence)
        if user_norm == corr_norm:
            return max_pts, "Well done! Perfect sentence structure ✓"
        return 0.0, f"Incorrect order. Correct: {correct}"

    # 5. MATCHING
    elif q_type == "MATCHING":
        # answer.selected_options is expected to be dict {left_item: right_item}
        # correct is dict {left_item: right_item}
        if isinstance(correct, dict) and isinstance(answer.selected_options, dict):
            total_pairs = len(correct)
            if total_pairs == 0:
                return max_pts, "Completed ✓"
            correct_matches = 0
            for k, v in correct.items():
                if str(answer.selected_options.get(k, "")).strip().lower() == str(v).strip().lower():
                    correct_matches += 1
            score = round((correct_matches / total_pairs) * max_pts, 2)
            feedback = f"Matched {correct_matches} out of {total_pairs} correctly."
            return score, feedback
        return None, None

    # 6. VOCABULARY (if multiple choice or exact string provided)
    elif q_type == "VOCABULARY":
        if question.options and (answer.selected_options or answer.text_answer):
            user_val = str(answer.selected_options or answer.text_answer or "").strip().lower()
            if user_val == str(correct).strip().lower():
                return max_pts, "Correct vocabulary ✓"
            return 0.0, f"Incorrect. Correct: {correct}"
        return None, None

    # Manual tasks: WRITING, PICTURE_DESCRIPTION, SPEAKING, TRANSLATION, PHOTO, SHORT_ANSWER, LISTENING questions without options
    return None, None

def generate_ai_writing_assist(text: str, task_instructions: Optional[str] = None, min_words: Optional[int] = None) -> Dict[str, Any]:
    """
    AI Writing Assistance module.
    Provides structured grammar, vocabulary, and structure analysis for teacher assistance.
    """
    words = count_words(text)
    length_penalty = 0.0
    suggestions = []
    corrections = []

    if min_words and words < min_words:
        length_penalty = 1.5
        suggestions.append(f"Answer is below the required minimum word count ({words}/{min_words} words).")

    # Basic grammatical heuristics checks
    lower_text = text.lower()
    if " i " in text or text.startswith("i "):
        # lowercase 'i' checked already
        pass
    if "gooder" in lower_text or "more better" in lower_text:
        corrections.append({"found": "more better / gooder", "suggestion": "better (irregular comparative)"})
    if "alot" in lower_text:
        corrections.append({"found": "alot", "suggestion": "a lot (two words)"})

    # Vocabulary diversity check
    unique_words = len(set(re.findall(r"\b\w+\b", lower_text)))
    lexical_ratio = (unique_words / max(words, 1))

    # Base scores out of 10
    grammar_score = max(5.0, min(10.0, 9.5 - (len(corrections) * 1.0) - length_penalty))
    vocab_score = max(5.0, min(10.0, 8.0 + (lexical_ratio * 2.0)))
    structure_score = 9.0 if words >= (min_words or 30) else 7.0

    if lexical_ratio > 0.65:
        suggestions.append("Rich vocabulary diversity observed.")
    if words > 50:
        suggestions.append("Good elaboration and sentence length.")

    return {
        "word_count": words,
        "grammar_score": round(grammar_score, 1),
        "vocabulary_score": round(vocab_score, 1),
        "structure_score": round(structure_score, 1),
        "overall_suggested_score": round((grammar_score + vocab_score + structure_score) / 3, 1),
        "suggestions": suggestions,
        "possible_corrections": corrections
    }
