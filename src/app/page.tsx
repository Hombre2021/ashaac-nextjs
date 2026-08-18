import type { Metadata } from "next";
import Link from "next/link";
import HomepageResponsive from "../components/HomepageResponsive";
import styles from "./HomepageSeoIntro.module.css";

export const metadata: Metadata = {
  title: "HVAC Installation & Repair in West Jordan, UT",
  description:
    "Professional HVAC installation, replacement, maintenance, and repair in West Jordan and Salt Lake County. Call or text for fast service and free estimates.",
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
    type: "website",
    url: "/",
    title: "HVAC Installation & Repair in West Jordan, UT | All Solutions Heating and Air Conditioning",
    description: "Professional HVAC installation, replacement, maintenance, and repair in West Jordan and Salt Lake County.",
  },
};

export default function Home() {
  return (
    <>
      <section className={styles.intro} aria-labelledby="homepage-seo-heading">
        <div className={styles.inner}>
          <h1 id="homepage-seo-heading">HVAC Installation &amp; Repair in West Jordan, UT</h1>
          <p>All Solutions Heating and Air Conditioning provides practical HVAC repair, installation, replacement, and maintenance support across West Jordan, South Jordan, and Riverton.</p>
          <nav className={styles.links} aria-label="Popular local HVAC services">
            <Link href="/emergency-hvac-repair-west-jordan">Emergency HVAC repair in West Jordan</Link>
            <Link href="/ac-repair-south-jordan">AC repair in South Jordan</Link>
            <Link href="/furnace-repair-riverton">Furnace repair in Riverton</Link>
            <Link href="/services">Explore all HVAC services</Link>
          </nav>
        </div>
      </section>
      <HomepageResponsive />
    </>
  );
}
