import type { Metadata } from "next";
import HomepageHeader from "@/components/HomepageHeader";
import AboutHero from "@/components/AboutHero";
import HomepageFooter from "@/components/HomepageFooter";
import DIYHelpCenterContent from "@/components/DIYHelpCenterContent";
import { absoluteUrl, siteName } from "@/lib/seo";

export const metadata: Metadata = {
  title: "DIY Help Center",
  description:
    "Access HVAC advice videos, ask online questions, and request live help from All Solutions Heating and Air Conditioning.",
  keywords: [
    "DIY HVAC help",
    "HVAC troubleshooting videos",
    "ask HVAC question online",
    "live HVAC help",
  ],
  alternates: {
    canonical: "/diy-help-center",
  },
};

export default function DIYHelpCenterPage() {
  const diyHelpSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": absoluteUrl("/diy-help-center#webpage"),
        url: absoluteUrl("/diy-help-center"),
        name: `DIY Help Center | ${siteName}`,
        about: {
          "@id": absoluteUrl("/#business"),
        },
      },
      {
        "@type": "FAQPage",
        "@id": absoluteUrl("/diy-help-center#faqs"),
        mainEntity: [
          {
            "@type": "Question",
            name: "Can I ask HVAC questions online?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. Use the Ask an Online Question section in the DIY Help Center and choose your preferred reply channel.",
            },
          },
          {
            "@type": "Question",
            name: "Can I request live video help?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. Submit the Request Live Help form with your preferred date and time and our team will follow up.",
            },
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(diyHelpSchema) }}
      />
      <HomepageHeader />
      <AboutHero title="DIY Help Center" />
      <DIYHelpCenterContent />
      <HomepageFooter />
    </>
  );
}