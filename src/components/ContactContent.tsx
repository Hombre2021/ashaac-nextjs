import styles from "./ContactContent.module.css";

export default function ContactContent() {
  return (
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
          aria-label="Text or call 801-755-3040 or 801-512-7103 from Contact page"
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
  );
}
