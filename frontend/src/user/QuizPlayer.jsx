import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  HiOutlineArrowLeft,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineMinusCircle,
  HiOutlinePlayCircle,
  HiOutlineXCircle,
} from "react-icons/hi2";

import ConfirmModal from "../components/ConfirmModal";
import LoadingSpinner from "../components/LoadingSpinner";
import { useToast } from "../context/ToastContext";
import MainLayout from "../layouts/MainLayout";
import { courseService } from "../services/courseService";
import "./user.css";

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];
const DEFAULT_SECONDS_PER_QUESTION = 25;

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

function formatTime(seconds) {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function formatPercent(value) {
  const number = Number(value) || 0;
  return `${Number.isInteger(number) ? number : number.toFixed(1)}%`;
}

function parseExplanation(text) {
  if (!text) return { main: "", verification: "" };
  // Remove boilerplate prefix: "Detailed explanation for Quiz X Question Y (Question text):"
  const cleanedText = text.replace(/^Detailed\s+explanation\s+for\s+Quiz\s+\d+\s+Question\s+\d+\s*\([^)]*\):\s*/i, "").trim();
  const parts = cleanedText.split(/(?=This answer is verified through)/i);
  if (parts.length > 1) {
    return { main: parts[0].trim(), verification: parts[1].trim() };
  }
  return { main: cleanedText, verification: "" };
}

function buildAnswerMap(answers = []) {
  return answers.reduce((map, answer) => {
    if (answer?.question_id && answer.is_locked) {
      map[answer.question_id] = answer;
    }
    return map;
  }, {});
}

function answerStatus(answer) {
  if (!answer) return "pending";
  if (!answer.is_answered) return "skipped";
  return answer.is_correct ? "correct" : "incorrect";
}

const STATUS_LABELS = {
  pending: "Not answered",
  skipped: "Skipped",
  correct: "Correct",
  incorrect: "Incorrect",
};

function lessonReferencePath(courseId, source) {
  if (!source?.reference_lesson_id || !source?.reference_module_number) {
    return "";
  }
  const timestamp = Math.max(0, Number(source.reference_timestamp_seconds) || 0);
  return `/user/lms/${courseId}/module/${source.reference_module_number}/lesson/${source.reference_lesson_id}?t=${timestamp}`;
}

function ExplanationPanel({ courseId, source, headingId }) {
  const { main, verification } = parseExplanation(source?.explanation);
  const referencePath = lessonReferencePath(courseId, source);
  if (!main && !verification && !referencePath) {
    return null;
  }
  const moduleTitle = MODULE_TITLES[source.reference_module_number] || `Module ${source.reference_module_number}`;
  return (
    <div className="quiz-answer-explanation" aria-labelledby={headingId}>
      {main || verification ? (
        <h3 className="explanation-title" id={headingId}>
          Explanation
        </h3>
      ) : null}
      {main ? <p className="explanation-text">{main}</p> : null}
      {verification ? (
        <div className="explanation-verification-badge">
          <span className="badge-pulse" aria-hidden="true" />
          <span>{verification}</span>
        </div>
      ) : null}
      {referencePath ? (
        <Link
          className="quiz-lesson-reference"
          to={referencePath}
          target="_blank"
          rel="noopener noreferrer"
          title={`${source.reference_lesson_title} — ${moduleTitle}`}
        >
          <HiOutlinePlayCircle aria-hidden="true" />
          <span className="quiz-lesson-reference-text">
            Rewatch “{source.reference_lesson_title}” at {formatTime(source.reference_timestamp_seconds)}
          </span>
          <HiOutlineArrowTopRightOnSquare aria-hidden="true" className="quiz-lesson-reference-external" />
          <span className="sr-only">(opens in a new tab)</span>
        </Link>
      ) : null}
    </div>
  );
}

export default function QuizPlayer() {
  const { courseId, quizId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [furthestIndex, setFurthestIndex] = useState(0);
  const [pendingOptionId, setPendingOptionId] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  // Which question `timeLeft` was initialised for. Guards against acting on a stale
  // value (e.g. the initial 0) in the render where a new question first appears.
  const [timerQuestionId, setTimerQuestionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [expired, setExpired] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [result, setResult] = useState(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  // Client clock offset so the overall deadline is measured in server time.
  const deadlineRef = useRef(null);
  const timeoutHandledRef = useRef(null);
  // Remaining seconds per open question, so stepping back and forth doesn't refill the timer.
  const remainingByQuestionRef = useRef({});
  const questionHeadingRef = useRef(null);

  const questions = useMemo(() => attempt?.questions || [], [attempt]);
  const currentQuestion = questions[currentIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : null;
  const isLocked = Boolean(currentAnswer);
  const perQuestionSeconds = Number(attempt?.time_per_question_seconds) || DEFAULT_SECONDS_PER_QUESTION;
  const lockedCount = Object.keys(answers).length;
  const answeredCount = Object.values(answers).filter((answer) => answer.is_answered).length;
  const inProgress = Boolean(attempt) && !result;

  const secondsUntilDeadline = useCallback(() => {
    if (!deadlineRef.current) return Infinity;
    return Math.max(0, Math.floor((deadlineRef.current - Date.now()) / 1000));
  }, []);

  const startAttempt = useCallback(async () => {
    setLoading(true);
    setResult(null);
    setShowReview(false);
    setExpired(false);
    setSaveError(false);
    setPendingOptionId(null);
    remainingByQuestionRef.current = {};
    setTimerQuestionId(null);
    try {
      const response = await courseService.startQuiz(quizId);
      const data = response.data;
      const answerMap = buildAnswerMap(data?.answers);
      const loadedQuestions = data?.questions || [];
      const firstOpen = loadedQuestions.findIndex((question) => !answerMap[question.id]);

      if (data?.expires_at && data?.server_time) {
        const offset = Date.now() - new Date(data.server_time).getTime();
        deadlineRef.current = new Date(data.expires_at).getTime() + offset;
      } else {
        deadlineRef.current = null;
      }

      setAttempt(data);
      setAnswers(answerMap);
      // Resume at the first question that hasn't been answered yet.
      const startIndex = firstOpen === -1 ? Math.max(0, loadedQuestions.length - 1) : firstOpen;
      setCurrentIndex(startIndex);
      setFurthestIndex(startIndex);
      if (data?.is_expired) {
        setExpired(true);
        setShowReview(true);
      } else if (firstOpen === -1 && loadedQuestions.length) {
        setShowReview(true);
      }
    } catch (error) {
      const detail = error?.response?.data?.detail || "Unable to start quiz.";
      addToast({ type: "error", message: detail });
      navigate(`/user/lms/${courseId}`, { replace: true });
    } finally {
      setLoading(false);
    }
  }, [quizId, courseId, navigate, addToast]);

  useEffect(() => {
    startAttempt();
  }, [startAttempt]);

  const commitAnswer = useCallback(
    async (question, optionId) => {
      if (!attempt || !question || answers[question.id]) {
        return;
      }
      setSaving(true);
      setSaveError(false);
      setPendingOptionId(optionId);
      try {
        const response = await courseService.saveQuizAnswer(attempt.id, {
          question_id: question.id,
          selected_option_id: optionId || null,
          time_taken_seconds: Math.max(0, perQuestionSeconds - timeLeft),
        });
        setAnswers((prev) => ({ ...prev, [question.id]: response.data }));
        setAnnouncement(
          optionId
            ? response.data?.is_correct
              ? "Correct answer."
              : "Incorrect answer. The correct option is highlighted."
            : "Time is up. The correct option is highlighted.",
        );
      } catch (error) {
        const data = error?.response?.data;
        if (error?.response?.status === 409 && data?.answer) {
          // Already answered (e.g. in another tab): show what the server has.
          setAnswers((prev) => ({ ...prev, [question.id]: data.answer }));
        } else if (data?.code === "attempt_expired") {
          setExpired(true);
          setShowReview(true);
        } else {
          setSaveError(true);
          addToast({ type: "error", message: "Unable to save your answer. Check your connection and try again." });
        }
      } finally {
        setPendingOptionId(null);
        setSaving(false);
      }
    },
    [attempt, answers, perQuestionSeconds, timeLeft, addToast],
  );

  // Reset the timer whenever a new, unanswered question comes up.
  useEffect(() => {
    if (!currentQuestion || isLocked || showReview || result) {
      return;
    }
    timeoutHandledRef.current = null;
    const saved = remainingByQuestionRef.current[currentQuestion.id];
    setTimeLeft(Math.min(saved ?? perQuestionSeconds, secondsUntilDeadline()));
    setTimerQuestionId(currentQuestion.id);
    // Only re-run when the question changes, not on every answer update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion?.id, perQuestionSeconds, showReview, result]);

  // Tick only while the current question is open. Answering pauses the timer so the
  // learner can read the explanation without being moved on.
  const timerRunning =
    Boolean(currentQuestion) && timerQuestionId === currentQuestion.id && !isLocked && !showReview && !result && !expired;
  useEffect(() => {
    if (!timerRunning) {
      return undefined;
    }
    const timer = window.setInterval(() => {
      setTimeLeft((prev) => Math.max(0, Math.min(prev - 1, secondsUntilDeadline())));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [timerRunning, secondsUntilDeadline]);

  useEffect(() => {
    if (timerRunning) {
      remainingByQuestionRef.current[currentQuestion.id] = timeLeft;
    }
  }, [timeLeft, timerRunning, currentQuestion]);

  // Screen-reader warnings at 10s and 5s.
  useEffect(() => {
    if (timerRunning && (timeLeft === 10 || timeLeft === 5)) {
      setAnnouncement(`${timeLeft} seconds left.`);
    }
  }, [timeLeft, timerRunning]);

  // Time ran out: lock the question as unanswered. Waits for any in-flight save
  // (which will lock it anyway) and can be retried if the request fails.
  useEffect(() => {
    if (!timerRunning || timeLeft !== 0 || saving || saveError) {
      return;
    }
    if (timeoutHandledRef.current === currentQuestion.id) {
      return;
    }
    timeoutHandledRef.current = currentQuestion.id;
    if (secondsUntilDeadline() === 0) {
      setExpired(true);
      setShowReview(true);
      return;
    }
    commitAnswer(currentQuestion, null);
  }, [timerRunning, timeLeft, saving, saveError, currentQuestion, commitAnswer, secondsUntilDeadline]);

  const goToQuestion = useCallback(
    (index) => {
      if (index < 0 || index >= questions.length || index > furthestIndex) {
        return;
      }
      setShowReview(false);
      setSaveError(false);
      setCurrentIndex(index);
    },
    [questions.length, furthestIndex],
  );

  const goNext = useCallback(() => {
    if (!isLocked || saving) {
      return;
    }
    if (currentIndex >= questions.length - 1) {
      setShowReview(true);
      return;
    }
    const nextIndex = currentIndex + 1;
    setFurthestIndex((prev) => Math.max(prev, nextIndex));
    setCurrentIndex(nextIndex);
  }, [isLocked, saving, currentIndex, questions.length]);

  const skipQuestion = useCallback(() => {
    if (!isLocked && !saving && currentQuestion) {
      commitAnswer(currentQuestion, null);
    }
  }, [isLocked, saving, currentQuestion, commitAnswer]);

  const retrySave = () => {
    setSaveError(false);
    timeoutHandledRef.current = null;
  };

  // Move focus to the question when it changes so keyboard and screen-reader users follow along.
  useEffect(() => {
    if (!showReview && !result) {
      questionHeadingRef.current?.focus({ preventScroll: true });
    }
  }, [currentIndex, showReview, result]);

  // Keyboard: 1-4 / A-D pick an option, Enter or → goes next, ← goes back.
  useEffect(() => {
    if (!currentQuestion || showReview || result || confirmLeave) {
      return undefined;
    }
    const handleKeyDown = (event) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) {
        return;
      }
      const key = event.key.toUpperCase();
      const numberIndex = Number.parseInt(key, 10) - 1;
      const letterIndex = OPTION_LETTERS.indexOf(key);
      const optionIndex = Number.isNaN(numberIndex) ? letterIndex : numberIndex;
      if (optionIndex >= 0 && optionIndex < currentQuestion.options.length && !isLocked) {
        event.preventDefault();
        commitAnswer(currentQuestion, currentQuestion.options[optionIndex].id);
        return;
      }
      if ((event.key === "Enter" && !(target instanceof HTMLButtonElement || target instanceof HTMLAnchorElement)) || event.key === "ArrowRight") {
        if (isLocked) {
          event.preventDefault();
          goNext();
        }
        return;
      }
      if (event.key === "ArrowLeft" && currentIndex > 0) {
        event.preventDefault();
        goToQuestion(currentIndex - 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentQuestion, showReview, result, confirmLeave, isLocked, commitAnswer, goNext, goToQuestion, currentIndex]);

  // Warn before closing the tab mid-attempt. The server-side deadline keeps running.
  useEffect(() => {
    if (!inProgress) {
      return undefined;
    }
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [inProgress]);

  const submitAttempt = async () => {
    if (!attempt || saving) {
      return;
    }
    setSaving(true);
    try {
      const response = await courseService.submitQuizAttempt(attempt.id);
      setResult(response.data);
      setShowReview(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      addToast({ type: "error", message: "Unable to submit quiz. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const handleBackClick = (event) => {
    if (inProgress) {
      event.preventDefault();
      setConfirmLeave(true);
    }
  };

  const optionClass = (option) => {
    const classes = ["quiz-option-choice"];
    if (currentAnswer) {
      if (String(currentAnswer.correct_option_id) === String(option.id)) classes.push("is-correct");
      else if (String(currentAnswer.selected_option_id) === String(option.id)) classes.push("is-incorrect");
    } else if (String(pendingOptionId) === String(option.id)) {
      classes.push("is-selected");
    }
    return classes.join(" ");
  };

  const progressPercent = questions.length ? Math.round((lockedCount / questions.length) * 100) : 0;
  const isLastQuestion = currentIndex === questions.length - 1;

  return (
    <MainLayout showFooter={false}>
      <section className="quiz-player-shell">
        <Link to={`/user/lms/${courseId}`} className="btn btn-muted btn-icon quiz-back-link" onClick={handleBackClick}>
          <HiOutlineArrowLeft aria-hidden="true" />
          Back to course
        </Link>

        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {announcement}
        </p>

        {loading ? <LoadingSpinner label="Starting quiz..." /> : null}

        {!loading && result ? (
          <article className={`quiz-result-card ${result.is_passed ? "is-pass" : "is-fail"}`}>
            <header className="quiz-result-head">
              <div className="quiz-result-icon" aria-hidden="true">
                {result.is_passed ? <HiOutlineCheckCircle /> : <HiOutlineXCircle />}
              </div>
              <div>
                <p className="quiz-kicker">{result.quiz_title}</p>
                <h1>{result.is_passed ? "You passed!" : "Not quite there yet"}</h1>
                <p>
                  You scored <strong>{formatPercent(result.percentage)}</strong>
                  {result.pass_percentage ? ` — ${result.pass_percentage}% needed to pass.` : "."}
                </p>
              </div>
            </header>
            <dl className="quiz-result-grid">
              <div>
                <dt>Score</dt>
                <dd>
                  {result.score}/{result.total_marks}
                </dd>
              </div>
              <div>
                <dt>Correct</dt>
                <dd className="is-good">{result.correct_count}</dd>
              </div>
              <div>
                <dt>Wrong</dt>
                <dd className="is-bad">{result.wrong_count}</dd>
              </div>
              <div>
                <dt>Skipped</dt>
                <dd>{result.unanswered_count}</dd>
              </div>
              <div>
                <dt>Time taken</dt>
                <dd>{formatTime(result.time_taken_seconds)}</dd>
              </div>
              <div>
                <dt>Attempt</dt>
                <dd>#{result.attempt_number}</dd>
              </div>
            </dl>

            {result.review?.length ? (
              <section className="quiz-result-review" aria-labelledby="quiz-result-review-title">
                <h2 id="quiz-result-review-title">Question breakdown</h2>
                <ol className="quiz-result-review-list">
                  {result.review.map((item, index) => {
                    const statusKey = !item.is_answered ? "skipped" : item.is_correct ? "correct" : "incorrect";
                    return (
                      <li key={item.question_id} className={`quiz-result-review-item is-${statusKey}`}>
                        <details>
                          <summary>
                            <span className="quiz-review-status-icon" aria-hidden="true">
                              {statusKey === "correct" ? (
                                <HiOutlineCheckCircle />
                              ) : statusKey === "incorrect" ? (
                                <HiOutlineXCircle />
                              ) : (
                                <HiOutlineMinusCircle />
                              )}
                            </span>
                            <span className="quiz-result-review-question">
                              <span className="quiz-result-review-number">Q{index + 1}.</span> {item.question_text}
                            </span>
                            <span className="sr-only">{STATUS_LABELS[statusKey]}</span>
                          </summary>
                          <div className="quiz-result-review-body">
                            <p>
                              <span className="quiz-result-review-label">Your answer</span>
                              {item.selected_option_text || "Not answered"}
                            </p>
                            {!item.is_correct ? (
                              <p>
                                <span className="quiz-result-review-label">Correct answer</span>
                                {item.correct_option_text}
                              </p>
                            ) : null}
                            <ExplanationPanel courseId={courseId} source={item} headingId={`review-explanation-${item.question_id}`} />
                          </div>
                        </details>
                      </li>
                    );
                  })}
                </ol>
              </section>
            ) : null}

            <div className="quiz-result-actions">
              <button type="button" className="btn btn-muted" onClick={() => navigate(`/user/lms/${courseId}`)}>
                Back to course
              </button>
              <button type="button" className={`btn ${result.is_passed ? "btn-muted" : "btn-primary"}`} onClick={startAttempt}>
                {result.is_passed ? "Retake quiz" : "Try again"}
              </button>
            </div>
          </article>
        ) : null}

        {!loading && attempt && showReview && !result ? (
          <article className="quiz-review-card">
            <p className="quiz-kicker">{attempt.quiz_title}</p>
            <h1>{expired ? "Time is up" : "Ready to submit?"}</h1>
            <p>
              {expired
                ? "The time for this attempt has run out. Submit to see your results."
                : "Check your progress below. You can open any question you have already reached."}
            </p>
            <div className="quiz-review-counts">
              <div>
                <span>Answered</span>
                <strong>{answeredCount}</strong>
              </div>
              <div>
                <span>Skipped or unanswered</span>
                <strong>{questions.length - answeredCount}</strong>
              </div>
            </div>
            <ol className="quiz-review-list">
              {questions.map((question, index) => {
                const statusKey = answerStatus(answers[question.id]);
                const reachable = !expired && index <= furthestIndex;
                return (
                  <li key={question.id}>
                    <button
                      type="button"
                      className={`quiz-review-item is-${statusKey}`}
                      onClick={() => goToQuestion(index)}
                      disabled={!reachable}
                    >
                      <span className="quiz-review-item-number">{index + 1}</span>
                      <span className="quiz-review-item-text">{question.question_text}</span>
                      <span className="quiz-review-item-status">{STATUS_LABELS[statusKey]}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
            <div className="quiz-result-actions">
              {!expired ? (
                <button type="button" className="btn btn-muted" onClick={() => goToQuestion(Math.min(furthestIndex, currentIndex))}>
                  Back to questions
                </button>
              ) : (
                <span />
              )}
              <button type="button" className="btn btn-primary" onClick={submitAttempt} disabled={saving}>
                {saving ? "Submitting..." : "Submit quiz"}
              </button>
            </div>
          </article>
        ) : null}

        {!loading && attempt && currentQuestion && !showReview && !result ? (
          <article className="quiz-attempt-card">
            <header className="quiz-attempt-head">
              <div className="quiz-attempt-titles">
                <h1 className="quiz-kicker">{attempt.quiz_title}</h1>
                <p className="quiz-question-count">
                  Question {currentIndex + 1} <span>of {questions.length}</span>
                </p>
              </div>
              <div
                className={`quiz-timer ${!isLocked && timeLeft <= 5 ? "is-low" : ""} ${isLocked ? "is-paused" : ""}`}
                role="timer"
                aria-label={isLocked ? "Timer paused" : `${timeLeft} seconds left`}
              >
                <HiOutlineClock aria-hidden="true" />
                {isLocked ? "Paused" : `${timeLeft}s`}
              </div>
            </header>

            <div className="quiz-progress">
              <div
                className="quiz-progress-track"
                role="progressbar"
                aria-label="Quiz progress"
                aria-valuemin={0}
                aria-valuemax={questions.length}
                aria-valuenow={lockedCount}
              >
                <span style={{ width: `${progressPercent}%` }} />
              </div>
              <ol className="quiz-nav-dots" aria-label="Questions">
                {questions.map((question, index) => {
                  const statusKey = answerStatus(answers[question.id]);
                  return (
                    <li key={question.id}>
                      <button
                        type="button"
                        className={`quiz-nav-dot is-${statusKey} ${index === currentIndex ? "is-current" : ""}`}
                        onClick={() => goToQuestion(index)}
                        disabled={index > furthestIndex || saving}
                        aria-current={index === currentIndex ? "step" : undefined}
                        aria-label={`Question ${index + 1}: ${STATUS_LABELS[statusKey]}`}
                      >
                        {index + 1}
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>

            <div className="quiz-question-box">
              <h2 id="quiz-question-text" tabIndex={-1} ref={questionHeadingRef}>
                {currentQuestion.question_text}
              </h2>
              <div
                className={`quiz-option-list ${isLocked ? "is-locked" : ""}`}
                role="radiogroup"
                aria-labelledby="quiz-question-text"
              >
                {currentQuestion.options.map((option, optionIndex) => {
                  const checked =
                    String(currentAnswer?.selected_option_id ?? pendingOptionId) === String(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="radio"
                      aria-checked={checked}
                      aria-disabled={isLocked || saving}
                      className={optionClass(option)}
                      onClick={() => !isLocked && !saving && commitAnswer(currentQuestion, option.id)}
                    >
                      <span className="quiz-option-letter" aria-hidden="true">
                        {OPTION_LETTERS[optionIndex]}
                      </span>
                      <span className="quiz-option-text">{option.option_text}</span>
                    </button>
                  );
                })}
              </div>

              {isLocked ? (
                <p className={`quiz-feedback-line is-${answerStatus(currentAnswer)}`}>
                  {answerStatus(currentAnswer) === "correct"
                    ? "Correct!"
                    : answerStatus(currentAnswer) === "incorrect"
                      ? "Not quite — the correct answer is highlighted."
                      : "Skipped — the correct answer is highlighted."}
                </p>
              ) : (
                <p className="quiz-hint">Tip: press 1–4 or A–D to answer, → for the next question.</p>
              )}

              {saveError ? (
                <div className="quiz-save-error" role="alert">
                  Your answer couldn&apos;t be saved.
                  <button type="button" className="btn btn-muted" onClick={retrySave}>
                    Retry
                  </button>
                </div>
              ) : null}

              {isLocked ? (
                <ExplanationPanel courseId={courseId} source={currentAnswer} headingId={`explanation-${currentQuestion.id}`} />
              ) : null}
            </div>

            <footer className="quiz-attempt-actions">
              <button
                type="button"
                className="btn btn-muted"
                onClick={() => goToQuestion(currentIndex - 1)}
                disabled={currentIndex === 0 || saving}
              >
                Previous
              </button>
              {isLocked ? (
                <button type="button" className="btn btn-primary" onClick={goNext} disabled={saving}>
                  {isLastQuestion ? "Finish & review" : "Next question"}
                </button>
              ) : (
                <button type="button" className="btn btn-muted" onClick={skipQuestion} disabled={saving}>
                  {saving ? "Saving..." : "Skip question"}
                </button>
              )}
            </footer>
          </article>
        ) : null}
      </section>

      <ConfirmModal
        open={confirmLeave}
        title="Leave this quiz?"
        message="Your answers so far are saved, but the quiz timer keeps running while you are away."
        confirmText="Leave quiz"
        cancelText="Stay"
        onCancel={() => setConfirmLeave(false)}
        onConfirm={() => {
          setConfirmLeave(false);
          navigate(`/user/lms/${courseId}`);
        }}
      />
    </MainLayout>
  );
}
