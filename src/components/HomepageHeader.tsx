"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useDeviceDetection } from "../hooks/useDeviceDetection";
import { useResponsiveFlags } from '../hooks/useResponsiveFlags';
import { BREAKPOINTS_PX } from '../constants/responsive';
import styles from "./HomepageHeader.module.css";

export default function HomepageHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isLandscapePhone, isCompactLaptop, isMobileRender } = useResponsiveFlags({
    portraitMobileMaxWidth: BREAKPOINTS_PX.MOBILE_LANDSCAPE_MAX,
    syncLandscapeBodyClass: true,
  });
  const { nestHub, nestHubMax } = useDeviceDetection();

  useEffect(() => {
    if (menuOpen) {
      document.body.classList.add('mobile-menu-open');
    } else {
      document.body.classList.remove('mobile-menu-open');
    }
  }, [menuOpen]);

  return (
    <div className={`${styles.whitestripeWrap} ${nestHubMax ? styles.whitestripeWrapNesthubMax : ''} w-full flex justify-center bg-transparent absolute left-0 z-20`}>
      <div className={`${styles.whitestripeImageWrap} ${nestHubMax ? styles.whitestripeImageWrapNesthubMax : ''}`}>
        <Image
          src="/images/homepage/White-stripe.png"
          alt="White stripe"
          fill
          sizes="(max-width: 480px) 95vw, (max-width: 1024px) 90vw, 80vw"
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
          />
        </div>
      </Link>
      <div className={styles.whitestripeOverlay}>
        <div className={styles.whitestripeContent}>
          <div className={styles.whitestripeInner}>
            {!isMobileRender ? (
            <div className={styles.desktopOnly}>
              <nav className={`${styles.headermenuNavDesktop} ${nestHub ? styles.headermenuNavNesthub : ''} ${nestHubMax ? styles.headermenuNavNesthubMax : ''}`} data-label="MainNavigation">
                <Link href="/" className={styles.headermenuLink} data-label="NavHome">Home</Link>
                <Link href="/about" className={styles.headermenuLink} data-label="NavAbout">About</Link>
                <Link href="/services" className={styles.headermenuLink} data-label="NavServices">Services</Link>
                <Link href="/projects" className={styles.headermenuLink} data-label="NavProjects">Projects</Link>
                <Link href="/reviews" className={styles.headermenuLink} data-label="NavReviews">Reviews</Link>
                <Link href="/contact" className={styles.headermenuLink} data-label="NavContact">Contact</Link>
              </nav>
              <div className={`${styles.headerbuttonsDesktop} ${nestHub ? styles.headerbuttonsDesktopNesthub : ''} ${nestHubMax ? styles.headerbuttonsDesktopNesthubMax : ''}`}>
                <a data-label="CallButton" href="tel:801-755-3040" className={`${styles.headerbuttonsButton} ${nestHub ? styles.headerbuttonsButtonNesthub : ''} ${nestHubMax ? styles.headerbuttonsButtonNesthubMax : ''}`}>
                  {isCompactLaptop ? (
                    <span className={styles.compactButtonLabel}>Call/Text</span>
                  ) : (
                    <>
                      <span className={styles.callButtonTop}>Text/Call now</span>
                      <span className={styles.callButtonBottom}>801-755-3040</span>
                    </>
                  )}
                </a>
                <a data-label="EstimateButton" href="https://calendly.com/ashaacutah/30min?month=2026-02&_gl=1%2A1owpxfg%2A_ga%2AODYzMjgyOTI3LjE3NTIyODkwNzY.%2A_ga_WNKN6Z7Y46%2AczE3NzA2ODU3ODIkbzU3JGcxJHQxNzcwNjg1NzgyJGo2MCRsMCRoMA.." target="_blank" rel="noopener noreferrer" className={`${styles.headerbuttonsButton} ${nestHub ? styles.headerbuttonsButtonNesthub : ''} ${nestHubMax ? styles.headerbuttonsButtonNesthubMax : ''}`}>
                  {isCompactLaptop ? (
                    <span className={styles.compactButtonLabel}>Estimate</span>
                  ) : (
                    <>
                      <span className={styles.estimateButtonTop}>Request a</span>
                      <span className={styles.estimateButtonBottom}>free Estimate</span>
                    </>
                  )}
                </a>
                <Link
                  data-label="FinancingButton"
                  href="/financing"
                  className={`${styles.headerbuttonsButton} ${nestHub ? styles.headerbuttonsButtonNesthub : ''} ${nestHubMax ? styles.headerbuttonsButtonNesthubMax : ''}`}
                  aria-label="Apply for financing"
                >
                  {isCompactLaptop ? (
                    <span className={styles.compactButtonLabel}>Financing</span>
                  ) : (
                    <>
                      <span className={styles.financingButtonTop}>Apply for</span>
                      <span className={styles.financingButtonBottom}>Financing</span>
                    </>
                  )}
                </Link>
                <Link
                  data-label="DIYHelpButton"
                  href="/diy-help-center"
                  className={`${styles.headerbuttonsButton} ${nestHub ? styles.headerbuttonsButtonNesthub : ''} ${nestHubMax ? styles.headerbuttonsButtonNesthubMax : ''}`}
                  aria-label="Open DIY Help Center"
                >
                  {isCompactLaptop ? (
                    <span className={styles.compactButtonLabel}>DIY Help</span>
                  ) : (
                    <>
                      <span className={styles.diyHelpButtonTop}>DIY Help</span>
                      <span className={styles.diyHelpButtonBottom}>Center</span>
                    </>
                  )}
                </Link>
              </div>
            </div>
            ) : (
            <div className={styles.mobileOnly}>
              <a
                data-label="CallButtonMobileHeader"
                href="tel:801-755-3040"
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
                <a href="https://calendly.com/ashaacutah/30min?month=2026-02&_gl=1%2A1owpxfg%2A_ga%2AODYzMjgyOTI3LjE3NTIyODkwNzY.%2A_ga_WNKN6Z7Y46%2AczE3NzA2ODU3ODIkbzU3JGcxJHQxNzcwNjg1NzgyJGo2MCRsMCRoMA.." target="_blank" rel="noopener noreferrer" className={styles.headermenuLink} data-label="NavEstimateMobile">Request a free Estimate</a>
                <Link href="/financing" className={styles.headermenuLink} data-label="NavFinancingMobile">Apply For Financing</Link>
                <Link href="/" className={styles.headermenuLink} data-label="NavHomeMobile">Home</Link>
                <Link href="/about" className={styles.headermenuLink} data-label="NavAboutMobile">About</Link>
                <Link href="/services" className={styles.headermenuLink} data-label="NavServicesMobile">Services</Link>
                <Link href="/projects" className={styles.headermenuLink} data-label="NavProjectsMobile">Projects</Link>
                <Link href="/reviews" className={styles.headermenuLink} data-label="NavReviewsMobile">Reviews</Link>
                <Link href="/diy-help-center" className={styles.headermenuLink} data-label="NavDIYHelpMobile">DIY Help Center</Link>
                <Link href="/contact" className={styles.headermenuLink} data-label="NavContactMobile">Contact</Link>
              </nav>
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
