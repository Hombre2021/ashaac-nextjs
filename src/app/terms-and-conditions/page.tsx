import type { Metadata } from "next";
import HomepageHeader from "@/components/HomepageHeader";
import AboutHero from "@/components/AboutHero";
import HomepageFooter from "@/components/HomepageFooter";
import TermsContent from "@/components/TermsContent";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description: "Review the terms and conditions for HVAC services provided by All Solutions Heating and Air Conditioning.",
  alternates: {
    canonical: "/terms-and-conditions",
  },
};

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
