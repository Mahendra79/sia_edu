import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { HiOutlineArrowLeft, HiOutlineDocumentText, HiOutlinePlayCircle } from "react-icons/hi2";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerSrc from "pdfjs-dist/build/pdf.worker.mjs?url";

import LoadingSpinner from "../components/LoadingSpinner";
import { useToast } from "../context/ToastContext";
import MainLayout from "../layouts/MainLayout";
import { API_BASE_URL } from "../services/api";
import { courseService } from "../services/courseService";
import { getStoredAuth } from "../utils/storage";
import "./user.css";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

const LESSON_WATCH_PROGRESS_KEY = "lms_lesson_watch_progress_v1";

function LessonPdfViewer({ name, url }) {
  const containerRef = useRef(null);
  const canvasRefs = useRef(new Map());
  const renderRunRef = useRef(0);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let loadingTask = null;

    const loadPdf = async () => {
      setLoading(true);
      setError("");
      setPdfDoc(null);
      setPageCount(0);
      canvasRefs.current.clear();

      try {
        const { access } = getStoredAuth();
        loadingTask = pdfjsLib.getDocument({
          url,
          httpHeaders: access ? { Authorization: `Bearer ${access}` } : undefined,
        });
        const document = await loadingTask.promise;
        if (cancelled) {
          await document.destroy();
          return;
        }
        setPdfDoc(document);
        setPageCount(document.numPages);
      } catch {
        if (!cancelled) {
          setError("Unable to open this PDF in the protected viewer.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (url) {
      loadPdf();
    }

    return () => {
      cancelled = true;
      if (loadingTask) {
        loadingTask.destroy();
      }
    };
  }, [url]);

  useEffect(() => {
    if (!pdfDoc || !pageCount) {
      return undefined;
    }

    let resizeTimer = 0;
    const renderPages = async () => {
      const runId = renderRunRef.current + 1;
      renderRunRef.current = runId;
      const containerWidth = Math.max(260, Math.floor(containerRef.current?.clientWidth || 900));
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

      try {
        for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
          if (renderRunRef.current !== runId) {
            return;
          }
          const canvas = canvasRefs.current.get(pageNumber);
          if (!canvas) {
            continue;
          }

          const page = await pdfDoc.getPage(pageNumber);
          const baseViewport = page.getViewport({ scale: 1 });
          const displayWidth = Math.min(containerWidth, baseViewport.width);
          const cssScale = displayWidth / baseViewport.width;
          const renderViewport = page.getViewport({ scale: cssScale * pixelRatio });
          const context = canvas.getContext("2d", { alpha: false });

          canvas.width = Math.floor(renderViewport.width);
          canvas.height = Math.floor(renderViewport.height);
          canvas.style.width = `${Math.floor(baseViewport.width * cssScale)}px`;
          canvas.style.height = `${Math.floor(baseViewport.height * cssScale)}px`;

          await page.render({ canvasContext: context, viewport: renderViewport }).promise;
        }
      } catch {
        if (renderRunRef.current === runId) {
          setError("Unable to render this PDF.");
        }
      }
    };

    const scheduleRender = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(renderPages, 120);
    };

    scheduleRender();
    window.addEventListener("resize", scheduleRender);

    return () => {
      renderRunRef.current += 1;
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", scheduleRender);
    };
  }, [pdfDoc, pageCount]);

  useEffect(
    () => () => {
      if (pdfDoc) {
        pdfDoc.destroy();
      }
    },
    [pdfDoc],
  );

  return (
    <div className="lesson-pdf-renderer" ref={containerRef}>
      {loading ? <LoadingSpinner label="Opening document..." /> : null}
      {error ? (
        <div className="lesson-pdf-error" role="alert">
          <HiOutlineDocumentText />
          <p>{error}</p>
        </div>
      ) : null}
      {!loading && !error
        ? Array.from({ length: pageCount }, (_, index) => {
            const pageNumber = index + 1;
            return (
              <canvas
                key={`${name}-${pageNumber}`}
                className="lesson-pdf-canvas"
                ref={(node) => {
                  if (node) {
                    canvasRefs.current.set(pageNumber, node);
                  } else {
                    canvasRefs.current.delete(pageNumber);
                  }
                }}
              />
            );
          })
        : null}
    </div>
  );
}

export default function LessonPlayer() {
  const { courseId, moduleId, lessonId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [lesson, setLesson] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [, setMaxWatchedPercent] = useState(0);
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
  const pdfViewerUrl = pdfUrl ? `${API_BASE_URL}/courses/lms/lessons/${lessonId}/pdf/` : "";
  const videoViewerUrl = videoUrl ? `${API_BASE_URL}/courses/lms/lessons/${lessonId}/video/` : "";
  const thumbnailViewerUrl = lesson?.thumbnail_url ? `${API_BASE_URL}/courses/lms/lessons/${lessonId}/thumbnail/` : "";
  const pdfName = `${String(lesson?.title || `Module ${moduleId} - Lesson ${lessonId}`).trim()}.pdf`;
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
                  src={videoViewerUrl}
                  poster={thumbnailViewerUrl || undefined}
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
            <LessonPdfViewer name={pdfName} url={pdfViewerUrl} />
          </section>
        ) : null}
      </section>
    </MainLayout>
  );
}
