import Image from 'next/image';
import Link from 'next/link';
import styles from './HomepageHero.module.css';

export default function HomepageHero() {
  return (
    <div className={styles.heroWrap}>
      <Image
        src="/images/homepage/commercial.jpg"
        alt="Commercial Background"
        fill
        sizes="100vw"
        className={styles.commercialImage}
        priority
      />

      <div className={styles.heroContent}>
        <p className={styles.eyebrow}>All Solutions Heating and Air Conditioning</p>
        <h2 className={styles.welcomeTitle} data-label="HeroMainTitle">
          HVAC Repair, Installation, and Maintenance in West Jordan
        </h2>
        <p className={styles.professionalSubtitle} data-label="HeroSubtitle">
          Straightforward HVAC help for homeowners in West Jordan, South Jordan, and Riverton.
        </p>
        <div className={styles.heroActions} data-label="HeroActionButtons">
          <a className={styles.callAction} href="tel:8017553040">Call 801-755-3040</a>
          <Link className={styles.bookAction} href="/book">Request a callback</Link>
        </div>
        <p className={styles.trustSignal}>5.0 Google rating from local customers · Serving West Jordan, South Jordan, and Riverton</p>
      </div>
    </div>
  );
}