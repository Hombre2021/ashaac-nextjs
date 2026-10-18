import Image from "next/image";
import styles from "./ContactHero.module.css";

export default function ContactHero() {
  return (
    <div className={styles.heroContainer} data-label="ContactHeroSection">
      <Image
        src="/images/homepage/commercial.jpg"
        alt="All Solutions Heating and Air Conditioning Mobile HVAC Van and Contact Us"
        fill
        className={styles.heroBg}
        style={{ objectFit: "cover", objectPosition: "center" }}
        priority
      />

      <div className={styles.blueOverlay} />

      <div className={styles.heroContent}>
        <p className={styles.eyebrow}>Contact Us</p>
        <h1 className={styles.heroTitle} data-label="ContactHeroTitle">
          Get in Touch with Our <span className={styles.highlight}>HVAC Specialists</span>
        </h1>
        <p className={styles.heroSubtitle}>
          24/7 emergency dispatch, free installation estimates, and fast responses across Salt Lake County.
        </p>
      </div>
    </div>
  );
}
