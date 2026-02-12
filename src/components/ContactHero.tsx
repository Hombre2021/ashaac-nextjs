import Image from "next/image";
import styles from "./ContactHero.module.css";

export default function ContactHero() {
  return (
    <div className={styles.heroContainer}>
      <Image
        src="/images/homepage/living-room.png"
        alt="Living Room Background"
        fill
        className={styles.heroBg}
        style={{ objectFit: "cover", objectPosition: "center bottom" }}
        loading="eager"
      />

      <div className={styles.blueOverlay} />

      <h1 className={styles.heroTitle}>Contact Us</h1>

      <div className={styles.redButtonGroupHorizontal}>
        <a
          className={styles.redButton}
          href="mailto:ashaacutah@gmail.com"
          aria-label="Email us at ashaacutah@gmail.com from Contact page"
        >
          Email us at: ashaacutah@gmail.com
        </a>

        <a
          className={styles.redButton}
          href="tel:8017553040"
          aria-label="Text or call 801-755-3040 from Contact page"
        >
          Text or call: 801-755-3040
        </a>

        <a
          className={styles.redButton}
          href="https://ashaac.com/book-appointment"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Book your appointment now from Contact page"
        >
          Book your appointment now!
        </a>
      </div>
    </div>
  );
}