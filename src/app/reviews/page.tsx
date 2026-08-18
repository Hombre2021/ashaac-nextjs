import type { Metadata } from "next";
import Link from "next/link";
import HomepageHeader from "../../components/HomepageHeader";
import ReviewsHero from "../../components/ReviewsHero";
import ReviewsContent from "../../components/ReviewsContent";
import HomepageFooter from "../../components/HomepageFooter";

export const metadata: Metadata = {
  title: "HVAC Customer Reviews",
  description:
    "Read real customer reviews for All Solutions Heating and Air Conditioning in West Jordan and Salt Lake County.",
  keywords: [
    "HVAC reviews West Jordan",
    "air conditioning company reviews Utah",
    "furnace installation reviews West Jordan",
  ],
  alternates: {
    canonical: "/reviews",
  },
};

export default function ReviewsPage() {
  return (
    <>
      <HomepageHeader />
      <ReviewsHero />
      <ReviewsContent />
      <p style={{ maxWidth: 920, margin: "24px auto", padding: "0 24px", lineHeight: 1.6 }}>
        See how our local service pages connect customer feedback with <Link href="/ac-repair-west-jordan">AC repair in West Jordan</Link>, <Link href="/furnace-repair-south-jordan">furnace repair in South Jordan</Link>, and <Link href="/emergency-hvac-repair-riverton">emergency HVAC repair in Riverton</Link>.
      </p>
      <HomepageFooter />
    </>
  );
}
