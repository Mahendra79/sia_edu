import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import { HiOutlineArrowPath } from "react-icons/hi2";

import LoadingSpinner from "../components/LoadingSpinner";
import PageTransition from "../components/PageTransition";
import { useToast } from "../context/ToastContext";
import AdminLayout from "../layouts/AdminLayout";
import { analyticsService } from "../services/analyticsService";
import { formatCurrency, formatDate } from "../utils/format";
import "./admin.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend);

function openChartPrintWindow(title, imageDataUrl) {
  const popup = window.open("", "_blank", "width=1200,height=900");
  if (!popup) {
    return false;
  }

  popup.document.write(`<!doctype html>
<html>
  <head>
    <title>${title}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 0; padding: 24px; }
      h1 { margin: 0 0 12px; font-size: 22px; }
      p { margin: 0 0 16px; color: #444; }
      img { width: 100%; max-width: 1080px; border: 1px solid #ddd; border-radius: 10px; }
    </style>
  </head>
  <body>
    <h1>${title}</h1>
    <p>Use Save as PDF in the print dialog to download this graph.</p>
    <img src="${imageDataUrl}" alt="${title}" />
    <script>
      window.onload = function () {
        setTimeout(function () {
          window.print();
        }, 150);
      };
    </script>
  </body>
</html>`);
  popup.document.close();
  return true;
}

export default function MISReports() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);

  const revenueChartRef = useRef(null);
  const usersGrowthChartRef = useRef(null);
  const paymentStatusChartRef = useRef(null);
  const topCoursesChartRef = useRef(null);

  const loadReports = useCallback(
    async ({ silent = false } = {}) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const [dashboardResponse, logsResponse] = await Promise.all([
          analyticsService.getDashboard(),
          analyticsService.getActivityLogs({ page: 1, page_size: 20 }),
        ]);

        setDashboardData(dashboardResponse.data || null);
        setActivityLogs(logsResponse.data.results || logsResponse.data || []);
        setLastUpdated(new Date());
      } catch {
        addToast({ type: "error", message: "Unable to load MIS reports." });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [addToast],
  );

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      loadReports({ silent: true });
    }, 45000);
    return () => window.clearInterval(intervalId);
  }, [loadReports]);

  const metrics = useMemo(() => {
    const snapshot = dashboardData?.metrics || {};
    return {
      totalUsers: Number(snapshot.total_users || 0),
      verifiedUsers: Number(snapshot.verified_users || 0),
      paymentUsers: Number(snapshot.payment_users || 0),
      totalCourses: Number(snapshot.total_courses || 0),
      purchasedCourses: Number(snapshot.purchased_courses || 0),
      totalRevenue: Number(snapshot.total_revenue || 0),
      avgOrderValue: Number(snapshot.avg_order_value || 0),
      successCount: Number(snapshot.success_count || 0),
      failedCount: Number(snapshot.failed_count || 0),
      pendingCount: Number(snapshot.pending_count || 0),
    };
  }, [dashboardData]);

  const revenueData = useMemo(() => {
    const entries = (dashboardData?.monthly_revenue || []).map((item) => [item.month, Number(item.amount || 0)]);
    return {
      labels: entries.map((entry) => entry[0]),
      datasets: [
        {
          label: "Revenue",
          data: entries.map((entry) => Number(entry[1].toFixed(2))),
          borderRadius: 8,
          backgroundColor: "rgba(30, 77, 183, 0.72)",
        },
      ],
    };
  }, [dashboardData]);

  const usersGrowthData = useMemo(() => {
    const entries = (dashboardData?.monthly_users || []).map((item) => [item.month, Number(item.count || 0)]);
    return {
      labels: entries.map((entry) => entry[0]),
      datasets: [
        {
          label: "New Users",
          data: entries.map((entry) => entry[1]),
          borderColor: "rgba(79, 126, 243, 0.95)",
          backgroundColor: "rgba(79, 126, 243, 0.2)",
          fill: true,
          tension: 0.25,
        },
      ],
    };
  }, [dashboardData]);

  const paymentStatusData = useMemo(
    () => ({
      labels: ["Success", "Failed", "Pending"],
      datasets: [
        {
          data: [metrics.successCount, metrics.failedCount, metrics.pendingCount],
          backgroundColor: ["#2ab572", "#e05a6f", "#e8a73a"],
          borderWidth: 1,
        },
      ],
    }),
    [metrics],
  );

  const topCoursesData = useMemo(() => {
    const entries = (dashboardData?.top_courses || []).map((item) => [item.title, Number(item.count || 0)]);
    return {
      labels: entries.map((entry) => entry[0]),
      datasets: [
        {
          label: "Enrollments",
          data: entries.map((entry) => entry[1]),
          borderRadius: 8,
          backgroundColor: "rgba(42, 181, 114, 0.74)",
        },
      ],
    };
  }, [dashboardData]);

  const barChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
    }),
    [],
  );

  const lineChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: "bottom" },
      },
    }),
    [],
  );

  const exportChartPdf = (chartRef, title) => {
    const chart = chartRef.current;
    if (!chart?.canvas) {
      addToast({ type: "error", message: "Chart is not ready for export." });
      return;
    }
    const imageDataUrl = chart.canvas.toDataURL("image/png", 1);
    const opened = openChartPrintWindow(title, imageDataUrl);
    if (!opened) {
      addToast({ type: "warning", message: "Please allow popups to export PDF." });
      return;
    }
    addToast({ type: "info", message: "Print dialog opened. Choose Save as PDF." });
  };

  return (
    <AdminLayout>
      <PageTransition>
        <section className="page-top">
          <div>
            <h1>MIS Reports</h1>
            <p>Live reporting for users, payments, courses, and admin activity.</p>
          </div>
          <div className="inline-controls">
            <span className="meta-note">{lastUpdated ? `Last sync: ${formatDate(lastUpdated)}` : "Syncing..."}</span>
            <button type="button" className="btn btn-muted btn-icon" onClick={() => loadReports({ silent: true })} disabled={refreshing}>
              <HiOutlineArrowPath />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </section>

        {loading ? (
          <LoadingSpinner label="Loading reports..." />
        ) : (
          <>
            <section className="mis-kpi-grid">
              <button type="button" className="stat-card stat-card-button" onClick={() => navigate("/admin/users?scope=all")}>
                <h3>Total Users</h3>
                <strong>{metrics.totalUsers}</strong>
              </button>
              <button type="button" className="stat-card stat-card-button" onClick={() => navigate("/admin/users?scope=verified")}>
                <h3>Verified Users</h3>
                <strong>{metrics.verifiedUsers}</strong>
              </button>
              <button
                type="button"
                className="stat-card stat-card-button"
                onClick={() => navigate("/admin/users?scope=payment_users&payment_status=success")}
              >
                <h3>Payment Users</h3>
                <strong>{metrics.paymentUsers}</strong>
              </button>
              <button type="button" className="stat-card stat-card-button" onClick={() => navigate("/admin/courses?scope=all")}>
                <h3>Total Courses</h3>
                <strong>{metrics.totalCourses}</strong>
              </button>
              <button type="button" className="stat-card stat-card-button" onClick={() => navigate("/admin/courses?scope=purchased")}>
                <h3>Courses Purchased</h3>
                <strong>{metrics.purchasedCourses}</strong>
              </button>
              <button type="button" className="stat-card stat-card-button" onClick={() => navigate("/admin/payments?status=success")}>
                <h3>Total Revenue</h3>
                <strong>{formatCurrency(metrics.totalRevenue)}</strong>
              </button>
              <button type="button" className="stat-card stat-card-button" onClick={() => navigate("/admin/payments?status=success")}>
                <h3>Avg Order Value</h3>
                <strong>{formatCurrency(metrics.avgOrderValue)}</strong>
              </button>
            </section>

            <section className="mis-chart-grid">
              <article className="chart-card mis-chart-card">
                <div className="chart-card-head">
                  <h3>Monthly Revenue</h3>
                  <button type="button" className="btn btn-muted" onClick={() => exportChartPdf(revenueChartRef, "Monthly Revenue Report")}>
                    Download PDF
                  </button>
                </div>
                <div className="mis-chart-canvas">
                  <Bar ref={revenueChartRef} data={revenueData} options={barChartOptions} />
                </div>
              </article>

              <article className="chart-card mis-chart-card">
                <div className="chart-card-head">
                  <h3>User Growth Trend</h3>
                  <button type="button" className="btn btn-muted" onClick={() => exportChartPdf(usersGrowthChartRef, "User Growth Report")}>
                    Download PDF
                  </button>
                </div>
                <div className="mis-chart-canvas">
                  <Line ref={usersGrowthChartRef} data={usersGrowthData} options={lineChartOptions} />
                </div>
              </article>

              <article className="chart-card mis-chart-card">
                <div className="chart-card-head">
                  <h3>Payment Status Split</h3>
                  <button
                    type="button"
                    className="btn btn-muted"
                    onClick={() => exportChartPdf(paymentStatusChartRef, "Payment Status Report")}
                  >
                    Download PDF
                  </button>
                </div>
                <div className="mis-chart-canvas">
                  <Doughnut ref={paymentStatusChartRef} data={paymentStatusData} />
                </div>
              </article>

              <article className="chart-card mis-chart-card">
                <div className="chart-card-head">
                  <h3>Top Purchased Courses</h3>
                  <button type="button" className="btn btn-muted" onClick={() => exportChartPdf(topCoursesChartRef, "Top Courses Report")}>
                    Download PDF
                  </button>
                </div>
                <div className="mis-chart-canvas">
                  <Bar ref={topCoursesChartRef} data={topCoursesData} options={barChartOptions} />
                </div>
              </article>
            </section>

            <section className="panel-card">
              <h2>Recent Admin Activity</h2>
              {activityLogs.length === 0 ? (
                <p className="empty-state">No activity logs recorded yet.</p>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Admin</th>
                        <th>Action</th>
                        <th>Target</th>
                        <th>Details</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activityLogs.map((log) => (
                        <tr key={log.id}>
                          <td>{log.admin_email}</td>
                          <td>{log.action}</td>
                          <td>
                            {log.target_type} #{log.target_id}
                          </td>
                          <td>{log.details || "-"}</td>
                          <td>{formatDate(log.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </PageTransition>
    </AdminLayout>
  );
}
