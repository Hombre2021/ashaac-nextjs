import Image from "next/image";
import styles from "./ContactHero.module.css";

export default function ContactHero() {
  return (
    <div className={styles.heroContainer} data-label="ContactHeroSection">
      <Image
        src="/images/homepage/living-room.png"
        alt="Living Room Background"
        fill
        className={styles.heroBg}
        style={{ objectFit: "cover", objectPosition: "center bottom" }}
        loading="eager"
      />

      <div className={styles.blueOverlay} />

      <h1 className={styles.heroTitle} data-label="ContactHeroTitle">Contact Us</h1>

    </div>
  );
}