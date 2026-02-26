import type { Metadata } from "next";
import Link from "next/link";
import BlueOverlayImage from "../../components/BlueOverlayImage";
import { absoluteUrl, siteName } from "@/lib/seo";
import { serviceAreas } from "@/data/serviceAreas";

export const metadata: Metadata = {
  title: "Salt Lake Valley Service Area",
  description: "View our HVAC service area across Salt Lake Valley and surrounding communities.",
  alternates: {
    canonical: "/valley",
  },
};

export default function ValleyPage() {
  const valleyPageSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": absoluteUrl("/valley#webpage"),
        url: absoluteUrl("/valley"),
        name: `Salt Lake Valley Service Area | ${siteName}`,
        about: {
          "@id": absoluteUrl("/#business"),
        },
      },
      {
        "@type": "Map",
        name: "Salt Lake Valley HVAC Service Coverage",
        url: absoluteUrl("/valley"),
      },
    ],
  };

  return (
    <BlueOverlayImage src="/images/homepage/Salt-Lake-Valley.png" alt="Salt Lake Valley" height={"80vh"}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(valleyPageSchema) }}
      />
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          background: "rgba(255,255,255,0.92)",
          borderRadius: 12,
          padding: "18px 20px",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: 30, marginBottom: 8 }}>Salt Lake Valley HVAC Service Area</h1>
        <p style={{ fontSize: 17, lineHeight: 1.6, marginBottom: 14 }}>
          We provide installation, replacement, maintenance, and HVAC repair services across these cities.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10 }}>
          {serviceAreas.map((area) => (
            <Link
              key={area.slug}
              href={`/service-areas/${area.slug}`}
              style={{
                border: "1px solid #d9e1ee",
                borderRadius: 999,
                padding: "8px 12px",
                textDecoration: "none",
                color: "#111827",
                background: "#ffffff",
              }}
            >
              {area.city}
            </Link>
          ))}
        </div>
      </div>
    </BlueOverlayImage>
  );
}
