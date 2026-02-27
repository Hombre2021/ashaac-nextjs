import type { Metadata } from "next";
import HomepageHeader from "@/components/HomepageHeader";
import AboutHero from "@/components/AboutHero";
import HomepageFooter from "@/components/HomepageFooter";
import DIYHelpCenterContent from "@/components/DIYHelpCenterContent";
import { absoluteUrl, siteName } from "@/lib/seo";

export const metadata: Metadata = {
  title: "DIY Help Center",
  description:
    "Explore DIY HVAC tips, submit troubleshooting questions online, and request live help support.",
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
        description:
          "DIY HVAC troubleshooting resources, online Q&A submission, and live support request options.",
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