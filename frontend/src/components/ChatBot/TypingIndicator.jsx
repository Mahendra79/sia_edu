export default function TypingIndicator() {
  return (
    <div className="chat-typing-dots" aria-label="Bot is typing" role="status">
      <span className="chat-typing-dot"></span>
      <span className="chat-typing-dot"></span>
      <span className="chat-typing-dot"></span>
    </div>
  );
}
