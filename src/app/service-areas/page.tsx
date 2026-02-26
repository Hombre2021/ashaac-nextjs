import type { Metadata } from "next";
import Link from "next/link";
import HomepageHeader from "@/components/HomepageHeader";
import AboutHero from "@/components/AboutHero";
import HomepageFooter from "@/components/HomepageFooter";
import { absoluteUrl, siteName } from "@/lib/seo";
import { serviceAreas } from "@/data/serviceAreas";

export const metadata: Metadata = {
  title: "HVAC Service Areas in Salt Lake County",
  description:
    "Explore our HVAC service areas across Salt Lake County, including West Jordan, South Jordan, Sandy, Murray, Midvale, Taylorsville, Draper, and Salt Lake City.",
  keywords: [
    "HVAC service areas Salt Lake County",
    "HVAC company West Jordan and nearby cities",
    "heating and cooling service area Utah",
  ],
  alternates: {
    canonical: "/service-areas",
  },
};

export default function ServiceAreasPage() {
  const serviceAreasSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": absoluteUrl("/service-areas#webpage"),
        url: absoluteUrl("/service-areas"),
        name: `HVAC Service Areas | ${siteName}`,
        about: {
          "@id": absoluteUrl("/#business"),
        },
      },
      {
        "@type": "ItemList",
        name: "Cities served",
        numberOfItems: serviceAreas.length,
        itemListElement: serviceAreas.map((area, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "Service",
            name: `HVAC Services in ${area.city}, ${area.stateCode}`,
            areaServed: {
              "@type": "City",
              name: area.city,
            },
            url: absoluteUrl(`/service-areas/${area.slug}`),
          },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceAreasSchema) }}
      />
      <HomepageHeader />
      <AboutHero title="Service Areas" />
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 56px" }}>
        <h1 style={{ textAlign: "center", fontSize: 36, marginBottom: 20 }}>HVAC Service Areas in Salt Lake County</h1>
        <p style={{ textAlign: "center", fontSize: 18, lineHeight: 1.7, marginBottom: 34 }}>
          We provide HVAC installation, repair, replacement, and maintenance across the Salt Lake Valley.
          Select your city below to view local service details and request an estimate.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          {serviceAreas.map((area) => (
            <Link
              key={area.slug}
              href={`/service-areas/${area.slug}`}
              style={{
                border: "1px solid #d9e1ee",
                borderRadius: 10,
                padding: "16px 14px",
                textDecoration: "none",
                color: "#0f172a",
                background: "#fff",
              }}
            >
              <h2 style={{ fontSize: 20, marginBottom: 8 }}>{area.city}, {area.stateCode}</h2>
              <p style={{ fontSize: 15, lineHeight: 1.5 }}>{area.summary}</p>
            </Link>
          ))}
        </div>
      </section>
      <HomepageFooter />
    </>
  );
}