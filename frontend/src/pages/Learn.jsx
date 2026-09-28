import MainLayout from "../layouts/MainLayout";
import { useDocumentMeta } from "../hooks/useDocumentMeta";

export default function Learn() {
  useDocumentMeta({
    title: "Learn Quantum | SIA Software Innovations",
    description:
      "Explore an interactive quantum computing field guide with lessons, demonstrations, quizzes, and progress tracking.",
    path: "/learn",
  });

  return (
    <MainLayout contentClassName="learn-quantum-page" showFooter={false}>
      <iframe
        className="learn-quantum-frame"
        src="/learn-quantum/index.html?embedded=1"
        title="Learn Quantum interactive field guide"
        allow="clipboard-write"
      />
    </MainLayout>
  );
}
