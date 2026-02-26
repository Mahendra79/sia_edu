import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  HiOutlineBookOpen,
  HiOutlineClock,
  HiOutlineDocumentText,
  HiOutlinePlayCircle,
  HiOutlineShoppingBag,
} from "react-icons/hi2";

import LoadingSpinner from "../components/LoadingSpinner";
import PageTransition from "../components/PageTransition";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import MainLayout from "../layouts/MainLayout";
import { API_BASE_URL } from "../services/api";
import { courseService } from "../services/courseService";
import "./CourseDetails.css";

const DESCRIPTION_PREVIEW_LIMIT = 620;

const DEFAULT_CURRICULUM = [
  "Module 1: Foundations, notation, and problem framing",
  "Module 2: Applied implementation with guided labs",
  "Module 3: Evaluation, optimization, and reliability checks",
  "Module 4: Capstone delivery and skill assessment",
];

const STOP_WORDS = new Set([
  "and",
  "the",
  "for",
  "with",
  "this",
  "that",
  "your",
  "from",
  "into",
  "course",
  "using",
  "build",
  "learn",
  "skills",
  "ready",
]);

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

    if (/^[A-Za-z][A-Za-z0-9\s/&'-]{2,48}:\s*$/.test(line) && !/^[-*•]/.test(line)) {
      break;
    }

    if (/^[-*•]\s+/.test(line)) {
      bullets.push(line.replace(/^[-*•]\s+/, "").trim());
      continue;
    }
    if (/^\d+[.)]\s+/.test(line)) {
      bullets.push(line.replace(/^\d+[.)]\s+/, "").trim());
    }
  }

  return uniqueItems(bullets, max);
}

function deriveTags(course, description) {
  const explicitTags = extractSectionBullets(description, ["Explore related topics", "Related topics"], 10);
  if (explicitTags.length > 0) {
    return explicitTags;
  }

  const categoryTag = course?.category?.name ? [course.category.name] : [];
  const words = `${course?.title || ""} ${course?.short_description || ""}`
    .split(/[^A-Za-z0-9+.#]+/)
    .map((item) => item.trim())
    .filter(
      (item) =>
        item.length >= 4 &&
        !STOP_WORDS.has(item.toLowerCase()) &&
        !/^\d+$/.test(item),
    );
  return uniqueItems([...categoryTag, ...words], 8);
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

function deriveDurationDays(course, description) {
  const direct = Number(course?.duration_days || 0);
  if (direct > 0) {
    return direct;
  }
  const match = String(description || "").match(/(\d{1,3})\s*days?/i);
  if (match?.[1]) {
    const fromText = Number(match[1]);
    if (fromText > 0) {
      return fromText;
    }
  }
  return 30;
}

function formatRupees(value) {
  const rounded = Math.max(0, Math.round(Number(value) || 0));
  return `₹${rounded.toLocaleString("en-IN")}`;
}

function calculatePriceSummary(listPrice, discountPercent) {
  const normalizedPrice = Math.max(0, Number(listPrice) || 0);
  const normalizedDiscount = Math.min(100, Math.max(0, Number(discountPercent) || 0));
  const discountAmount = Math.round((normalizedPrice * normalizedDiscount) / 100);
  const finalPrice = Math.max(0, Math.round(normalizedPrice - discountAmount));

  return {
    listPrice: Math.round(normalizedPrice),
    discountPercent: Math.round(normalizedDiscount),
    discountAmount,
    finalPrice,
    hasDiscount: normalizedDiscount > 0,
  };
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

  const loadCourseDetails = useCallback(async () => {
    setLoading(true);
    setError("");
    setDescriptionExpanded(false);

    try {
      const detailResponse = await courseService.getCourse(id);
      setCourse(detailResponse.data);
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

  const priceSummary = useMemo(
    () => calculatePriceSummary(course?.price, course?.discount_percent),
    [course?.price, course?.discount_percent],
  );
  const isPurchased = Boolean(course?.is_purchased);
  const description = String(course?.description || "");
  const previewDescription = parseDescriptionPreview(description, descriptionExpanded);
  const canToggleDescription = description.length > DESCRIPTION_PREVIEW_LIMIT;

  const curriculum = useMemo(() => {
    const extracted = extractSectionBullets(description, ["Course content", "Curriculum"], 10);
    return extracted.length > 0 ? extracted : DEFAULT_CURRICULUM;
  }, [description]);

  const topicTags = useMemo(() => deriveTags(course, description), [course, description]);
  const courseDurationDays = useMemo(() => deriveDurationDays(course, description), [course, description]);
  const imageUrl = resolveCourseImageUrl(course?.image);

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
                    <span className="meta-pill">
                      <HiOutlineClock />
                      {courseDurationDays} days
                    </span>
                  </div>
                  <div className="course-hero-image-wrap">
                    {imageUrl ? (
                      <img src={imageUrl} alt={course.title} className="course-hero-image" />
                    ) : (
                      <div className="course-hero-image-placeholder">
                        <HiOutlineBookOpen />
                        <span>SIA Software Innovations Private Limited Course Preview</span>
                      </div>
                    )}
                  </div>
                </article>

                <aside className="course-details-panel course-pricing-card">
                  {priceSummary.hasDiscount ? <span className="pill pill-discount">{priceSummary.discountPercent}% OFF</span> : null}
                  {isPurchased ? <span className="pill pill-owned">Purchased</span> : null}
                  <div className="price-row">
                    <strong>{formatRupees(priceSummary.finalPrice)}</strong>
                    {priceSummary.hasDiscount ? <small>{formatRupees(priceSummary.listPrice)}</small> : null}
                  </div>
                  <p className="price-note">Secure checkout via billing flow. Guided plan: ~{courseDurationDays} days.</p>
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
                    <h2>Explore related topics</h2>
                    <div className="topic-tags">
                      {topicTags.map((tag) => (
                        <span key={tag} className="topic-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </article>

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

                  <article className="course-details-panel">
                    <h2>Price Discount & Final Price</h2>
                    <p className="price-note">We have price discount for this course.</p>
                    <div className="price-breakdown">
                      <div className="price-breakdown-row">
                        <span>Price</span>
                        <strong>{formatRupees(priceSummary.listPrice)}</strong>
                      </div>
                      <div className="price-breakdown-row">
                        <span>Discount</span>
                        <strong>{priceSummary.discountPercent}%</strong>
                      </div>
                      <div className="price-breakdown-row">
                        <span>Discount Amount</span>
                        <strong>{formatRupees(priceSummary.discountAmount)}</strong>
                      </div>
                      <div className="price-breakdown-row total">
                        <span>Final Price</span>
                        <strong>{formatRupees(priceSummary.finalPrice)}</strong>
                      </div>
                    </div>
                  </article>
                </div>

                <aside className="course-side-column">
                  <article className="course-details-panel">
                    <h2>Video section (placeholder)</h2>
                    <p className="video-placeholder">
                      <HiOutlinePlayCircle />
                      Video preview is text-only at this stage. A real video player is intentionally not integrated yet.
                    </p>
                  </article>
                </aside>
              </section>
            </>
          )}
        </section>
      </PageTransition>
    </MainLayout>
  );
}
