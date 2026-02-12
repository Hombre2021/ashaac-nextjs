import Image from "next/image";
import styles from "./HomepageDualFeature.module.css";

export default function HomepageDualFeature() {
  return (
    <section className={styles.dualFeatureSection}>
      <div className={styles.dualFeatureContent}>
        <div className={styles.featureColumn}>
          <Image
            src="/images/homepage/double-furnace-west-jordan.webp"
            alt="Double Furnace West Jordan"
            width={350}
            height={260}
            className={styles.featureImage}
            priority
          />
          <div className={styles.featureDescription}>
            Such as double or single furnace Installation and replacement.
          </div>
        </div>
        <div className={styles.featureColumn}>
          <Image
            src="/images/homepage/heat-pump-cottonwood.webp"
            alt="Heat Pump Cottonwood"
            width={350}
            height={260}
            className={styles.featureImage}
            priority
          />
          <div className={styles.featureDescription}>
            On the other hand. Air Conditioning (AC) Units and Heat Pumps
          </div>
        </div>
      </div>
    </section>
  );
}
