import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  HiOutlineAcademicCap,
  HiOutlineBolt,
  HiOutlineBookOpen,
  HiOutlineChartBar,
  HiOutlineMagnifyingGlass,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
} from "react-icons/hi2";

import CourseCard from "../components/CourseCard";
import LoadingSpinner from "../components/LoadingSpinner";
import PageTransition from "../components/PageTransition";
import Pagination from "../components/Pagination";
import SearchBar from "../components/SearchBar";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import MainLayout from "../layouts/MainLayout";
import { courseService } from "../services/courseService";

export default function Home() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const activeCategoryId = searchParams.get("category")?.trim() || "";
  const activeCategoryName = searchParams.get("categoryName")?.trim() || "";
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [courses, setCourses] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [activeCategoryId]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchCourses = async () => {
      setLoading(true);
      try {
        const response = await courseService.getCourses(
          {
            search: debouncedSearch,
            page,
            ...(activeCategoryId ? { category: activeCategoryId } : {}),
          },
          { signal: controller.signal },
        );
        setCourses(response.data.results || []);
        setCount(response.data.count || 0);
      } catch (requestError) {
        if (requestError?.code === "ERR_CANCELED") {
          return;
        }
        addToast({ type: "error", message: "Failed to load courses." });
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchCourses();
    return () => controller.abort();
  }, [debouncedSearch, page, addToast, activeCategoryId]);

  const learningTracks = useMemo(() => {
    const extracted = Array.from(
      new Set(courses.map((course) => course.category?.name).filter(Boolean)),
    );
    if (extracted.length) {
      return extracted.slice(0, 5);
    }
    return ["Data Science", "Machine Learning", "Deep Learning", "Prompt Engineering", "Quantum Computing"];
  }, [courses]);

  const clearCategoryFilter = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("category");
    nextParams.delete("categoryName");
    setSearchParams(nextParams);
  };

  const handleBuy = (course) => {
    if (course?.is_purchased) {
      navigate("/user/my-courses");
      return;
    }
    if (!isAuthenticated) {
      addToast({ type: "warning", message: "Please login first to continue billing." });
      navigate("/login");
      return;
    }
    navigate(`/billing/${course.id}`);
  };

  const handleOpenCourse = (course) => {
    navigate(`/course/${course.id}`);
  };

  const handleTrackClick = (track) => {
    setSearch(track);
    if (!activeCategoryId) {
      return;
    }
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("category");
    nextParams.delete("categoryName");
    setSearchParams(nextParams);
  };

  return (
    <MainLayout showChatbot>
      <PageTransition>
        <section className="hero-grid">
          <article className="hero-panel">
            <span className="hero-badge">SIA Software Innovations Private Limited | ACCESS BEYOND LIMITS</span>
            <h1>Build Job-Ready AI and Quantum Engineering Skills</h1>
            <p>
              Explore professional programs in Data Science, Machine Learning, Deep Learning, Prompt Engineering, and
              Quantum Computing. Learn with structured labs, mentor guidance, and measurable skill milestones.
            </p>
            <div className="hero-track-row">
              {learningTracks.map((track) => (
                <button
                  key={track}
                  type="button"
                  className="hero-track-pill hero-track-pill-btn"
                  onClick={() => handleTrackClick(track)}
                >
                  {track}
                </button>
              ))}
            </div>
            <SearchBar value={search} onChange={setSearch} />
          </article>
          <aside className="hero-side">
            <div className="hero-stat-card">
              <HiOutlineBookOpen />
              <div>
                <strong>{count}</strong>
                <span>Courses Found</span>
              </div>
            </div>
            <div className="hero-stat-card">
              <HiOutlineMagnifyingGlass />
              <div>
                <strong>Live Search</strong>
                <span>Debounced, paginated, and filter-ready</span>
              </div>
            </div>
            <div className="hero-stat-card">
              <HiOutlineShieldCheck />
              <div>
                <strong>Secure Billing</strong>
                <span>Stripe checkout flow</span>
              </div>
            </div>
            <div className="hero-stat-card">
              <HiOutlineBolt />
              <div>
                <strong>24x7 SIA_Chat</strong>
                <span>Education-trained AI assistant support</span>
              </div>
            </div>
          </aside>
        </section>

        <section className="edu-value-grid">
          <article className="edu-value-card">
            <HiOutlineAcademicCap />
            <h3>Knowledge-First Curriculum</h3>
            <p>Move from fundamentals to advanced implementation through concept-driven module sequencing.</p>
          </article>
          <article className="edu-value-card">
            <HiOutlineChartBar />
            <h3>Skill Assessment Focus</h3>
            <p>Validate improvement through practical labs, measurable outcomes, and project-grade checkpoints.</p>
          </article>
          <article className="edu-value-card">
            <HiOutlineSparkles />
            <h3>AI + Quantum Relevance</h3>
            <p>Study current tooling and engineering practices used in modern AI and quantum learning tracks.</p>
          </article>
        </section>

        <section className="catalog-header">
          <div>
            <h2>Explore AI and Quantum Courses</h2>
            <p>Choose from curated tracks designed for knowledge depth and continuous technical skill improvement.</p>
            {activeCategoryId ? (
              <button type="button" className="catalog-filter-chip" onClick={clearCategoryFilter}>
                Category: {activeCategoryName || "Selected Category"} (clear)
              </button>
            ) : null}
          </div>
          <span className="catalog-badge">{count} total courses</span>
        </section>

        {loading ? (
          <LoadingSpinner label="Fetching courses..." />
        ) : (
          <>
            <section className="course-grid">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  searchQuery={debouncedSearch}
                  onBuy={handleBuy}
                  onOpen={handleOpenCourse}
                />
              ))}
            </section>
            {courses.length === 0 && <p className="empty-state">No courses found. Try a broader keyword.</p>}
            <Pagination count={count} currentPage={page} onPageChange={setPage} />
          </>
        )}
      </PageTransition>
    </MainLayout>
  );
}
