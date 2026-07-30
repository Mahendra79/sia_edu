export const DEFAULT_COURSE_IMAGE_URL =
  "https://pub-1407f82391df4ab1951418d04be76914.r2.dev/uploads/971a437a-f346-4419-ae5a-3f0febd3a494.jpeg";

export const COURSE_IMAGE_URLS_BY_ID = {
  52: "https://cdn.corenexis.com/f/s2KtMlvceE6.png", // Advanced Quantum Computing using HDQS
  56: "https://cdn.corenexis.com/f/HNvRe3NCqaf.png", // Quantum Gates and Circuit Design
  58: "https://cdn.corenexis.com/f/FOg9Q5WiE6H.png", // AI & ML
  60: "https://cdn.corenexis.com/f/BUqXDT5gwSF.png", // Quantum Algorithms and Complex Computations
  59: "https://cdn.corenexis.com/f/ikPV93Znw8Y.png", // Data Science
  57: "https://cdn.corenexis.com/f/wRN2WypaqvX.png", // Agentic AI
};

export function getCourseImageUrl(course) {
  const courseId = Number(course?.id);
  return COURSE_IMAGE_URLS_BY_ID[courseId] || DEFAULT_COURSE_IMAGE_URL;
}
