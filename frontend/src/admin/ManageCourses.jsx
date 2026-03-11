import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import ConfirmModal from "../components/ConfirmModal";
import LoadingSpinner from "../components/LoadingSpinner";
import Pagination from "../components/Pagination";
import SearchBar from "../components/SearchBar";
import { useToast } from "../context/ToastContext";
import { usePaginatedList } from "../hooks/usePaginatedList";
import AdminLayout from "../layouts/AdminLayout";
import { courseService } from "../services/courseService";
import { downloadCsv, fetchAllPaginated } from "../utils/export";
import { formatDate } from "../utils/format";
import "./admin.css";

function normalizeMoneyNumber(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Math.max(0, Number(parsed.toFixed(2)));
}

function formatInr(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(normalizeMoneyNumber(value));
}

function normalizeFinalPrice(price, finalPrice) {
  const normalizedPrice = normalizeMoneyNumber(price);
  return Math.min(normalizedPrice, normalizeMoneyNumber(finalPrice));
}

function calculateExactDiscountPercentFromFinalPrice(price, finalPrice) {
  const normalizedPrice = normalizeMoneyNumber(price);
  if (normalizedPrice <= 0) {
    return 0;
  }
  const normalizedFinal = normalizeFinalPrice(normalizedPrice, finalPrice);
  const discountPercent = ((normalizedPrice - normalizedFinal) * 100) / normalizedPrice;
  return Number(discountPercent.toFixed(2));
}

function calculateRoundedDiscountPercentFromFinalPrice(price, finalPrice) {
  return Math.round(calculateExactDiscountPercentFromFinalPrice(price, finalPrice));
}

function calculatePriceSummaryFromFinalPrice(price, finalPrice) {
  const normalizedPrice = normalizeMoneyNumber(price);
  const normalizedFinal = normalizeFinalPrice(normalizedPrice, finalPrice);
  const discountAmount = Number(Math.max(0, normalizedPrice - normalizedFinal).toFixed(2));
  const discountPercentExact = calculateExactDiscountPercentFromFinalPrice(normalizedPrice, normalizedFinal);
  const discountPercentRounded = Math.round(discountPercentExact);

  return {
    listPrice: normalizedPrice,
    discountPercentExact,
    discountPercentRounded,
    discountAmount,
    finalPrice: normalizedFinal,
  };
}

function deriveCourseFinalPrice(course) {
  if (course?.final_price !== undefined && course?.final_price !== null) {
    return normalizeMoneyNumber(course.final_price);
  }
  if (course?.discounted_price !== undefined && course?.discounted_price !== null) {
    return normalizeMoneyNumber(course.discounted_price);
  }
  const normalizedPrice = normalizeMoneyNumber(course?.price);
  const discountPercent = Number(course?.discount_percent || 0);
  const derivedFinal = normalizedPrice - (normalizedPrice * discountPercent) / 100;
  return Number(Math.max(0, derivedFinal).toFixed(2));
}

const EMPTY_FORM = {
  title: "",
  short_description: "",
  description: "",
  duration_days: "30",
  price: "",
  final_price: "",
  discount_percent: "0",
  category_id: "",
  is_active: true,
  image: null,
};

function toCourseForm(course) {
  const price = normalizeMoneyNumber(course.price);
  const finalPrice = deriveCourseFinalPrice(course);
  const discountPercentExact = calculateExactDiscountPercentFromFinalPrice(price, finalPrice);

  return {
    title: course.title || "",
    short_description: course.short_description || "",
    description: course.description || "",
    duration_days: String(course.duration_days ?? "30"),
    price: String(price),
    final_price: String(finalPrice),
    discount_percent: discountPercentExact.toFixed(2),
    category_id: String(course.category?.id || ""),
    is_active: Boolean(course.is_active),
    image: null,
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

function buildCoursePayload(form) {
  const price = normalizeMoneyNumber(form.price);
  const finalPrice = normalizeFinalPrice(price, form.final_price);
  const discountPercent = calculateExactDiscountPercentFromFinalPrice(price, finalPrice);

  const payload = new FormData();
  payload.append("title", form.title.trim());
  payload.append("short_description", form.short_description.trim());
  payload.append("description", form.description.trim());
  payload.append("duration_days", String(form.duration_days || "30").trim());
  payload.append("price", String(price));
  payload.append("final_price", String(finalPrice));
  payload.append("discount_percent", discountPercent.toFixed(2));
  payload.append("category_id", String(form.category_id));
  payload.append("is_active", String(Boolean(form.is_active)));
  if (form.image) {
    payload.append("image", form.image);
  }
  return payload;
}

function InlineField({ label, className = "", children }) {
  return (
    <div className={`table-inline-field ${className}`.trim()}>
      <span className="table-inline-field-label">{label}</span>
      {children}
    </div>
  );
}

function InlineCourseForm({
  form,
  setForm,
  categories,
  onSubmit,
  onCancel,
  submitLabel,
  savingLabel,
  saving,
}) {
  const priceSummary = useMemo(
    () => calculatePriceSummaryFromFinalPrice(form.price, form.final_price),
    [form.price, form.final_price],
  );

  return (
    <form className="table-inline-edit-wrap table-inline-edit-grid course-inline-edit-form" onSubmit={onSubmit}>
      <InlineField label="Course Title">
        <input
          aria-label="Title"
          placeholder="Title"
          value={form.title}
          onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
          required
        />
      </InlineField>

      <InlineField label="Short Description">
        <input
          aria-label="Short Description"
          placeholder="Short Description"
          value={form.short_description}
          onChange={(event) => setForm((prev) => ({ ...prev, short_description: event.target.value }))}
          required
        />
      </InlineField>

      <InlineField label="Full Description" className="table-inline-field-wide">
        <input
          aria-label="Description"
          placeholder="Description"
          value={form.description}
          onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          required
        />
      </InlineField>

      <InlineField label="Duration (Days)">
        <input
          aria-label="Duration Days"
          type="number"
          min="1"
          step="1"
          placeholder="Duration (days)"
          value={form.duration_days}
          onChange={(event) => setForm((prev) => ({ ...prev, duration_days: event.target.value }))}
          required
        />
      </InlineField>

      <InlineField label="Price">
        <input
          aria-label="Price"
          type="number"
          min="0"
          step="0.01"
          placeholder="Price"
          value={form.price}
          onChange={(event) =>
            setForm((prev) => {
              const nextPrice = event.target.value;
              const nextFinalPrice = prev.final_price === "" ? nextPrice : prev.final_price;
              const nextDiscount = calculateExactDiscountPercentFromFinalPrice(nextPrice, nextFinalPrice);
              return { ...prev, price: nextPrice, final_price: nextFinalPrice, discount_percent: nextDiscount.toFixed(2) };
            })
          }
          required
        />
      </InlineField>

      <InlineField label="Final Price">
        <input
          aria-label="Final Price"
          type="number"
          min="0"
          step="0.01"
          placeholder="Final Price"
          value={form.final_price}
          onChange={(event) =>
            setForm((prev) => {
              const nextFinalPrice = event.target.value;
              const nextDiscount = calculateExactDiscountPercentFromFinalPrice(prev.price, nextFinalPrice);
              return { ...prev, final_price: nextFinalPrice, discount_percent: nextDiscount.toFixed(2) };
            })
          }
          required
        />
      </InlineField>

      <InlineField label="Discount Percent (Auto)">
        <input
          aria-label="Discount Percent Auto"
          type="number"
          min="0"
          max="100"
          step="1"
          value={priceSummary.discountPercentRounded}
          readOnly
        />
      </InlineField>

      <InlineField label="Final Price">
        <input aria-label="Final Price Display" type="text" value={formatInr(priceSummary.finalPrice)} readOnly />
      </InlineField>

      <InlineField label="Category">
        <select
          aria-label="Category"
          value={form.category_id}
          onChange={(event) => setForm((prev) => ({ ...prev, category_id: event.target.value }))}
          required
        >
          <option value="">Select Category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </InlineField>

      <InlineField label="Course Status" className="table-inline-field-toggle">
        <label className="toggle-row table-inline-toggle">
          <input
            type="checkbox"
            checked={Boolean(form.is_active)}
            onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.checked }))}
          />
          Active
        </label>
      </InlineField>

      <InlineField label="Course Image">
        <input
          aria-label="Course Image"
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          onChange={(event) => setForm((prev) => ({ ...prev, image: event.target.files?.[0] || null }))}
        />
      </InlineField>

      <div className="table-inline-edit-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? savingLabel : submitLabel}
        </button>
        <button type="button" className="btn btn-muted" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function ManageCourses() {
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();
  const searchParamsKey = searchParams.toString();

  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState("all");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [exportingCourses, setExportingCourses] = useState(false);

  const [showCreateRow, setShowCreateRow] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [savingMode, setSavingMode] = useState("");

  const queryKey = useMemo(() => `${search}|${scope}`, [search, scope]);

  const fetchPage = useCallback(
    (targetPage) =>
      courseService.getCourses({
        page: targetPage,
        search,
        ...(scope !== "all" ? { scope } : {}),
      }),
    [search, scope],
  );

  const handleCourseLoadError = useCallback(() => {
    addToast({ type: "error", message: "Unable to load course management data." });
  }, [addToast]);

  const {
    items: courses,
    count,
    page,
    setPage,
    loading,
    reload,
  } = usePaginatedList({
    queryKey,
    fetchPage,
    onError: handleCourseLoadError,
  });

  const loadCategories = useCallback(async () => {
    try {
      const categoryResponse = await courseService.getCategories();
      setCategories(categoryResponse.data.results || categoryResponse.data || []);
    } catch {
      addToast({ type: "error", message: "Unable to load categories." });
    }
  }, [addToast]);

  useEffect(() => {
    const params = new URLSearchParams(searchParamsKey);
    const nextScope = params.get("scope") || "all";
    setScope(nextScope);
    setPage((currentPage) => (currentPage === 1 ? currentPage : 1));
  }, [searchParamsKey, setPage]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    setEditingCourseId(null);
    setEditForm(EMPTY_FORM);
    setShowCreateRow(false);
    setCreateForm(EMPTY_FORM);
  }, [queryKey]);

  const startEdit = (course) => {
    setEditingCourseId(course.id);
    setEditForm(toCourseForm(course));
    setShowCreateRow(false);
  };

  const cancelEdit = () => {
    setEditingCourseId(null);
    setEditForm(EMPTY_FORM);
  };

  const toggleCreateRow = () => {
    setShowCreateRow((prev) => !prev);
    setEditingCourseId(null);
    setEditForm(EMPTY_FORM);
    setCreateForm(EMPTY_FORM);
  };

  const handleCreateCourse = async (event) => {
    event.preventDefault();
    setSavingMode("create");
    try {
      await courseService.createCourse(buildCoursePayload(createForm));
      addToast({ type: "success", message: "Course created." });
      setShowCreateRow(false);
      setCreateForm(EMPTY_FORM);
      if (page !== 1) {
        setPage(1);
      } else {
        reload();
      }
    } catch (error) {
      addToast({ type: "error", message: firstApiError(error, "Unable to create course.") });
    } finally {
      setSavingMode("");
    }
  };

  const handleUpdateCourse = async (event) => {
    event.preventDefault();
    if (!editingCourseId) return;

    setSavingMode("edit");
    try {
      await courseService.updateCourse(editingCourseId, buildCoursePayload(editForm));
      addToast({ type: "success", message: "Course updated." });
      cancelEdit();
      reload();
    } catch (error) {
      addToast({ type: "error", message: firstApiError(error, "Unable to update course.") });
    } finally {
      setSavingMode("");
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      return;
    }
    try {
      await courseService.createCategory({ name: newCategoryName.trim(), description: "" });
      setNewCategoryName("");
      addToast({ type: "success", message: "Category added." });
      loadCategories();
    } catch {
      addToast({ type: "error", message: "Unable to add category." });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    try {
      await courseService.deleteCourse(deleteTarget.id, { reason: "admin_confirmed_delete" });
      addToast({ type: "success", message: "Course soft deleted." });
      setDeleteTarget(null);
      if (editingCourseId === deleteTarget.id) {
        cancelEdit();
      }
      reload();
    } catch {
      addToast({ type: "error", message: "Unable to delete course." });
    }
  };

  const handleExportCourses = async () => {
    setExportingCourses(true);
    try {
      const allCourses = await fetchAllPaginated((params) =>
        courseService.getCourses({
          ...params,
          search,
          ...(scope !== "all" ? { scope } : {}),
        }),
      );

      if (allCourses.length === 0) {
        addToast({ type: "warning", message: "No courses available to export." });
        return;
      }

      downloadCsv({
        filename: `courses_export_${new Date().toISOString().slice(0, 10)}.csv`,
        headers: [
          { key: "id", label: "Course ID" },
          { key: "title", label: "Title" },
          { key: "category", label: "Category" },
          { key: "duration_days", label: "Duration (Days)" },
          { key: "price", label: "Price" },
          { key: "final_price", label: "Final Price" },
          { key: "discount_percent", label: "Discount %" },
          { key: "is_active", label: "Active" },
          { key: "created_at", label: "Date" },
        ],
        rows: allCourses.map((course) => ({
          id: course.id,
          title: course.title || "",
          category: course.category?.name || "",
          duration_days: Number(course.duration_days || 0) > 0 ? `${course.duration_days} days` : "-",
          price: formatInr(course.price),
          final_price: formatInr(deriveCourseFinalPrice(course)),
          discount_percent: `${calculateRoundedDiscountPercentFromFinalPrice(course.price, deriveCourseFinalPrice(course))}%`,
          is_active: course.is_active ? "Yes" : "No",
          created_at: formatDate(course.created_at),
        })),
      });

      addToast({ type: "success", message: "Courses export generated." });
    } catch {
      addToast({ type: "error", message: "Unable to export course data." });
    } finally {
      setExportingCourses(false);
    }
  };

  return (
    <AdminLayout>
      <h1>Manage Courses</h1>
      <section className="panel-card">
        <div className="section-actions">
          <button type="button" className="btn btn-muted" onClick={toggleCreateRow} disabled={Boolean(savingMode)}>
            {showCreateRow ? "Cancel Add Row" : "Add Course"}
          </button>
          <button type="button" className="btn btn-muted" onClick={handleExportCourses} disabled={exportingCourses || Boolean(savingMode)}>
            {exportingCourses ? "Exporting..." : "Export Excel"}
          </button>
        </div>

        <div className="inline-controls">
          <input
            placeholder="New category name"
            value={newCategoryName}
            onChange={(event) => setNewCategoryName(event.target.value)}
          />
          <button type="button" className="btn btn-muted" onClick={handleCreateCategory}>
            Add Category
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
            <option value="all">All Courses</option>
            <option value="active">Active Courses</option>
            <option value="inactive">Inactive Courses</option>
            <option value="purchased">Purchased Courses</option>
            <option value="unpaid">Unpurchased Courses</option>
          </select>
        </div>
        <SearchBar value={search} onChange={setSearch} />
        <p className="meta-note">Tip: double-click a course row to edit inline.</p>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Duration</th>
                    <th>Price</th>
                    <th>Final Price</th>
                    <th>Discount</th>
                    <th>Active</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {showCreateRow && (
                    <tr className="table-inline-edit-row">
                      <td colSpan={8}>
                        <InlineCourseForm
                          form={createForm}
                          setForm={setCreateForm}
                          categories={categories}
                          onSubmit={handleCreateCourse}
                          onCancel={toggleCreateRow}
                          submitLabel="Create Course"
                          savingLabel="Creating..."
                          saving={savingMode === "create"}
                        />
                      </td>
                    </tr>
                  )}

                  {courses.map((course) => (
                    <Fragment key={course.id}>
                      <tr
                        className={`table-row-editable ${editingCourseId === course.id ? "is-editing" : ""}`}
                        onDoubleClick={() => startEdit(course)}
                      >
                        <td>{course.title}</td>
                        <td>{course.category?.name}</td>
                        <td>{Number(course.duration_days || 0) > 0 ? `${course.duration_days} days` : "-"}</td>
                        <td>{formatInr(course.price)}</td>
                        <td>{formatInr(deriveCourseFinalPrice(course))}</td>
                        <td>{`${calculateRoundedDiscountPercentFromFinalPrice(course.price, deriveCourseFinalPrice(course))}%`}</td>
                        <td>{course.is_active ? "Yes" : "No"}</td>
                        <td>
                          <div className="inline-controls">
                            <button type="button" className="btn btn-muted" onClick={() => startEdit(course)}>
                              {editingCourseId === course.id ? "Editing" : "Edit"}
                            </button>
                            <button type="button" className="btn btn-danger" onClick={() => setDeleteTarget(course)}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>

                      {editingCourseId === course.id && (
                        <tr className="table-inline-edit-row">
                          <td colSpan={8}>
                            <InlineCourseForm
                              form={editForm}
                              setForm={setEditForm}
                              categories={categories}
                              onSubmit={handleUpdateCourse}
                              onCancel={cancelEdit}
                              submitLabel="Update Course"
                              savingLabel="Updating..."
                              saving={savingMode === "edit"}
                            />
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
        title="Delete Course"
        message={`Are you sure you want to soft delete "${deleteTarget?.title || ""}"?`}
        confirmText="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </AdminLayout>
  );
}

