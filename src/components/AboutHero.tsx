import Image from "next/image";
import styles from "./AboutHero.module.css";

export default function AboutHero({ title = "About us" }) {
  return (
    <div className={styles.heroContainer}>
      <Image
        src="/images/homepage/living-room.png"
        alt="Living Room Background"
        fill
        style={{ objectFit: "cover", objectPosition: "center bottom" }}
        priority
        className={styles.heroBg}
      />
      <div className={styles.blueOverlay} />
      <div className={styles.heroTitle}>{title}</div>
    </div>
  );
}
