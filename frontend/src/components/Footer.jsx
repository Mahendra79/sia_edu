import { FaInstagram, FaLinkedinIn, FaYoutube } from "react-icons/fa";
import { Link } from "react-router-dom";

import companyLogo from "../assets/image.webp";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer-top">
        <section className="site-footer-section site-footer-brand-block">
          <div className="site-footer-brand">
            <img
              src={companyLogo}
              alt="SIA Software Innovations logo"
              className="site-footer-logo"
              loading="lazy"
              decoding="async"
            />
            <div className="site-footer-brand-text">
              <strong>SIA Software Innovations Private Limited</strong>
              <span>ACCESS BEYOND LIMITS</span>
            </div>
          </div>
          <p className="site-footer-tagline">
            Professional learning platform for AI, ML, Data Science, and Quantum Computing programs.
          </p>
        </section>

        <section className="site-footer-section">
          <h3>Company</h3>
          <p className="site-footer-meta">
            <span>CIN:</span> U62013AP2025PTC122642
          </p>
          <p className="site-footer-meta">
            <span>DPIIT Recognition:</span> DIPP235818
          </p>
        </section>

        <section className="site-footer-section">
          <h3>Platform</h3>
          <div className="site-footer-links">
            <Link to="/privacy" aria-label="Privacy">
              Privacy Policy
            </Link>
            <Link to="/terms" aria-label="Terms">
              Terms of Use
            </Link>
            <Link to="/login" aria-label="Login">
              Login
            </Link>
            <Link to="/signup" aria-label="Signup">
              Signup
            </Link>
          </div>
        </section>

        <section className="site-footer-section">
          <h3>Connect</h3>
          <div className="site-footer-contact-list">
            <p className="site-footer-contact-item">
              <span>General Information</span>
              <a href="mailto:info@siasoftwareinnovations.com">info@siasoftwareinnovations.com</a>
            </p>
            <p className="site-footer-contact-item">
              <span>Product &amp; Collaboration</span>
              <a href="mailto:contact@siasoftwareinnovations.com">contact@siasoftwareinnovations.com</a>
            </p>
          </div>
          <div className="social-links">
            <a
              href="https://www.linkedin.com/company/sia-software-innovations-private-limited/"
              aria-label="LinkedIn"
              target="_blank"
              rel="noreferrer"
            >
              <FaLinkedinIn />
            </a>
            <a
              href="https://www.instagram.com/siasoftwareinnovations?igsh=enZrY2JkZDZ3Y2F0"
              aria-label="Instagram"
              target="_blank"
              rel="noreferrer"
            >
              <FaInstagram />
            </a>
            <a
              href="https://www.youtube.com/channel/UCljQ1Lrvl_1wO-gcQ0EGuYw"
              aria-label="YouTube"
              target="_blank"
              rel="noreferrer"
            >
              <FaYoutube />
            </a>
          </div>
        </section>
      </div>

      <p className="site-footer-copy">
        &copy; {currentYear} SIA Software Innovations Private Limited. All rights reserved.
      </p>
    </footer>
  );
}


