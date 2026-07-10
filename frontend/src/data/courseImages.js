export const DEFAULT_COURSE_IMAGE_URL =
  "https://pub-1407f82391df4ab1951418d04be76914.r2.dev/uploads/971a437a-f346-4419-ae5a-3f0febd3a494.jpeg";

export const COURSE_IMAGE_URLS_BY_ID = {
  52: "https://cdn.corenexis.com/files/c/6651645720.png",
  53: "https://cdn.corenexis.com/files/c/8776583720.png",
  54: "https://cdn.corenexis.com/files/c/4223578720.png",
  55: "https://cdn.corenexis.com/files/c/5482339720.png",
  56: "https://cdn.corenexis.com/f/HNvRe3NCqaf.png",
  58: "https://cdn.corenexis.com/files/c/5482339720.png",
  60: "https://cdn.corenexis.com/f/BUqXDT5gwSF.png",
  59: "https://cdn.corenexis.com/f/ikPV93Znw8Y.png",
  57: "https://cdn.corenexis.com/f/wRN2WypaqvX.png",
};

export function getCourseImageUrl(course) {
  const courseId = Number(course?.id);
  return COURSE_IMAGE_URLS_BY_ID[courseId] || DEFAULT_COURSE_IMAGE_URL;
}
