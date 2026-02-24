import { NavLink } from "react-router-dom";
import { HiOutlineCreditCard, HiOutlineSquares2X2, HiOutlineUserCircle, HiOutlineViewColumns } from "react-icons/hi2";

import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

export default function UserLayout({ children }) {
  return (
    <div className="app-shell">
      <Navbar />
      <div className="dashboard-shell">
        <aside className="sidebar">
          <NavLink to="/user/dashboard" className="nav-link-item">
            <HiOutlineViewColumns />
            Dashboard
          </NavLink>
          <NavLink to="/user/profile" className="nav-link-item">
            <HiOutlineUserCircle />
            Profile
          </NavLink>
          <NavLink to="/user/my-courses" className="nav-link-item">
            <HiOutlineSquares2X2 />
            My Courses
          </NavLink>
          <NavLink to="/user/payment-history" className="nav-link-item">
            <HiOutlineCreditCard />
            Payment History
          </NavLink>
        </aside>
        <section className="dashboard-content">{children}</section>
      </div>
      <Footer />
    </div>
  );
}
