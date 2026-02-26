import ContactButtons from "./ContactButtons";
import { googleReviewUrl } from "@/lib/seo";
import styles from "./ContactContent.module.css";

export default function ContactContent() {
  return (
    <section className={styles.contactSection}>
      <ContactButtons phoneAriaLabel="Text or call 801-755-3040 or 801-512-7103 from Contact page" />

      <div className={styles.mapCard}>
        <h2 className={styles.mapTitle}>Find Us in West Jordan</h2>
        <p className={styles.mapText}>
          We serve West Jordan and surrounding Salt Lake County cities. Use the map below for directions.
        </p>
        <div className={styles.mapWrap}>
          <iframe
            title="All Solutions Heating and Air Conditioning location map"
            src="https://www.google.com/maps?q=4434%20W%208790%20S%20West%20Jordan%20UT%2084088&output=embed"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>

      <div className={styles.reviewCard}>
        <h3 className={styles.reviewTitle}>See What Customers Are Saying</h3>
        <a
          href={googleReviewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.reviewButton}
          aria-label="Read our Google customer reviews"
        >
          Read Google Reviews
        </a>
      </div>
    </section>
  );
}
