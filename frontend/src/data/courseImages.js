export const DEFAULT_COURSE_IMAGE_URL =
  "https://pub-1407f82391df4ab1951418d04be76914.r2.dev/uploads/971a437a-f346-4419-ae5a-3f0febd3a494.jpeg";

export const COURSE_IMAGE_URLS_BY_ID = {
  52: DEFAULT_COURSE_IMAGE_URL,
  53: DEFAULT_COURSE_IMAGE_URL,
  54: DEFAULT_COURSE_IMAGE_URL,
  55: DEFAULT_COURSE_IMAGE_URL,
  56: DEFAULT_COURSE_IMAGE_URL,
  58: DEFAULT_COURSE_IMAGE_URL,
  57: "https://cdn.corenexis.com/files/c/5133421720.png",
};

export function getCourseImageUrl(course) {
  const courseId = Number(course?.id);
  return COURSE_IMAGE_URLS_BY_ID[courseId] || DEFAULT_COURSE_IMAGE_URL;
}
