import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { HiOutlineArrowLeft, HiOutlineDocumentText, HiOutlinePlayCircle } from "react-icons/hi2";

import LoadingSpinner from "../components/LoadingSpinner";
import { useToast } from "../context/ToastContext";
import MainLayout from "../layouts/MainLayout";
import { courseService } from "../services/courseService";
import "./user.css";

const LESSON_WATCH_PROGRESS_KEY = "lms_lesson_watch_progress_v1";

export default function LessonPlayer() {
  const { courseId, moduleId, lessonId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [lesson, setLesson] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [maxWatchedPercent, setMaxWatchedPercent] = useState(0);
  const [isAutoCompleted, setIsAutoCompleted] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const WATCH_THRESHOLD_PERCENT = 80;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [lessonResponse, overviewResponse] = await Promise.all([
          courseService.getLessonDetail(lessonId),
          courseService.getLmsOverview(courseId),
        ]);
        setLesson(lessonResponse.data);
        setOverview(overviewResponse.data);
        setMaxWatchedPercent(0);
        setIsAutoCompleted(false);
      } catch {
        addToast({ type: "error", message: "Unable to load lesson details." });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [lessonId, courseId, addToast]);

  const allLessons = (overview?.modules || []).flatMap((module) =>
    (module.lessons || []).map((item) => ({ ...item, module_number: module.module_number })),
  );
  const lessonIndex = allLessons.findIndex((item) => String(item.id) === String(lessonId));
  const previousLesson = lessonIndex > 0 ? allLessons[lessonIndex - 1] : null;
  const nextLesson = lessonIndex >= 0 && lessonIndex < allLessons.length - 1 ? allLessons[lessonIndex + 1] : null;
  const videoUrl = String(lesson?.video_url || "").trim();
  const pdfUrl = String(lesson?.pdf_url || "").trim();
  const pdfName = `${String(lesson?.title || `Module ${moduleId} - Lesson ${lessonId}`).trim()}.pdf`;
  const pdfEmbedUrl = pdfUrl ? `${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1` : "";
  const isPlayableLesson = (item) =>
    Boolean(item && Number.isInteger(Number(item.id)) && Number(item.id) > 0 && item.is_unlocked);
  const previousEnabled = isPlayableLesson(previousLesson);
  const nextEnabled = isPlayableLesson(nextLesson);

  const openLesson = (target) => {
    if (!target) {
      return;
    }
    navigate(`/user/lms/${courseId}/module/${target.module_number}/lesson/${target.id}`);
  };

  const markComplete = async () => {
    if (marking || !lesson || isAutoCompleted) {
      return;
    }
    setMarking(true);
    try {
      await courseService.updateLessonProgress(lesson.id, { action: "complete" });
      setIsAutoCompleted(true);
      addToast({ type: "success", message: "Lesson marked complete." });
    } catch (error) {
      const detail = error?.response?.data?.detail || "Unable to update lesson progress.";
      addToast({ type: "error", message: detail });
    } finally {
      setMarking(false);
    }
  };

  const handleTimeUpdate = (event) => {
    const media = event.currentTarget;
    const nextCurrentTime = Number(media.currentTime || 0);
    const nextDuration = Number(media.duration || 0);
    if (!Number.isFinite(nextDuration) || nextDuration <= 0) {
      return;
    }
    const watchedPercent = (nextCurrentTime / nextDuration) * 100;
    setMaxWatchedPercent((previous) => {
      const next = Math.max(previous, watchedPercent);
      try {
        const raw = localStorage.getItem(LESSON_WATCH_PROGRESS_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        const safeMap = parsed && typeof parsed === "object" ? parsed : {};
        safeMap[String(lessonId)] = next;
        localStorage.setItem(LESSON_WATCH_PROGRESS_KEY, JSON.stringify(safeMap));
      } catch {
        // Ignore local storage failures and continue playback flow.
      }
      if (next >= WATCH_THRESHOLD_PERCENT && !isAutoCompleted) {
        markComplete();
      }
      return next;
    });
  };

  return (
    <MainLayout>
      <section className="lesson-shell">
        <div className="lesson-topbar">
          <Link to={`/user/lms/${courseId}`} className="btn btn-muted btn-icon">
            <HiOutlineArrowLeft />
            Back to LMS
          </Link>
        </div>

        {loading ? <LoadingSpinner label="Loading lesson..." /> : null}
        {!loading && lesson ? (
          <article className="lesson-card">
            <p className="lms-kicker">Lesson Player</p>
            <p className="lesson-breadcrumb">
              {`Module ${lesson.module_number} > Lesson ${lesson.lesson_number} > Video`}
            </p>
            <h1>{lesson.title || `Module ${moduleId} - Lesson ${lessonId}`}</h1>
            <p className="lesson-description">
              {lesson.description || "Watch this lesson to complete it and unlock the next lesson."}
            </p>

            {videoUrl ? (
              <div className="lesson-video-wrap">
                <video
                  controls
                  controlsList="nodownload"
                  preload="metadata"
                  className="lesson-video"
                  src={videoUrl}
                  poster={lesson.thumbnail_url || undefined}
                  onContextMenu={(event) => event.preventDefault()}
                  onTimeUpdate={handleTimeUpdate}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            ) : (
              <div className="lesson-video-placeholder">
                <HiOutlineDocumentText />
                <p>Lesson will be uploaded soon. Meanwhile go through the Document.</p>
              </div>
            )}

            <div className="lesson-info">
              <span>
                <HiOutlinePlayCircle />
                {videoUrl ? `Now playing: ${lesson.title}` : `Document available: ${lesson.title}`}
              </span>
            </div>
            {pdfUrl ? (
              <section className="lesson-pdf-section" onContextMenu={(event) => event.preventDefault()}>
                <div className="lesson-pdf-row">
                  <div className="lesson-pdf-file">
                    <HiOutlineDocumentText />
                    <span>{pdfName}</span>
                  </div>
                  <button type="button" className="btn btn-muted lesson-pdf-view" onClick={() => setShowPdfViewer(true)}>
                    View
                  </button>
                </div>
              </section>
            ) : null}
            <div className="lesson-nav-row">
              <button
                type="button"
                className="btn btn-muted"
                onClick={() => openLesson(previousLesson)}
                disabled={!previousEnabled}
                title={!previousLesson ? "No previous lesson." : !previousEnabled ? "Previous lesson is locked." : ""}
              >
                Previous
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => openLesson(nextLesson)}
                disabled={!nextEnabled}
                title={!nextLesson ? "No next lesson." : !nextEnabled ? "Next lesson is locked." : ""}
              >
                Next
              </button>
            </div>
          </article>
        ) : null}
        {showPdfViewer ? (
          <section className="lesson-pdf-fullscreen" onContextMenu={(event) => event.preventDefault()}>
            <div className="lesson-pdf-fullscreen-topbar">
              <div className="lesson-pdf-file">
                <HiOutlineDocumentText />
                <span>{pdfName}</span>
              </div>
              <button type="button" className="btn btn-primary" onClick={() => setShowPdfViewer(false)}>
                Back to Video
              </button>
            </div>
            <iframe title={pdfName} src={pdfEmbedUrl} className="lesson-pdf-fullscreen-frame" loading="lazy" referrerPolicy="no-referrer" />
          </section>
        ) : null}
      </section>
    </MainLayout>
  );
}
