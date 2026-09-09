import Link from "next/link";
import styles from "./HomepageSubtitle.module.css";

export default function HomepageSubtitle() {
  return (
    <div className={styles.thenSubtitle}>
      Then, installing cooling and heating units in <Link href="/service-areas">Salt Lake County and surrounding areas</Link>.
    </div>
  );
}
