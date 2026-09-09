import type { Metadata } from "next";
import Link from "next/link";
import HomepageHeader from "@/components/HomepageHeader";
import AboutHero from "@/components/AboutHero";
import HomepageFooter from "@/components/HomepageFooter";
import ContentContainer from "@/components/ContentContainer";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://ashaac.com").replace(/\/$/, "");

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What areas do you serve?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We proudly serve West Jordan, South Jordan, Riverton, Herriman, Sandy, Draper, Taylorsville, Murray, Salt Lake City, and surrounding Salt Lake County communities.",
      },
    },
    {
      "@type": "Question",
      name: "What HVAC services do you provide?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We provide complete HVAC services including new HVAC system installation, furnace and AC replacement, mini-split and heat pump installation, through-the-wall/window units, diagnostics, repairs, and seasonal maintenance.",
      },
    },
    {
      "@type": "Question",
      name: "Do you offer free estimates?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. We provide free estimates for new HVAC installations and equipment replacements.",
      },
    },
    {
      "@type": "Question",
      name: "Do you offer financing?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. We offer financing options including 0% interest terms (3, 6, 12, or 24 months based on credit eligibility) and a $500 discount for cash or ACH payments.",
      },
    },
    {
      "@type": "Question",
      name: "Are you licensed and insured?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. All Solutions Heating and Air Conditioning LLC is fully licensed and insured in the state of Utah.",
      },
    },
    {
      "@type": "Question",
      name: "What brands do you install?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We install all major HVAC brands, including furnaces, AC units, heat pumps, and ductless mini-split systems. If you have a preferred brand, we source and install it.",
      },
    },
    {
      "@type": "Question",
      name: "How quickly can you schedule an installation?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Most installations can be scheduled within 24–72 hours, depending on equipment availability and your location.",
      },
    },
    {
      "@type": "Question",
      name: "Do you offer emergency HVAC repair?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. We provide urgent and same-day HVAC service when possible across West Jordan and Salt Lake County.",
      },
    },
    {
      "@type": "Question",
      name: "Do you provide warranties?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. We provide a 1-year labor warranty on our workmanship in addition to manufacturer equipment warranties.",
      },
    },
    {
      "@type": "Question",
      name: "How do I know if I need a replacement instead of a repair?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You may need a replacement if your system is over 12–15 years old, repairs are becoming frequent or expensive, your home has uneven heating/cooling, energy bills are rising, or the system uses outdated refrigerant.",
      },
    },
    {
      "@type": "Question",
      name: "Do you work on rental properties or commercial buildings?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. We service single-family homes, rental properties, vacation rentals, offices, restaurants, retail spaces, and small businesses.",
      },
    },
    {
      "@type": "Question",
      name: "What payment methods do you accept?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We accept credit and debit cards, ACH/bank payments, digital payment platforms, and approved financing plans.",
      },
    },
    {
      "@type": "Question",
      name: "How can I contact All Solutions HVAC?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Call or text 801-755-3040, email ashaacutah@gmail.com, or schedule online. We are based in West Jordan, UT 84088 and provide 100% mobile on-site service across Salt Lake County.",
      },
    },
  ],
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
    { "@type": "ListItem", position: 2, name: "FAQs", item: `${siteUrl}/faqs` },
  ],
};

export const metadata: Metadata = {
  title: "HVAC FAQs: AC, Furnace & Heat Pump Questions | West Jordan, UT",
  description:
    "Get answers to frequently asked questions about HVAC installation, furnace & AC repairs, 0% financing, warranties, and emergency service in West Jordan and Salt Lake County.",
  keywords: [
    "HVAC FAQs Utah",
    "HVAC FAQ West Jordan",
    "Salt Lake County HVAC questions",
    "furnace and AC FAQ",
    "heat pump financing FAQ Utah",
  ],
  alternates: {
    canonical: "/faqs",
  },
  openGraph: {
    type: "website",
    url: `${siteUrl}/faqs`,
    title: "HVAC FAQs: AC, Furnace & Heat Pump Questions | West Jordan, UT",
    description: "Get answers to frequently asked questions about HVAC installation, repairs, financing, warranties, and emergency service in West Jordan and Salt Lake County.",
  },
};

export default function FaqsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <HomepageHeader />
      <AboutHero title="HVAC Frequently Asked Questions" />
      <ContentContainer title="Frequently Asked Questions">
        <h2 style={{ textAlign: "center", fontSize: 32, marginBottom: 20 }}>All Solutions Heating and Air Conditioning</h2>
        <p style={{ textAlign: "center", marginBottom: 32, color: "#4b5563" }}>
          Looking for city-specific service? Review our <Link href="/service-areas">HVAC service areas</Link>, <Link href="/emergency-hvac-repair-west-jordan">emergency repair in West Jordan</Link>, or <Link href="/services/south-jordan/hvac-maintenance">HVAC maintenance in South Jordan</Link>.
        </p>
        <h2>1. What areas do you serve?</h2>
        <p>We proudly serve West Jordan, South Jordan, Riverton, Herriman, Sandy, Draper, Taylorsville, Murray, Salt Lake City, and surrounding Salt Lake County communities. If you&apos;re unsure whether we service your area, feel free to call or text us at 801-755-3040.</p>
        
        <h2>2. What HVAC services do you provide?</h2>
        <p>We specialize in:</p>
        <ul>
          <li>New HVAC system installations &amp; complete replacements</li>
          <li>Furnace and AC repairs, replacements &amp; tune-ups</li>
          <li>Mini-split and heat pump installations</li>
          <li>Through-the-wall and through-the-window units</li>
          <li>Diagnostics, emergency repairs, and seasonal maintenance</li>
          <li>Residential and light commercial HVAC solutions</li>
        </ul>

        <h2>3. Do you offer free estimates?</h2>
        <p>Yes. We provide free estimates for new installations and replacements. You can request one anytime through our website or by calling/texting us at 801-755-3040.</p>

        <h2>4. Do you offer financing?</h2>
        <p>Yes. We offer financing options (including 0% interest promotional terms) to help make your HVAC installation affordable. If you pay cash or ACH, you also receive a $500 discount.</p>

        <h2>5. Are you licensed and insured?</h2>
        <p>Yes. All Solutions Heating and Air Conditioning LLC is fully licensed and insured in the state of Utah for your complete safety and peace of mind.</p>

        <h2>6. What brands do you install?</h2>
        <p>We install all major HVAC brands, including furnaces, AC units, heat pumps, and mini-split systems. If you have a preferred brand, we can source and install it with manufacturer warranty protection.</p>

        <h2>7. How quickly can you schedule an installation?</h2>
        <p>Most installations can be scheduled within 24–72 hours, depending on equipment availability and your location. We always aim to accommodate your schedule promptly.</p>

        <h2>8. Do you offer emergency service?</h2>
        <p>Yes. We provide urgent and same-day service across West Jordan and Salt Lake County. Call or text us immediately for emergency no-heat or no-cooling issues.</p>

        <h2>9. Do you provide warranties?</h2>
        <p>Yes. We provide a 1-year labor warranty on our workmanship, in addition to full manufacturer warranties on equipment and parts.</p>

        <h2>10. How do I know if I need a replacement instead of a repair?</h2>
        <p>You may need a replacement if:</p>
        <ul>
          <li>Your system is over 12–15 years old</li>
          <li>Repairs are becoming frequent or expensive</li>
          <li>Your home has uneven heating or cooling</li>
          <li>Energy bills are rising unexpectedly</li>
          <li>The system uses outdated refrigerant (R-22)</li>
        </ul>
        <p>We can inspect your system and give you an honest, no-pressure recommendation.</p>

        <h2>11. Do you work on rental properties or commercial buildings?</h2>
        <p>Yes. We service single-family homes, rental properties, vacation homes, offices, restaurants, retail spaces, and small businesses.</p>

        <h2>12. What payment methods do you accept?</h2>
        <p>We accept credit and debit cards, ACH/electronic check payments, digital payment platforms, and approved financing plans.</p>

        <h2>13. How can I contact you?</h2>
        <p>You can reach us anytime:<br />
        &bull; <strong>Phone:</strong> <a href="tel:801-755-3040">801-755-3040</a><br />
        &bull; <strong>Email:</strong> <a href="mailto:ashaacutah@gmail.com">ashaacutah@gmail.com</a><br />
        &bull; <strong>Location:</strong> Based in West Jordan, UT 84088 (Mobile dispatch serving all of Salt Lake County)
        </p>
      </ContentContainer>
      <HomepageFooter />
    </>
  );
}
