import Image from 'next/image';
import styles from './HomepageHero.module.css';

export default function HomepageHero() {
  return (
    <div className={styles.heroContainer}>
      <Image
        src="/images/homepage/commercial.jpg"
        alt="Commercial Background"
        fill
        style={{ objectFit: 'cover' }}
        priority
      />

      <div className={styles.heroTitle}>
        Welcome to All Solutions Heating and Air Conditioning
      </div>

<div className={styles.heroLeftTitle} style={{ top: 'calc(10% + 3.0em)', left: '67%', transform: 'translateX(-50%)', position: 'absolute', textAlign: 'center' }}>
  <div style={{ fontSize: '1.62rem' }}>Install a complete HVAC system.</div>
  <div style={{ fontSize: '1.62rem' }}>0% interest for 24 months!</div>
</div>
Dial. 
      <div className={styles.heroSubtitle}>
        Professional installation and top-quality repairs in West Jordan and Salt Lake County, Utah
      </div>

      <div className={styles.heroActionButtons}>
        <button className={styles.heroRedButton}>Hablamos Español</button>
      </div>

      {/* ⭐ BADGE LAYER — must be OUTSIDE heroManOverlay */}
      <div className={styles.badgeLayer}>
        <a href="https://www.google.com/search?q=all+solutions+Heating+And+Air+Conditioning+google+reviews&rlz=1C1VDKB_enUS1136US1136&oq=all+solutions+Heating+And+Air+Conditioning+google+reviews&gs_lcrp=EgZjaHJvbWUyBggAEEUYOTIHCAEQIRigATIHCAIQIRigATIHCAMQIRigATIHCAQQIRigAdIBCTEyOTM0ajBqNKgCALACAA&sourceid=chrome&ie=UTF-8" target="_blank" rel="noopener noreferrer">
          <img
            src="/images/homepage/Google-fivestar.png"
            className={`${styles.badgeOverlay} ${styles.googleFivestar}`}
            alt="Google Fivestar"
          />
        </a>

        <a href="https://www.bbb.org/us/ut/west-jordan/profile/heating-and-air-conditioning/all-solutions-heating-and-air-conditioning-llc-1166-90042709" target="_blank" rel="noopener noreferrer">
          <img
            src="/images/homepage/bbb-accredited.png"
            className={`${styles.badgeOverlay} ${styles.bbbAccredited}`}
            alt="BBB Accredited"
          />
        </a>

        <a href="https://www.google.com/search?q=All+Solutions+Heating+And+Air+Conditioning&rlz=1C1VDKB_enUS1136US1136&oq=all+&gs_lcrp=EgZjaHJvbWUqBggBEEUYOzIGCAAQRRg5MgYIARBFGDsyBggCEEUYOzIGCAMQRRg7MgYIBBBFGD0yBggFEEUYPTIGCAYQRRg9MgYIBxBFGEHSAQgyODQ2ajBqNKgCALACAA&sourceid=chrome&ie=UTF-8" target="_blank" rel="noopener noreferrer">
          <img
            src="/images/homepage/Google-verified.png"
            className={`${styles.badgeOverlay} ${styles.googleVerified}`}
            alt="Google Verified"
          />
        </a>
      </div>
      {/* ⭐ END BADGE LAYER */}

      {/* HERO MAN — must stay LAST so it never covers badges */}
      <div className={`${styles.overlayImage} ${styles.heroManOverlay}`}>
        <Image
          src="/images/homepage/hero-man.png"
          alt="Hero Man"
          width={443}
          height={620}
          priority
        />

        <div className={styles.heroLeftTitle}>
          Because at All Solutions Heating & AC, Trust, Honesty and Quality are our priority!
        </div>
      </div>
    </div>
  );
}