import Image from "next/image";
import styles from "./AboutCompanySection.module.css";

export default function AboutCompanySection() {
  return (
    <section className={styles.companySection} data-label="AboutCompanySection">
      <div className={styles.companyContainer}>
        <div className={styles.imageWrapper} data-label="CompanyImages">
          <Image
            data-label="ACCondensorImage"
            src="/images/homepage/double-ac-condenser.webp"
            alt="Double AC Condenser"
            width={340}
            height={340}
            className={styles.companyImage}
          />
          <Image
            data-label="CommercialImage"
            src="/images/homepage/commercial.jpg"
            alt="Commercial HVAC"
            width={340}
            height={220}
            className={styles.companyImage}
            style={{ marginTop: 24 }}
          />
        </div>
        <div className={styles.textWrapper}>
          <h3 data-label="CompanyAboutTitle">ABOUT OUR COMPANY</h3>
          <h4 data-label="PopularityTitle">We Are The Most Popular<br />Installation Company</h4>
          <p data-label="PopularityText">
            We are most popular for installations and replacements, that’s our specialty. Whether you need the traditional Furnace and AC unit or want to go the route of mini split systems, heat pumps, through the window or wall units, or any other cooling or heating equipment, we have it all and we install it all.
          </p>
          <h4 data-label="TeamTitle">Professional Team</h4>
          <p data-label="TeamText">
            We work with the most skilled and professional individuals with combined decades of experience and dedication to give you the best, because we believe you deserve the best.
          </p>
          <h4 data-label="SchedulingTitle">We schedule your installation at your earliest convenience.</h4>
          <p data-label="SchedulingText">
            Are you in need of a reliable and efficient heating and cooling system? Look no further! At All Solutions Heating and Air Conditioning, we specialize in the installation of brand-new HVAC equipment. Whether you require a replacement or a first time installation of central air systems, including furnaces, AC condensers, heat pumps, mini-split systems, or through-the-window or through-the-wall units, we’ve got you covered.
          </p>
          <div className={styles.leftExcellence} data-label="ExcellenceSection">
            <div className={styles.excellenceTitle} data-label="ExcellenceTitle">
              WE ARE DEDICATED TO EXCELLENCE IN KEEPING<br />
              YOU COMFORTABLE AT HOME AND IN YOUR WORK PLACE.
            </div>
            <div className={styles.excellenceText} data-label="ExcellenceDescription">
              Whether be your own residence, rental or vacation home, office, restaurant, or business of any type, we do it all.<br />
              You just relax and let us handle all your cooling and heating needs.
            </div>
            <div className={styles.bbbTitle} data-label="BBBTitle">Accredited Business</div>
            <div className={styles.bbbText} data-label="BBBDescription">
              Trust and reputation is important to us, that’s why we are a Better Business Bureau Accredited Business.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
      
