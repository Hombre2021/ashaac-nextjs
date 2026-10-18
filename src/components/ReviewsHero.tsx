import Image from "next/image";
import styles from "./ReviewsHero.module.css";

export default function ReviewsHero() {
  return (
    <div className={styles.heroContainer} data-label="ReviewsHeroSection">
      <Image
        src="/images/homepage/commercial.jpg"
        alt="All Solutions Heating and Air Conditioning Mobile HVAC Van and Customer Reviews"
        fill
        style={{ objectFit: "cover", objectPosition: "center" }}
        priority
        className={styles.heroBg}
      />
      <div className={styles.blueOverlay} />
      <div className={styles.heroContent}>
        <p className={styles.eyebrow}>Reviews</p>
        <h1 className={styles.heroTitle} data-label="ReviewsHeroTitle">
          Authentic Customer Reviews &amp; <span className={styles.highlight}>5.0-Star Ratings</span>
        </h1>
        <p className={styles.heroSubtitle}>
          Verified feedback from homeowners and businesses across West Jordan and Salt Lake County.
        </p>
      </div>
    </div>
  );
}
