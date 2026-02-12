import PrivacyPolicyContent from "../../components/PrivacyPolicyContent";
import HomepageFooter from "../../components/HomepageFooter";
import AboutHero from "../../components/AboutHero";
import HomepageHeader from "../../components/HomepageHeader";

export default function PrivacyPolicyPage() {
  return (
    <>
      <HomepageHeader />
      <AboutHero title="Privacy Policy" />
      <PrivacyPolicyContent />
      <HomepageFooter />
    </>
  );
}
