import { useState } from "react";

import { formatCurrency } from "../utils/format";
import { HiOutlineBookOpen, HiOutlineCalendarDays, HiOutlineShoppingBag } from "react-icons/hi2";
import { getCourseStartLabel } from "../data/featuredCourse";

const FORCED_COURSE_IMAGE_URL =
  "https://pub-1407f82391df4ab1951418d04be76914.r2.dev/uploads/971a437a-f346-4419-ae5a-3f0febd3a494.jpeg";

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

export default function CourseCard({ course, searchQuery, onBuy, onOpen }) {
  const imageUrl = FORCED_COURSE_IMAGE_URL;
  const logoPlaceholder = (import.meta.env.VITE_WEBSITE_LOGO_URL || "").trim();
  const discountPercent = Number(course.discount_percent || 0);
  const hasDiscount = discountPercent > 0;
  const listPrice = Number(course.price || 0);
  const discountedPrice = Number(course.discounted_price ?? listPrice);
  const isPurchased = Boolean(course.is_purchased);
  const startLabel = getCourseStartLabel(course);
  const durationDays = Number(course.duration_days || 0);
  const durationWeeks = durationDays > 0 ? Math.round(durationDays / 7) : 0;
  const durationLabel = durationWeeks > 0 ? `${durationWeeks} weeks` : "";

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
      <CourseImage
        key={imageUrl || logoPlaceholder || "course-image-placeholder"}
        imageUrl={imageUrl}
        placeholderUrl={logoPlaceholder}
        title={course.title}
      />
      <div className="course-content">
        <div className="course-tags">
          <span className="pill">{course.category?.name || "General"}</span>
          {startLabel ? (
            <span className="pill">
              <HiOutlineCalendarDays />
              {startLabel}
            </span>
          ) : null}
          {durationLabel ? (
            <span className="pill">
              <HiOutlineCalendarDays />
              {durationLabel}
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

function CourseImage({ imageUrl, placeholderUrl, title }) {
  const [imageFailed, setImageFailed] = useState(false);
  const [placeholderFailed, setPlaceholderFailed] = useState(false);

  return (
    <div className="course-image-wrap">
      {imageUrl && !imageFailed ? (
        <img src={imageUrl} alt={title} className="course-image" onError={() => setImageFailed(true)} />
      ) : placeholderUrl && !placeholderFailed ? (
        <img
          src={placeholderUrl}
          alt="SIA Software Innovations logo"
          className="course-image placeholder-logo"
          onError={() => setPlaceholderFailed(true)}
        />
      ) : (
        <div className="course-image-placeholder">
          <HiOutlineBookOpen />
          <span>SIA Software Innovations Private Limited</span>
        </div>
      )}
    </div>
  );
}
