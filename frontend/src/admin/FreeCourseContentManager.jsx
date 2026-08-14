import { useState } from "react";

import ConfirmModal from "../components/ConfirmModal";
import { useToast } from "../context/ToastContext";
import { courseService } from "../services/courseService";
import { extractYoutubeThumbnail } from "../utils/youtube";

const EMPTY_MODULE_FORM = { module_number: "1", title: "" };
const EMPTY_LESSON_FORM = { lesson_number: "1", title: "", youtube_url: "", thumbnail_url: "", is_active: true };

function firstApiError(error, fallback) {
  const payload = error?.response?.data;
  if (!payload) return fallback;
  if (typeof payload === "string") return payload;
  if (payload.detail) return payload.detail;
  const firstMessage = Object.values(payload).flat().find(Boolean);
  return firstMessage ? String(firstMessage) : fallback;
}

function LessonRow({ lesson, onEdit, onDelete }) {
  const thumbnailUrl = lesson.thumbnail_url || extractYoutubeThumbnail(lesson.youtube_url);
  return (
    <div className="free-course-lesson-row">
      <span className="free-course-lesson-row-thumb">
        {thumbnailUrl && <img src={thumbnailUrl} alt="" />}
      </span>
      <span className="free-course-lesson-row-title">
        {lesson.lesson_number}. {lesson.title}
        {!lesson.is_active && <span className="pill">Inactive</span>}
      </span>
      <a href={lesson.youtube_url} target="_blank" rel="noopener noreferrer">
        Open link
      </a>
      <div className="inline-controls">
        <button type="button" className="btn btn-muted" onClick={() => onEdit(lesson)}>
          Edit
        </button>
        <button type="button" className="btn btn-danger" onClick={() => onDelete(lesson)}>
          Delete
        </button>
      </div>
    </div>
  );
}

function LessonForm({ form, setForm, onSubmit, onCancel, submitLabel, saving }) {
  const previewThumbnail = form.thumbnail_url || extractYoutubeThumbnail(form.youtube_url);

  return (
    <form className="free-course-lesson-form" onSubmit={onSubmit}>
      <input
        aria-label="Lesson number"
        type="number"
        min="1"
        style={{ width: 70 }}
        value={form.lesson_number}
        onChange={(event) => setForm((prev) => ({ ...prev, lesson_number: event.target.value }))}
        required
      />
      <input
        aria-label="Lesson title"
        placeholder="Lesson title"
        value={form.title}
        onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
        required
      />
      <input
        aria-label="Lesson YouTube URL"
        placeholder="https://www.youtube.com/watch?v=..."
        value={form.youtube_url}
        onChange={(event) => setForm((prev) => ({ ...prev, youtube_url: event.target.value }))}
        required
      />
      <div className="free-course-thumb-field">
        <span className="free-course-thumb-preview">
          {previewThumbnail && <img src={previewThumbnail} alt="" />}
        </span>
        <input
          aria-label="Lesson thumbnail URL"
          placeholder="Leave blank to auto-fetch from YouTube"
          value={form.thumbnail_url}
          onChange={(event) => setForm((prev) => ({ ...prev, thumbnail_url: event.target.value }))}
        />
      </div>
      <label className="toggle-row">
        <input
          type="checkbox"
          checked={Boolean(form.is_active)}
          onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.checked }))}
        />
        Active
      </label>
      <div className="inline-controls">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving..." : submitLabel}
        </button>
        <button type="button" className="btn btn-muted" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function FreeCourseContentManager({ freeCourse, modules, lessons, onRefresh }) {
  const { addToast } = useToast();

  const [showAddModule, setShowAddModule] = useState(false);
  const [moduleForm, setModuleForm] = useState(EMPTY_MODULE_FORM);
  const [editingModuleId, setEditingModuleId] = useState(null);
  const [moduleDeleteTarget, setModuleDeleteTarget] = useState(null);

  const [activeLessonModuleId, setActiveLessonModuleId] = useState(null);
  const [lessonForm, setLessonForm] = useState(EMPTY_LESSON_FORM);
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [lessonDeleteTarget, setLessonDeleteTarget] = useState(null);

  const [saving, setSaving] = useState(false);

  const sortedModules = [...modules].sort((a, b) => a.module_number - b.module_number);

  const lessonsForModule = (moduleId) =>
    lessons.filter((lesson) => lesson.module === moduleId).sort((a, b) => a.lesson_number - b.lesson_number);

  const nextModuleNumber = String((sortedModules.at(-1)?.module_number || 0) + 1);

  const openAddModule = () => {
    setModuleForm({ module_number: nextModuleNumber, title: "" });
    setEditingModuleId(null);
    setShowAddModule(true);
  };

  const startEditModule = (module) => {
    setModuleForm({ module_number: String(module.module_number), title: module.title });
    setEditingModuleId(module.id);
    setShowAddModule(true);
  };

  const cancelModuleForm = () => {
    setShowAddModule(false);
    setEditingModuleId(null);
    setModuleForm(EMPTY_MODULE_FORM);
  };

  const submitModuleForm = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        free_course: freeCourse.id,
        module_number: Number(moduleForm.module_number),
        title: moduleForm.title.trim(),
      };
      if (editingModuleId) {
        await courseService.updateAdminFreeCourseModule(editingModuleId, payload);
        addToast({ type: "success", message: "Module updated." });
      } else {
        await courseService.createAdminFreeCourseModule(payload);
        addToast({ type: "success", message: "Module added." });
      }
      cancelModuleForm();
      onRefresh();
    } catch (error) {
      addToast({ type: "error", message: firstApiError(error, "Unable to save module.") });
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteModule = async () => {
    if (!moduleDeleteTarget) return;
    try {
      await courseService.deleteAdminFreeCourseModule(moduleDeleteTarget.id);
      addToast({ type: "success", message: "Module deleted." });
      setModuleDeleteTarget(null);
      onRefresh();
    } catch {
      addToast({ type: "error", message: "Unable to delete module." });
    }
  };

  const openAddLesson = (module) => {
    const nextLessonNumber = String((lessonsForModule(module.id).at(-1)?.lesson_number || 0) + 1);
    setLessonForm({ ...EMPTY_LESSON_FORM, lesson_number: nextLessonNumber });
    setEditingLessonId(null);
    setActiveLessonModuleId(module.id);
  };

  const startEditLesson = (lesson) => {
    setLessonForm({
      lesson_number: String(lesson.lesson_number),
      title: lesson.title,
      youtube_url: lesson.youtube_url,
      thumbnail_url: lesson.thumbnail_url || "",
      is_active: Boolean(lesson.is_active),
    });
    setEditingLessonId(lesson.id);
    setActiveLessonModuleId(lesson.module);
  };

  const cancelLessonForm = () => {
    setActiveLessonModuleId(null);
    setEditingLessonId(null);
    setLessonForm(EMPTY_LESSON_FORM);
  };

  const submitLessonForm = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        module: activeLessonModuleId,
        lesson_number: Number(lessonForm.lesson_number),
        title: lessonForm.title.trim(),
        youtube_url: lessonForm.youtube_url.trim(),
        thumbnail_url: lessonForm.thumbnail_url.trim(),
        is_active: Boolean(lessonForm.is_active),
      };
      if (editingLessonId) {
        await courseService.updateAdminFreeCourseLesson(editingLessonId, payload);
        addToast({ type: "success", message: "Lesson updated." });
      } else {
        await courseService.createAdminFreeCourseLesson(payload);
        addToast({ type: "success", message: "Lesson added." });
      }
      cancelLessonForm();
      onRefresh();
    } catch (error) {
      addToast({ type: "error", message: firstApiError(error, "Unable to save lesson.") });
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteLesson = async () => {
    if (!lessonDeleteTarget) return;
    try {
      await courseService.deleteAdminFreeCourseLesson(lessonDeleteTarget.id);
      addToast({ type: "success", message: "Lesson deleted." });
      setLessonDeleteTarget(null);
      onRefresh();
    } catch {
      addToast({ type: "error", message: "Unable to delete lesson." });
    }
  };

  return (
    <div className="free-course-content-manager">
      <h3 className="free-course-content-manager-title">Modules &amp; Lessons</h3>
      <p className="meta-note">
        Organize this course into modules, and add lessons (each a single YouTube video link) under each module.
      </p>

      {sortedModules.map((module) => (
        <div key={module.id} className="free-course-module-block">
          <div className="free-course-module-block-head">
            <strong>
              Module {module.module_number}: {module.title}
            </strong>
            <div className="inline-controls">
              <button type="button" className="btn btn-muted" onClick={() => openAddLesson(module)}>
                Add Lesson
              </button>
              <button type="button" className="btn btn-muted" onClick={() => startEditModule(module)}>
                Edit
              </button>
              <button type="button" className="btn btn-danger" onClick={() => setModuleDeleteTarget(module)}>
                Delete
              </button>
            </div>
          </div>

          {lessonsForModule(module.id).map((lesson) =>
            editingLessonId === lesson.id ? (
              <LessonForm
                key={lesson.id}
                form={lessonForm}
                setForm={setLessonForm}
                onSubmit={submitLessonForm}
                onCancel={cancelLessonForm}
                submitLabel="Update Lesson"
                saving={saving}
              />
            ) : (
              <LessonRow key={lesson.id} lesson={lesson} onEdit={startEditLesson} onDelete={setLessonDeleteTarget} />
            ),
          )}

          {lessonsForModule(module.id).length === 0 && activeLessonModuleId !== module.id && (
            <p className="meta-note">No lessons in this module yet.</p>
          )}

          {activeLessonModuleId === module.id && !editingLessonId && (
            <LessonForm
              form={lessonForm}
              setForm={setLessonForm}
              onSubmit={submitLessonForm}
              onCancel={cancelLessonForm}
              submitLabel="Add Lesson"
              saving={saving}
            />
          )}

          {editingModuleId === module.id && (
            <form className="free-course-module-form" onSubmit={submitModuleForm}>
              <input
                aria-label="Module number"
                type="number"
                min="1"
                style={{ width: 70 }}
                value={moduleForm.module_number}
                onChange={(event) => setModuleForm((prev) => ({ ...prev, module_number: event.target.value }))}
                required
              />
              <input
                aria-label="Module title"
                placeholder="Module title"
                value={moduleForm.title}
                onChange={(event) => setModuleForm((prev) => ({ ...prev, title: event.target.value }))}
                required
              />
              <div className="inline-controls">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Saving..." : "Update Module"}
                </button>
                <button type="button" className="btn btn-muted" onClick={cancelModuleForm} disabled={saving}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      ))}

      {sortedModules.length === 0 && <p className="meta-note">No modules added yet.</p>}

      {showAddModule && !editingModuleId ? (
        <form className="free-course-module-form" onSubmit={submitModuleForm}>
          <input
            aria-label="Module number"
            type="number"
            min="1"
            style={{ width: 70 }}
            value={moduleForm.module_number}
            onChange={(event) => setModuleForm((prev) => ({ ...prev, module_number: event.target.value }))}
            required
          />
          <input
            aria-label="Module title"
            placeholder="Module title"
            value={moduleForm.title}
            onChange={(event) => setModuleForm((prev) => ({ ...prev, title: event.target.value }))}
            required
          />
          <div className="inline-controls">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Add Module"}
            </button>
            <button type="button" className="btn btn-muted" onClick={cancelModuleForm} disabled={saving}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="btn btn-muted" onClick={openAddModule}>
          + Add Module
        </button>
      )}

      <ConfirmModal
        open={Boolean(moduleDeleteTarget)}
        title="Delete Module"
        message={`Delete "${moduleDeleteTarget?.title || ""}" and all its lessons?`}
        confirmText="Delete"
        onCancel={() => setModuleDeleteTarget(null)}
        onConfirm={confirmDeleteModule}
      />
      <ConfirmModal
        open={Boolean(lessonDeleteTarget)}
        title="Delete Lesson"
        message={`Delete "${lessonDeleteTarget?.title || ""}"?`}
        confirmText="Delete"
        onCancel={() => setLessonDeleteTarget(null)}
        onConfirm={confirmDeleteLesson}
      />
    </div>
  );
}
