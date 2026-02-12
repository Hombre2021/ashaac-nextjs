import HomepageHeader from "@/components/HomepageHeader";
import AboutHero from "@/components/AboutHero";
import HomepageFooter from "@/components/HomepageFooter";
import TermsContent from "@/components/TermsContent";

export default function TermsAndConditionsPage() {
  return (
    <>
      <HomepageHeader />
      <AboutHero title="Terms and Conditions" />
      <TermsContent />
      <HomepageFooter />
    </>
  );
}
