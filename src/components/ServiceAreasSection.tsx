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
    ],
  },
  {
    city: "South Jordan",
    href: "/emergency-hvac-repair-south-jordan",
    links: [
      ["Emergency HVAC repair", "/emergency-hvac-repair-south-jordan"],
      ["AC repair", "/ac-repair-south-jordan"],
      ["Furnace repair", "/furnace-repair-south-jordan"],
    ],
  },
  {
    city: "Riverton",
    href: "/emergency-hvac-repair-riverton",
    links: [
      ["Emergency HVAC repair", "/emergency-hvac-repair-riverton"],
      ["AC repair", "/ac-repair-riverton"],
      ["Furnace repair", "/furnace-repair-riverton"],
    ],
  },
] as const;

export default function ServiceAreasSection() {
  return (
    <section className={styles.section} aria-labelledby="service-areas-title">
      <div className={styles.inner}>
        <p className={styles.eyebrow}>Local HVAC service areas</p>
        <h2 id="service-areas-title">HVAC services near West Jordan, South Jordan, and Riverton</h2>
        <p className={styles.intro}>Choose your city to find the right repair and emergency service information.</p>
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
        <Link className={styles.allLink} href="/service-areas">View all service areas</Link>
      </div>
    </section>
  );
}
