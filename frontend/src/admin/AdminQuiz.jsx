import { useEffect, useMemo, useState } from "react";

import AdminLayout from "../layouts/AdminLayout";
import { useToast } from "../context/ToastContext";
import { courseService } from "../services/courseService";
import { getCached, setCached } from "../utils/sessionCache";
import "./admin.css";

const QUIZ_COURSES_CACHE_KEY = "admin-quiz-courses";
const QUIZ_ALL_CACHE_KEY = "admin-quiz-all";

const EMPTY_QUIZ = {
  course: "",
  module_number: "",
  title: "",
  description: "",
  time_per_question_seconds: 25,
  pass_percentage: 70,
  max_questions: 50,
  status: "draft",
  is_active: false,
};

const EMPTY_QUESTION = {
  question_text: "",
  marks: 1,
  order: 1,
  is_active: true,
  correctIndex: 0,
  options: ["", "", "", ""],
  explanation: "",
  reference_lesson: "",
  reference_timestamp_seconds: "",
};

export default function AdminQuiz() {
  const { addToast } = useToast();
  const cachedQuizCourses = getCached(QUIZ_COURSES_CACHE_KEY);
  const cachedQuizzes = getCached(QUIZ_ALL_CACHE_KEY);
  const [courses, setCourses] = useState(() => cachedQuizCourses || []);
  const [quizzes, setQuizzes] = useState(() => cachedQuizzes || []);
  const [courseFilter, setCourseFilter] = useState("");
  const [quizForm, setQuizForm] = useState(EMPTY_QUIZ);
  const [questionForm, setQuestionForm] = useState(EMPTY_QUESTION);
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [selectedQuizId, setSelectedQuizId] = useState(() => cachedQuizzes?.[0]?.id || null);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(() => !(cachedQuizCourses && cachedQuizzes));
  const [savingQuiz, setSavingQuiz] = useState(false);
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [importingQuestions, setImportingQuestions] = useState(false);

  const selectedQuiz = useMemo(
    () => quizzes.find((quiz) => String(quiz.id) === String(selectedQuizId)) || null,
    [quizzes, selectedQuizId],
  );

  const fetchCourses = async () => {
    const response = await courseService.getCourses({ page_size: 200 });
    const results = response.data.results || [];
    setCourses(results);
    setCached(QUIZ_COURSES_CACHE_KEY, results);
    return results;
  };

  const fetchQuizzes = async (courseId = courseFilter) => {
    const response = await courseService.getAdminQuizzes(courseId ? { course_id: courseId } : {});
    const nextQuizzes = response.data || [];
    setQuizzes(nextQuizzes);
    setSelectedQuizId((prev) => {
      if (nextQuizzes.some((quiz) => String(quiz.id) === String(prev))) {
        return prev;
      }
      return nextQuizzes[0]?.id || null;
    });
    if (!courseId) {
      setCached(QUIZ_ALL_CACHE_KEY, nextQuizzes);
    }
    return nextQuizzes;
  };

  useEffect(() => {
    const init = async () => {
      const hasCache = getCached(QUIZ_COURSES_CACHE_KEY) && getCached(QUIZ_ALL_CACHE_KEY);
      if (!hasCache) {
        setLoading(true);
      }
      try {
        await fetchCourses();
        await fetchQuizzes("");
      } catch {
        if (!hasCache) {
          addToast({ type: "error", message: "Unable to load quiz admin data." });
        }
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [addToast]);

  useEffect(() => {
    fetchQuizzes(courseFilter).catch(() => {
      addToast({ type: "error", message: "Unable to filter quizzes." });
    });
  }, [courseFilter, addToast]);

  useEffect(() => {
    if (!selectedQuiz?.course) {
      setLessons([]);
      return;
    }
    const fetchLessons = async () => {
      try {
        const response = await courseService.getAdminLmsLessons({ course_id: selectedQuiz.course });
        setLessons(response.data || []);
      } catch {
        addToast({ type: "error", message: "Unable to load course lessons." });
      }
    };
    fetchLessons();
  }, [selectedQuiz?.course, addToast]);

  const resetQuizForm = (course = quizForm.course) => {
    setQuizForm({ ...EMPTY_QUIZ, course });
    setEditingQuizId(null);
  };

  const resetQuestionForm = () => {
    setQuestionForm({
      ...EMPTY_QUESTION,
      order: (selectedQuiz?.questions?.length || 0) + 1,
    });
    setEditingQuestionId(null);
  };

  const startQuizEdit = (quiz) => {
    setEditingQuizId(quiz.id);
    setSelectedQuizId(quiz.id);
    setQuizForm({
      course: String(quiz.course || ""),
      module_number: quiz.module_number || "",
      title: quiz.title || "",
      description: quiz.description || "",
      time_per_question_seconds: quiz.time_per_question_seconds || 25,
      pass_percentage: quiz.pass_percentage || 70,
      max_questions: quiz.max_questions || 50,
      status: quiz.status || "draft",
      is_active: Boolean(quiz.is_active),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startQuestionEdit = (question) => {
    const options = [...(question.options || [])].sort((a, b) => a.order - b.order);
    const correctIndex = Math.max(0, options.findIndex((option) => option.is_correct));
    setEditingQuestionId(question.id);
    setQuestionForm({
      question_text: question.question_text || "",
      marks: question.marks || 1,
      order: question.order || 1,
      is_active: Boolean(question.is_active),
      correctIndex,
      options: options.map((option) => option.option_text).concat(["", "", "", ""]).slice(0, 4),
      explanation: question.explanation || "",
      reference_lesson: question.reference_lesson || "",
      reference_timestamp_seconds: question.reference_timestamp_seconds ?? "",
    });
  };

  const handleQuizSubmit = async (event) => {
    event.preventDefault();
    if (!quizForm.course) {
      addToast({ type: "warning", message: "Please select a course." });
      return;
    }
    setSavingQuiz(true);
    const payload = {
      ...quizForm,
      course: Number(quizForm.course),
      module_number: quizForm.module_number ? Number(quizForm.module_number) : null,
      time_per_question_seconds: Number(quizForm.time_per_question_seconds),
      pass_percentage: Number(quizForm.pass_percentage),
      max_questions: Math.min(50, Number(quizForm.max_questions) || 50),
      status: quizForm.status,
    };
    try {
      const response = editingQuizId
        ? await courseService.updateAdminQuiz(editingQuizId, payload)
        : await courseService.createAdminQuiz(payload);
      addToast({ type: "success", message: editingQuizId ? "Quiz updated." : "Quiz created." });
      setSelectedQuizId(response.data.id);
      resetQuizForm(String(payload.course));
      await fetchQuizzes(courseFilter);
    } catch (error) {
      const detail = error?.response?.data?.detail || "Unable to save quiz.";
      addToast({ type: "error", message: detail });
    } finally {
      setSavingQuiz(false);
    }
  };

  const handleQuestionSubmit = async (event) => {
    event.preventDefault();
    if (!selectedQuiz) {
      addToast({ type: "warning", message: "Select a quiz first." });
      return;
    }
    if (questionForm.options.some((option) => !option.trim())) {
      addToast({ type: "warning", message: "Please fill all 4 options." });
      return;
    }
    setSavingQuestion(true);
    const payload = {
      question_text: questionForm.question_text,
      marks: Number(questionForm.marks),
      order: Number(questionForm.order),
      is_active: questionForm.is_active,
      options: questionForm.options.map((option, index) => ({
        option_text: option,
        order: index + 1,
        is_correct: index === Number(questionForm.correctIndex),
      })),
      explanation: questionForm.explanation || "",
      reference_lesson: questionForm.reference_lesson ? Number(questionForm.reference_lesson) : null,
      reference_timestamp_seconds: questionForm.reference_timestamp_seconds !== "" && questionForm.reference_timestamp_seconds !== null ? Number(questionForm.reference_timestamp_seconds) : null,
    };
    try {
      if (editingQuestionId) {
        await courseService.updateAdminQuizQuestion(editingQuestionId, payload);
      } else {
        await courseService.createAdminQuizQuestion(selectedQuiz.id, payload);
      }
      addToast({ type: "success", message: editingQuestionId ? "Question updated." : "Question added." });
      resetQuestionForm();
      await fetchQuizzes(courseFilter);
    } catch (error) {
      const detail = error?.response?.data?.detail || "Unable to save question.";
      addToast({ type: "error", message: detail });
    } finally {
      setSavingQuestion(false);
    }
  };

  const toggleQuizActive = async (quiz) => {
    await courseService.updateAdminQuiz(quiz.id, { is_active: !quiz.is_active });
    await fetchQuizzes(courseFilter);
  };

  const publishQuiz = async (quiz) => {
    try {
      await courseService.updateAdminQuiz(quiz.id, { status: "published", is_active: true });
      addToast({ type: "success", message: "Quiz published." });
      await fetchQuizzes(courseFilter);
    } catch (error) {
      const issues = error?.response?.data?.issues;
      const detail = Array.isArray(issues) && issues.length ? issues[0] : error?.response?.data?.detail || "Quiz is not ready to publish.";
      addToast({ type: "error", message: detail });
    }
  };

  const unpublishQuiz = async (quiz) => {
    await courseService.updateAdminQuiz(quiz.id, { status: "draft", is_active: false });
    addToast({ type: "success", message: "Quiz moved to draft." });
    await fetchQuizzes(courseFilter);
  };

  const archiveQuiz = async (quiz) => {
    await courseService.updateAdminQuiz(quiz.id, { status: "archived", is_active: false });
    addToast({ type: "success", message: "Quiz archived." });
    await fetchQuizzes(courseFilter);
  };

  const deleteQuiz = async (quiz) => {
    if (!window.confirm(`Delete quiz "${quiz.title}" permanently?`)) {
      return;
    }
    try {
      await courseService.deleteAdminQuiz(quiz.id);
      addToast({ type: "success", message: "Quiz deleted." });
      setSelectedQuizId(null);
      resetQuizForm();
      resetQuestionForm();
      await fetchQuizzes(courseFilter);
    } catch {
      addToast({ type: "error", message: "Unable to delete quiz." });
    }
  };

  const importQuestions = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !selectedQuiz) {
      return;
    }
    setImportingQuestions(true);
    try {
      const csvText = await file.text();
      const response = await courseService.importAdminQuizQuestions(selectedQuiz.id, { csv_text: csvText });
      addToast({ type: "success", message: response.data?.message || "Questions imported." });
      await fetchQuizzes(courseFilter);
    } catch (error) {
      const issues = error?.response?.data?.issues;
      const detail = Array.isArray(issues) && issues.length ? issues[0] : error?.response?.data?.detail || "Unable to import questions.";
      addToast({ type: "error", message: detail });
    } finally {
      setImportingQuestions(false);
    }
  };

  const toggleQuestionActive = async (question) => {
    await courseService.updateAdminQuizQuestion(question.id, { is_active: !question.is_active });
    await fetchQuizzes(courseFilter);
  };

  return (
    <AdminLayout>
      <h1>Quiz Admin</h1>

      <section className="panel-card">
        <h2>{editingQuizId ? "Edit Quiz" : "Create Quiz"}</h2>
        <form className="table-inline-edit-grid quiz-admin-form" onSubmit={handleQuizSubmit}>
          <label className="table-inline-field">
            <span className="table-inline-field-label">Course</span>
            <select value={quizForm.course} onChange={(e) => setQuizForm((prev) => ({ ...prev, course: e.target.value }))} required>
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
              value={quizForm.module_number}
              onChange={(e) => setQuizForm((prev) => ({ ...prev, module_number: e.target.value }))}
            />
          </label>
          <label className="table-inline-field table-inline-field-wide">
            <span className="table-inline-field-label">Quiz Name</span>
            <input
              type="text"
              value={quizForm.title}
              onChange={(e) => setQuizForm((prev) => ({ ...prev, title: e.target.value }))}
              required
            />
          </label>
          <label className="table-inline-field">
            <span className="table-inline-field-label">Seconds / Question</span>
            <input
              type="number"
              min="5"
              value={quizForm.time_per_question_seconds}
              onChange={(e) => setQuizForm((prev) => ({ ...prev, time_per_question_seconds: e.target.value }))}
              required
            />
          </label>
          <label className="table-inline-field">
            <span className="table-inline-field-label">Pass %</span>
            <input
              type="number"
              min="1"
              max="100"
              value={quizForm.pass_percentage}
              onChange={(e) => setQuizForm((prev) => ({ ...prev, pass_percentage: e.target.value }))}
              required
            />
          </label>
          <label className="table-inline-field">
            <span className="table-inline-field-label">Max Questions</span>
            <input
              type="number"
              min="1"
              max="50"
              value={quizForm.max_questions}
              onChange={(e) => setQuizForm((prev) => ({ ...prev, max_questions: e.target.value }))}
              required
            />
          </label>
          <label className="table-inline-field table-inline-field-wide">
            <span className="table-inline-field-label">Description</span>
            <textarea
              rows={3}
              value={quizForm.description}
              onChange={(e) => setQuizForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </label>
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={quizForm.is_active}
              onChange={(e) => setQuizForm((prev) => ({ ...prev, is_active: e.target.checked }))}
            />
            Quiz Active
          </label>
          <label className="table-inline-field">
            <span className="table-inline-field-label">Status</span>
            <select value={quizForm.status} onChange={(e) => setQuizForm((prev) => ({ ...prev, status: e.target.value }))}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <div className="table-inline-edit-actions">
            {editingQuizId ? (
              <button type="button" className="btn btn-muted" onClick={() => resetQuizForm()} disabled={savingQuiz}>
                Cancel Edit
              </button>
            ) : null}
            <button type="submit" className="btn btn-primary" disabled={savingQuiz || loading}>
              {savingQuiz ? "Saving..." : editingQuizId ? "Update Quiz" : "Create Quiz"}
            </button>
          </div>
        </form>
      </section>

      <section className="panel-card quiz-admin-panel">
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
        <div className="quiz-admin-layout">
          <div className="quiz-admin-list">
            {quizzes.map((quiz) => (
              <button
                key={quiz.id}
                type="button"
                className={`quiz-admin-card ${String(selectedQuizId) === String(quiz.id) ? "is-selected" : ""}`}
                onClick={() => {
                  setSelectedQuizId(quiz.id);
                  resetQuestionForm();
                }}
              >
                <strong>{quiz.title}</strong>
                <span>{quiz.course_title}</span>
                <small>
                  {quiz.active_question_count}/{quiz.max_questions} questions | {quiz.pass_percentage}% pass |{" "}
                  {quiz.status} | {quiz.is_active ? "Active" : "Inactive"}
                </small>
              </button>
            ))}
            {!quizzes.length ? <p className="meta-note">No quizzes found.</p> : null}
          </div>

          <div className="quiz-admin-detail">
            {selectedQuiz ? (
              <>
                <div className="quiz-admin-detail-head">
                  <div>
                    <h2>{selectedQuiz.title}</h2>
                    <p className="meta-note">
                      {selectedQuiz.active_question_count}/{selectedQuiz.max_questions} active questions | {selectedQuiz.status}
                    </p>
                  </div>
                  <div className="inline-controls">
                    <button type="button" className="btn btn-muted" onClick={() => startQuizEdit(selectedQuiz)}>
                      Edit Quiz
                    </button>
                    {selectedQuiz.status === "published" ? (
                      <button type="button" className="btn btn-muted" onClick={() => unpublishQuiz(selectedQuiz)}>
                        Move to Draft
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => publishQuiz(selectedQuiz)}
                        disabled={!selectedQuiz.is_publish_ready}
                        title={!selectedQuiz.is_publish_ready ? "Fix readiness issues before publishing." : ""}
                      >
                        Publish
                      </button>
                    )}
                    <button type="button" className="btn btn-muted" onClick={() => toggleQuizActive(selectedQuiz)}>
                      {selectedQuiz.is_active ? "Deactivate" : "Activate"}
                    </button>
                    <button type="button" className="btn btn-muted" onClick={() => archiveQuiz(selectedQuiz)}>
                      Archive
                    </button>
                    <button type="button" className="btn btn-danger" onClick={() => deleteQuiz(selectedQuiz)}>
                      Delete
                    </button>
                  </div>
                </div>

                <div className={`quiz-readiness ${selectedQuiz.is_publish_ready ? "is-ready" : "is-blocked"}`}>
                  <strong>{selectedQuiz.is_publish_ready ? "Ready to publish" : "Draft checklist"}</strong>
                  {selectedQuiz.publish_issues?.length ? (
                    <ul>
                      {selectedQuiz.publish_issues.map((issue) => (
                        <li key={issue}>{issue}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>All active questions are valid. Publishing will make this quiz visible to students.</p>
                  )}
                </div>

                <div className="quiz-import-panel">
                  <div>
                    <strong>Bulk import questions</strong>
                    <p className="meta-note">CSV columns: question, option_1, option_2, option_3, option_4, correct_option, marks</p>
                  </div>
                  <label className="btn btn-muted">
                    {importingQuestions ? "Importing..." : "Import CSV"}
                    <input type="file" accept=".csv,text/csv" onChange={importQuestions} disabled={importingQuestions} hidden />
                  </label>
                </div>

                <form className="quiz-question-form" onSubmit={handleQuestionSubmit}>
                  <h3>{editingQuestionId ? "Edit Question" : "Add Question"}</h3>
                  <label className="table-inline-field">
                    <span className="table-inline-field-label">Question</span>
                    <textarea
                      rows={3}
                      value={questionForm.question_text}
                      onChange={(e) => setQuestionForm((prev) => ({ ...prev, question_text: e.target.value }))}
                      required
                    />
                  </label>
                  <label className="table-inline-field">
                    <span className="table-inline-field-label">Explanation</span>
                    <textarea
                      rows={3}
                      value={questionForm.explanation}
                      onChange={(e) => setQuestionForm((prev) => ({ ...prev, explanation: e.target.value }))}
                      placeholder="Enter explanation text shown to students after answering"
                    />
                  </label>
                  <div className="quiz-question-meta-grid" style={{ marginTop: "0.5rem", marginBottom: "0.5rem" }}>
                    <label className="table-inline-field">
                      <span className="table-inline-field-label">Reference Lesson</span>
                      <select
                        value={questionForm.reference_lesson}
                        onChange={(e) => setQuestionForm((prev) => ({ ...prev, reference_lesson: e.target.value }))}
                      >
                        <option value="">No reference lesson</option>
                        {lessons.map((lesson) => (
                          <option key={lesson.id} value={lesson.id}>
                            M{lesson.module_number} L{lesson.lesson_number}: {lesson.title}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="table-inline-field">
                      <span className="table-inline-field-label">Reference Timestamp (seconds)</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 120"
                        value={questionForm.reference_timestamp_seconds}
                        onChange={(e) => setQuestionForm((prev) => ({ ...prev, reference_timestamp_seconds: e.target.value }))}
                      />
                    </label>
                  </div>
                  <div className="quiz-question-meta-grid">
                    <label className="table-inline-field">
                      <span className="table-inline-field-label">Marks</span>
                      <input
                        type="number"
                        min="1"
                        value={questionForm.marks}
                        onChange={(e) => setQuestionForm((prev) => ({ ...prev, marks: e.target.value }))}
                        required
                      />
                    </label>
                    <label className="table-inline-field">
                      <span className="table-inline-field-label">Order</span>
                      <input
                        type="number"
                        min="1"
                        value={questionForm.order}
                        onChange={(e) => setQuestionForm((prev) => ({ ...prev, order: e.target.value }))}
                        required
                      />
                    </label>
                    <label className="toggle-row">
                      <input
                        type="checkbox"
                        checked={questionForm.is_active}
                        onChange={(e) => setQuestionForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                      />
                      Question Active
                    </label>
                  </div>
                  <div className="quiz-option-editor">
                    {questionForm.options.map((option, index) => (
                      <label key={index} className="quiz-option-admin-row">
                        <input
                          type="radio"
                          name="correct-option"
                          checked={Number(questionForm.correctIndex) === index}
                          onChange={() => setQuestionForm((prev) => ({ ...prev, correctIndex: index }))}
                        />
                        <span>Option {index + 1}</span>
                        <input
                          type="text"
                          value={option}
                          onChange={(e) =>
                            setQuestionForm((prev) => ({
                              ...prev,
                              options: prev.options.map((item, optionIndex) => (optionIndex === index ? e.target.value : item)),
                            }))
                          }
                          required
                        />
                      </label>
                    ))}
                  </div>
                  <div className="table-inline-edit-actions">
                    {editingQuestionId ? (
                      <button type="button" className="btn btn-muted" onClick={resetQuestionForm} disabled={savingQuestion}>
                        Cancel Question Edit
                      </button>
                    ) : null}
                    <button type="submit" className="btn btn-primary" disabled={savingQuestion}>
                      {savingQuestion ? "Saving..." : editingQuestionId ? "Update Question" : "Add Question"}
                    </button>
                  </div>
                </form>

                <div className="quiz-question-list">
                  {(selectedQuiz.questions || []).map((question) => (
                    <article key={question.id} className="quiz-question-admin-card">
                      <div>
                        <strong>
                          Q{question.order}. {question.question_text}
                        </strong>
                        <p className="meta-note">
                          {question.marks} marks | {question.is_active ? "Active" : "Inactive"}
                        </p>
                        {question.explanation && (
                          <p className="meta-note" style={{ marginTop: "0.2rem", fontStyle: "italic" }}>
                            <strong>Explanation:</strong> {question.explanation}
                          </p>
                        )}
                        {question.reference_lesson && (
                          <p className="meta-note" style={{ marginTop: "0.2rem" }}>
                            <strong>Ref:</strong> Lesson ID {question.reference_lesson}
                            {question.reference_timestamp_seconds !== null && ` at ${question.reference_timestamp_seconds}s`}
                          </p>
                        )}
                      </div>
                      <div className="inline-controls">
                        <button type="button" className="btn btn-muted" onClick={() => startQuestionEdit(question)}>
                          Edit
                        </button>
                        <button type="button" className="btn btn-muted" onClick={() => toggleQuestionActive(question)}>
                          {question.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </article>
                  ))}
                  {!selectedQuiz.questions?.length ? <p className="meta-note">Add up to 50 questions for this quiz.</p> : null}
                </div>
              </>
            ) : (
              <p className="meta-note">Select or create a quiz to manage questions.</p>
            )}
          </div>
        </div>
      </section>
    </AdminLayout>
  );
}
