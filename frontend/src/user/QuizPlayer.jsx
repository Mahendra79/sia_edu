import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineXCircle,
  HiOutlinePlayCircle,
} from "react-icons/hi2";

import LoadingSpinner from "../components/LoadingSpinner";
import { useToast } from "../context/ToastContext";
import MainLayout from "../layouts/MainLayout";
import { courseService } from "../services/courseService";
import "./user.css";

function formatTime(seconds) {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function buildAnswerMaps(answers = []) {
  return answers.reduce(
    (maps, answer) => {
      if (answer?.question_id && answer?.selected_option_id) {
        maps.selected[answer.question_id] = answer.selected_option_id;
        maps.feedback[answer.question_id] = answer;
      }
      return maps;
    },
    { selected: {}, feedback: {} },
  );
}

const MODULE_TITLES = {
  1: "Mathematical Foundations of Quantum Computing",
  2: "Quantum Gates and Circuit Design",
  3: "Entanglement, Correlation, and State Analysis",
  4: "Fundamental Quantum Algorithms",
  5: "Quantum Information and Search Algorithms",
  6: "Quantum Cryptography and Secure Communication",
  7: "Variational Quantum Algorithms and Optimization",
  8: "QML on Quantum-Encoded Datasets Using HDQS",
};

function parseExplanation(text) {
  if (!text) return { main: "", verification: "" };
  // Remove boilerplate prefix: "Detailed explanation for Quiz X Question Y (Question text):"
  const cleanedText = text.replace(/^Detailed\s+explanation\s+for\s+Quiz\s+\d+\s+Question\s+\d+\s*\([^)]*\):\s*/i, "").trim();
  const parts = cleanedText.split(/(?=This answer is verified through)/i);
  if (parts.length > 1) {
    return {
      main: parts[0].trim(),
      verification: parts[1].trim(),
    };
  }
  return { main: cleanedText, verification: "" };
}

export default function QuizPlayer() {
  const { courseId, quizId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [attempt, setAttempt] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedByQuestionId, setSelectedByQuestionId] = useState({});
  const [feedbackByQuestionId, setFeedbackByQuestionId] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [result, setResult] = useState(null);
  const autoAdvanceRef = useRef(false);

  useEffect(() => {
    const start = async () => {
      setLoading(true);
      setCurrentIndex(0);
      setSelectedByQuestionId({});
      setFeedbackByQuestionId({});
      setShowReview(false);
      setResult(null);
      try {
        const response = await courseService.startQuiz(quizId);
        setAttempt(response.data);
        const answerMaps = buildAnswerMaps(response.data?.answers || []);
        setSelectedByQuestionId(answerMaps.selected);
        setFeedbackByQuestionId(answerMaps.feedback);
        setTimeLeft(Number(response.data?.time_per_question_seconds || 25));
      } catch (error) {
        const detail = error?.response?.data?.detail || "Unable to start quiz.";
        addToast({ type: "error", message: detail });
        navigate(`/user/lms/${courseId}`, { replace: true });
      } finally {
        setLoading(false);
      }
    };
    start();
  }, [quizId, courseId, navigate, addToast]);

  const questions = attempt?.questions || [];
  const currentQuestion = questions[currentIndex];
  const questionSeconds = Number(attempt?.time_per_question_seconds || attempt?.quiz_time_per_question_seconds || 0);
  const fallbackSeconds = Number(attempt?.questions?.length ? 25 : 0);
  const perQuestionSeconds = Number(attempt?.time_per_question_seconds || attempt?.quiz?.time_per_question_seconds || questionSeconds || fallbackSeconds || 25);

  const answeredCount = useMemo(
    () => questions.filter((question) => selectedByQuestionId[question.id]).length,
    [questions, selectedByQuestionId],
  );
  const unansweredCount = Math.max(0, questions.length - answeredCount);

  useEffect(() => {
    if (!currentQuestion || showReview || result) {
      return undefined;
    }
    autoAdvanceRef.current = false;
    setTimeLeft(perQuestionSeconds);
    return undefined;
  }, [currentIndex, currentQuestion?.id, perQuestionSeconds, showReview, result]);

  useEffect(() => {
    if (!currentQuestion || showReview || result) {
      return undefined;
    }
    const timer = window.setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [currentQuestion?.id, showReview, result]);

  useEffect(() => {
    if (!currentQuestion || showReview || result || timeLeft !== 0 || autoAdvanceRef.current) {
      return;
    }
    autoAdvanceRef.current = true;
    saveAndMove({ autoNext: true, selectedOptionId: selectedByQuestionId[currentQuestion.id] || null });
  }, [timeLeft, currentQuestion?.id, showReview, result]);

  const saveAnswer = async (question, selectedOptionId) => {
    if (!attempt || !question) {
      return null;
    }
    const response = await courseService.saveQuizAnswer(attempt.id, {
      question_id: question.id,
      selected_option_id: selectedOptionId || null,
      time_taken_seconds: Math.max(0, perQuestionSeconds - timeLeft),
    });
    return response.data;
  };

  const selectAnswer = async (question, optionId) => {
    if (!question || saving || feedbackByQuestionId[question.id]) {
      return;
    }
    setSelectedByQuestionId((prev) => ({
      ...prev,
      [question.id]: optionId,
    }));
    setSaving(true);
    try {
      const savedAnswer = await saveAnswer(question, optionId);
      if (savedAnswer) {
        setFeedbackByQuestionId((prev) => ({
          ...prev,
          [question.id]: savedAnswer,
        }));
      }
    } catch {
      addToast({ type: "error", message: "Unable to save answer." });
    } finally {
      setSaving(false);
    }
  };

  const saveAndMove = async ({ autoNext = false, selectedOptionId } = {}) => {
    if (!currentQuestion || saving) {
      return;
    }
    const movingFromIndex = currentIndex;
    setSaving(true);
    try {
      const savedAnswer = await saveAnswer(currentQuestion, selectedOptionId ?? selectedByQuestionId[currentQuestion.id] ?? null);
      if (savedAnswer) {
        setFeedbackByQuestionId((prev) => ({
          ...prev,
          [currentQuestion.id]: savedAnswer,
        }));
      }
      if (movingFromIndex < questions.length - 1) {
        setCurrentIndex((prev) => (prev === movingFromIndex ? prev + 1 : prev));
      } else {
        setShowReview(true);
      }
    } catch {
      if (!autoNext) {
        addToast({ type: "error", message: "Unable to save answer." });
      }
    } finally {
      setSaving(false);
    }
  };

  const submitAttempt = async () => {
    if (!attempt || saving) {
      return;
    }
    setSaving(true);
    try {
      if (currentQuestion && !showReview) {
        await saveAnswer(currentQuestion, selectedByQuestionId[currentQuestion.id] || null);
      }
      const response = await courseService.submitQuizAttempt(attempt.id);
      setResult(response.data);
      setShowReview(false);
    } catch {
      addToast({ type: "error", message: "Unable to submit quiz." });
    } finally {
      setSaving(false);
    }
  };

  const retry = () => {
    setAttempt(null);
    setCurrentIndex(0);
    setSelectedByQuestionId({});
    setFeedbackByQuestionId({});
    setShowReview(false);
    setResult(null);
    setLoading(true);
    courseService
      .startQuiz(quizId)
      .then((response) => {
        setAttempt(response.data);
        const answerMaps = buildAnswerMaps(response.data?.answers || []);
        setSelectedByQuestionId(answerMaps.selected);
        setFeedbackByQuestionId(answerMaps.feedback);
        setTimeLeft(Number(response.data?.questions?.[0]?.time_per_question_seconds || 25));
      })
      .catch(() => addToast({ type: "error", message: "Unable to restart quiz." }))
      .finally(() => setLoading(false));
  };

  const getLessonReferencePath = (question) => {
    if (!question?.reference_lesson_id || !question?.reference_module_number) {
      return "";
    }
    const timestamp = Math.max(0, Number(question.reference_timestamp_seconds) || 0);
    return `/user/lms/${courseId}/module/${question.reference_module_number}/lesson/${question.reference_lesson_id}?t=${timestamp}`;
  };

  const getOptionStateClass = (question, option) => {
    const selectedOptionId = selectedByQuestionId[question.id];
    const feedback = feedbackByQuestionId[question.id];
    if (!feedback) {
      return "";
    }
    const isSelected = String(selectedOptionId) === String(option.id);
    if (String(feedback.correct_option_id) === String(option.id)) {
      return "is-correct";
    }
    if (isSelected) {
      return "is-incorrect";
    }
    return "";
  };

  return (
    <MainLayout>
      <section className="quiz-player-shell">
        <Link to={`/user/lms/${courseId}`} className="btn btn-muted btn-icon">
          <HiOutlineArrowLeft />
          Back to Quizzes
        </Link>

        {loading ? <LoadingSpinner label="Starting quiz..." /> : null}

        {!loading && result ? (
          <article className={`quiz-result-card ${result.is_passed ? "is-pass" : "is-fail"}`}>
            <div className="quiz-result-icon">
              {result.is_passed ? <HiOutlineCheckCircle /> : <HiOutlineXCircle />}
            </div>
            <h1>{result.is_passed ? "Passed" : "Failed"}</h1>
            <p>{result.quiz_title}</p>
            <div className="quiz-result-grid">
              <span>Score<strong>{result.score}/{result.total_marks}</strong></span>
              <span>Percentage<strong>{Number(result.percentage).toFixed(2)}%</strong></span>
              <span>Correct<strong>{result.correct_count}</strong></span>
              <span>Wrong<strong>{result.wrong_count}</strong></span>
              <span>Answered<strong>{result.answered_count}</strong></span>
              <span>Unanswered<strong>{result.unanswered_count}</strong></span>
              <span>Time<strong>{formatTime(result.time_taken_seconds)}</strong></span>
              <span>Attempt<strong>{result.attempt_number}</strong></span>
            </div>
            <div className="quiz-result-actions">
              {!result.is_passed ? (
                <button type="button" className="btn btn-primary" onClick={retry}>
                  Retry
                </button>
              ) : null}
              <button type="button" className="btn btn-muted" onClick={() => navigate(`/user/lms/${courseId}`)}>
                Go Back
              </button>
            </div>
          </article>
        ) : null}

        {!loading && attempt && showReview && !result ? (
          <article className="quiz-review-card">
            <h1>Submit Quiz?</h1>
            <p>Review your attempt before final submission.</p>
            <div className="quiz-review-counts">
              <span>Answered questions<strong>{answeredCount}</strong></span>
              <span>Unanswered questions<strong>{unansweredCount}</strong></span>
            </div>
            <div className="quiz-result-actions">
              <button type="button" className="btn btn-muted" onClick={() => setShowReview(false)}>
                Review Answers
              </button>
              <button type="button" className="btn btn-primary" onClick={submitAttempt} disabled={saving}>
                {saving ? "Submitting..." : "Submit Quiz"}
              </button>
            </div>
          </article>
        ) : null}

        {!loading && attempt && currentQuestion && !showReview && !result ? (
          <article className="quiz-attempt-card">
            <div className="quiz-attempt-head">
              <div>
                <p className="lms-kicker">Question {currentIndex + 1} of {questions.length}</p>
                <h1>{attempt.quiz_title}</h1>
              </div>
              <div className={`quiz-timer ${timeLeft <= 5 ? "is-low" : ""}`}>
                <HiOutlineClock />
                {timeLeft}s
              </div>
            </div>
            <div className="quiz-question-box">
              <h2>{currentQuestion.question_text}</h2>
              <div className="quiz-option-list">
                {currentQuestion.options.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`quiz-option-choice ${getOptionStateClass(currentQuestion, option)} ${
                      String(selectedByQuestionId[currentQuestion.id]) === String(option.id) ? "is-selected" : ""
                    }`}
                    onClick={() => selectAnswer(currentQuestion, option.id)}
                    disabled={saving}
                  >
                    {option.option_text}
                  </button>
                ))}
              </div>
              {feedbackByQuestionId[currentQuestion.id] && (currentQuestion.explanation || currentQuestion.reference_lesson_id) ? (
                <div className="quiz-answer-explanation">
                  {currentQuestion.explanation ? (() => {
                    const { main, verification } = parseExplanation(currentQuestion.explanation);
                    return (
                      <>
                        <h4 className="explanation-title">Explanation</h4>
                        {main ? <p className="explanation-text">{main}</p> : null}
                        {verification && (
                          <div className="explanation-verification-badge">
                            <span className="badge-pulse"></span>
                            <span>{verification}</span>
                          </div>
                        )}
                      </>
                    );
                  })() : null}
                  {currentQuestion.reference_lesson_id ? (
                    <Link
                      className="quiz-lesson-reference"
                      to={getLessonReferencePath(currentQuestion)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <HiOutlinePlayCircle />
                      Review Lesson: {currentQuestion.reference_lesson_title} (Module: {MODULE_TITLES[currentQuestion.reference_module_number] || currentQuestion.reference_module_number}) at {formatTime(currentQuestion.reference_timestamp_seconds)}
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </div>
            <div className="quiz-attempt-actions">
              <button
                type="button"
                className="btn btn-muted"
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0 || saving}
              >
                Previous
              </button>
              <button type="button" className="btn btn-primary" onClick={() => saveAndMove()} disabled={saving}>
                {currentIndex === questions.length - 1 ? "Review Submit" : "Save & Next"}
              </button>
            </div>
          </article>
        ) : null}
      </section>
    </MainLayout>
  );
}
