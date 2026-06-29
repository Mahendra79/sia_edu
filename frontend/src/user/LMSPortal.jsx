import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  HiOutlineArrowLeft,
  HiOutlineClipboardDocumentList,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineShieldCheck,
  HiOutlineXMark,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineDocumentArrowDown,
  HiOutlineLockClosed,
  HiOutlineBars3,
  HiOutlinePlayCircle,
  HiOutlineRectangleStack,
  HiOutlineSparkles,
} from "react-icons/hi2";

import LoadingSpinner from "../components/LoadingSpinner";
import { useToast } from "../context/ToastContext";
import MainLayout from "../layouts/MainLayout";
import { API_BASE_URL } from "../services/api";
import { courseService } from "../services/courseService";
import { LessonPdfViewer } from "./LessonPlayer";
import "./user.css";

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

const LESSON_WATCH_PROGRESS_KEY = "lms_lesson_watch_progress_v1";

export default function LMSPortal() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [course, setCourse] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("modules");
  const [openModuleId, setOpenModuleId] = useState(1);
  const [durationByLessonId, setDurationByLessonId] = useState({});
  const [watchProgressByLessonId, setWatchProgressByLessonId] = useState({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quizzes, setQuizzes] = useState([]);
  const [projectPdf, setProjectPdf] = useState(null);
  const [downloadingProjectPdfId, setDownloadingProjectPdfId] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LESSON_WATCH_PROGRESS_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        setWatchProgressByLessonId(parsed);
      }
    } catch {
      setWatchProgressByLessonId({});
    }
  }, []);

  useEffect(() => {
    const loadCourse = async () => {
      setLoading(true);
      setError("");
      try {
        const [courseResponse, overviewResponse] = await Promise.all([
          courseService.getCourse(courseId),
          courseService.getLmsOverview(courseId),
        ]);
        setCourse(courseResponse.data);
        setOverview(overviewResponse.data);
        const quizResponse = await courseService.getLearnerQuizzes(courseId);
        setQuizzes(quizResponse.data || []);
      } catch {
        setError("Unable to load this course in LMS portal.");
        addToast({ type: "error", message: "Unable to load LMS modules." });
      } finally {
        setLoading(false);
      }
    };
    loadCourse();
  }, [courseId, addToast]);

  const modules = useMemo(() => overview?.modules || [], [overview]);
  const progressPercent = Number(overview?.progress_percent || 0);

  const totalLessons = Number(
    overview?.total_lessons || modules.reduce((sum, module) => sum + (module.lessons?.length || 0), 0)
  );
  const completedLessons = Number(
    overview?.completed_lessons ||
      modules.reduce((sum, module) => sum + module.lessons.filter((item) => item.is_completed).length, 0)
  );

  useEffect(() => {
    let isCancelled = false;

    const formatDurationLabel = (secondsValue) => {
      const totalSeconds = Math.max(0, Math.floor(Number(secondsValue || 0)));
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
      }
      return `${minutes}:${String(seconds).padStart(2, "0")}`;
    };

    const readVideoDuration = (url) =>
      new Promise((resolve) => {
        if (!url) {
          resolve("");
          return;
        }
        const media = document.createElement("video");
        media.preload = "metadata";
        media.src = url;
        media.onloadedmetadata = () => resolve(formatDurationLabel(media.duration));
        media.onerror = () => resolve("");
      });

    const loadDurations = async () => {
      const lessonIds = modules
        .flatMap((module) => module.lessons || [])
        .map((lesson) => lesson.id)
        .filter((id) => Number.isInteger(Number(id)));

      if (!lessonIds.length) {
        return;
      }

      const next = {};
      for (const id of lessonIds) {
        try {
          const response = await courseService.getLessonDetail(id);
          const durationText = await readVideoDuration(response.data?.video_url);
          next[id] = durationText || "-";
        } catch {
          next[id] = "-";
        }
      }
      if (!isCancelled) {
        setDurationByLessonId(next);
      }
    };

    loadDurations();
    return () => {
      isCancelled = true;
    };
  }, [modules]);

  const openLesson = (moduleNumber, lessonId) => {
    const lessonUrl = `/user/lms/${courseId}/module/${moduleNumber}/lesson/${lessonId}`;
    window.open(lessonUrl, "_blank", "noopener,noreferrer");
  };

  const openProjectPdf = (lesson) => {
    setProjectPdf({
      name: `${String(lesson.title || "Project").trim()}.pdf`,
      url: `${API_BASE_URL}/courses/lms/lessons/${lesson.id}/pdf/`,
    });
  };

  const downloadProjectPdf = async (lesson) => {
    if (!lesson?.id || downloadingProjectPdfId) {
      return;
    }

    const pdfName = `${String(lesson.title || "Project").trim()}.pdf`.replace(/[\\/:*?"<>|]+/g, "-");
    setDownloadingProjectPdfId(lesson.id);
    try {
      const response = await courseService.downloadLessonPdf(lesson.id);
      const blob = new Blob([response.data], { type: response.headers?.["content-type"] || "application/pdf" });
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = pdfName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch {
      addToast({ type: "error", message: "Unable to download this project PDF." });
    } finally {
      setDownloadingProjectPdfId(null);
    }
  };

  const handleLessonAction = (moduleNumber, lesson) => {
    const lessonStatus = getLessonStatus(lesson);
    if (lessonStatus !== "Continue" && lessonStatus !== "Resume" && lessonStatus !== "Completed") {
      return;
    }
    if (lesson.is_project || Number(moduleNumber) === 9) {
      openProjectPdf(lesson);
      return;
    }
    openLesson(moduleNumber, lesson.id);
  };

  const getLessonStatus = (lesson) => {
    if (lesson.is_completed) {
      return "Completed";
    }
    if (!lesson.is_unlocked) {
      return "Locked";
    }
    const watchedPercent = Number(watchProgressByLessonId[lesson.id] || 0);
    if (watchedPercent >= 1 && watchedPercent < 80) {
      return "Resume";
    }
    return "Continue";
  };

  const getModuleTitle = (module) => {
    if (module.is_project_section || Number(module.module_number) === 9) {
      return "Projects";
    }
    return `Module ${module.module_number}: ${MODULE_TITLES[module.module_number] || "Module"}`;
  };

  const getModuleCountLabel = (module) => {
    const completedCount = module.lessons.filter((item) => item.is_completed).length;
    if (module.is_project_section || Number(module.module_number) === 9) {
      return `${module.lessons.length} ${module.lessons.length === 1 ? "project" : "projects"}`;
    }
    return `${completedCount}/${module.lessons.length} lessons`;
  };

  return (
    <MainLayout>
      {loading ? (
        <LoadingSpinner label="Opening LMS portal..." />
      ) : error || !course ? (
        <section className="lms-shell">
          <p className="empty-state">{error || "Course unavailable."}</p>
          <Link to="/user/my-courses" className="btn btn-primary">
            Go to My Courses
          </Link>
        </section>
      ) : (
        <section className="lms-shell">
          <div className="lms-mobile-menu-wrap">
            <button
              type="button"
              className="btn btn-muted btn-icon lms-mobile-menu-toggle"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-controls="lms-mobile-menu-panel"
            >
              {mobileMenuOpen ? <HiOutlineXMark /> : <HiOutlineBars3 />}
              Menu
            </button>
            {mobileMenuOpen ? (
              <div id="lms-mobile-menu-panel" className="lms-mobile-menu-panel">
                <button
                  type="button"
                  className="btn btn-muted btn-icon"
                  onClick={() => {
                    navigate("/user/my-courses");
                    setMobileMenuOpen(false);
                  }}
                >
                  <HiOutlineArrowLeft />
                  My Courses
                </button>
                <Link
                  to={`/course/${course.id}`}
                  className="btn btn-muted"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Course Details
                </Link>
                <button
                  type="button"
                  className={`btn btn-muted btn-icon lms-menu-item ${activeTab === "modules" ? "is-active" : ""}`}
                  onClick={() => {
                    setActiveTab("modules");
                    setMobileMenuOpen(false);
                  }}
                >
                  <HiOutlineRectangleStack />
                  Modules
                </button>
                <button
                  type="button"
                  className={`btn btn-muted btn-icon lms-menu-item ${activeTab === "quiz" ? "is-active" : ""}`}
                  onClick={() => {
                    setActiveTab("quiz");
                    setMobileMenuOpen(false);
                  }}
                >
                  <HiOutlineClipboardDocumentList />
                  Quizz
                </button>
                <button
                  type="button"
                  className={`btn btn-muted btn-icon lms-menu-item ${activeTab === "certificate" ? "is-active" : ""}`}
                  onClick={() => {
                    setActiveTab("certificate");
                    setMobileMenuOpen(false);
                  }}
                >
                  <HiOutlineShieldCheck />
                  Certificate
                </button>
              </div>
            ) : null}
          </div>

          <div className="lms-topbar">
            <button type="button" className="btn btn-muted btn-icon" onClick={() => navigate("/user/my-courses")}>
              <HiOutlineArrowLeft />
              My Courses
            </button>
            <Link to={`/course/${course.id}`} className="btn btn-muted">
              Course Details
            </Link>
          </div>

          <article className="lms-hero-card">
            <div>
              <p className="lms-kicker"></p>
              <h1>{course.title}</h1>
              <p>{course.short_description}</p>
            </div>
            <div className="lms-hero-meta">

            </div>
          </article>
          <div className={`lms-content-grid ${activeTab !== "modules" ? "is-compact" : ""}`}>
            <aside className="lms-left-nav">
              <h3>Menu</h3>
              <div className="lms-left-links">
                <button
                  type="button"
                  className={`btn btn-muted btn-icon lms-menu-item ${activeTab === "modules" ? "is-active" : ""}`}
                  onClick={() => setActiveTab("modules")}
                >
                  <HiOutlineRectangleStack />
                  Modules
                </button>
                <button
                  type="button"
                  className={`btn btn-muted btn-icon lms-menu-item ${activeTab === "quiz" ? "is-active" : ""}`}
                  onClick={() => setActiveTab("quiz")}
                >
                  <HiOutlineClipboardDocumentList />
                  Quizz
                </button>
                <button
                  type="button"
                  className={`btn btn-muted btn-icon lms-menu-item ${activeTab === "certificate" ? "is-active" : ""}`}
                  onClick={() => setActiveTab("certificate")}
                >
                  <HiOutlineShieldCheck />
                  Certificate
                </button>
              </div>
            </aside>

            <div className="lms-right-content">
              <div className="lms-progress-card">
                <div className="lms-progress-head">
                  <strong>Progress</strong>
                  <span>{progressPercent}% complete</span>
                </div>
                <p className="lms-progress-subtitle">{completedLessons}/{totalLessons} lessons completed</p>
                <div className="lms-progress-track">
                  <div className="lms-progress-fill" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>

              {activeTab === "modules" ? (
                <article className="lms-modules-card">
                  <h2>Course Modules</h2>
                  <div className="lms-module-list">
                    {modules.map((module) => {
                      return (
                        <div key={module.module_number} className={`lms-module-row ${module.is_completed ? "is-completed" : ""}`}>
                          <button
                            type="button"
                            className="lms-module-header"
                            onClick={() =>
                              setOpenModuleId((prev) => (prev === module.module_number ? 0 : module.module_number))
                            }
                          >
                            <div className="lms-module-title">
                              {module.is_completed ? (
                                <HiOutlineCheckCircle className="lms-icon-completed" />
                              ) : module.lessons.some((lesson) => lesson.is_unlocked) ? (
                                <HiOutlinePlayCircle />
                              ) : (
                                <HiOutlineLockClosed />
                              )}
                              <div className="lms-module-text">
                                <strong>{getModuleTitle(module)}</strong>
                                <p>{getModuleCountLabel(module)}</p>
                              </div>
                            </div>
                            {openModuleId === module.module_number ? <HiOutlineChevronUp /> : <HiOutlineChevronDown />}
                          </button>
                          {openModuleId === module.module_number ? (
                            <>
                              <ul className="lms-lesson-list">
                                {module.lessons.map((lesson) => {
                                  const lessonStatus = getLessonStatus(lesson);
                                  const isPlayable =
                                    lessonStatus === "Continue" || lessonStatus === "Resume" || lessonStatus === "Completed";
                                  const isProjectLesson = lesson.is_project || Number(module.module_number) === 9;
                                  return (
                                  <li key={lesson.id} className={lesson.is_completed ? "is-completed" : ""}>
                                    <div className="lms-lesson-meta">
                                      <span>
                                        {lesson.is_completed ? (
                                          <HiOutlineCheckCircle className="lms-icon-completed lms-lesson-icon" />
                                        ) : lesson.is_unlocked ? (
                                          <HiOutlinePlayCircle className="lms-lesson-icon" />
                                        ) : (
                                          <HiOutlineLockClosed className="lms-lesson-icon" />
                                        )}
                                        {lesson.title}
                                      </span>
                                      <small>{durationByLessonId[lesson.id] || "-"}</small>
                                    </div>
                                    {isPlayable ? (
                                      isProjectLesson ? (
                                        <div className="lms-lesson-actions">
                                          <button
                                            type="button"
                                            className={`btn lms-lesson-cta ${lessonStatus === "Completed" ? "btn-muted" : "btn-primary"}`}
                                            onClick={() => handleLessonAction(module.module_number, lesson)}
                                          >
                                            View PDF
                                          </button>
                                          <button
                                            type="button"
                                            className="btn btn-muted lms-lesson-cta btn-icon"
                                            onClick={() => downloadProjectPdf(lesson)}
                                            disabled={downloadingProjectPdfId === lesson.id}
                                          >
                                            <HiOutlineDocumentArrowDown />
                                            {downloadingProjectPdfId === lesson.id ? "Downloading..." : "Download"}
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          type="button"
                                          className={`btn lms-lesson-cta ${lessonStatus === "Completed" ? "btn-muted" : "btn-primary"}`}
                                          onClick={() => handleLessonAction(module.module_number, lesson)}
                                        >
                                          {lessonStatus}
                                        </button>
                                      )
                                    ) : (
                                      <span className={`lms-lesson-status ${lessonStatus === "Completed" ? "is-completed" : "is-locked"}`}>
                                        {lessonStatus}
                                      </span>
                                    )}
                                  </li>
                                  );
                                })}
                              </ul>
                            </>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </article>
              ) : null}

              {activeTab === "quiz" ? (
                <article className="lms-modules-card">
                  <h2>Quizz</h2>
                  {quizzes.length ? (
                    <div className="lms-quiz-grid">
                      {quizzes.map((quiz) => {
                        const latestAttempt = quiz.latest_attempt;
                        const isDone = Boolean(quiz.is_done);
                        const hasFailedAttempt = Boolean(latestAttempt && !latestAttempt.is_passed);
                        const actionLabel = isDone ? "Done" : hasFailedAttempt ? "Retry" : "Start Quiz";
                        return (
                          <article key={quiz.id} className={`lms-quiz-card ${isDone ? "is-done" : ""}`}>
                            <div className="lms-quiz-head">
                              <h3>{quiz.title}</h3>
                              <span className={`lms-quiz-badge ${isDone ? "is-complete" : ""}`}>
                                {isDone ? "Passed" : hasFailedAttempt ? "Retry" : "Available"}
                              </span>
                            </div>
                            <p>{quiz.description || `Module ${quiz.module_number || "-"} quiz`}</p>
                            <div className="lms-quiz-meta">
                              <span>
                                <HiOutlineClipboardDocumentList />
                                {quiz.question_count} questions
                              </span>
                              <span>
                                <HiOutlineClock />
                                {quiz.time_per_question_seconds}s per question
                              </span>
                              <span>
                                <HiOutlineShieldCheck />
                                {quiz.pass_percentage}% pass mark
                              </span>
                              <span>Attempts: {quiz.attempts_count}</span>
                            </div>
                            {latestAttempt ? (
                              <p className="lms-result-note">
                                Last score: {latestAttempt.score}/{latestAttempt.total_marks} ({Number(latestAttempt.percentage).toFixed(2)}%)
                              </p>
                            ) : null}
                            <button
                              type="button"
                              className={`btn ${isDone ? "btn-muted" : "btn-primary"}`}
                              onClick={() => {
                                if (!isDone) {
                                  navigate(`/user/lms/${courseId}/quiz/${quiz.id}`);
                                }
                              }}
                              disabled={isDone}
                            >
                              {actionLabel}
                            </button>
                          </article>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="lms-placeholder-message">No quizzes available yet. Please stay tuned.</p>
                  )}
                </article>
              ) : null}
              {projectPdf ? (
                <section className="lesson-pdf-fullscreen" onContextMenu={(event) => event.preventDefault()}>
                  <div className="lesson-pdf-fullscreen-topbar">
                    <div className="lesson-pdf-file">
                      <HiOutlineClipboardDocumentList />
                      <span>{projectPdf.name}</span>
                    </div>
                    <button type="button" className="btn btn-primary" onClick={() => setProjectPdf(null)}>
                      Back to Projects
                    </button>
                  </div>
                  <LessonPdfViewer name={projectPdf.name} url={projectPdf.url} />
                </section>
              ) : null}

              {activeTab === "certificate" ? (
                <article className="lms-modules-card">
                  <h2>Certificate</h2>
                  <p className="lms-placeholder-message">
                    Complete all required criteria to unlock your course certificate.
                  </p>
                  <div className="lms-certificate-panel">
                    <div className="lms-certificate-progress">{completedLessons}/{totalLessons} lessons complete</div>
                    <ul className="lms-certificate-checklist">
                      <li className={completedLessons === totalLessons ? "is-complete" : ""}>
                        Complete all lessons ({completedLessons}/{totalLessons})
                      </li>
                      <li className={progressPercent >= 100 ? "is-complete" : ""}>Reach 100% course progress</li>
                      <li>Pass all required module quizzes (published on weekends)</li>
                    </ul>
                    <button type="button" className="btn btn-primary" disabled={completedLessons !== totalLessons}>
                      Generate Certificate
                    </button>
                  </div>
                </article>
              ) : null}
            </div>
          </div>
        </section>
      )}
    </MainLayout>
  );
}
