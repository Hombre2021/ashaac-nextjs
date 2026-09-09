import type { Metadata } from "next";
import Link from "next/link";
import HomepageFooter from "@/components/HomepageFooter";
import HomepageHeader from "@/components/HomepageHeader";
import styles from "@/components/ServiceAreasSection.module.css";
import { cityNames, localCities, localOfferings } from "@/lib/localOfferings";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://ashaac.com").replace(/\/$/, "");

export const metadata: Metadata = {
  title: "HVAC Service Areas in West Jordan, South Jordan, Riverton & Salt Lake County, UT",
  description:
    "Explore local HVAC repair and installation service area pages across West Jordan, South Jordan, Riverton, Herriman, Sandy, Draper, Taylorsville, Murray, Midvale, and Salt Lake City.",
  keywords: [
    "HVAC service areas Utah",
    "HVAC West Jordan UT",
    "AC repair South Jordan",
    "furnace repair Riverton",
    "HVAC contractor Herriman",
    "AC repair Sandy UT",
    "furnace installation Draper",
    "Salt Lake County HVAC service",
    "All Solutions Heating and Air Conditioning",
  ],
  alternates: { canonical: "/service-areas" },
  openGraph: {
    type: "website",
    url: `${siteUrl}/service-areas`,
    title: "HVAC Service Areas in West Jordan, South Jordan, Riverton & Salt Lake County, UT",
    description: "Explore local HVAC repair and installation service area pages across Salt Lake County.",
  },
};

const corePages = [
  ["West Jordan", "Emergency HVAC repair", "/emergency-hvac-repair-west-jordan"],
  ["West Jordan", "AC repair", "/ac-repair-west-jordan"],
  ["West Jordan", "Furnace repair", "/furnace-repair-west-jordan"],
  ["South Jordan", "Emergency HVAC repair", "/emergency-hvac-repair-south-jordan"],
  ["South Jordan", "AC repair", "/ac-repair-south-jordan"],
  ["South Jordan", "Furnace repair", "/furnace-repair-south-jordan"],
  ["Riverton", "Emergency HVAC repair", "/emergency-hvac-repair-riverton"],
  ["Riverton", "AC repair", "/ac-repair-riverton"],
  ["Riverton", "Furnace repair", "/furnace-repair-riverton"],
] as const;

const offeringPages = localCities.flatMap((city) =>
  localOfferings.map((offering) => [
    cityNames[city],
    offering.title,
    `/services/${city}/${offering.slug}`,
  ] as const)
);

const pages = [...corePages, ...offeringPages];

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
    { "@type": "ListItem", position: 2, name: "Service Areas", item: `${siteUrl}/service-areas` },
  ],
};

export default function ServiceAreasPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <HomepageHeader />
      <main className={styles.section}>
        <div className={styles.inner}>
          <p className={styles.eyebrow}>All Solutions Heating and Air Conditioning</p>
          <h1>Mobile HVAC Service Areas Across Salt Lake County</h1>
          <p className={styles.intro}>
            We provide fast, licensed, on-site heating, cooling, heat pump, and mini-split services throughout the Salt Lake Valley. Select your city below:
          </p>
          <div className={styles.grid}>
            {pages.map(([city, service, href]) => (
              <article className={styles.area} key={href}>
                <h2>{city}, UT</h2>
                <Link className={styles.allLink} href={href}>
                  {service}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </main>
      <HomepageFooter />
    </>
  );
}
