import type { Metadata } from "next";
import HomepageFooter from "../../components/HomepageFooter";
import AboutHero from "../../components/AboutHero";
import AboutContent from "../../components/AboutContent";
import HomepageHeader from "../../components/HomepageHeader";

export const metadata: Metadata = {
  title: "About Our HVAC Company",
  description:
    "Learn about All Solutions Heating and Air Conditioning, serving West Jordan and Salt Lake County with honest, affordable HVAC installation and repair services.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return (
    <>
      <HomepageHeader />
      <AboutHero />
      <AboutContent />
      <HomepageFooter />
    </>
  );
}
