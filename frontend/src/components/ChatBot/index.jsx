import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { chatbotService } from "../../services/chatbotService";
import { courseService } from "../../services/courseService";
import ChatButton from "./ChatButton";
import ChatWindow from "./ChatWindow";
import "./ChatBot.css";

const STORAGE_KEY = "sia_edu_chat_history";

const QUICK_SUGGESTIONS = [
  { label: "Features", query: "What features does this education platform support?" },
  { label: "AI Roadmap", query: "Give me AI learning roadmap for beginners" },
  { label: "DB Schema", query: "What database models track lesson progress?" },
  { label: "Payments", query: "How do billing payments and discounts work?" },
  { label: "Policies", query: "What is your privacy policy and refund policy?" }
];

const DEFAULT_WELCOME = {
  role: "bot",
  text: (
    "**Welcome to SIA EDU Support Chat**\n" +
    "- I can answer questions about this website, its functionality, pages, and features.\n" +
    "- Ask about course catalogs, categories, database schemas, API routes, or policies.\n" +
    "- Simply type your query and I will help you using retrieved codebase facts."
  ),
  sources: [],
  timestamp: new Date().toISOString()
};

export default function ChatBot() {
  const location = useLocation();
  const messagesRef = useRef(null);

  const activeCourseId = useMemo(() => {
    const match = location.pathname.match(/^\/course\/(\d+)/);
    return match ? Number(match[1]) : null;
  }, [location.pathname]);

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [botTyping, setBotTyping] = useState(false);
  const [focusedCourse, setFocusedCourse] = useState(null);
  
  // Load conversation history from localStorage
  const [messages, setMessages] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [DEFAULT_WELCOME];
    } catch {
      return [DEFAULT_WELCOME];
    }
  });

  // Persist history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.error("Failed to save chat history:", e);
    }
  }, [messages]);

  // Fetch course details if activeCourseId is set
  useEffect(() => {
    if (!activeCourseId) {
      setFocusedCourse(null);
      return;
    }

    courseService.getCourse(activeCourseId)
      .then((res) => {
        setFocusedCourse(res.data);
      })
      .catch((err) => {
        console.error("Failed to load active course details for chat context:", err);
        setFocusedCourse(null);
      });
  }, [activeCourseId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (!open || !messagesRef.current) return;
    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages, botTyping, open]);

  const askBot = async (rawText) => {
    const text = rawText.trim();
    if (!text || botTyping) return;

    const userEntry = {
      role: "user",
      text,
      sources: [],
      timestamp: new Date().toISOString()
    };
    
    // Construct standard history payload
    const historyPayload = [...messages, userEntry]
      .filter((item) => item.role === "user" || item.role === "bot")
      .slice(-8)
      .map((item) => ({
        role: item.role === "bot" ? "assistant" : "user",
        content: String(item.text || "").slice(0, 1200)
      }));

    setMessages((prev) => [...prev, userEntry]);
    setBotTyping(true);

    try {
      const response = await chatbotService.sendMessage({
        message: text,
        ...(activeCourseId ? { course_id: activeCourseId } : {}),
        history: historyPayload
      });

      const reply = response?.data?.reply || "I couldn't find information about that in this website.";
      const sources = Array.isArray(response?.data?.sources) ? response.data.sources : [];
      
      setMessages((prev) => [...prev, {
        role: "bot",
        text: reply,
        sources,
        timestamp: new Date().toISOString()
      }]);
    } catch (err) {
      console.error("Chatbot API execution error:", err);
      setMessages((prev) => [...prev, {
        role: "bot",
        text: (
          "**Service Temporary Delay**\n" +
          "- I was unable to connect to the assistant server.\n" +
          "- Please verify your network and check that the server is running."
        ),
        sources: [],
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setBotTyping(false);
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;
    askBot(input);
    setInput("");
  };

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear your conversation history?")) {
      setMessages([DEFAULT_WELCOME]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <div className="chatbot-wrapper">
      {open && (
        <ChatWindow
          onClose={() => setOpen(false)}
          messages={messages}
          botTyping={botTyping}
          messagesRef={messagesRef}
          input={input}
          onChangeInput={(e) => setInput(e.target.value)}
          onSend={handleSend}
          suggestions={QUICK_SUGGESTIONS}
          onSuggestionClick={askBot}
          onClear={handleClear}
          focusedCourseTitle={focusedCourse?.title || null}
        />
      )}
      
      <ChatButton
        onClick={() => setOpen((prev) => !prev)}
        open={open}
      />
    </div>
  );
}
