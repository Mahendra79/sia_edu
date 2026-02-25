import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { HiOutlineArrowPath } from "react-icons/hi2";

import ConfirmModal from "../components/ConfirmModal";
import LoadingSpinner from "../components/LoadingSpinner";
import PageTransition from "../components/PageTransition";
import { useToast } from "../context/ToastContext";
import AdminLayout from "../layouts/AdminLayout";
import { analyticsService } from "../services/analyticsService";
import { authService } from "../services/authService";
import { courseService } from "../services/courseService";
import { deletedRecordService } from "../services/deletedRecordService";
import { paymentService } from "../services/paymentService";
import { fetchAllPaginated } from "../utils/export";
import { formatCurrency, formatDate } from "../utils/format";
import "./admin.css";

const TABS = [
  { key: "users", label: "Users" },
  { key: "courses", label: "Courses" },
  { key: "categories", label: "Categories" },
  { key: "enrollments", label: "Enrollments" },
  { key: "reviews", label: "Reviews" },
  { key: "payments", label: "Payments" },
  { key: "deleted", label: "Deleted Records" },
  { key: "logs", label: "Activity Logs" },
];

const EMPTY_EDIT = {
  type: "",
  id: null,
  payload: {},
};

function getApiError(error, fallback) {
  const payload = error?.response?.data;
  if (typeof payload === "string" && payload.trim()) return payload;
  if (payload?.detail) return payload.detail;
  if (payload && typeof payload === "object") {
    const firstMessage = Object.values(payload).flat().find(Boolean);
    if (firstMessage) return String(firstMessage);
  }
  return fallback;
}

function InlineField({ label, className = "", children }) {
  return (
    <div className={`table-inline-field ${className}`.trim()}>
      <span className="table-inline-field-label">{label}</span>
      {children}
    </div>
  );
}

export default function DatabaseEditor() {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState("users");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [edit, setEdit] = useState(EMPTY_EDIT);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [payments, setPayments] = useState([]);
  const [deletedRecords, setDeletedRecords] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [courseImage, setCourseImage] = useState(null);

  const loadData = useCallback(
    async ({ silent = false } = {}) => {
      if (silent) setRefreshing(true);
      else setLoading(true);

      try {
        const [u, c, ca, e, r, p, d, l] = await Promise.all([
          fetchAllPaginated((params) => authService.getAdminUsers(params)),
          fetchAllPaginated((params) => courseService.getCourses(params)),
          fetchAllPaginated((params) => courseService.getCategories(params)),
          fetchAllPaginated((params) => courseService.getAdminEnrollments(params)),
          fetchAllPaginated((params) => courseService.getAdminReviews(params)),
          fetchAllPaginated((params) => paymentService.getAdminPaymentHistory(params)),
          fetchAllPaginated((params) => deletedRecordService.getDeletedRecords(params)),
          fetchAllPaginated((params) => analyticsService.getActivityLogs(params)),
        ]);

        setUsers(u);
        setCourses(c);
        setCategories(ca);
        setEnrollments(e);
        setReviews(r);
        setPayments(p);
        setDeletedRecords(d);
        setActivityLogs(l);
        setLastUpdated(new Date());
      } catch {
        addToast({ type: "error", message: "Unable to load database records." });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [addToast],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const timer = window.setInterval(() => loadData({ silent: true }), 45000);
    return () => window.clearInterval(timer);
  }, [loadData]);

  const categoryOptions = useMemo(
    () => categories.map((category) => ({ label: category.name, value: String(category.id) })),
    [categories],
  );

  const startEdit = (type, item) => {
    if (type === "users") {
      setEdit({
        type,
        id: item.id,
        payload: {
          name: item.name || "",
          username: item.username || "",
          email: item.email || "",
          phone: item.phone || "",
          is_active: Boolean(item.is_active),
          is_email_verified: Boolean(item.is_email_verified),
        },
      });
    } else if (type === "courses") {
      setEdit({
        type,
        id: item.id,
        payload: {
          title: item.title || "",
          short_description: item.short_description || "",
          description: item.description || "",
          mentor_name: item.mentor_name || "",
          mentor_title: item.mentor_title || "",
          mentor_bio: item.mentor_bio || "",
          duration_days: String(item.duration_days ?? "30"),
          price: String(item.price || ""),
          discount_percent: String(item.discount_percent ?? "0"),
          category_id: String(item.category?.id || ""),
          is_active: Boolean(item.is_active),
        },
      });
      setCourseImage(null);
    } else if (type === "categories") {
      setEdit({ type, id: item.id, payload: { name: item.name || "", description: item.description || "" } });
    } else if (type === "enrollments") {
      setEdit({ type, id: item.id, payload: { status: item.status, payment_status: item.payment_status } });
    } else if (type === "reviews") {
      setEdit({ type, id: item.id, payload: { rating: String(item.rating), comment: item.comment || "" } });
    } else if (type === "payments") {
      setEdit({
        type,
        id: item.id,
        payload: {
          payment_status: item.payment_status,
          amount: String(item.amount || ""),
          tax: String(item.tax || ""),
          total: String(item.total || ""),
          currency: item.currency || "usd",
          failure_reason: item.failure_reason || "",
        },
      });
    }
  };

  const clearEdit = () => {
    setEdit(EMPTY_EDIT);
    setCourseImage(null);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!edit.id || !edit.type) return;

    setSaving(true);
    try {
      if (edit.type === "users") {
        await authService.updateAdminUser(edit.id, edit.payload);
      } else if (edit.type === "courses") {
        const payload = new FormData();
        payload.append("title", edit.payload.title);
        payload.append("short_description", edit.payload.short_description);
        payload.append("description", edit.payload.description);
        payload.append("mentor_name", edit.payload.mentor_name || "");
        payload.append("mentor_title", edit.payload.mentor_title || "");
        payload.append("mentor_bio", edit.payload.mentor_bio || "");
        payload.append("duration_days", edit.payload.duration_days || "30");
        payload.append("price", edit.payload.price);
        payload.append("discount_percent", edit.payload.discount_percent || "0");
        payload.append("category_id", edit.payload.category_id);
        payload.append("is_active", String(edit.payload.is_active));
        if (courseImage) payload.append("image", courseImage);
        await courseService.updateCourse(edit.id, payload);
      } else if (edit.type === "categories") {
        await courseService.updateCategory(edit.id, edit.payload);
      } else if (edit.type === "enrollments") {
        await courseService.updateAdminEnrollment(edit.id, edit.payload);
      } else if (edit.type === "reviews") {
        await courseService.updateAdminReview(edit.id, {
          rating: Number(edit.payload.rating),
          comment: edit.payload.comment,
        });
      } else if (edit.type === "payments") {
        await paymentService.updateAdminPayment(edit.id, edit.payload);
      }

      addToast({ type: "success", message: "Record updated." });
      clearEdit();
      loadData({ silent: true });
    } catch (error) {
      addToast({ type: "error", message: getApiError(error, "Unable to update record.") });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      if (deleteTarget.type === "users") {
        await authService.softDeleteUser(deleteTarget.id, { reason: "admin_database_editor_delete" });
      } else if (deleteTarget.type === "courses") {
        await courseService.deleteCourse(deleteTarget.id, { reason: "admin_database_editor_delete" });
      } else if (deleteTarget.type === "categories") {
        await courseService.deleteCategory(deleteTarget.id, { reason: "admin_database_editor_delete" });
      } else if (deleteTarget.type === "enrollments") {
        await courseService.deleteAdminEnrollment(deleteTarget.id, { reason: "admin_database_editor_delete" });
      } else if (deleteTarget.type === "reviews") {
        await courseService.deleteAdminReview(deleteTarget.id, { reason: "admin_database_editor_delete" });
      } else if (deleteTarget.type === "payments") {
        await paymentService.deleteAdminPayment(deleteTarget.id, { reason: "admin_database_editor_delete" });
      }
      addToast({ type: "success", message: "Record deleted." });
      setDeleteTarget(null);
      clearEdit();
      loadData({ silent: true });
    } catch (error) {
      addToast({ type: "error", message: getApiError(error, "Unable to delete record.") });
    } finally {
      setSaving(false);
    }
  };

  const rows = {
    users: users.map((item) => [item.name, item.email, item.phone, item.is_active ? "Yes" : "No", formatDate(item.created_at)]),
    courses: courses.map((item) => [
      item.title,
      item.category?.name || "-",
      item.mentor_name || "-",
      Number(item.duration_days || 0) > 0 ? `${item.duration_days} days` : "-",
      formatCurrency(item.price, "INR"),
      Number(item.discount_percent || 0) > 0 ? `${Number(item.discount_percent).toFixed(2)}%` : "-",
      item.is_active ? "Yes" : "No",
      formatDate(item.created_at),
    ]),
    categories: categories.map((item) => [item.name, item.description || "-", formatDate(item.created_at)]),
    enrollments: enrollments.map((item) => [item.user_email, item.course_title, item.status, item.payment_status, formatDate(item.enrolled_at)]),
    reviews: reviews.map((item) => [item.user_email, item.course_title, item.rating, item.comment || "-", formatDate(item.created_at)]),
    payments: payments.map((item) => [item.user_email, item.course_title, item.payment_status, formatCurrency(item.total), formatDate(item.created_at)]),
    deleted: deletedRecords.map((item) => [item.model_name, item.record_id, item.reason || "-", item.deleted_by_email || "-", formatDate(item.deleted_at)]),
    logs: activityLogs.map((item) => [item.admin_email, item.action, `${item.target_type} #${item.target_id}`, item.details || "-", formatDate(item.created_at)]),
  };

  const headers = {
    users: ["Name", "Email", "Phone", "Active", "Date", "Actions"],
    courses: ["Title", "Category", "Mentor", "Duration", "Price", "Discount", "Active", "Date", "Actions"],
    categories: ["Name", "Description", "Date", "Actions"],
    enrollments: ["User", "Course", "Status", "Payment", "Date", "Actions"],
    reviews: ["User", "Course", "Rating", "Comment", "Date", "Actions"],
    payments: ["User", "Course", "Status", "Total", "Date", "Actions"],
    deleted: ["Model", "Record ID", "Reason", "Deleted By", "Date"],
    logs: ["Admin", "Action", "Target", "Details", "Date"],
  };

  const dataByType = { users, courses, categories, enrollments, reviews, payments };

  const editTypeLabel = {
    users: "User",
    courses: "Course",
    categories: "Category",
    enrollments: "Enrollment",
    reviews: "Review",
    payments: "Payment",
  };

  const renderInlineEditFields = () => {
    if (!edit.id || !edit.type) return null;
    const payload = edit.payload;

    if (edit.type === "users") {
      return (
        <>
          <InlineField label="Name">
            <input value={payload.name} onChange={(e) => setEdit((p) => ({ ...p, payload: { ...p.payload, name: e.target.value } }))} required />
          </InlineField>
          <InlineField label="Username">
            <input value={payload.username} onChange={(e) => setEdit((p) => ({ ...p, payload: { ...p.payload, username: e.target.value } }))} required />
          </InlineField>
          <InlineField label="Email">
            <input type="email" value={payload.email} onChange={(e) => setEdit((p) => ({ ...p, payload: { ...p.payload, email: e.target.value } }))} required />
          </InlineField>
          <InlineField label="Phone">
            <input value={payload.phone} onChange={(e) => setEdit((p) => ({ ...p, payload: { ...p.payload, phone: e.target.value } }))} required />
          </InlineField>
          <InlineField label="Account Status" className="table-inline-field-toggle">
            <label className="toggle-row table-inline-toggle">
              <input type="checkbox" checked={payload.is_active} onChange={(e) => setEdit((p) => ({ ...p, payload: { ...p.payload, is_active: e.target.checked } }))} />
              Active
            </label>
          </InlineField>
          <InlineField label="Email Verification" className="table-inline-field-toggle">
            <label className="toggle-row table-inline-toggle">
              <input type="checkbox" checked={payload.is_email_verified} onChange={(e) => setEdit((p) => ({ ...p, payload: { ...p.payload, is_email_verified: e.target.checked } }))} />
              Email Verified
            </label>
          </InlineField>
        </>
      );
    }

    if (edit.type === "courses") {
      return (
        <>
          <InlineField label="Course Title">
            <input value={payload.title} onChange={(e) => setEdit((p) => ({ ...p, payload: { ...p.payload, title: e.target.value } }))} required />
          </InlineField>
          <InlineField label="Short Description">
            <input value={payload.short_description} onChange={(e) => setEdit((p) => ({ ...p, payload: { ...p.payload, short_description: e.target.value } }))} required />
          </InlineField>
          <InlineField label="Full Description" className="table-inline-field-wide">
            <textarea value={payload.description} onChange={(e) => setEdit((p) => ({ ...p, payload: { ...p.payload, description: e.target.value } }))} required />
          </InlineField>
          <InlineField label="Mentor Name">
            <input value={payload.mentor_name} onChange={(e) => setEdit((p) => ({ ...p, payload: { ...p.payload, mentor_name: e.target.value } }))} />
          </InlineField>
          <InlineField label="Mentor Title">
            <input value={payload.mentor_title} onChange={(e) => setEdit((p) => ({ ...p, payload: { ...p.payload, mentor_title: e.target.value } }))} />
          </InlineField>
          <InlineField label="Mentor Bio" className="table-inline-field-wide">
            <textarea value={payload.mentor_bio} onChange={(e) => setEdit((p) => ({ ...p, payload: { ...p.payload, mentor_bio: e.target.value } }))} />
          </InlineField>
          <InlineField label="Duration (Days)">
            <input type="number" min="1" step="1" value={payload.duration_days} onChange={(e) => setEdit((p) => ({ ...p, payload: { ...p.payload, duration_days: e.target.value } }))} required />
          </InlineField>
          <InlineField label="Price">
            <input type="number" min="0" step="0.01" value={payload.price} onChange={(e) => setEdit((p) => ({ ...p, payload: { ...p.payload, price: e.target.value } }))} required />
          </InlineField>
          <InlineField label="Discount Percent">
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={payload.discount_percent}
              onChange={(e) => setEdit((p) => ({ ...p, payload: { ...p.payload, discount_percent: e.target.value } }))}
              required
            />
          </InlineField>
          <InlineField label="Category">
            <select value={payload.category_id} onChange={(e) => setEdit((p) => ({ ...p, payload: { ...p.payload, category_id: e.target.value } }))} required>
              <option value="">Select Category</option>
              {categoryOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </InlineField>
          <InlineField label="Course Status" className="table-inline-field-toggle">
            <label className="toggle-row table-inline-toggle">
              <input type="checkbox" checked={payload.is_active} onChange={(e) => setEdit((p) => ({ ...p, payload: { ...p.payload, is_active: e.target.checked } }))} />
              Active
            </label>
          </InlineField>
          <InlineField label="Course Image">
            <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={(e) => setCourseImage(e.target.files?.[0] || null)} />
          </InlineField>
        </>
      );
    }

    if (edit.type === "categories") {
      return (
        <>
          <InlineField label="Category Name">
            <input value={payload.name} onChange={(e) => setEdit((p) => ({ ...p, payload: { ...p.payload, name: e.target.value } }))} required />
          </InlineField>
          <InlineField label="Description" className="table-inline-field-wide">
            <textarea value={payload.description} onChange={(e) => setEdit((p) => ({ ...p, payload: { ...p.payload, description: e.target.value } }))} />
          </InlineField>
        </>
      );
    }

    if (edit.type === "enrollments") {
      return (
        <>
          <InlineField label="Enrollment Status">
            <select value={payload.status} onChange={(e) => setEdit((p) => ({ ...p, payload: { ...p.payload, status: e.target.value } }))}>
              <option value="enrolled">Enrolled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </InlineField>
          <InlineField label="Payment Status">
            <select value={payload.payment_status} onChange={(e) => setEdit((p) => ({ ...p, payload: { ...p.payload, payment_status: e.target.value } }))}>
              <option value="pending">Pending</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
          </InlineField>
        </>
      );
    }

    if (edit.type === "reviews") {
      return (
        <>
          <InlineField label="Rating">
            <input type="number" min="1" max="5" step="1" value={payload.rating} onChange={(e) => setEdit((p) => ({ ...p, payload: { ...p.payload, rating: e.target.value } }))} required />
          </InlineField>
          <InlineField label="Comment" className="table-inline-field-wide">
            <textarea value={payload.comment} onChange={(e) => setEdit((p) => ({ ...p, payload: { ...p.payload, comment: e.target.value } }))} />
          </InlineField>
        </>
      );
    }

    if (edit.type === "payments") {
      return (
        <>
          <InlineField label="Payment Status">
            <select value={payload.payment_status} onChange={(e) => setEdit((p) => ({ ...p, payload: { ...p.payload, payment_status: e.target.value } }))}>
              <option value="pending">Pending</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
          </InlineField>
          <InlineField label="Amount">
            <input type="number" min="0" step="0.01" value={payload.amount} onChange={(e) => setEdit((p) => ({ ...p, payload: { ...p.payload, amount: e.target.value } }))} required />
          </InlineField>
          <InlineField label="Tax">
            <input type="number" min="0" step="0.01" value={payload.tax} onChange={(e) => setEdit((p) => ({ ...p, payload: { ...p.payload, tax: e.target.value } }))} required />
          </InlineField>
          <InlineField label="Total">
            <input type="number" min="0" step="0.01" value={payload.total} onChange={(e) => setEdit((p) => ({ ...p, payload: { ...p.payload, total: e.target.value } }))} required />
          </InlineField>
          <InlineField label="Currency">
            <input value={payload.currency} onChange={(e) => setEdit((p) => ({ ...p, payload: { ...p.payload, currency: e.target.value } }))} required />
          </InlineField>
          <InlineField label="Failure Reason" className="table-inline-field-wide">
            <textarea value={payload.failure_reason} onChange={(e) => setEdit((p) => ({ ...p, payload: { ...p.payload, failure_reason: e.target.value } }))} />
          </InlineField>
        </>
      );
    }

    return null;
  };

  return (
    <AdminLayout>
      <PageTransition>
        <section className="page-top">
          <div>
            <h1>Database Edit</h1>
            <p>Complete live data view across all major modules.</p>
          </div>
          <div className="inline-controls">
            <span className="meta-note">{lastUpdated ? `Last sync: ${formatDate(lastUpdated)}` : "Syncing..."}</span>
            <button type="button" className="btn btn-muted btn-icon" onClick={() => loadData({ silent: true })} disabled={refreshing}>
              <HiOutlineArrowPath />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </section>

        <div className="admin-tab-switch">
          {TABS.map((tab) => (
            <button key={tab.key} type="button" className={`admin-tab-btn ${activeTab === tab.key ? "active" : ""}`} onClick={() => setActiveTab(tab.key)}>
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingSpinner label="Loading database records..." />
        ) : (
          <section className="panel-card">
            <h2>{TABS.find((item) => item.key === activeTab)?.label}</h2>
            {activeTab !== "deleted" && activeTab !== "logs" && (
              <p className="meta-note">Tip: double-click a row to edit inline.</p>
            )}
            <div className="table-wrap">
              <table>
                <thead><tr>{headers[activeTab].map((header) => <th key={header}>{header}</th>)}</tr></thead>
                <tbody>
                  {activeTab === "deleted" || activeTab === "logs"
                    ? rows[activeTab].map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, cellIndex) => <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>)}
                      </tr>
                    ))
                    : rows[activeTab].map((row, rowIndex) => {
                      const record = dataByType[activeTab][rowIndex];
                      const isEditing = edit.type === activeTab && edit.id === record.id;
                      return (
                        <Fragment key={record.id}>
                          <tr
                            className={`table-row-editable ${isEditing ? "is-editing" : ""}`}
                            onDoubleClick={() => startEdit(activeTab, record)}
                          >
                            {row.map((cell, cellIndex) => <td key={`${record.id}-${cellIndex}`}>{cell}</td>)}
                            <td>
                              <div className="inline-controls">
                                <button type="button" className="btn btn-muted" onClick={() => startEdit(activeTab, record)}>
                                  {isEditing ? "Editing" : "Edit"}
                                </button>
                                <button type="button" className="btn btn-danger" onClick={() => setDeleteTarget({ type: activeTab, id: record.id })}>
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                          {isEditing && (
                            <tr className="table-inline-edit-row">
                              <td colSpan={headers[activeTab].length}>
                                <form className="table-inline-edit-wrap table-inline-edit-grid database-inline-edit-form" onSubmit={handleSave}>
                                  {renderInlineEditFields()}
                                  <div className="table-inline-edit-actions">
                                    <button type="submit" className="btn btn-primary" disabled={saving}>
                                      {saving ? "Saving..." : `Update ${editTypeLabel[activeTab] || "Record"}`}
                                    </button>
                                    <button type="button" className="btn btn-muted" onClick={clearEdit} disabled={saving}>
                                      Cancel
                                    </button>
                                  </div>
                                </form>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </PageTransition>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Record"
        message={`Delete record #${deleteTarget?.id || ""}?`}
        confirmText={saving ? "Deleting..." : "Delete"}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </AdminLayout>
  );
}
