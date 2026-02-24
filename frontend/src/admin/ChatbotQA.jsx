import { useCallback, useEffect, useMemo, useState } from "react";
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

export default function ChatbotQA() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [runningOffline, setRunningOffline] = useState(false);
  const [runningModel, setRunningModel] = useState(false);
  const [report, setReport] = useState(null);

  const runEvaluation = useCallback(
    async ({ useModel }) => {
      if (useModel) {
        setRunningModel(true);
      } else {
        setRunningOffline(true);
      }
      try {
        const response = await chatbotService.evaluate({ use_model: useModel, max_cases: 6 });
        setReport(response.data);
        addToast({
          type: "success",
          message: useModel ? "Model evaluation completed." : "Offline evaluation completed.",
        });
      } catch {
        addToast({ type: "error", message: "Unable to run chatbot evaluation." });
      } finally {
        if (useModel) {
          setRunningModel(false);
        } else {
          setRunningOffline(false);
        }
        setLoading(false);
      }
    },
    [addToast],
  );

  useEffect(() => {
    runEvaluation({ useModel: false });
  }, [runEvaluation]);

  const summary = report?.summary || {};
  const results = report?.results || [];
  const passCount = useMemo(() => Number(summary.passed_cases || 0), [summary.passed_cases]);

  return (
    <AdminLayout>
      <PageTransition>
        <section className="page-top">
          <div>
            <h1>Chatbot Quality</h1>
            <p>RAG quality checks, response structure scoring, and latency benchmark for SIA_Chat.</p>
          </div>
          <div className="inline-controls">
            <button
              type="button"
              className="btn btn-muted btn-icon"
              onClick={() => runEvaluation({ useModel: false })}
              disabled={runningOffline || runningModel}
            >
              <HiOutlinePlay />
              {runningOffline ? "Running Offline..." : "Run Offline Eval"}
            </button>
            <button
              type="button"
              className="btn btn-primary btn-icon"
              onClick={() => runEvaluation({ useModel: true })}
              disabled={runningOffline || runningModel}
            >
              <HiOutlineCpuChip />
              {runningModel ? "Running Model..." : "Run Model Eval"}
            </button>
          </div>
        </section>

        {loading ? (
          <LoadingSpinner label="Running chatbot evaluation..." />
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
      </PageTransition>
    </AdminLayout>
  );
}
