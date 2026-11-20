// Course thumbnails are served as compressed 960px WebP files from /public/images/courses.
// The originals (1.7–2.5 MB PNGs each) made the home page download ~14 MB of images.
// To add or replace one: export at 960px wide as WebP (quality ~78) and map the course id here.
export const DEFAULT_COURSE_IMAGE_URL = "/images/courses/default.webp";

export const COURSE_IMAGE_URLS_BY_ID = {
  52: "/images/courses/52.webp", // Advanced Quantum Computing using HDQS
  56: "/images/courses/56.webp", // Quantum Gates and Circuit Design
  58: "/images/courses/58.webp", // AI & ML
  60: "/images/courses/60.webp", // Quantum Algorithms and Complex Computations
  59: "/images/courses/59.webp", // Data Science
  57: "/images/courses/57.webp", // Agentic AI
};

export function getCourseImageUrl(course) {
  const courseId = Number(course?.id);
  return COURSE_IMAGE_URLS_BY_ID[courseId] || DEFAULT_COURSE_IMAGE_URL;
}
