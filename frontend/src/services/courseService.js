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
};
