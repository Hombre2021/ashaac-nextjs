import sharedStyles from "./SharedContentSection.module.css";
import styles from "./PrivacyPolicyContent.module.css";

export default function PrivacyPolicyContent() {
  return (
    <section className={sharedStyles.sectionBase}>
      <div className={`${sharedStyles.contentBase} ${styles.privacyText}`}>
        <h1 style={{ textAlign: "center", fontSize: 32, marginBottom: 32 }}>Privacy Policy</h1>
        <p><strong>All Solutions Heating and Air Conditioning LLC</strong><br />
          4434 W 8790 S, West Jordan, Utah 84088<br />
          <strong>Last updated: January 2026</strong></p>
        <h2>1. Introduction</h2>
        <p>All Solutions Heating and Air Conditioning LLC (“we,” “our,” or “us”) respects your privacy and is committed to protecting the personal information you share with us. This Privacy Policy explains how we collect, use, store, and safeguard your information when you visit our website, request service, or communicate with our team.<br />
          By using our website or providing information to us, you agree to the practices described in this policy.</p>
        <h2>2. Information We Collect</h2>
        <h3>A. Personal Information</h3>
        <ul>
          <li>Name</li>
          <li>Email address</li>
          <li>Phone number</li>
          <li>Service address</li>
          <li>Billing address</li>
          <li>Preferred contact method</li>
        </ul>
        <h3>B. Service‑Related Information</h3>
        <ul>
          <li>HVAC system details</li>
          <li>Photos you upload for service requests</li>
          <li>Appointment history</li>
          <li>Quotes, invoices, and service notes</li>
        </ul>
        <h3>C. Financial Information</h3>
        <p>If you make a payment, we may collect:</p>
        <ul>
          <li>Payment method (credit/debit card, ACH, digital wallet, etc.)</li>
          <li>Transaction amount and payment history</li>
        </ul>
        <p>We do not store full credit card or bank account numbers on our servers.<br />
          All payments are processed securely through trusted third‑party providers.</p>
        <h3>D. Website & Technical Data</h3>
        <ul>
          <li>IP address</li>
          <li>Browser type</li>
          <li>Device information</li>
          <li>Pages visited</li>
          <li>Cookies and tracking data</li>
        </ul>
        <h2>3. How We Use Your Information</h2>
        <ul>
          <li>Schedule HVAC service appointments</li>
          <li>Provide installation, repair, and maintenance services</li>
          <li>Process payments and send invoices</li>
          <li>Communicate about service updates or reminders</li>
          <li>Respond to questions or customer support requests</li>
          <li>Improve website performance and user experience</li>
          <li>Maintain business, tax, and service records</li>
          <li>Prevent fraud or unauthorized activity</li>
        </ul>
        <p>We do not sell or rent your personal information.</p>
        <h2>4. Payment Processing</h2>
        <p>We use secure third‑party payment processors to handle financial transactions. These may include:</p>
        <ul>
          <li>Credit/debit card processors</li>
          <li>ACH or bank transfer processors</li>
          <li>Digital payment platforms</li>
        </ul>
        <p>These providers use encrypted systems to protect your financial information.<br />
          We do not have access to your full financial credentials.</p>
        <h2>5. How We Protect Your Information</h2>
        <ul>
          <li>Encrypted payment processing</li>
          <li>Secure servers and firewalls</li>
          <li>Limited access to sensitive data</li>
          <li>Regular monitoring for suspicious activity</li>
        </ul>
        <p>While no system is completely secure, we take appropriate measures to protect your information.</p>
        <h2>6. Sharing of Information</h2>
        <p>We may share information only when necessary:</p>
        <ul>
          <li>With technicians or staff to provide service</li>
          <li>With payment processors to complete transactions</li>
          <li>With service providers who support our website or business operations</li>
          <li>When required by law, regulation, or legal process</li>
        </ul>
        <p>We do not share your information with third parties for marketing purposes.</p>
        <h2>7. Cookies & Tracking Technologies</h2>
        <p>Our website may use cookies and similar technologies to:</p>
        <ul>
          <li>Improve website functionality</li>
          <li>Analyze traffic and usage patterns</li>
          <li>Personalize your experience</li>
        </ul>
        <p>You may disable cookies in your browser settings, but some features may not function properly.</p>
        <h2>8. Data Retention</h2>
        <p>We retain personal and financial records only as long as necessary for:</p>
        <ul>
          <li>Providing services</li>
          <li>Business operations</li>
          <li>Tax and accounting requirements</li>
          <li>Legal compliance</li>
        </ul>
        <p>After this period, data is securely deleted or anonymized.</p>
        <h2>9. Your Rights & Choices</h2>
        <p>You may:</p>
        <ul>
          <li>Request a copy of your personal information</li>
          <li>Ask us to update or correct your information</li>
          <li>Request deletion of certain data (subject to legal requirements)</li>
          <li>Opt out of marketing communications</li>
        </ul>
        <p>To make a request, contact us using the information below.</p>
        <h2>10. Children’s Privacy</h2>
        <p>Our services are not directed to children under 13.<br />
          We do not knowingly collect information from children.</p>
        <h2>11. Links to Third‑Party Websites</h2>
        <p>Our website may contain links to external sites.<br />
          We are not responsible for the privacy practices of those websites.</p>
        <h2>12. Changes to This Policy</h2>
        <p>We may update this Privacy Policy from time to time.<br />
          The “Last updated” date at the top will reflect the most recent revision.</p>
        <h2>13. Contact Us</h2>
        <p>If you have questions about this Privacy Policy or how your information is handled, contact us:<br />
          <strong>All Solutions Heating and Air Conditioning LLC</strong><br />
          4434 W 8790 S<br />
          West Jordan, Utah 84088<br />
          Email: <a href="mailto:contact@ashaac.com">contact@ashaac.com</a><br />
          Phone: <a href="tel:8017553040">801‑755‑3040</a> or <a href="tel:8015127103">801‑512‑7103</a></p>
      </div>
    </section>
  );
}
