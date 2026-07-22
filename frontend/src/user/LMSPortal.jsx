import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  HiOutlineArrowLeft,
  HiOutlineClipboardDocumentList,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineShieldCheck,
  HiOutlineXMark,
  HiOutlineDocumentArrowDown,
  HiOutlineLockClosed,
  HiOutlineBars3,
  HiOutlinePlayCircle,
  HiOutlineRectangleStack,
  HiOutlineSparkles,
  HiOutlineBriefcase,
} from "react-icons/hi2";

import { SkeletonPanel } from "../components/Skeleton";
import { useToast } from "../context/ToastContext";
import MainLayout from "../layouts/MainLayout";
import { API_BASE_URL } from "../services/api";
import { courseService } from "../services/courseService";
import { lmsPortalCacheKey } from "../data/lmsPrefetch";
import { getCached, setCached } from "../utils/sessionCache";
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

const SCIENTISTS = {
  1: {
    name: "Paul Dirac",
    initials: "PD",
    blurb: "Dirac's notation and formulation underpin the Hilbert spaces, quantum states, and measurement concepts covered in this module.",
    photo: "/images/scientists/Paul_Dirac.jpg",
  },
  2: {
    name: "Richard Feynman",
    initials: "RF",
    blurb: "Feynman's vision of quantum computation laid the conceptual groundwork for qubits, gates, and circuit design.",
    photo: "/images/scientists/richard_feynman.jpg",
  },
  3: {
    name: "Erwin Schrödinger",
    initials: "ES",
    blurb: "Bell states, entanglement, and density matrices all build on concepts Schrödinger introduced.",
    photo: "/images/scientists/Erwin_Schrdinger.jpg",
  },
  4: {
    name: "David Deutsch",
    initials: "DD",
    blurb: "Deutsch created the first quantum algorithm, the basis for this module's Deutsch and Deutsch-Jozsa content.",
    photo: "/images/scientists/david_Deutsch.jpg",
  },
  5: {
    name: "Lov Grover",
    initials: "LG",
    blurb: "Grover's search algorithm is the flagship topic of this module.",
    photo: "/images/scientists/Lov_Grover.jpg",
  },
  6: {
    name: "Charles Bennett",
    initials: "CB",
    blurb: "Bennett co-created BB84, the foundational quantum key distribution protocol.",
    photo: "/images/scientists/Charles_Bennett.jpg",
  },
  7: {
    name: "Edward Farhi",
    initials: "EF",
    blurb: "Farhi introduced QAOA, one of the most influential variational quantum algorithms.",
    photo: "/images/scientists/Edward_Farhi.jpg",
  },
  8: {
    name: "Maria Schuld",
    initials: "MS",
    blurb: "Schuld is a leading researcher and educator in quantum machine learning.",
    photo: "/images/scientists/Maria_Schuld.jpeg",
  },
};

const LESSON_WATCH_PROGRESS_KEY = "lms_lesson_watch_progress_v1";

export default function LMSPortal() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const cachedLms = getCached(lmsPortalCacheKey(courseId));
  const [course, setCourse] = useState(() => cachedLms?.course || null);
  const [overview, setOverview] = useState(() => cachedLms?.overview || null);
  const [loading, setLoading] = useState(() => !cachedLms);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("modules");
  const [watchProgressByLessonId, setWatchProgressByLessonId] = useState({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quizzes, setQuizzes] = useState(() => cachedLms?.quizzes || []);
  const [projectPdf, setProjectPdf] = useState(null);
  const [downloadingProjectPdfId, setDownloadingProjectPdfId] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [activeModule, setActiveModule] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hoveredNodeKey, setHoveredNodeKey] = useState(null);

  useEffect(() => {
    if (selectedModule) {
      setActiveModule(selectedModule);
      setDrawerOpen(true);
    } else {
      setDrawerOpen(false);
      const timer = setTimeout(() => {
        setActiveModule(null);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [selectedModule]);

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
    const cacheKey = lmsPortalCacheKey(courseId);
    const cached = getCached(cacheKey);
    if (!cached) {
      setLoading(true);
    }
    setError("");

    const loadCourse = async () => {
      try {
        const [courseResponse, overviewResponse] = await Promise.all([
          courseService.getCourse(courseId),
          courseService.getLmsOverview(courseId),
        ]);
        const quizResponse = await courseService.getLearnerQuizzes(courseId);
        const nextCourse = courseResponse.data;
        const nextOverview = overviewResponse.data;
        const nextQuizzes = quizResponse.data || [];
        setCourse(nextCourse);
        setOverview(nextOverview);
        setQuizzes(nextQuizzes);
        setCached(cacheKey, { course: nextCourse, overview: nextOverview, quizzes: nextQuizzes });
      } catch {
        if (!cached) {
          setError("Unable to load this course in LMS portal.");
          addToast({ type: "error", message: "Unable to load LMS modules." });
        }
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

  // Auto-scroll on initial load to focus on the active/uncompleted module node.
  useEffect(() => {
    if (!loading && activeTab === "modules" && overview) {
      const scrollTimer = setTimeout(() => {
        const activeNode = document.querySelector(".roadmap-node-wrapper.active");
        if (activeNode) {
          activeNode.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
          const certNode = document.querySelector(".roadmap-node-wrapper.certificate");
          if (certNode) {
            certNode.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }
      }, 500);
      return () => clearTimeout(scrollTimer);
    }
  }, [loading, activeTab, overview]);

  // Winding calculations for level nodes (bottom-up layout).
  const VERTICAL_STEP = 110;

  const roadmapNodes = useMemo(() => {
    const totalCount = modules.length;
    const list = modules.map((module, index) => {
      const reversedIndex = totalCount - index;
      const amplitude = 15;
      const x = 50 - amplitude * Math.sin(reversedIndex * Math.PI - Math.PI / 2);
      const y = reversedIndex * VERTICAL_STEP + 75;

      const completedCount = module.lessons?.filter((item) => item.is_completed).length || 0;
      const isCompleted = Boolean(module.is_completed);
      const isUnlocked = module.lessons?.some((lesson) => lesson.is_unlocked) || false;
      const status = isCompleted ? "completed" : isUnlocked ? "active" : "locked";

      return { ...module, x, y, completedCount, status, index };
    });

    if (list.length > 0) {
      // Certificate is placed at the very top (placed at y = 0.5 * VERTICAL_STEP + 75 to align with constant sine wave).
      const isCertUnlocked = completedLessons === totalLessons;
      const status = isCertUnlocked ? "completed" : "locked";

      list.push({
        is_certificate_node: true,
        module_number: 99,
        x: 50,
        y: 0.5 * VERTICAL_STEP + 75,
        status,
        index: totalCount,
      });
    }

    return list;
  }, [modules, completedLessons, totalLessons]);

  const roadmapHeight = useMemo(() => {
    if (roadmapNodes.length === 0) return 0;
    return roadmapNodes.length * VERTICAL_STEP + 40;
  }, [roadmapNodes]);

  const svgPath = useMemo(() => {
    if (roadmapNodes.length === 0) return "";

    const sortedNodes = [...roadmapNodes].sort((a, b) => b.y - a.y);
    let path = "";

    sortedNodes.forEach((node, index) => {
      if (index === 0) {
        path = `M ${node.x.toFixed(2)} ${node.y.toFixed(2)}`;
        return;
      }

      const prevNode = sortedNodes[index - 1];
      const startX = prevNode.x;
      const startY = prevNode.y;
      const endX = node.x;
      const endY = node.y;

      const halfY = startY - (startY - endY) * 0.5;

      // Draw a smooth S-curve using cubic bezier curves
      path += ` C ${startX.toFixed(2)} ${halfY.toFixed(2)}, ${endX.toFixed(2)} ${halfY.toFixed(2)}, ${endX.toFixed(2)} ${endY.toFixed(2)}`;
    });

    return path;
  }, [roadmapNodes]);

  const activeModuleQuiz = useMemo(() => {
    if (!activeModule) return null;
    return quizzes.find((q) => Number(q.module_number) === Number(activeModule.module_number));
  }, [activeModule, quizzes]);

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
        <section className="lms-shell">
          <SkeletonPanel className="lms-hero-card" lines={2} titleWidth="55%" />
          <div className="lms-content-grid">
            <SkeletonPanel className="lms-left-nav" lines={3} titleWidth="40%" />
            <div className="lms-right-content">
              <SkeletonPanel className="lms-progress-card" lines={1} titleWidth="30%" />
              <SkeletonPanel className="lms-modules-card" lines={6} titleWidth="35%" />
            </div>
          </div>
        </section>
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
                  <div className="roadmap-header">
                    <h2>Course Roadmap</h2>
                    <p>Click on any level node below to view lessons and complete quizzes.</p>
                  </div>

                  <div className="lms-roadmap-area" style={{ height: `${roadmapHeight}px` }}>
                    <svg className="roadmap-svg-path" viewBox={`0 0 100 ${roadmapHeight}`} preserveAspectRatio="none">
                       <defs>
                        <linearGradient id="roadmap-gradient" x1="0%" y1="100%" x2="0%" y2="0%">
                          <stop offset="0%" stopColor="#00f5ff" />
                          <stop offset="50%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#7b61ff" />
                        </linearGradient>
                        <filter id="glow-blur" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="3" />
                        </filter>
                      </defs>
                      {/* Faint background track */}
                      <path
                        d={svgPath}
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.03)"
                        strokeWidth="2"
                        vectorEffect="non-scaling-stroke"
                      />
                      {/* Soft blurred glow path */}
                      <path
                        d={svgPath}
                        fill="none"
                        stroke="url(#roadmap-gradient)"
                        strokeWidth="8"
                        filter="url(#glow-blur)"
                        opacity="0.55"
                        vectorEffect="non-scaling-stroke"
                        className="glowing-line-bg"
                      />
                      {/* Crisp sharp core line */}
                      <path
                        d={svgPath}
                        fill="none"
                        stroke="url(#roadmap-gradient)"
                        strokeWidth="2"
                        vectorEffect="non-scaling-stroke"
                        className="glowing-line-core"
                      />
                    </svg>

                    {roadmapNodes.map((node, index) => {
                      const isLeft = node.x < 50;
                      const nodeKey = node.is_certificate_node ? "certificate" : String(node.module_number);
                      const isExpanded = node.status === "active" || hoveredNodeKey === nodeKey;

                      if (node.is_certificate_node) {
                        return (
                          <div
                            key="certificate-node"
                            className={`roadmap-node-wrapper certificate ${node.status} ${isExpanded ? "is-expanded" : ""}`}
                            style={{ left: `${node.x}%`, top: `${node.y}px`, animationDelay: `${node.index * 75}ms` }}
                          >
                            <button
                              type="button"
                              className={`roadmap-node-circle certificate-node ${node.status}`}
                              onClick={() => {
                                setSelectedModule(node);
                                setHoveredNodeKey(nodeKey);
                              }}
                              onMouseEnter={() => setHoveredNodeKey(nodeKey)}
                              onMouseLeave={() => setHoveredNodeKey(null)}
                              onFocus={() => setHoveredNodeKey(nodeKey)}
                              onBlur={() => setHoveredNodeKey(null)}
                              title="Course Certification"
                            >
                              <span className="node-dot" />
                              {node.status === "active" && <span className="node-pulse-aura" />}
                            </button>

                            <div
                              className={`roadmap-node-label ${isLeft ? "label-left" : "label-right"}`}
                              onClick={() => {
                                setSelectedModule(node);
                                setHoveredNodeKey(nodeKey);
                              }}
                            >
                              <h4>
                                <span className="node-label-kicker-inline">Achievement</span>
                                {" · "}
                                <span className={`node-status-badge ${node.status}`}>
                                  {node.status === "completed" ? (
                                    <>
                                      <HiOutlineShieldCheck style={{ verticalAlign: "middle", marginRight: "3px" }} />
                                      Unlocked
                                    </>
                                  ) : (
                                    <>
                                      <HiOutlineLockClosed style={{ verticalAlign: "middle", marginRight: "3px" }} />
                                      Locked
                                    </>
                                  )}
                                </span>
                              </h4>
                              <span className="node-label-title-inline">
                                Course Certification
                              </span>
                              <span className="node-label-progress">
                                {node.status === "completed" ? "Click to generate certificate" : "Complete all requirements to unlock"}
                              </span>
                            </div>
                          </div>
                        );
                      }

                      const scientist = SCIENTISTS[node.module_number];

                      return (
                        <div
                          key={node.module_number}
                          className={`roadmap-node-wrapper ${node.status} ${isExpanded ? "is-expanded" : ""}`}
                          style={{ left: `${node.x}%`, top: `${node.y}px`, animationDelay: `${index * 75}ms` }}
                        >
                          <div className="scientist-avatar-container">
                            <button
                              type="button"
                              className={`roadmap-node-circle scientist-circle ${node.status}`}
                              onClick={() => {
                                setSelectedModule(node);
                                setHoveredNodeKey(nodeKey);
                              }}
                              onMouseEnter={() => setHoveredNodeKey(nodeKey)}
                              onMouseLeave={() => setHoveredNodeKey(null)}
                              onFocus={() => setHoveredNodeKey(nodeKey)}
                              onBlur={() => setHoveredNodeKey(null)}
                              title={`${getModuleTitle(node)} — ${scientist?.name}`}
                            >
                              {scientist?.photo ? (
                                <img
                                  src={scientist.photo}
                                  alt={scientist.name}
                                  className="scientist-photo"
                                />
                              ) : Number(node.module_number) === 9 ? (
                                <div className="scientist-initials" style={{ fontSize: "1.3rem", color: node.status === "active" ? "#00f5ff" : "#7b61ff" }}>
                                  <HiOutlineBriefcase />
                                </div>
                              ) : (
                                <div className="scientist-initials">{scientist?.initials}</div>
                              )}
                              {node.status === "active" && <span className="node-pulse-aura" />}
                            </button>
                            {scientist && (
                              <div className={`scientist-tooltip ${isLeft ? "tooltip-right" : "tooltip-left"}`}>
                                <div className="scientist-tooltip-name">{scientist?.name}</div>
                                <div className="scientist-tooltip-blurb">{scientist?.blurb}</div>
                              </div>
                            )}
                          </div>
                          <div
                            className={`roadmap-node-label ${isLeft ? "label-left" : "label-right"}`}
                            onClick={() => {
                              setSelectedModule(node);
                              setHoveredNodeKey(nodeKey);
                            }}
                          >
                            <h4>
                              <span className="node-label-kicker-inline">Level {index + 1}</span>
                              {" · "}
                              <span className={`node-status-badge ${node.status}`}>
                                {node.status === "completed" && (
                                  <>
                                    <HiOutlineCheckCircle style={{ verticalAlign: "middle", marginRight: "3px" }} />
                                    Completed
                                  </>
                                )}
                                {node.status === "active" && (
                                  <>
                                    <HiOutlineSparkles className="pulsing-badge-icon" style={{ verticalAlign: "middle", marginRight: "3px" }} />
                                    Active
                                  </>
                                )}
                                {node.status === "locked" && (
                                  <>
                                    <HiOutlineLockClosed style={{ verticalAlign: "middle", marginRight: "3px" }} />
                                    Locked
                                  </>
                                )}
                              </span>
                            </h4>
                            <span className="node-label-title-inline">
                              {getModuleTitle(node).replace(/level \d+:\s*|module \d+:\s*/gi, "")}
                            </span>
                            <span className="node-label-progress">
                              {getModuleCountLabel(node).replace("lessons", "Lessons").replace("projects", "Projects").replace("project", "Project")}
                            </span>
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
          <div className={`lms-drawer-overlay ${drawerOpen ? "active" : ""}`} onClick={() => setSelectedModule(null)} />
          <div className={`lms-details-drawer ${drawerOpen ? "active" : ""}`}>
            {activeModule && (
              <>
                <div className="drawer-header">
                  <div>
                    <span className="drawer-kicker">
                      {activeModule.is_certificate_node
                        ? "Achievement stop"
                        : `Level ${roadmapNodes.findIndex((n) => n.module_number === activeModule.module_number) + 1}`}
                    </span>
                    <h3>{activeModule.is_certificate_node ? "Course Certification" : getModuleTitle(activeModule)}</h3>
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
                  {activeModule.is_certificate_node ? (
                    <div className="drawer-certificate-content">
                      <p>Complete all core module requirements and evaluations to generate your course certificate.</p>

                      <div className="drawer-progress-info" style={{ margin: "1.5rem 0" }}>
                        <div className="drawer-progress-meta">
                          <strong>Certificate Progress</strong>
                          <span>{completedLessons} / {totalLessons} Lessons Verified</span>
                        </div>
                        <div className="drawer-progress-bar">
                          <div
                            className="drawer-progress-fill"
                            style={{ width: `${totalLessons ? (completedLessons / totalLessons) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
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
                    </div>
                  ) : (
                    <>
                      <div className="drawer-progress-info">
                        <div className="drawer-progress-meta">
                          <strong>Level Progress</strong>
                          <span>{activeModule.completedCount} / {activeModule.lessons?.length || 0} Complete</span>
                        </div>
                        <div className="drawer-progress-bar">
                          <div
                            className="drawer-progress-fill"
                            style={{
                              width: `${activeModule.lessons?.length ? (activeModule.completedCount / activeModule.lessons.length) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="drawer-section">
                        <h4>Lessons</h4>
                        <ul className="drawer-lesson-list">
                          {activeModule.lessons?.map((lesson) => {
                            const isProjectLesson = lesson.is_project || Number(activeModule.module_number) === 9;
                            const lessonStatus = getLessonStatus(lesson);
                            const isPlayable =
                              lessonStatus === "Continue" || lessonStatus === "Resume" || lessonStatus === "Completed";

                            return (
                              <li
                                key={lesson.id}
                                className={`drawer-lesson-row ${lesson.is_completed ? "is-completed" : lesson.is_unlocked ? "is-unlocked" : "is-locked"}`}
                              >
                                <div className="lesson-info-col">
                                  {lesson.is_completed ? (
                                    isProjectLesson ? (
                                      <HiOutlineClipboardDocumentList className="drawer-lesson-icon is-completed" />
                                    ) : (
                                      <HiOutlinePlayCircle className="drawer-lesson-icon is-completed" />
                                    )
                                  ) : lesson.is_unlocked ? (
                                    isProjectLesson ? (
                                      <HiOutlineClipboardDocumentList className="drawer-lesson-icon is-unlocked" />
                                    ) : (
                                      <HiOutlinePlayCircle className="drawer-lesson-icon is-unlocked" />
                                    )
                                  ) : (
                                    <HiOutlineLockClosed className="drawer-lesson-icon is-locked" />
                                  )}
                                  <div className="lesson-info-details">
                                    <span className="lesson-info-title">{lesson.title}</span>
                                    <small className="lesson-info-duration">Duration: {lesson.duration || "-"}</small>
                                  </div>
                                </div>

                                <div className="lesson-action-col">
                                  {isPlayable ? (
                                    lessonStatus === "Completed" ? (
                                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                        <HiOutlineCheckCircle
                                          style={{ color: "#10b981", fontSize: "1.45rem", flexShrink: 0 }}
                                          title="Completed"
                                        />
                                        {isProjectLesson ? (
                                          <div style={{ display: "flex", gap: "0.4rem" }}>
                                            <button
                                              type="button"
                                              className="btn btn-muted btn-small drawer-lesson-btn"
                                              onClick={() => handleLessonAction(activeModule.module_number, lesson)}
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
                                            className="btn btn-muted btn-small drawer-lesson-btn"
                                            onClick={() => handleLessonAction(activeModule.module_number, lesson)}
                                          >
                                            View Lesson
                                          </button>
                                        )}
                                      </div>
                                    ) : isProjectLesson ? (
                                      <div style={{ display: "flex", gap: "0.4rem" }}>
                                        <button
                                          type="button"
                                          className="btn btn-primary btn-small drawer-lesson-btn"
                                          onClick={() => handleLessonAction(activeModule.module_number, lesson)}
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
                                        className="btn btn-primary btn-small drawer-lesson-btn"
                                        onClick={() => handleLessonAction(activeModule.module_number, lesson)}
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

                      {activeModuleQuiz && (
                        <div className="drawer-section drawer-quiz-section">
                          <h4>Module Evaluation</h4>
                          <div className={`drawer-quiz-card ${activeModuleQuiz.is_done ? "passed" : ""}`}>
                            <div className="quiz-card-head">
                              <h5>{activeModuleQuiz.title}</h5>
                              <span className={`quiz-badge ${activeModuleQuiz.is_done ? "passed" : ""}`}>
                                {activeModuleQuiz.is_done ? "Passed" : "Available"}
                              </span>
                            </div>
                            <p>{activeModuleQuiz.description || "Complete the lessons above then evaluate your knowledge."}</p>
                            <div className="quiz-card-meta">
                              <span>{activeModuleQuiz.question_count} Questions</span>
                              <span>{activeModuleQuiz.pass_percentage}% Passing Mark</span>
                            </div>
                            <button
                              type="button"
                              className={`btn ${activeModuleQuiz.is_done ? "btn-muted" : "btn-primary"} quiz-btn`}
                              onClick={() => {
                                if (!activeModuleQuiz.is_done) {
                                  navigate(`/user/lms/${courseId}/quiz/${activeModuleQuiz.id}`);
                                }
                              }}
                              disabled={activeModuleQuiz.is_done}
                            >
                              {activeModuleQuiz.is_done ? "Evaluation Passed" : "Start Evaluation"}
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </section>
      )}
    </MainLayout>
  );
}
