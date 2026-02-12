import HomepageHeader from "../components/HomepageHeader";
import Image from "next/image";
import Link from "next/link";
import styles from "../components/HomepageHeader.module.css";

import HomepageHero from "../components/HomepageHero";
import HomepageSection from "../components/HomepageSection";
import HomepageSubtitle from "../components/HomepageSubtitle";
import HomepageDualFeature from "../components/HomepageDualFeature";
import HomepageServicesButton from "../components/HomepageServicesButton";
import HomepageTestimonials from "../components/HomepageTestimonials";
import HomepageEstimateButton from "../components/HomepageEstimateButton";
import HomepageFooter from "../components/HomepageFooter";

export default function Home() {
  return (
    <>
      <HomepageHeader />
      <HomepageHero />
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
