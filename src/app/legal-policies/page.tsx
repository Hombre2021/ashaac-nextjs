import type { Metadata } from "next";
import HomepageHeader from "@/components/HomepageHeader";
import AboutHero from "@/components/AboutHero";
import HomepageFooter from "@/components/HomepageFooter";
import ContentContainer from "@/components/ContentContainer";

export const metadata: Metadata = {
  title: "Legal Policies and Customer Rights",
  description:
    "Review service agreements, maintenance terms, financing disclosure, website disclaimer, and customer rights from All Solutions Heating and Air Conditioning.",
  alternates: {
    canonical: "/legal-policies",
  },
};

export default function LegalPoliciesPage() {
  return (
    <>
      <HomepageHeader />
      <AboutHero title="Legal Policies & Customer Rights" />
      <ContentContainer title="Legal Policies & Customer Rights">
        <p><strong>Last updated: January 2026</strong></p>
        <h2>1. Service Agreement (Installations)</h2>
        <h3>Scope of Work</h3>
        <p>All Solutions Heating and Air Conditioning LLC (“we,” “our,” or “us”) agrees to provide HVAC installation services as described in your written estimate or invoice. Work includes delivery, installation, testing, and verification of proper system operation.</p>
        <h3>Customer Responsibilities</h3>
        <ul>
          <li>Provide accurate information about the property and existing equipment</li>
          <li>Ensure safe and unobstructed access to the installation area</li>
          <li>Secure pets and remove hazards</li>
          <li>Follow post‑installation care instructions</li>
        </ul>
        <h3>Changes to Work</h3>
        <p>If additional issues are discovered during installation (electrical, structural, venting, refrigerant lines, etc.), we will notify you before performing additional work. Additional charges may apply.</p>
        <h3>Permits & Code Compliance</h3>
        <p>Where required, permits may be obtained by the customer or by us depending on local regulations. All work is performed to industry standards and applicable codes.</p>
        <h3>Completion & Acceptance</h3>
        <p>Once installation is complete, the customer agrees to inspect the work. Payment is due upon completion unless otherwise arranged.</p>
        <h2>2. Maintenance Plan Terms</h2>
        <h3>Overview</h3>
        <p>Our maintenance plans are designed to keep your HVAC system running efficiently and extend equipment life.</p>
        <h3>Included Services</h3>
        <ul>
          <li>Seasonal tune‑ups</li>
          <li>Filter checks or replacements</li>
          <li>System cleaning</li>
          <li>Safety inspections</li>
          <li>Performance testing</li>
        </ul>
        <h3>Customer Responsibilities</h3>
        <ul>
          <li>Provide access to equipment</li>
          <li>Maintain a safe work environment</li>
          <li>Replace filters between visits (unless included in plan)</li>
        </ul>
        <h3>Limitations</h3>
        <p>Maintenance plans do not cover:</p>
        <ul>
          <li>Repairs</li>
          <li>Replacement parts</li>
          <li>Emergency service</li>
          <li>Damage caused by neglect, misuse, or external factors</li>
        </ul>
        <h3>Cancellation</h3>
        <p>Plans may be canceled at any time. Refunds for unused months may be prorated at our discretion.</p>
        <h2>3. Financing Disclosure</h2>
        <h3>Financing Availability</h3>
        <p>Financing options may be offered through third‑party lenders. Approval is subject to credit review and lender terms.</p>
        <h3>Third‑Party Lenders</h3>
        <p>We do not control lender decisions, interest rates, or approval timelines. All financing agreements are strictly between the customer and the lender.</p>
        <h3>Estimates & Pricing</h3>
        <p>Financing does not change the total cost of equipment or installation unless the lender applies fees or interest.</p>
        <h3>Customer Acknowledgment</h3>
        <ul>
          <li>You are entering a separate agreement with the lender</li>
          <li>We are not responsible for lender decisions or terms</li>
          <li>Payments must be made directly to the lender</li>
        </ul>
        <h2>4. Website Disclaimer</h2>
        <h3>General Information Only</h3>
        <p>The content on our website is provided for general informational purposes. It should not be considered professional advice or a substitute for an in‑person inspection.</p>
        <h3>Accuracy of Information</h3>
        <p>We strive to keep information accurate and up to date, but we make no guarantees regarding completeness, accuracy, or reliability.</p>
        <h3>External Links</h3>
        <p>Our website may contain links to third‑party sites. We are not responsible for their content, policies, or practices.</p>
        <h3>No Warranty</h3>
        <p>All website content is provided “as is” without warranties of any kind.</p>
        <h2>5. Customer Bill of Rights</h2>
        <p>At All Solutions Heating and Air Conditioning LLC, every customer has the right to:</p>
        <ol>
          <li><strong>Honest and Transparent Pricing</strong><br />Clear estimates with no hidden fees.</li>
          <li><strong>Professional and Respectful Service</strong><br />Technicians who are trained, courteous, and respectful of your home.</li>
          <li><strong>Quality Workmanship</strong><br />Installations and repairs performed to industry standards.</li>
          <li><strong>Safety and Compliance</strong><br />Work that meets local codes and manufacturer requirements.</li>
          <li><strong>Clear Communication</strong><br />Updates, explanations, and answers to your questions at every step.</li>
          <li><strong>Fair Warranty Coverage</strong><br />Access to manufacturer warranties and our workmanship guarantee.</li>
          <li><strong>Privacy and Data Protection</strong><br />Your personal information is handled securely and never sold.</li>
          <li><strong>The Right to Ask Questions</strong><br />We will always explain your options and help you make informed decisions.</li>
        </ol>
        <h3>Contact Information</h3>
        <p>All Solutions Heating and Air Conditioning LLC<br />Service Area: West Jordan and Salt Lake County, Utah<br />Email: <a href="mailto:contact@ashaac.com">contact@ashaac.com</a><br />Phone: <a href="tel:8017553040">801‑755‑3040</a> or <a href="tel:8015127103">801‑512‑7103</a></p>
      </ContentContainer>
      <HomepageFooter />
    </>
  );
}
