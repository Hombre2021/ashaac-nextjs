import type { Metadata } from "next";
import HomepageHeader from "../../components/HomepageHeader";
import ContactHero from "../../components/ContactHero";
import ContactContent from "../../components/ContactContent";
import HomepageFooter from "../../components/HomepageFooter";

export const metadata: Metadata = {
  title: "Contact HVAC Experts in West Jordan",
  description:
    "Contact All Solutions Heating and Air Conditioning for HVAC installation, repairs, and free estimates in West Jordan and Salt Lake County.",
  keywords: [
    "HVAC contact West Jordan",
    "schedule HVAC estimate",
    "HVAC company Salt Lake County",
    "call HVAC technician West Jordan",
  ],
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
  return (
    <>
      <HomepageHeader />
      <ContactHero />
      <ContactContent />
      <HomepageFooter />
    </>
  );
}
