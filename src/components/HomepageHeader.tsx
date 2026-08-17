"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useDeviceDetection } from "../hooks/useDeviceDetection";
import { trackLeadEvent, trackPhoneClick } from "@/lib/analytics";
import styles from "./HomepageHeader.module.css";

export default function HomepageHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLandscapePhone, setIsLandscapePhone] = useState(false);
  const { nestHub, nestHubMax } = useDeviceDetection();

  useEffect(() => {
    if (menuOpen) {
      document.body.classList.add('mobile-menu-open');
    } else {
      document.body.classList.remove('mobile-menu-open');
    }
  }, [menuOpen]);

  useEffect(() => {
    const detectLandscapePhone = () => {
      const matchesPhoneLandscape =
        window.matchMedia('(orientation: landscape)').matches &&
        window.innerHeight > 0 &&
        window.innerWidth / window.innerHeight >= 1.8 &&
        window.innerHeight <= 800;

      if (matchesPhoneLandscape) {
        document.body.classList.add('android-landscape-phone');
      } else {
        document.body.classList.remove('android-landscape-phone');
      }

      setIsLandscapePhone(matchesPhoneLandscape);
    };

    detectLandscapePhone();
    window.addEventListener('resize', detectLandscapePhone);

    return () => {
      window.removeEventListener('resize', detectLandscapePhone);
      document.body.classList.remove('android-landscape-phone');
    };
  }, []);

  return (
    <div className={`${styles.whitestripeWrap} ${nestHubMax ? styles.whitestripeWrapNesthubMax : ''} w-full flex justify-center bg-transparent absolute left-0 z-20`}>
      <div className={`${styles.whitestripeImageWrap} ${nestHubMax ? styles.whitestripeImageWrapNesthubMax : ''}`}>
        <Image
          src="/images/homepage/White-stripe.png"
          alt="White stripe"
          fill
          sizes="100vw"
          priority
          className={styles.whitestripeImage}
        />
      </div>
      <Link href="/">
        <div className={`${styles.van2ImageWrap} ${nestHub ? styles.van2ImageWrapNesthub : ''} ${nestHubMax ? styles.van2ImageWrapNesthubMax : ''}`}>
          <Image
            src="/images/homepage/van2.png"
            alt="Van 2"
            fill
            sizes="(max-width: 480px) 120px, (max-width: 1024px) 160px, 220px"
            className={styles.van2Image}
            priority
          />
        </div>
      </Link>
      <div className={styles.whitestripeOverlay}>
        <div className={styles.whitestripeContent}>
          <div className={styles.whitestripeInner}>
            <div className={`${styles.desktopOnly} ${isLandscapePhone ? styles.forceHideDesktop : ''}`}>
              <nav className={`${styles.headermenuNavDesktop} ${nestHub ? styles.headermenuNavNesthub : ''} ${nestHubMax ? styles.headermenuNavNesthubMax : ''}`} data-label="MainNavigation">
                <Link href="/" className={styles.headermenuLink} data-label="NavHome">Home</Link>
                <Link href="/about" className={styles.headermenuLink} data-label="NavAbout">About</Link>
                <Link href="/services" className={styles.headermenuLink} data-label="NavServices">Services</Link>
                <Link href="/service-areas" className={styles.headermenuLink} data-label="NavServiceAreas">Service Areas</Link>
                <Link href="/projects" className={styles.headermenuLink} data-label="NavProjects">Projects</Link>
                <Link href="/reviews" className={styles.headermenuLink} data-label="NavReviews">Reviews</Link>
                <Link href="/contact" className={styles.headermenuLink} data-label="NavContact">Contact</Link>
              </nav>
              <div className={`${styles.headerbuttonsDesktop} ${nestHub ? styles.headerbuttonsDesktopNesthub : ''} ${nestHubMax ? styles.headerbuttonsDesktopNesthubMax : ''}`}>
                <a data-label="CallButton" href="tel:801-755-3040" onClick={() => trackPhoneClick("/")} className={`${styles.headerbuttonsButton} ${nestHub ? styles.headerbuttonsButtonNesthub : ''} ${nestHubMax ? styles.headerbuttonsButtonNesthubMax : ''}`}>
                  <span className={styles.callButtonTop}>Text/Call now</span>
                  <span className={styles.callButtonBottom}>801-755-3040</span>
                </a>
                <Link data-label="EstimateButton" href="/book" onClick={() => trackLeadEvent("click_hvac_pro_booking", { source: "homepage" })} className={`${styles.headerbuttonsButton} ${nestHub ? styles.headerbuttonsButtonNesthub : ''} ${nestHubMax ? styles.headerbuttonsButtonNesthubMax : ''}`}>
                  <span className={styles.estimateButtonTop}>Request a</span>
                  <span className={styles.estimateButtonBottom}>free Estimate</span>
                </Link>
                <Link
                  data-label="FinancingButton"
                  href="/financing"
                  onClick={() => trackLeadEvent("click_financing_prequal", { source: "homepage" })}
                  className={`${styles.headerbuttonsButton} ${nestHub ? styles.headerbuttonsButtonNesthub : ''} ${nestHubMax ? styles.headerbuttonsButtonNesthubMax : ''}`}
                  aria-label="Apply for financing"
                >
                  <span className={styles.financingButtonTop}>Apply for</span>
                  <span className={styles.financingButtonBottom}>Financing</span>
                </Link>
              </div>
            </div>
            <div className={`${styles.mobileOnly} ${isLandscapePhone ? styles.forceShowMobile : ''}`}>
              <a
                data-label="CallButtonMobileHeader"
                href="tel:801-755-3040"
                onClick={() => trackPhoneClick("/")}
                className={styles.mobileHeaderCallButton}
              >
                <span>Call/Text now</span>
                <span>801-755-3040</span>
              </a>

              <button
                data-label="HamburgerMenu"
                className={`${styles.headermenuToggle} ${isLandscapePhone ? styles.forceLandscapeHamburger : ''}`}
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Toggle menu"
                aria-expanded={menuOpen}
              >
                <span className={styles.headermenuLine}></span>
                <span className={styles.headermenuLine}></span>
                <span className={styles.headermenuLine}></span>
                <span className={styles.headermenuLabel}>Menu</span>
              </button>
              <nav className={`${styles.headermenuNavMobile} ${menuOpen ? styles.headermenuOpen : ""}`} data-label="MainNavigationMobile">
                <Link href="/book" className={styles.headermenuLink} data-label="NavEstimateMobile">Request a free Estimate</Link>
                <Link href="/financing" className={styles.headermenuLink} data-label="NavFinancingMobile">Apply For Financing</Link>
                <Link href="/" className={styles.headermenuLink} data-label="NavHomeMobile">Home</Link>
                <Link href="/about" className={styles.headermenuLink} data-label="NavAboutMobile">About</Link>
                <Link href="/services" className={styles.headermenuLink} data-label="NavServicesMobile">Services</Link>
                <Link href="/service-areas" className={styles.headermenuLink} data-label="NavServiceAreasMobile">Service Areas</Link>
                <Link href="/projects" className={styles.headermenuLink} data-label="NavProjectsMobile">Projects</Link>
                <Link href="/reviews" className={styles.headermenuLink} data-label="NavReviewsMobile">Reviews</Link>
                <Link href="/contact" className={styles.headermenuLink} data-label="NavContactMobile">Contact</Link>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
