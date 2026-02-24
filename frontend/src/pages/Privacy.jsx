import MainLayout from "../layouts/MainLayout";

export default function Privacy() {
  return (
    <MainLayout>
      <section className="panel-card legal-page">
        <header className="legal-page-header">
          <h1>Privacy Policy</h1>
          <p className="legal-updated">Last updated: February 24, 2026</p>
          <p>
            This Privacy Policy explains how SIA Software Innovations Private Limited collects, uses, and protects
            personal information when you use the platform.
          </p>
        </header>

        <section className="legal-section">
          <h2>1. Information We Collect</h2>
          <ul className="legal-list">
            <li>Account details, such as name, username, email address, and phone number.</li>
            <li>Course and learning activity data, including enrollments, progress, and completion status.</li>
            <li>Technical and usage information for security monitoring, troubleshooting, and service improvement.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>2. How We Use Information</h2>
          <ul className="legal-list">
            <li>To create and manage user accounts.</li>
            <li>To deliver purchased courses and related services.</li>
            <li>To process billing and maintain transaction records.</li>
            <li>To prevent abuse, unauthorized access, and fraud.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>3. Data Sharing</h2>
          <p>
            We share data only when required to operate the platform, including payment processors, infrastructure
            providers, and legal or regulatory obligations.
          </p>
        </section>

        <section className="legal-section">
          <h2>4. Data Security and Retention</h2>
          <p>
            We use reasonable administrative and technical safeguards to protect user information. Data is retained only
            for operational, legal, and compliance requirements.
          </p>
        </section>

        <section className="legal-section">
          <h2>5. Your Rights</h2>
          <p>
            You may request access, correction, or deletion of your account information, subject to applicable law and
            platform obligations.
          </p>
        </section>

        <section className="legal-section">
          <h2>6. Contact</h2>
          <p>For privacy-related requests, contact us at:</p>
          <p>
            General Information:
            {" "}
            <a className="inline-link" href="mailto:info@siasoftwareinnovations.com">
              info@siasoftwareinnovations.com
            </a>
          </p>
          <p>
            Product &amp; Collaboration:
            {" "}
            <a className="inline-link" href="mailto:contact@siasoftwareinnovations.com">
              contact@siasoftwareinnovations.com
            </a>
          </p>
        </section>
      </section>
    </MainLayout>
  );
}
