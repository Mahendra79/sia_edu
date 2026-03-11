export const FEATURED_COURSE_TITLE = "Certificate Program in Quantum Computing";
export const FEATURED_COURSE_START_LABEL = "Starts 1 May 2026";

export function isFeaturedCourseTitle(title) {
  return String(title || "").trim().toLowerCase() === FEATURED_COURSE_TITLE.toLowerCase();
}

export function markComingSoon(course) {
  if (!course) {
    return course;
  }
  return {
    ...course,
    is_coming_soon: isFeaturedCourseTitle(course.title),
  };
}

export function getCourseStartLabel(course) {
  if (!course) {
    return "";
  }
  return isFeaturedCourseTitle(course.title) ? FEATURED_COURSE_START_LABEL : "";
}
