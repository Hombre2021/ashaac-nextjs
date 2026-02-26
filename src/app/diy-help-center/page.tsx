import type { Metadata } from "next";
import Link from "next/link";
import HomepageHeader from "@/components/HomepageHeader";
import AboutHero from "@/components/AboutHero";
import HomepageFooter from "@/components/HomepageFooter";
import { absoluteUrl, siteName } from "@/lib/seo";

export const metadata: Metadata = {
  title: "DIY Help Center",
  description:
    "DIY Help Center is currently being updated. New HVAC videos and guided troubleshooting content are coming soon.",
  keywords: [
    "DIY HVAC help",
    "HVAC troubleshooting videos",
    "ask HVAC question online",
    "live HVAC help",
  ],
  alternates: {
    canonical: "/diy-help-center",
  },
  robots: {
    index: false,
    follow: true,
    googleBot: {
      index: false,
      follow: true,
    },
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
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px 56px", textAlign: "center" }}>
        <h1 style={{ fontSize: 34, marginBottom: 14 }}>Under Construction</h1>
        <p style={{ fontSize: 18, lineHeight: 1.7, marginBottom: 18 }}>
          We are preparing a full DIY video library and step-by-step troubleshooting resources.
          This page will relaunch soon with practical HVAC guidance.
        </p>
        <p style={{ fontSize: 18, lineHeight: 1.7, marginBottom: 20 }}>
          Need help now? Call or text 801-755-3040 and we’ll help you directly.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
          <a href="tel:8017553040" style={{ textDecoration: "none", padding: "10px 16px", borderRadius: 8, background: "#095f91", color: "#fff", fontWeight: 700 }}>
            Call/Text 801-755-3040
          </a>
          <Link href="/contact" style={{ textDecoration: "none", padding: "10px 16px", borderRadius: 8, border: "1px solid #0f172a", color: "#0f172a", fontWeight: 700 }}>
            Go to Contact Page
          </Link>
        </div>
      </section>
      <HomepageFooter />
    </>
  );
}