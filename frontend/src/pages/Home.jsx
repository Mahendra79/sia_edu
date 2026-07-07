import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  HiOutlineAcademicCap,
  HiOutlineArrowRight,
  HiOutlineBookOpen,
  HiOutlinePlayCircle,
  HiOutlineSparkles,
} from "react-icons/hi2";

import CourseCard from "../components/CourseCard";
import PageTransition from "../components/PageTransition";
import Pagination from "../components/Pagination";
import SearchBar from "../components/SearchBar";
import { SkeletonBlock, SkeletonCardGrid, SkeletonText } from "../components/Skeleton";
import graduationBookImage from "../assets/graduation_book.png";
import { getCourseImageUrl } from "../data/courseImages";
import { prefetchCourseDetails } from "../data/coursePrefetch";
import { prefetchLmsPortal } from "../data/lmsPrefetch";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import MainLayout from "../layouts/MainLayout";
import { courseService } from "../services/courseService";

// Module-scoped so it survives Home unmounting/remounting when navigating away and
// back (e.g. opening a course then hitting back) within the same browser session.
const homeCache = {
  catalog: new Map(),
  quickCourses: null,
  continueCourse: null,
};

export default function Home() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, isAdmin, user } = useAuth();
  const { addToast } = useToast();
  const activeCategoryId = searchParams.get("category")?.trim() || "";
  const activeCategoryName = searchParams.get("categoryName")?.trim() || "";
  const initialCatalogKey = `|1|${activeCategoryId}`;
  const cachedCatalog = homeCache.catalog.get(initialCatalogKey);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [courses, setCourses] = useState(() => cachedCatalog?.courses || []);
  const [count, setCount] = useState(() => cachedCatalog?.count || 0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(() => !cachedCatalog);
  const [quickCourses, setQuickCourses] = useState(() => homeCache.quickCourses || []);
  const [quickLoading, setQuickLoading] = useState(() => homeCache.quickCourses === null);
  const [continueCourse, setContinueCourse] = useState(() => homeCache.continueCourse);
  const [continueLoading, setContinueLoading] = useState(false);
  const catalogRef = useRef(null);

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
    const cacheKey = `${debouncedSearch}|${page}|${activeCategoryId}`;
    const cached = homeCache.catalog.get(cacheKey);
    if (cached) {
      setCourses(cached.courses);
      setCount(cached.count);
      setLoading(false);
    } else {
      setLoading(true);
    }

    const fetchCourses = async () => {
      try {
        const response = await courseService.getCourses(
          {
            search: debouncedSearch,
            page,
            ...(activeCategoryId ? { category: activeCategoryId } : {}),
          },
          { signal: controller.signal },
        );
        const results = response.data.results || [];
        const total = response.data.count || 0;
        setCourses(results);
        setCount(total);
        homeCache.catalog.set(cacheKey, { courses: results, count: total });
      } catch (requestError) {
        if (requestError?.code === "ERR_CANCELED") {
          return;
        }
        if (!cached) {
          addToast({ type: "error", message: "Failed to load courses." });
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchCourses();
    return () => controller.abort();
  }, [debouncedSearch, page, addToast, activeCategoryId]);

  useEffect(() => {
    if (!isAuthenticated || isAdmin) {
      setQuickCourses([]);
      return undefined;
    }

    let cancelled = false;
    if (homeCache.quickCourses === null) {
      setQuickLoading(true);
    }

    const loadQuickCourses = async () => {
      try {
        const response = await courseService.getMyCourses({ page: 1, page_size: 4 });
        const enrolled = (response.data.results || []).filter((item) => item.payment_status === "success");
        if (!cancelled) {
          setQuickCourses(enrolled);
          homeCache.quickCourses = enrolled;
        }
      } catch {
        if (!cancelled && homeCache.quickCourses === null) {
          setQuickCourses([]);
        }
      } finally {
        if (!cancelled) {
          setQuickLoading(false);
        }
      }
    };

    loadQuickCourses();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isAdmin]);

  useEffect(() => {
    const candidate = quickCourses.find((item) => item.status !== "completed") || quickCourses[0];
    if (!candidate) {
      setContinueCourse(null);
      setContinueLoading(false);
      homeCache.continueCourse = null;
      return undefined;
    }

    let cancelled = false;
    if (!homeCache.continueCourse) {
      setContinueLoading(true);
    }

    const loadContinueCourse = async () => {
      try {
        const overviewResponse = await courseService.getLmsOverview(candidate.course.id);
        if (!cancelled) {
          const next = {
            ...candidate,
            progressPercent: Number(overviewResponse.data?.progress_percent ?? 0),
            completedLessons: Number(overviewResponse.data?.completed_lessons ?? 0),
            totalLessons: Number(overviewResponse.data?.total_lessons ?? 0),
          };
          setContinueCourse(next);
          homeCache.continueCourse = next;
        }
      } catch {
        if (!cancelled) {
          setContinueCourse(null);
          homeCache.continueCourse = null;
        }
      } finally {
        if (!cancelled) {
          setContinueLoading(false);
        }
      }
    };

    loadContinueCourse();
    return () => {
      cancelled = true;
    };
  }, [quickCourses]);

  const learningTracks = useMemo(() => {
    const extracted = Array.from(
      new Set(courses.map((course) => course.category?.name).filter(Boolean)),
    );
    if (extracted.length) {
      return extracted.slice(0, 5);
    }
    return ["Data Science", "Machine Learning", "Deep Learning", "Prompt Engineering", "Quantum Computing"];
  }, [courses]);

  const isFiltering = Boolean(debouncedSearch || activeCategoryId);
  const displayName = String(user?.name || user?.username || "").trim().split(/\s+/)[0];

  const clearCategoryFilter = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("category");
    nextParams.delete("categoryName");
    setSearchParams(nextParams);
  };

  const handleBuy = (course) => {
    if (course?.is_purchased) {
      navigate(`/user/lms/${course.id}`);
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

  const scrollToCatalog = () => {
    catalogRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handlePrimaryAction = () => {
    if (isAuthenticated && !isAdmin) {
      navigate("/user/my-courses");
      return;
    }
    if (isAuthenticated && isAdmin) {
      navigate("/admin/dashboard");
      return;
    }
    navigate("/signup");
  };

  const sidebarExtra =
    isAuthenticated && !isAdmin ? (
      <div className="app-sidebar-courses">
        <div className="app-sidebar-courses-head">
          <span>My Courses</span>
          <Link to="/user/my-courses">View all</Link>
        </div>
        {quickLoading ? (
          <ul className="app-sidebar-course-list" role="status" aria-label="Loading your courses">
            {Array.from({ length: 3 }).map((_, index) => (
              <li key={index}>
                <span className="app-sidebar-course-row">
                  <span className="app-sidebar-course-thumb">
                    <SkeletonBlock width="100%" height="100%" radius="0" />
                  </span>
                  <span className="app-sidebar-course-info">
                    <SkeletonText width="80%" />
                    <SkeletonText width="45%" />
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : quickCourses.length === 0 ? (
          <p className="app-sidebar-courses-empty">No enrolled courses yet.</p>
        ) : (
          <ul className="app-sidebar-course-list">
            {quickCourses.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="app-sidebar-course-row"
                  onClick={() => navigate(`/user/lms/${item.course.id}`)}
                  onMouseEnter={() => prefetchLmsPortal(item.course.id)}
                >
                  <span className="app-sidebar-course-thumb">
                    <img src={getCourseImageUrl(item.course)} alt="" />
                  </span>
                  <span className="app-sidebar-course-info">
                    <strong>{item.course.title}</strong>
                    <small>{item.status === "completed" ? "Completed" : "In progress"}</small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    ) : null;

  return (
    <MainLayout sidebarExtra={sidebarExtra}>
      <PageTransition>
        <section className="home-hero">
          <div className="home-hero-main">
            {isAuthenticated ? (
              <p className="home-greeting home-greeting-auth">
                Welcome back, {displayName || "there"}
                <span aria-hidden="true">👋</span>
              </p>
            ) : (
              <p className="home-greeting">
                <HiOutlineSparkles />
                SIA Software Innovations Private Limited — Access Beyond Limits
              </p>
            )}
            <h1>Learn AI, Quantum &amp; In-Demand Skills</h1>
            <p className="home-hero-subtitle">
              High-quality courses designed to help you master the technologies shaping the future.
            </p>
            <div className="home-hero-actions">
              <button type="button" className="btn btn-primary btn-icon" onClick={scrollToCatalog}>
                <HiOutlineArrowRight />
                Explore Courses
              </button>
              <button type="button" className="btn btn-outline-accent btn-icon" onClick={handlePrimaryAction}>
                <HiOutlineAcademicCap />
                {isAuthenticated ? "My Courses" : "Get Started"}
              </button>
            </div>
          </div>
          <div className="home-hero-art" aria-hidden="true">
            <span className="home-hero-art-blob" />
            <span className="home-hero-art-icon home-hero-art-icon-cap">
              <img src={graduationBookImage} alt="" />
            </span>
            <span className="home-hero-art-icon home-hero-art-icon-book">
              <HiOutlineBookOpen />
            </span>
            <span className="home-hero-art-icon home-hero-art-icon-spark">
              <HiOutlineSparkles />
            </span>
            <span className="home-hero-art-dot dot-1" />
            <span className="home-hero-art-dot dot-2" />
            <span className="home-hero-art-dot dot-3" />
          </div>
        </section>

        <section className="home-toolbar">
          <div className="home-track-row">
            {learningTracks.map((track) => (
              <button
                key={track}
                type="button"
                className="home-track-pill"
                onClick={() => handleTrackClick(track)}
              >
                {track}
              </button>
            ))}
          </div>
          <SearchBar value={search} onChange={setSearch} />
        </section>

        <section className="catalog-header" ref={catalogRef}>
          <div>
            <h2>{isFiltering ? "Search Results" : "Popular Courses"}</h2>
            <p>
              {isFiltering
                ? "Refine your search or clear filters to browse everything we offer."
                : "Choose from curated tracks designed for knowledge depth and continuous technical skill improvement."}
            </p>
            <div className="inline-controls">
              {activeCategoryId ? (
                <button type="button" className="catalog-filter-chip" onClick={clearCategoryFilter}>
                  Category: {activeCategoryName || "Selected Category"} (clear)
                </button>
              ) : null}
              {debouncedSearch ? (
                <button type="button" className="catalog-filter-chip" onClick={() => setSearch("")}>
                  Search: &quot;{debouncedSearch}&quot; (clear)
                </button>
              ) : null}
            </div>
          </div>
          <span className="catalog-badge">{count} total courses</span>
        </section>

        {loading ? (
          <SkeletonCardGrid count={8} />
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
                  onHoverPrefetch={(hoveredCourse) => prefetchCourseDetails(hoveredCourse.id)}
                />
              ))}
            </section>
            {courses.length === 0 && <p className="empty-state">No courses found. Try a broader keyword.</p>}
            <Pagination count={count} currentPage={page} onPageChange={setPage} />
          </>
        )}

        {continueLoading ? (
          <section className="continue-learning">
            <div className="continue-learning-head">
              <h2>Continue Learning</h2>
            </div>
            <article className="continue-learning-card" role="status" aria-label="Loading continue learning">
              <span className="continue-learning-thumb">
                <SkeletonBlock width="100%" height="100%" radius="0" />
              </span>
              <span className="continue-learning-body">
                <SkeletonText width="45%" style={{ height: "1.05rem" }} />
                <SkeletonText width="90%" />
                <SkeletonText width="35%" />
              </span>
              <SkeletonBlock width="170px" height="42px" radius="12px" />
            </article>
          </section>
        ) : continueCourse ? (
          <section className="continue-learning">
            <div className="continue-learning-head">
              <h2>Continue Learning</h2>
              <Link to="/user/my-courses" className="inline-link">
                View all
              </Link>
            </div>
            <article
              className="continue-learning-card"
              onMouseEnter={() => prefetchLmsPortal(continueCourse.course.id)}
            >
              <div className="continue-learning-thumb">
                <img src={getCourseImageUrl(continueCourse.course)} alt="" />
              </div>
              <div className="continue-learning-body">
                <h3>{continueCourse.course.title}</h3>
                <div className="continue-learning-progress-row">
                  <div className="continue-learning-track">
                    <span
                      className="continue-learning-fill"
                      style={{ width: `${continueCourse.progressPercent}%` }}
                    />
                  </div>
                  <strong>{continueCourse.progressPercent}%</strong>
                </div>
                <p>
                  {continueCourse.completedLessons} / {continueCourse.totalLessons} Lessons Completed
                </p>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-icon"
                onClick={() => navigate(`/user/lms/${continueCourse.course.id}`)}
              >
                <HiOutlinePlayCircle />
                Continue Learning
              </button>
            </article>
          </section>
        ) : null}
      </PageTransition>
    </MainLayout>
  );
}
