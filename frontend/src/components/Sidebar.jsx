import { useEffect, useState } from "react";
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

  const ThemeIcon = THEME_ICON_MAP[theme] || HiOutlineAcademicCap;

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

      <aside id="app-sidebar" className={`app-sidebar ${isOpen ? "is-open" : ""} ${isCollapsed ? "is-collapsed" : ""}`.trim()}>
        <div className="app-sidebar-header">
          <Link className="app-sidebar-brand" to="/" onClick={closeSidebar}>
            <span className="app-sidebar-logo">
              <img src={companyLogo} alt="SIA Software Innovations logo" loading="lazy" decoding="async" />
            </span>
            {!isCollapsed && (
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
          <NavLink end to="/" className="app-sidebar-link" onClick={closeSidebar}>
            <HiOutlineHome />
            {!isCollapsed && <span>Home</span>}
          </NavLink>

          {!isAuthenticated ? (
            <>
              <NavLink to="/login" className="app-sidebar-link" onClick={closeSidebar}>
                <HiOutlineUserCircle />
                {!isCollapsed && <span>Login</span>}
              </NavLink>
              <NavLink to="/signup" className="app-sidebar-link" onClick={closeSidebar}>
                <HiOutlineAcademicCap />
                {!isCollapsed && <span>Signup</span>}
              </NavLink>
            </>
          ) : null}

          {isAuthenticated && !isAdmin ? (
            <>
              <NavLink to="/user/dashboard" className="app-sidebar-link" onClick={closeSidebar}>
                <HiOutlineViewColumns />
                {!isCollapsed && <span>Dashboard</span>}
              </NavLink>
              <NavLink to="/user/my-courses" className="app-sidebar-link" onClick={closeSidebar}>
                <HiOutlineSquares2X2 />
                {!isCollapsed && <span>My Courses</span>}
              </NavLink>
              <NavLink to="/user/payment-history" className="app-sidebar-link" onClick={closeSidebar}>
                <HiOutlineCreditCard />
                {!isCollapsed && <span>Payment History</span>}
              </NavLink>
              <NavLink to="/user/profile" className="app-sidebar-link" onClick={closeSidebar}>
                <HiOutlineUserCircle />
                {!isCollapsed && <span>Profile</span>}
              </NavLink>
            </>
          ) : null}

          {isAuthenticated && isAdmin ? (
            <>
              <NavLink to="/admin/dashboard" className="app-sidebar-link" onClick={closeSidebar}>
                <HiOutlineChartBar />
                {!isCollapsed && <span>Dashboard</span>}
              </NavLink>
              <NavLink to="/admin/courses" className="app-sidebar-link" onClick={closeSidebar}>
                <HiOutlineSquares2X2 />
                {!isCollapsed && <span>Manage Courses</span>}
              </NavLink>
              <NavLink to="/admin/users" className="app-sidebar-link" onClick={closeSidebar}>
                <HiOutlineUsers />
                {!isCollapsed && <span>Manage Users</span>}
              </NavLink>
              <NavLink to="/admin/payments" className="app-sidebar-link" onClick={closeSidebar}>
                <HiOutlineCreditCard />
                {!isCollapsed && <span>Payments</span>}
              </NavLink>
              <NavLink to="/admin/database" className="app-sidebar-link" onClick={closeSidebar}>
                <HiOutlineCircleStack />
                {!isCollapsed && <span>Database Edit</span>}
              </NavLink>
              <NavLink to="/admin/reports" className="app-sidebar-link" onClick={closeSidebar}>
                <HiOutlinePresentationChartBar />
                {!isCollapsed && <span>MIS Reports</span>}
              </NavLink>
              <NavLink to="/admin/chatbot" className="app-sidebar-link" onClick={closeSidebar}>
                <HiOutlineCpuChip />
                {!isCollapsed && <span>Chatbot QA</span>}
              </NavLink>
              <NavLink to="/admin/lms" className="app-sidebar-link" onClick={closeSidebar}>
                <HiOutlineBookOpen />
                {!isCollapsed && <span>LMS</span>}
              </NavLink>
              <NavLink to="/admin/quiz" className="app-sidebar-link" onClick={closeSidebar}>
                <HiOutlineAcademicCap />
                {!isCollapsed && <span>Quiz</span>}
              </NavLink>
              <NavLink to="/admin/profile" className="app-sidebar-link" onClick={closeSidebar}>
                <HiOutlineUserCircle />
                {!isCollapsed && <span>Profile</span>}
              </NavLink>
            </>
          ) : null}
        </nav>

        {extra && !isCollapsed ? <div className="app-sidebar-extra">{extra}</div> : null}

        {isAuthenticated && !isAdmin && !isCollapsed ? (
          <div className="app-sidebar-promo">
            <span className="app-sidebar-promo-icon">
              <HiOutlineSparkles />
            </span>
            <strong>Keep learning, keep growing!</strong>
            <p>Continue your journey towards mastery.</p>
          </div>
        ) : null}

        {!isAuthenticated && !isCollapsed ? (
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
                title={isCollapsed ? user?.username : undefined}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={`${user?.username || "User"} avatar`} className="user-badge-avatar" />
                ) : (
                  <HiOutlineUserCircle />
                )}
                {!isCollapsed && <span>{user?.username}</span>}
              </Link>
              <button type="button" className="btn btn-danger btn-icon app-sidebar-logout" onClick={handleLogout} aria-label="Logout" title="Logout">
                <HiArrowRightOnRectangle />
              </button>
            </>
          ) : null}
        </div>
      </aside>
    </>
  );
}
