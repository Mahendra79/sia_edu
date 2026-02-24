import { NavLink } from "react-router-dom";
import {
  HiOutlineCpuChip,
  HiOutlineChartBar,
  HiOutlineCircleStack,
  HiOutlineCreditCard,
  HiOutlinePresentationChartBar,
  HiOutlineSquares2X2,
  HiOutlineUserCircle,
  HiOutlineUsers,
} from "react-icons/hi2";

import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

export default function AdminLayout({ children }) {
  return (
    <div className="app-shell">
      <Navbar />
      <div className="dashboard-shell">
        <aside className="sidebar">
          <NavLink to="/admin/dashboard" className="nav-link-item">
            <HiOutlineChartBar />
            Dashboard
          </NavLink>
          <NavLink to="/admin/profile" className="nav-link-item">
            <HiOutlineUserCircle />
            Profile
          </NavLink>
          <NavLink to="/admin/courses" className="nav-link-item">
            <HiOutlineSquares2X2 />
            Manage Courses
          </NavLink>
          <NavLink to="/admin/users" className="nav-link-item">
            <HiOutlineUsers />
            Manage Users
          </NavLink>
          <NavLink to="/admin/payments" className="nav-link-item">
            <HiOutlineCreditCard />
            Payments
          </NavLink>
          <NavLink to="/admin/database" className="nav-link-item">
            <HiOutlineCircleStack />
            Database Edit
          </NavLink>
          <NavLink to="/admin/reports" className="nav-link-item">
            <HiOutlinePresentationChartBar />
            MIS Reports
          </NavLink>
          <NavLink to="/admin/chatbot" className="nav-link-item">
            <HiOutlineCpuChip />
            Chatbot QA
          </NavLink>
        </aside>
        <section className="dashboard-content">
          {children}
        </section>
      </div>
      <Footer />
    </div>
  );
}
