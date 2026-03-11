import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  HiOutlineCheckBadge,
  HiOutlineClock,
  HiOutlineCreditCard,
  HiOutlineLockClosed,
  HiOutlineReceiptPercent,
  HiOutlineShieldCheck,
} from "react-icons/hi2";

import LoadingSpinner from "../components/LoadingSpinner";
import PageTransition from "../components/PageTransition";
import { useToast } from "../context/ToastContext";
import MainLayout from "../layouts/MainLayout";
import { paymentService } from "../services/paymentService";
import { formatCurrency } from "../utils/format";

function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(window.Razorpay);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(window.Razorpay);
    script.onerror = () => reject(new Error("Unable to load Razorpay checkout script."));
    document.body.appendChild(script);
  });
}

export default function Billing() {
  const { courseId } = useParams();
  const { addToast } = useToast();
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponApplying, setCouponApplying] = useState(false);
  const [couponStatus, setCouponStatus] = useState(null);
  const [appliedCoupon, setAppliedCoupon] = useState("");

  const loadBilling = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const response = await paymentService.getBilling(courseId);
      setBilling(response.data);
    } catch (error) {
      const message = error.response?.data?.detail || "Unable to load billing details.";
      setLoadError(message);
      addToast({ type: "error", message });
    } finally {
      setLoading(false);
    }
  }, [courseId, addToast]);

  useEffect(() => {
    loadBilling();
  }, [loadBilling]);

  const billingSummary = useMemo(() => {
    const amount = Number(billing?.amount || 0);
    const courseDiscountAmount = Number(billing?.discount_amount || 0);
    const couponDiscountAmount = Number(billing?.coupon_discount || 0);
    const discountPercent = Number(billing?.discount_percent || 0);
    const backendTaxRatePercent = Number(billing?.tax_rate_percent ?? 0);
    const backendSubtotal = Number(billing?.subtotal ?? 0);
    const backendTax = Number(billing?.tax ?? 0);
    const backendTotal = Number(billing?.total ?? billing?.final_price ?? 0);

    const fallbackTaxRatePercent = 18;
    const taxRatePercent = backendTaxRatePercent > 0 ? backendTaxRatePercent : fallbackTaxRatePercent;

    let subtotal = backendSubtotal;
    let tax = backendTax;
    if (taxRatePercent > 0 && backendTotal > 0 && (subtotal <= 0 || tax <= 0)) {
      subtotal = Number((backendTotal / (1 + taxRatePercent / 100)).toFixed(2));
      tax = Number((backendTotal - subtotal).toFixed(2));
    }

    const total = backendTotal;

    return {
      courseTitle: billing?.course_title || "Selected Course",
      amount,
      courseDiscountAmount,
      couponDiscountAmount,
      discountPercent,
      subtotal,
      taxRatePercent,
      tax,
      total,
      hasCourseDiscount: courseDiscountAmount > 0,
      hasCouponDiscount: couponDiscountAmount > 0,
      currency: String(billing?.currency || "INR").toUpperCase(),
      couponCode: String(billing?.coupon_code || ""),
    };
  }, [billing]);

  const handleCheckout = async () => {
    setPaymentError("");
    setPaying(true);
    try {
      const payload = {
        course_id: Number(courseId),
      };
      if (appliedCoupon) {
        payload.coupon_code = appliedCoupon;
      }
      const response = await paymentService.createRazorpayOrder(payload);
      const orderPayload = response.data || {};

      if (orderPayload.mode === "free") {
        window.location.href = `/success?transaction_id=${orderPayload.transaction_id}&confirmed=1`;
        return;
      }

      if (orderPayload.mode === "dev") {
        await paymentService.confirmPayment({
          transaction_id: orderPayload.transaction_id,
        });
        window.location.href = `/success?transaction_id=${orderPayload.transaction_id}&confirmed=1`;
        return;
      }

      const RazorpayCheckout = await loadRazorpayScript();
      const options = {
        key: orderPayload.key_id,
        amount: orderPayload.amount,
        currency: orderPayload.currency,
        name: "SIA EDU",
        description: orderPayload.description || orderPayload.course_title || "Course purchase",
        order_id: orderPayload.order_id,
        prefill: orderPayload.prefill || {},
        theme: { color: "#1f4bb8" },
        handler: async (gatewayResponse) => {
          try {
            await paymentService.confirmPayment({
              transaction_id: orderPayload.transaction_id,
              razorpay_order_id: gatewayResponse.razorpay_order_id,
              razorpay_payment_id: gatewayResponse.razorpay_payment_id,
              razorpay_signature: gatewayResponse.razorpay_signature,
            });
            window.location.href = `/success?transaction_id=${orderPayload.transaction_id}&confirmed=1`;
          } catch {
            window.location.href = "/failure";
          }
        },
      };

      const razorpay = new RazorpayCheckout(options);
      razorpay.on("payment.failed", () => {
        window.location.href = "/failure";
      });
      razorpay.open();
    } catch (error) {
      const message = error.response?.data?.detail || "Unable to initialize Razorpay checkout.";
      setPaymentError(message);
      addToast({ type: "error", message });
      setPaying(false);
    }
  };

  const handleApplyCoupon = async () => {
    const normalizedCode = couponCode.trim().toUpperCase();
    if (!normalizedCode) {
      setCouponStatus({ type: "error", message: "Enter a coupon code to apply." });
      return;
    }

    setCouponApplying(true);
    setCouponStatus(null);
    try {
      setCouponCode(normalizedCode);
      const validationResponse = await paymentService.validateCoupon({
        course_id: Number(courseId),
        code: normalizedCode,
      });
      const message = validationResponse.data?.message || "Coupon applied successfully.";
      setCouponStatus({ type: "success", message });
      setAppliedCoupon(normalizedCode);
      const billingResponse = await paymentService.getBilling(courseId, normalizedCode);
      setBilling(billingResponse.data);
    } catch (error) {
      const apiError = error.response?.data;
      let message = apiError?.message || apiError?.detail || "";
      if (!message && apiError && typeof apiError === "object") {
        const firstKey = Object.keys(apiError)[0];
        const firstValue = apiError[firstKey];
        message = Array.isArray(firstValue) ? firstValue[0] : String(firstValue);
      }
      if (!message) {
        message = "Unable to apply this coupon.";
      }
      setCouponStatus({ type: "error", message });
      setAppliedCoupon("");
      try {
        const billingResponse = await paymentService.getBilling(courseId);
        setBilling(billingResponse.data);
      } catch {
        // Keep existing billing state if refresh fails.
      }
    } finally {
      setCouponApplying(false);
    }
  };

  return (
    <MainLayout>
      <PageTransition>
        <section className="billing-page billing-shell">
          <header className="billing-intro">
            <span className="hero-badge">Secure Checkout</span>
            <h1 className="page-title">Billing Summary</h1>
            <p>Final amounts are calculated in real time from server-side pricing and discount rules.</p>
          </header>
          {loading ? (
            <LoadingSpinner label="Calculating your final amount..." />
          ) : billing && !loadError ? (
            <div className="billing-grid">
              <article className="billing-card billing-summary-card">
                <div className="card-title">
                  <HiOutlineCreditCard />
                  <h2>Order Details</h2>
                </div>
                <p className="card-subtitle">You are purchasing instant access for this course.</p>
                <h3 className="billing-course-title">{billingSummary.courseTitle}</h3>
                {billingSummary.hasCourseDiscount && (
                  <span className="billing-savings-chip">
                    <HiOutlineCheckBadge />
                    {billingSummary.discountPercent.toFixed(0)}% course discount applied
                  </span>
                )}
                {billingSummary.hasCouponDiscount && (
                  <span className="billing-savings-chip">
                    <HiOutlineCheckBadge />
                    Coupon {billingSummary.couponCode || "applied"} saved{" "}
                    {formatCurrency(billingSummary.couponDiscountAmount, billingSummary.currency)}
                  </span>
                )}
                <div className="billing-row">
                  <span>Base Price</span>
                  <strong>{formatCurrency(billingSummary.amount, billingSummary.currency)}</strong>
                </div>
                <div className="billing-row">
                  <span>Course Discount</span>
                  <strong>
                    {billingSummary.hasCourseDiscount
                      ? `- ${formatCurrency(billingSummary.courseDiscountAmount, billingSummary.currency)}`
                      : "-"}
                  </strong>
                </div>
                <div className="billing-row">
                  <span>Coupon Discount</span>
                  <strong>
                    {billingSummary.hasCouponDiscount
                      ? `- ${formatCurrency(billingSummary.couponDiscountAmount, billingSummary.currency)}`
                      : "-"}
                  </strong>
                </div>
                <div className="billing-row">
                  <span>Subtotal (Excl. GST)</span>
                  <strong>{formatCurrency(billingSummary.subtotal, billingSummary.currency)}</strong>
                </div>
                <div className="billing-row">
                  <span>GST ({billingSummary.taxRatePercent.toFixed(0)}%)</span>
                  <strong>{formatCurrency(billingSummary.tax, billingSummary.currency)}</strong>
                </div>
                <div className="billing-row total">
                  <span>Total Payable</span>
                  <strong>{formatCurrency(billingSummary.total, billingSummary.currency)}</strong>
                </div>
              </article>

              <aside className="billing-card billing-trust-card">
                <div className="card-title">
                  <HiOutlineShieldCheck />
                  <h2>Secure Payment</h2>
                </div>
                <p className="card-subtitle">Your transaction is encrypted and processed through Razorpay.</p>
                <ul className="billing-checklist">
                  <li>
                    <HiOutlineLockClosed />
                    Card and UPI details are entered on Razorpay-hosted secure pages.
                  </li>
                  <li>
                    <HiOutlineClock />
                    Enrollment activates automatically once payment is confirmed.
                  </li>
                </ul>
                {paymentError ? <p className="billing-status-banner">{paymentError}</p> : null}
                <div className="billing-coupon">
                  <label htmlFor="couponCode">Have a coupon?</label>
                  <div className="billing-coupon-row">
                    <input
                      id="couponCode"
                      type="text"
                      placeholder="Enter promo code"
                      autoCapitalize="characters"
                      value={couponCode}
                      onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                    />
                    <button
                      type="button"
                      className="btn btn-muted"
                      onClick={handleApplyCoupon}
                      disabled={couponApplying}
                    >
                      {couponApplying ? "Applying..." : "Apply"}
                    </button>
                  </div>
                  {couponStatus ? (
                    <p className={`billing-status-banner ${couponStatus.type}`}>{couponStatus.message}</p>
                  ) : null}
                </div>
                <button type="button" className="btn btn-primary btn-icon" disabled={paying} onClick={handleCheckout}>
                  <HiOutlineReceiptPercent />
                  {billingSummary.total === 0
                    ? paying
                      ? "Enrolling..."
                      : "Enroll Now (Free)"
                    : paying
                      ? "Opening Razorpay..."
                      : "Continue to Razorpay Payment"}
                </button>
                <p className="billing-legal">
                  By continuing, you agree to the platform billing and refund policy. Need help? General Information:
                  {" "}
                  <a className="inline-link" href="mailto:info@siasoftwareinnovations.com">
                    info@siasoftwareinnovations.com
                  </a>
                  {" "}or Product &amp; Collaboration:{" "}
                  <a className="inline-link" href="mailto:contact@siasoftwareinnovations.com">
                    contact@siasoftwareinnovations.com
                  </a>
                  .
                </p>
              </aside>
            </div>
          ) : (
            <article className="billing-card billing-trust-card">
              <h2>Billing currently unavailable</h2>
              <p className="empty-state">{loadError || "We could not load this billing summary."}</p>
              <button type="button" className="btn btn-muted" onClick={loadBilling}>
                Retry
              </button>
            </article>
          )}
        </section>
      </PageTransition>
    </MainLayout>
  );
}
