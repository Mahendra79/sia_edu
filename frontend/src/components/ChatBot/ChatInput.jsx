import { HiOutlinePaperAirplane } from "react-icons/hi2";

export default function ChatInput({ value, onChange, onSend, disabled }) {
  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onSend();
    }
  };

  return (
    <div className="chatbot-input">
      <input
        value={value}
        onChange={onChange}
        placeholder="Ask about this website, courses, features..."
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-label="Ask a question about the website"
      />
      <button
        type="button"
        className="btn btn-primary btn-icon"
        onClick={onSend}
        disabled={disabled || !value.trim()}
        aria-label="Send message"
      >
        <HiOutlinePaperAirplane />
        Send
      </button>
    </div>
  );
}
