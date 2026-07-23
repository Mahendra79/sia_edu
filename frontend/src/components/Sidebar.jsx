import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import {
  HiArrowRightOnRectangle,
  HiBars3,
  HiOutlineAcademicCap,
  HiOutlineBookOpen,
  HiOutlineChartBar,
  HiOutlineCircleStack,
  HiOutlineCpuChip,
  HiOutlineCreditCard,
  HiOutlineHome,
  HiOutlineMoon,
  HiOutlinePresentationChartBar,
  HiOutlineSparkles,
  HiOutlineSquares2X2,
  HiOutlineSun,
  HiOutlineUserCircle,
  HiOutlineUsers,
  HiOutlineViewColumns,
} from "react-icons/hi2";

import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { API_BASE_URL } from "../services/api";
import companyLogo from "../assets/image.webp";

const THEME_ICON_MAP = {
  light: HiOutlineSun,
  dark: HiOutlineMoon,
};

function resolveAvatarUrl(avatarPath) {
  if (!avatarPath) {
    return "";
  }
  if (/^https?:\/\//i.test(avatarPath) || avatarPath.startsWith("data:")) {
    return avatarPath;
  }
  const normalizedPath = String(avatarPath).replace(/\\/g, "/");
  const apiOrigin = /^https?:\/\//i.test(API_BASE_URL) ? new URL(API_BASE_URL).origin : window.location.origin;
  return new URL(normalizedPath, `${apiOrigin}/`).toString();
}

export default function Sidebar({ extra }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isAdmin, logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(location.pathname);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("sidebar-collapsed") === "true";
  });
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth > 980);
  const [tooltip, setTooltip] = useState(null);

  // The icon-only "collapsed rail" is a desktop-only layout (see the
  // min-width: 981px media query in layouts.css). On mobile the hamburger
  // menu always shows full labels regardless of the saved desktop preference.
  const effectiveCollapsed = isCollapsed && isDesktop;

  const ThemeIcon = THEME_ICON_MAP[theme] || HiOutlineAcademicCap;

  const showTooltip = (event, label) => {
    if (!effectiveCollapsed || !label) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({ label, top: rect.top + rect.height / 2, left: rect.right + 12 });
  };
  const hideTooltip = () => setTooltip(null);

  if (location.pathname !== lastPathname) {
    setLastPathname(location.pathname);
    setIsOpen(false);
  }

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  };

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth > 980);
      if (window.innerWidth > 980) {
        setIsOpen(false);
      }
    };
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const closeSidebar = () => setIsOpen(false);

  const handleLogout = async () => {
    await logout();
    closeSidebar();
    navigate("/login");
  };

  const avatarUrl = resolveAvatarUrl(user?.avatar);
  const displayName = String(user?.name || user?.username || "").trim().split(/\s+/)[0];

  return (
    <>
      <div className={`sidebar-mobile-bar ${isOpen ? "is-menu-open" : ""}`.trim()}>
        <button
          type="button"
          className="sidebar-mobile-toggle"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-controls="app-sidebar"
          aria-label="Open menu"
        >
          <HiBars3 />
        </button>
        {isAuthenticated ? (
          <p className="sidebar-mobile-greeting">
            Hello, {displayName || "there"} <span aria-hidden="true">👋</span>
          </p>
        ) : null}
      </div>
      {isOpen ? <button type="button" className="sidebar-backdrop" aria-label="Close menu" onClick={closeSidebar} /> : null}

      <aside id="app-sidebar" className={`app-sidebar ${isOpen ? "is-open" : ""} ${effectiveCollapsed ? "is-collapsed" : ""}`.trim()}>
        <div className="app-sidebar-header">
          <Link className="app-sidebar-brand" to="/" onClick={closeSidebar} onMouseEnter={(event) => showTooltip(event, "SIA Software Innovations")} onMouseLeave={hideTooltip} onFocus={(event) => showTooltip(event, "SIA Software Innovations")} onBlur={hideTooltip} aria-label={effectiveCollapsed ? "SIA Software Innovations" : undefined}>
            <span className="app-sidebar-logo">
              <img src={companyLogo} alt="SIA Software Innovations logo" loading="lazy" decoding="async" />
            </span>
            {!effectiveCollapsed && (
              <span className="app-sidebar-brand-text">
                <strong>SIA</strong>
                <span>Software Innovations</span>
              </span>
            )}
          </Link>
          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={handleToggleCollapse}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? (
              <PanelLeftOpen size={20} className="sidebar-toggle-icon" />
            ) : (
              <PanelLeftClose size={20} className="sidebar-toggle-icon" />
            )}
          </button>
        </div>

        <nav className="app-sidebar-nav">
          <NavLink end to="/" className="app-sidebar-link" onClick={closeSidebar} onMouseEnter={(event) => showTooltip(event, "Home")} onMouseLeave={hideTooltip} onFocus={(event) => showTooltip(event, "Home")} onBlur={hideTooltip} aria-label={effectiveCollapsed ? "Home" : undefined}>
            <HiOutlineHome />
            {!effectiveCollapsed && <span>Home</span>}
          </NavLink>

          {!isAuthenticated ? (
            <>
              <NavLink to="/login" className="app-sidebar-link" onClick={closeSidebar} onMouseEnter={(event) => showTooltip(event, "Login")} onMouseLeave={hideTooltip} onFocus={(event) => showTooltip(event, "Login")} onBlur={hideTooltip} aria-label={effectiveCollapsed ? "Login" : undefined}>
                <HiOutlineUserCircle />
                {!effectiveCollapsed && <span>Login</span>}
              </NavLink>
              <NavLink to="/signup" className="app-sidebar-link" onClick={closeSidebar} onMouseEnter={(event) => showTooltip(event, "Signup")} onMouseLeave={hideTooltip} onFocus={(event) => showTooltip(event, "Signup")} onBlur={hideTooltip} aria-label={effectiveCollapsed ? "Signup" : undefined}>
                <HiOutlineAcademicCap />
                {!effectiveCollapsed && <span>Signup</span>}
              </NavLink>
            </>
          ) : null}

          {isAuthenticated && !isAdmin ? (
            <>
              <NavLink to="/user/dashboard" className="app-sidebar-link" onClick={closeSidebar} onMouseEnter={(event) => showTooltip(event, "Dashboard")} onMouseLeave={hideTooltip} onFocus={(event) => showTooltip(event, "Dashboard")} onBlur={hideTooltip} aria-label={effectiveCollapsed ? "Dashboard" : undefined}>
                <HiOutlineViewColumns />
                {!effectiveCollapsed && <span>Dashboard</span>}
              </NavLink>
              <NavLink to="/user/my-courses" className="app-sidebar-link" onClick={closeSidebar} onMouseEnter={(event) => showTooltip(event, "My Courses")} onMouseLeave={hideTooltip} onFocus={(event) => showTooltip(event, "My Courses")} onBlur={hideTooltip} aria-label={effectiveCollapsed ? "My Courses" : undefined}>
                <HiOutlineSquares2X2 />
                {!effectiveCollapsed && <span>My Courses</span>}
              </NavLink>
              <NavLink to="/user/payment-history" className="app-sidebar-link" onClick={closeSidebar} onMouseEnter={(event) => showTooltip(event, "Payment History")} onMouseLeave={hideTooltip} onFocus={(event) => showTooltip(event, "Payment History")} onBlur={hideTooltip} aria-label={effectiveCollapsed ? "Payment History" : undefined}>
                <HiOutlineCreditCard />
                {!effectiveCollapsed && <span>Payment History</span>}
              </NavLink>
              <NavLink to="/user/profile" className="app-sidebar-link" onClick={closeSidebar} onMouseEnter={(event) => showTooltip(event, "Profile")} onMouseLeave={hideTooltip} onFocus={(event) => showTooltip(event, "Profile")} onBlur={hideTooltip} aria-label={effectiveCollapsed ? "Profile" : undefined}>
                <HiOutlineUserCircle />
                {!effectiveCollapsed && <span>Profile</span>}
              </NavLink>
            </>
          ) : null}

          {isAuthenticated && isAdmin ? (
            <>
              <NavLink to="/admin/dashboard" className="app-sidebar-link" onClick={closeSidebar} onMouseEnter={(event) => showTooltip(event, "Dashboard")} onMouseLeave={hideTooltip} onFocus={(event) => showTooltip(event, "Dashboard")} onBlur={hideTooltip} aria-label={effectiveCollapsed ? "Dashboard" : undefined}>
                <HiOutlineChartBar />
                {!effectiveCollapsed && <span>Dashboard</span>}
              </NavLink>
              <NavLink to="/admin/courses" className="app-sidebar-link" onClick={closeSidebar} onMouseEnter={(event) => showTooltip(event, "Manage Courses")} onMouseLeave={hideTooltip} onFocus={(event) => showTooltip(event, "Manage Courses")} onBlur={hideTooltip} aria-label={effectiveCollapsed ? "Manage Courses" : undefined}>
                <HiOutlineSquares2X2 />
                {!effectiveCollapsed && <span>Manage Courses</span>}
              </NavLink>
              <NavLink to="/admin/users" className="app-sidebar-link" onClick={closeSidebar} onMouseEnter={(event) => showTooltip(event, "Manage Users")} onMouseLeave={hideTooltip} onFocus={(event) => showTooltip(event, "Manage Users")} onBlur={hideTooltip} aria-label={effectiveCollapsed ? "Manage Users" : undefined}>
                <HiOutlineUsers />
                {!effectiveCollapsed && <span>Manage Users</span>}
              </NavLink>
              <NavLink to="/admin/payments" className="app-sidebar-link" onClick={closeSidebar} onMouseEnter={(event) => showTooltip(event, "Payments")} onMouseLeave={hideTooltip} onFocus={(event) => showTooltip(event, "Payments")} onBlur={hideTooltip} aria-label={effectiveCollapsed ? "Payments" : undefined}>
                <HiOutlineCreditCard />
                {!effectiveCollapsed && <span>Payments</span>}
              </NavLink>
              <NavLink to="/admin/database" className="app-sidebar-link" onClick={closeSidebar} onMouseEnter={(event) => showTooltip(event, "Database Edit")} onMouseLeave={hideTooltip} onFocus={(event) => showTooltip(event, "Database Edit")} onBlur={hideTooltip} aria-label={effectiveCollapsed ? "Database Edit" : undefined}>
                <HiOutlineCircleStack />
                {!effectiveCollapsed && <span>Database Edit</span>}
              </NavLink>
              <NavLink to="/admin/reports" className="app-sidebar-link" onClick={closeSidebar} onMouseEnter={(event) => showTooltip(event, "MIS Reports")} onMouseLeave={hideTooltip} onFocus={(event) => showTooltip(event, "MIS Reports")} onBlur={hideTooltip} aria-label={effectiveCollapsed ? "MIS Reports" : undefined}>
                <HiOutlinePresentationChartBar />
                {!effectiveCollapsed && <span>MIS Reports</span>}
              </NavLink>
              <NavLink to="/admin/chatbot" className="app-sidebar-link" onClick={closeSidebar} onMouseEnter={(event) => showTooltip(event, "Chatbot QA")} onMouseLeave={hideTooltip} onFocus={(event) => showTooltip(event, "Chatbot QA")} onBlur={hideTooltip} aria-label={effectiveCollapsed ? "Chatbot QA" : undefined}>
                <HiOutlineCpuChip />
                {!effectiveCollapsed && <span>Chatbot QA</span>}
              </NavLink>
              <NavLink to="/admin/lms" className="app-sidebar-link" onClick={closeSidebar} onMouseEnter={(event) => showTooltip(event, "LMS")} onMouseLeave={hideTooltip} onFocus={(event) => showTooltip(event, "LMS")} onBlur={hideTooltip} aria-label={effectiveCollapsed ? "LMS" : undefined}>
                <HiOutlineBookOpen />
                {!effectiveCollapsed && <span>LMS</span>}
              </NavLink>
              <NavLink to="/admin/quiz" className="app-sidebar-link" onClick={closeSidebar} onMouseEnter={(event) => showTooltip(event, "Quiz")} onMouseLeave={hideTooltip} onFocus={(event) => showTooltip(event, "Quiz")} onBlur={hideTooltip} aria-label={effectiveCollapsed ? "Quiz" : undefined}>
                <HiOutlineAcademicCap />
                {!effectiveCollapsed && <span>Quiz</span>}
              </NavLink>
              <NavLink to="/admin/profile" className="app-sidebar-link" onClick={closeSidebar} onMouseEnter={(event) => showTooltip(event, "Profile")} onMouseLeave={hideTooltip} onFocus={(event) => showTooltip(event, "Profile")} onBlur={hideTooltip} aria-label={effectiveCollapsed ? "Profile" : undefined}>
                <HiOutlineUserCircle />
                {!effectiveCollapsed && <span>Profile</span>}
              </NavLink>
            </>
          ) : null}
        </nav>

        {extra && !effectiveCollapsed ? <div className="app-sidebar-extra">{extra}</div> : null}

        {isAuthenticated && !isAdmin && !effectiveCollapsed ? (
          <div className="app-sidebar-promo">
            <span className="app-sidebar-promo-icon">
              <HiOutlineSparkles />
            </span>
            <strong>Keep learning, keep growing!</strong>
            <p>Continue your journey towards mastery.</p>
          </div>
        ) : null}

        {!isAuthenticated && !effectiveCollapsed ? (
          <div className="app-sidebar-promo">
            <span className="app-sidebar-promo-icon">
              <HiOutlineSparkles />
            </span>
            <strong>Access beyond limits</strong>
            <p>Create a free account to track enrollments and progress.</p>
          </div>
        ) : null}

        <div className="app-sidebar-footer">
          <button
            type="button"
            className="btn btn-muted btn-icon app-sidebar-theme-btn"
            onClick={toggleTheme}
            aria-label={`Theme: ${theme}`}
            title={`Theme: ${theme}`}
          >
            <ThemeIcon />
          </button>
          {isAuthenticated ? (
            <>
              <Link
                to={isAdmin ? "/admin/profile" : "/user/profile"}
                className="user-badge user-badge-link app-sidebar-user"
                onClick={closeSidebar}
                onMouseEnter={(event) => showTooltip(event, user?.username)}
                onMouseLeave={hideTooltip}
                onFocus={(event) => showTooltip(event, user?.username)}
                onBlur={hideTooltip}
                aria-label={effectiveCollapsed ? user?.username : undefined}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={`${user?.username || "User"} avatar`} className="user-badge-avatar" />
                ) : (
                  <HiOutlineUserCircle />
                )}
                {!effectiveCollapsed && <span>{user?.username}</span>}
              </Link>
              <button type="button" className="btn btn-danger btn-icon app-sidebar-logout" onClick={handleLogout} aria-label="Logout" title="Logout">
                <HiArrowRightOnRectangle />
              </button>
            </>
          ) : null}
        </div>
      </aside>

      {tooltip
        ? createPortal(
            <div
              className="sidebar-portal-tooltip"
              style={{ top: `${tooltip.top}px`, left: `${tooltip.left}px` }}
            >
              {tooltip.label}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
