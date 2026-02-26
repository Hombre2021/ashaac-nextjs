import type { Metadata } from "next";
import Link from "next/link";
import HomepageHeader from "@/components/HomepageHeader";
import AboutHero from "@/components/AboutHero";
import HomepageFooter from "@/components/HomepageFooter";
import { absoluteUrl, primaryPhone, siteName } from "@/lib/seo";

export const metadata: Metadata = {
  title: "DIY Help Center",
  description:
    "DIY Help Center is being prepared for nationwide educational HVAC videos and remote guidance. On-site HVAC service remains local to Salt Lake County area.",
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
        description:
          "Nationwide educational HVAC content and remote guidance are coming soon. In-person service remains local to Salt Lake County and surrounding areas.",
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
          We are preparing a nationwide DIY HVAC video library and step-by-step troubleshooting resources.
          This page will relaunch soon with practical, easy-to-follow guidance for homeowners across the U.S.
        </p>
        <p style={{ fontSize: 18, lineHeight: 1.7, marginBottom: 20 }}>
          Important: In-person HVAC service is local to Salt Lake County and surrounding areas.
          Remote educational support and video guidance will be available nationally.
        </p>
        <div style={{ border: "1px solid #d9e1ee", borderRadius: 10, padding: "16px 18px", marginBottom: 20, textAlign: "left" }}>
          <h2 style={{ fontSize: 24, marginTop: 0, marginBottom: 10, textAlign: "center" }}>Coming Soon Topics</h2>
          <ul style={{ margin: 0, paddingLeft: 22, lineHeight: 1.8, fontSize: 17 }}>
            <li>Why your AC is blowing warm air</li>
            <li>How often to change furnace filters</li>
            <li>Signs your AC compressor may be failing</li>
            <li>Thermostat setup and reset best practices</li>
            <li>When to troubleshoot vs call for service</li>
          </ul>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
          <a href={`tel:${primaryPhone.replace(/[+\-]/g, "")}`} style={{ textDecoration: "none", padding: "10px 16px", borderRadius: 8, background: "#095f91", color: "#fff", fontWeight: 700 }}>
            Call/Text 801-755-3040 (Local Service)
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