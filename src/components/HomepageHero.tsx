import Image from 'next/image';
import Link from 'next/link';
import styles from './HomepageHero.module.css';

export default function HomepageHero() {
  return (
    <div className={styles.heroWrap}>
      <Image
        src="/images/homepage/commercial.jpg"
        alt="All Solutions Heating and Air Conditioning Mobile HVAC Van and Equipment"
        fill
        sizes="(max-width: 768px) 100vw, 1920px"
        fetchPriority="high"
        className={styles.commercialImage}
        priority
      />

      <div className={styles.heroContent}>
        <p className={styles.eyebrow}>All Solutions Heating and Air Conditioning</p>
        <h1 className={styles.welcomeTitle} data-label="HeroMainTitle">
          24/7 Furnace Repair &amp; HVAC Installation in West Jordan &amp; Salt Lake County
        </h1>
        <p className={styles.professionalSubtitle} data-label="HeroSubtitle">
          24/7 emergency furnace repair, heating system repairs, and precision AC services for homeowners in West Jordan, South Jordan, Riverton, Herriman, Sandy, Draper, Taylorsville, Murray, Midvale, Kearns, and Salt Lake City.
        </p>
        <div className={styles.heroActions} data-label="HeroActionButtons">
          <a className={styles.callAction} href="tel:8017553040">Call 801-755-3040</a>
          {" "}
          <Link className={styles.bookAction} href="/book">Request an Appointment</Link>
        </div>
        <p className={styles.trustSignal}>⭐⭐⭐⭐⭐ 5.0 Google Rating · 24/7 Rapid Mobile Dispatch Across Salt Lake County</p>
      </div>
    </div>
  );
}
