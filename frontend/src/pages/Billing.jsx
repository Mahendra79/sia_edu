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
    const finalPrice = Number(billing?.final_price ?? billing?.subtotal ?? amount);
    const discountAmount = Number(Math.max(0, amount - finalPrice).toFixed(2));
    const discountPercent = amount > 0 ? Number(((discountAmount * 100) / amount).toFixed(2)) : 0;
    const backendTaxRatePercent = Number(billing?.tax_rate_percent ?? 0);
    const backendSubtotal = Number(billing?.subtotal ?? 0);
    const backendTax = Number(billing?.tax ?? 0);

    const fallbackTaxRatePercent = 18;
    const taxRatePercent = backendTaxRatePercent > 0 ? backendTaxRatePercent : fallbackTaxRatePercent;

    let subtotal = backendSubtotal;
    let tax = backendTax;
    if (taxRatePercent > 0 && finalPrice > 0 && (subtotal <= 0 || tax <= 0)) {
      subtotal = Number((finalPrice / (1 + taxRatePercent / 100)).toFixed(2));
      tax = Number((finalPrice - subtotal).toFixed(2));
    }

    const total = Number(billing?.total || 0);

    return {
      courseTitle: billing?.course_title || "Selected Course",
      amount,
      finalPrice,
      discountPercent,
      discountAmount,
      subtotal,
      taxRatePercent,
      tax,
      total,
      hasDiscount: discountPercent > 0 || discountAmount > 0,
      currency: String(billing?.currency || "INR").toUpperCase(),
    };
  }, [billing]);

  const handleCheckout = async () => {
    setPaymentError("");
    setPaying(true);
    try {
      const response = await paymentService.createRazorpayOrder({
        course_id: Number(courseId),
      });
      const orderPayload = response.data || {};

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
                {billingSummary.hasDiscount && (
                  <span className="billing-savings-chip">
                    <HiOutlineCheckBadge />
                    {billingSummary.discountPercent.toFixed(0)}% discount applied from course configuration
                  </span>
                )}
                <div className="billing-row">
                  <span>Base Price</span>
                  <strong>{formatCurrency(billingSummary.amount, billingSummary.currency)}</strong>
                </div>
                <div className="billing-row">
                  <span>Discount</span>
                  <strong>
                    {billingSummary.hasDiscount
                      ? `- ${formatCurrency(billingSummary.discountAmount, billingSummary.currency)}`
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
                <button type="button" className="btn btn-primary btn-icon" disabled={paying} onClick={handleCheckout}>
                  <HiOutlineReceiptPercent />
                  {paying ? "Opening Razorpay..." : "Continue to Razorpay Payment"}
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
