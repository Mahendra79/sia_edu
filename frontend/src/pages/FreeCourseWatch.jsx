import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  HiOutlineArrowLeft,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineChevronDown,
  HiOutlinePlayCircle,
  HiOutlineRectangleStack,
  HiOutlineXMark,
} from "react-icons/hi2";

import PageTransition from "../components/PageTransition";
import { SkeletonBlock, SkeletonText } from "../components/Skeleton";
import { useToast } from "../context/ToastContext";
import MainLayout from "../layouts/MainLayout";
import { courseService } from "../services/courseService";
import { extractYoutubeThumbnail, getYoutubeEmbedUrl } from "../utils/youtube";
import "./FreeCourseWatch.css";

export default function FreeCourseWatch() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [freeCourse, setFreeCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openModuleId, setOpenModuleId] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [playerActivated, setPlayerActivated] = useState(false);
  const [mobileContentOpen, setMobileContentOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia("(max-width: 860px)").matches);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 860px)");
    const handleChange = (event) => setIsMobile(event.matches);
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    setPlayerActivated(false);
  }, [activeLesson?.id]);

  useEffect(() => {
    document.body.style.overflow = mobileContentOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileContentOpen]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    const loadFreeCourse = async () => {
      try {
        const response = await courseService.getFreeCourse(id);
        if (!cancelled) {
          const data = response.data;
          setFreeCourse(data);
          const firstModule = data.modules?.[0];
          const firstLesson = firstModule?.lessons?.[0];
          setOpenModuleId(firstModule?.id ?? null);
          setActiveLesson(firstLesson ?? null);
        }
      } catch {
        if (!cancelled) {
          setError("This free course is unavailable.");
          addToast({ type: "error", message: "Unable to load this free course." });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadFreeCourse();
    return () => {
      cancelled = true;
    };
  }, [id, addToast]);

  const toggleModule = (moduleId) => {
    setOpenModuleId((prev) => (prev === moduleId ? null : moduleId));
  };

  const modules = useMemo(() => freeCourse?.modules || [], [freeCourse]);
  const hasModules = modules.length > 0;
  const lessonCount = useMemo(
    () => modules.reduce((sum, module) => sum + (module.lessons?.length || 0), 0),
    [modules],
  );

  const rawEmbedUrl = hasModules
    ? activeLesson
      ? getYoutubeEmbedUrl(activeLesson.youtube_url)
      : ""
    : getYoutubeEmbedUrl(freeCourse?.youtube_url || "");

  const embedUrl = rawEmbedUrl ? `${rawEmbedUrl}${rawEmbedUrl.includes("?") ? "&" : "?"}autoplay=1` : "";

  const facadeThumbnail = hasModules
    ? activeLesson?.thumbnail_url || extractYoutubeThumbnail(activeLesson?.youtube_url || "")
    : freeCourse?.thumbnail_url || extractYoutubeThumbnail(freeCourse?.youtube_url || "");

  const activeModule = useMemo(() => {
    if (!activeLesson) return null;
    return modules.find((module) => module.lessons?.some((lesson) => lesson.id === activeLesson.id)) || null;
  }, [modules, activeLesson]);

  return (
    <MainLayout>
      <PageTransition>
        <section className="free-course-watch">
          <button type="button" className="free-course-watch-back" onClick={() => navigate(-1)}>
            <HiOutlineArrowLeft />
            Back
          </button>

          {loading ? (
            <>
              <div className="free-course-watch-header">
                <SkeletonText width="110px" className="free-course-watch-skeleton-badge" />
                <SkeletonText width="min(420px, 55%)" className="free-course-watch-skeleton-title" />
                <SkeletonText width="150px" className="free-course-watch-skeleton-meta" />
              </div>
              <div className="free-course-watch-grid">
                <div className="free-course-watch-main">
                  <SkeletonBlock className="free-course-player-skeleton" radius="var(--radius-lg)" />
                  <SkeletonText width="150px" />
                </div>
                <aside className="free-course-watch-sidebar-loading">
                  <SkeletonText width="55%" className="free-course-watch-skeleton-meta" />
                  <div className="free-course-watch-sidebar-skeleton-list">
                    <SkeletonBlock height="46px" radius="10px" />
                    <SkeletonBlock height="46px" radius="10px" />
                    <SkeletonBlock height="46px" radius="10px" />
                  </div>
                </aside>
              </div>
            </>
          ) : error || !freeCourse ? (
            <div className="empty-state">
              <p>{error || "This free course is unavailable."}</p>
              <Link to="/" className="btn btn-primary">
                Back to Home
              </Link>
            </div>
          ) : (
            <>
              <header className="free-course-watch-header">
                <span className="pill pill-owned">Free Course</span>
                <h1>{freeCourse.title}</h1>
                {hasModules && (
                  <p className="free-course-watch-meta">
                    <HiOutlineRectangleStack />
                    {modules.length} {modules.length === 1 ? "module" : "modules"} · {lessonCount}{" "}
                    {lessonCount === 1 ? "lesson" : "lessons"}
                  </p>
                )}
              </header>

              <div className="free-course-watch-grid">
                <div className="free-course-watch-main">
                  <div className="free-course-player">
                    {playerActivated && rawEmbedUrl ? (
                      <iframe
                        src={embedUrl}
                        title={activeLesson?.title || freeCourse.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                      />
                    ) : rawEmbedUrl ? (
                      <button
                        type="button"
                        className="free-course-player-facade"
                        onClick={() => setPlayerActivated(true)}
                        aria-label={`Play ${activeLesson?.title || freeCourse.title}`}
                      >
                        {facadeThumbnail && <img src={facadeThumbnail} alt="" />}
                        <span className="free-course-player-play-btn">
                          <HiOutlinePlayCircle />
                        </span>
                      </button>
                    ) : (
                      <div className="free-course-player-placeholder">
                        <HiOutlinePlayCircle />
                        <span>Select a lesson to start watching</span>
                      </div>
                    )}
                  </div>

                  <div className="free-course-info-card">
                    {activeLesson && (
                      <div className="free-course-now-playing">
                        {activeModule && (
                          <span className="free-course-now-playing-breadcrumb">
                            Module {activeModule.module_number} · Lesson {activeLesson.lesson_number}
                          </span>
                        )}
                        <h2>{activeLesson.title}</h2>
                      </div>
                    )}
                    <a
                      href={freeCourse.youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="free-course-watch-external"
                    >
                      <HiOutlineArrowTopRightOnSquare />
                      Open on YouTube
                    </a>
                  </div>
                </div>

                {hasModules && (() => {
                  const courseContentList = (
                    <div className="free-course-modules">
                      {modules.map((module) => (
                        <div key={module.id} className="free-course-module">
                          <button
                            type="button"
                            className="free-course-module-header"
                            onClick={() => toggleModule(module.id)}
                            aria-expanded={openModuleId === module.id}
                          >
                            <span className="free-course-module-header-label">
                              <span
                                className={`free-course-module-index ${openModuleId === module.id ? "is-open" : ""}`}
                              >
                                {module.module_number}
                              </span>
                              <span>{module.title}</span>
                            </span>
                            <HiOutlineChevronDown className={openModuleId === module.id ? "is-open" : ""} />
                          </button>

                          {openModuleId === module.id && (
                            <ul className="free-course-lesson-list">
                              {module.lessons.map((lesson) => {
                                const lessonThumb =
                                  lesson.thumbnail_url || extractYoutubeThumbnail(lesson.youtube_url);
                                return (
                                  <li key={lesson.id}>
                                    <button
                                      type="button"
                                      className={`free-course-lesson-btn ${activeLesson?.id === lesson.id ? "is-active" : ""}`}
                                      onClick={() => {
                                        setActiveLesson(lesson);
                                        setMobileContentOpen(false);
                                      }}
                                    >
                                      <span className="free-course-lesson-thumb">
                                        {lessonThumb ? (
                                          <img src={lessonThumb} alt="" />
                                        ) : (
                                          <HiOutlinePlayCircle />
                                        )}
                                        <span className="free-course-lesson-thumb-badge">{lesson.lesson_number}</span>
                                      </span>
                                      <span className="free-course-lesson-title">{lesson.title}</span>
                                      <HiOutlinePlayCircle className="free-course-lesson-play-icon" />
                                    </button>
                                  </li>
                                );
                              })}
                              {module.lessons.length === 0 && (
                                <li className="meta-note free-course-lesson-empty">No lessons in this module yet.</li>
                              )}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  );

                  if (!isMobile) {
                    return (
                      <aside className="free-course-watch-sidebar">
                        <h2>Course Content</h2>
                        {courseContentList}
                      </aside>
                    );
                  }

                  return createPortal(
                    <>
                      {mobileContentOpen && (
                        <button
                          type="button"
                          className="free-course-content-backdrop"
                          onClick={() => setMobileContentOpen(false)}
                          aria-label="Close course content"
                        />
                      )}
                      <button
                        type="button"
                        className="free-course-content-toggle"
                        onClick={() => setMobileContentOpen(true)}
                      >
                        <HiOutlineRectangleStack />
                        Course Content
                      </button>
                      <aside className={`free-course-watch-sidebar ${mobileContentOpen ? "is-open" : ""}`}>
                        <div className="free-course-watch-sidebar-head">
                          <h2>Course Content</h2>
                          <button
                            type="button"
                            className="free-course-watch-sidebar-close"
                            onClick={() => setMobileContentOpen(false)}
                            aria-label="Close course content"
                          >
                            <HiOutlineXMark />
                          </button>
                        </div>
                        {courseContentList}
                      </aside>
                    </>,
                    document.body,
                  );
                })()}
              </div>
            </>
          )}
        </section>
      </PageTransition>
    </MainLayout>
  );
}
