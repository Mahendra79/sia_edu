import api from "./api";

export const paymentService = {
  getBilling(courseId) {
    return api.get(`/payments/billing/${courseId}/`);
  },
  createCheckoutSession(payload) {
    return api.post("/payments/create-checkout-session/", payload);
  },
  confirmPayment(payload) {
    return api.post("/payments/confirm/", payload);
  },
  getMyPaymentHistory(params) {
    return api.get("/payments/history/me/", { params });
  },
  getAdminPaymentHistory(params) {
    return api.get("/payments/admin/history/", { params });
  },
  updateAdminPayment(paymentId, payload) {
    return api.patch(`/payments/admin/history/${paymentId}/`, payload);
  },
  deleteAdminPayment(paymentId, payload) {
    return api.delete(`/payments/admin/history/${paymentId}/`, { data: payload });
  },
};
