import type { NextPage } from "next";
import Image from "next/image";
import HomepageHeader from "./HomepageHeader";
import HomepageFooter from "./HomepageFooter";
import styles from "./financingHero.module.css";

const PREQUALIFY_URL = "https://wisetack.us/#/k8igal0/prequalify";

const FinancingPage: NextPage = () => {
  return (
    <>
      <HomepageHeader />
      <div className={styles.financingpage}>
        <Image
          src="/images/homepage/commercial.jpg"
          alt="All Solutions Heating and Air Conditioning Mobile HVAC Van and Financing"
          fill
          className={styles.backgroundimageIcon}
          style={{ objectFit: "cover", objectPosition: "center" }}
          priority
        />
        <div className={styles.blueOverlay} />
        
        <p className={styles.eyebrow}>Apply for Financing</p>
        <h1 className={styles.heroTitle}>
          How to Apply for <span className={styles.highlight}>0% Interest Financing</span>
        </h1>
        <p className={styles.heroSubtitle}>
          Flexible payment terms, fast online pre-qualification with no impact on your credit score, and cash discounts.
        </p>

        <a href={PREQUALIFY_URL} className={styles.stepHeaderLink} target="_blank" rel="noreferrer">
          <h2 className={styles.stepHeader}>Steps to follow and things for you to know</h2>
        </a>

        <div className={styles.stepDescriptions}>
          <ol className={styles.yourInitialApplicationIsOn}>
            <li>
              <a href={PREQUALIFY_URL} className={styles.stepCardLink} target="_blank" rel="noreferrer">
                <span className={styles.stepPrefix}>1.</span> Your initial application is only a pre-qualification so it won’t
                have an impact on your credit. This is important because it will
                help you decide which route to take, and whether you want to provide
                your own financing.
              </a>
            </li>
            <li>
              <a href={PREQUALIFY_URL} className={styles.stepCardLink} target="_blank" rel="noreferrer">
                <span className={styles.stepPrefix}>2.</span> You already spoke with one of our technicians and got a
                quote/estimate on your installation, so you know how much you are
                applying for.
              </a>
            </li>
            <li>
              <a href={PREQUALIFY_URL} className={styles.stepCardLink} target="_blank" rel="noreferrer">
                <span className={styles.stepPrefix}>3.</span> If you qualify for 0% financing, you can choose how fast you want to pay off your approved loan, by choosing one
                of the following options:
                <ol className={styles.subOptions}>
                  <li><span className={styles.subPrefix}>a.</span> 0% interest for 3 months</li>
                  <li><span className={styles.subPrefix}>b.</span> 0% interest for 6 months</li>
                  <li><span className={styles.subPrefix}>c.</span> 0% interest for 1 year</li>
                  <li><span className={styles.subPrefix}>d.</span> 0% interest for 2 years</li>
                </ol>
              </a>
            </li>
            <li>
              <a href={PREQUALIFY_URL} className={styles.stepCardLink} target="_blank" rel="noreferrer">
                <span className={styles.stepPrefix}>4.</span> 0% financing is based on your credit history. Other options are available depending on your credit eligibility.
              </a>
            </li>
            <li>
              <a href={PREQUALIFY_URL} className={styles.stepCardLink} target="_blank" rel="noreferrer">
                <span className={styles.stepPrefix}>5.</span> If you pay cash or ACH (Electronic check), you will receive a <strong className={styles.stepHighlight}>$500 discount</strong>.
              </a>
            </li>
          </ol>

          <div className={styles.preQualificationWrapper}>
            <a
              href={PREQUALIFY_URL}
              className={styles.preQualificationLink}
              target="_blank"
              rel="noreferrer"
            >
              Click here to begin your pre‑qualification application
            </a>
          </div>
        </div>
      </div>
      <HomepageFooter />
    </>
  );
};

export default FinancingPage;
