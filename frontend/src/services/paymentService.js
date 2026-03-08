import api from "./api";

export const paymentService = {
  getBilling(courseId) {
    return api.get(`/payments/billing/${courseId}/`);
  },
  createRazorpayOrder(payload) {
    return api.post("/payments/create-order/", payload);
  },
  createCheckoutSession(payload) {
    return api.post("/payments/create-order/", payload);
  },
  confirmPayment(payload) {
    return api.post("/payments/confirm/", payload);
  },
  getInvoice(paymentId, options = {}) {
    const inline = options.inline ? "1" : "0";
    return api.get(`/payments/invoice/${paymentId}/?inline=${inline}`, { responseType: "blob" });
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
