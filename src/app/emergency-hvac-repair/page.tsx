import type { Metadata } from "next";
import HomepageHeader from "@/components/HomepageHeader";
import AboutHero from "@/components/AboutHero";
import HomepageFooter from "@/components/HomepageFooter";
import {
  absoluteUrl,
  primaryPhone,
  siteName,
  siteDescription,
} from "@/lib/seo";

export const metadata: Metadata = {
  title: "Emergency HVAC Repair in West Jordan, UT",
  description:
    "Need fast emergency HVAC repair near West Jordan? Call or text for urgent AC and furnace diagnostics, same-day service when available.",
  keywords: [
    "emergency HVAC repair near me",
    "24 hour HVAC repair West Jordan",
    "urgent AC repair Salt Lake County",
    "emergency furnace repair Utah",
  ],
  alternates: {
    canonical: "/emergency-hvac-repair",
  },
  openGraph: {
    title: `Emergency HVAC Repair in West Jordan, UT | ${siteName}`,
    description: siteDescription,
    url: absoluteUrl("/emergency-hvac-repair"),
    siteName,
    locale: "en_US",
    type: "website",
  },
};

export default function EmergencyHVACRepairPage() {
  const emergencySchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": absoluteUrl("/emergency-hvac-repair#webpage"),
        url: absoluteUrl("/emergency-hvac-repair"),
        name: `Emergency HVAC Repair | ${siteName}`,
        about: {
          "@id": absoluteUrl("/#business"),
        },
      },
      {
        "@type": "Service",
        "@id": absoluteUrl("/emergency-hvac-repair#service"),
        name: "Emergency HVAC Repair",
        serviceType: "Emergency air conditioning and furnace repair",
        provider: {
          "@id": absoluteUrl("/#business"),
        },
        availableChannel: {
          "@type": "ServiceChannel",
          servicePhone: {
            "@type": "ContactPoint",
            telephone: primaryPhone,
          },
          serviceUrl: absoluteUrl("/contact"),
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(emergencySchema) }}
      />
      <HomepageHeader />
      <AboutHero title="Emergency HVAC Repair" />
      <section style={{ maxWidth: 980, margin: "0 auto", padding: "40px 24px 56px" }}>
        <h1 style={{ textAlign: "center", fontSize: 36, marginBottom: 16 }}>
          Emergency HVAC Repair in West Jordan and Salt Lake County
        </h1>
        <p style={{ textAlign: "center", fontSize: 18, lineHeight: 1.7, marginBottom: 24 }}>
          If your AC stopped cooling or your furnace stopped heating, call or text us now. We provide urgent diagnostics and repair with same-day scheduling when available.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap", marginBottom: 28 }}>
          <a href="tel:8017553040" style={{ textDecoration: "none", padding: "12px 18px", borderRadius: 8, background: "#b91c1c", color: "#fff", fontWeight: 700 }}>
            Emergency Call: 801-755-3040
          </a>
          <a href="/contact" style={{ textDecoration: "none", padding: "12px 18px", borderRadius: 8, border: "1px solid #0f172a", color: "#0f172a", fontWeight: 700 }}>
            Request Fast Response
          </a>
        </div>

        <div style={{ border: "1px solid #d9e1ee", borderRadius: 10, padding: "18px 20px" }}>
          <h2 style={{ fontSize: 26, marginBottom: 10 }}>Common Emergency Issues We Handle</h2>
          <ul style={{ lineHeight: 1.8, fontSize: 17, paddingLeft: 20, margin: 0 }}>
            <li>AC blowing warm air during high heat</li>
            <li>Furnace not producing heat in winter</li>
            <li>System won’t turn on or keeps shutting off</li>
            <li>Unusual burning smell or loud HVAC noises</li>
            <li>Urgent thermostat or airflow failures</li>
          </ul>
        </div>
      </section>
      <HomepageFooter />
    </>
  );
}
