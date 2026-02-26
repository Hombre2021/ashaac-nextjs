import type { Metadata } from "next";
import HomepageResponsive from "../components/HomepageResponsive";
import { absoluteUrl, buildLocalBusinessSchema, siteDescription, siteName } from "@/lib/seo";

export const metadata: Metadata = {
  title: "HVAC Installation & Repair in West Jordan, UT",
  description: siteDescription,
  keywords: [
    "HVAC West Jordan UT",
    "air conditioning repair West Jordan",
    "furnace repair West Jordan",
    "HVAC installation Salt Lake County",
    "heat pump services Utah",
    "mini split installation West Jordan",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `HVAC Installation & Repair in West Jordan, UT | ${siteName}`,
    description: siteDescription,
    url: absoluteUrl("/"),
    siteName,
    locale: "en_US",
    type: "website",
    images: [
      {
        url: absoluteUrl("/images/homepage/hero-man.png"),
        width: 1200,
        height: 630,
        alt: "HVAC professional from All Solutions Heating and Air Conditioning",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `HVAC Installation & Repair in West Jordan, UT | ${siteName}`,
    description: siteDescription,
    images: [absoluteUrl("/images/homepage/hero-man.png")],
  },
};

export default function Home() {
  const homePageSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "HomePage",
        "@id": absoluteUrl("/#webpage"),
        url: absoluteUrl("/"),
        name: `HVAC Installation & Repair in West Jordan, UT | ${siteName}`,
        description: siteDescription,
        isPartOf: {
          "@id": absoluteUrl("/#website"),
        },
        about: {
          "@id": absoluteUrl("/#business"),
        },
        primaryImageOfPage: {
          "@type": "ImageObject",
          url: absoluteUrl("/images/homepage/hero-man.png"),
        },
      },
      {
        "@type": "Service",
        name: "HVAC Installation and Repair",
        provider: {
          "@id": absoluteUrl("/#business"),
        },
        areaServed: buildLocalBusinessSchema().areaServed,
        serviceType: [
          "HVAC installation",
          "AC repair",
          "furnace installation",
          "heat pump services",
          "mini-split installation",
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homePageSchema) }}
      />
      <HomepageResponsive />
    </>
  );
}
