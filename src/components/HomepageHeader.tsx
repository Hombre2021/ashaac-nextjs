import Image from "next/image";
import Link from "next/link";
import styles from "./HomepageHeader.module.css";

export default function HomepageHeader() {
  return (
    <div style={{ top: 24 }} className="w-full flex justify-center bg-transparent absolute left-0 z-20">
      <img
        src="/images/homepage/White-stripe.png"
        alt="White stripe"
        style={{ width: 'calc(100% - 160px)', height: 100, maxHeight: 100, position: 'absolute', top: 0, left: 0, right: 0, margin: '0 auto', zIndex: 1 }}
      />
      <Link href="/your-target-url">
        <img
          src="/images/homepage/van2.png"
          alt="Van 2"
          className={styles.vanLogo}
        />
      </Link>
      <div className={styles.whiteStripeOverlay}>
        <div className={styles.whiteStripeContent}>
          <div className={styles.whiteStripeInner}>
            <nav className={styles.whiteStripeNav}>
              <Link href="/" className={styles.whiteStripeLink}>Home</Link>
              <Link href="/about" className={styles.whiteStripeLink}>About</Link>
              <Link href="/services" className={styles.whiteStripeLink}>Services</Link>
              <Link href="/reviews" className={styles.whiteStripeLink}>Reviews</Link>
              <Link href="/contact" className={styles.whiteStripeLink}>Contact</Link>
            </nav>
            <div className={styles.whiteStripeButtons}>
              {/* Call/text now 801-755-3040 button */}
              <a href="tel:801-755-3040" className={styles.callWhiteStripeButton} style={{ background: '#d32f2f', color: '#fff', fontWeight: 'bold', borderRadius: 8, padding: '18px 18px', fontSize: '1.25rem', textDecoration: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', display: 'inline-block', lineHeight: 1.6 }}>Call/text now 801-755-3040</a>
              {/* Request a free Estimate button */}
              <a href="https://calendly.com/ashaacutah/30min?month=2026-02&_gl=1%2A1owpxfg%2A_ga%2AODYzMjgyOTI3LjE3NTIyODkwNzY.%2A_ga_WNKN6Z7Y46%2AczE3NzA2ODU3ODIkbzU3JGcxJHQxNzcwNjg1NzgyJGo2MCRsMCRoMA.." target="_blank" rel="noopener noreferrer" className={styles.requestWhiteStripeButton} style={{ background: '#d32f2f', color: '#fff', fontWeight: 'bold', borderRadius: 8, padding: '18px 18px', fontSize: '1.25rem', textDecoration: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', display: 'inline-block', lineHeight: 1.6 }}>Request a free Estimate</a>
              {/* Apply For Financing button */}
                <Link
                  href="/financing"
                  className={styles.applyWhiteStripeButton}
                  style={{ background: '#d32f2f', color: '#fff', fontWeight: 'bold', borderRadius: 8, padding: '18px 18px', fontSize: '1.25rem', textDecoration: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', display: 'inline-block', lineHeight: 1.6 }}
                  aria-label="Apply for financing"
                >
                  Apply For Financing
                </Link>
              {/* Apply For Financing button moved below */}
              {/* Hablamos Español button moved below */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
