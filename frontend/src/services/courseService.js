import api from "./api";

export const courseService = {
  getCourses(params, config = {}) {
    return api.get("/courses/", { params, ...config });
  },
  getCourse(id) {
    return api.get(`/courses/${id}/`);
  },
  getCategories(params) {
    return api.get("/courses/categories/", { params });
  },
  updateCategory(id, payload) {
    return api.patch(`/courses/categories/${id}/`, payload);
  },
  deleteCategory(id, payload) {
    return api.delete(`/courses/categories/${id}/`, { data: payload });
  },
  createCategory(payload) {
    return api.post("/courses/categories/", payload);
  },
  createCourse(payload) {
    return api.post("/courses/", payload, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  updateCourse(id, payload) {
    return api.put(`/courses/${id}/`, payload, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  deleteCourse(id, payload) {
    return api.delete(`/courses/${id}/`, { data: payload });
  },
  getReviews(courseId, params) {
    return api.get(`/courses/${courseId}/reviews/`, { params });
  },
  async getRelatedCourses(courseId, _categoryId, limit = 6) {
    const safeLimit = Math.max(1, Number(limit) || 6);
    const response = await api.get(`/courses/${courseId}/related/`, {
      params: { limit: safeLimit },
    });
    return Array.isArray(response.data) ? response.data : [];
  },
  createReview(courseId, payload) {
    return api.post(`/courses/${courseId}/reviews/`, payload);
  },
  voteReview(reviewId, payload) {
    return api.post(`/courses/reviews/${reviewId}/vote/`, payload);
  },
  getAdminEnrollments(params) {
    return api.get("/courses/admin/enrollments/", { params });
  },
  updateAdminEnrollment(id, payload) {
    return api.patch(`/courses/admin/enrollments/${id}/`, payload);
  },
  deleteAdminEnrollment(id, payload) {
    return api.delete(`/courses/admin/enrollments/${id}/`, { data: payload });
  },
  getAdminReviews(params) {
    return api.get("/courses/admin/reviews/", { params });
  },
  updateAdminReview(id, payload) {
    return api.patch(`/courses/admin/reviews/${id}/`, payload);
  },
  deleteAdminReview(id, payload) {
    return api.delete(`/courses/admin/reviews/${id}/`, { data: payload });
  },
  getMyCourses(params) {
    return api.get("/courses/enrollments/me/", { params });
  },
  getLmsOverview(courseId) {
    return api.get(`/courses/lms/${courseId}/overview/`);
  },
  getLessonDetail(lessonId) {
    return api.get(`/courses/lms/lessons/${lessonId}/`);
  },
  updateLessonProgress(lessonId, payload) {
    return api.post(`/courses/lms/lessons/${lessonId}/progress/`, payload);
  },
  getAdminLmsLessons(params) {
    return api.get("/courses/admin/lms-lessons/", { params });
  },
  createAdminLmsLesson(payload) {
    return api.post("/courses/admin/lms-lessons/", payload);
  },
  updateAdminLmsLesson(id, payload) {
    return api.patch(`/courses/admin/lms-lessons/${id}/`, payload);
  },
  deleteAdminLmsLesson(id) {
    return api.delete(`/courses/admin/lms-lessons/${id}/`);
  },
  getAdminQuizzes(params) {
    return api.get("/courses/admin/quizzes/", { params });
  },
  createAdminQuiz(payload) {
    return api.post("/courses/admin/quizzes/", payload);
  },
  updateAdminQuiz(id, payload) {
    return api.patch(`/courses/admin/quizzes/${id}/`, payload);
  },
  deleteAdminQuiz(id) {
    return api.delete(`/courses/admin/quizzes/${id}/`);
  },
  createAdminQuizQuestion(quizId, payload) {
    return api.post(`/courses/admin/quizzes/${quizId}/questions/`, payload);
  },
  importAdminQuizQuestions(quizId, payload) {
    return api.post(`/courses/admin/quizzes/${quizId}/questions/import/`, payload);
  },
  updateAdminQuizQuestion(questionId, payload) {
    return api.patch(`/courses/admin/quiz-questions/${questionId}/`, payload);
  },
  deleteAdminQuizQuestion(questionId) {
    return api.delete(`/courses/admin/quiz-questions/${questionId}/`);
  },
  getLearnerQuizzes(courseId) {
    return api.get(`/courses/lms/${courseId}/quizzes/`);
  },
  startQuiz(quizId) {
    return api.post(`/courses/lms/quizzes/${quizId}/start/`);
  },
  getQuizAttempt(attemptId) {
    return api.get(`/courses/lms/quiz-attempts/${attemptId}/`);
  },
  saveQuizAnswer(attemptId, payload) {
    return api.post(`/courses/lms/quiz-attempts/${attemptId}/answer/`, payload);
  },
  submitQuizAttempt(attemptId) {
    return api.post(`/courses/lms/quiz-attempts/${attemptId}/submit/`);
  },
};
