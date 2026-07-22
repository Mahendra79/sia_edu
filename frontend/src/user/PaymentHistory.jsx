import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import Pagination from "../components/Pagination";
import { SkeletonTable } from "../components/Skeleton";
import { useToast } from "../context/ToastContext";
import { usePaginatedList } from "../hooks/usePaginatedList";
import UserLayout from "../layouts/UserLayout";
import { paymentService } from "../services/paymentService";
import { formatCurrency, formatDate } from "../utils/format";
import "./user.css";

const INITIAL_FILTERS = {
  status: "",
  date_from: "",
  date_to: "",
};

export default function PaymentHistory() {
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();
  const [invoiceLoadingId, setInvoiceLoadingId] = useState(null);
  const [filters, setFilters] = useState(() => ({
    ...INITIAL_FILTERS,
    status: searchParams.get("status") || "",
  }));
  const highlightedPaymentId = Number(searchParams.get("invoice") || 0);
  const queryKey = useMemo(
    () => `${filters.status}|${filters.date_from}|${filters.date_to}`,
    [filters.status, filters.date_from, filters.date_to],
  );

  const fetchPage = useCallback(
    (targetPage) =>
      paymentService.getMyPaymentHistory({
        ...filters,
        page: targetPage,
      }),
    [filters],
  );

  const handleLoadError = useCallback(() => {
    addToast({ type: "error", message: "Unable to load payment history." });
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
    cacheNamespace: "payment-history",
  });

  const openInvoice = async (paymentId, inline) => {
    let newWindow = null;
    if (inline) {
      newWindow = window.open("", "_blank");
      if (newWindow) {
        newWindow.document.write("<p style='font-family: sans-serif; padding: 20px; color: #666;'>Generating invoice PDF, please wait...</p>");
      }
    }
    setInvoiceLoadingId(paymentId);
    try {
      const response = await paymentService.getInvoice(paymentId, { inline });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const blobUrl = window.URL.createObjectURL(blob);
      if (inline) {
        if (newWindow) {
          newWindow.location.href = blobUrl;
        } else {
          window.open(blobUrl, "_blank", "noopener,noreferrer");
        }
      } else {
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = `invoice_${paymentId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), inline ? 10000 : 2000);
    } catch {
      if (newWindow) {
        newWindow.close();
      }
      addToast({ type: "error", message: "Unable to generate invoice." });
    } finally {
      setInvoiceLoadingId(null);
    }
  };

  return (
    <UserLayout>
      <h1>Payment History</h1>
      <section className="panel-card">
        <div className="filters-row">
          <select value={filters.status} onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}>
            <option value="">All Status</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
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
          <SkeletonTable rows={6} columns={5} />
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th>Date</th>
                    <th>Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className={highlightedPaymentId === payment.id ? "table-row-highlight" : ""}>
                      <td>{payment.course_title}</td>
                      <td>{payment.payment_status}</td>
                      <td>{formatCurrency(payment.total, "INR")}</td>
                      <td>{formatDate(payment.created_at)}</td>
                      <td>
                        {payment.payment_status === "success" ? (
                          <div className="inline-controls">
                            <button
                              type="button"
                              className="btn btn-muted"
                              disabled={invoiceLoadingId === payment.id}
                              onClick={() => openInvoice(payment.id, true)}
                            >
                              View
                            </button>
                            <button
                              type="button"
                              className="btn btn-muted"
                              disabled={invoiceLoadingId === payment.id}
                              onClick={() => openInvoice(payment.id, false)}
                            >
                              Download
                            </button>
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination count={count} currentPage={page} onPageChange={setPage} />
          </>
        )}
      </section>
    </UserLayout>
  );
}
