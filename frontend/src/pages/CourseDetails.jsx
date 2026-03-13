import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  HiOutlineBookOpen,
  HiOutlineCalendarDays,
  HiOutlineDocumentText,
  HiOutlineShoppingBag,
} from "react-icons/hi2";

import LoadingSpinner from "../components/LoadingSpinner";
import PageTransition from "../components/PageTransition";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import MainLayout from "../layouts/MainLayout";
import { API_BASE_URL } from "../services/api";
import { courseService } from "../services/courseService";
import { getCourseStartLabel } from "../data/featuredCourse";
import "./CourseDetails.css";

const DESCRIPTION_PREVIEW_LIMIT = 620;
const FALLBACK_COURSE_IMAGE_URL =
  "https://pub-1407f82391df4ab1951418d04be76914.r2.dev/uploads/971a437a-f346-4419-ae5a-3f0febd3a494.jpeg";

const DEFAULT_CURRICULUM = [
  "Module 1: Foundations, notation, and problem framing",
  "Module 2: Applied implementation with guided labs",
  "Module 3: Evaluation, optimization, and reliability checks",
  "Module 4: Capstone delivery and skill assessment",
];

const HARD_CODED_LEARNING_OUTCOMES = [
  "Mathematically represent and manipulate quantum states.",
  "Construct and execute multi-qubit quantum circuits.",
  "Analyze quantum measurement distributions and expectation values.",
  "Implement and interpret standard quantum algorithms.",
  "Develop parameterized quantum circuits for optimization problems.",
  "Apply hybrid quantum-classical computational models.",
  "Utilize the HDQS platform for structured experimentation and project development.",
];

const HARD_CODED_CAPSTONE = [
  "Design and implement a structured quantum circuit.",
  "Define a Hamiltonian or optimization objective.",
  "Execute parameter optimization.",
  "Analyze results using measurement statistics.",
  "Submit a formal technical project report.",
];

function resolveCourseImageUrl(imagePath) {
  if (!imagePath) {
    return "";
  }
  if (/^https?:\/\//i.test(imagePath) || imagePath.startsWith("data:")) {
    return imagePath;
  }
  const normalizedPath = String(imagePath).replace(/\\/g, "/");
  const apiOrigin = /^https?:\/\//i.test(API_BASE_URL) ? new URL(API_BASE_URL).origin : window.location.origin;
  return new URL(normalizedPath, `${apiOrigin}/`).toString();
}

function uniqueItems(items, max = 8) {
  const seen = new Set();
  const output = [];
  for (const item of items) {
    const normalized = String(item || "").trim();
    if (!normalized) {
      continue;
    }
    const key = normalized.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    output.push(normalized);
    if (output.length >= max) {
      break;
    }
  }
  return output;
}

function extractSectionBullets(description, headings, max = 8) {
  const lines = String(description || "")
    .split(/\r?\n/)
    .map((line) => line.trim());

  const headingPattern = new RegExp(`^(${headings.join("|")})\\s*:?$`, "i");
  let collecting = false;
  const bullets = [];

  for (const line of lines) {
    if (!line) {
      if (collecting && bullets.length > 0) {
        break;
      }
      continue;
    }

    if (headingPattern.test(line)) {
      collecting = true;
      continue;
    }

    if (!collecting) {
      continue;
    }

    if (/^[A-Za-z][A-Za-z0-9\s/&'-]{2,48}:\s*$/.test(line) && !/^[-*]/.test(line)) {
      break;
    }

    if (/^[-*]\s+/.test(line)) {
      bullets.push(line.replace(/^[-*]\s+/, "").trim());
      continue;
    }
    if (/^\d+[.)]\s+/.test(line)) {
      bullets.push(line.replace(/^\d+[.)]\s+/, "").trim());
    }
  }

  return uniqueItems(bullets, max);
}

function extractModuleLines(description, max = 12) {
  const lines = String(description || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const modules = [];
  for (const line of lines) {
    if (/^module\s+\d+/i.test(line)) {
      modules.push(line.replace(/\s+/g, " ").trim());
      continue;
    }
    if (/^capstone project/i.test(line)) {
      modules.push("Capstone Project");
    }
    if (modules.length >= max) {
      break;
    }
  }
  return uniqueItems(modules, max);
}

function parseDescriptionPreview(text, expanded) {
  const fullText = String(text || "").trim();
  if (!fullText) {
    return "";
  }
  if (expanded || fullText.length <= DESCRIPTION_PREVIEW_LIMIT) {
    return fullText;
  }
  return `${fullText.slice(0, DESCRIPTION_PREVIEW_LIMIT).trim()}...`;
}

export default function CourseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [imageStage, setImageStage] = useState(0);

  const loadCourseDetails = useCallback(async () => {
    setLoading(true);
    setError("");
    setDescriptionExpanded(false);
    setImageStage(0);

    try {
      const detailResponse = await courseService.getCourse(id);
      const apiCourse = detailResponse.data;
      setCourse(apiCourse);
    } catch (requestError) {
      const message = requestError?.response?.data?.detail || "Unable to load course details.";
      setError(message);
      addToast({ type: "error", message });
    } finally {
      setLoading(false);
    }
  }, [id, addToast]);

  useEffect(() => {
    loadCourseDetails();
  }, [loadCourseDetails]);

  const isPurchased = Boolean(course?.is_purchased);
  const description = String(course?.description || "");
  const previewDescription = parseDescriptionPreview(description, descriptionExpanded);
  const canToggleDescription = description.length > DESCRIPTION_PREVIEW_LIMIT;
  const startLabel = getCourseStartLabel(course);
  const durationDays = Number(course?.duration_days || 0);
  const durationWeeks = durationDays > 0 ? Math.round(durationDays / 7) : 0;
  const durationLabel = durationWeeks > 0 ? `${durationWeeks} weeks` : "";

  const curriculum = useMemo(() => {
    const extracted = extractSectionBullets(description, ["Course content", "Curriculum"], 10);
    if (extracted.length > 0) {
      return extracted;
    }
    const moduleLines = extractModuleLines(description, 12);
    return moduleLines.length > 0 ? moduleLines : DEFAULT_CURRICULUM;
  }, [description]);

  const learningOutcomes = HARD_CODED_LEARNING_OUTCOMES;
  const capstone = HARD_CODED_CAPSTONE;

  const imageCandidates = useMemo(() => {
    const primary = resolveCourseImageUrl(course?.image);
    const candidates = [primary, FALLBACK_COURSE_IMAGE_URL].filter(Boolean);
    const unique = [];
    for (const candidate of candidates) {
      if (!unique.includes(candidate)) {
        unique.push(candidate);
      }
    }
    return unique;
  }, [course?.image]);

  const imageUrl = imageCandidates[imageStage] || "";
  const showImage = Boolean(imageUrl);

  const handleBuyCourse = () => {
    if (!course) {
      return;
    }
    if (isPurchased) {
      navigate("/user/my-courses");
      return;
    }
    if (!isAuthenticated) {
      addToast({ type: "warning", message: "Please login first to continue billing." });
      navigate("/login");
      return;
    }
    navigate(`/billing/${course.id}`);
  };

  return (
    <MainLayout>
      <PageTransition>
        <section className="course-details-page">
          {loading ? (
            <LoadingSpinner label="Loading course details..." />
          ) : error || !course ? (
            <article className="course-details-panel course-details-error">
              <h1>Course details unavailable</h1>
              <p>{error || "This course could not be loaded."}</p>
              <div className="course-details-actions">
                <button type="button" className="btn btn-muted" onClick={loadCourseDetails}>
                  Retry
                </button>
                <Link to="/" className="btn btn-primary">
                  Back to Home
                </Link>
              </div>
            </article>
          ) : (
            <>
              <nav className="course-breadcrumb" aria-label="Breadcrumb">
                <Link to="/">Home</Link>
                <span>/</span>
                {course.category?.id ? (
                  <Link
                    to={`/?category=${course.category.id}&categoryName=${encodeURIComponent(course.category.name || "")}`}
                  >
                    {course.category?.name || "Courses"}
                  </Link>
                ) : (
                  <span>{course.category?.name || "Courses"}</span>
                )}
                <span>/</span>
                <span className="current">{course.title}</span>
              </nav>

              <section className="course-hero">
                <article className="course-details-panel course-hero-main">
                  <span className="hero-badge">{course.category?.name || "General"}</span>
                  <h1>{course.title}</h1>
                  <p className="course-subtitle">{course.short_description}</p>
                  <div className="course-hero-meta">
                    {startLabel ? (
                      <span className="meta-pill">
                        <HiOutlineCalendarDays />
                        {startLabel}
                      </span>
                    ) : null}
                    {durationLabel ? (
                      <span className="meta-pill">
                        <HiOutlineCalendarDays />
                        {durationLabel}
                      </span>
                    ) : null}
                  </div>
                  <div className="course-hero-image-wrap">
                    {showImage ? (
                      <img
                        src={imageUrl}
                        alt={course.title}
                        className="course-hero-image"
                        onError={() => setImageStage((stage) => Math.min(stage + 1, imageCandidates.length))}
                      />
                    ) : (
                      <div className="course-hero-image-placeholder">
                        <HiOutlineBookOpen />
                        <span>SIA Software Innovations Private Limited Course Preview</span>
                      </div>
                    )}
                  </div>
                </article>

                <aside className="course-details-panel course-pricing-card">
                  {isPurchased ? <span className="pill pill-owned">Purchased</span> : null}
                  <div className="pricing-kpi">
                    <strong>Program Start</strong>
                    <span>{startLabel || "Start date will be announced soon."}</span>
                  </div>
                  <p className="price-note">Guided learning plan with HDQS platform access.</p>
                  <button
                    type="button"
                    className={`btn btn-icon ${isPurchased ? "btn-muted" : "btn-primary"}`}
                    onClick={handleBuyCourse}
                  >
                    <HiOutlineShoppingBag />
                    {isPurchased ? "Open My Courses" : "Buy This Course"}
                  </button>
                </aside>
              </section>

              <section className="course-body">
                <div className="course-main-column">
                  <article className="course-details-panel">
                    <h2>Course content / curriculum</h2>
                    <ul className="curriculum-list">
                      {curriculum.map((module) => (
                        <li key={module}>
                          <HiOutlineDocumentText />
                          <span>{module}</span>
                        </li>
                      ))}
                    </ul>
                  </article>

                  {learningOutcomes.length > 0 ? (
                    <article className="course-details-panel">
                      <h2>Learning outcomes</h2>
                      <ul className="details-list">
                        {learningOutcomes.map((item) => (
                          <li key={item}>
                            <HiOutlineDocumentText />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </article>
                  ) : null}

                  {capstone.length > 0 ? (
                    <article className="course-details-panel">
                      <h2>Capstone project</h2>
                      <ul className="details-list">
                        {capstone.map((item) => (
                          <li key={item}>
                            <HiOutlineDocumentText />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </article>
                  ) : null}

                  <article className="course-details-panel">
                    <h2>Full description</h2>
                    <p className="long-description">{previewDescription || "Description will be updated soon."}</p>
                    {canToggleDescription ? (
                      <button
                        type="button"
                        className="btn btn-muted"
                        onClick={() => setDescriptionExpanded((previous) => !previous)}
                      >
                        {descriptionExpanded ? "Show less" : "Show more"}
                      </button>
                    ) : null}
                  </article>
                </div>

                <aside className="course-side-column" />
              </section>
            </>
          )}
        </section>
      </PageTransition>
    </MainLayout>
  );
}
