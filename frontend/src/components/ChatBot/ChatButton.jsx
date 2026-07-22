import { FaRobot } from "react-icons/fa6";
import { HiOutlineSparkles as SparklesIcon } from "react-icons/hi2";

export default function ChatButton({ onClick, open }) {
  return (
    <button
      type="button"
      className="chatbot-fab"
      onClick={onClick}
      aria-label={open ? "Close support chat" : "Open support chat"}
      aria-expanded={open}
    >
      <FaRobot />
      <span>Support Chat</span>
      <SparklesIcon />
    </button>
  );
}
