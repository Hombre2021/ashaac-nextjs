import Image from "next/image";
import Link from "next/link";
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
              sizes="100vw"
              className={styles.doubleFurnaceWestJordanImage}
            />
          </div>
          <div className={styles.featureDescription}>
            <Link href="/services/west-jordan/furnace-installation">Such as double or single furnace Installation and replacement.</Link>
          </div>
        </div>
        <div className={styles.featureColumn}>
          <div className={styles.doubleAcCondenserWrap}>
            <Image
              src="/images/homepage/double-ac-condenser.webp"
              alt="Double AC Condenser"
              fill
              sizes="100vw"
              className={styles.doubleAcCondenserImage}
            />
          </div>
          <div className={styles.featureDescription}>
            <Link href="/services/west-jordan/ac-installation">single or double AC units or Heat pumps.</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
