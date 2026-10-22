import Image from "next/image";
import Link from "next/link";
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
            We are most popular for installations and replacements, that&apos;s our specialty. Whether you need the traditional Furnace and AC unit or want to go the route of mini split systems, heat pumps, through the window or wall units, or any other cooling or heating equipment, we have it all and we install it all.
          </p>
          <h4 data-label="TeamTitle">Professional Team</h4>
          <p data-label="TeamText">
            We work with the most skilled and professional individuals with combined decades of experience and dedication to give you the best, because we believe you deserve the best.
          </p>
          <h4 data-label="SchedulingTitle">We schedule your installation at your earliest convenience.</h4>
          <p data-label="SchedulingText">
            Are you in need of a reliable and efficient heating and cooling system? Look no further! At All Solutions Heating and Air Conditioning, we specialize in the installation of brand-new HVAC equipment. Whether you require a replacement or a first time installation of central air systems, including furnaces, AC condensers, heat pumps, mini-split systems, or through-the-window or through-the-wall units, we&apos;ve got you covered.
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
            <div className={styles.bbbTitle} data-label="BBBTitle">
              <a
                href="https://www.bbb.org/us/ut/west-jordan/profile/heating-and-air-conditioning/all-solutions-heating-and-air-conditioning-llc-1166-90042709"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#095f91", textDecoration: "underline", display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                Better Business Bureau Accredited Business &#8599;
              </a>
            </div>
            <div className={styles.bbbText} data-label="BBBDescription">
              Trust and reputation is important to us, that&apos;s why we are a Better Business Bureau Accredited Business.
            </div>
            <div style={{ marginTop: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link
                href="/book"
                style={{
                  textDecoration: "none",
                  padding: "10px 20px",
                  borderRadius: 6,
                  backgroundColor: "#d32f2f",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                }}
              >
                Schedule Free Estimate
              </Link>
              <a
                href="tel:801-755-3040"
                style={{
                  textDecoration: "none",
                  padding: "10px 20px",
                  borderRadius: 6,
                  border: "2px solid #095f91",
                  color: "#095f91",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                }}
              >
                Call / Text 801-755-3040
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
