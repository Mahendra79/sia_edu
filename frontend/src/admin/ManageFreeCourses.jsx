import { Fragment, useEffect, useState } from "react";

import ConfirmModal from "../components/ConfirmModal";
import { useToast } from "../context/ToastContext";
import AdminLayout from "../layouts/AdminLayout";
import { courseService } from "../services/courseService";
import { extractYoutubeThumbnail } from "../utils/youtube";
import "./admin.css";

const EMPTY_FORM = {
  title: "",
  youtube_url: "",
  thumbnail_url: "",
  is_active: true,
};

function firstApiError(error, fallback) {
  const payload = error?.response?.data;
  if (!payload) return fallback;
  if (typeof payload === "string") return payload;
  if (payload.detail) return payload.detail;
  const firstMessage = Object.values(payload).flat().find(Boolean);
  return firstMessage ? String(firstMessage) : fallback;
}

function toFreeCourseForm(freeCourse) {
  return {
    title: freeCourse.title || "",
    youtube_url: freeCourse.youtube_url || "",
    thumbnail_url: freeCourse.thumbnail_url || "",
    is_active: Boolean(freeCourse.is_active),
  };
}

function InlineField({ label, className = "", children }) {
  return (
    <div className={`table-inline-field ${className}`.trim()}>
      <span className="table-inline-field-label">{label}</span>
      {children}
    </div>
  );
}

function InlineFreeCourseForm({ form, setForm, onSubmit, onCancel, submitLabel, savingLabel, saving }) {
  const previewThumbnail = form.thumbnail_url || extractYoutubeThumbnail(form.youtube_url);

  return (
    <form className="table-inline-edit-wrap free-course-inline-form" onSubmit={onSubmit}>
      <div className="free-course-form-row">
        <InlineField label="Title">
          <input
            aria-label="Title"
            placeholder="Free course title"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            required
          />
        </InlineField>

        <InlineField label="YouTube Video/Playlist URL">
          <input
            aria-label="YouTube URL"
            placeholder="https://www.youtube.com/watch?v=... or playlist URL"
            value={form.youtube_url}
            onChange={(event) => setForm((prev) => ({ ...prev, youtube_url: event.target.value }))}
            required
          />
        </InlineField>
      </div>

      <div className="free-course-form-row">
        <InlineField label="Thumbnail URL (optional)">
          <div className="free-course-thumb-field">
            <span className="free-course-thumb-preview">
              {previewThumbnail && <img src={previewThumbnail} alt="" />}
            </span>
            <input
              aria-label="Thumbnail URL"
              placeholder="Leave blank to auto-fetch from YouTube"
              value={form.thumbnail_url}
              onChange={(event) => setForm((prev) => ({ ...prev, thumbnail_url: event.target.value }))}
            />
          </div>
        </InlineField>

        <InlineField label="Status" className="table-inline-field-toggle">
          <label className="free-course-switch">
            <input
              type="checkbox"
              checked={Boolean(form.is_active)}
              onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.checked }))}
            />
            <span className="free-course-switch-track" />
            <span className="free-course-switch-label">{form.is_active ? "Active" : "Inactive"}</span>
          </label>
        </InlineField>
      </div>

      <p className="meta-note free-course-form-hint">
        Leave the thumbnail blank to auto-fetch from YouTube, or paste a link to use your own image.
      </p>

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

export default function ManageFreeCourses() {
  const { addToast } = useToast();

  const [freeCourses, setFreeCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [showCreateRow, setShowCreateRow] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [savingMode, setSavingMode] = useState("");

  const loadFreeCourses = async () => {
    setLoading(true);
    try {
      const response = await courseService.getAdminFreeCourses();
      setFreeCourses(response.data || []);
    } catch {
      addToast({ type: "error", message: "Unable to load free courses." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFreeCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startEdit = (freeCourse) => {
    setEditingId(freeCourse.id);
    setEditForm(toFreeCourseForm(freeCourse));
    setShowCreateRow(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(EMPTY_FORM);
  };

  const toggleCreateRow = () => {
    setShowCreateRow((prev) => !prev);
    setEditingId(null);
    setEditForm(EMPTY_FORM);
    setCreateForm(EMPTY_FORM);
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setSavingMode("create");
    try {
      await courseService.createAdminFreeCourse(createForm);
      addToast({ type: "success", message: "Free course added." });
      setShowCreateRow(false);
      setCreateForm(EMPTY_FORM);
      loadFreeCourses();
    } catch (error) {
      addToast({ type: "error", message: firstApiError(error, "Unable to add free course.") });
    } finally {
      setSavingMode("");
    }
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!editingId) return;
    setSavingMode("edit");
    try {
      await courseService.updateAdminFreeCourse(editingId, editForm);
      addToast({ type: "success", message: "Free course updated." });
      cancelEdit();
      loadFreeCourses();
    } catch (error) {
      addToast({ type: "error", message: firstApiError(error, "Unable to update free course.") });
    } finally {
      setSavingMode("");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await courseService.deleteAdminFreeCourse(deleteTarget.id);
      addToast({ type: "success", message: "Free course deleted." });
      setDeleteTarget(null);
      if (editingId === deleteTarget.id) {
        cancelEdit();
      }
      loadFreeCourses();
    } catch {
      addToast({ type: "error", message: "Unable to delete free course." });
    }
  };

  return (
    <AdminLayout>
      <h1>Manage Free Courses</h1>
      <section className="panel-card">
        <p className="meta-note">
          Free courses link out to a YouTube video or playlist instead of the internal LMS player. Thumbnails are
          fetched automatically from YouTube when the thumbnail field is left blank; add your own link to override it.
        </p>
        <div className="section-actions">
          <button type="button" className="btn btn-muted" onClick={toggleCreateRow} disabled={Boolean(savingMode)}>
            {showCreateRow ? "Cancel Add Row" : "Add Free Course"}
          </button>
        </div>

        {loading ? (
          <p className="meta-note">Loading free courses...</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Thumbnail</th>
                  <th>Title</th>
                  <th>YouTube URL</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {showCreateRow && (
                  <tr className="table-inline-edit-row">
                    <td colSpan={5}>
                      <InlineFreeCourseForm
                        form={createForm}
                        setForm={setCreateForm}
                        onSubmit={handleCreate}
                        onCancel={toggleCreateRow}
                        submitLabel="Create Free Course"
                        savingLabel="Creating..."
                        saving={savingMode === "create"}
                      />
                    </td>
                  </tr>
                )}

                {freeCourses.map((freeCourse) => (
                  <Fragment key={freeCourse.id}>
                    <tr
                      className={`table-row-editable ${editingId === freeCourse.id ? "is-editing" : ""}`}
                      onDoubleClick={() => startEdit(freeCourse)}
                    >
                      <td>
                        {freeCourse.thumbnail_url || extractYoutubeThumbnail(freeCourse.youtube_url) ? (
                          <img
                            src={freeCourse.thumbnail_url || extractYoutubeThumbnail(freeCourse.youtube_url)}
                            alt=""
                            style={{ width: 80, borderRadius: 6 }}
                          />
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>{freeCourse.title}</td>
                      <td>
                        <a href={freeCourse.youtube_url} target="_blank" rel="noopener noreferrer">
                          Open link
                        </a>
                      </td>
                      <td>{freeCourse.is_active ? "Yes" : "No"}</td>
                      <td>
                        <div className="inline-controls">
                          <button type="button" className="btn btn-muted" onClick={() => startEdit(freeCourse)}>
                            {editingId === freeCourse.id ? "Editing" : "Edit"}
                          </button>
                          <button type="button" className="btn btn-danger" onClick={() => setDeleteTarget(freeCourse)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>

                    {editingId === freeCourse.id && (
                      <tr className="table-inline-edit-row">
                        <td colSpan={5}>
                          <InlineFreeCourseForm
                            form={editForm}
                            setForm={setEditForm}
                            onSubmit={handleUpdate}
                            onCancel={cancelEdit}
                            submitLabel="Update"
                            savingLabel="Updating..."
                            saving={savingMode === "edit"}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}

                {freeCourses.length === 0 && !showCreateRow && (
                  <tr>
                    <td colSpan={5} className="empty-state">
                      No free courses added yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Free Course"
        message={`Are you sure you want to delete "${deleteTarget?.title || ""}"?`}
        confirmText="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </AdminLayout>
  );
}
