import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import HomepageHeader from "@/components/HomepageHeader";
import AboutHero from "@/components/AboutHero";
import HomepageFooter from "@/components/HomepageFooter";
import {
  absoluteUrl,
  primaryPhone,
  siteName,
} from "@/lib/seo";
import { findServiceAreaBySlug, serviceAreas } from "@/data/serviceAreas";

type ServiceAreaPageProps = {
  params: Promise<{ city: string }>;
};

export function generateStaticParams() {
  return serviceAreas.map((area) => ({ city: area.slug }));
}

export async function generateMetadata({ params }: ServiceAreaPageProps): Promise<Metadata> {
  const { city } = await params;
  const area = findServiceAreaBySlug(city);

  if (!area) {
    return {
      title: "Service Area Not Found",
    };
  }

  return {
    title: `HVAC Services in ${area.city}, ${area.stateCode}`,
    description: `${area.summary} Call or text ${primaryPhone.replace("+1-", "")} for a free estimate.`,
    alternates: {
      canonical: `/service-areas/${area.slug}`,
    },
  };
}

export default async function ServiceAreaCityPage({ params }: ServiceAreaPageProps) {
  const { city } = await params;
  const area = findServiceAreaBySlug(city);

  if (!area) {
    notFound();
  }

  const serviceAreaSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": absoluteUrl(`/service-areas/${area.slug}#webpage`),
        url: absoluteUrl(`/service-areas/${area.slug}`),
        name: `HVAC Services in ${area.city}, ${area.stateCode}`,
        about: {
          "@id": absoluteUrl("/#business"),
        },
      },
      {
        "@type": "Service",
        "@id": absoluteUrl(`/service-areas/${area.slug}#service`),
        name: `HVAC Installation and Repair in ${area.city}`,
        serviceType: "HVAC installation, repair, replacement, and maintenance",
        provider: {
          "@id": absoluteUrl("/#business"),
        },
        areaServed: {
          "@type": "City",
          name: area.city,
        },
        availableChannel: {
          "@type": "ServiceChannel",
          serviceUrl: absoluteUrl("/contact"),
          servicePhone: {
            "@type": "ContactPoint",
            telephone: primaryPhone,
          },
        },
      },
      {
        "@type": "FAQPage",
        "@id": absoluteUrl(`/service-areas/${area.slug}#faqs`),
        mainEntity: [
          {
            "@type": "Question",
            name: `Do you provide HVAC service in ${area.city}, ${area.stateCode}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `Yes. ${siteName} provides HVAC installation, replacement, diagnostics, and repair services throughout ${area.city}, ${area.county}.`,
            },
          },
          {
            "@type": "Question",
            name: `Can I schedule a free estimate in ${area.city}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `Yes. Call or text ${primaryPhone.replace("+1-", "")} to schedule a free estimate in ${area.city}.`,
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceAreaSchema) }}
      />
      <HomepageHeader />
      <AboutHero title={`${area.city} HVAC Services`} />
      <section style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 24px 56px" }}>
        <h1 style={{ textAlign: "center", fontSize: 36, marginBottom: 18 }}>
          HVAC Installation & Repair in {area.city}, {area.stateCode}
        </h1>
        <p style={{ textAlign: "center", fontSize: 18, lineHeight: 1.7, marginBottom: 26 }}>
          {area.summary}
        </p>

        <div style={{ border: "1px solid #d9e1ee", borderRadius: 10, padding: "18px 20px", marginBottom: 24 }}>
          <h2 style={{ fontSize: 26, marginBottom: 12 }}>Services Offered in {area.city}</h2>
          <ul style={{ lineHeight: 1.8, fontSize: 17, paddingLeft: 20 }}>
            <li>Furnace and AC installation and replacement</li>
            <li>Heat pump and mini-split installation</li>
            <li>Heating and cooling diagnostics and repairs</li>
            <li>Seasonal maintenance and efficiency tune-ups</li>
            <li>Residential and light commercial HVAC service</li>
          </ul>
        </div>

        <div style={{ border: "1px solid #d9e1ee", borderRadius: 10, padding: "18px 20px", marginBottom: 24 }}>
          <h2 style={{ fontSize: 26, marginBottom: 10 }}>Neighborhoods We Commonly Serve</h2>
          <p style={{ fontSize: 17, lineHeight: 1.7, marginBottom: 8 }}>
            {area.neighborhoods.join(", ")} and nearby parts of {area.city}.
          </p>
        </div>

        <div style={{ border: "1px solid #d9e1ee", borderRadius: 10, padding: "18px 20px", marginBottom: 30 }}>
          <h2 style={{ fontSize: 26, marginBottom: 12 }}>Need HVAC Help in {area.city}?</h2>
          <p style={{ fontSize: 17, lineHeight: 1.7, marginBottom: 12 }}>
            Call or text <a href={`tel:${primaryPhone.replace("+1-", "")}`}>{primaryPhone.replace("+1-", "")}</a> to request a free estimate.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/contact" style={{ padding: "10px 16px", borderRadius: 8, background: "#111827", color: "#fff", textDecoration: "none" }}>
              Request Estimate
            </Link>
            <Link href="/services" style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid #111827", color: "#111827", textDecoration: "none" }}>
              View Services
            </Link>
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: 24, marginBottom: 10 }}>More Service Areas</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {serviceAreas
              .filter((entry) => entry.slug !== area.slug)
              .map((entry) => (
                <Link
                  key={entry.slug}
                  href={`/service-areas/${entry.slug}`}
                  style={{ border: "1px solid #d9e1ee", borderRadius: 999, padding: "8px 12px", textDecoration: "none", color: "#111827" }}
                >
                  {entry.city}
                </Link>
              ))}
          </div>
        </div>
      </section>
      <HomepageFooter />
    </>
  );
}
