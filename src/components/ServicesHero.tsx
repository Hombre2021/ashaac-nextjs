import Image from "next/image";
import styles from "./ServicesHero.module.css";

export default function ServicesHero() {
  return (
    <div className={styles.heroContainer} data-label="ServicesHeroSection">
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
        <p className={styles.eyebrow}>Services</p>
        <h1 className={styles.heroTitle} data-label="ServicesHeroTitle">
          Complete HVAC Solutions in <span className={styles.highlight}>West Jordan &amp; Salt Lake County</span>
        </h1>
        <p className={styles.heroSubtitle}>
          Expert furnace replacement, central AC repair, heat pumps, mini-splits, and maintenance tune-ups.
        </p>
      </div>
    </div>
  );
}
