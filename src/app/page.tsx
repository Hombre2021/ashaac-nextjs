import type { Metadata } from "next";
import HomepageResponsive from "../components/HomepageResponsive";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://ashaac.com").replace(/\/$/, "");

export const metadata: Metadata = {
  title: "24/7 Furnace Repair & HVAC in West Jordan, UT | All Solutions Heating & Air",
  description:
    "Top-rated 24/7 furnace repair, heating system repairs, emergency HVAC diagnostics, and AC installation in West Jordan, UT & Salt Lake County. Call (801) 755-3040.",
  keywords: [
    "furnace repair near me",
    "furnace repair West Jordan UT",
    "heating system repairs Salt Lake County",
    "emergency furnace repair Utah",
    "HVAC contractor West Jordan UT",
    "HVAC company West Jordan",
    "furnace replacement Salt Lake County",
    "air conditioning repair West Jordan",
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
    title: "24/7 Furnace Repair & HVAC in West Jordan, UT | All Solutions Heating & Air",
    description: "Top-rated 24/7 furnace repair, heating system repairs, emergency HVAC diagnostics, and AC installation in West Jordan, UT & Salt Lake County. Call (801) 755-3040.",
    images: [{
      url: new URL("/images/homepage/van2-no-phone.png", siteUrl),
      width: 1200,
      height: 630,
      alt: "All Solutions Heating and Air Conditioning service van",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "24/7 Furnace Repair & HVAC in West Jordan, UT | All Solutions Heating & Air",
    description: "Top-rated 24/7 furnace repair, heating system repairs, emergency HVAC diagnostics, and AC installation in West Jordan, UT & Salt Lake County. Call (801) 755-3040.",
    images: [new URL("/images/homepage/van2-no-phone.png", siteUrl)],
  },
};

export default function Home() {
  return (
    <main id="main-content">
      <HomepageResponsive />
    </main>
  );
}
