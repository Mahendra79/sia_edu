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
  9: "Final Projects",
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
  const [selectedModule, setSelectedModule] = useState(null);

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
    const completedCount = module.lessons?.filter((item) => item.is_completed).length || 0;
    if (module.is_project_section || Number(module.module_number) === 9) {
      return `${module.lessons?.length || 0} ${module.lessons?.length === 1 ? "project" : "projects"}`;
    }
    return `${completedCount}/${module.lessons?.length || 0} lessons`;
  };

  // Winding calculations for level nodes
  const roadmapNodes = useMemo(() => {
    const list = modules.map((module, index) => {
      const x = 50 + 20 * Math.sin((index * Math.PI) / 2);
      const y = index * 145 + 75;

      const completedCount = module.lessons?.filter((item) => item.is_completed).length || 0;
      const isCompleted = Boolean(module.is_completed);
      const isUnlocked = module.lessons?.some((lesson) => lesson.is_unlocked) || false;
      const status = isCompleted ? "completed" : isUnlocked ? "active" : "locked";

      return {
        ...module,
        x,
        y,
        completedCount,
        status,
      };
    });

    if (list.length > 0) {
      const certIndex = list.length;
      const certX = 50 + 20 * Math.sin((certIndex * Math.PI) / 2);
      const certY = certIndex * 145 + 75;
      
      const isCertUnlocked = completedLessons === totalLessons;
      const status = isCertUnlocked ? "completed" : "locked";

      list.push({
        is_certificate_node: true,
        module_number: 99,
        x: certX,
        y: certY,
        status,
      });
    }

    return list;
  }, [modules, completedLessons, totalLessons]);

  const roadmapHeight = useMemo(() => {
    if (roadmapNodes.length === 0) return 0;
    return roadmapNodes.length * 145 + 40;
  }, [roadmapNodes]);

  const svgPath = useMemo(() => {
    if (roadmapNodes.length === 0) return "";
    let path = `M ${roadmapNodes[0].x} ${roadmapNodes[0].y}`;
    for (let i = 1; i < roadmapNodes.length; i++) {
      const prev = roadmapNodes[i - 1];
      const curr = roadmapNodes[i];
      const cp1y = prev.y + 70;
      const cp2y = curr.y - 70;
      path += ` C ${prev.x} ${cp1y}, ${curr.x} ${cp2y}, ${curr.x} ${curr.y}`;
    }
    return path;
  }, [roadmapNodes]);

  const selectedModuleQuiz = useMemo(() => {
    if (!selectedModule) return null;
    return quizzes.find((q) => Number(q.module_number) === Number(selectedModule.module_number));
  }, [selectedModule, quizzes]);

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
            <div className="lms-hero-meta"></div>
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
                  <div className="roadmap-header">
                    <h2>Course Roadmap</h2>
                    <p>Click on any level node below to view lessons and complete quizzes.</p>
                  </div>
                  
                  <div className="lms-roadmap-area" style={{ height: `${roadmapHeight}px` }}>
                    <svg
                      className="roadmap-svg-path"
                      viewBox={`0 0 100 ${roadmapHeight}`}
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <linearGradient id="roadmap-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="var(--accent-strong)" />
                          <stop offset="50%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                      </defs>
                      <path
                        d={svgPath}
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.05)"
                        strokeWidth="8"
                      />
                      <path
                        d={svgPath}
                        fill="none"
                        stroke="url(#roadmap-gradient)"
                        strokeWidth="4"
                        strokeDasharray="10 8"
                        className="glowing-line"
                      />
                    </svg>

                    {roadmapNodes.map((node, index) => {
                      const isLeft = node.x < 50;

                      if (node.is_certificate_node) {
                        return (
                          <div
                            key="certificate-node"
                            className={`roadmap-node-wrapper certificate ${node.status}`}
                            style={{
                              left: `${node.x}%`,
                              top: `${node.y}px`,
                            }}
                          >
                            <button
                              type="button"
                              className={`roadmap-node-circle certificate-node ${node.status}`}
                              onClick={() => setSelectedModule(node)}
                              title="Course Certification"
                            >
                              <HiOutlineShieldCheck className="node-icon-completed" />
                              {node.status === "active" && (
                                <span className="node-pulse-aura" />
                              )}
                            </button>
                            
                            <div className={`roadmap-node-label ${isLeft ? "label-right" : "label-left"}`}>
                              <span className="node-label-kicker" style={{ color: "var(--accent-strong)" }}>Achievement</span>
                              <h4>Course Certification</h4>
                              <span className="node-label-progress">
                                {node.status === "completed" ? "Click to generate" : "Locked"}
                              </span>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={node.module_number}
                          className={`roadmap-node-wrapper ${node.status}`}
                          style={{
                            left: `${node.x}%`,
                            top: `${node.y}px`,
                          }}
                        >
                          <button
                            type="button"
                            className={`roadmap-node-circle ${node.status}`}
                            onClick={() => setSelectedModule(node)}
                            title={getModuleTitle(node)}
                          >
                            {node.status === "completed" ? (
                              <HiOutlineCheckCircle className="node-icon-completed" />
                            ) : node.status === "locked" ? (
                              <HiOutlineLockClosed className="node-icon-locked" />
                            ) : (
                              <span className="node-index">{index + 1}</span>
                            )}
                            {node.status === "active" && (
                              <span className="node-pulse-aura" />
                            )}
                          </button>
                          <div className={`roadmap-node-label ${isLeft ? "label-right" : "label-left"}`}>
                            <span className="node-label-kicker">Level {index + 1}</span>
                            <h4>{node.is_project_section || Number(node.module_number) === 9 ? "Final Projects" : MODULE_TITLES[node.module_number] || "Module"}</h4>
                            <span className="node-label-progress">{getModuleCountLabel(node)}</span>
                          </div>
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
          
          {/* Slide-over Module Details Drawer */}
          {selectedModule && (
            <>
              <div className="lms-drawer-overlay active" onClick={() => setSelectedModule(null)} />
              <div className="lms-details-drawer active">
                <div className="drawer-header">
                  <div>
                    <span className="drawer-kicker">
                      {selectedModule.is_certificate_node ? "Achievement stop" : `Level ${roadmapNodes.findIndex(n => n.module_number === selectedModule.module_number) + 1}`}
                    </span>
                    <h3>
                      {selectedModule.is_certificate_node ? "Course Certification" : getModuleTitle(selectedModule)}
                    </h3>
                  </div>
                  <button
                    type="button"
                    className="btn btn-muted btn-icon drawer-close-btn"
                    onClick={() => setSelectedModule(null)}
                    aria-label="Close details"
                  >
                    <HiOutlineXMark />
                  </button>
                </div>

                <div className="drawer-body">
                  {selectedModule.is_certificate_node ? (
                    <div className="drawer-certificate-content">
                      <p>Complete all core module requirements and evaluations to generate your course certificate.</p>
                      
                      <div className="drawer-progress-info" style={{ margin: "1.5rem 0" }}>
                        <div className="drawer-progress-meta">
                          <strong>Certification Criteria</strong>
                          <span>{completedLessons} / {totalLessons} Lessons Verified</span>
                        </div>
                        <div className="drawer-progress-bar">
                          <div
                            className="drawer-progress-fill"
                            style={{
                              width: `${totalLessons ? (completedLessons / totalLessons) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>

                      <ul className="lms-certificate-checklist" style={{ paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "0.85rem", marginBottom: "2rem" }}>
                        <li className={completedLessons === totalLessons ? "is-complete" : ""} style={{ position: "relative", paddingLeft: "1.5rem", color: completedLessons === totalLessons ? "var(--text-primary)" : "var(--text-secondary)" }}>
                          <span style={{ position: "absolute", left: 0, color: completedLessons === totalLessons ? "#10b981" : "#64748b" }}>
                            {completedLessons === totalLessons ? "●" : "○"}
                          </span>
                          Complete all {totalLessons} course lessons ({completedLessons} completed)
                        </li>
                        <li className={progressPercent >= 100 ? "is-complete" : ""} style={{ position: "relative", paddingLeft: "1.5rem", color: progressPercent >= 100 ? "var(--text-primary)" : "var(--text-secondary)" }}>
                          <span style={{ position: "absolute", left: 0, color: progressPercent >= 100 ? "#10b981" : "#64748b" }}>
                            {progressPercent >= 100 ? "●" : "○"}
                          </span>
                          Reach 100% course progress rating
                        </li>
                      </ul>

                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ width: "100%" }}
                        disabled={completedLessons !== totalLessons}
                        onClick={() => {
                          setActiveTab("certificate");
                          setSelectedModule(null);
                        }}
                      >
                        Go to Certificate tab
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="drawer-progress-info">
                        <div className="drawer-progress-meta">
                          <strong>Lessons Progress</strong>
                          <span>{selectedModule.completedCount} / {selectedModule.lessons?.length || 0} Complete</span>
                        </div>
                        <div className="drawer-progress-bar">
                          <div
                            className="drawer-progress-fill"
                            style={{
                              width: `${selectedModule.lessons?.length ? (selectedModule.completedCount / selectedModule.lessons.length) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="drawer-section">
                        <h4>Course Lessons</h4>
                        <ul className="drawer-lesson-list">
                          {selectedModule.lessons?.map((lesson) => {
                            const lessonStatus = getLessonStatus(lesson);
                            const isPlayable =
                              lessonStatus === "Continue" || lessonStatus === "Resume" || lessonStatus === "Completed";
                            const isProjectLesson = lesson.is_project || Number(selectedModule.module_number) === 9;

                            return (
                              <li
                                key={lesson.id}
                                className={`drawer-lesson-row ${lesson.is_completed ? "is-completed" : lesson.is_unlocked ? "is-unlocked" : "is-locked"}`}
                              >
                                <div className="lesson-info-col">
                                  {lesson.is_completed ? (
                                    <HiOutlineCheckCircle className="drawer-lesson-icon is-completed" />
                                  ) : lesson.is_unlocked ? (
                                    <HiOutlinePlayCircle className="drawer-lesson-icon is-unlocked" />
                                  ) : (
                                    <HiOutlineLockClosed className="drawer-lesson-icon is-locked" />
                                  )}
                                  <div className="lesson-info-details">
                                    <span className="lesson-info-title">{lesson.title}</span>
                                    <small className="lesson-info-duration">
                                      Duration: {durationByLessonId[lesson.id] || "-"}
                                    </small>
                                  </div>
                                </div>
                                
                                <div className="lesson-action-col">
                                  {isPlayable ? (
                                    isProjectLesson ? (
                                      <div style={{ display: "flex", gap: "0.5rem" }}>
                                        <button
                                          type="button"
                                          className={`btn btn-small ${lessonStatus === "Completed" ? "btn-muted" : "btn-primary"} drawer-lesson-btn`}
                                          onClick={() => handleLessonAction(selectedModule.module_number, lesson)}
                                        >
                                          View PDF
                                        </button>
                                        <button
                                          type="button"
                                          className="btn btn-muted btn-icon btn-small"
                                          onClick={() => downloadProjectPdf(lesson)}
                                          disabled={downloadingProjectPdfId === lesson.id}
                                          title="Download PDF"
                                        >
                                          <HiOutlineDocumentArrowDown />
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        className={`btn btn-small ${lessonStatus === "Completed" ? "btn-muted" : "btn-primary"} drawer-lesson-btn`}
                                        onClick={() => handleLessonAction(selectedModule.module_number, lesson)}
                                      >
                                        {lessonStatus}
                                      </button>
                                    )
                                  ) : (
                                    <span className="drawer-lesson-status-badge">Locked</span>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>

                      {/* Integrated Module Quiz */}
                      {selectedModuleQuiz && (
                        <div className="drawer-section drawer-quiz-section">
                          <h4>Module Evaluation</h4>
                          <div className={`drawer-quiz-card ${selectedModuleQuiz.is_done ? "passed" : ""}`}>
                            <div className="quiz-card-head">
                              <h5>{selectedModuleQuiz.title}</h5>
                              <span className={`quiz-badge ${selectedModuleQuiz.is_done ? "passed" : ""}`}>
                                {selectedModuleQuiz.is_done ? "Passed" : "Available"}
                              </span>
                            </div>
                            <p>{selectedModuleQuiz.description || "Complete the lessons above then evaluate your knowledge."}</p>
                            <div className="quiz-card-meta">
                              <span>{selectedModuleQuiz.question_count} Questions</span>
                              <span>{selectedModuleQuiz.pass_percentage}% Passing Mark</span>
                            </div>
                            <button
                              type="button"
                              className={`btn ${selectedModuleQuiz.is_done ? "btn-muted" : "btn-primary"} quiz-btn`}
                              onClick={() => {
                                if (!selectedModuleQuiz.is_done) {
                                  navigate(`/user/lms/${courseId}/quiz/${selectedModuleQuiz.id}`);
                                }
                              }}
                              disabled={selectedModuleQuiz.is_done}
                            >
                              {selectedModuleQuiz.is_done ? "Evaluation Passed" : "Start Evaluation"}
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      )}
    </MainLayout>
  );
}
