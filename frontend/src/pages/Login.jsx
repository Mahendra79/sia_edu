import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  HiOutlineArrowRightOnRectangle,
  HiOutlineBookOpen,
  HiOutlineBolt,
  HiOutlineChartBar,
  HiOutlineKey,
  HiOutlineShieldCheck,
  HiOutlineUserCircle,
} from "react-icons/hi2";

import PageTransition from "../components/PageTransition";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import MainLayout from "../layouts/MainLayout";
import companyLogo from "../assets/image.webp";
import "./AuthPages.css";
import "./Login.css";

const INITIAL_LOGIN = { username: "", password: "" };

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { addToast } = useToast();
  const [form, setForm] = useState(INITIAL_LOGIN);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const getLoginErrorMessage = (error) => {
    if (!error?.response) {
      return "Unable to connect to the server. Check your internet or try again later.";
    }

    const status = error.response.status;
    if (status === 429) {
      return "Too many login attempts. Please wait 5 minutes or use 'Forgot Password'.";
    }
    if (status >= 500) {
      return "Server is currently unavailable. Please contact support if this persists.";
    }

    const detail = error.response.data?.detail || error.response.data?.non_field_errors?.[0];
    if (detail) {
      const lowered = String(detail).toLowerCase();
      if (lowered.includes("invalid") || lowered.includes("no active account")) {
        return "Invalid username/email or password.";
      }
      if (lowered.includes("verification")) {
        return "Your account requires email verification. Please check your email for the OTP.";
      }
    }

    return "Login failed. Please verify your credentials and try again.";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const user = await login(form);
      if (!user?.is_email_verified) {
        addToast({
          type: "info",
          message: "Login successful! Please verify your email from your profile.",
        });
      } else {
        addToast({ type: "success", message: "Login successful! Welcome back" });
      }
      navigate(user?.is_admin ? "/admin/dashboard" : "/user/dashboard");
    } catch (error) {
      addToast({ type: "error", message: getLoginErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <PageTransition>
        <section className="auth-page auth-page-wide login-page">
          <div className="auth-experience">
            <aside className="auth-intro-panel login-intro-panel">
              <Link to="/" className="auth-brand">
                <img src={companyLogo} alt="SIA Software Innovations logo" className="auth-brand-logo" />
                <span className="auth-brand-text">
                  <strong>SIA Software Innovations Private Limited</strong>
                  <span>ACCESS BEYOND LIMITS</span>
                </span>
              </Link>
              <p className="auth-eyebrow">AI and Quantum Learners</p>
              <h1 className="auth-intro-title">
                Continue your technical learning path with <span className="auth-highlight">clarity and momentum</span>.
              </h1>
              <p className="auth-intro-copy">
                Access professional courses in Data Science, ML, DL, Prompt Engineering, and Quantum Computing with one secure sign in.
              </p>
              <div className="auth-kpi-grid">
                <article className="auth-kpi-card">
                  <span className="auth-kpi-icon">
                    <HiOutlineBookOpen />
                  </span>
                  <span className="auth-kpi-content">
                    <strong>Skill-Focused Tracks</strong>
                    <span>Resume practical AI and quantum modules.</span>
                  </span>
                </article>
                <article className="auth-kpi-card">
                  <span className="auth-kpi-icon">
                    <HiOutlineChartBar />
                  </span>
                  <span className="auth-kpi-content">
                    <strong>Progress Intelligence</strong>
                    <span>Monitor learning, billing, and course outcomes.</span>
                  </span>
                </article>
              </div>
              <p className="auth-form-note">
                <HiOutlineShieldCheck />
                24x7 support is available for education-only course guidance and roadmap questions.
              </p>
            </aside>

            <article className="auth-form-panel login-form-panel">
              <div className="auth-form-heading">
                <h2 className="card-title">
                  <HiOutlineUserCircle />
                  Login
                </h2>
                <p>Use your username or email and password.</p>
              </div>

              <form className="stack-form auth-form-stack" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="username">Username or Email</label>
                  <input
                    id="username"
                    value={form.username}
                    onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
                    placeholder="Enter username or email"
                    required
                  />
                </div>

                <div>
                  <div className="auth-label-row">
                    <label htmlFor="password">Password</label>
                    <Link to="/forgot-password" className="auth-link-subtle">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="auth-input-wrap">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                      placeholder="Enter password"
                      required
                    />
                    <button type="button" className="auth-inline-btn" onClick={() => setShowPassword((prev) => !prev)}>
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <p className="auth-form-note">
                  <HiOutlineKey />
                  Access refreshes automatically while your session stays active.
                </p>

                <button type="submit" className="btn btn-primary btn-icon auth-action-btn" disabled={loading}>
                  <HiOutlineArrowRightOnRectangle />
                  {loading ? "Logging in..." : "Login to Dashboard"}
                </button>
              </form>

              <div className="auth-divider">Need a new account?</div>
              <div className="auth-foot-links">
                <span>New to SIA Software Innovations Private Limited?</span>
                <Link to="/signup">
                  <HiOutlineBolt /> Create account
                </Link>
              </div>
            </article>
          </div>
        </section>
      </PageTransition>
    </MainLayout>
  );
}
