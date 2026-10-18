import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import HomepageFooter from "@/components/HomepageFooter";
import HomepageHeader from "@/components/HomepageHeader";
import styles from "@/components/ServiceAreasSection.module.css";
import { cityNames, localCities, localOfferings } from "@/lib/localOfferings";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://ashaac.com").replace(/\/$/, "");

export const metadata: Metadata = {
  title: "HVAC Service Areas in West Jordan, South Jordan, Riverton & Salt Lake County, UT",
  description:
    "Explore local HVAC repair and installation service area pages across West Jordan, South Jordan, Riverton, Herriman, Sandy, Draper, Taylorsville, Murray, Midvale, Kearns, and Salt Lake City.",
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
    "All Solutions HVAC",
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
      
      {/* Hero Section with Home page commercial background image & transparent dark blue film */}
      <div className={styles.heroContainer} data-label="ServiceAreasHeroSection">
        <Image
          src="/images/homepage/commercial.jpg"
          alt="All Solutions Heating and Air Conditioning Mobile HVAC Van and Equipment"
          fill
          style={{ objectFit: "cover", objectPosition: "center" }}
          priority
          className={styles.heroBg}
        />
        <div className={styles.blueOverlay} />
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>Service Areas</p>
          <h1 className={styles.heroTitle} data-label="ServiceAreasHeroTitle">
            Mobile HVAC Service Areas Across <span className={styles.highlight}>Salt Lake County</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Fast, licensed on-site heating, cooling, heat pump, and mini-split services throughout the Salt Lake Valley. Select your city and service below:
          </p>
        </div>
      </div>

      {/* Main Grid with full-card clickable links and city badges */}
      <main className={styles.mainSection}>
        <div className={styles.inner}>
          <div className={styles.grid}>
            {pages.map(([city, service, href]) => (
              <Link className={styles.areaCard} href={href} key={href}>
                <div className={styles.cardTop}>
                  <span className={styles.cityBadge}>{city}, UT</span>
                  <h2 className={styles.serviceTitle}>{service}</h2>
                </div>
                <div className={styles.cardBottom}>
                  <span className={styles.actionLabel}>View Service</span>
                  <span className={styles.actionArrow} aria-hidden="true">&rarr;</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <HomepageFooter />
    </>
  );
}
