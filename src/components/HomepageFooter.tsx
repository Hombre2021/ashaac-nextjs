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

  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footerContainer}>
      <div className={styles.footerTop}>
        <div className={styles.logoAndMotto}>
          <div className={styles.van2ImageWrap}>
            <Image src="/images/homepage/van2.png" alt="All Solutions Heating & Air Conditioning" fill sizes="120px" className={styles.van2Image} />
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
          <div className={styles.footerLinksTitle} data-label="QuickLinksTitle">Quick Links</div>
          <Link href="/about" data-label="LinkAbout">About Us</Link>
          <Link href="/services" data-label="LinkServices">All Services</Link>
          <Link href="/service-areas" data-label="LinkServiceAreas">Service Areas</Link>
          <Link href="/projects" data-label="LinkProjects">Projects &amp; Gallery</Link>
          <Link href="/reviews" data-label="LinkReviews">Customer Reviews</Link>
          <Link href="/book" data-label="LinkBook">Book Appointment</Link>
        </div>
        <div className={styles.footerLinksCol} data-label="ServicesCol">
          <div className={styles.footerLinksTitle} data-label="ServicesTitle">Popular Services</div>
          <Link href="/ac-repair-west-jordan">AC Repair West Jordan</Link>
          <Link href="/furnace-repair-west-jordan">Furnace Repair West Jordan</Link>
          <Link href="/emergency-hvac-repair-west-jordan">Emergency HVAC Repair</Link>
          <Link href="/services/west-jordan/heat-pump-installation">Heat Pump Installation</Link>
          <Link href="/services/west-jordan/mini-split-installation">Ductless Mini-Splits</Link>
          <Link href="/financing">Financing Options</Link>
        </div>
        <div className={styles.footerLinksCol} data-label="UsefulLinksCol">
          <div className={styles.footerLinksTitle} data-label="UsefulLinksTitle">Help &amp; Legal</div>
          <Link href="/faqs" data-label="LinkFAQ">HVAC FAQ&apos;s</Link>
          <Link href="/diy-help-center" data-label="LinkDiy">DIY Help Center</Link>
          <Link href="/privacy-policy" data-label="LinkPrivacy">Privacy Policy</Link>
          <Link href="/terms-and-conditions" data-label="LinkTerms">Terms and Conditions</Link>
          <Link href="/legal-policies" data-label="LinkLegal">Legal Policies &amp; Customer Rights</Link>
        </div>
        <div className={styles.footerLinksCol} data-label="ContactCol">
          <div className={styles.footerLinksTitle} data-label="ContactTitle">Contact Us</div>
          <a href="tel:801-755-3040" data-label="Phone">801-755-3040</a>
          <a href="mailto:ashaacutah@gmail.com" data-label="EmailLink">ashaacutah@gmail.com</a>
          <div data-label="Address">Based in West Jordan, UT 84088<br /><span style={{ fontSize: "0.88em", color: "#bbb" }}>Mobile Service Across Salt Lake County</span></div>
          <Link href="/contact" data-label="LinkContact">Contact &amp; Dispatch Details</Link>
          <a
            href="https://www.facebook.com/Warrior2021Q"
            target="_blank"
            rel="noopener noreferrer"
            data-label="FacebookLink"
            style={{ color: "#38bdf8", fontWeight: 600, marginTop: 4, display: "inline-block" }}
          >
            &#128077; Follow us on Facebook
          </a>
        </div>
      </div>
      <div className={styles.footerCopyright}>
        &copy; Copyright {currentYear} All Solutions Heating and Air Conditioning (ASHAAC.COM). All Rights Reserved.
      </div>
    </footer>
  );
}
