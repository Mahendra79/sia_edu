import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { HiOutlineCheckBadge } from "react-icons/hi2";

import LoadingSpinner from "../components/LoadingSpinner";
import PageTransition from "../components/PageTransition";
import { useToast } from "../context/ToastContext";
import MainLayout from "../layouts/MainLayout";
import { paymentService } from "../services/paymentService";

export default function Success() {
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();
  const [status, setStatus] = useState("loading");
  const [downloading, setDownloading] = useState(false);
  const transactionId = searchParams.get("transaction_id");
  const alreadyConfirmed = searchParams.get("confirmed") === "1";

  useEffect(() => {
    const confirm = async () => {
      if (alreadyConfirmed) {
        setStatus("success");
        return;
      }
      if (!transactionId) {
        setStatus("success");
        return;
      }
      try {
        await paymentService.confirmPayment({ transaction_id: Number(transactionId) });
        setStatus("success");
      } catch {
        setStatus("error");
      }
    };
    confirm();
  }, [transactionId, alreadyConfirmed]);

  const handleDownloadInvoice = async () => {
    if (!transactionId) return;
    setDownloading(true);
    try {
      const response = await paymentService.getInvoice(Number(transactionId), { inline: false });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `invoice_${transactionId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
    } catch {
      addToast({ type: "error", message: "Unable to download invoice." });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <MainLayout>
      <PageTransition>
        <section className="result-page">
          {status === "loading" && <LoadingSpinner label="Confirming payment..." />}
          {status === "success" && (
            <>
              <span className="result-icon success">
                <HiOutlineCheckBadge />
              </span>
              <h1>Payment Successful</h1>
              <p>Your enrollment has been added.</p>
              {transactionId ? (
                <button type="button" className="btn btn-muted" onClick={handleDownloadInvoice} disabled={downloading}>
                  {downloading ? "Preparing Invoice..." : "Download Invoice"}
                </button>
              ) : null}
              <Link to={transactionId ? `/user/payment-history?invoice=${transactionId}` : "/user/payment-history"} className="btn btn-muted">
                Open Payment History
              </Link>
              <Link to="/user/my-courses" className="btn btn-primary">
                Go to My Courses
              </Link>
            </>
          )}
          {status === "error" && (
            <>
              <h1>Unable to Verify Payment</h1>
              <p>
                If amount was charged, contact General Information at{" "}
                <a className="inline-link" href="mailto:info@siasoftwareinnovations.com">
                  info@siasoftwareinnovations.com
                </a>{" "}
                or Product &amp; Collaboration at{" "}
                <a className="inline-link" href="mailto:contact@siasoftwareinnovations.com">
                  contact@siasoftwareinnovations.com
                </a>
                .
              </p>
              <Link to="/user/payment-history" className="btn btn-muted">
                Open Payment History
              </Link>
            </>
          )}
        </section>
      </PageTransition>
    </MainLayout>
  );
}
