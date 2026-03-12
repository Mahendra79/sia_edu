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

  const isValidEmail = (value) => /\S+@\S+\.\S+/.test(value);
  const isValidPhone = (value) => /^\d{10}$/.test(value);
  const isValidName = (value) => /^[A-Za-z ]+$/.test(value);
  const isStrongPassword = (value) =>
    value.length >= 8 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value);

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

    const trimmed = {
      name: form.name.trim(),
      username: form.username.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      password: form.password,
      confirm_password: form.confirm_password,
    };

    if (!trimmed.name || !trimmed.username || !trimmed.email || !trimmed.phone || !trimmed.password || !trimmed.confirm_password) {
      addToast({ type: "error", message: "All fields are required. Please fill in the missing information." });
      return;
    }
    if (!isValidName(trimmed.name)) {
      addToast({ type: "error", message: "Full name can contain letters and spaces only." });
      return;
    }
    if (!isValidEmail(trimmed.email)) {
      addToast({ type: "error", message: "Please enter a valid email address." });
      return;
    }
    if (!isValidPhone(trimmed.phone)) {
      addToast({ type: "error", message: "Please enter a valid phone number (e.g.,9874563210)." });
      return;
    }
    if (!isStrongPassword(trimmed.password)) {
      addToast({
        type: "error",
        message: "Password must be at least 8 characters with uppercase, lowercase, number, and special character.",
      });
      return;
    }
    if (trimmed.password !== trimmed.confirm_password) {
      addToast({ type: "error", message: "Passwords do not match. Please confirm your password." });
      return;
    }

    setLoading(true);

    try {
      const response = await signup(trimmed);
      const requiresVerification =
        response?.requires_email_verification || !response?.user?.is_email_verified;
      const successMessage = requiresVerification
        ? "Account created! Please check your email for a verification code to complete setup."
        : "Welcome to SIA! Your account has been created successfully. You're now logged in.";
      addToast({
        type: "success",
        message: successMessage,
      });
      if (response?.access && response?.refresh && response?.user) {
        navigate(response.user?.is_admin ? "/admin/dashboard" : "/user/dashboard");
      } else {
        navigate("/login");
      }
    } catch (error) {
      if (!error?.response) {
        addToast({
          type: "error",
          message: "Unable to create account right now. Please try again later or contact support.",
        });
        return;
      }

      const status = error.response.status;
      if (status === 429) {
        addToast({
          type: "error",
          message: "Too many signup attempts. Please wait 5 minutes before trying again.",
        });
        return;
      }
      if (status >= 500) {
        addToast({
          type: "error",
          message: "Unable to create account right now. Please try again later or contact support.",
        });
        return;
      }

      const responseData = error.response?.data || {};
      if (responseData.detail) {
        addToast({ type: "error", message: responseData.detail });
        return;
      }
      if (responseData.name) {
        addToast({ type: "error", message: "Full name can contain letters and spaces only." });
        return;
      }
      if (responseData.email) {
        const emailMessage = String(responseData.email[0] || "");
        addToast({
          type: "error",
          message: emailMessage.toLowerCase().includes("valid")
            ? "Please enter a valid email address."
            : "This email is already registered.",
        });
        return;
      }
      if (responseData.username) {
        addToast({ type: "error", message: "Username is unavailable. Please choose a different one." });
        return;
      }
      if (responseData.phone) {
        addToast({ type: "error", message: "Please enter a valid phone number (e.g.,9874563210)." });
        return;
      }
      if (responseData.password) {
        addToast({
          type: "error",
          message: "Password must be at least 8 characters with uppercase, lowercase, number, and special character.",
        });
        return;
      }
      if (responseData.confirm_password) {
        addToast({ type: "error", message: "Passwords do not match. Please confirm your password." });
        return;
      }

      addToast({
        type: "error",
        message: "Signup failed due to invalid inputs. Please review and try again.",
      });
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
                  24x7 support trained only for education course assistance.
                </li>
              </ul>

              <div className="signup-trust-strip">
                <span>
                  <strong>24x7</strong>
                  <small>Support</small>
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
