import Link from "next/link";
import styles from "./HomepageMoreTestimonials.module.css";

export default function HomepageMoreTestimonials() {
  return (
    <div className={styles.moreTestimonialsContainer}>
      <Link href="https://www.google.com/search?q=All+Solutions+Heating+and+Air+Conditioning+Utah+reviews" target="_blank" rel="noopener noreferrer" className={styles.moreTestimonialsLink}>
        More testimonials on Google Reviews
      </Link>
    </div>
  );
}
