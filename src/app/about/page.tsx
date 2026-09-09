import type { Metadata } from "next";
import HomepageFooter from "../../components/HomepageFooter";
import AboutHero from "../../components/AboutHero";
import AboutContent from "../../components/AboutContent";
import HomepageHeader from "../../components/HomepageHeader";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://ashaac.com").replace(/\/$/, "");

export const metadata: Metadata = {
  title: "About Our HVAC Company in West Jordan, UT | All Solutions Heating & AC",
  description:
    "Learn about All Solutions Heating and Air Conditioning, a trusted, licensed, and insured West Jordan HVAC company serving Salt Lake County with honest, top-quality installation and repair.",
  keywords: [
    "about HVAC company West Jordan",
    "licensed HVAC contractor Utah",
    "West Jordan HVAC company",
    "Salt Lake County HVAC contractor",
    "All Solutions Heating and Air Conditioning",
  ],
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    type: "website",
    url: `${siteUrl}/about`,
    title: "About Our HVAC Company in West Jordan, UT | All Solutions Heating & AC",
    description: "Learn about All Solutions Heating and Air Conditioning, a trusted West Jordan HVAC company serving Salt Lake County.",
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
    { "@type": "ListItem", position: 2, name: "About", item: `${siteUrl}/about` },
  ],
};

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <HomepageHeader />
      <AboutHero />
      <AboutContent />
      <HomepageFooter />
    </>
  );
}
