import { FaRobot, FaTrashCan } from "react-icons/fa6";
import { HiOutlineXMark } from "react-icons/hi2";

export default function Header({ onClose, onClear, focusedCourseTitle }) {
  return (
    <header>
      <div className="chatbot-title-wrap">
        <h4>
          <FaRobot />
          Support Chat
        </h4>
        <p>
          24x7 website assistant for SIA Software Innovations.
          {focusedCourseTitle ? ` Focus: ${focusedCourseTitle}` : ""}
        </p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
        <button
          type="button"
          className="chat-clear-btn"
          onClick={onClear}
          title="Clear Chat History"
          aria-label="Clear chat history"
        >
          <FaTrashCan />
          Clear
        </button>
        <button
          type="button"
          className="btn btn-muted chat-close-btn"
          onClick={onClose}
          aria-label="Close chat window"
        >
          <HiOutlineXMark />
        </button>
      </div>
    </header>
  );
}
