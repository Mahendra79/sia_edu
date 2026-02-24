import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import ConfirmModal from "../components/ConfirmModal";
import LoadingSpinner from "../components/LoadingSpinner";
import Pagination from "../components/Pagination";
import { useToast } from "../context/ToastContext";
import { usePaginatedList } from "../hooks/usePaginatedList";
import AdminLayout from "../layouts/AdminLayout";
import { authService } from "../services/authService";
import { downloadCsv, fetchAllPaginated } from "../utils/export";
import { formatCurrency, formatDate } from "../utils/format";
import "./admin.css";

const EMPTY_EDIT_FORM = {
  name: "",
  username: "",
  email: "",
  phone: "",
  is_active: true,
  is_email_verified: false,
};

function toEditForm(user) {
  return {
    name: user.name || "",
    username: user.username || "",
    email: user.email || "",
    phone: user.phone || "",
    is_active: Boolean(user.is_active),
    is_email_verified: Boolean(user.is_email_verified),
  };
}

function firstApiError(error, fallback) {
  const payload = error?.response?.data;
  if (!payload) return fallback;
  if (typeof payload === "string") return payload;
  if (payload.detail) return payload.detail;
  const firstMessage = Object.values(payload).flat().find(Boolean);
  return firstMessage ? String(firstMessage) : fallback;
}

function InlineField({ label, className = "", children }) {
  return (
    <div className={`table-inline-field ${className}`.trim()}>
      <span className="table-inline-field-label">{label}</span>
      {children}
    </div>
  );
}

export default function ManageUsers() {
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();
  const searchParamsKey = searchParams.toString();

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [exportingUsers, setExportingUsers] = useState(false);
  const [scope, setScope] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");

  const [editingUserId, setEditingUserId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);
  const [savingEdit, setSavingEdit] = useState(false);

  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userPayments, setUserPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  const queryKey = useMemo(() => `${scope}|${paymentStatusFilter}`, [scope, paymentStatusFilter]);

  const fetchPage = useCallback(
    (targetPage) =>
      authService.getAdminUsers({
        page: targetPage,
        ...(scope !== "all" ? { scope } : {}),
        ...(paymentStatusFilter ? { payment_status: paymentStatusFilter } : {}),
      }),
    [scope, paymentStatusFilter],
  );

  const handleLoadError = useCallback(() => {
    addToast({ type: "error", message: "Unable to load users." });
  }, [addToast]);

  const {
    items: users,
    count,
    page,
    setPage,
    loading,
    reload,
  } = usePaginatedList({
    queryKey,
    fetchPage,
    onError: handleLoadError,
  });

  useEffect(() => {
    const params = new URLSearchParams(searchParamsKey);
    const nextScope = params.get("scope") || "all";
    const nextPaymentStatus = params.get("payment_status") || "";
    setScope(nextScope);
    setPaymentStatusFilter(nextPaymentStatus);
    setPage((currentPage) => (currentPage === 1 ? currentPage : 1));
  }, [searchParamsKey, setPage]);

  useEffect(() => {
    setEditingUserId(null);
    setEditForm(EMPTY_EDIT_FORM);
    setSelectedUserId(null);
    setUserPayments([]);
  }, [queryKey]);

  const startEdit = (user) => {
    setEditingUserId(user.id);
    setEditForm(toEditForm(user));
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setEditForm(EMPTY_EDIT_FORM);
  };

  const handleSaveUser = async (event) => {
    event.preventDefault();
    if (!editingUserId) return;

    setSavingEdit(true);
    try {
      const payload = {
        name: editForm.name.trim(),
        username: editForm.username.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
        is_active: editForm.is_active,
        is_email_verified: editForm.is_email_verified,
      };
      await authService.updateAdminUser(editingUserId, payload);
      addToast({ type: "success", message: "User updated." });
      cancelEdit();
      reload();
    } catch (error) {
      addToast({ type: "error", message: firstApiError(error, "Unable to update user.") });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) {
      return;
    }
    try {
      await authService.softDeleteUser(deleteTarget.id, { reason: "admin_soft_delete_user" });
      addToast({ type: "success", message: "User soft deleted." });
      setDeleteTarget(null);
      if (editingUserId === deleteTarget.id) {
        cancelEdit();
      }
      if (selectedUserId === deleteTarget.id) {
        setSelectedUserId(null);
        setUserPayments([]);
      }
      reload();
    } catch {
      addToast({ type: "error", message: "Unable to delete user." });
    }
  };

  const toggleUserPayments = async (user) => {
    if (selectedUserId === user.id) {
      setSelectedUserId(null);
      setUserPayments([]);
      return;
    }

    setSelectedUserId(user.id);
    setLoadingPayments(true);
    try {
      const response = await authService.getUserPayments(user.id, { page: 1 });
      setUserPayments(response.data.results || response.data || []);
    } catch {
      setUserPayments([]);
      addToast({ type: "error", message: "Unable to load user payments." });
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleExportUsers = async () => {
    setExportingUsers(true);
    try {
      const allUsers = await fetchAllPaginated((params) =>
        authService.getAdminUsers({
          ...params,
          ...(scope !== "all" ? { scope } : {}),
          ...(paymentStatusFilter ? { payment_status: paymentStatusFilter } : {}),
        }),
      );
      if (allUsers.length === 0) {
        addToast({ type: "warning", message: "No users available to export." });
        return;
      }

      downloadCsv({
        filename: `users_export_${new Date().toISOString().slice(0, 10)}.csv`,
        headers: [
          { key: "id", label: "User ID" },
          { key: "name", label: "Name" },
          { key: "username", label: "Username" },
          { key: "email", label: "Email" },
          { key: "phone", label: "Phone" },
          { key: "is_admin", label: "Admin" },
          { key: "is_active", label: "Active" },
          { key: "is_email_verified", label: "Email Verified" },
          { key: "created_at", label: "Date" },
        ],
        rows: allUsers.map((user) => ({
          id: user.id,
          name: user.name || "",
          username: user.username || "",
          email: user.email || "",
          phone: user.phone || "",
          is_admin: user.is_admin ? "Yes" : "No",
          is_active: user.is_active ? "Yes" : "No",
          is_email_verified: user.is_email_verified ? "Yes" : "No",
          created_at: formatDate(user.created_at),
        })),
      });

      addToast({ type: "success", message: "Users export generated." });
    } catch {
      addToast({ type: "error", message: "Unable to export user data." });
    } finally {
      setExportingUsers(false);
    }
  };

  return (
    <AdminLayout>
      <h1>Manage Users</h1>
      <section className="panel-card">
        <div className="section-actions">
          <button type="button" className="btn btn-muted" onClick={handleExportUsers} disabled={exportingUsers}>
            {exportingUsers ? "Exporting..." : "Export Excel"}
          </button>
        </div>
        <div className="filters-row">
          <select
            value={scope}
            onChange={(event) => {
              setScope(event.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Users</option>
            <option value="verified">Verified Users</option>
            <option value="unverified">Unverified Users</option>
            <option value="active">Active Users</option>
            <option value="inactive">Inactive Users</option>
            <option value="payment_users">Payment Users</option>
            <option value="non_payment_users">No-Payment Users</option>
          </select>
          <select
            value={paymentStatusFilter}
            onChange={(event) => {
              setPaymentStatusFilter(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Any Payment Status</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        <p className="meta-note">Tip: double-click a user row to edit inline.</p>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Active</th>
                    <th>Verified</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <Fragment key={user.id}>
                      <tr
                        className={`table-row-editable ${editingUserId === user.id ? "is-editing" : ""}`}
                        onDoubleClick={() => startEdit(user)}
                      >
                        <td>{user.name}</td>
                        <td>{user.username}</td>
                        <td>{user.email}</td>
                        <td>{user.phone}</td>
                        <td>{user.is_active ? "Yes" : "No"}</td>
                        <td>{user.is_email_verified ? "Yes" : "No"}</td>
                        <td>
                          <div className="inline-controls">
                            <button type="button" className="btn btn-muted" onClick={() => startEdit(user)}>
                              {editingUserId === user.id ? "Editing" : "Edit"}
                            </button>
                            <button type="button" className="btn btn-muted" onClick={() => toggleUserPayments(user)}>
                              {selectedUserId === user.id ? "Hide Payments" : "Payments"}
                            </button>
                            <button type="button" className="btn btn-danger" onClick={() => setDeleteTarget(user)}>
                              Soft Delete
                            </button>
                          </div>
                        </td>
                      </tr>

                      {editingUserId === user.id && (
                        <tr className="table-inline-edit-row">
                          <td colSpan={7}>
                            <form className="table-inline-edit-wrap table-inline-edit-grid" onSubmit={handleSaveUser}>
                              <InlineField label="Name">
                                <input
                                  aria-label="Name"
                                  placeholder="Name"
                                  value={editForm.name}
                                  onChange={(event) => setEditForm((prev) => ({ ...prev, name: event.target.value }))}
                                  required
                                />
                              </InlineField>
                              <InlineField label="Username">
                                <input
                                  aria-label="Username"
                                  placeholder="Username"
                                  value={editForm.username}
                                  onChange={(event) => setEditForm((prev) => ({ ...prev, username: event.target.value }))}
                                  required
                                />
                              </InlineField>
                              <InlineField label="Email">
                                <input
                                  aria-label="Email"
                                  type="email"
                                  placeholder="Email"
                                  value={editForm.email}
                                  onChange={(event) => setEditForm((prev) => ({ ...prev, email: event.target.value }))}
                                  required
                                />
                              </InlineField>
                              <InlineField label="Phone">
                                <input
                                  aria-label="Phone"
                                  placeholder="Phone"
                                  value={editForm.phone}
                                  onChange={(event) => setEditForm((prev) => ({ ...prev, phone: event.target.value }))}
                                  required
                                />
                              </InlineField>
                              <InlineField label="Account Status" className="table-inline-field-toggle">
                                <label className="toggle-row table-inline-toggle">
                                  <input
                                    type="checkbox"
                                    checked={editForm.is_active}
                                    onChange={(event) => setEditForm((prev) => ({ ...prev, is_active: event.target.checked }))}
                                  />
                                  Active
                                </label>
                              </InlineField>
                              <InlineField label="Email Verification" className="table-inline-field-toggle">
                                <label className="toggle-row table-inline-toggle">
                                  <input
                                    type="checkbox"
                                    checked={editForm.is_email_verified}
                                    onChange={(event) =>
                                      setEditForm((prev) => ({ ...prev, is_email_verified: event.target.checked }))
                                    }
                                  />
                                  Email Verified
                                </label>
                              </InlineField>
                              <div className="table-inline-edit-actions">
                                <button type="submit" className="btn btn-primary" disabled={savingEdit}>
                                  {savingEdit ? "Saving..." : "Save"}
                                </button>
                                <button type="button" className="btn btn-muted" onClick={cancelEdit} disabled={savingEdit}>
                                  Cancel
                                </button>
                              </div>
                            </form>
                          </td>
                        </tr>
                      )}

                      {selectedUserId === user.id && (
                        <tr className="table-detail-row">
                          <td colSpan={7}>
                            <div className="table-detail-panel">
                              <h3>User Payment History</h3>
                              {loadingPayments ? (
                                <p className="empty-state">Loading payment history...</p>
                              ) : userPayments.length === 0 ? (
                                <p className="empty-state">No payment history for this user.</p>
                              ) : (
                                <div className="table-wrap">
                                  <table>
                                    <thead>
                                      <tr>
                                        <th>Course</th>
                                        <th>Status</th>
                                        <th>Total</th>
                                        <th>Date</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {userPayments.map((payment) => (
                                        <tr key={payment.id}>
                                          <td>{payment.course_title}</td>
                                          <td>{payment.payment_status}</td>
                                          <td>{formatCurrency(payment.total)}</td>
                                          <td>{formatDate(payment.created_at)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination count={count} currentPage={page} onPageChange={setPage} />
          </>
        )}
      </section>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Soft Delete User"
        message={`Soft delete "${deleteTarget?.email || ""}"?`}
        confirmText="Soft Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteUser}
      />
    </AdminLayout>
  );
}
