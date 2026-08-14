import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiOutlineBookOpen, HiOutlinePlayCircle } from "react-icons/hi2";

import { extractYoutubeThumbnail } from "../utils/youtube";

export default function FreeCourseCard({ freeCourse }) {
  const navigate = useNavigate();
  const [imageFailed, setImageFailed] = useState(false);
  const thumbnailUrl = freeCourse.thumbnail_url || extractYoutubeThumbnail(freeCourse.youtube_url);

  const handleOpen = () => {
    navigate(`/free-course/${freeCourse.id}`);
  };

  return (
    <article
      className="course-card course-card-interactive free-course-card"
      role="link"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleOpen();
        }
      }}
    >
      <div className="course-image-wrap">
        {thumbnailUrl && !imageFailed ? (
          <img
            src={thumbnailUrl}
            alt={freeCourse.title}
            className="course-image"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="course-image-placeholder">
            <HiOutlineBookOpen />
            <span>{freeCourse.title}</span>
          </div>
        )}
      </div>
      <div className="course-content">
        <div className="course-tags">
          <span className="pill pill-owned">Free</span>
        </div>
        <h3>{freeCourse.title}</h3>
        <div className="course-meta">
          <button type="button" className="btn btn-primary btn-icon" onClick={handleOpen}>
            <HiOutlinePlayCircle />
            Watch
          </button>
        </div>
      </div>
    </article>
  );
}
