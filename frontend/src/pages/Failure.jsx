import { Link } from "react-router-dom";
import { HiOutlineExclamationTriangle } from "react-icons/hi2";

import PageTransition from "../components/PageTransition";
import MainLayout from "../layouts/MainLayout";

export default function Failure() {
  return (
    <MainLayout>
      <PageTransition>
        <section className="result-page">
          <span className="result-icon warning">
            <HiOutlineExclamationTriangle />
          </span>
          <h1>Payment Failed or Cancelled</h1>
          <p>Your transaction was not completed.</p>
          <Link to="/" className="btn btn-muted">
            Back to Home
          </Link>
        </section>
      </PageTransition>
    </MainLayout>
  );
}
