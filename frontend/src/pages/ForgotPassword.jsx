import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  HiArrowLeft,
  HiOutlineBolt,
  HiOutlineCheckBadge,
  HiOutlineKey,
  HiOutlinePaperAirplane,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
} from "react-icons/hi2";

import PageTransition from "../components/PageTransition";
import { useToast } from "../context/ToastContext";
import MainLayout from "../layouts/MainLayout";
import { authService } from "../services/authService";
import companyLogo from "../assets/image.webp";
import "./AuthPages.css";
import "./ForgotPassword.css";

export default function ForgotPassword() {
  const { addToast } = useToast();
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isValidEmail = (value) => /\S+@\S+\.\S+/.test(value);
  const isStrongPassword = (value) =>
    value.length >= 8 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value);
  const isValidOtp = (value) => /^\d{6}$/.test(value);

  const passwordStrength = useMemo(() => {
    if (!password) {
      return { score: 0, label: "Add a password" };
    }

    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 1) return { score, label: "Weak" };
    if (score === 2) return { score, label: "Fair" };
    if (score === 3) return { score, label: "Strong" };
    return { score, label: "Excellent" };
  }, [password]);

  const passwordMatched = Boolean(confirmPassword) && password === confirmPassword;

  const handleRequestToken = async (event) => {
    event.preventDefault();
    if (!isValidEmail(email.trim())) {
      addToast({ type: "error", message: "Please enter a valid email address." });
      return;
    }
    setRequesting(true);
    try {
      await authService.requestPasswordReset({ email });
      addToast({ type: "success", message: "Verification code is sent." });
    } catch (error) {
      const detail = error?.response?.data?.detail;
      if (detail) {
        addToast({ type: "error", message: detail });
      } else if (!error?.response) {
        addToast({ type: "error", message: "Unable to send reset email right now. Please try again later." });
      } else {
        addToast({ type: "error", message: "Unable to send reset email right now. Please try again later." });
      }
    } finally {
      setRequesting(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    if (!isValidOtp(otpCode.trim())) {
      addToast({ type: "error", message: "OTP is invalid or expired. Please request a new one." });
      return;
    }
    if (password !== confirmPassword) {
      addToast({ type: "error", message: "Passwords do not match. Please confirm your new password." });
      return;
    }
    if (!isStrongPassword(password)) {
      addToast({
        type: "error",
        message: "New password must be at least 8 characters with uppercase, lowercase, number, and special character.",
      });
      return;
    }
    setResetting(true);
    try {
      await authService.confirmPasswordReset({
        email,
        otp_code: otpCode.trim(),
        password,
        confirm_password: confirmPassword,
      });
      addToast({ type: "success", message: "Password updated successfully! You can now log in with your new password." });
      setOtpCode("");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      if (!error?.response) {
        addToast({ type: "error", message: "Unable to reset password. Please try again or contact support." });
      } else if (error.response.status >= 500) {
        addToast({ type: "error", message: "Unable to reset password. Please try again or contact support." });
      } else {
        const detail = error.response?.data?.detail || "";
        const lowered = String(detail).toLowerCase();
        if (lowered.includes("otp") || lowered.includes("expired") || lowered.includes("invalid")) {
          addToast({ type: "error", message: "OTP is invalid or expired. Please request a new one." });
        } else if (error.response?.data?.confirm_password) {
          addToast({ type: "error", message: "Passwords do not match. Please confirm your new password." });
        } else if (error.response?.data?.password) {
          addToast({
            type: "error",
            message: "New password must be at least 8 characters with uppercase, lowercase, number, and special character.",
          });
        } else {
          addToast({ type: "error", message: "Reset failed. Please check your inputs and try again." });
        }
      }
    } finally {
      setResetting(false);
    }
  };

  return (
    <MainLayout>
      <PageTransition>
        <section className="auth-page auth-page-wide forgot-page">
          <div className="auth-experience forgot-experience">
            <aside className="auth-intro-panel forgot-intro-panel">
              <Link to="/" className="auth-brand">
                <img src={companyLogo} alt="SIA Software Innovations logo" className="auth-brand-logo" />
                <span className="auth-brand-text">
                  <strong>SIA Software Innovations Private Limited</strong>
                  <span>ACCESS BEYOND LIMITS</span>
                </span>
              </Link>
              <p className="auth-eyebrow">Account Recovery</p>
              <h1 className="auth-intro-title">
                Recover your access quickly and <span className="auth-highlight">securely</span>.
              </h1>
              <p className="auth-intro-copy">
                Request a one-time reset code to your email and set a new password with instant account protection.
              </p>

              <ul className="auth-list">
                <li className="auth-list-item">
                  <HiOutlineCheckBadge />
                  Single-use OTP and expiring reset credentials.
                </li>
                <li className="auth-list-item">
                  <HiOutlineShieldCheck />
                  Token validation before password updates.
                </li>
                <li className="auth-list-item">
                  <HiOutlineSparkles />
                  Works with your existing course and billing profile.
                </li>
              </ul>

              <div className="forgot-step-row">
                <span>1. Request token</span>
                <span>2. Enter OTP</span>
                <span>3. Set new password</span>
              </div>

              <Link to="/login" className="btn btn-muted btn-icon forgot-back-btn">
                <HiArrowLeft />
                Back to Login
              </Link>
            </aside>

            <div className="forgot-form-grid-wrap">
              <form className="auth-form-panel forgot-form-card stack-form" onSubmit={handleRequestToken}>
                <h2 className="card-title">
                  <HiOutlinePaperAirplane />
                  Request Reset OTP
                </h2>
                <p className="card-subtitle">Enter your registered email to receive password reset OTP.</p>
                <label htmlFor="forgot_email">Email</label>
                <input
                  id="forgot_email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                />
                <button type="submit" className="btn btn-primary btn-icon auth-action-btn" disabled={requesting}>
                  <HiOutlinePaperAirplane />
                  {requesting ? "Sending..." : "Send Reset OTP"}
                </button>
              </form>

              <form className="auth-form-panel forgot-form-card stack-form" onSubmit={handleResetPassword}>
                <h2 className="card-title">
                  <HiOutlineKey />
                  Reset Password
                </h2>
                <p className="card-subtitle">Enter OTP and choose a new secure password.</p>
                <label htmlFor="reset_otp">OTP Code</label>
                <input
                  id="reset_otp"
                  value={otpCode}
                  onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, ""))}
                  placeholder="6-digit OTP"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                />
                <label htmlFor="new_password">New Password</label>
                <div className="auth-input-wrap">
                  <input
                    id="new_password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="New password"
                    required
                  />
                  <button type="button" className="auth-inline-btn" onClick={() => setShowPassword((prev) => !prev)}>
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <label htmlFor="confirm_new_password">Confirm Password</label>
                <div className="auth-input-wrap">
                  <input
                    id="confirm_new_password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Confirm new password"
                    required
                  />
                  <button
                    type="button"
                    className="auth-inline-btn"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>

                <div className="forgot-strength">
                  <span>Password Strength</span>
                  <strong>{passwordStrength.label}</strong>
                  <div className="forgot-strength-track">
                    <span className={`forgot-strength-fill level-${passwordStrength.score}`} />
                  </div>
                </div>
                <p className={`forgot-match ${passwordMatched ? "match-ok" : "match-pending"}`}>
                  {confirmPassword ? (passwordMatched ? "Passwords are matching." : "Passwords do not match yet.") : "Waiting for confirm password."}
                </p>

                <button type="submit" className="btn btn-primary btn-icon auth-action-btn" disabled={resetting}>
                  <HiOutlineShieldCheck />
                  {resetting ? "Updating..." : "Update Password"}
                </button>
              </form>
            </div>
          </div>
          <div className="auth-foot-links forgot-bottom-links">
            <span>Need a new account instead?</span>
            <Link to="/signup">
              <HiOutlineBolt /> Create account
            </Link>
          </div>
        </section>
      </PageTransition>
    </MainLayout>
  );
}
