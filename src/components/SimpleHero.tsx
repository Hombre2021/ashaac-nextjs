import Image from "next/image";
import styles from "./SimpleHero.module.css";

type SimpleHeroProps = {
  title: string;
  subtitle?: string;
};

export default function SimpleHero({ title, subtitle }: SimpleHeroProps) {
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
      <h1 className={styles.heroTitle} data-label="HeroTitle">{title}</h1>
      {subtitle && <div className={styles.heroSubtitle} data-label="HeroSubtitle">{subtitle}</div>}
    </div>
  );
}
