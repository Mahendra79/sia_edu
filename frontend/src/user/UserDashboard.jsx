import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import LoadingSpinner from "../components/LoadingSpinner";
import { useToast } from "../context/ToastContext";
import UserLayout from "../layouts/UserLayout";
import { courseService } from "../services/courseService";
import { paymentService } from "../services/paymentService";
import { fetchAllPaginated } from "../utils/export";
import { formatCurrency } from "../utils/format";
import "./user.css";

export default function UserDashboard() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [stats, setStats] = useState({
    courses: 0,
    successful: 0,
    failed: 0,
    spent: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [enrollmentResponse, payments] = await Promise.all([
          courseService.getMyCourses({ page: 1, page_size: 1 }),
          fetchAllPaginated((params) => paymentService.getMyPaymentHistory(params)),
        ]);
        const totalCourses = Number(enrollmentResponse.data?.count ?? enrollmentResponse.data?.results?.length ?? 0);
        const successful = payments.filter((item) => item.payment_status === "success");
        const failed = payments.filter((item) => item.payment_status === "failed");

        setStats({
          courses: totalCourses,
          successful: successful.length,
          failed: failed.length,
          spent: successful.reduce((total, item) => total + Number(item.total || 0), 0),
        });
      } catch {
        addToast({ type: "error", message: "Unable to load dashboard stats." });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [addToast]);

  return (
    <UserLayout>
      <h1>User Dashboard</h1>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="user-stat-grid">
          <button type="button" className="stat-card user-stat-card-btn" onClick={() => navigate("/user/my-courses")}>
            <h3>Enrolled Courses</h3>
            <strong>{stats.courses}</strong>
          </button>
          <button
            type="button"
            className="stat-card user-stat-card-btn"
            onClick={() => navigate("/user/payment-history?status=success")}
          >
            <h3>Successful Payments</h3>
            <strong>{stats.successful}</strong>
          </button>
          <button
            type="button"
            className="stat-card user-stat-card-btn"
            onClick={() => navigate("/user/payment-history?status=failed")}
          >
            <h3>Failed Payments</h3>
            <strong>{stats.failed}</strong>
          </button>
          <button type="button" className="stat-card user-stat-card-btn" onClick={() => navigate("/user/payment-history")}>
            <h3>Total Spent</h3>
            <strong>{formatCurrency(stats.spent)}</strong>
          </button>
        </div>
      )}
    </UserLayout>
  );
}
