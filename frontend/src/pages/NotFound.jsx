import { Link } from "react-router-dom";
import { HiOutlineQuestionMarkCircle } from "react-icons/hi2";

import MainLayout from "../layouts/MainLayout";

export default function NotFound() {
  return (
    <MainLayout>
      <section className="not-found">
        <span className="result-icon warning">
          <HiOutlineQuestionMarkCircle />
        </span>
        <h1>404</h1>
        <p>Page not found.</p>
        <Link className="btn btn-primary" to="/">
          Back Home
        </Link>
      </section>
    </MainLayout>
  );
}
