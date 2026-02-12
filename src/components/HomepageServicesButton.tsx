import Link from "next/link";
import styles from "./HomepageServicesButton.module.css";

export default function HomepageServicesButton() {
  return (
    <div className={styles.buttonContainer}>
      <Link href="/services">
        <button className={styles.redButton}>
          View All Services
        </button>
      </Link>
    </div>
  );
}
