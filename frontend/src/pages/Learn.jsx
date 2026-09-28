import { useCallback, useEffect, useRef } from "react";
import MainLayout from "../layouts/MainLayout";
import { useTheme } from "../context/ThemeContext";
import { useDocumentMeta } from "../hooks/useDocumentMeta";

export default function Learn() {
  const { theme } = useTheme();
  const guideFrameRef = useRef(null);

  useDocumentMeta({
    title: "Learn Quantum | SIA Software Innovations",
    description:
      "Explore an interactive quantum computing field guide with lessons, demonstrations, quizzes, and progress tracking.",
    path: "/learn",
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

  return (
    <MainLayout contentClassName="learn-quantum-page" showFooter={false}>
      <iframe
        ref={guideFrameRef}
        className="learn-quantum-frame"
        src={`/learn-quantum/index.html?embedded=1&theme=${theme}`}
        title="Learn Quantum interactive field guide"
        allow="clipboard-write"
        onLoad={sendThemeToGuide}
      />
    </MainLayout>
  );
}
