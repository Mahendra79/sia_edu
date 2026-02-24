import MainLayout from "../layouts/MainLayout";

export default function Terms() {
  return (
    <MainLayout>
      <section className="panel-card legal-page">
        <header className="legal-page-header">
          <h1>Terms of Service</h1>
          <p className="legal-updated">Last updated: February 24, 2026</p>
          <p>
            These Terms govern your use of SIA Software Innovations Private Limited. By accessing or using the
            platform, you agree to these Terms and applicable policies.
          </p>
        </header>

        <section className="legal-section">
          <h2>1. Account Responsibility</h2>
          <ul className="legal-list">
            <li>You must provide accurate and complete registration details.</li>
            <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
            <li>You are responsible for activity performed through your account.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>2. Acceptable Use</h2>
          <ul className="legal-list">
            <li>Use the platform only for lawful educational and professional learning purposes.</li>
            <li>Do not attempt unauthorized access, reverse engineering, or abuse of platform services.</li>
            <li>Do not post or transmit harmful, misleading, or infringing content.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>3. Payments and Access</h2>
          <p>
            Paid course access and related entitlements are governed by each offering. Billing operations are handled
            through supported payment providers.
          </p>
        </section>

        <section className="legal-section">
          <h2>4. Intellectual Property</h2>
          <p>
            Platform content, course materials, and branding are protected by applicable intellectual property laws.
            Unauthorized reproduction or redistribution is prohibited.
          </p>
        </section>

        <section className="legal-section">
          <h2>5. Enforcement and Suspension</h2>
          <p>
            We may suspend or terminate access where there is policy violation, abuse, legal risk, or security concern.
          </p>
        </section>

        <section className="legal-section">
          <h2>6. Changes to Terms</h2>
          <p>
            We may update these Terms periodically. Continued use of the platform after updates constitutes acceptance
            of the revised Terms.
          </p>
        </section>

        <section className="legal-section">
          <h2>7. Contact</h2>
          <p>For legal or account-related queries, contact us at:</p>
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
