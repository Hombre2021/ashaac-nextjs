import HomepageHeader from "./HomepageHeader";
import HomepageHero from "./HomepageHero";
import ServiceAreasSection from "./ServiceAreasSection";
import HomepageSection from "./HomepageSection";
import HomepageSubtitle from "./HomepageSubtitle";
import HomepageDualFeature from "./HomepageDualFeature";
import HomepageServicesButton from "./HomepageServicesButton";
import HomepageTestimonials from "./HomepageTestimonials";
import HomepageEstimateButton from "./HomepageEstimateButton";
import HomepageFooter from "./HomepageFooter";

export default function HomepageDesktop() {
  return (
    <>
      <HomepageHeader />
      <HomepageHero />
      <ServiceAreasSection />
      <HomepageSection />
      <HomepageSubtitle />
      <HomepageDualFeature />
      <HomepageServicesButton />
      <HomepageTestimonials />
      <HomepageEstimateButton />
      <HomepageFooter />
    </>
  );
}
