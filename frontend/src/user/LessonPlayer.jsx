import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  HiOutlineArrowLeft,
  HiOutlineArrowsPointingIn,
  HiOutlineArrowsPointingOut,
  HiOutlineBackward,
  HiOutlineDocumentArrowDown,
  HiOutlineDocumentText,
  HiOutlineForward,
  HiOutlineMagnifyingGlassMinus,
  HiOutlineMagnifyingGlassPlus,
  HiOutlinePause,
  HiOutlinePlayCircle,
  HiOutlinePlay,
  HiOutlineSpeakerWave,
  HiOutlineSpeakerXMark,
  HiOutlineViewColumns,
  HiOutlineTrash,
  HiOutlineClipboard,
  HiOutlineListBullet,
} from "react-icons/hi2";
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
const VIDEO_SKIP_SECONDS = 10;
const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 2];

function formatVideoTime(value) {
  const totalSeconds = Math.max(0, Math.floor(Number(value) || 0));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function LessonPdfViewer({ name, url }) {
  const containerRef = useRef(null);
  const canvasRefs = useRef(new Map());
  const renderRunRef = useRef(0);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    let cancelled = false;
    let loadingTask = null;

    const loadPdf = async () => {
      setLoading(true);
      setError("");
      setPdfDoc(null);
      setPageCount(0);
      setZoom(1);
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
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 4);

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
          const cssScale = (displayWidth / baseViewport.width) * zoom;
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
  }, [pdfDoc, pageCount, zoom]);

  useEffect(
    () => () => {
      if (pdfDoc) {
        pdfDoc.destroy();
      }
    },
    [pdfDoc],
  );

  return (
    <div className="lesson-pdf-renderer">
      <div className="lesson-pdf-toolbar">
        <button
          type="button"
          className="btn btn-muted btn-icon"
          onClick={() => setZoom((currentZoom) => Math.max(0.75, Number((currentZoom - 0.25).toFixed(2))))}
          disabled={zoom <= 0.75}
          aria-label="Zoom out"
          title="Zoom out"
        >
          <HiOutlineMagnifyingGlassMinus />
        </button>
        <span>{Math.round(zoom * 100)}%</span>
        <button
          type="button"
          className="btn btn-muted btn-icon"
          onClick={() => setZoom((currentZoom) => Math.min(2.5, Number((currentZoom + 0.25).toFixed(2))))}
          disabled={zoom >= 2.5}
          aria-label="Zoom in"
          title="Zoom in"
        >
          <HiOutlineMagnifyingGlassPlus />
        </button>
      </div>
      <div className="lesson-pdf-pages" ref={containerRef}>
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
    </div>
  );
}

export default function LessonPlayer() {
  const { courseId, moduleId, lessonId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const playerRef = useRef(null);
  const videoRef = useRef(null);
  const pendingVideoResumeRef = useRef(null);
  const refreshingVideoTokenRef = useRef(false);
  const videoRecoveryAttemptsRef = useRef(0);
  const controlsHideTimerRef = useRef(0);
  const [lesson, setLesson] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [, setMaxWatchedPercent] = useState(0);
  const [isAutoCompleted, setIsAutoCompleted] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [videoLoading, setVideoLoading] = useState(false);

  const videoUrl = String(lesson?.video_url || "").trim();
  const pdfUrl = String(lesson?.pdf_url || "").trim();
  const mediaToken = String(lesson?.media_token || "");
  const mediaTokenQuery = mediaToken ? `?token=${encodeURIComponent(mediaToken)}` : "";
  const pdfViewerUrl = pdfUrl ? `${API_BASE_URL}/courses/lms/lessons/${lessonId}/pdf/` : "";
  const videoViewerUrl = videoUrl && mediaTokenQuery ? `${API_BASE_URL}/courses/lms/lessons/${lessonId}/video/${mediaTokenQuery}` : "";
  const thumbnailViewerUrl =
    lesson?.thumbnail_url && mediaTokenQuery ? `${API_BASE_URL}/courses/lms/lessons/${lessonId}/thumbnail/${mediaTokenQuery}` : "";
  const pdfName = `${String(lesson?.title || `Module ${moduleId} - Lesson ${lessonId}`).trim()}.pdf`;

  // Reset video loading state when lesson details or video URL change
  useEffect(() => {
    if (videoUrl && videoViewerUrl) {
      setVideoLoading(true);
    } else {
      setVideoLoading(false);
    }
  }, [lessonId, videoUrl, videoViewerUrl]);

  // Sticky Notes States
  const [showNotes, setShowNotes] = useState(true);
  const [hasText, setHasText] = useState(false);
  const [showListMenu, setShowListMenu] = useState(false);
  const editorRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const dropdownRef = useRef(null);

  // Refs for tracking changes synchronously to avoid race conditions on page load/navigation
  const latestHtmlRef = useRef("");
  const hasPendingChangesRef = useRef(false);
  const lessonIdRef = useRef(lessonId);

  const WATCH_THRESHOLD_PERCENT = 80;

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowListMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Save pending changes synchronously
  const savePendingChanges = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    if (hasPendingChangesRef.current) {
      try {
        const { user } = getStoredAuth();
        const targetLessonId = lessonIdRef.current;
        if (targetLessonId) {
          const storageKey = `sia_edu_lesson_notes_html_${user?.id || "guest"}_${targetLessonId}`;
          localStorage.setItem(storageKey, latestHtmlRef.current);
        }
      } catch {
        // Ignore local storage errors
      }
      hasPendingChangesRef.current = false;
    }
  };

  // Sync lessonIdRef and save pending changes of previous lesson on lesson navigation or unmount
  useEffect(() => {
    return () => {
      savePendingChanges();
    };
  }, [lessonId]);

  // Load Saved Notes HTML
  useEffect(() => {
    if (!lessonId) return;
    try {
      const { user } = getStoredAuth();
      const storageKey = `sia_edu_lesson_notes_html_${user?.id || "guest"}_${lessonId}`;
      const saved = localStorage.getItem(storageKey) || "";
      if (editorRef.current) {
        editorRef.current.innerHTML = saved;
      }
      setHasText(!!editorRef.current?.innerText?.trim());
      latestHtmlRef.current = saved;
      hasPendingChangesRef.current = false;
      lessonIdRef.current = lessonId;
    } catch {
      // Ignore local storage errors
    }
  }, [lessonId, loading]);

  const handleInput = () => {
    const htmlVal = editorRef.current?.innerHTML || "";
    const textVal = editorRef.current?.innerText || "";
    setHasText(!!textVal.trim());

    latestHtmlRef.current = htmlVal;
    hasPendingChangesRef.current = true;
    lessonIdRef.current = lessonId;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      savePendingChanges();
    }, 600);
  };

  const applyFormat = (command, value = null) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    handleInput();
  };

  const copyNotesToClipboard = async () => {
    const plainText = editorRef.current?.innerText || "";
    if (!plainText.trim()) {
      addToast({ type: "info", message: "Brain Dump is empty." });
      return;
    }
    try {
      await navigator.clipboard.writeText(plainText);
      addToast({ type: "success", message: "Copied to clipboard!" });
    } catch {
      addToast({ type: "error", message: "Failed to copy notes." });
    }
  };

  const clearNotes = () => {
    const plainText = editorRef.current?.innerText || "";
    if (!plainText.trim()) return;
    if (window.confirm("Are you sure you want to clear your notes for this lesson? This cannot be undone.")) {
      if (editorRef.current) {
        editorRef.current.innerHTML = "";
      }
      setHasText(false);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      latestHtmlRef.current = "";
      hasPendingChangesRef.current = false;
      try {
        const { user } = getStoredAuth();
        const storageKey = `sia_edu_lesson_notes_html_${user?.id || "guest"}_${lessonId}`;
        localStorage.removeItem(storageKey);
        addToast({ type: "success", message: "Brain Dump cleared." });
      } catch {
        // Ignore errors
      }
    }
  };

  const loadLesson = useCallback(async () => {
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
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);
      videoRecoveryAttemptsRef.current = 0;
    } catch {
      addToast({ type: "error", message: "Unable to load lesson details." });
    } finally {
      setLoading(false);
    }
  }, [lessonId, courseId, addToast]);

  useEffect(() => {
    loadLesson();
  }, [lessonId, loadLesson]);

  const allLessons = (overview?.modules || []).flatMap((module) =>
    (module.lessons || []).map((item) => ({ ...item, module_number: module.module_number })),
  );
  const lessonIndex = allLessons.findIndex((item) => String(item.id) === String(lessonId));
  const previousLesson = lessonIndex > 0 ? allLessons[lessonIndex - 1] : null;
  const nextLesson = lessonIndex >= 0 && lessonIndex < allLessons.length - 1 ? allLessons[lessonIndex + 1] : null;
  const isPlayableLesson = (item) =>
    Boolean(item && Number.isInteger(Number(item.id)) && Number(item.id) > 0 && item.is_unlocked);
  const previousEnabled = isPlayableLesson(previousLesson);
  const nextEnabled = isPlayableLesson(nextLesson);
  const lessonSectionLabel = Number(lesson?.module_number) === 9 ? "Projects" : `Module ${lesson?.module_number}`;
  const isProjectLesson = Number(lesson?.module_number) === 9;

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
    setCurrentTime(nextCurrentTime);
    if (Number.isFinite(nextDuration) && nextDuration > 0) {
      setDuration(nextDuration);
    }
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

  const handleVideoLoadedMetadata = (event) => {
    const media = event.currentTarget;
    const nextDuration = Number(media.duration || 0);
    setDuration(Number.isFinite(nextDuration) ? nextDuration : 0);
    media.volume = volume;
    media.muted = isMuted;
    media.playbackRate = playbackRate;

    const pendingResume = pendingVideoResumeRef.current;
    if (!pendingResume) {
      return;
    }

    pendingVideoResumeRef.current = null;
    const resumeTime = Number(pendingResume.time || 0);
    if (Number.isFinite(resumeTime) && resumeTime > 0 && (!Number.isFinite(nextDuration) || nextDuration <= 0 || resumeTime < nextDuration)) {
      media.currentTime = resumeTime;
      setCurrentTime(resumeTime);
    }
    if (pendingResume.shouldResume) {
      media.play().catch(() => {
        // Browser autoplay policies can block resume until the learner presses play.
      });
    }
  };

  const handleVideoError = async (event) => {
    if (refreshingVideoTokenRef.current || videoRecoveryAttemptsRef.current >= 2) {
      addToast({ type: "error", message: "Video playback stopped. Please reload the lesson and try again." });
      return;
    }

    const media = event.currentTarget;
    pendingVideoResumeRef.current = {
      time: Number(media.currentTime || 0),
      shouldResume: Boolean(!media.paused && !media.ended),
    };
    refreshingVideoTokenRef.current = true;
    videoRecoveryAttemptsRef.current += 1;

    try {
      const response = await courseService.getLessonDetail(lessonId);
      setLesson(response.data);
    } catch {
      pendingVideoResumeRef.current = null;
      addToast({ type: "error", message: "Unable to refresh video access. Please reload the lesson." });
    } finally {
      refreshingVideoTokenRef.current = false;
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const nextIsFullscreen = Boolean(document.fullscreenElement);
      setIsFullscreen(nextIsFullscreen);
      setControlsVisible(true);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const revealFullscreenControls = useCallback(() => {
    window.clearTimeout(controlsHideTimerRef.current);
    setControlsVisible(true);

    if (document.fullscreenElement && !videoRef.current?.paused && !videoRef.current?.ended) {
      controlsHideTimerRef.current = window.setTimeout(() => {
        setControlsVisible(false);
      }, 2500);
    }
  }, []);

  useEffect(() => {
    window.clearTimeout(controlsHideTimerRef.current);
    if (!isFullscreen || !isPlaying) {
      setControlsVisible(true);
      return undefined;
    }

    setControlsVisible(true);
    controlsHideTimerRef.current = window.setTimeout(() => {
      setControlsVisible(false);
    }, 2500);

    return () => window.clearTimeout(controlsHideTimerRef.current);
  }, [isFullscreen, isPlaying]);

  const togglePlay = () => {
    const media = videoRef.current;
    if (!media) {
      return;
    }
    if (media.paused || media.ended) {
      media.play().catch(() => {
        addToast({ type: "error", message: "Unable to start video playback." });
      });
    } else {
      media.pause();
    }
  };

  const seekTo = (nextTime) => {
    const media = videoRef.current;
    if (!media) {
      return;
    }
    const safeDuration = Number(media.duration || duration || 0);
    const clampedTime = Math.min(Math.max(Number(nextTime) || 0, 0), safeDuration || Number(nextTime) || 0);
    media.currentTime = clampedTime;
    setCurrentTime(clampedTime);
  };

  const skipBy = (seconds) => {
    seekTo((videoRef.current?.currentTime || currentTime) + seconds);
  };

  const handleVolumeChange = (event) => {
    const nextVolume = Number(event.target.value);
    const safeVolume = Math.min(Math.max(Number.isFinite(nextVolume) ? nextVolume : 1, 0), 1);
    setVolume(safeVolume);
    setIsMuted(safeVolume === 0);
    if (videoRef.current) {
      videoRef.current.volume = safeVolume;
      videoRef.current.muted = safeVolume === 0;
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
  };

  const handlePlaybackRateChange = (event) => {
    const nextRate = Number(event.target.value);
    setPlaybackRate(nextRate);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextRate;
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (playerRef.current?.requestFullscreen) {
        await playerRef.current.requestFullscreen();
      }
    } catch {
      addToast({ type: "error", message: "Fullscreen is not available in this browser." });
    }
  };

  useEffect(() => {
    if (!videoUrl || !videoViewerUrl || showPdfViewer) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      const target = event.target;
      const tagName = String(target?.tagName || "").toLowerCase();
      const isTypingTarget =
        ["input", "textarea", "select", "button"].includes(tagName) || Boolean(target?.isContentEditable);
      if (isTypingTarget || event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        revealFullscreenControls();
        togglePlay();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        revealFullscreenControls();
        skipBy(-VIDEO_SKIP_SECONDS);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        revealFullscreenControls();
        skipBy(VIDEO_SKIP_SECONDS);
      } else if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        revealFullscreenControls();
        toggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [videoUrl, videoViewerUrl, showPdfViewer, currentTime, duration, isPlaying, addToast, revealFullscreenControls]);

  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  const downloadProjectPdf = async () => {
    if (!lesson?.id || !isProjectLesson || downloadingPdf) {
      return;
    }

    setDownloadingPdf(true);
    try {
      const response = await courseService.downloadLessonPdf(lesson.id);
      const blob = new Blob([response.data], { type: response.headers?.["content-type"] || "application/pdf" });
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = pdfName.replace(/[\\/:*?"<>|]+/g, "-");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch {
      addToast({ type: "error", message: "Unable to download this project PDF." });
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <MainLayout>
      <section className="lesson-shell">
        <div className="lesson-topbar">
          <Link to={`/user/lms/${courseId}`} className="btn btn-muted btn-icon">
            <HiOutlineArrowLeft />
            Back to LMS
          </Link>
          {lesson ? (
            <button
              type="button"
              className={`btn ${showNotes ? "btn-muted" : "btn-primary"} btn-icon toggle-notes-btn`}
              onClick={() => setShowNotes(!showNotes)}
              style={{ marginLeft: "auto" }}
            >
              💡 {showNotes ? "Hide Brain Dump" : "Show Brain Dump"}
            </button>
          ) : null}
        </div>

        {loading ? <LoadingSpinner label="Loading lesson..." /> : null}
        {!loading && lesson ? (
          <div className="lesson-layout-container">
            <article className="lesson-card">
              <p className="lms-kicker">Lesson Player</p>
              <p className="lesson-breadcrumb">
                {`${lessonSectionLabel} > Lesson ${lesson.lesson_number} > ${videoUrl ? "Video" : "Document"}`}
              </p>
              <h1>{lesson.title || `Module ${moduleId} - Lesson ${lessonId}`}</h1>
              <p className="lesson-description">
                {lesson.description || "Watch this lesson to complete it and unlock the next lesson."}
              </p>

            {videoUrl && videoViewerUrl ? (
              <div
                className={`lesson-video-wrap custom-video-player${isTheaterMode ? " is-theater" : ""}${isFullscreen && isPlaying && !controlsVisible ? " controls-hidden" : ""}`}
                ref={playerRef}
                onMouseMove={revealFullscreenControls}
                onMouseDown={revealFullscreenControls}
                onTouchStart={revealFullscreenControls}
              >
                <video
                  ref={videoRef}
                  controlsList="nodownload"
                  preload="metadata"
                  className="lesson-video"
                  src={videoViewerUrl}
                  poster={thumbnailViewerUrl || undefined}
                  onContextMenu={(event) => event.preventDefault()}
                  onClick={togglePlay}
                  onLoadedMetadata={handleVideoLoadedMetadata}
                  onTimeUpdate={handleTimeUpdate}
                  onPlay={() => {
                    setIsPlaying(true);
                    revealFullscreenControls();
                  }}
                  onPause={() => {
                    setIsPlaying(false);
                    setControlsVisible(true);
                  }}
                  onEnded={() => setIsPlaying(false)}
                  onError={handleVideoError}
                >
                  Your browser does not support the video tag.
                </video>
                <div className="custom-video-controls">
                  <div className="custom-video-progress-row">
                    <input
                      type="range"
                      min="0"
                      max={duration || 0}
                      step="0.1"
                      value={duration ? currentTime : 0}
                      onChange={(event) => seekTo(event.target.value)}
                      className="custom-video-progress"
                      style={{ "--video-progress": `${progressPercent}%` }}
                      aria-label="Video progress"
                    />
                  </div>
                  <div className="custom-video-toolbar">
                    <div className="custom-video-control-group">
                      <button type="button" className="custom-video-btn" onClick={togglePlay} aria-label={isPlaying ? "Pause" : "Play"} title={isPlaying ? "Pause" : "Play"}>
                        {isPlaying ? <HiOutlinePause /> : <HiOutlinePlay />}
                      </button>
                      <button type="button" className="custom-video-btn" onClick={() => skipBy(-VIDEO_SKIP_SECONDS)} aria-label="Back 10 seconds" title="Back 10 seconds">
                        <HiOutlineBackward />
                      </button>
                      <button type="button" className="custom-video-btn" onClick={() => skipBy(VIDEO_SKIP_SECONDS)} aria-label="Forward 10 seconds" title="Forward 10 seconds">
                        <HiOutlineForward />
                      </button>
                      <span className="custom-video-time">
                        {formatVideoTime(currentTime)} / {formatVideoTime(duration)}
                      </span>
                    </div>
                    <div className="custom-video-control-group">
                      <button type="button" className="custom-video-btn" onClick={toggleMute} aria-label={isMuted ? "Unmute" : "Mute"} title={isMuted ? "Unmute" : "Mute"}>
                        {isMuted || volume === 0 ? <HiOutlineSpeakerXMark /> : <HiOutlineSpeakerWave />}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="custom-video-volume"
                        aria-label="Volume"
                      />
                      <select className="custom-video-speed" value={playbackRate} onChange={handlePlaybackRateChange} aria-label="Playback speed">
                        {PLAYBACK_RATES.map((rate) => (
                          <option key={rate} value={rate}>
                            {rate}x
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className={`custom-video-btn${isTheaterMode ? " is-active" : ""}`}
                        onClick={() => setIsTheaterMode((value) => !value)}
                        aria-label="Toggle theater mode"
                        title="Theater mode"
                      >
                        <HiOutlineViewColumns />
                      </button>
                      <button type="button" className="custom-video-btn" onClick={toggleFullscreen} aria-label="Toggle fullscreen" title="Fullscreen">
                        {isFullscreen ? <HiOutlineArrowsPointingIn /> : <HiOutlineArrowsPointingOut />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : videoUrl ? (
              <div className="lesson-video-placeholder">
                <HiOutlinePlayCircle />
                <p>Loading protected video...</p>
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
                  <div className="lesson-pdf-actions">
                    <button type="button" className="btn btn-muted lesson-pdf-view" onClick={() => setShowPdfViewer(true)}>
                      View
                    </button>
                    {isProjectLesson ? (
                      <button type="button" className="btn btn-primary lesson-pdf-view" onClick={downloadProjectPdf} disabled={downloadingPdf}>
                        <HiOutlineDocumentArrowDown />
                        {downloadingPdf ? "Downloading..." : "Download"}
                      </button>
                    ) : null}
                  </div>
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

            <aside className={`lesson-sticky-note ${showNotes ? "open" : "closed"}`}>
              <div className="sticky-note-header">
                <div className="sticky-note-title">
                  <span className="note-emoji">🧠</span>
                  <span>Brain Dump</span>
                </div>
                <span className="sticky-note-autosave-label">Auto-saved</span>
              </div>

              <div className="sticky-note-toolbar">
                <button
                  type="button"
                  className="toolbar-btn bold-btn"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applyFormat("bold");
                  }}
                  title="Bold"
                >
                  B
                </button>
                <button
                  type="button"
                  className="toolbar-btn underline-btn"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applyFormat("underline");
                  }}
                  title="Underline"
                >
                  U
                </button>

                {/* List Options Dropdown */}
                <div className="toolbar-dropdown-container" ref={dropdownRef}>
                  <button
                    type="button"
                    className={`toolbar-btn btn-icon ${showListMenu ? "active" : ""}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setShowListMenu(!showListMenu);
                    }}
                    title="List Options"
                  >
                    <HiOutlineListBullet />
                  </button>
                  {showListMenu && (
                    <div className="toolbar-dropdown-menu">
                      <button
                        type="button"
                        className="dropdown-item"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          applyFormat("insertUnorderedList");
                          setShowListMenu(false);
                        }}
                      >
                        • Bullet List
                      </button>
                      <button
                        type="button"
                        className="dropdown-item"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          applyFormat("insertOrderedList");
                          setShowListMenu(false);
                        }}
                      >
                        1. Numbered List
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="sticky-note-body">
                <div
                  ref={editorRef}
                  contentEditable
                  className="sticky-note-editor"
                  onInput={handleInput}
                  onBlur={() => savePendingChanges()}
                  data-placeholder="Jot down quick ideas, key formulas, or doubts..."
                />
              </div>
              <div className="sticky-note-footer">
                <button
                  type="button"
                  className="btn btn-muted btn-small note-action-btn btn-icon"
                  onClick={copyNotesToClipboard}
                  title="Copy Notes to Clipboard"
                >
                  <HiOutlineClipboard /> Copy
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-small note-action-btn btn-icon"
                  onClick={clearNotes}
                  title="Clear Notes"
                  disabled={!hasText}
                >
                  <HiOutlineTrash /> Clear
                </button>
              </div>
            </aside>
          </div>
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
