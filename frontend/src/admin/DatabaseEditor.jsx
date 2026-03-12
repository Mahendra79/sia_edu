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
  { key: "payments", label: "Payments" },
  { key: "tables", label: "All Tables" },
  { key: "coupons", label: "Coupons" },
  { key: "deleted", label: "Deleted Records" },
  { key: "logs", label: "Activity Logs" },
];

const EMPTY_EDIT = {
  type: "",
  id: null,
  payload: {},
};

const EMPTY_COUPON = {
  code: "",
  course: "",
  discount_amount: "",
  max_uses: "",
  per_user_limit: "1",
  valid_from: "",
  valid_until: "",
  is_active: true,
};

const EMPTY_DB_EDIT = {
  tableKey: "",
  pk: null,
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

function toInputDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toIsoFromInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
}

function toInputDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatDbValue(value) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
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
  const [payments, setPayments] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [deletedRecords, setDeletedRecords] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [courseImage, setCourseImage] = useState(null);
  const [couponDraft, setCouponDraft] = useState(EMPTY_COUPON);
  const [dbTables, setDbTables] = useState([]);
  const [dbTableKey, setDbTableKey] = useState("");
  const [dbColumns, setDbColumns] = useState([]);
  const [dbRows, setDbRows] = useState([]);
  const [dbCount, setDbCount] = useState(0);
  const [dbPage, setDbPage] = useState(1);
  const [dbPageSize] = useState(25);
  const [dbLoading, setDbLoading] = useState(false);
  const [dbEdit, setDbEdit] = useState(EMPTY_DB_EDIT);

  const loadData = useCallback(
    async ({ silent = false } = {}) => {
      if (silent) setRefreshing(true);
      else setLoading(true);

      try {
        const [u, c, ca, e, p, co, d, l] = await Promise.all([
          fetchAllPaginated((params) => authService.getAdminUsers(params)),
          fetchAllPaginated((params) => courseService.getCourses(params)),
          fetchAllPaginated((params) => courseService.getCategories(params)),
          fetchAllPaginated((params) => courseService.getAdminEnrollments(params)),
          fetchAllPaginated((params) => paymentService.getAdminPaymentHistory(params)),
          fetchAllPaginated((params) => paymentService.getAdminCoupons(params)),
          fetchAllPaginated((params) => deletedRecordService.getDeletedRecords(params)),
          fetchAllPaginated((params) => analyticsService.getActivityLogs(params)),
        ]);

        setUsers(u);
        setCourses(c);
        setCategories(ca);
        setEnrollments(e);
        setPayments(p);
        setCoupons(co);
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

  const loadDbTables = useCallback(async () => {
    setDbLoading(true);
    try {
      const { data } = await analyticsService.getAdminDbTables();
      const tables = data?.tables || [];
      setDbTables(tables);
      if (!dbTableKey && tables.length) {
        setDbTableKey(tables[0].key);
      }
    } catch {
      addToast({ type: "error", message: "Unable to load database tables." });
    } finally {
      setDbLoading(false);
    }
  }, [addToast, dbTableKey]);

  const loadDbRows = useCallback(
    async ({ page = dbPage } = {}) => {
      if (!dbTableKey) return;
      setDbLoading(true);
      try {
        const { data } = await analyticsService.getAdminDbRows(dbTableKey, {
          page,
          page_size: dbPageSize,
        });
        setDbColumns(data?.columns || []);
        setDbRows(data?.rows || []);
        setDbCount(Number(data?.count || 0));
        setDbPage(Number(data?.page || page));
      } catch (error) {
        addToast({ type: "error", message: getApiError(error, "Unable to load table rows.") });
      } finally {
        setDbLoading(false);
      }
    },
    [addToast, dbPage, dbPageSize, dbTableKey],
  );

  useEffect(() => {
    loadDbTables();
  }, [loadDbTables]);

  useEffect(() => {
    if (dbTableKey) loadDbRows({ page: 1 });
    setDbEdit(EMPTY_DB_EDIT);
  }, [dbTableKey, loadDbRows]);

  const categoryOptions = useMemo(
    () => categories.map((category) => ({ label: category.name, value: String(category.id) })),
    [categories],
  );

  const courseOptions = useMemo(
    () => courses.map((course) => ({ label: course.title, value: String(course.id) })),
    [courses],
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
    } else if (type === "coupons") {
      setEdit({
        type,
        id: item.id,
        payload: {
          code: item.code || "",
          course: item.course ? String(item.course) : "",
          discount_amount: String(item.discount_amount || ""),
          max_uses: item.max_uses === null || item.max_uses === undefined ? "" : String(item.max_uses),
          per_user_limit: String(item.per_user_limit ?? "1"),
          used_count: String(item.used_count ?? "0"),
          valid_from: item.valid_from || "",
          valid_until: item.valid_until || "",
          is_active: Boolean(item.is_active),
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
      } else if (edit.type === "payments") {
        await paymentService.updateAdminPayment(edit.id, edit.payload);
      } else if (edit.type === "coupons") {
        const payload = {
          code: edit.payload.code?.trim().toUpperCase(),
          course: edit.payload.course ? Number(edit.payload.course) : null,
          discount_amount: edit.payload.discount_amount,
          max_uses: edit.payload.max_uses ? Number(edit.payload.max_uses) : null,
          per_user_limit: edit.payload.per_user_limit ? Number(edit.payload.per_user_limit) : 1,
          valid_from: edit.payload.valid_from || null,
          valid_until: edit.payload.valid_until || null,
          is_active: Boolean(edit.payload.is_active),
        };
        await paymentService.updateAdminCoupon(edit.id, payload);
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

  const handleCreateCoupon = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        code: couponDraft.code?.trim().toUpperCase(),
        course: couponDraft.course ? Number(couponDraft.course) : null,
        discount_amount: couponDraft.discount_amount,
        max_uses: couponDraft.max_uses ? Number(couponDraft.max_uses) : null,
        per_user_limit: couponDraft.per_user_limit ? Number(couponDraft.per_user_limit) : 1,
        valid_from: couponDraft.valid_from || null,
        valid_until: couponDraft.valid_until || null,
        is_active: Boolean(couponDraft.is_active),
      };
      await paymentService.createAdminCoupon(payload);
      addToast({ type: "success", message: "Coupon created." });
      setCouponDraft(EMPTY_COUPON);
      loadData({ silent: true });
    } catch (error) {
      addToast({ type: "error", message: getApiError(error, "Unable to create coupon.") });
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
      } else if (deleteTarget.type === "payments") {
        await paymentService.deleteAdminPayment(deleteTarget.id, { reason: "admin_database_editor_delete" });
      } else if (deleteTarget.type === "coupons") {
        await paymentService.deleteAdminCoupon(deleteTarget.id);
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

  const startDbEdit = (row) => {
    const payload = {};
    dbColumns.forEach((column) => {
      payload[column.name] = row[column.name] ?? "";
    });
    setDbEdit({ tableKey: dbTableKey, pk: row.__pk, payload });
  };

  const clearDbEdit = () => {
    setDbEdit(EMPTY_DB_EDIT);
  };

  const handleDbSave = async (event) => {
    event.preventDefault();
    if (!dbEdit.pk || !dbTableKey) return;
    setSaving(true);
    try {
      const payload = {};
      dbColumns.forEach((column) => {
        if (column.read_only) return;
        const raw = dbEdit.payload[column.name];
        if (raw === "" || raw === undefined) {
          if (column.null) payload[column.name] = null;
          return;
        }

        if (column.type === "BooleanField") {
          payload[column.name] = Boolean(raw);
          return;
        }

        if (column.type === "DateTimeField") {
          payload[column.name] = toIsoFromInput(raw);
          return;
        }

        if (column.type === "DateField") {
          payload[column.name] = raw;
          return;
        }

        if (column.type === "IntegerField" || column.type === "BigIntegerField" || column.type === "PositiveIntegerField") {
          payload[column.name] = Number(raw);
          return;
        }

        if (column.type === "FloatField" || column.type === "DecimalField") {
          payload[column.name] = String(raw);
          return;
        }

        if (column.type === "JSONField") {
          try {
            payload[column.name] = JSON.parse(raw);
          } catch {
            payload[column.name] = raw;
          }
          return;
        }

        payload[column.name] = raw;
      });

      await analyticsService.updateAdminDbRow(dbTableKey, dbEdit.pk, payload);
      addToast({ type: "success", message: "Record updated." });
      clearDbEdit();
      loadDbRows({ page: dbPage });
    } catch (error) {
      addToast({ type: "error", message: getApiError(error, "Unable to update record.") });
    } finally {
      setSaving(false);
    }
  };

  const handleDbDelete = async (pk) => {
    if (!dbTableKey || !pk) return;
    setSaving(true);
    try {
      await analyticsService.deleteAdminDbRow(dbTableKey, pk);
      addToast({ type: "success", message: "Record deleted." });
      if (dbEdit.pk === pk) clearDbEdit();
      loadDbRows({ page: dbPage });
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
      Number(item.duration_days || 0) > 0 ? `${item.duration_days} days` : "-",
      formatCurrency(item.price, "INR"),
      Number(item.discount_percent || 0) > 0 ? `${Number(item.discount_percent).toFixed(2)}%` : "-",
      item.is_active ? "Yes" : "No",
      formatDate(item.created_at),
    ]),
    categories: categories.map((item) => [item.name, item.description || "-", formatDate(item.created_at)]),
    enrollments: enrollments.map((item) => [item.user_email, item.course_title, item.status, item.payment_status, formatDate(item.enrolled_at)]),
    payments: payments.map((item) => [item.user_email, item.course_title, item.payment_status, formatCurrency(item.total), formatDate(item.created_at)]),
    coupons: coupons.map((item) => {
      const maxUses = item.max_uses === null || item.max_uses === undefined ? "∞" : item.max_uses;
      const used = item.used_count ?? 0;
      const validFrom = item.valid_from ? formatDate(item.valid_from) : "-";
      const validUntil = item.valid_until ? formatDate(item.valid_until) : "-";
      return [
        item.code,
        item.course_title || "Global",
        formatCurrency(item.discount_amount, "INR"),
        `${used}/${maxUses}`,
        item.per_user_limit ?? 1,
        `${validFrom} → ${validUntil}`,
        item.is_active ? "Yes" : "No",
        formatDate(item.created_at),
      ];
    }),
    deleted: deletedRecords.map((item) => [item.model_name, item.record_id, item.reason || "-", item.deleted_by_email || "-", formatDate(item.deleted_at)]),
    logs: activityLogs.map((item) => [item.admin_email, item.action, `${item.target_type} #${item.target_id}`, item.details || "-", formatDate(item.created_at)]),
  };

  const headers = {
    users: ["Name", "Email", "Phone", "Active", "Date", "Actions"],
    courses: ["Title", "Category", "Duration", "Price", "Discount", "Active", "Date", "Actions"],
    categories: ["Name", "Description", "Date", "Actions"],
    enrollments: ["User", "Course", "Status", "Payment", "Date", "Actions"],
    payments: ["User", "Course", "Status", "Total", "Date", "Actions"],
    coupons: ["Code", "Course", "Discount", "Uses", "Per User", "Validity", "Active", "Created", "Actions"],
    deleted: ["Model", "Record ID", "Reason", "Deleted By", "Date"],
    logs: ["Admin", "Action", "Target", "Details", "Date"],
  };

  const dataByType = { users, courses, categories, enrollments, payments, coupons };

  const editTypeLabel = {
    users: "User",
    courses: "Course",
    categories: "Category",
    enrollments: "Enrollment",
    payments: "Payment",
    coupons: "Coupon",
  };

  const dbTotalPages = Math.max(1, Math.ceil(dbCount / dbPageSize));

  const renderDbEditFields = () =>
    dbColumns
      .filter((column) => !column.read_only)
      .map((column) => {
        const value = dbEdit.payload[column.name] ?? "";
        const label = column.name;
        const isRelation = column.is_relation;
        const placeholder = isRelation && column.related_model ? `FK: ${column.related_model}` : undefined;

        if (column.choices?.length) {
          return (
            <InlineField key={column.name} label={label}>
              <select
                value={value === null || value === undefined ? "" : value}
                onChange={(e) => setDbEdit((p) => ({ ...p, payload: { ...p.payload, [column.name]: e.target.value } }))}
              >
                {column.null && <option value="">(Empty)</option>}
                {column.choices.map((choice) => (
                  <option key={`${column.name}-${choice.value}`} value={choice.value}>
                    {choice.label}
                  </option>
                ))}
              </select>
            </InlineField>
          );
        }

        if (column.type === "BooleanField") {
          return (
            <InlineField key={column.name} label={label} className="table-inline-field-toggle">
              <label className="toggle-row table-inline-toggle">
                <input
                  type="checkbox"
                  checked={Boolean(value)}
                  onChange={(e) => setDbEdit((p) => ({ ...p, payload: { ...p.payload, [column.name]: e.target.checked } }))}
                />
                Enabled
              </label>
            </InlineField>
          );
        }

        if (column.type === "DateTimeField") {
          return (
            <InlineField key={column.name} label={label}>
              <input
                type="datetime-local"
                value={toInputDateTime(value)}
                onChange={(e) => setDbEdit((p) => ({ ...p, payload: { ...p.payload, [column.name]: e.target.value } }))}
                placeholder={placeholder}
              />
            </InlineField>
          );
        }

        if (column.type === "DateField") {
          return (
            <InlineField key={column.name} label={label}>
              <input
                type="date"
                value={toInputDate(value)}
                onChange={(e) => setDbEdit((p) => ({ ...p, payload: { ...p.payload, [column.name]: e.target.value } }))}
                placeholder={placeholder}
              />
            </InlineField>
          );
        }

        if (column.type === "TextField" || column.type === "JSONField") {
          const textValue = typeof value === "string" ? value : JSON.stringify(value ?? "", null, 2);
          return (
            <InlineField key={column.name} label={label} className="table-inline-field-wide">
              <textarea
                value={textValue}
                onChange={(e) => setDbEdit((p) => ({ ...p, payload: { ...p.payload, [column.name]: e.target.value } }))}
                placeholder={placeholder}
              />
            </InlineField>
          );
        }

        const numberTypes = ["IntegerField", "BigIntegerField", "PositiveIntegerField", "FloatField", "DecimalField"];
        if (numberTypes.includes(column.type)) {
          const step = column.type === "IntegerField" || column.type === "BigIntegerField" || column.type === "PositiveIntegerField" ? "1" : "0.01";
          return (
            <InlineField key={column.name} label={label}>
              <input
                type="number"
                step={step}
                value={value}
                onChange={(e) => setDbEdit((p) => ({ ...p, payload: { ...p.payload, [column.name]: e.target.value } }))}
                placeholder={placeholder}
              />
            </InlineField>
          );
        }

        return (
          <InlineField key={column.name} label={label}>
            <input
              value={value === null || value === undefined ? "" : value}
              onChange={(e) => setDbEdit((p) => ({ ...p, payload: { ...p.payload, [column.name]: e.target.value } }))}
              placeholder={placeholder}
            />
          </InlineField>
        );
      });

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

    if (edit.type === "coupons") {
      return (
        <>
          <InlineField label="Code">
            <input
              value={payload.code}
              onChange={(e) => setEdit((p) => ({ ...p, payload: { ...p.payload, code: e.target.value.toUpperCase() } }))}
              required
            />
          </InlineField>
          <InlineField label="Course">
            <select value={payload.course} onChange={(e) => setEdit((p) => ({ ...p, payload: { ...p.payload, course: e.target.value } }))}>
              <option value="">Global</option>
              {courseOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </InlineField>
          <InlineField label="Discount Amount">
            <input
              type="number"
              min="0"
              step="0.01"
              value={payload.discount_amount}
              onChange={(e) => setEdit((p) => ({ ...p, payload: { ...p.payload, discount_amount: e.target.value } }))}
              required
            />
          </InlineField>
          <InlineField label="Max Uses">
            <input
              type="number"
              min="1"
              step="1"
              value={payload.max_uses}
              onChange={(e) => setEdit((p) => ({ ...p, payload: { ...p.payload, max_uses: e.target.value } }))}
              placeholder="Unlimited"
            />
          </InlineField>
          <InlineField label="Per User Limit">
            <input
              type="number"
              min="1"
              step="1"
              value={payload.per_user_limit}
              onChange={(e) => setEdit((p) => ({ ...p, payload: { ...p.payload, per_user_limit: e.target.value } }))}
              required
            />
          </InlineField>
          <InlineField label="Used Count">
            <input value={payload.used_count} disabled />
          </InlineField>
          <InlineField label="Valid From">
            <input
              type="datetime-local"
              value={toInputDateTime(payload.valid_from)}
              onChange={(e) => setEdit((p) => ({ ...p, payload: { ...p.payload, valid_from: toIsoFromInput(e.target.value) } }))}
            />
          </InlineField>
          <InlineField label="Valid Until">
            <input
              type="datetime-local"
              value={toInputDateTime(payload.valid_until)}
              onChange={(e) => setEdit((p) => ({ ...p, payload: { ...p.payload, valid_until: toIsoFromInput(e.target.value) } }))}
            />
          </InlineField>
          <InlineField label="Status" className="table-inline-field-toggle">
            <label className="toggle-row table-inline-toggle">
              <input
                type="checkbox"
                checked={payload.is_active}
                onChange={(e) => setEdit((p) => ({ ...p, payload: { ...p.payload, is_active: e.target.checked } }))}
              />
              Active
            </label>
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
        ) : activeTab === "tables" ? (
          <section className="panel-card">
            <h2>All Tables</h2>
            <p className="meta-note">Non-system tables only. Double-click a row to edit inline.</p>
            <div className="inline-controls db-table-controls">
              <select value={dbTableKey} onChange={(e) => setDbTableKey(e.target.value)} disabled={dbLoading}>
                <option value="">Select a table</option>
                {dbTables.map((table) => (
                  <option key={table.key} value={table.key}>
                    {table.label} ({table.key})
                  </option>
                ))}
              </select>
              <button type="button" className="btn btn-muted btn-icon" onClick={() => loadDbRows({ page: dbPage })} disabled={dbLoading || !dbTableKey}>
                <HiOutlineArrowPath />
                {dbLoading ? "Refreshing..." : "Refresh"}
              </button>
              <span className="meta-note db-table-meta">
                {dbTableKey ? `Rows: ${dbCount}` : "Pick a table to view rows."}
              </span>
              <div className="inline-controls db-table-pagination">
                <button type="button" className="btn btn-muted" disabled={dbPage <= 1 || dbLoading} onClick={() => loadDbRows({ page: dbPage - 1 })}>
                  Prev
                </button>
                <span className="meta-note">
                  Page {dbPage} of {dbTotalPages}
                </span>
                <button type="button" className="btn btn-muted" disabled={dbPage >= dbTotalPages || dbLoading} onClick={() => loadDbRows({ page: dbPage + 1 })}>
                  Next
                </button>
              </div>
            </div>
            {dbLoading && <LoadingSpinner label="Loading table..." />}
            {!dbLoading && dbTableKey && (
              <div className="table-wrap db-table-wrap">
                <table className="db-table">
                  <thead>
                    <tr>
                      {dbColumns.map((column) => (
                        <th key={column.name}>{column.name}</th>
                      ))}
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dbRows.map((row) => {
                      const isEditing = dbEdit.tableKey === dbTableKey && String(dbEdit.pk) === String(row.__pk);
                      return (
                        <Fragment key={`${dbTableKey}-${row.__pk}`}>
                          <tr
                            className={`table-row-editable ${isEditing ? "is-editing" : ""}`}
                            onDoubleClick={() => startDbEdit(row)}
                          >
                            {dbColumns.map((column) => {
                              const displayValue = column.is_relation && row[`${column.name}__display`]
                                ? `${row[`${column.name}__display`]} (${row[column.name]})`
                                : formatDbValue(row[column.name]);
                              return <td key={`${row.__pk}-${column.name}`}>{displayValue}</td>;
                            })}
                            <td>
                              <div className="inline-controls">
                                <button type="button" className="btn btn-muted" onClick={() => startDbEdit(row)}>
                                  {isEditing ? "Editing" : "Edit"}
                                </button>
                                <button type="button" className="btn btn-danger" onClick={() => handleDbDelete(row.__pk)}>
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                          {isEditing && (
                            <tr className="table-inline-edit-row">
                              <td colSpan={dbColumns.length + 1}>
                                <form className="table-inline-edit-wrap table-inline-edit-grid database-inline-edit-form" onSubmit={handleDbSave}>
                                  {renderDbEditFields()}
                                  <div className="table-inline-edit-actions">
                                    <button type="submit" className="btn btn-primary" disabled={saving}>
                                      {saving ? "Saving..." : "Update Record"}
                                    </button>
                                    <button type="button" className="btn btn-muted" onClick={clearDbEdit} disabled={saving}>
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
            )}
          </section>
        ) : (
          <section className="panel-card">
            <h2>{TABS.find((item) => item.key === activeTab)?.label}</h2>
            {activeTab !== "deleted" && activeTab !== "logs" && (
              <p className="meta-note">Tip: double-click a row to edit inline.</p>
            )}
            {activeTab === "coupons" && (
              <form className="table-inline-edit-wrap table-inline-edit-grid database-inline-edit-form coupon-create-form" onSubmit={handleCreateCoupon}>
                <InlineField label="Code">
                  <input
                    value={couponDraft.code}
                    onChange={(e) => setCouponDraft((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                    placeholder="SAVE10"
                    required
                  />
                </InlineField>
                <InlineField label="Course">
                  <select value={couponDraft.course} onChange={(e) => setCouponDraft((p) => ({ ...p, course: e.target.value }))}>
                    <option value="">Global</option>
                    {courseOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </InlineField>
                <InlineField label="Discount Amount">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={couponDraft.discount_amount}
                    onChange={(e) => setCouponDraft((p) => ({ ...p, discount_amount: e.target.value }))}
                    required
                  />
                </InlineField>
                <InlineField label="Max Uses">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={couponDraft.max_uses}
                    onChange={(e) => setCouponDraft((p) => ({ ...p, max_uses: e.target.value }))}
                    placeholder="Unlimited"
                  />
                </InlineField>
                <InlineField label="Per User Limit">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={couponDraft.per_user_limit}
                    onChange={(e) => setCouponDraft((p) => ({ ...p, per_user_limit: e.target.value }))}
                    required
                  />
                </InlineField>
                <InlineField label="Valid From">
                  <input
                    type="datetime-local"
                    value={toInputDateTime(couponDraft.valid_from)}
                    onChange={(e) => setCouponDraft((p) => ({ ...p, valid_from: toIsoFromInput(e.target.value) }))}
                  />
                </InlineField>
                <InlineField label="Valid Until">
                  <input
                    type="datetime-local"
                    value={toInputDateTime(couponDraft.valid_until)}
                    onChange={(e) => setCouponDraft((p) => ({ ...p, valid_until: toIsoFromInput(e.target.value) }))}
                  />
                </InlineField>
                <InlineField label="Status" className="table-inline-field-toggle">
                  <label className="toggle-row table-inline-toggle">
                    <input
                      type="checkbox"
                      checked={couponDraft.is_active}
                      onChange={(e) => setCouponDraft((p) => ({ ...p, is_active: e.target.checked }))}
                    />
                    Active
                  </label>
                </InlineField>
                <div className="table-inline-edit-actions">
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? "Creating..." : "Create Coupon"}
                  </button>
                  <button type="button" className="btn btn-muted" onClick={() => setCouponDraft(EMPTY_COUPON)} disabled={saving}>
                    Reset
                  </button>
                </div>
              </form>
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
