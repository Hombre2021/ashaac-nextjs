import type { Metadata } from "next";
import HomepageResponsive from "../components/HomepageResponsive";

export const metadata: Metadata = {
  title: "HVAC Installation & Repair in West Jordan, UT",
  description:
    "Professional HVAC installation, replacement, maintenance, and repair in West Jordan and Salt Lake County. Call or text for fast service and free estimates.",
  keywords: [
    "HVAC West Jordan UT",
    "air conditioning repair West Jordan",
    "furnace repair West Jordan",
    "HVAC installation Salt Lake County",
    "heat pump services Utah",
    "mini split installation West Jordan",
  ],
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return (
    <HomepageResponsive />
  );
}
