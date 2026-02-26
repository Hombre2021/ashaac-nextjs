import Image from "next/image";
import styles from "./HomepageDualFeature.module.css";

export default function HomepageDualFeature() {
  return (
    <section className={styles.dualFeatureSection}>
      <div className={styles.dualFeatureContent}>
        <div className={styles.featureColumn}>
          <div className={styles.doubleFurnaceWestJordanWrap}>
            <Image
              src="/images/homepage/double-furnace-wj.png"
              alt="Double Furnace West Jordan"
              fill
              sizes="(max-width: 480px) 100vw, (max-width: 1024px) 50vw, 50vw"
              className={styles.doubleFurnaceWestJordanImage}
            />
          </div>
          <div className={styles.featureDescription}>
            Such as double or single furnace Installation and replacement.
          </div>
        </div>
        <div className={styles.featureColumn}>
          <div className={styles.doubleAcCondenserWrap}>
            <Image
              src="/images/homepage/double-ac-condenser.webp"
              alt="Double AC Condenser"
              fill
              sizes="(max-width: 480px) 100vw, (max-width: 1024px) 50vw, 50vw"
              className={styles.doubleAcCondenserImage}
            />
          </div>
          <div className={styles.featureDescription}>
            single or double AC units or Heat pumps.
          </div>
        </div>
      </div>
    </section>
  );
}
