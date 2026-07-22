import { Fragment } from "react";

function renderInlineBold(text) {
  return String(text)
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part, index) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={`b-${index}`}>{part.slice(2, -2)}</strong>
      ) : (
        <Fragment key={`t-${index}`}>{part}</Fragment>
      ),
    );
}

function renderMessageText(text) {
  const lines = String(text || "").split(/\r?\n/);
  const blocks = [];
  let listType = null;
  let listItems = [];

  const flushList = () => {
    if (!listType || listItems.length === 0) return;
    if (listType === "ol") {
      blocks.push(
        <ol key={`ol-${blocks.length}`} className="chat-msg-list ordered">
          {listItems.map((item, index) => (
            <li key={`ol-item-${index}`}>{renderInlineBold(item)}</li>
          ))}
        </ol>,
      );
    } else {
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="chat-msg-list unordered">
          {listItems.map((item, index) => (
            <li key={`ul-item-${index}`}>{renderInlineBold(item)}</li>
          ))}
        </ul>,
      );
    }
    listType = null;
    listItems = [];
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      return;
    }

    const orderedMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (orderedMatch) {
      if (listType !== "ol") {
        flushList();
        listType = "ol";
      }
      listItems.push(orderedMatch[1]);
      return;
    }

    const unorderedMatch = trimmed.match(/^[-*]\s+(.*)$/);
    if (unorderedMatch) {
      if (listType !== "ul") {
        flushList();
        listType = "ul";
      }
      listItems.push(unorderedMatch[1]);
      return;
    }

    flushList();
    blocks.push(
      <p key={`p-${index}`} className="chat-msg-paragraph">
        {renderInlineBold(trimmed)}
      </p>,
    );
  });

  flushList();
  if (blocks.length === 0) {
    return (
      <p className="chat-msg-paragraph">
        {renderInlineBold(text)}
      </p>
    );
  }
  return blocks;
}

export default function MessageBubble({ message }) {
  const isBot = message.role === "bot";
  const formattedTime = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <div className={`chat-msg ${message.role}`}>
      <div className="chat-msg-body">
        {renderMessageText(message.text)}
        
        {isBot && message.sources && message.sources.length > 0 && (
          <div className="chat-msg-source" style={{ marginTop: "6px" }}>
            <strong>Sources:</strong> {message.sources.join(", ")}
          </div>
        )}
        
        {formattedTime && (
          <span className="chat-msg-time">
            {formattedTime}
          </span>
        )}
      </div>
    </div>
  );
}
