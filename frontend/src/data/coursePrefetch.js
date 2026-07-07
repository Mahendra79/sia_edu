import { courseService } from "../services/courseService";
import { getCached, setCached } from "../utils/sessionCache";

// Lives outside pages/CourseDetails.jsx (a lazy-loaded route) so pages like
// Home can prefetch on hover without pulling that route's whole chunk in eagerly.
export const courseDetailsCacheKey = (id) => `course-details:${id}`;

export async function prefetchCourseDetails(id) {
  if (!id || getCached(courseDetailsCacheKey(id))) {
    return;
  }
  try {
    const response = await courseService.getCourse(id);
    setCached(courseDetailsCacheKey(id), response.data);
  } catch {
    // Silent: the real page load will retry and surface any error normally.
  }
}
