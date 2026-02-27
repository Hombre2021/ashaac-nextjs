import type { Metadata } from "next";
import HomepageHeader from "@/components/HomepageHeader";
import HomepageFooter from "@/components/HomepageFooter";
import BlueOverlayImage from "@/components/BlueOverlayImage";
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
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(valleyPageSchema) }}
      />
      <HomepageHeader />
      <BlueOverlayImage
        src="/images/homepage/Salt-Lake-Valley.png"
        alt="Salt Lake Valley"
        height="82vh"
        objectFit="cover"
        objectPosition="center center"
      >
        <h1
          style={{
            color: "#ffffff",
            fontSize: "2.8rem",
            fontWeight: 700,
            textShadow: "0 2px 12px rgba(0,0,0,0.7)",
            letterSpacing: 2,
            textAlign: "center",
            padding: "0 16px",
          }}
        >
          Service Area Coverage
        </h1>
      </BlueOverlayImage>
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px 0" }}>
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #d9e1ee",
            borderRadius: 12,
            padding: 16,
          }}
        >
          <h2 style={{ margin: "0 0 10px", fontSize: 28, textAlign: "center" }}>Salt Lake County Map</h2>
          <p style={{ margin: "0 0 14px", textAlign: "center", lineHeight: 1.6 }}>
            Reference map outlining the Salt Lake County coverage area.
          </p>
          <iframe
            title="Salt Lake County coverage map"
            src="https://www.google.com/maps?q=Salt%20Lake%20County%20Utah&output=embed"
            width="100%"
            height="420"
            style={{ border: 0, borderRadius: 10 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 56px" }}>
        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            background: "#ffffff",
            border: "1px solid #d9e1ee",
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
              <span
                key={area.city}
                style={{
                  border: "1px solid #d9e1ee",
                  borderRadius: 999,
                  padding: "8px 12px",
                  color: "#111827",
                  background: "#ffffff",
                }}
              >
                {area.city}
              </span>
            ))}
          </div>
        </div>
      </section>
      <HomepageFooter />
    </>
  );
}
