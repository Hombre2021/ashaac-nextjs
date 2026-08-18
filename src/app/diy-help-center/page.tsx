import type { Metadata } from "next";
import Link from "next/link";
import HomepageFooter from "@/components/HomepageFooter";
import HomepageHeader from "@/components/HomepageHeader";

export const metadata: Metadata = {
  title: "DIY Help Center",
  description: "DIY HVAC help resources and support from All Solutions Heating and Air Conditioning.",
  alternates: {
    canonical: "/diy-help-center",
  },
};

export default function DiyHelpCenterPage() {
  return (
    <>
      <HomepageHeader />
      <main style={{ maxWidth: 980, margin: "0 auto", padding: "180px 24px 72px" }}>
        <h1 style={{ marginBottom: 12 }}>DIY Help Center</h1>
        <p style={{ lineHeight: 1.7 }}>
          Need quick HVAC guidance before a service visit? Call or text 801-755-3040 and our team can help with
          troubleshooting and next steps.
        </p>
        <p style={{ lineHeight: 1.7 }}>
          For service options, compare <Link href="/services">HVAC services</Link>, browse <Link href="/service-areas">local service areas</Link>, or request <Link href="/book">an appointment</Link>.
        </p>
      </main>
      <HomepageFooter />
    </>
  );
}
