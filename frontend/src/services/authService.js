import api from "./api";

export const authService = {
  signup(payload) {
    return api.post("/auth/signup/", payload);
  },
  login(payload) {
    return api.post("/auth/login/", payload);
  },
  refreshToken(payload) {
    return api.post("/auth/token/refresh/", payload);
  },
  logout(payload) {
    return api.post("/auth/logout/", payload);
  },
  getProfile() {
    return api.get("/auth/profile/");
  },
  updateProfile(payload) {
    if (payload instanceof FormData) {
      return api.patch("/auth/profile/", payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    }
    return api.patch("/auth/profile/", payload);
  },
  verifyEmail(payload) {
    return api.post("/auth/verify-email/", payload);
  },
  resendVerification(payload) {
    return api.post("/auth/resend-verification/", payload);
  },
  requestPasswordReset(payload) {
    return api.post("/auth/password-reset/request/", payload);
  },
  confirmPasswordReset(payload) {
    return api.post("/auth/password-reset/confirm/", payload);
  },
  getAdminUsers(params) {
    return api.get("/auth/admin/users/", { params });
  },
  getAdminUser(userId) {
    return api.get(`/auth/admin/users/${userId}/`);
  },
  updateAdminUser(userId, payload) {
    return api.patch(`/auth/admin/users/${userId}/`, payload);
  },
  softDeleteUser(userId, payload) {
    return api.patch(`/auth/admin/users/${userId}/soft-delete/`, payload);
  },
  getUserPayments(userId, params) {
    return api.get(`/auth/admin/users/${userId}/payments/`, { params });
  },
};
