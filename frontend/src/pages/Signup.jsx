import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  HiOutlineArrowRightOnRectangle,
  HiOutlineBolt,
  HiOutlineBookOpen,
  HiOutlineCheckBadge,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
} from "react-icons/hi2";

import PageTransition from "../components/PageTransition";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import MainLayout from "../layouts/MainLayout";
import companyLogo from "../assets/image.webp";
import "./AuthPages.css";
import "./Signup.css";

const INITIAL_FORM = {
  name: "",
  username: "",
  email: "",
  phone: "",
  password: "",
  confirm_password: "",
};

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const { addToast } = useToast();
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const passwordStrength = useMemo(() => {
    const password = form.password || "";
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
  }, [form.password]);

  const passwordsMatch = Boolean(form.confirm_password) && form.password === form.confirm_password;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await signup(form);
      addToast({
        type: "success",
        message: response?.message || "Account ready. Logged in successfully.",
      });
      if (response?.access && response?.refresh && response?.user) {
        if (response?.requires_email_verification || !response.user?.is_email_verified) {
          navigate(`/verify-email?email=${encodeURIComponent(response.user.email || "")}`);
        } else {
          navigate(response.user?.is_admin ? "/admin/dashboard" : "/user/dashboard");
        }
      } else {
        navigate("/login");
      }
    } catch (error) {
      const responseData = error.response?.data;
      const firstError =
        typeof responseData === "object"
          ? Object.values(responseData).flat()[0]
          : "Signup failed. Check your inputs.";
      addToast({ type: "error", message: firstError || "Signup failed." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <PageTransition>
        <section className="auth-page auth-page-wide signup-page">
          <div className="auth-experience signup-experience">
            <aside className="auth-intro-panel signup-intro-panel">
              <Link to="/" className="auth-brand">
                <img src={companyLogo} alt="SIA Software Innovations logo" className="auth-brand-logo" />
                <span className="auth-brand-text">
                  <strong>SIA Software Innovations Private Limited</strong>
                  <span>ACCESS BEYOND LIMITS</span>
                </span>
              </Link>
              <p className="auth-eyebrow">AI and Quantum Skill Path</p>
              <h1 className="auth-intro-title">
                Create your professional learning account for <span className="auth-highlight">high-impact technical skills</span>.
              </h1>
              <p className="auth-intro-copy">
                Join focused programs in Data Science, ML, DL, Prompt Engineering, and Quantum Computing with measurable outcomes.
              </p>

              <ul className="auth-list">
                <li className="auth-list-item">
                  <HiOutlineCheckBadge />
                  Production-style projects for real technical capability building.
                </li>
                <li className="auth-list-item">
                  <HiOutlineBookOpen />
                  Research-backed AI and quantum curriculum with clear progression.
                </li>
                <li className="auth-list-item">
                  <HiOutlineShieldCheck />
                  24x7 SIA_Chat support trained only for education course assistance.
                </li>
              </ul>

              <div className="signup-trust-strip">
                <span>
                  <strong>24x7</strong>
                  <small>SIA_Chat Support</small>
                </span>
                <span>
                  <strong>Skill</strong>
                  <small>Assessment Path</small>
                </span>
                <span>
                  <strong>Real</strong>
                  <small>Project Practice</small>
                </span>
              </div>
            </aside>

            <article className="auth-form-panel signup-form-panel">
              <div className="auth-form-heading">
                <h2 className="card-title">
                  <HiOutlineSparkles />
                  Create Account
                </h2>
                <p>Fill your details to start a structured AI and quantum learning journey.</p>
              </div>

              <form className="stack-form auth-grid-form signup-form-grid" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="name">Full Name</label>
                  <input id="name" value={form.name} onChange={(event) => handleChange("name", event.target.value)} required />
                </div>
                <div>
                  <label htmlFor="username">Username</label>
                  <input
                    id="username"
                    value={form.username}
                    onChange={(event) => handleChange("username", event.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(event) => handleChange("email", event.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="phone">Phone</label>
                  <input
                    id="phone"
                    value={form.phone}
                    onChange={(event) => handleChange("phone", event.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="password">Password</label>
                  <div className="auth-input-wrap">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(event) => handleChange("password", event.target.value)}
                      required
                    />
                    <button type="button" className="auth-inline-btn" onClick={() => setShowPassword((prev) => !prev)}>
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="confirm_password">Confirm Password</label>
                  <div className="auth-input-wrap">
                    <input
                      id="confirm_password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={form.confirm_password}
                      onChange={(event) => handleChange("confirm_password", event.target.value)}
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
                </div>

                <div className="signup-meta signup-strength-meta">
                  <span>Password Strength</span>
                  <strong>{passwordStrength.label}</strong>
                  <div className="signup-strength-track">
                    <span className={`signup-strength-fill level-${passwordStrength.score}`} />
                  </div>
                </div>
                <div className={`signup-meta ${passwordsMatch ? "match-ok" : "match-pending"}`}>
                  <span>Confirm Password</span>
                  <strong>{form.confirm_password ? (passwordsMatch ? "Matched" : "Not matching") : "Waiting input"}</strong>
                </div>

                <p className="auth-form-note signup-policy-note">
                  <HiOutlineShieldCheck />
                  By creating an account, you agree to secure session and identity validation checks.
                </p>

                <button type="submit" className="btn btn-primary btn-icon auth-action-btn" disabled={loading}>
                  <HiOutlineArrowRightOnRectangle />
                  {loading ? "Creating..." : "Create Account"}
                </button>
              </form>

              <div className="auth-divider">Already registered?</div>
              <div className="auth-foot-links">
                <span>Have an account?</span>
                <Link to="/login">
                  <HiOutlineBolt /> Login now
                </Link>
              </div>
            </article>
          </div>
        </section>
      </PageTransition>
    </MainLayout>
  );
}
