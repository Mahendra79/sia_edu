import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  HiOutlineBookOpen,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineDocumentText,
  HiOutlineHandThumbDown,
  HiOutlineHandThumbUp,
  HiOutlinePlayCircle,
  HiOutlineShoppingBag,
  HiOutlineSparkles,
  HiOutlineUserCircle,
} from "react-icons/hi2";
import { FaStar } from "react-icons/fa";

import LoadingSpinner from "../components/LoadingSpinner";
import PageTransition from "../components/PageTransition";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import MainLayout from "../layouts/MainLayout";
import { API_BASE_URL } from "../services/api";
import { courseService } from "../services/courseService";
import { formatCurrency, formatDate } from "../utils/format";
import "./CourseDetails.css";

const DESCRIPTION_PREVIEW_LIMIT = 620;

const DEFAULT_LEARN = [
  "Build strong conceptual clarity across AI-first engineering workflows.",
  "Apply model-driven methods to practical datasets and project scenarios.",
  "Document experiments, metrics, and decisions using industry-ready templates.",
  "Deliver a skill-focused capstone aligned to professional problem-solving.",
];

const DEFAULT_REQUIREMENTS = [
  "A laptop with stable internet and Python environment access.",
  "Basic programming comfort and willingness to practice consistently.",
  "Interest in AI, data, and practical technical problem solving.",
];

const DEFAULT_CURRICULUM = [
  "Module 1: Foundations, notation, and problem framing",
  "Module 2: Applied implementation with guided labs",
  "Module 3: Evaluation, optimization, and reliability checks",
  "Module 4: Capstone delivery and skill assessment",
];

const COURSE_INCLUDES = [
  "Text-based video preview placeholder (no player yet)",
  "Skill-mapped module notes and downloadable checkpoints",
  "Hands-on labs and mini assignments for each module",
  "Assessment-friendly revision sheets",
  "24x7 SIA_Chat support trained for education courses",
  "Completion certificate placeholder",
];

const RATING_LABELS = {
  1: "Unhappy",
  2: "Needs Improvement",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};

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

function ReviewAvatar({ userAvatar, userName }) {
  const [imageFailed, setImageFailed] = useState(false);
  const avatarUrl = resolveCourseImageUrl(userAvatar);

  if (!avatarUrl || imageFailed) {
    return <HiOutlineUserCircle />;
  }

  return (
    <img
      src={avatarUrl}
      alt={`${userName || "Learner"} avatar`}
      className="review-avatar-image"
      onError={() => setImageFailed(true)}
    />
  );
}

export default function CourseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { addToast } = useToast();

  const [course, setCourse] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [relatedCourses, setRelatedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: "5", comment: "" });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewVoteLoading, setReviewVoteLoading] = useState({});

  const loadCourseDetails = useCallback(async () => {
    setLoading(true);
    setError("");
    setDescriptionExpanded(false);

    try {
      const detailResponse = await courseService.getCourse(id);
      const courseData = detailResponse.data;
      setCourse(courseData);

      const [reviewsResponse, related] = await Promise.all([
        courseService.getReviews(id, { page: 1, page_size: 10 }).catch(() => ({ data: { results: [] } })),
        courseService.getRelatedCourses(courseData.id, courseData.category?.id, 6).catch(() => []),
      ]);
      const reviewPayload = reviewsResponse?.data;
      const reviewResults = Array.isArray(reviewPayload?.results)
        ? reviewPayload.results
        : Array.isArray(reviewPayload)
          ? reviewPayload
          : [];
      setReviews(reviewResults);
      setRelatedCourses(Array.isArray(related) ? related : []);
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

  const reviewSummary = useMemo(() => {
    if (reviews.length > 0) {
      const total = reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0);
      return {
        average: total / reviews.length,
        count: reviews.length,
      };
    }
    return {
      average: Number(course?.average_rating || 0),
      count: Number(course?.review_count || 0),
    };
  }, [reviews, course]);

  const listPrice = Number(course?.price || 0);
  const discountPercent = Number(course?.discount_percent || 0);
  const discountedPrice = Number(course?.discounted_price ?? listPrice);
  const hasDiscount = discountPercent > 0;
  const isPurchased = Boolean(course?.is_purchased);
  const canReview = Boolean(course?.can_review);
  const description = String(course?.description || "");
  const previewDescription = parseDescriptionPreview(description, descriptionExpanded);
  const canToggleDescription = description.length > DESCRIPTION_PREVIEW_LIMIT;

  const learningOutcomes = useMemo(() => {
    const extracted = extractSectionBullets(description, ["What you'll learn", "What you will learn", "Learning outcomes"]);
    return extracted.length > 0 ? extracted : DEFAULT_LEARN;
  }, [description]);

  const requirements = useMemo(() => {
    const extracted = extractSectionBullets(description, ["Requirements", "Prerequisites"]);
    return extracted.length > 0 ? extracted : DEFAULT_REQUIREMENTS;
  }, [description]);

  const curriculum = useMemo(() => {
    const extracted = extractSectionBullets(description, ["Course content", "Curriculum"], 10);
    return extracted.length > 0 ? extracted : DEFAULT_CURRICULUM;
  }, [description]);

  const topicTags = useMemo(() => deriveTags(course, description), [course, description]);
  const courseDurationDays = useMemo(() => deriveDurationDays(course, description), [course, description]);
  const reviewRatingValue = Number(reviewForm.rating || 0);

  const frequentlyBoughtTogether = useMemo(() => {
    if (!course || relatedCourses.length === 0) {
      return [];
    }
    return relatedCourses.slice(0, 3).map((related, index) => ({
      id: related.id,
      text: `${course.title} + ${related.title}`,
      note: `${12 + index * 4}% bundle-style savings suggestion`,
    }));
  }, [course, relatedCourses]);

  const mentorName = course?.mentor_name || "Mentor details will be updated soon";
  const mentorTitle = course?.mentor_title || "Instructor";
  const mentorBio =
    course?.mentor_bio ||
    "This instructor profile is being refreshed. Course mentorship information will appear here shortly.";

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

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    if (!course || !canReview) {
      return;
    }

    setReviewSubmitting(true);
    try {
      await courseService.createReview(course.id, {
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment.trim(),
      });
      const refreshedReviews = await courseService.getReviews(course.id, { page: 1, page_size: 10 });
      const refreshedPayload = refreshedReviews?.data;
      const refreshedResults = Array.isArray(refreshedPayload?.results)
        ? refreshedPayload.results
        : Array.isArray(refreshedPayload)
          ? refreshedPayload
          : [];
      setReviews(refreshedResults);
      setReviewForm((previous) => ({ ...previous, comment: "" }));
      addToast({ type: "success", message: "Your review has been saved." });
    } catch (requestError) {
      const message = requestError?.response?.data?.detail || "Unable to submit review.";
      addToast({ type: "error", message });
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleReviewVote = async (reviewId, voteType) => {
    if (!isAuthenticated) {
      addToast({ type: "warning", message: "Please login to vote on reviews." });
      navigate("/login");
      return;
    }

    setReviewVoteLoading((previous) => ({ ...previous, [reviewId]: true }));
    try {
      const response = await courseService.voteReview(reviewId, { vote: voteType });
      const voteData = response?.data || {};

      setReviews((previous) =>
        previous.map((item) => {
          if (item.id !== reviewId) {
            return item;
          }
          return {
            ...item,
            my_vote: voteData.my_vote ?? null,
            helpful_likes_count: Number(voteData.helpful_likes_count ?? 0),
            helpful_dislikes_count: Number(voteData.helpful_dislikes_count ?? 0),
          };
        }),
      );
    } catch (requestError) {
      const message = requestError?.response?.data?.detail || "Unable to save your vote.";
      addToast({ type: "error", message });
    } finally {
      setReviewVoteLoading((previous) => ({ ...previous, [reviewId]: false }));
    }
  };

  return (
    <MainLayout showChatbot>
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
                      <FaStar />
                      {reviewSummary.average.toFixed(1)} rating
                    </span>
                    <span className="meta-pill">{reviewSummary.count} reviews</span>
                    <span className="meta-pill">
                      <HiOutlineUserCircle />
                      {mentorName}
                    </span>
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
                  {hasDiscount ? <span className="pill pill-discount">{discountPercent.toFixed(0)}% OFF</span> : null}
                  {isPurchased ? <span className="pill pill-owned">Purchased</span> : null}
                  <div className="price-row">
                    <strong>{formatCurrency(discountedPrice, "INR")}</strong>
                    {hasDiscount ? <small>{formatCurrency(listPrice, "INR")}</small> : null}
                  </div>
                  <p className="price-note">
                    Secure checkout via billing flow. Guided plan: ~{courseDurationDays} days with 24x7 SIA_Chat support.
                  </p>
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
                    <h2>What you'll learn</h2>
                    <ul className="details-list">
                      {learningOutcomes.map((item) => (
                        <li key={item}>
                          <HiOutlineCheckCircle />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </article>

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
                    <h2>Requirements</h2>
                    <ul className="details-list">
                      {requirements.map((item) => (
                        <li key={item}>
                          <HiOutlineClock />
                          <span>{item}</span>
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
                    <h2>Frequently bought together</h2>
                    {frequentlyBoughtTogether.length > 0 ? (
                      <ul className="bundle-list">
                        {frequentlyBoughtTogether.map((bundle) => (
                          <li key={bundle.id}>
                            <HiOutlineSparkles />
                            <div>
                              <strong>{bundle.text}</strong>
                              <p>{bundle.note}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="empty-state">Related bundle suggestions will appear once similar courses are loaded.</p>
                    )}
                  </article>

                  <article className="course-details-panel">
                    <h2>Mentor / Instructor</h2>
                    <div className="mentor-box">
                      <span className="mentor-avatar">
                        <HiOutlineUserCircle />
                      </span>
                      <div>
                        <h3>{mentorName}</h3>
                        <p className="mentor-title">{mentorTitle}</p>
                        <p className="mentor-bio">{mentorBio}</p>
                      </div>
                    </div>
                  </article>

                  <article className="course-details-panel">
                    <h2>Reviews</h2>
                    {isAuthenticated ? (
                      canReview ? (
                        <form className="review-form" onSubmit={handleReviewSubmit}>
                          <div className="review-form-head">
                            <strong>Write your review</strong>
                            <span>Signed in as {user?.name || user?.username || "Learner"}</span>
                          </div>
                          <div className="review-form-row">
                            <label>
                              Rating
                              <div className="rating-star-input" role="radiogroup" aria-label="Select rating">
                                {[1, 2, 3, 4, 5].map((value) => (
                                  <button
                                    key={value}
                                    type="button"
                                    className={`rating-star-btn ${value <= reviewRatingValue ? "active" : ""}`}
                                    onClick={() =>
                                      setReviewForm((previous) => ({ ...previous, rating: String(value) }))
                                    }
                                    aria-label={`${value} star`}
                                    aria-pressed={value === reviewRatingValue}
                                  >
                                    <FaStar />
                                  </button>
                                ))}
                                <span className="rating-label">
                                  {RATING_LABELS[reviewRatingValue] || "Select rating"}
                                </span>
                              </div>
                            </label>
                            <label className="review-comment-field">
                              Comment
                              <textarea
                                value={reviewForm.comment}
                                onChange={(event) =>
                                  setReviewForm((previous) => ({ ...previous, comment: event.target.value }))
                                }
                                placeholder="Share your genuine learning experience..."
                                maxLength={500}
                              />
                            </label>
                          </div>
                          <button type="submit" className="btn btn-primary" disabled={reviewSubmitting}>
                            {reviewSubmitting ? "Saving..." : "Submit Review"}
                          </button>
                        </form>
                      ) : (
                        <p className="review-access-note">
                          Only students with successful purchase can write reviews.
                        </p>
                      )
                    ) : (
                      <p className="review-access-note">
                        Login and purchase this course to submit a review.
                      </p>
                    )}
                    {reviews.length > 0 ? (
                      <div className="reviews-grid">
                        {reviews.slice(0, 10).map((review) => (
                          <article key={review.id} className="review-card">
                            <div className="review-head">
                              <div className="review-author">
                                <span className="review-avatar">
                                  <ReviewAvatar userAvatar={review.user_avatar} userName={review.user_name} />
                                </span>
                                <div className="review-author-meta">
                                  <strong>{review.user_name || "Learner"}</strong>
                                  <small>{formatDate(review.created_at)}</small>
                                </div>
                              </div>
                              <span className="review-rating">
                                <FaStar />
                                {Number(review.rating || 0).toFixed(1)}
                              </span>
                            </div>
                            <p>{review.comment || "No written comment provided."}</p>
                            <div className="review-helpful">
                              <span>Helpful?</span>
                              <button
                                type="button"
                                className={`review-helpful-btn ${review.my_vote === "like" ? "active" : ""}`}
                                aria-label="Helpful vote up"
                                aria-pressed={review.my_vote === "like"}
                                onClick={() => handleReviewVote(review.id, "like")}
                                disabled={Boolean(reviewVoteLoading[review.id])}
                              >
                                <HiOutlineHandThumbUp />
                                <span>{Number(review.helpful_likes_count || 0)}</span>
                              </button>
                              <button
                                type="button"
                                className={`review-helpful-btn ${review.my_vote === "dislike" ? "active dislike" : ""}`}
                                aria-label="Helpful vote down"
                                aria-pressed={review.my_vote === "dislike"}
                                onClick={() => handleReviewVote(review.id, "dislike")}
                                disabled={Boolean(reviewVoteLoading[review.id])}
                              >
                                <HiOutlineHandThumbDown />
                                <span>{Number(review.helpful_dislikes_count || 0)}</span>
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <p className="empty-state">No reviews yet for this course.</p>
                    )}
                  </article>
                </div>

                <aside className="course-side-column">
                  <article className="course-details-panel">
                    <h2>This course includes</h2>
                    <ul className="details-list compact">
                      {[`Estimated ${courseDurationDays}-day guided path`, ...COURSE_INCLUDES].map((item) => (
                        <li key={item}>
                          <HiOutlineCheckCircle />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </article>

                  <article className="course-details-panel">
                    <h2>Students also bought</h2>
                    {relatedCourses.length > 0 ? (
                      <div className="related-grid">
                        {relatedCourses.map((item) => (
                          <article key={item.id} className="related-card">
                            <h3>{item.title}</h3>
                            <p>{item.short_description}</p>
                            <div className="related-footer">
                              <span>{formatCurrency(item.discounted_price ?? item.price, "INR")}</span>
                              <Link to={`/course/${item.id}`}>View</Link>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <p className="empty-state">No related courses found right now.</p>
                    )}
                  </article>

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

