import type { Metadata } from "next";
import Link from "next/link";
import HomepageHeader from "../../components/HomepageHeader";
import ReviewsHero from "../../components/ReviewsHero";
import ReviewsContent from "../../components/ReviewsContent";
import HomepageFooter from "../../components/HomepageFooter";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://ashaac.com").replace(/\/$/, "");

export const metadata: Metadata = {
  title: "5-Star HVAC Customer Reviews | West Jordan & Salt Lake County",
  description:
    "Read real 5-star customer reviews for All Solutions Heating and Air Conditioning. Trusted by homeowners across West Jordan, South Jordan, Riverton, and Salt Lake County.",
  keywords: [
    "HVAC reviews West Jordan",
    "air conditioning company reviews Utah",
    "furnace installation reviews West Jordan",
    "All Solutions HVAC ratings",
    "leave a review All Solutions HVAC",
  ],
  alternates: {
    canonical: "/reviews",
  },
  openGraph: {
    type: "website",
    url: `${siteUrl}/reviews`,
    title: "5-Star HVAC Customer Reviews | All Solutions Heating & AC",
    description: "Read real 5-star customer reviews for All Solutions Heating and Air Conditioning in West Jordan, UT.",
  },
};

const reviewsSchema = {
  "@context": "https://schema.org",
  "@type": "HVACBusiness",
  "@id": `${siteUrl}/#business`,
  name: "All Solutions Heating and Air Conditioning",
  url: siteUrl,
  telephone: "+1-801-755-3040",
  address: {
    "@type": "PostalAddress",
    addressLocality: "West Jordan",
    addressRegion: "UT",
    postalCode: "84088",
    addressCountry: "US",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "5.0",
    reviewCount: "10",
    bestRating: "5",
    worstRating: "1",
  },
  review: [
    {
      "@type": "Review",
      author: { "@type": "Person", name: "Judy Nielsen" },
      reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
      reviewBody: "My 97-year-old father called me informing me that his heater was not working. Leandro is very prompt, knowledgeable, and caring.",
    },
    {
      "@type": "Review",
      author: { "@type": "Person", name: "Samra Zele" },
      reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
      reviewBody: "Leandro was great!! Knew exactly what was wrong with our unit and fixed it the same day. He is an honest technician.",
    },
    {
      "@type": "Review",
      author: { "@type": "Person", name: "Burl Moimoi" },
      reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
      reviewBody: "Pricing was very reasonable and they did a great job with installation and even cleaned up everything in the work area.",
    },
    {
      "@type": "Review",
      author: { "@type": "Person", name: "Ken Coleman" },
      reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
      reviewBody: "Leandro is great. He helped me out start to finish, was always there to suggest what to do next, and select the right equipment for my AC.",
    },
    {
      "@type": "Review",
      author: { "@type": "Person", name: "BriAnn Denoyer" },
      reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
      reviewBody: "Great communication! I appreciate the quality work and quick response.",
    },
  ],
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
    { "@type": "ListItem", position: 2, name: "Reviews", item: `${siteUrl}/reviews` },
  ],
};

export default function ReviewsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewsSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <HomepageHeader />
      <ReviewsHero />

      {/* Review Velocity CTA Box */}
      <section style={{ maxWidth: 880, margin: "32px auto 16px auto", padding: "0 20px" }}>
        <div style={{
          background: "linear-gradient(135deg, #095f91 0%, #064062 100%)",
          color: "#ffffff",
          borderRadius: 16,
          padding: "28px 24px",
          textAlign: "center",
          boxShadow: "0 8px 24px rgba(9, 95, 145, 0.18)"
        }}>
          <h2 style={{ fontSize: "1.6rem", margin: "0 0 10px 0", color: "#ffffff", fontWeight: 700 }}>
            Had a Great Experience with All Solutions HVAC?
          </h2>
          <p style={{ fontSize: "1.05rem", margin: "0 auto 18px auto", maxWidth: 680, lineHeight: 1.6, color: "#f0f9ff" }}>
            Your feedback helps local homeowners across Salt Lake County find trustworthy heating and cooling service. Please take a moment to share your experience on Google!
          </p>
          <div style={{ margin: "16px 0" }}>
            <a
              href="https://maps.google.com/?q=All+Solutions+Heating+and+Air+Conditioning+West+Jordan+UT"
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "#ffffff",
                color: "#095f91",
                fontWeight: 700,
                fontSize: "1.05rem",
                padding: "14px 28px",
                borderRadius: 8,
                textDecoration: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                transition: "transform 0.15s ease"
              }}
            >
              ⭐ Leave a Review on Google ⭐
            </a>
          </div>
          <p style={{ fontSize: "0.9rem", margin: "14px auto 0 auto", maxWidth: 600, color: "#dbeafe", fontStyle: "italic" }}>
            💡 <strong>Helpful tip:</strong> Mentioning the service you received (such as AC and furnace repair and installation, or tune-up) and your city helps your neighbors find us easily.
          </p>
        </div>
      </section>

      <ReviewsContent />

      <div style={{ maxWidth: 920, margin: "24px auto 48px auto", padding: "0 24px", textAlign: "center", lineHeight: 1.8 }}>
        <p style={{ fontSize: "1.1rem", color: "#374151" }}>
          Ready for reliable heating and cooling service? Request an appointment for{" "}
          <Link href="/ac-repair-west-jordan" style={{ color: "#095f91", fontWeight: 600 }}>AC repair in West Jordan</Link>,{" "}
          <Link href="/furnace-repair-south-jordan" style={{ color: "#095f91", fontWeight: 600 }}>furnace repair in South Jordan</Link>, or{" "}
          <Link href="/emergency-hvac-repair-riverton" style={{ color: "#095f91", fontWeight: 600 }}>emergency HVAC repair in Riverton</Link>.
        </p>
      </div>
      <HomepageFooter />
    </>
  );
}
