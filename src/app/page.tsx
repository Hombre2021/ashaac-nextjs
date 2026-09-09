import type { Metadata } from "next";
import HomepageResponsive from "../components/HomepageResponsive";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://ashaac.com").replace(/\/$/, "");

export const metadata: Metadata = {
  title: "HVAC Installation & Repair in West Jordan, UT | All Solutions Heating and Air Conditioning",
  description:
    "Professional HVAC contractor in West Jordan, UT serving Salt Lake County with AC repair, furnace replacement, heat pump installation, and maintenance.",
  keywords: [
    "HVAC contractor West Jordan UT",
    "HVAC company West Jordan",
    "air conditioning repair West Jordan",
    "furnace repair West Jordan",
    "furnace replacement Salt Lake County",
    "heat pump installation Utah",
    "mini split installation West Jordan",
    "emergency HVAC repair Utah",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "HVAC Installation & Repair in West Jordan, UT | All Solutions Heating and Air Conditioning",
    description: "Professional HVAC contractor in West Jordan, UT serving Salt Lake County with AC repair, furnace replacement, heat pump installation, and maintenance.",
    images: [{
      url: new URL("/images/homepage/van2-no-phone.png", siteUrl),
      width: 1200,
      height: 630,
      alt: "All Solutions Heating and Air Conditioning service van",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "HVAC Installation & Repair in West Jordan, UT | All Solutions Heating and Air Conditioning",
    description: "Professional HVAC contractor in West Jordan, UT serving Salt Lake County with AC repair, furnace replacement, heat pump installation, and maintenance.",
    images: [new URL("/images/homepage/van2-no-phone.png", siteUrl)],
  },
};

export default function Home() {
  return <HomepageResponsive />;
}
