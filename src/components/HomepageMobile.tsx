import HomepageHeader from "./HomepageHeader";
import HomepageHero from "./HomepageHero";
import HomepageSection from "./HomepageSection";
import HomepageSubtitle from "./HomepageSubtitle";
import HomepageDualFeature from "./HomepageDualFeature";
import HomepageServicesButton from "./HomepageServicesButton";
import HomepageTestimonials from "./HomepageTestimonials";
import HomepageEstimateButton from "./HomepageEstimateButton";
import HomepageFooter from "./HomepageFooter";
import styles from "./HomepageMobile.module.css";

export default function HomepageMobile() {
  return (
    <div className={styles.homepageMobile}>
      <HomepageHeader />
      <HomepageHero />
      <HomepageSection />
      <HomepageSubtitle />
      <HomepageDualFeature />
      <HomepageServicesButton />
      <HomepageTestimonials />
      <HomepageEstimateButton />
      <HomepageFooter />
    </div>
  );
}
