import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { HiOutlinePaperAirplane, HiOutlineSparkles, HiOutlineXMark } from "react-icons/hi2";
import { FaRobot } from "react-icons/fa6";
import { chatbotService } from "../services/chatbotService";
import katex from "katex";
import "katex/dist/katex.min.css";

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

function renderInlineBoldAndMath(text) {
  if (!text) return null;

  // Split by LaTeX math block delimiters \[ ... \], $$ ... $$ or inline delimiters \( ... \), $ ... $
  const regex = /(\\\[[\s\S]*?\\\]|\$\$[\s\S]*?\$\$|\\\(.*?\\\)|\\$.*?\\$|\$.*?\$)/g;
  const parts = String(text).split(regex);

  return parts.map((part, index) => {
    if (!part) return null;

    // Block math \[ ... \] or $$ ... $$
    if ((part.startsWith("\\[") && part.endsWith("\\]")) || (part.startsWith("$$") && part.endsWith("$$"))) {
      const math = part.slice(2, -2).trim().replace(/√/g, "\\sqrt ");
      try {
        const html = katex.renderToString(math, { displayMode: true, throwOnError: false });
        return <div key={`math-block-${index}`} dangerouslySetInnerHTML={{ __html: html }} className="math-block" />;
      } catch {
        return <pre key={`math-error-${index}`} style={{ whiteSpace: "pre-wrap" }}>{part}</pre>;
      }
    }

    // Inline math \( ... \) or $ ... $
    if ((part.startsWith("\\(") && part.endsWith("\\)")) || (part.startsWith("$") && part.endsWith("$"))) {
      const math = (part.startsWith("\\(") ? part.slice(2, -2) : part.slice(1, -1)).trim().replace(/√/g, "\\sqrt ");
      try {
        const html = katex.renderToString(math, { displayMode: false, throwOnError: false });
        return <span key={`math-inline-${index}`} dangerouslySetInnerHTML={{ __html: html }} className="math-inline" />;
      } catch {
        return <code key={`math-error-${index}`}>{part}</code>;
      }
    }

    // Otherwise standard inline bold formatting
    return renderInlineBold(part);
  });
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
            <li key={`ol-item-${index}`}>{renderInlineBoldAndMath(item)}</li>
          ))}
        </ol>,
      );
    } else {
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="chat-msg-list unordered">
          {listItems.map((item, index) => (
            <li key={`ul-item-${index}`}>{renderInlineBoldAndMath(item)}</li>
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

    // Direct check: If this entire line is a raw LaTeX math block without delimiters
    const hasMathKeywords = /\\(frac|begin|end|pmatrix|matrix|sqrt|langle|rangle|psi|phi|alpha|beta|theta|lambda|sigma|cdot|times)/i.test(trimmed);
    const hasDelimiters = trimmed.startsWith("\\[") || trimmed.startsWith("$$") || trimmed.startsWith("\\(") || trimmed.startsWith("$");
    
    if (hasMathKeywords && !hasDelimiters) {
      const cleanTextForWords = trimmed.replace(/\\(frac|begin|end|pmatrix|matrix|sqrt|langle|rangle|psi|phi|alpha|beta|theta|lambda|sigma|cdot|times|left|right)/g, "");
      const wordCount = (cleanTextForWords.match(/[a-zA-Z]{3,}/g) || []).length;
      
      if (wordCount <= 1 || trimmed.startsWith("\\begin") || trimmed.startsWith("H =") || trimmed.startsWith("X =") || trimmed.startsWith("Y =") || trimmed.startsWith("Z =")) {
        flushList();
        try {
          const math = trimmed.replace(/√/g, "\\sqrt ");
          const html = katex.renderToString(math, { displayMode: true, throwOnError: false });
          blocks.push(<div key={`math-raw-line-${index}`} dangerouslySetInnerHTML={{ __html: html }} className="math-block" />);
          return;
        } catch {
          // Fall back to standard rendering if KaTeX fails
        }
      }
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
        {renderInlineBoldAndMath(trimmed)}
      </p>,
    );
  });

  flushList();
  if (blocks.length === 0) {
    return (
      <p className="chat-msg-paragraph">
        {renderInlineBoldAndMath(text)}
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
        "**Welcome to Support Chat**\n"
        + "- 24x7 student support for AI, ML, DL, Data Science, Prompt Engineering, and Quantum courses.\n"
        + "- Ask your topic and I will answer step-by-step."
      ),
      sources: [],
    },
  ]);

  const activeIntervalsRef = useRef([]);

  useEffect(() => {
    return () => {
      activeIntervalsRef.current.forEach(clearInterval);
    };
  }, []);

  useEffect(() => {
    if (!open || !messagesRef.current) return;
    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages, botTyping, open]);

  const typeOutMessage = (reply, sources) => {
    // Append a blank bot entry which we will progressively fill
    setMessages((prev) => [...prev, { role: "bot", text: "", sources }]);
    
    let currentText = "";
    let index = 0;
    const charsPerStep = 4; // Types 4 characters at a time for smooth, high-fidelity typing
    const intervalTime = 20;
    
    const interval = setInterval(() => {
      if (index >= reply.length) {
        clearInterval(interval);
        activeIntervalsRef.current = activeIntervalsRef.current.filter((item) => item !== interval);
        setMessages((prev) => {
          const updated = [...prev];
          const lastMsg = updated[updated.length - 1];
          if (lastMsg && lastMsg.role === "bot") {
            lastMsg.text = reply;
          }
          return updated;
        });
        setBotTyping(false);
        return;
      }
      
      currentText += reply.slice(index, index + charsPerStep);
      index += charsPerStep;
      
      setMessages((prev) => {
        const updated = [...prev];
        const lastMsg = updated[updated.length - 1];
        if (lastMsg && lastMsg.role === "bot") {
          lastMsg.text = currentText;
        }
        return updated;
      });
    }, intervalTime);

    activeIntervalsRef.current.push(interval);
  };

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
      typeOutMessage(reply, sources);
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
      setBotTyping(false);
    }
  };

  const handleSend = () => {
    askBot(input);
    setInput("");
  };

  return (
    <div className="chatbot-wrapper">
      <div className={`chatbot-modal ${open ? "open" : ""}`}>
        <header>
          <div className="chatbot-title-wrap">
            <h4>
              <FaRobot />
              Support Chat
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
          {botTyping ? (
            <div className="chat-msg bot">
              <div className="chat-msg-body">
                <div className="chat-loading-bubble">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            </div>
          ) : null}
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
      
      <button
        type="button"
        className={`chatbot-fab ${open ? "hidden" : ""}`}
        onClick={() => setOpen(true)}
        aria-label="Open chatbot"
      >
        <FaRobot className="chatbot-fab-icon" />
      </button>

    </div>
  );

}
