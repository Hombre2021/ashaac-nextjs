
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
    } catch (err) {
      setCopied(false);
    }
  };
  return (
    <footer className={styles.footerContainer}>
      <div className={styles.footerTop}>
        <div className={styles.logoAndMotto}>
          <Image src="/images/homepage/van2.png" alt="Van 2" width={120} height={60} className={styles.logoFull} />
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
      <div className={styles.footerLinksRow}>
        <div className={styles.footerLinksCol}>
          <div className={styles.footerLinksTitle}>Quick Link</div>
          <Link href="/about">About Us</Link>
          <Link href="/services">Services</Link>
          <Link href="/reviews">Reviews</Link>
          <Link href="/contact">Contact Us</Link>
        </div>
        <div className={styles.footerLinksCol}>
          <div className={styles.footerLinksTitle}>Useful links</div>
          <Link href="/privacy-policy">Privacy Policy</Link>
          <Link href="/terms-and-conditions">Terms and Conditions</Link>
          <Link href="/faqs">FAQ’s</Link>
          <Link href="/legal-policies">Legal Policies &amp; Customer Rights</Link>
        </div>
        <div className={styles.footerLinksCol}>
          <div className={styles.footerLinksTitle}>Contact Us</div>
          <a href="tel:801-512-7103">801-512-7103</a>
          <a href="tel:801-755-3040">801-755-3040</a>
          <a href="mailto:ashaacutah@gmail.com">ashaacutah@gmail.com</a>
          <div>4434 W 8790 S West Jordan,<br />Utah</div>
        </div>
      </div>
      <div className={styles.footerCopyright}>
        © Copyright 2023 ASHAAC.COM. All Right Reserved.
      </div>
    </footer>
  );
}
