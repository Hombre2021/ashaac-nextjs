import Image from "next/image";
import styles from "./ServicesHero.module.css";

export default function ServicesHero() {
  return (
    <div className={styles.heroContainer}>
      <Image
        src="/images/homepage/living-room.png"
        alt="Living Room Background"
        fill
        style={{ objectFit: "cover", objectPosition: "center bottom" }}
        loading="eager"
        className={styles.heroBg}
      />
      <div className={styles.blueOverlay} />
      <div className={styles.heroTitle}>Services</div>
      <div className={styles.heroSubtitle}>
        West Jordan, Utah's Repair, Installation and Maintenance Home Services
      </div>
    </div>
  );
}
