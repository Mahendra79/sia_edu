import { useState } from "react";

import { formatCurrency } from "../utils/format";
import { HiOutlineBookOpen, HiOutlineCalendarDays, HiOutlineShoppingBag } from "react-icons/hi2";
import { API_BASE_URL } from "../services/api";
import { getCourseStartLabel } from "../data/featuredCourse";

function getHighlightedTitle(title, query) {
  const normalizedQuery = String(query || "").trim();
  if (!normalizedQuery) {
    return title;
  }

  const escapedQuery = normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escapedQuery})`, "ig");
  const parts = title.split(regex);
  return parts.map((part, index) =>
    part.toLowerCase() === normalizedQuery.toLowerCase() ? <mark key={`${part}-${index}`}>{part}</mark> : part,
  );
}

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

function resolveDurationDays(course) {
  const direct = Number(course?.duration_days || 0);
  if (direct > 0) {
    return direct;
  }
  const match = String(course?.description || "").match(/(\d{1,3})\s*days?/i);
  return match?.[1] ? Number(match[1]) : null;
}

export default function CourseCard({ course, searchQuery, onBuy, onOpen }) {
  const imageUrl = resolveCourseImageUrl(course.image);
  const discountPercent = Number(course.discount_percent || 0);
  const hasDiscount = discountPercent > 0;
  const listPrice = Number(course.price || 0);
  const discountedPrice = Number(course.discounted_price ?? listPrice);
  const isPurchased = Boolean(course.is_purchased);
  const durationDays = resolveDurationDays(course);
  const startLabel = getCourseStartLabel(course);

  const handleOpen = () => {
    if (typeof onOpen === "function") {
      onOpen(course);
    }
  };

  const handleCardKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleOpen();
    }
  };

  const handleBuy = (event) => {
    event.stopPropagation();
    if (isPurchased) {
      return;
    }
    onBuy(course);
  };

  const handleTitleClick = (event) => {
    event.stopPropagation();
    handleOpen();
  };

  return (
    <article
      className={`course-card ${typeof onOpen === "function" ? "course-card-interactive" : ""}`}
      role={typeof onOpen === "function" ? "link" : undefined}
      tabIndex={typeof onOpen === "function" ? 0 : undefined}
      onClick={typeof onOpen === "function" ? handleOpen : undefined}
      onKeyDown={typeof onOpen === "function" ? handleCardKeyDown : undefined}
    >
      <CourseImage key={imageUrl || "course-image-placeholder"} imageUrl={imageUrl} title={course.title} />
      <div className="course-content">
        <div className="course-tags">
          <span className="pill">{course.category?.name || "General"}</span>
          <span className="pill">{durationDays ? `${durationDays} days` : "TBD"}</span>
          {startLabel ? (
            <span className="pill">
              <HiOutlineCalendarDays />
              {startLabel}
            </span>
          ) : null}
          {hasDiscount && (
            <span className="pill pill-discount">
              {discountPercent.toFixed(0)}% OFF
            </span>
          )}
          {isPurchased && <span className="pill pill-owned">Purchased</span>}
        </div>
        <h3>
          {typeof onOpen === "function" ? (
            <button type="button" className="course-title-trigger" onClick={handleTitleClick}>
              {getHighlightedTitle(course.title, searchQuery)}
            </button>
          ) : (
            getHighlightedTitle(course.title, searchQuery)
          )}
        </h3>
        <p>{course.short_description}</p>
        <div className="course-meta">
          <span className="course-price-stack">
            <strong className="course-price-current">{formatCurrency(discountedPrice, "INR")}</strong>
            {hasDiscount && <small className="course-price-original">{formatCurrency(listPrice, "INR")}</small>}
          </span>
          <button
            type="button"
            className={`btn btn-icon ${isPurchased ? "btn-muted" : "btn-primary"}`}
            onClick={handleBuy}
            disabled={isPurchased}
          >
            <HiOutlineShoppingBag />
            {isPurchased ? "Purchased" : "Buy"}
          </button>
        </div>
      </div>
    </article>
  );
}

function CourseImage({ imageUrl, title }) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className="course-image-wrap">
      {imageUrl && !imageFailed ? (
        <img src={imageUrl} alt={title} className="course-image" onError={() => setImageFailed(true)} />
      ) : (
        <div className="course-image-placeholder">
          <HiOutlineBookOpen />
          <span>SIA Software Innovations Private Limited</span>
        </div>
      )}
    </div>
  );
}
