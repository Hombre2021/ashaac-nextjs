import type { Metadata } from "next";
import PrivacyPolicyContent from "../../components/PrivacyPolicyContent";
import HomepageFooter from "../../components/HomepageFooter";
import AboutHero from "../../components/AboutHero";
import HomepageHeader from "../../components/HomepageHeader";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Read how All Solutions Heating and Air Conditioning collects, uses, and protects your personal information.",
  alternates: {
    canonical: "/privacy-policy",
  },
};

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
