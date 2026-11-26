import { useCallback, useMemo, useState } from "react";
import { HiOutlineCpuChip, HiOutlinePlay, HiOutlineSparkles } from "react-icons/hi2";

import LoadingSpinner from "../components/LoadingSpinner";
import PageTransition from "../components/PageTransition";
import { useToast } from "../context/ToastContext";
import AdminLayout from "../layouts/AdminLayout";
import { chatbotService } from "../services/chatbotService";
import "./admin.css";

function asPercent(value) {
  return `${Number(value || 0).toFixed(2)}%`;
}

function formatMs(value) {
  return `${Number(value || 0).toFixed(2)} ms`;
}

const INFERENCE_STAGES = [
  { label: "Query processing", key: "query_processing_ms" },
  { label: "Embedding model initialization", key: "embedding_model_initialization_ms" },
  { label: "Embedding generation", key: "embedding_generation_ms" },
  { label: "Vector database retrieval", key: "vector_database_retrieval_ms" },
  { label: "Lexical retrieval", key: "lexical_retrieval_ms" },
  { label: "Reranking", key: "reranking_ms" },
  { label: "Context preparation", key: "context_preparation_ms" },
  { label: "LLM generation", key: "llm_generation_ms" },
  { label: "Post-processing", key: "post_processing_ms" },
];

function InferenceAnalysis({ results }) {
  const measuredResults = useMemo(
    () => results.filter((item) => item.diagnostics?.latency_ms),
    [results],
  );
  const averages = useMemo(() => {
    if (!measuredResults.length) return {};
    return Object.fromEntries(
      [
        "retrieval_total_ms",
        "llm_generation_ms",
        "total_inference_ms",
        "total_request_ms",
        ...INFERENCE_STAGES.map((stage) => stage.key),
      ].map((key) => [
        key,
        measuredResults.reduce(
          (sum, item) => sum + Number(item.diagnostics.latency_ms[key] || 0),
          0,
        ) / measuredResults.length,
      ]),
    );
  }, [measuredResults]);
  const largestStage = Math.max(1, ...INFERENCE_STAGES.map((stage) => averages[stage.key] || 0));

  return (
    <section className="panel-card chatbot-eval-panel inference-analysis">
      <div className="chatbot-eval-head">
        <h3>Inference Performance &amp; Retrieval Analysis</h3>
        <p>Measured timings and execution details from the latest online evaluation queries.</p>
      </div>

      {!measuredResults.length ? (
        <p className="meta-note">Run a Gemini or Groq evaluation to collect inference diagnostics.</p>
      ) : (
        <>
          <div className="mis-kpi-grid inference-summary-grid">
            <article className="stat-card stat-card-button">
              <h3>Average Total Inference</h3>
              <strong>{formatMs(averages.total_inference_ms)}</strong>
            </article>
            <article className="stat-card stat-card-button">
              <h3>Average Retrieval</h3>
              <strong>{formatMs(averages.retrieval_total_ms)}</strong>
            </article>
            <article className="stat-card stat-card-button">
              <h3>Average LLM Generation</h3>
              <strong>{formatMs(averages.llm_generation_ms)}</strong>
            </article>
          </div>

          <div className="inference-stage-chart" aria-label="Average latency by inference stage">
            <h4>Average stage latency</h4>
            {INFERENCE_STAGES.map((stage) => {
              const stageValue = averages[stage.key] || 0;
              return (
                <div className="inference-stage-row" key={stage.key}>
                  <div className="inference-stage-label">
                    <span>{stage.label}</span>
                    <strong>{formatMs(stageValue)}</strong>
                  </div>
                  <div className="inference-stage-track">
                    <div
                      className="inference-stage-fill"
                      style={{ width: `${stageValue ? Math.max((stageValue / largestStage) * 100, 1) : 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="inference-case-list">
            <h4>Per-query diagnostics</h4>
            {measuredResults.map((item) => {
              const diagnostics = item.diagnostics;
              const retrieval = diagnostics.retrieval || {};
              const llm = diagnostics.llm || {};
              const chunks = retrieval.chunks || [];
              const calls = llm.calls || [];
              const latency = diagnostics.latency_ms || {};

              return (
                <details className="inference-case" key={item.case_id}>
                  <summary>
                    {item.case_id} · {formatMs(latency.total_inference_ms)}
                  </summary>
                  <p className="meta-note">{item.prompt}</p>
                  <p className="meta-note">
                    Total request: {formatMs(latency.total_request_ms)} · Embedding model initialization:{" "}
                    {formatMs(latency.embedding_model_initialization_ms)} · Generated tokens:{" "}
                    {llm.generated_tokens ?? "not reported"} · Tokens/second:{" "}
                    {llm.tokens_per_second ?? "not reported"}
                  </p>
                  <p className="meta-note">
                    Retrieval backend: {retrieval.backend || "not reported"} · Vector search:{" "}
                    {retrieval.vector_search_used ? "used" : "not used"} · Reranking:{" "}
                    {retrieval.reranking_used ? "used" : "not used"} · Embedding device:{" "}
                    {retrieval.embedding_device || "not reported"}
                  </p>

                  <div className="inference-detail-group">
                    <h5>Retrieved chunks ({chunks.length})</h5>
                    {chunks.length ? (
                      chunks.map((chunk) => (
                        <details className="inference-chunk" key={`${chunk.chunk_id}-${chunk.rank}`}>
                          <summary>
                            Rank {chunk.rank} · {chunk.source_document} · {chunk.score_type}:{" "}
                            {chunk.retrieval_score} · {chunk.passed_to_llm ? "Passed to LLM" : "Not passed to LLM"}
                          </summary>
                          <p className="meta-note">
                            Chunk ID: {chunk.chunk_id}
                            {chunk.chunk_index !== null && chunk.chunk_index !== undefined
                              ? ` · Chunk index: ${chunk.chunk_index}`
                              : ""}
                            {chunk.section ? ` · Section: ${chunk.section}` : ""}
                          </p>
                          <pre>{chunk.retrieved_text}</pre>
                        </details>
                      ))
                    ) : (
                      <p className="meta-note">No chunks were retrieved for this query.</p>
                    )}
                    {retrieval.supplemental_context?.length ? (
                      <p className="meta-note">
                        Supplemental course context passed to LLM:{" "}
                        {retrieval.supplemental_context
                          .map((context) => context.source_document)
                          .join(", ")}
                      </p>
                    ) : null}
                  </div>

                  <details className="inference-llm-details">
                    <summary>LLM execution details</summary>
                    <p className="meta-note">
                      Provider/model: {llm.provider || "n/a"} / {llm.model || "n/a"} · API calls:{" "}
                      {llm.api_calls ?? 0} · Retries: {llm.retry_count ?? 0} · Status:{" "}
                      {llm.status || "n/a"} · Fallback used: {llm.fallback_used ? "Yes" : "No"}
                    </p>
                    {calls.length ? (
                      calls.map((call, index) => (
                        <p className="meta-note" key={`${item.case_id}-call-${index}`}>
                          Call {index + 1}: {formatMs(call.latency_ms)} · {call.status}
                          {call.status_code ? ` (HTTP ${call.status_code})` : ""}
                          {call.retry ? " · retry" : ""}
                          {call.token_usage
                            ? ` · tokens: ${call.token_usage.input_tokens ?? "?"} input / ${
                                call.token_usage.output_tokens ?? "?"
                              } output / ${call.token_usage.total_tokens ?? "?"} total`
                            : " · token usage not reported"}
                        </p>
                      ))
                    ) : (
                      <p className="meta-note">No LLM API calls were recorded.</p>
                    )}
                  </details>
                </details>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

export default function ChatbotQA() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [runningProvider, setRunningProvider] = useState(null);
  const [report, setReport] = useState(null);

  const runEvaluation = useCallback(
    async (provider) => {
      setRunningProvider(provider);
      setLoading(true);
      try {
        const response = await chatbotService.evaluate({ provider, max_cases: 6 });
        setReport(response.data);
        addToast({
          type: "success",
          message: `${provider === "gemini" ? "Gemini" : "Groq"} evaluation completed.`,
        });
      } catch (error) {
        addToast({
          type: "error",
          message: error?.response?.data?.detail || `Unable to run ${provider} evaluation.`,
        });
      } finally {
        setRunningProvider(null);
        setLoading(false);
      }
    },
    [addToast],
  );

  const summary = report?.summary || {};
  const results = report?.results || [];
  const passCount = useMemo(() => Number(summary.passed_cases || 0), [summary.passed_cases]);

  return (
    <AdminLayout>
      <PageTransition>
        <section className="page-top">
          <div>
            <h1>Chatbot Quality</h1>
            <p>Online Gemini and Groq evaluations for RAG quality, response structure, and latency.</p>
          </div>
          <div className="inline-controls">
            <button
              type="button"
              className="btn btn-muted btn-icon"
              onClick={() => runEvaluation("gemini")}
              disabled={Boolean(runningProvider)}
            >
              <HiOutlinePlay />
              {runningProvider === "gemini" ? "Running Gemini..." : "Run Gemini Eval"}
            </button>
            <button
              type="button"
              className="btn btn-primary btn-icon"
              onClick={() => runEvaluation("groq")}
              disabled={Boolean(runningProvider)}
            >
              <HiOutlineCpuChip />
              {runningProvider === "groq" ? "Running Groq..." : "Run Groq Eval"}
            </button>
          </div>
        </section>

        {loading ? (
          <LoadingSpinner label="Running chatbot evaluation..." />
        ) : !report ? (
          <section className="panel-card chatbot-eval-panel">
            <div className="chatbot-eval-head">
              <h3>
                <HiOutlineSparkles />
                Run an online evaluation
              </h3>
              <p>Select Gemini or Groq above to run the benchmark against that online model.</p>
            </div>
          </section>
        ) : (
          <>
            <section className="mis-kpi-grid">
              <article className="stat-card stat-card-button">
                <h3>Total Cases</h3>
                <strong>{summary.total_cases || 0}</strong>
              </article>
              <article className="stat-card stat-card-button">
                <h3>Passed Cases</h3>
                <strong>{passCount}</strong>
              </article>
              <article className="stat-card stat-card-button">
                <h3>Pass Rate</h3>
                <strong>{asPercent(summary.pass_rate)}</strong>
              </article>
              <article className="stat-card stat-card-button">
                <h3>Average Score</h3>
                <strong>{Number(summary.average_score || 0).toFixed(2)}</strong>
              </article>
              <article className="stat-card stat-card-button">
                <h3>Avg Latency</h3>
                <strong>{Number(summary.average_latency_ms || 0).toFixed(2)} ms</strong>
              </article>
              <article className="stat-card stat-card-button">
                <h3>Mode</h3>
                <strong>{summary.evaluation_mode || "n/a"}</strong>
              </article>
            </section>

            <section className="panel-card chatbot-eval-panel">
              <div className="chatbot-eval-head">
                <h3>
                  <HiOutlineSparkles />
                  Evaluation Cases
                </h3>
                <p>
                  Each case checks structured response format, expected keyword coverage, grounded course context, and latency.
                </p>
              </div>
              <div className="table-wrap chatbot-eval-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Case</th>
                      <th>Provider</th>
                      <th>Score</th>
                      <th>Latency</th>
                      <th>Checks</th>
                      <th>Reply Preview</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((item) => (
                      <tr key={item.case_id}>
                        <td>
                          <strong>{item.case_id}</strong>
                          <p className="meta-note">{item.prompt}</p>
                        </td>
                        <td>
                          <p>{item.provider}</p>
                          <p className="meta-note">{item.model}</p>
                        </td>
                        <td>
                          <strong>{item.score}</strong>
                          <p className={`meta-note ${item.passed ? "qa-pass" : "qa-fail"}`}>
                            {item.passed ? "Pass" : "Fail"}
                          </p>
                        </td>
                        <td>
                          <p>{item.latency_ms} ms</p>
                          <p className="meta-note">retrieval hits: {item.retrieval_hits}</p>
                        </td>
                        <td>
                          <p className="meta-note">Structured: {item.checks?.has_structure ? "Yes" : "No"}</p>
                          <p className="meta-note">Grounded: {item.checks?.grounded ? "Yes" : "No"}</p>
                          <p className="meta-note">
                            Keywords: {item.checks?.keyword_hits ?? 0}/{item.checks?.keyword_target ?? 0}
                          </p>
                        </td>
                        <td>
                          <div className="chatbot-reply-preview">{item.reply_preview}</div>
                        </td>
                      </tr>
                    ))}
                    {results.length === 0 ? (
                      <tr>
                        <td colSpan={6}>No evaluation results available.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
        <InferenceAnalysis results={results} />
      </PageTransition>
    </AdminLayout>
  );
}
