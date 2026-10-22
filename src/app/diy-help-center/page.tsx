import type { Metadata } from "next";
import HomepageFooter from "@/components/HomepageFooter";
import HomepageHeader from "@/components/HomepageHeader";
import AboutHero from "@/components/AboutHero";
import DIYHelpCenterContent from "@/components/DIYHelpCenterContent";

export const metadata: Metadata = {
  title: "DIY Help Center | All Solutions Heating & Air Conditioning",
  description: "DIY HVAC help resources, troubleshooting guides, online question submissions, and live support from All Solutions Heating and Air Conditioning.",
  alternates: {
    canonical: "/diy-help-center",
  },
};

export default function DiyHelpCenterPage() {
  return (
    <>
      <HomepageHeader />
      <AboutHero
        eyebrow="DIY Support"
        title="DIY HVAC Help Center"
        subtitle="Troubleshooting resources, online questions, and live support for your heating and cooling equipment."
      />
      <main style={{ maxWidth: 1080, margin: "0 auto", padding: "24px 16px 72px" }}>
        <DIYHelpCenterContent />
      </main>
      <HomepageFooter />
    </>
  );
}
