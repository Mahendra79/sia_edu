import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import LoadingSpinner from "../components/LoadingSpinner";
import Pagination from "../components/Pagination";
import { useToast } from "../context/ToastContext";
import { usePaginatedList } from "../hooks/usePaginatedList";
import AdminLayout from "../layouts/AdminLayout";
import { courseService } from "../services/courseService";
import { paymentService } from "../services/paymentService";
import { downloadCsv, fetchAllPaginated } from "../utils/export";
import { formatCurrency, formatDate } from "../utils/format";
import "./admin.css";

const INITIAL_FILTERS = {
  status: "",
  course: "",
  date_from: "",
  date_to: "",
};

export default function Payments() {
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const [courses, setCourses] = useState([]);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [exporting, setExporting] = useState(false);
  const queryKey = useMemo(
    () => `${filters.status}|${filters.course}|${filters.date_from}|${filters.date_to}`,
    [filters.status, filters.course, filters.date_from, filters.date_to],
  );

  const fetchPage = useCallback(
    (targetPage) =>
      paymentService.getAdminPaymentHistory({
        ...filters,
        page: targetPage,
      }),
    [filters],
  );

  const handleLoadError = useCallback(() => {
    addToast({ type: "error", message: "Unable to load payment transactions." });
  }, [addToast]);

  const {
    items: payments,
    count,
    page,
    setPage,
    loading,
  } = usePaginatedList({
    queryKey,
    fetchPage,
    onError: handleLoadError,
  });

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await courseService.getCourses({ page_size: 100 });
        setCourses(response.data.results || []);
      } catch {
        addToast({ type: "error", message: "Unable to load course filter list." });
      }
    };
    fetchCourses();
  }, [addToast]);

  useEffect(() => {
    const params = new URLSearchParams(searchParamsKey);
    const nextFilters = {
      status: params.get("status") || "",
      course: params.get("course") || "",
      date_from: params.get("date_from") || "",
      date_to: params.get("date_to") || "",
    };
    setFilters((previousFilters) =>
      previousFilters.status === nextFilters.status &&
      previousFilters.course === nextFilters.course &&
      previousFilters.date_from === nextFilters.date_from &&
      previousFilters.date_to === nextFilters.date_to
        ? previousFilters
        : nextFilters,
    );
    setPage((currentPage) => (currentPage === 1 ? currentPage : 1));
  }, [searchParamsKey, setPage]);

  const handleExportPayments = async () => {
    setExporting(true);
    try {
      const allPayments = await fetchAllPaginated((params) =>
        paymentService.getAdminPaymentHistory({
          ...filters,
          ...params,
        }),
      );

      if (allPayments.length === 0) {
        addToast({ type: "warning", message: "No payment records available to export." });
        return;
      }

      downloadCsv({
        filename: `payments_export_${new Date().toISOString().slice(0, 10)}.csv`,
        headers: [
          { key: "id", label: "Payment ID" },
          { key: "user_email", label: "User Email" },
          { key: "course_title", label: "Course" },
          { key: "payment_status", label: "Status" },
          { key: "amount", label: "Amount" },
          { key: "tax", label: "Tax" },
          { key: "total", label: "Total" },
          { key: "currency", label: "Currency" },
          { key: "created_at", label: "Date" },
        ],
        rows: allPayments.map((payment) => ({
          id: payment.id,
          user_email: payment.user_email || "",
          course_title: payment.course_title || "",
          payment_status: payment.payment_status || "",
          amount: formatCurrency(payment.amount),
          tax: formatCurrency(payment.tax),
          total: formatCurrency(payment.total),
          currency: payment.currency || "",
          created_at: formatDate(payment.created_at),
        })),
      });

      addToast({ type: "success", message: "Payments export generated." });
    } catch {
      addToast({ type: "error", message: "Unable to export payment data." });
    } finally {
      setExporting(false);
    }
  };

  return (
    <AdminLayout>
      <h1>Payments</h1>
      <section className="panel-card">
        <div className="section-actions">
          <button type="button" className="btn btn-muted" onClick={handleExportPayments} disabled={exporting}>
            {exporting ? "Exporting..." : "Export Excel"}
          </button>
        </div>
        <div className="filters-row">
          <select value={filters.status} onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}>
            <option value="">All Status</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>
          <select value={filters.course} onChange={(event) => setFilters((prev) => ({ ...prev, course: event.target.value }))}>
            <option value="">All Courses</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={filters.date_from}
            onChange={(event) => setFilters((prev) => ({ ...prev, date_from: event.target.value }))}
          />
          <input
            type="date"
            value={filters.date_to}
            onChange={(event) => setFilters((prev) => ({ ...prev, date_to: event.target.value }))}
          />
        </div>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Course</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td>{payment.user_email}</td>
                      <td>{payment.course_title}</td>
                      <td>{payment.payment_status}</td>
                      <td>{formatCurrency(payment.total)}</td>
                      <td>{formatDate(payment.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination count={count} currentPage={page} onPageChange={setPage} />
          </>
        )}
      </section>
    </AdminLayout>
  );
}
