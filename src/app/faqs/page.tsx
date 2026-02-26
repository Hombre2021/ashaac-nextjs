import type { Metadata } from "next";
import HomepageHeader from "@/components/HomepageHeader";
import AboutHero from "@/components/AboutHero";
import HomepageFooter from "@/components/HomepageFooter";

import ContentContainer from "@/components/ContentContainer";

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What areas do you serve?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We proudly serve West Jordan, Salt Lake County, and surrounding Utah communities.",
      },
    },
    {
      "@type": "Question",
      name: "What HVAC services do you provide?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We provide HVAC installation, furnace and AC replacement, mini-split and heat pump installation, diagnostics, repairs, and maintenance for residential and commercial systems.",
      },
    },
    {
      "@type": "Question",
      name: "Do you offer free estimates?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. We provide free estimates for new installations and replacements.",
      },
    },
    {
      "@type": "Question",
      name: "Do you offer financing?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. We offer financing options to help make HVAC installation more affordable.",
      },
    },
    {
      "@type": "Question",
      name: "How can I contact you?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Call or text 801-755-3040 or 801-512-7103, email contact@ashaac.com, or request service in West Jordan and Salt Lake County, Utah.",
      },
    },
  ],
};

export const metadata: Metadata = {
  title: "HVAC FAQs",
  description:
    "Frequently asked questions about HVAC installation, repairs, maintenance, warranties, and service areas in West Jordan and Salt Lake County.",
  alternates: {
    canonical: "/faqs",
  },
};

export default function FaqsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <HomepageHeader />
      <AboutHero title="FAQ’s" />
      <ContentContainer title="FAQ’s">
        <h1 style={{ textAlign: "center", fontSize: 32, marginBottom: 32 }}>Frequently Asked Questions (FAQ)</h1>
        <p><strong>All Solutions Heating and Air Conditioning LLC</strong></p>
        <h2>1. What areas do you serve?</h2>
        <p>We proudly serve West Jordan, Salt Lake County, and surrounding Utah communities. If you’re unsure whether we service your area, feel free to call or text us at 801‑755‑3040 or 801‑512‑7103.</p>
        <h2>2. What HVAC services do you provide?</h2>
        <p>We specialize in:</p>
        <ul>
          <li>New HVAC system installations</li>
          <li>Furnace and AC replacements</li>
          <li>Mini‑split and heat pump installations</li>
          <li>Through‑the‑wall and through‑the‑window units</li>
          <li>Repairs, diagnostics, and maintenance</li>
          <li>Residential and commercial HVAC services</li>
        </ul>
        <h2>3. Do you offer free estimates?</h2>
        <p>Yes. We provide free estimates for new installations and replacements.<br />You can request one anytime through our website or by calling/texting us.</p>
        <h2>4. Do you offer financing?</h2>
        <p>Yes. We offer financing options to help make your HVAC installation more affordable.<br />You can apply directly through our website or ask us for assistance.</p>
        <h2>5. Are you licensed and insured?</h2>
        <p>Yes. All Solutions Heating and Air Conditioning LLC is fully licensed and insured in the state of Utah.<br />Your safety and peace of mind are our priority.</p>
        <h2>6. What brands do you install?</h2>
        <p>We install all major HVAC brands, including furnaces, AC units, heat pumps, and mini‑split systems.<br />If you have a preferred brand, we can source and install it.</p>
        <h2>7. How quickly can you schedule an installation?</h2>
        <p>Most installations can be scheduled within 24–72 hours, depending on equipment availability and your location.<br />We always aim to accommodate your schedule.</p>
        <h2>8. Do you offer emergency service?</h2>
        <p>Yes. We provide urgent and same‑day service when possible.<br />Call or text us for immediate assistance.</p>
        <h2>9. Do you provide warranties?</h2>
        <p>Yes.<br />- Labor warranty: 1 year on workmanship<br />- Manufacturer warranty: varies by brand and equipment<br />We’ll explain all warranty details before installation.</p>
        <h2>10. How do I know if I need a replacement instead of a repair?</h2>
        <p>You may need a replacement if:</p>
        <ul>
          <li>Your system is over 12–15 years old</li>
          <li>Repairs are becoming frequent or expensive</li>
          <li>Your home has uneven heating or cooling</li>
          <li>Energy bills are rising</li>
          <li>The system uses outdated refrigerant</li>
        </ul>
        <p>We can inspect your system and give you honest recommendations.</p>
        <h2>11. Do you work on rental properties or commercial buildings?</h2>
        <p>Yes. We service:</p>
        <ul>
          <li>Homes</li>
          <li>Rental properties</li>
          <li>Vacation homes</li>
          <li>Offices</li>
          <li>Restaurants</li>
          <li>Retail spaces</li>
          <li>Small businesses</li>
        </ul>
        <h2>12. What payment methods do you accept?</h2>
        <p>We accept:</p>
        <ul>
          <li>Credit and debit cards</li>
          <li>ACH/bank payments</li>
          <li>Digital payment platforms</li>
          <li>Financing options</li>
        </ul>
        <p>Payment is due upon completion unless otherwise arranged.</p>
        <h2>13. How can I contact you?</h2>
        <p>You can reach us anytime:<br />- Phone: 801‑755‑3040 or 801‑512‑7103<br />- Email: contact@ashaac.com<br />- Service Area: West Jordan and Salt Lake County, Utah</p>
      </ContentContainer>
      <HomepageFooter />
    </>
  );
}
