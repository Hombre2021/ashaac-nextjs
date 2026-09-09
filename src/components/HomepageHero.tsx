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
        sizes="100vw"
        className={styles.commercialImage}
        priority
      />

      <div className={styles.heroContent}>
        <p className={styles.eyebrow}>All Solutions Heating and Air Conditioning</p>
        <h1 className={styles.welcomeTitle} data-label="HeroMainTitle">
          Mobile HVAC Repair, Installation &amp; Maintenance in West Jordan &amp; Salt Lake County
        </h1>
        <p className={styles.professionalSubtitle} data-label="HeroSubtitle">
          Prompt on-site heating and cooling services for homeowners in West Jordan, South Jordan, Riverton, Herriman, Sandy, Draper, Taylorsville, Murray, Midvale, and Salt Lake City.
        </p>
        <div className={styles.heroActions} data-label="HeroActionButtons">
          <a className={styles.callAction} href="tel:8017553040">Call 801-755-3040</a>
          {" "}
          <Link className={styles.bookAction} href="/book">Request an Appointment</Link>
        </div>
        <p className={styles.trustSignal}>⭐⭐⭐⭐⭐ 5.0 Google Rating · 100% Mobile Service Dispatched Across Salt Lake County</p>
      </div>
    </div>
  );
}
