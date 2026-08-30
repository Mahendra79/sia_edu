export const DEFAULT_COURSE_IMAGE_URL =
  "https://pub-1407f82391df4ab1951418d04be76914.r2.dev/uploads/971a437a-f346-4419-ae5a-3f0febd3a494.jpeg";

export const COURSE_IMAGE_URLS_BY_ID = {
  52: "https://zaiucwqquisiqvrihizo.supabase.co/storage/v1/object/public/sia_thumbnails/ChatGPT%20Image%20Jun%202,%202026,%2002_49_43%20PM.png", // Advanced Quantum Computing using HDQS
  56: "https://zaiucwqquisiqvrihizo.supabase.co/storage/v1/object/public/sia_thumbnails/ChatGPT%20Image%20Jun%202,%202026,%2002_46_41%20PM.png", // Quantum Gates and Circuit Design
  58: "https://zaiucwqquisiqvrihizo.supabase.co/storage/v1/object/public/sia_thumbnails/ChatGPT%20Image%20Jun%202,%202026,%2002_40_14%20PM.png", // AI & ML
  60: "https://zaiucwqquisiqvrihizo.supabase.co/storage/v1/object/public/sia_thumbnails/ChatGPT%20Image%20Jun%202,%202026,%2002_09_19%20PM.png", // Quantum Algorithms and Complex Computations
  59: "https://zaiucwqquisiqvrihizo.supabase.co/storage/v1/object/public/sia_thumbnails/ChatGPT%20Image%20Jun%202,%202026,%2002_36_55%20PM.png", // Data Science
  57: "https://zaiucwqquisiqvrihizo.supabase.co/storage/v1/object/public/sia_thumbnails/ChatGPT%20Image%20Jun%202,%202026,%2002_41_29%20PM.png", // Agentic AI
};

export function getCourseImageUrl(course) {
  const courseId = Number(course?.id);
  return COURSE_IMAGE_URLS_BY_ID[courseId] || DEFAULT_COURSE_IMAGE_URL;
}
