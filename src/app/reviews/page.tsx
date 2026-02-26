import type { Metadata } from "next";
import HomepageHeader from "../../components/HomepageHeader";
import ReviewsHero from "../../components/ReviewsHero";
import ReviewsContent from "../../components/ReviewsContent";
import HomepageFooter from "../../components/HomepageFooter";
import { absoluteUrl, siteName } from "@/lib/seo";

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
  const reviewsPageSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": absoluteUrl("/reviews#webpage"),
        url: absoluteUrl("/reviews"),
        name: `Customer Reviews | ${siteName}`,
        isPartOf: {
          "@id": absoluteUrl("/#website"),
        },
        about: {
          "@id": absoluteUrl("/#business"),
        },
      },
      {
        "@type": "ItemList",
        name: "Customer testimonials",
        numberOfItems: 10,
        itemListElement: [
          "Judy Nielsen",
          "Samra Zele",
          "burl moimoi",
          "leo garcia",
          "Ken Coleman",
          "Cruz Mayoral",
          "BriAnn Denoyer",
          "Jose Vargas",
          "Enrique Pulido",
          "Shirley Ann Taeoalii",
        ].map((name, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "Review",
            author: {
              "@type": "Person",
              name,
            },
          },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewsPageSchema) }}
      />
      <HomepageHeader />
      <ReviewsHero />
      <ReviewsContent />
      <HomepageFooter />
    </>
  );
}
