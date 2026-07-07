import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiOutlineArrowTopRightOnSquare } from "react-icons/hi2";

import Pagination from "../components/Pagination";
import { SkeletonTable } from "../components/Skeleton";
import { useToast } from "../context/ToastContext";
import UserLayout from "../layouts/UserLayout";
import { courseService } from "../services/courseService";
import { prefetchLmsPortal } from "../data/lmsPrefetch";
import { formatCurrency, formatDate } from "../utils/format";
import { getCached, setCached } from "../utils/sessionCache";
import "./user.css";

export default function MyCourses() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [page, setPage] = useState(1);
  const cachedPage1 = getCached(`my-courses:1`);
  const [courses, setCourses] = useState(() => cachedPage1?.courses || []);
  const [count, setCount] = useState(() => cachedPage1?.count || 0);
  const [loading, setLoading] = useState(() => !cachedPage1);

  useEffect(() => {
    const cacheKey = `my-courses:${page}`;
    const cached = getCached(cacheKey);
    if (cached) {
      setCourses(cached.courses);
      setCount(cached.count);
      setLoading(false);
    } else {
      setLoading(true);
    }

    const fetchMyCourses = async () => {
      try {
        const response = await courseService.getMyCourses({ page });
        const results = response.data.results || [];
        const total = response.data.count || 0;
        setCourses(results);
        setCount(total);
        setCached(cacheKey, { courses: results, count: total });
      } catch {
        if (!cached) {
          addToast({ type: "error", message: "Unable to load enrolled courses." });
        }
      } finally {
        setLoading(false);
      }
    };
    fetchMyCourses();
  }, [page, addToast]);

  const handleViewCourse = (courseId) => {
    navigate(`/user/lms/${courseId}`);
  };

  return (
    <UserLayout>
      <h1>My Courses</h1>
      {loading ? (
        <SkeletonTable rows={5} columns={6} />
      ) : courses.length === 0 ? (
        <p className="empty-state">No enrolled courses yet.</p>
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Price</th>
                  <th>Enrolled At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((item) => (
                  <tr key={item.id} onMouseEnter={() => prefetchLmsPortal(item.course.id)}>
                    <td>{item.course.title}</td>
                    <td>{item.status}</td>
                    <td>{item.payment_status}</td>
                    <td>
                      {formatCurrency(
                        item.paid_total ??
                          item.course.final_price ??
                          item.course.discounted_price ??
                          item.course.price,
                        String(item.paid_currency || "INR").toUpperCase()
                      )}
                    </td>
                    <td>{formatDate(item.enrolled_at)}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-muted btn-icon"
                        onClick={() => handleViewCourse(item.course.id)}
                      >
                        <HiOutlineArrowTopRightOnSquare />
                        Start Learning
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination count={count} currentPage={page} onPageChange={setPage} />
        </>
      )}
    </UserLayout>
  );
}
