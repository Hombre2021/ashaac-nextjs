import Link from "next/link";
import styles from "./ServiceAreasSection.module.css";

const areas = [
  {
    city: "West Jordan",
    href: "/emergency-hvac-repair-west-jordan",
    links: [
      ["Emergency HVAC repair", "/emergency-hvac-repair-west-jordan"],
      ["AC repair", "/ac-repair-west-jordan"],
      ["Furnace repair", "/furnace-repair-west-jordan"],
      ["Heat pump installation", "/services/west-jordan/heat-pump-installation"],
    ],
  },
  {
    city: "South Jordan",
    href: "/emergency-hvac-repair-south-jordan",
    links: [
      ["Emergency HVAC repair", "/emergency-hvac-repair-south-jordan"],
      ["AC repair", "/ac-repair-south-jordan"],
      ["Furnace repair", "/furnace-repair-south-jordan"],
      ["Mini-split installation", "/services/south-jordan/mini-split-installation"],
    ],
  },
  {
    city: "Riverton",
    href: "/emergency-hvac-repair-riverton",
    links: [
      ["Emergency HVAC repair", "/emergency-hvac-repair-riverton"],
      ["AC repair", "/ac-repair-riverton"],
      ["Furnace repair", "/furnace-repair-riverton"],
      ["HVAC installation", "/services/riverton/hvac-installation"],
    ],
  },
  {
    city: "Herriman",
    href: "/services/herriman/hvac-installation",
    links: [
      ["HVAC installation", "/services/herriman/hvac-installation"],
      ["AC installation", "/services/herriman/ac-installation"],
      ["Heat pump installation", "/services/herriman/heat-pump-installation"],
      ["HVAC maintenance", "/services/herriman/hvac-maintenance"],
    ],
  },
  {
    city: "Sandy",
    href: "/services/sandy/hvac-installation",
    links: [
      ["HVAC installation", "/services/sandy/hvac-installation"],
      ["Furnace installation", "/services/sandy/furnace-installation"],
      ["AC installation", "/services/sandy/ac-installation"],
      ["Ductless mini-splits", "/services/sandy/mini-split-installation"],
    ],
  },
  {
    city: "Draper",
    href: "/services/draper/hvac-installation",
    links: [
      ["HVAC installation", "/services/draper/hvac-installation"],
      ["Heat pump installation", "/services/draper/heat-pump-installation"],
      ["AC installation", "/services/draper/ac-installation"],
      ["Indoor air quality", "/services/draper/indoor-air-quality"],
    ],
  },
  {
    city: "Taylorsville",
    href: "/services/taylorsville/hvac-installation",
    links: [
      ["HVAC installation", "/services/taylorsville/hvac-installation"],
      ["Furnace installation", "/services/taylorsville/furnace-installation"],
      ["AC installation", "/services/taylorsville/ac-installation"],
      ["HVAC maintenance", "/services/taylorsville/hvac-maintenance"],
    ],
  },
  {
    city: "Murray",
    href: "/services/murray/hvac-installation",
    links: [
      ["HVAC installation", "/services/murray/hvac-installation"],
      ["Furnace repair & install", "/services/murray/furnace-installation"],
      ["Heat pumps", "/services/murray/heat-pump-installation"],
      ["Indoor air quality", "/services/murray/indoor-air-quality"],
    ],
  },
  {
    city: "Midvale",
    href: "/services/midvale/hvac-installation",
    links: [
      ["HVAC installation", "/services/midvale/hvac-installation"],
      ["AC installation", "/services/midvale/ac-installation"],
      ["Furnace installation", "/services/midvale/furnace-installation"],
      ["HVAC maintenance", "/services/midvale/hvac-maintenance"],
    ],
  },
  {
    city: "Salt Lake City",
    href: "/services/salt-lake-city/hvac-installation",
    links: [
      ["HVAC installation", "/services/salt-lake-city/hvac-installation"],
      ["AC installation", "/services/salt-lake-city/ac-installation"],
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
