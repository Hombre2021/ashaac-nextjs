import Image from "next/image";
import Link from "next/link";
import styles from "./HomepageSection.module.css";

export default function HomepageSection() {
  return (
    <section className={styles.hvacSection} data-label="HVACSection">
      <div className={styles.hvacContent}>
        <div className={styles.wjChineseAcWrap} data-label="HVACImage">
          <Image
            src="/images/homepage/wj-chinese-ac.webp"
            alt="West Jordan Chinese AC"
            fill
            sizes="(max-width: 480px) 100vw, (max-width: 1024px) 80vw, 50vw"
            className={styles.wjChineseAcImage}
          />
                 </div>
        <div className={styles.hvacText}>
          <h2 className={styles.weTitle} data-label="HVACTitle">We specialize in HVAC Professional installation and replacements.</h2>
          <p data-label="HVACIntro">
            We specialize in HVAC Professional installation and replacing your Heating and AC units. For example, if you need the traditional Furnace and AC unit or want to go the route of mini split systems, or heat pumps, we have it all and we install it all.
          </p>
          <p data-label="HVACAppointment">
            For instance, schedule an appointment for one of our technicians to come and preview your existing space and system. Then we schedule your installation or repair, at your earliest convenience.
          </p>
          <p data-label="HVACEfficiency">
            First, we focus on providing you with a high-efficiency Heating and Air Conditioning system so you can save on energy costs.
          </p>
          <div className={styles.receiveCallout} data-label="TaxCreditCallout">
            <strong>Receive up to a 30% tax credit</strong> on qualified energy efficiency improvements to your home!{' '}
            <Link href="https://www.energystar.gov/about/federal-tax-credits" target="_blank" className={styles.receiveLink} data-label="TaxCreditLink">
              See If You Qualify
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
