import Link from "next/link";
import styles from "./ServiceAreasSection.module.css";

const areas = [
  {
    city: "West Jordan",
    href: "/furnace-repair-west-jordan",
    links: [
      ["Furnace repair", "/furnace-repair-west-jordan"],
      ["Emergency HVAC repair", "/emergency-hvac-repair-west-jordan"],
      ["AC repair", "/ac-repair-west-jordan"],
      ["Heat pump installation", "/services/west-jordan/heat-pump-installation"],
    ],
  },
  {
    city: "South Jordan",
    href: "/furnace-repair-south-jordan",
    links: [
      ["Furnace repair", "/furnace-repair-south-jordan"],
      ["Emergency HVAC repair", "/emergency-hvac-repair-south-jordan"],
      ["AC repair", "/ac-repair-south-jordan"],
      ["Mini-split installation", "/services/south-jordan/mini-split-installation"],
    ],
  },
  {
    city: "Riverton",
    href: "/furnace-repair-riverton",
    links: [
      ["Furnace repair", "/furnace-repair-riverton"],
      ["Emergency HVAC repair", "/emergency-hvac-repair-riverton"],
      ["AC repair", "/ac-repair-riverton"],
      ["HVAC installation", "/services/riverton/hvac-installation"],
    ],
  },
  {
    city: "Herriman",
    href: "/services/herriman/furnace-repair",
    links: [
      ["Furnace repair", "/services/herriman/furnace-repair"],
      ["Emergency HVAC repair", "/emergency-hvac-repair"],
      ["HVAC installation", "/services/herriman/hvac-installation"],
      ["AC repair", "/services/herriman/ac-repair"],
    ],
  },
  {
    city: "Sandy",
    href: "/services/sandy/furnace-repair",
    links: [
      ["Furnace repair", "/services/sandy/furnace-repair"],
      ["Emergency HVAC repair", "/emergency-hvac-repair"],
      ["Furnace installation", "/services/sandy/furnace-installation"],
      ["AC repair", "/services/sandy/ac-repair"],
    ],
  },
  {
    city: "Draper",
    href: "/services/draper/furnace-repair",
    links: [
      ["Furnace repair", "/services/draper/furnace-repair"],
      ["Emergency HVAC repair", "/emergency-hvac-repair"],
      ["Heat pump installation", "/services/draper/heat-pump-installation"],
      ["AC repair", "/services/draper/ac-repair"],
    ],
  },
  {
    city: "Taylorsville",
    href: "/services/taylorsville/furnace-repair",
    links: [
      ["Furnace repair", "/services/taylorsville/furnace-repair"],
      ["Emergency HVAC repair", "/emergency-hvac-repair"],
      ["Furnace installation", "/services/taylorsville/furnace-installation"],
      ["AC repair", "/services/taylorsville/ac-repair"],
    ],
  },
  {
    city: "Murray",
    href: "/services/murray/furnace-repair",
    links: [
      ["Furnace repair", "/services/murray/furnace-repair"],
      ["Emergency HVAC repair", "/emergency-hvac-repair"],
      ["Furnace installation", "/services/murray/furnace-installation"],
      ["Heat pumps", "/services/murray/heat-pump-installation"],
    ],
  },
  {
    city: "Midvale",
    href: "/services/midvale/furnace-repair",
    links: [
      ["Furnace repair", "/services/midvale/furnace-repair"],
      ["Emergency HVAC repair", "/emergency-hvac-repair"],
      ["Furnace installation", "/services/midvale/furnace-installation"],
      ["AC repair", "/services/midvale/ac-repair"],
    ],
  },
  {
    city: "Salt Lake City",
    href: "/services/salt-lake-city/furnace-repair",
    links: [
      ["Furnace repair", "/services/salt-lake-city/furnace-repair"],
      ["Emergency HVAC repair", "/emergency-hvac-repair"],
      ["Furnace installation", "/services/salt-lake-city/furnace-installation"],
      ["Heat pump installation", "/services/salt-lake-city/heat-pump-installation"],
    ],
  },
] as const;

export default function ServiceAreasSection() {
  return (
    <section className={styles.section} aria-labelledby="service-areas-title">
      <div className={styles.inner}>
        <p className={styles.eyebrow}>100% Mobile HVAC Service Areas</p>
        <h2 id="service-areas-title">HVAC Services Across Salt Lake County &amp; Wasatch Front</h2>
        <p className={styles.intro}>We provide prompt, licensed mobile on-site heating and cooling services directly to your door across all 10 local cities.</p>
        <div className={styles.grid}>
          {areas.map((area) => (
            <article className={styles.area} key={area.city}>
              <h3><Link href={area.href}>{area.city}, UT</Link></h3>
              <div className={styles.links}>
                {area.links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
              </div>
            </article>
          ))}
        </div>
        <Link className={styles.allLink} href="/service-areas">Explore All HVAC Service Area Pages</Link>
      </div>
    </section>
  );
}
