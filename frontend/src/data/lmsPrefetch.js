import { courseService } from "../services/courseService";
import { getCached, setCached } from "../utils/sessionCache";

// Lives outside user/LMSPortal.jsx (a lazy-loaded route) so pages like Home can
// prefetch on hover without pulling that route's whole chunk in eagerly.
export const lmsPortalCacheKey = (courseId) => `lms-portal:${courseId}`;

export async function prefetchLmsPortal(courseId) {
  if (!courseId || getCached(lmsPortalCacheKey(courseId))) {
    return;
  }
  try {
    const [courseResponse, overviewResponse] = await Promise.all([
      courseService.getCourse(courseId),
      courseService.getLmsOverview(courseId),
    ]);
    const quizResponse = await courseService.getLearnerQuizzes(courseId);
    setCached(lmsPortalCacheKey(courseId), {
      course: courseResponse.data,
      overview: overviewResponse.data,
      quizzes: quizResponse.data || [],
    });
  } catch {
    // Silent: the real page load will retry and surface any error normally.
  }
}
