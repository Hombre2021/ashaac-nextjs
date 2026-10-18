import Image from "next/image";
import type { ReactNode } from "react";
import styles from "./AboutHero.module.css";

interface AboutHeroProps {
  eyebrow?: string;
  title?: ReactNode;
  subtitle?: string;
  backgroundSrc?: string;
  backgroundAlt?: string;
}

export default function AboutHero({
  eyebrow,
  title,
  subtitle,
  backgroundSrc = "/images/homepage/commercial.jpg",
  backgroundAlt = "All Solutions Heating and Air Conditioning Mobile HVAC Van and Equipment",
}: AboutHeroProps) {
  const isDefaultAbout = !eyebrow && !title;

  const displayEyebrow = eyebrow || (isDefaultAbout ? "About Us" : undefined);
  const displayTitle =
    title ||
    (isDefaultAbout ? (
      <>
        Dedicated to Honest, <span className={styles.highlight}>Top-Quality Heating &amp; AC</span>
      </>
    ) : (
      "About Us"
    ));
  const displaySubtitle =
    subtitle ||
    (isDefaultAbout
      ? "Serving West Jordan and Salt Lake County with reliable, professional service since 2012."
      : undefined);

  return (
    <div className={styles.heroContainer} data-label="AboutHeroSection">
      <Image
        src={backgroundSrc}
        alt={backgroundAlt}
        fill
        style={{ objectFit: "cover", objectPosition: "center" }}
        priority
        className={styles.heroBg}
      />
      <div className={styles.blueOverlay} />
      <div className={styles.heroContent}>
        {displayEyebrow ? <p className={styles.eyebrow}>{displayEyebrow}</p> : null}
        <h1 className={styles.heroTitle} data-label="AboutHeroTitle">
          {displayTitle}
        </h1>
        {displaySubtitle ? <p className={styles.heroSubtitle}>{displaySubtitle}</p> : null}
      </div>
    </div>
  );
}
