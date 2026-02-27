import type { Metadata } from "next";
import HomepageHeader from "../../components/HomepageHeader";
import ContactHero from "../../components/ContactHero";
import ContactContent from "../../components/ContactContent";
import HomepageFooter from "../../components/HomepageFooter";
import {
  absoluteUrl,
  businessEmail,
  primaryPhone,
  secondaryPhone,
  siteName,
} from "@/lib/seo";

export const metadata: Metadata = {
  title: "Contact HVAC Experts in West Jordan",
  description:
    "Contact All Solutions Heating and Air Conditioning for HVAC installation, repairs, and free estimates in West Jordan and Salt Lake County.",
  keywords: [
    "HVAC contact West Jordan",
    "schedule HVAC estimate",
    "HVAC company Salt Lake County",
    "call HVAC technician West Jordan",
  ],
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
  const contactPageSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "@id": absoluteUrl("/contact#webpage"),
    url: absoluteUrl("/contact"),
    name: `Contact ${siteName}`,
    description:
      "Contact All Solutions Heating and Air Conditioning for HVAC installation, repairs, and free estimates in West Jordan and Salt Lake County.",
    mainEntity: {
      "@id": absoluteUrl("/#business"),
    },
    about: {
      "@id": absoluteUrl("/#business"),
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: primaryPhone,
        email: businessEmail,
        contactType: "customer service",
      },
      {
        "@type": "ContactPoint",
        telephone: secondaryPhone,
        email: businessEmail,
        contactType: "customer service",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactPageSchema) }}
      />
      <HomepageHeader />
      <ContactHero />
      <ContactContent />
      <HomepageFooter />
    </>
  );
}
