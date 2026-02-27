import Image from "next/image";
import styles from "./AboutHero.module.css";

interface AboutHeroProps {
  title?: string;
  backgroundSrc?: string;
  backgroundAlt?: string;
}

export default function AboutHero({
  title = "About us",
  backgroundSrc = "/images/homepage/living-room.png",
  backgroundAlt = "Living Room Background",
}: AboutHeroProps) {
  return (
    <div className={styles.heroContainer} data-label="AboutHeroSection">
      <Image
        src={backgroundSrc}
        alt={backgroundAlt}
        fill
        style={{ objectFit: "cover", objectPosition: "center bottom" }}
        priority
        className={styles.heroBg}
      />
      <div className={styles.blueOverlay} />
      <div className={styles.heroTitle} data-label="AboutHeroTitle">{title}</div>
    </div>
  );
}
