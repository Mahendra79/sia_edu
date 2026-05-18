import { useEffect, useMemo, useState } from "react";

import ConfirmModal from "../components/ConfirmModal";
import AdminLayout from "../layouts/AdminLayout";
import { useToast } from "../context/ToastContext";
import { courseService } from "../services/courseService";
import "./admin.css";

const EMPTY_FORM = {
  course: "",
  module_number: 1,
  lesson_number: 1,
  title: "",
  description: "",
  video_url: "",
  thumbnail_url: "",
  pdf_url: "",
  is_active: true,
};

export default function AdminLMS() {
  const { addToast } = useToast();
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [courseFilter, setCourseFilter] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const selectedCourseId = useMemo(() => {
    if (courseFilter) {
      return courseFilter;
    }
    return form.course || "";
  }, [courseFilter, form.course]);

  const fetchCourses = async () => {
    const response = await courseService.getCourses({ page_size: 200 });
    setCourses(response.data.results || []);
  };

  const fetchLessons = async (courseId = "") => {
    const params = courseId ? { course_id: courseId } : {};
    const response = await courseService.getAdminLmsLessons(params);
    setLessons(response.data || []);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        await fetchCourses();
        await fetchLessons();
      } catch {
        addToast({ type: "error", message: "Failed to load LMS admin data." });
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [addToast]);

  useEffect(() => {
    fetchLessons(selectedCourseId).catch(() => {
      addToast({ type: "error", message: "Failed to filter lessons." });
    });
  }, [selectedCourseId, addToast]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const buildLessonPayload = () => ({
    ...form,
    course: Number(form.course),
    module_number: Number(form.module_number),
    lesson_number: Number(form.lesson_number),
  });

  const resetForm = (course = form.course) => {
    setForm({ ...EMPTY_FORM, course });
    setEditingLessonId(null);
  };

  const startEdit = (lesson) => {
    setEditingLessonId(lesson.id);
    setForm({
      course: String(lesson.course || ""),
      module_number: lesson.module_number || 1,
      lesson_number: lesson.lesson_number || 1,
      title: lesson.title || "",
      description: lesson.description || "",
      video_url: lesson.video_url || "",
      thumbnail_url: lesson.thumbnail_url || "",
      pdf_url: lesson.pdf_url || "",
      is_active: Boolean(lesson.is_active),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!form.course) {
      addToast({ type: "warning", message: "Please select a course." });
      return;
    }
    setSubmitting(true);
    try {
      const payload = buildLessonPayload();
      if (editingLessonId) {
        await courseService.updateAdminLmsLesson(editingLessonId, payload);
        addToast({ type: "success", message: "LMS lesson updated." });
      } else {
        await courseService.createAdminLmsLesson(payload);
        addToast({ type: "success", message: "LMS lesson created." });
      }
      resetForm(form.course);
      formElement.reset();
      await fetchLessons(selectedCourseId);
    } catch (error) {
      const detail =
        error?.response?.data?.detail ||
        (editingLessonId ? "Failed to update LMS lesson." : "Failed to create LMS lesson.");
      addToast({ type: "error", message: detail });
    } finally {
      setSubmitting(false);
    }
  };

  const [confirmToggleOpen, setConfirmToggleOpen] = useState(false);
  const [pendingToggleLesson, setPendingToggleLesson] = useState(null);

  const handleToggleActive = async (lesson) => {
    try {
      await courseService.updateAdminLmsLesson(lesson.id, { is_active: !lesson.is_active });
      addToast({ type: "success", message: "Lesson status updated." });
      await fetchLessons(selectedCourseId);
    } catch {
      addToast({ type: "error", message: "Unable to update lesson status." });
    }
  };

  const askToggle = (lesson) => {
    setPendingToggleLesson(lesson);
    setConfirmToggleOpen(true);
  };

  const cancelToggle = () => {
    setConfirmToggleOpen(false);
    setPendingToggleLesson(null);
  };

  const confirmToggle = async () => {
    if (!pendingToggleLesson) {
      cancelToggle();
      return;
    }
    await handleToggleActive(pendingToggleLesson);
    cancelToggle();
  };


  const handleDelete = async (lessonId) => {
    try {
      await courseService.deleteAdminLmsLesson(lessonId);
      addToast({ type: "success", message: "Lesson deleted." });
      await fetchLessons(selectedCourseId);
    } catch {
      addToast({ type: "error", message: "Unable to delete lesson." });
    }
  };

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [pendingDeleteLessonId, setPendingDeleteLessonId] = useState(null);

  const askDelete = (lessonId) => {
    setPendingDeleteLessonId(lessonId);
    setConfirmDeleteOpen(true);
  };

  const cancelDelete = () => {
    setConfirmDeleteOpen(false);
    setPendingDeleteLessonId(null);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteLessonId) {
      cancelDelete();
      return;
    }
    await handleDelete(pendingDeleteLessonId);
    cancelDelete();
  };

  return (
    <AdminLayout>
      <h1>LMS Admin</h1>
      <ConfirmModal
        open={confirmDeleteOpen}
        title="Delete lesson"
        message="This will permanently delete the LMS lesson. Continue?"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      <ConfirmModal
        open={confirmToggleOpen}
        title="Update lesson status"
        message={pendingToggleLesson?.is_active ? "Deactivate this lesson?" : "Activate this lesson?"}
        confirmText={pendingToggleLesson?.is_active ? "Deactivate" : "Activate"}
        cancelText="Cancel"
        onConfirm={confirmToggle}
        onCancel={cancelToggle}
      />

      <section className="panel-card">

        <h2>{editingLessonId ? "Edit LMS Lesson" : "Add LMS Lesson"}</h2>
        <form className="table-inline-edit-grid" onSubmit={handleSubmit}>
          <label className="table-inline-field">
            <span className="table-inline-field-label">Course</span>
            <select value={form.course} onChange={(e) => handleChange("course", e.target.value)} required>
              <option value="">Select course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </label>
          <label className="table-inline-field">
            <span className="table-inline-field-label">Module Number</span>
            <input
              type="number"
              min="1"
              value={form.module_number}
              onChange={(e) => handleChange("module_number", e.target.value)}
              required
            />
          </label>
          <label className="table-inline-field">
            <span className="table-inline-field-label">Lesson Number</span>
            <input
              type="number"
              min="1"
              value={form.lesson_number}
              onChange={(e) => handleChange("lesson_number", e.target.value)}
              required
            />
          </label>
          <label className="table-inline-field table-inline-field-wide">
            <span className="table-inline-field-label">Lesson Title</span>
            <input type="text" value={form.title} onChange={(e) => handleChange("title", e.target.value)} required />
          </label>
          <label className="table-inline-field table-inline-field-wide">
            <span className="table-inline-field-label">Description</span>
            <textarea rows={3} value={form.description} onChange={(e) => handleChange("description", e.target.value)} />
          </label>
          <label className="table-inline-field table-inline-field-wide">
            <span className="table-inline-field-label">Video URL (Cloudflare or direct video URL, optional)</span>
            <input
              type="url"
              value={form.video_url}
              onChange={(e) => handleChange("video_url", e.target.value)}
            />
          </label>
          <label className="table-inline-field table-inline-field-wide">
            <span className="table-inline-field-label">Thumbnail URL</span>
            <input type="url" value={form.thumbnail_url} onChange={(e) => handleChange("thumbnail_url", e.target.value)} />
          </label>
          <label className="table-inline-field table-inline-field-wide">
            <span className="table-inline-field-label">PDF URL (Cloudflare, optional)</span>
            <input type="url" value={form.pdf_url} onChange={(e) => handleChange("pdf_url", e.target.value)} />
          </label>
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => handleChange("is_active", e.target.checked)}
            />
            Is Active
          </label>
          <div className="table-inline-edit-actions">
            {editingLessonId ? (
              <button type="button" className="btn btn-muted" onClick={() => resetForm()} disabled={submitting}>
                Cancel Edit
              </button>
            ) : null}
            <button type="submit" className="btn btn-primary" disabled={submitting || loading}>
              {submitting ? "Saving..." : editingLessonId ? "Update Lesson" : "Add Lesson"}
            </button>
          </div>
        </form>
      </section>

      <section className="panel-card" style={{ marginTop: "1rem" }}>
        <div className="section-actions">
          <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
            <option value="">All Courses</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Course</th>
                <th>Module</th>
                <th>Lesson</th>
                <th>Title</th>
                <th>PDF</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {lessons.map((lesson) => (
                <tr key={lesson.id}>
                  <td>{lesson.course_title || lesson.course}</td>
                  <td>{lesson.module_number}</td>
                  <td>{lesson.lesson_number}</td>
                  <td>{lesson.title}</td>
                  <td>
                    {lesson.pdf_url ? (
                      <a href={lesson.pdf_url} target="_blank" rel="noreferrer">
                        View
                      </a>
                    ) : (
                      "No"
                    )}
                  </td>
                  <td>{lesson.is_active ? "Yes" : "No"}</td>
                  <td>
                    <div className="lms-row-actions">
                    <button
                      type="button"
                      className="btn btn-muted"
                      onClick={() => startEdit(lesson)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="btn btn-muted"
                      onClick={() => askToggle(lesson)}
                    >
                      {lesson.is_active ? "Deactivate" : "Activate"}
                    </button>

                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => askDelete(lesson.id)}
                    >
                      Delete
                    </button>
                    </div>
                  </td>
                </tr>
              ))}
              {lessons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="meta-note">
                    No LMS lessons found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </AdminLayout>
  );
}
