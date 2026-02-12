import Image from "next/image";
import Link from "next/link";
import styles from "./HomepageSection.module.css";

export default function HomepageSection() {
  return (
    <section className={styles.sectionContainer}>
      <div className={styles.sectionContent}>
        <div className={styles.imageWrapper}>
          <Image
            src="/images/homepage/West-Jordan-chinese-ac.webp"
            alt="West Jordan Chinese AC"
            width={400}
            height={300}
            className={styles.sectionImage}
            priority
          />
        </div>
        <div className={styles.textWrapper}>
          <h2>We specialize in HVAC Professional installation and replacements.</h2>
          <p>
            We specialize in HVAC Professional installation and replacing your Heating and AC units. For example, if you need the traditional Furnace and AC unit or want to go the route of mini split systems, or heat pumps, we have it all and we install it all.
          </p>
          <p>
            For instance, schedule an appointment for one of our technicians to come and preview your existing space and system. Then we schedule your installation or repair, at your earliest convenience.
          </p>
          <p>
            First, we focus on providing you with a high-efficiency Heating and Air Conditioning system so you can save on energy costs.
          </p>
          <div className={styles.taxCreditCallout}>
            <strong>Receive up to a 30% tax credit</strong> on qualified energy efficiency improvements to your home!{' '}
            <Link href="https://www.energystar.gov/about/federal-tax-credits" target="_blank" className={styles.taxCreditLink}>
              See If You Qualify
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
