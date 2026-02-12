import Image from "next/image";
import styles from "./ReviewsHero.module.css";

export default function ReviewsHero() {
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
      <div className={styles.heroTitle}>Reviews</div>
    </div>
  );
}
