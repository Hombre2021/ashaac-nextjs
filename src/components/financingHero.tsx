import type { NextPage } from "next";
import Image from "next/image";
import HomepageHeader from "./HomepageHeader";
import HomepageFooter from "./HomepageFooter";
import styles from "./financingHero.module.css";

const FinancingPage: NextPage = () => {
  return (
    <>
      <HomepageHeader />
      <div className={styles.financingpage}>
        <Image
          src="/images/homepage/living-room.png"
          alt="Living Room Background"
          fill
          className={styles.backgroundimageIcon}
          style={{ objectFit: "cover", objectPosition: "center bottom" }}
          loading="eager"
        />
        <div className={styles.blueOverlay} />
        <h1 className={styles.heroTitle}>Apply for 0% interest on your financing!</h1>

        <h3 className={styles.stepHeader}>Steps to follow and things for you to know</h3>
        <div className={styles.stepDescriptions}>
          <ol className={styles.yourInitialApplicationIsOn}>
            <li>
              1. Your initial application is only a pre-qualification so it won’t
                 have an impact on your credit. This is important because it will
                 help you decide which route to take, and whether you want to provide
                 your own financing.
            </li>
            <li>
              2. You already spoke with one of our technitians and got a
                 quote/estimate on your installation, so yoCall. OK. Thanks.u know how much you are
                 applying for.
            </li>
      <li>
        3. If you qualify for 0% financing, you can choose how fast you want to pay off your approved loan, by choosing one 
 of the following options:
        <ol className={styles.subOptions}>
          <li>a. 0% interest for 3 months</li>
          <li>b. 0% interest for 6 months</li>
          <li>c. 0% interest for 1 year</li>
          <li>d. 0% interest for 2 years</li>
        </ol>
      </li>
      <li>
        4. 0% financing is based on your credit history. Other options are available depending on your credit eligibility.
      </li>
      <li>
        5. If you pay cash or ACH (Electronic check), you will receive a $500 discount.
      </li>
          </ol>
          <a
            href="https://wisetack.us/#/k8igal0/prequalify"
            className={styles.preQualificationButton}
            target="_blank"
            rel="noreferrer"
          ></a>
          <a
            href="https://wisetack.us/#/k8igal0/prequalify"
            className={styles.preQualificationLink}
            target="_blank"
            rel="noreferrer"
          >
            Click here to begin your pre‑qualification application
          </a>
        </div>
      </div>
      <HomepageFooter />
    </>
  );
};

export default FinancingPage;