import api from "./api";

export const paymentService = {
  getBilling(courseId, couponCode = "") {
    const params = {};
    if (couponCode) {
      params.coupon_code = couponCode;
    }
    return api.get(`/payments/billing/${courseId}/`, { params });
  },
  validateCoupon(payload) {
    return api.post("/payments/coupon/validate/", payload);
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
  getAdminCoupons(params) {
    return api.get("/payments/admin/coupons/", { params });
  },
  createAdminCoupon(payload) {
    return api.post("/payments/admin/coupons/", payload);
  },
  updateAdminCoupon(couponId, payload) {
    return api.patch(`/payments/admin/coupons/${couponId}/`, payload);
  },
  deleteAdminCoupon(couponId) {
    return api.delete(`/payments/admin/coupons/${couponId}/`);
  },
};
