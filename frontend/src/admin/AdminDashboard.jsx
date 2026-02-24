import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bar } from "react-chartjs-2";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js";

import LoadingSpinner from "../components/LoadingSpinner";
import PageTransition from "../components/PageTransition";
import { useToast } from "../context/ToastContext";
import AdminLayout from "../layouts/AdminLayout";
import { analyticsService } from "../services/analyticsService";
import { formatCurrency } from "../utils/format";
import "./admin.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSummary = async () => {
      setLoading(true);
      try {
        const response = await analyticsService.getSummary();
        setSummary(response.data);
      } catch {
        addToast({ type: "error", message: "Unable to load analytics summary." });
      } finally {
        setLoading(false);
      }
    };
    loadSummary();
  }, [addToast]);

  const chartData = useMemo(() => {
    const labels = summary?.monthly_revenue?.map((item) => item.month) || [];
    const values = summary?.monthly_revenue?.map((item) => item.amount) || [];
    return {
      labels,
      datasets: [
        {
          label: "Revenue",
          data: values,
          borderRadius: 8,
          backgroundColor: "rgba(30, 77, 183, 0.7)",
        },
      ],
    };
  }, [summary]);

  return (
    <AdminLayout>
      <PageTransition>
        <h1>Admin Dashboard</h1>
        {loading ? (
          <LoadingSpinner label="Loading analytics..." />
        ) : (
          <div className="admin-dashboard">
            <div className="stat-grid">
              <button type="button" className="stat-card stat-card-button" onClick={() => navigate("/admin/payments?status=success")}>
                <h3>Total Revenue</h3>
                <strong>{formatCurrency(summary?.revenue_summary)}</strong>
              </button>
              <button type="button" className="stat-card stat-card-button" onClick={() => navigate("/admin/users?scope=all")}>
                <h3>Total Users</h3>
                <strong>{summary?.total_users ?? 0}</strong>
              </button>
              <button
                type="button"
                className="stat-card stat-card-button"
                onClick={() => navigate("/admin/users?scope=payment_users&payment_status=success")}
              >
                <h3>Payment Users</h3>
                <strong>{summary?.payment_users ?? 0}</strong>
              </button>
              <button type="button" className="stat-card stat-card-button" onClick={() => navigate("/admin/courses?scope=all")}>
                <h3>Total Courses</h3>
                <strong>{summary?.total_courses ?? 0}</strong>
              </button>
            </div>
            <div className="chart-card">
              <h3>Revenue Trend</h3>
              <Bar data={chartData} />
            </div>
          </div>
        )}
      </PageTransition>
    </AdminLayout>
  );
}
