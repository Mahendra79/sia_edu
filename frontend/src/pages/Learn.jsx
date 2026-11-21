import { useCallback, useEffect, useRef, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { useTheme } from "../context/ThemeContext";
import { useDocumentMeta } from "../hooks/useDocumentMeta";

// Bump when files in public/learn-quantum change so browsers fetch the new version.
const GUIDE_VERSION = "20261121-3";
const LESSON_HASH = /^#[a-z0-9-]+$/i;

export default function Learn() {
  const { theme } = useTheme();
  const guideFrameRef = useRef(null);
  const [ready, setReady] = useState(false);

  useDocumentMeta({
    title: "Learn Quantum | SIA Software Innovations",
    description:
      "Explore an interactive quantum computing field guide with lessons, demonstrations, quizzes, and progress tracking.",
    path: "/learn",
  });

  // Built once: later theme changes go through postMessage, so switching theme
  // never reloads the guide or loses the open lesson. A lesson hash in the page
  // URL (/learn#sia-doc-3) opens that lesson directly.
  const [guideSrc] = useState(() => {
    const hash = LESSON_HASH.test(window.location.hash) ? window.location.hash : "";
    return `/learn-quantum/index.html?embedded=1&theme=${theme}&v=${GUIDE_VERSION}${hash}`;
  });

  const sendThemeToGuide = useCallback(() => {
    guideFrameRef.current?.contentWindow?.postMessage(
      { type: "sia-education-theme", theme },
      window.location.origin,
    );
  }, [theme]);

  useEffect(() => {
    sendThemeToGuide();
  }, [sendThemeToGuide]);

  // Keep the open lesson in the page URL so refresh and shared links work.
  useEffect(() => {
    const onMessage = (event) => {
      if (event.origin !== window.location.origin || event.source !== guideFrameRef.current?.contentWindow) return;
      if (event.data?.type === "sia-learn-route") {
        const hash = LESSON_HASH.test(event.data.hash || "") ? event.data.hash : "";
        if (hash !== window.location.hash) {
          window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.search}${hash}`);
        }
      } else if (event.data?.type === "sia-learn-ready") {
        setReady(true);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const handleLoad = () => {
    sendThemeToGuide();
    setReady(true);
  };

  return (
    <MainLayout contentClassName="learn-quantum-page" showFooter={false}>
      {!ready ? (
        <div className="learn-quantum-loading" role="status" aria-live="polite">
          <div className="spinner" />
          <span>Loading Learn Quantum…</span>
        </div>
      ) : null}
      <iframe
        ref={guideFrameRef}
        className={`learn-quantum-frame ${ready ? "is-ready" : ""}`.trim()}
        src={guideSrc}
        title="Learn Quantum interactive field guide"
        allow="clipboard-write"
        onLoad={handleLoad}
      />
    </MainLayout>
  );
}
