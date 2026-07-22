import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

export default function MessageList({ messages, botTyping, messagesRef }) {
  return (
    <div className="chatbot-messages" ref={messagesRef}>
      {messages.map((message, index) => (
        <MessageBubble key={`${message.role}-${index}`} message={message} />
      ))}
      
      {botTyping && (
        <div className="chat-msg bot">
          <div className="chat-msg-body">
            <span style={{ fontSize: "0.82rem", marginBottom: "4px" }}>
              Support chat is preparing your answer...
            </span>
            <TypingIndicator />
          </div>
        </div>
      )}
    </div>
  );
}
