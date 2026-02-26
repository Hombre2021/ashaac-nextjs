import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import HomepageHeader from "@/components/HomepageHeader";
import AboutHero from "@/components/AboutHero";
import HomepageFooter from "@/components/HomepageFooter";
import styles from "./projects.module.css";
import { absoluteUrl, siteName } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Recent HVAC Projects and Installations",
  description:
    "View recent HVAC installations, repairs, and replacement projects completed by All Solutions Heating and Air Conditioning in West Jordan and Salt Lake County.",
  keywords: [
    "HVAC projects West Jordan",
    "furnace installation photos",
    "AC replacement projects Salt Lake County",
    "mini split installation gallery",
  ],
  alternates: {
    canonical: "/projects",
  },
};

const projects = [
  {
    title: "Furnace Installation in West Jordan",
    description: "High-efficiency furnace replacement with improved airflow and comfort.",
    image: "/images/services/Furnace-WJ.webp",
  },
  {
    title: "Heat Pump Upgrade",
    description: "Energy-efficient heat pump installation for year-round climate control.",
    image: "/images/services/Heat-pump-WJ.webp",
  },
  {
    title: "Mini-Split System Install",
    description: "Multi-zone mini-split setup for targeted comfort and lower utility costs.",
    image: "/images/services/mini-split.webp",
  },
  {
    title: "AC Condenser Replacement",
    description: "Condenser swap and system calibration to restore cooling performance.",
    image: "/images/services/ac-cond-salt-lake.webp",
  },
  {
    title: "Dual AC Condenser Setup",
    description: "Large-home dual condenser install with cleaner airflow balance.",
    image: "/images/homepage/double-ac-condenser.webp",
  },
  {
    title: "Commercial Rooftop Unit Service",
    description: "Commercial HVAC service and performance optimization for reliable operation.",
    image: "/images/homepage/Commercial-roof-top.webp",
  },
];

export default function ProjectsPage() {
  const projectsPageSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": absoluteUrl("/projects#webpage"),
        url: absoluteUrl("/projects"),
        name: `Recent HVAC Projects and Installations | ${siteName}`,
        about: {
          "@id": absoluteUrl("/#business"),
        },
      },
      {
        "@type": "ItemList",
        name: "Recent HVAC projects",
        numberOfItems: projects.length,
        itemListElement: projects.map((project, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "CreativeWork",
            name: project.title,
            description: project.description,
            image: absoluteUrl(project.image),
          },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(projectsPageSchema) }}
      />
      <HomepageHeader />
      <AboutHero title="Projects & Recent Work" />

      <section className={styles.pageSection}>
        <div className={styles.introCard}>
          <h2>Recent HVAC Work in West Jordan & Salt Lake County</h2>
          <p>
            This page helps customers see real project quality and helps search engines understand your
            local service relevance. Add new job photos regularly to strengthen local trust and improve
            ranking signals for HVAC installation, repair, and replacement searches.
          </p>
        </div>

        <div className={styles.galleryGrid}>
          {projects.map((project) => (
            <article key={project.title} className={styles.projectCard}>
              <div className={styles.projectImageWrap}>
                <Image src={project.image} alt={project.title} fill sizes="(max-width: 768px) 100vw, 33vw" className={styles.projectImage} />
              </div>
              <div className={styles.projectBody}>
                <h3>{project.title}</h3>
                <p>{project.description}</p>
              </div>
            </article>
          ))}
        </div>

        <div className={styles.tipsWrap}>
          <h2>What to Include on New Project Entries</h2>
          <ul>
            <li>City + service type in the title (for example: “Furnace Replacement in West Jordan”).</li>
            <li>1-2 photos before and after each completed job.</li>
            <li>Equipment type or brand when relevant.</li>
            <li>Short outcome summary (comfort, efficiency, reliability improvements).</li>
            <li>Optional customer testimonial snippet tied to that project.</li>
          </ul>
        </div>

        <div className={styles.ctaRow}>
          <Link href="/contact" className={styles.ctaButton}>Request a Free Estimate</Link>
          <Link href="/services" className={styles.ctaButton}>Explore HVAC Services</Link>
        </div>
      </section>

      <HomepageFooter />
    </>
  );
}
