import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { HiOutlinePaperAirplane, HiOutlineSparkles, HiOutlineXMark } from "react-icons/hi2";
import { FaRobot } from "react-icons/fa6";
import { chatbotService } from "../services/chatbotService";

const QUICK_SUGGESTIONS = [
  { label: "Roadmap", query: "Give me AI learning roadmap for beginners" },
  { label: "ML/DL Path", query: "Best ML and DL courses with sequence" },
  { label: "Prompt Path", query: "Prompt engineering path with projects" },
  { label: "Quantum Basics", query: "Quantum computing basics for starters" },
  { label: "Billing Help", query: "Billing and enrollment help" },
];

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

export default function Chatbot() {
  const location = useLocation();
  const activeCourseId = useMemo(() => {
    const match = location.pathname.match(/^\/course\/(\d+)/);
    return match ? Number(match[1]) : null;
  }, [location.pathname]);
  const messagesRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [botTyping, setBotTyping] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: (
        "**Welcome to SIA_Chat**\n"
        + "- 24x7 student support for AI, ML, DL, Data Science, Prompt Engineering, and Quantum courses.\n"
        + "- Ask your topic and I will answer step-by-step."
      ),
      sources: [],
    },
  ]);

  useEffect(() => {
    if (!open || !messagesRef.current) return;
    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages, botTyping, open]);

  const askBot = async (rawText) => {
    const text = rawText.trim();
    if (!text || botTyping) {
      return;
    }

    const userEntry = { role: "user", text, sources: [] };
    const historyPayload = [...messages, userEntry]
      .filter((item) => item.role === "user" || item.role === "bot")
      .slice(-8)
      .map((item) => ({
        role: item.role === "bot" ? "assistant" : "user",
        content:
          item.role === "bot" && item.sources?.length
            ? `${item.text}\nSources: ${item.sources.join(", ")}`
            : item.text,
      }))
      .map((item) => ({
        ...item,
        content: String(item.content || "").slice(0, 1200),
      }));

    setMessages((prev) => [...prev, userEntry]);
    setBotTyping(true);

    try {
      const response = await chatbotService.sendMessage({
        message: text,
        ...(activeCourseId ? { course_id: activeCourseId } : {}),
        history: historyPayload,
      });
      const reply = response?.data?.reply || "**Quick Retry**\n- I can help with your education doubts.\n- Please rephrase the question.";
      const sources = Array.isArray(response?.data?.sources) ? response.data.sources : [];
      setMessages((prev) => [...prev, { role: "bot", text: reply, sources }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: (
            "**Service Temporary Delay**\n"
            + "- I could not reach the learning assistant right now.\n"
            + "- Please try again in a few seconds."
          ),
          sources: [],
        },
      ]);
    } finally {
      setBotTyping(false);
    }
  };

  const handleSend = () => {
    askBot(input);
    setInput("");
  };

  return (
    <div className="chatbot-wrapper">
      {open && (
        <div className="chatbot-modal">
          <header>
            <div className="chatbot-title-wrap">
              <h4>
                <FaRobot />
                SIA_Chat
              </h4>
              <p>
                24x7 student doubt support for AI, ML, DL, Data Science, Prompt Engineering, and Quantum tracks.
                {activeCourseId ? " Focused on selected course." : ""}
              </p>
            </div>
            <button type="button" className="btn btn-muted chat-close-btn" onClick={() => setOpen(false)}>
              <HiOutlineXMark />
            </button>
          </header>
          <div className="chatbot-messages" ref={messagesRef}>
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`chat-msg ${message.role}`}>
                <div className="chat-msg-body">{renderMessageText(message.text)}</div>
              </div>
            ))}
            {botTyping ? <div className="chat-msg bot">SIA_Chat is preparing your answer...</div> : null}
          </div>
          <div className="chatbot-suggestions">
            {QUICK_SUGGESTIONS.map((item) => (
              <button key={item.label} type="button" className="chat-suggestion-btn" onClick={() => askBot(item.query)}>
                {item.label}
              </button>
            ))}
          </div>
          <div className="chatbot-input">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={activeCourseId ? "Ask your doubt about this course..." : "Ask about AI, ML, DL, Prompt Engineering, or Quantum..."}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleSend();
                }
              }}
            />
            <button type="button" className="btn btn-primary btn-icon" onClick={handleSend} disabled={botTyping}>
              <HiOutlinePaperAirplane />
              Send
            </button>
          </div>
        </div>
      )}
      <button type="button" className="chatbot-fab" onClick={() => setOpen((prev) => !prev)} aria-label="Open chatbot">
        <FaRobot />
        <span>SIA_Chat</span>
        <HiOutlineSparkles />
      </button>
    </div>
  );
}
