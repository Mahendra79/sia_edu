import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { HiOutlineCheckBadge } from "react-icons/hi2";

import LoadingSpinner from "../components/LoadingSpinner";
import PageTransition from "../components/PageTransition";
import MainLayout from "../layouts/MainLayout";
import { paymentService } from "../services/paymentService";

export default function Success() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    const confirm = async () => {
      if (!sessionId) {
        setStatus("error");
        return;
      }
      try {
        await paymentService.confirmPayment({ session_id: sessionId });
        setStatus("success");
      } catch {
        setStatus("error");
      }
    };
    confirm();
  }, [sessionId]);

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
