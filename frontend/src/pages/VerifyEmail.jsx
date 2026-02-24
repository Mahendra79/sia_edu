import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  HiArrowLeft,
  HiOutlineCheckBadge,
  HiOutlineEnvelope,
  HiOutlinePaperAirplane,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
} from "react-icons/hi2";

import PageTransition from "../components/PageTransition";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import MainLayout from "../layouts/MainLayout";
import { authService } from "../services/authService";
import companyLogo from "../assets/image.webp";
import "./AuthPages.css";
import "./VerifyEmail.css";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, isAdmin, refreshProfile } = useAuth();
  const { addToast } = useToast();

  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const queryEmail = searchParams.get("email");
    setEmail((queryEmail || user?.email || "").trim());
  }, [searchParams, user?.email]);

  const handleVerify = async (event) => {
    event.preventDefault();
    setVerifying(true);
    try {
      await authService.verifyEmail({ email: email.trim(), otp_code: otpCode.trim() });
      if (isAuthenticated) {
        try {
          await refreshProfile();
        } catch {
          // best effort
        }
      }
      addToast({ type: "success", message: "Email verified successfully." });
      navigate(isAuthenticated ? (isAdmin ? "/admin/dashboard" : "/user/dashboard") : "/login");
    } catch (error) {
      const message = error.response?.data?.detail || "Verification failed. Check email and OTP.";
      addToast({ type: "error", message });
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      addToast({ type: "warning", message: "Enter your email first." });
      return;
    }

    setResending(true);
    try {
      await authService.resendVerification({ email: email.trim() });
      addToast({ type: "info", message: "Verification OTP sent to your email if account exists." });
    } catch {
      addToast({ type: "error", message: "Unable to resend verification OTP right now." });
    } finally {
      setResending(false);
    }
  };

  return (
    <MainLayout>
      <PageTransition>
        <section className="auth-page auth-page-wide verify-email-page">
          <div className="auth-experience verify-email-experience">
            <aside className="auth-intro-panel verify-email-intro-panel">
              <Link to="/" className="auth-brand">
                <img src={companyLogo} alt="SIA Software Innovations logo" className="auth-brand-logo" />
                <span className="auth-brand-text">
                  <strong>SIA Software Innovations Private Limited</strong>
                  <span>ACCESS BEYOND LIMITS</span>
                </span>
              </Link>
              <p className="auth-eyebrow">Email Verification</p>
              <h1 className="auth-intro-title">
                Confirm your account with a <span className="auth-highlight">one-time OTP</span>.
              </h1>
              <p className="auth-intro-copy">
                Enter the 6-digit verification code sent to your inbox to activate trusted account status.
              </p>

              <ul className="auth-list">
                <li className="auth-list-item">
                  <HiOutlineCheckBadge />
                  OTP-based account verification with expiry validation.
                </li>
                <li className="auth-list-item">
                  <HiOutlineShieldCheck />
                  Identity confirmation before sensitive account actions.
                </li>
                <li className="auth-list-item">
                  <HiOutlineSparkles />
                  Resend option available anytime from this page.
                </li>
              </ul>

              <Link to={isAuthenticated ? (isAdmin ? "/admin/dashboard" : "/user/dashboard") : "/login"} className="btn btn-muted btn-icon">
                <HiArrowLeft />
                Back
              </Link>
            </aside>

            <article className="auth-form-panel verify-email-form-panel">
              <form className="stack-form" onSubmit={handleVerify}>
                <h2 className="card-title">
                  <HiOutlineEnvelope />
                  Verify Email
                </h2>
                <p className="card-subtitle">Use the latest verification OTP sent to your registered email.</p>

                <label htmlFor="verify_email">Email</label>
                <input
                  id="verify_email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                />

                <label htmlFor="verify_otp">OTP Code</label>
                <input
                  id="verify_otp"
                  value={otpCode}
                  onChange={(event) => setOtpCode(event.target.value)}
                  placeholder="6-digit OTP"
                  required
                />

                <button type="submit" className="btn btn-primary btn-icon auth-action-btn" disabled={verifying}>
                  <HiOutlineCheckBadge />
                  {verifying ? "Verifying..." : "Verify Email"}
                </button>

                <button type="button" className="btn btn-muted btn-icon auth-action-btn" onClick={handleResend} disabled={resending}>
                  <HiOutlinePaperAirplane />
                  {resending ? "Sending..." : "Resend Verification OTP"}
                </button>
              </form>

              {!isAuthenticated && (
                <div className="auth-foot-links">
                  <span>Already verified?</span>
                  <Link to="/login">Login now</Link>
                </div>
              )}
            </article>
          </div>
        </section>
      </PageTransition>
    </MainLayout>
  );
}
