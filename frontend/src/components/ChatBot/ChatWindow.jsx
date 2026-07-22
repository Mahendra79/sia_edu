import Header from "./Header";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";

export default function ChatWindow({
  onClose,
  messages,
  botTyping,
  messagesRef,
  input,
  onChangeInput,
  onSend,
  suggestions,
  onSuggestionClick,
  onClear,
  focusedCourseTitle,
}) {
  return (
    <div className="chatbot-modal" role="dialog" aria-label="Support Chat Window">
      <Header
        onClose={onClose}
        onClear={onClear}
        focusedCourseTitle={focusedCourseTitle}
      />
      
      <MessageList
        messages={messages}
        botTyping={botTyping}
        messagesRef={messagesRef}
      />
      
      {suggestions && suggestions.length > 0 && (
        <div className="chatbot-suggestions">
          {suggestions.map((item) => (
            <button
              key={item.label}
              type="button"
              className="chat-suggestion-btn"
              onClick={() => onSuggestionClick(item.query)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
      
      <ChatInput
        value={input}
        onChange={onChangeInput}
        onSend={onSend}
        disabled={botTyping}
      />
    </div>
  );
}
