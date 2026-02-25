import type { Metadata } from "next";
import HomepageHeader from "../../components/HomepageHeader";
import ReviewsHero from "../../components/ReviewsHero";
import ReviewsContent from "../../components/ReviewsContent";
import HomepageFooter from "../../components/HomepageFooter";

export const metadata: Metadata = {
  title: "HVAC Customer Reviews",
  description:
    "Read real customer reviews for All Solutions Heating and Air Conditioning in West Jordan and Salt Lake County.",
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
      <HomepageFooter />
    </>
  );
}
