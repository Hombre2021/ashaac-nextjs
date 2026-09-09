import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import HomepageHeader from "@/components/HomepageHeader";
import AboutHero from "@/components/AboutHero";
import HomepageFooter from "@/components/HomepageFooter";
import styles from "./projects.module.css";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://ashaac.com").replace(/\/$/, "");

export const metadata: Metadata = {
  title: "Recent HVAC Projects & Installations in West Jordan, UT",
  description:
    "Explore completed HVAC installations, AC replacements, high-efficiency furnace upgrades, and mini-split setups across West Jordan and Salt Lake County by All Solutions HVAC.",
  keywords: [
    "HVAC projects West Jordan",
    "furnace installation gallery Utah",
    "AC replacement photos Salt Lake County",
    "mini split installation gallery",
    "commercial HVAC installation Utah",
  ],
  alternates: {
    canonical: "/projects",
  },
  openGraph: {
    type: "website",
    url: `${siteUrl}/projects`,
    title: "Recent HVAC Projects & Installations in West Jordan, UT",
    description:
      "Explore completed HVAC installations, AC replacements, furnace upgrades, and mini-split setups across Salt Lake County by All Solutions HVAC.",
  },
};

const projects = [
  {
    title: "Furnace Installation in West Jordan",
    description: "High-efficiency furnace replacement designed for optimal airflow, quiet operation, and reliable winter heating.",
    image: "/images/services/Furnace-WJ.webp",
  },
  {
    title: "Heat Pump Upgrade in South Jordan",
    description: "Energy-efficient heat pump installation providing year-round heating and cooling with low utility costs.",
    image: "/images/services/Heat-pump-WJ.webp",
  },
  {
    title: "Multi-Zone Mini-Split Installation",
    description: "Custom ductless mini-split system delivering precision zone temperature control for residential comfort.",
    image: "/images/services/mini-split.webp",
  },
  {
    title: "AC Condenser Replacement in Salt Lake County",
    description: "Complete outdoor condenser replacement and system calibration restoring peak summer cooling performance.",
    image: "/images/services/ac-cond-salt-lake.webp",
  },
  {
    title: "Dual AC Condenser Setup in Riverton",
    description: "Large residential dual condenser installation engineered for balanced airflow and maximum cooling capacity.",
    image: "/images/homepage/double-ac-condenser.webp",
  },
  {
    title: "Commercial Rooftop Unit Service & Installation",
    description: "Commercial HVAC unit installation and preventive tuning for reliable, heavy-duty building climate control.",
    image: "/images/homepage/Commercial-roof-top.webp",
  },
];

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
    { "@type": "ListItem", position: 2, name: "Projects", item: `${siteUrl}/projects` },
  ],
};

export default function ProjectsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <HomepageHeader />
      <AboutHero title="Projects & Recent Work" />

      <section className={styles.pageSection}>
        <div className={styles.introCard}>
          <h2>Featured HVAC Work Across West Jordan &amp; Salt Lake County</h2>
          <p>
            Every home and commercial building has unique comfort requirements. Browse our recent installations,
            replacements, and system upgrades completed with precision craftsmanship, clean work areas, and guaranteed
            satisfaction.
          </p>
        </div>

        <div className={styles.galleryGrid}>
          {projects.map((project) => (
            <article key={project.title} className={styles.projectCard}>
              <div className={styles.projectImageWrap}>
                <Image
                  src={project.image}
                  alt={`${project.title} by All Solutions Heating and Air Conditioning`}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className={styles.projectImage}
                />
              </div>
              <div className={styles.projectBody}>
                <h3>{project.title}</h3>
                <p>{project.description}</p>
              </div>
            </article>
          ))}
        </div>

        <div className={styles.tipsWrap}>
          <h2>Our Quality Guarantee on Every Job</h2>
          <ul>
            <li><strong>Licensed &amp; Insured Technicians:</strong> Experienced HVAC professionals serving Salt Lake Valley.</li>
            <li><strong>Upfront Estimates:</strong> Clear pricing with 0% financing options and cash/ACH discounts.</li>
            <li><strong>Top-Tier Equipment:</strong> Energy Star qualified furnaces, AC units, heat pumps, and mini-splits.</li>
            <li><strong>1-Year Labor Warranty:</strong> Full workmanship guarantee alongside manufacturer warranties.</li>
          </ul>
        </div>

        <div className={styles.ctaRow}>
          <Link href="/book" className={styles.ctaButton}>Request a Free Estimate</Link>
          <Link href="/services" className={styles.ctaButton}>Explore All HVAC Services</Link>
          <Link href="/reviews" className={styles.ctaButton}>Read Verified Customer Reviews</Link>
        </div>
      </section>

      <HomepageFooter />
    </>
  );
}
