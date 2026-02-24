import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiOutlineArrowTopRightOnSquare } from "react-icons/hi2";

import LoadingSpinner from "../components/LoadingSpinner";
import Pagination from "../components/Pagination";
import { useToast } from "../context/ToastContext";
import UserLayout from "../layouts/UserLayout";
import { courseService } from "../services/courseService";
import { formatCurrency, formatDate } from "../utils/format";
import "./user.css";

export default function MyCourses() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [courses, setCourses] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyCourses = async () => {
      setLoading(true);
      try {
        const response = await courseService.getMyCourses({ page });
        setCourses(response.data.results || []);
        setCount(response.data.count || 0);
      } catch {
        addToast({ type: "error", message: "Unable to load enrolled courses." });
      } finally {
        setLoading(false);
      }
    };
    fetchMyCourses();
  }, [page, addToast]);

  const handleViewCourse = (courseId) => {
    navigate(`/course/${courseId}`);
  };

  return (
    <UserLayout>
      <h1>My Courses</h1>
      {loading ? (
        <LoadingSpinner />
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
                  <tr key={item.id}>
                    <td>{item.course.title}</td>
                    <td>{item.status}</td>
                    <td>{item.payment_status}</td>
                    <td>{formatCurrency(item.course.price)}</td>
                    <td>{formatDate(item.enrolled_at)}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-muted btn-icon"
                        onClick={() => handleViewCourse(item.course.id)}
                      >
                        <HiOutlineArrowTopRightOnSquare />
                        View Course
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
