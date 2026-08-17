import type { Metadata } from "next";
import Link from "next/link";
import HomepageFooter from "@/components/HomepageFooter";
import HomepageHeader from "@/components/HomepageHeader";
import styles from "@/components/ServiceAreasSection.module.css";
import { cityNames, localCities, localOfferings } from "@/lib/localOfferings";

export const metadata: Metadata = {
  title: "HVAC Service Areas in Utah",
  description: "Find HVAC repair, installation, maintenance, AC repair, and furnace repair service pages for West Jordan, South Jordan, and Riverton, Utah.",
  alternates: { canonical: "/service-areas" },
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

const offeringPages = localCities.flatMap((city) => localOfferings.map((offering) => [
  cityNames[city],
  offering.title,
  `/services/${city}/${offering.slug}`,
] as const));

const pages = [...corePages, ...offeringPages];

export default function ServiceAreasPage() {
  return (
    <>
      <HomepageHeader />
      <main className={styles.section}>
        <div className={styles.inner}>
          <p className={styles.eyebrow}>All Solutions Heating and Air Conditioning</p>
          <h1>HVAC service areas in Utah</h1>
          <p className={styles.intro}>Find city-specific HVAC repair and installation information for West Jordan, South Jordan, and Riverton.</p>
          <div className={styles.grid}>
            {pages.map(([city, service, href]) => <article className={styles.area} key={href}><h2>{city}, UT</h2><Link className={styles.allLink} href={href}>{service}</Link></article>)}
          </div>
        </div>
      </main>
      <HomepageFooter />
    </>
  );
}
