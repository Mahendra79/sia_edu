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
    const discountPercent = Number(billing?.discount_percent || 0);
    const discountAmount = Number(billing?.discount_amount || 0);
    const subtotal = Number(billing?.subtotal ?? amount - discountAmount);
    const tax = Number(billing?.tax || 0);
    const total = Number(billing?.total || 0);

    return {
      courseTitle: billing?.course_title || "Selected Course",
      amount,
      discountPercent,
      discountAmount,
      subtotal,
      tax,
      total,
      hasDiscount: discountPercent > 0 || discountAmount > 0,
      currency: String(billing?.currency || "USD").toUpperCase(),
    };
  }, [billing]);

  const handleCheckout = async () => {
    setPaymentError("");
    setPaying(true);
    try {
      const success_url = `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancel_url = `${window.location.origin}/failure`;
      const response = await paymentService.createCheckoutSession({
        course_id: Number(courseId),
        success_url,
        cancel_url,
      });
      window.location.href = response.data.checkout_url;
    } catch (error) {
      const message = error.response?.data?.detail || "Unable to initialize secure checkout.";
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
                  <span>Subtotal</span>
                  <strong>{formatCurrency(billingSummary.subtotal, billingSummary.currency)}</strong>
                </div>
                <div className="billing-row">
                  <span>Tax</span>
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
                <p className="card-subtitle">Your transaction is encrypted and processed through Stripe Checkout.</p>
                <ul className="billing-checklist">
                  <li>
                    <HiOutlineLockClosed />
                    Card and UPI details are entered on Stripe-hosted secure pages.
                  </li>
                  <li>
                    <HiOutlineClock />
                    Enrollment activates automatically once payment is confirmed.
                  </li>
                </ul>
                {paymentError ? <p className="billing-status-banner">{paymentError}</p> : null}
                <button type="button" className="btn btn-primary btn-icon" disabled={paying} onClick={handleCheckout}>
                  <HiOutlineReceiptPercent />
                  {paying ? "Redirecting to secure checkout..." : "Continue to Secure Payment"}
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
