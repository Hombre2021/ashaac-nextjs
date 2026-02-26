
"use client";
import Link from "next/link";
import Image from "next/image";
import styles from "./HomepageFooter.module.css";
import { useState } from "react";


export default function HomepageFooter() {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText("https://ashaac.com");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };
  return (
    <footer className={styles.footerContainer}>
      <div className={styles.footerTop}>
        <div className={styles.logoAndMotto}>
          <div className={styles.van2ImageWrap}>
            <Image src="/images/homepage/van2.png" alt="Van 2" fill sizes="120px" className={styles.van2Image} />
          </div>
          <div className={styles.motto}>
            AFFORDABLE, EFFICIENT, RELIABLE. YOUR SATISFACTION IS OUR BUSINESS
          </div>
        </div>
        <div className={styles.shareSection}>
          <button className={styles.shareTitle} onClick={handleCopy} title="Copy ashaac.com to clipboard">
            Share this website with your friends
          </button>
          {copied && <span className={styles.copiedMsg}>Link copied!</span>}
        </div>
      </div>
      <div className={styles.footerLinksRow} data-label="FooterLinksRow">
        <div className={styles.footerLinksCol} data-label="QuickLinksCol">
          <div className={styles.footerLinksTitle} data-label="QuickLinksTitle">Quick Link</div>
          <Link href="/about" data-label="LinkAbout">About Us</Link>
          <Link href="/services" data-label="LinkServices">Services</Link>
          <Link href="/emergency-hvac-repair" data-label="LinkEmergency">Emergency HVAC Repair</Link>
          <Link href="/service-areas" data-label="LinkServiceAreas">Service Areas</Link>
          <Link href="/diy-help-center" data-label="LinkDIYHelp">DIY Help Center</Link>
          <Link href="/projects" data-label="LinkProjects">Projects</Link>
          <Link href="/reviews" data-label="LinkReviews">Reviews</Link>
          <Link href="/contact" data-label="LinkContact">Contact Us</Link>
        </div>
        <div className={styles.footerLinksCol} data-label="UsefulLinksCol">
          <div className={styles.footerLinksTitle} data-label="UsefulLinksTitle">Useful links</div>
          <Link href="/privacy-policy" data-label="LinkPrivacy">Privacy Policy</Link>
          <Link href="/terms-and-conditions" data-label="LinkTerms">Terms and Conditions</Link>
          <Link href="/faqs" data-label="LinkFAQ">FAQ&apos;s</Link>
          <Link href="/valley" data-label="LinkValley">Salt Lake Valley Map</Link>
          <Link href="/legal-policies" data-label="LinkLegal">Legal Policies &amp; Customer Rights</Link>
        </div>
        <div className={styles.footerLinksCol} data-label="ContactCol">
          <div className={styles.footerLinksTitle} data-label="ContactTitle">Contact Us</div>
          <a href="tel:801-512-7103" data-label="Phone1">801-512-7103</a>
          <a href="tel:801-755-3040" data-label="Phone2">801-755-3040</a>
          <a href="mailto:ashaacutah@gmail.com" data-label="EmailLink">ashaacutah@gmail.com</a>
          <div data-label="Address">4434 W 8790 S West Jordan,<br />Utah</div>
        </div>
      </div>
      <div className={styles.footerCopyright}>
        © Copyright 2023 ASHAAC.COM. All Right Reserved.
      </div>
    </footer>
  );
}
