import type { Metadata } from "next";
import Link from "next/link";
import HomepageHeader from "../../components/HomepageHeader";
import ContactHero from "../../components/ContactHero";
import ContactContent from "../../components/ContactContent";
import HomepageFooter from "../../components/HomepageFooter";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://ashaac.com").replace(/\/$/, "");

export const metadata: Metadata = {
  title: "Contact HVAC Experts in West Jordan, UT | All Solutions Heating & AC",
  description:
    "Get in touch with All Solutions Heating and Air Conditioning for 24/7 emergency repair, furnace & AC replacements, and free estimates across West Jordan and Salt Lake County.",
  keywords: [
    "HVAC contact West Jordan",
    "schedule HVAC estimate",
    "HVAC company Salt Lake County",
    "call HVAC technician West Jordan",
    "emergency HVAC repair contact Utah",
    "All Solutions Heating and Air Conditioning Google Maps",
  ],
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    type: "website",
    url: `${siteUrl}/contact`,
    title: "Contact HVAC Experts in West Jordan, UT | All Solutions Heating & AC",
    description: "Get in touch with All Solutions Heating and Air Conditioning for 24/7 emergency repair and free estimates across West Jordan and Salt Lake County.",
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
    { "@type": "ListItem", position: 2, name: "Contact", item: `${siteUrl}/contact` },
  ],
};

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "HVACBusiness",
  "@id": `${siteUrl}/#business`,
  name: "All Solutions Heating and Air Conditioning",
  url: siteUrl,
  telephone: "+1-801-755-3040",
  email: "ashaacutah@gmail.com",
  hasMap: "https://maps.google.com/?q=All+Solutions+Heating+and+Air+Conditioning+West+Jordan+UT",
  address: {
    "@type": "PostalAddress",
    addressLocality: "West Jordan",
    addressRegion: "UT",
    postalCode: "84088",
    addressCountry: "US",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 40.5985,
    longitude: -111.9969,
  },
  serviceArea: {
    "@type": "GeoCircle",
    geoMidpoint: {
      "@type": "GeoCoordinates",
      latitude: 40.5985,
      longitude: -111.9969,
    },
    geoRadius: "40000",
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "07:00",
      closes: "20:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Sunday"],
      opens: "08:00",
      closes: "18:00",
    },
  ],
};

export default function ContactPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <HomepageHeader />
      <ContactHero />
      <ContactContent />

      <section style={{ maxWidth: 1000, margin: "0 auto 32px auto", padding: "0 24px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 24,
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 16,
          padding: 32,
          boxShadow: "0 4px 20px rgba(0,0,0,0.04)"
        }}>
          <div>
            <h2 style={{ fontSize: "1.35rem", color: "#095f91", marginBottom: 12, fontWeight: 700 }}>
              Mobile Service &amp; Coverage
            </h2>
            <p style={{ margin: "0 0 8px", color: "#1e293b", lineHeight: 1.6 }}>
              <strong>Dispatch Hub:</strong><br />
              West Jordan, UT 84088<br />
              <em>(100% Mobile Service &ndash; We Come Directly to Your Door)</em>
            </p>
            <p style={{ margin: "12px 0 0", color: "#475569", lineHeight: 1.5, fontSize: "0.95rem" }}>
              Serving West Jordan, South Jordan, Riverton, Herriman, Sandy, Draper, Taylorsville, Murray, Midvale, and all of Salt Lake County.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: "1.35rem", color: "#095f91", marginBottom: 12, fontWeight: 700 }}>
              Operating Hours &amp; Emergency Dispatch
            </h2>
            <p style={{ margin: "0 0 6px", color: "#1e293b", lineHeight: 1.6 }}>
              <strong>Monday &ndash; Saturday:</strong> 7:00 AM &ndash; 8:00 PM<br />
              <strong>Sunday:</strong> 8:00 AM &ndash; 6:00 PM
            </p>
            <p style={{ margin: "12px 0 0", color: "#b91c1c", fontWeight: 600, fontSize: "0.95rem" }}>
              &bull; 24/7 Emergency Service Available
            </p>
            <p style={{ margin: "6px 0 0", color: "#475569", fontSize: "0.95rem", lineHeight: 1.5 }}>
              Experiencing an urgent furnace or AC breakdown? Call or text us immediately for rapid on-site dispatch.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: "1.35rem", color: "#095f91", marginBottom: 12, fontWeight: 700 }}>
              Direct Contact &amp; Booking
            </h2>
            <p style={{ margin: "0 0 8px", color: "#1e293b", lineHeight: 1.6 }}>
              <strong>Phone / SMS:</strong> <a href="tel:801-755-3040" style={{ color: "#095f91", fontWeight: 600 }}>801-755-3040</a><br />
              <strong>Email:</strong> <a href="mailto:ashaacutah@gmail.com" style={{ color: "#095f91", fontWeight: 600 }}>ashaacutah@gmail.com</a>
            </p>
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <Link
                href="/book"
                style={{
                  display: "inline-block",
                  background: "#095f91",
                  color: "#fff",
                  padding: "10px 18px",
                  borderRadius: 8,
                  fontWeight: 600,
                  textDecoration: "none",
                  fontSize: "0.95rem",
                  textAlign: "center"
                }}
              >
                Book An Appointment Online
              </Link>
              <a
                href="https://maps.google.com/?q=All+Solutions+Heating+and+Air+Conditioning+West+Jordan+UT"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-block",
                  background: "#ffffff",
                  color: "#095f91",
                  border: "1px solid #cbd5e1",
                  padding: "9px 18px",
                  borderRadius: 8,
                  fontWeight: 600,
                  textDecoration: "none",
                  fontSize: "0.92rem",
                  textAlign: "center"
                }}
              >
                📍 View on Google Local Maps
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Google Local Maps Service Area Embed */}
      <section style={{ maxWidth: 1000, margin: "0 auto 48px auto", padding: "0 24px" }}>
        <div style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 4px 16px rgba(0,0,0,0.04)"
        }}>
          <h2 style={{ fontSize: "1.3rem", color: "#0f172a", marginBottom: 8, fontWeight: 700 }}>
            🗺️ Salt Lake County Mobile Service Territory
          </h2>
          <p style={{ color: "#64748b", margin: "0 0 16px 0", fontSize: "0.95rem" }}>
            Our fully equipped service vans are dispatched daily across the entire Salt Lake Valley.
          </p>
          <div style={{ position: "relative", width: "100%", height: 380, borderRadius: 12, overflow: "hidden" }}>
            <iframe
              title="All Solutions Heating and Air Conditioning Service Area Map"
              src="https://maps.google.com/maps?q=West%20Jordan,%20UT%2084088&t=&z=11&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

      <HomepageFooter />
    </>
  );
}
