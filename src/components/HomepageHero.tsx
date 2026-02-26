'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useResponsiveFlags } from '../hooks/useResponsiveFlags';
import { BREAKPOINTS_PX } from '../constants/responsive';
import styles from './HomepageHero.module.css';

export default function HomepageHero() {
  const { isLandscapePhone, isMobileRender } = useResponsiveFlags({
    portraitMobileMaxWidth: BREAKPOINTS_PX.MOBILE_LANDSCAPE_MAX,
    syncLandscapeBodyClass: false,
  });

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

      <div className={styles.welcomeTitle} data-label="HeroMainTitle">
        Welcome to All Solutions Heating and Air Conditioning
      </div>

      <div className={styles.installTagline}>
        <div className={styles.installLine}>Install a complete HVAC system.</div>
        <Link href="/financing" className={styles.zeroInterestLink} aria-label="Learn about 0% financing options">
          <span className={styles.zeroInterestLine}>0% interest for 24 months!</span>
        </Link>
      </div>

      <div className={styles.professionalSubtitle} data-label="HeroSubtitle">
        Professional installation and top-quality repairs in West Jordan and Salt Lake County, Utah
      </div>

      {(!isMobileRender || isLandscapePhone) && (
        <div className={styles.hablamosWrap} data-label="HeroActionButtons">
          <button className={styles.hablamosEspbutton} data-label="SpanishButton">
            Hablamos Español
          </button>
        </div>
      )}

      {/* ⭐ BADGE LAYER — must be OUTSIDE heroManOverlay */}
      <div className={styles.badgeLayer} data-label="BadgesSection">
        <a
          href="https://www.google.com/search?q=all+solutions+Heating+And+Air+Conditioning+google+reviews&rlz=1C1VDKB_enUS1136US1136&oq=all+solutions+Heating+And+Air+Conditioning+google+reviews&gs_lcrp=EgZjaHJvbWUyBggAEEUYOTIHCAEQIRigATIHCAIQIRigATIHCAMQIRigATIHCAQQIRigAdIBCTEyOTM0ajBqNKgCALACAA&sourceid=chrome&ie=UTF-8"
          target="_blank"
          rel="noopener noreferrer"
          className={`${styles.badgeBase} ${styles.googleFivestarBadge}`}
          data-label="GoogleFivestarBadgeLink"
        >
          <Image
            src="/images/homepage/Google-fivestar.png"
            className={styles.badgeImage}
            alt="Google Fivestar"
            width={300}
            height={196}
            sizes="(max-width: 480px) 118px, 300px"
          />
        </a>

        <a
          href="https://www.bbb.org/us/ut/west-jordan/profile/heating-and-air-conditioning/all-solutions-heating-and-air-conditioning-llc-1166-90042709"
          target="_blank"
          rel="noopener noreferrer"
          className={`${styles.badgeBase} ${styles.bbbAccreditedBadge}`}
          data-label="BBBAccreditedLink"
        >
          <Image
            src="/images/homepage/bbb-accredited.png"
            className={styles.badgeImage}
            alt="BBB Accredited"
            width={300}
            height={195}
            sizes="(max-width: 480px) 118px, 300px"
          />
        </a>

        <a
          href="https://www.google.com/search?q=All+Solutions+Heating+And+Air+Conditioning&rlz=1C1VDKB_enUS1136US1136&oq=all+&gs_lcrp=EgZjaHJvbWUqBggBEEUYOzIGCAAQRRg5MgYIARBFGDsyBggCEEUYOzIGCAMQRRg7MgYIBBBFGD0yBggFEEUYPTIGCAYQRRg9MgYIBxBFGEHSAQgyODQ2ajBqNKgCALACAA&sourceid=chrome&ie=UTF-8"
          target="_blank"
          rel="noopener noreferrer"
          className={`${styles.badgeBase} ${styles.googleVerifiedBadge}`}
          data-label="GoogleVerifiedLink"
        >
          <Image
            src="/images/homepage/Google-verified.png"
            className={styles.badgeImage}
            alt="Google Verified"
            width={300}
            height={191}
            sizes="(max-width: 480px) 118px, 300px"
          />
        </a>
      </div>
      {/* ⭐ END BADGE LAYER */}

      {/* HERO MAN — must stay LAST so it never covers badges */}
      <div className={styles.heroManWrap} data-label="HeroManSection">
        <Image
          src="/images/homepage/hero-man.png"
          alt="Hero Man"
          fill
          sizes="(max-width: 480px) 100vw, (max-width: 1024px) 80vw, 60vw"
          className={styles.heroManImage}
        />

        {isMobileRender ? (
          <div className={styles.becauseTaglineMobile} data-label="HeroLeftTaglineMobile">
            Because at All Solutions<br />
            Heating and AC<br />
            Trust, Honesty and<br />
            Quality, are our priority
          </div>
        ) : (
          <div className={styles.becauseTagline} data-label="HeroLeftTaglineDesktop">
            <span className={styles.becauseLineTop}>Because at All Solutions Heating and AC, </span>
            <span className={styles.becauseLineBottom}>Trust, Honesty and Quality, are our priority!</span>
          </div>
        )}
      </div>
    </div>
  );
}