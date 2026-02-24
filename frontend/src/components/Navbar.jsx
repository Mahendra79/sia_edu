import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  HiArrowRightOnRectangle,
  HiBars3,
  HiOutlineAcademicCap,
  HiOutlineHome,
  HiOutlineMoon,
  HiOutlineSun,
  HiOutlineUserCircle,
  HiXMark,
} from "react-icons/hi2";

import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { API_BASE_URL } from "../services/api";
import companyLogo from "../assets/image.webp";

const themeIconMap = {
  navy: HiOutlineAcademicCap,
  light: HiOutlineSun,
  dark: HiOutlineMoon,
};

export default function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const ThemeIcon = themeIconMap[theme] || HiOutlineAcademicCap;

  useEffect(() => {
    const handleScroll = () => {
      const nextScrolled = window.scrollY > 8;
      setIsScrolled((previous) => (previous === nextScrolled ? previous : nextScrolled));
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 980) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = async () => {
    await logout();
    closeMenu();
    navigate("/login");
  };

  const resolveAvatarUrl = (avatarPath) => {
    if (!avatarPath) {
      return "";
    }
    if (/^https?:\/\//i.test(avatarPath) || avatarPath.startsWith("data:")) {
      return avatarPath;
    }
    const normalizedPath = String(avatarPath).replace(/\\/g, "/");
    const apiOrigin = /^https?:\/\//i.test(API_BASE_URL) ? new URL(API_BASE_URL).origin : window.location.origin;
    return new URL(normalizedPath, `${apiOrigin}/`).toString();
  };

  const avatarUrl = resolveAvatarUrl(user?.avatar);

  return (
    <nav className={`navbar ${isScrolled ? "is-scrolled" : ""} ${menuOpen ? "is-menu-open" : ""}`.trim()}>
      <Link className="logo" to="/">
        <span className="logo-image-shell">
          <img
            src={companyLogo}
            alt="SIA Software Innovations logo"
            className="logo-image"
            loading="lazy"
            decoding="async"
          />
        </span>
        <span className="logo-text">
          <strong>SIA</strong>
          <span>Software Innovations</span>
        </span>
      </Link>
      <button
        type="button"
        className="btn btn-muted btn-icon navbar-menu-toggle"
        aria-expanded={menuOpen}
        aria-controls="navbar-menu"
        onClick={() => setMenuOpen((prev) => !prev)}
      >
        {menuOpen ? <HiXMark /> : <HiBars3 />}
        {menuOpen ? "Close" : "Menu"}
      </button>
      <div id="navbar-menu" className="navbar-menu">
        <div className="nav-links">
          <NavLink to="/" className="nav-link-item" onClick={closeMenu}>
            <HiOutlineHome />
            Home
          </NavLink>
          {!isAuthenticated && (
            <NavLink to="/login" className="nav-link-item" onClick={closeMenu}>
              <HiOutlineUserCircle />
              Login
            </NavLink>
          )}
          {!isAuthenticated && (
            <NavLink to="/signup" className="nav-link-item" onClick={closeMenu}>
              <HiOutlineAcademicCap />
              Signup
            </NavLink>
          )}
          {isAuthenticated && isAdmin && (
            <NavLink to="/admin/dashboard" className="nav-link-item" onClick={closeMenu}>
              <HiOutlineAcademicCap />
              Admin
            </NavLink>
          )}
          {isAuthenticated && !isAdmin && (
            <NavLink to="/user/dashboard" className="nav-link-item" onClick={closeMenu}>
              <HiOutlineAcademicCap />
              Dashboard
            </NavLink>
          )}
        </div>
        <div className="nav-actions">
          <button type="button" className="btn btn-muted btn-icon" onClick={toggleTheme}>
            <ThemeIcon />
            Theme: {theme}
          </button>
          {isAuthenticated && (
            <>
              <Link to={isAdmin ? "/admin/profile" : "/user/profile"} className="user-badge user-badge-link" onClick={closeMenu}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt={`${user?.username || "User"} avatar`} className="user-badge-avatar" />
                ) : (
                  <HiOutlineUserCircle />
                )}
                {user?.username}
              </Link>
              <button type="button" className="btn btn-danger btn-icon" onClick={handleLogout}>
                <HiArrowRightOnRectangle />
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
