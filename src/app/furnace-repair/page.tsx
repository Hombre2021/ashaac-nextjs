import type { Metadata } from "next";
import Link from "next/link";
import HomepageHeader from "@/components/HomepageHeader";
import HomepageFooter from "@/components/HomepageFooter";
import styles from "@/components/LocalServicePage.module.css";
import { primaryPhone } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Furnace Repair Near Me | Same-Day Emergency Heating | West Jordan & Salt Lake County, UT",
  description:
    "Need fast furnace repair near you? All Solutions Heating and Air Conditioning provides same-day diagnostic service, no-heat emergency repairs, and heating maintenance in West Jordan, South Jordan, Sandy, and throughout Salt Lake County.",
  keywords: [
    "furnace repair near me",
    "emergency furnace repair near me",
    "furnace repair West Jordan UT",
    "heating repair near me",
    "furnace blowing cold air repair",
    "24 hour furnace repair Salt Lake County",
    "furnace technician near me",
    "affordable furnace repair Utah",
  ],
  alternates: {
    canonical: "/furnace-repair",
  },
  openGraph: {
    type: "website",
    url: "https://ashaac.com/furnace-repair",
    title: "Furnace Repair Near Me | Same-Day Emergency Heating | All Solutions HVAC",
    description:
      "Same-day furnace repair and heating diagnostics near you in West Jordan & Salt Lake County. Licensed, insured, 5.0-star rated HVAC contractor.",
    images: [
      {
        url: "https://ashaac.com/images/homepage/van2-no-phone.png",
        width: 1200,
        height: 630,
        alt: "All Solutions Heating & Air Conditioning Furnace Repair",
      },
    ],
  },
};

const furnaceFaqs = [
  {
    question: "How quickly can a furnace technician arrive near me?",
    answer:
      "Because our mobile service vans are dispatched directly throughout West Jordan, South Jordan, and Salt Lake County, we offer rapid same-day diagnostic arrival for emergency no-heat situations. Call or text 801-755-3040 right away for immediate dispatch availability.",
  },
  {
    question: "Why is my furnace blowing cold air instead of heat?",
    answer:
      "The most common causes of a furnace blowing cold air are: a clogged air filter triggering the high-limit switch to shut off the burners, a dirty flame sensor preventing gas ignition, a cracked hot-surface ignitor, or an unlit pilot/faulty gas valve. Our technicians carry diagnostic meters and common replacement parts on our vans to fix this on the spot.",
  },
  {
    question: "How much does furnace repair typically cost in Salt Lake County?",
    answer:
      "Furnace repair costs depend on the underlying problem. Minor repairs such as flame sensor cleanings, pressure switch adjustments, or capacitor replacements are very budget-friendly, while blower motors, draft inducer fans, or electronic control boards require more parts labor. At All Solutions, we perform a thorough diagnostic assessment first and provide clear, upfront pricing before any work begins.",
  },
  {
    question: "What brands of furnaces do you repair?",
    answer:
      "We service and repair all major residential and commercial furnace manufacturers, including Lennox, Carrier, Trane, Goodman, Rheem, York, Amana, Bryant, American Standard, Daikin, Payne, Heil, and Armstrong.",
  },
  {
    question: "Should I repair or replace my aging furnace?",
    answer:
      "If your furnace is under 12-15 years old and the repair cost is reasonable, repairing it is usually the most cost-effective choice. If your furnace has a cracked heat exchanger (which poses a carbon monoxide risk) or is over 15 years old with repeated breakdowns, we will show you transparent options for a high-efficiency replacement.",
  },
  {
    question: "What areas do you serve for furnace repair near me?",
    answer:
      "We serve all of Salt Lake County, with primary dispatch hubs in West Jordan (84081, 84084, 84088), South Jordan (84095, Daybreak), Riverton (84065, 84096), Herriman, Sandy, Draper, Taylorsville, Murray, Midvale, and Salt Lake City.",
  },
];

export default function FurnaceRepairRootPage() {
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": "https://ashaac.com/furnace-repair#service",
    name: "Furnace Repair Near Me & Emergency Heating Service",
    serviceType: "Furnace Repair",
    url: "https://ashaac.com/furnace-repair",
    provider: {
      "@id": "https://ashaac.com/#business",
    },
    areaServed: [
      { "@type": "City", name: "West Jordan" },
      { "@type": "City", name: "South Jordan" },
      { "@type": "City", name: "Riverton" },
      { "@type": "City", name: "Herriman" },
      { "@type": "City", name: "Sandy" },
      { "@type": "City", name: "Draper" },
      { "@type": "City", name: "Taylorsville" },
      { "@type": "City", name: "Murray" },
      { "@type": "City", name: "Midvale" },
      { "@type": "City", name: "Salt Lake City" },
      { "@type": "AdministrativeArea", name: "Salt Lake County" },
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Furnace Repair Services",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Emergency No-Heat Diagnostic & Repair",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Blower Motor & Inducer Fan Repair",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Ignitor & Flame Sensor Replacement",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "21-Point Furnace Safety & Tune-Up Inspection",
          },
        },
      ],
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: furnaceFaqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://ashaac.com" },
      { "@type": "ListItem", position: 2, name: "Services", item: "https://ashaac.com/services" },
      { "@type": "ListItem", position: 3, name: "Furnace Repair Near Me", item: "https://ashaac.com/furnace-repair" },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <HomepageHeader />
      <main className={styles.page}>
        <section className={styles.hero}>
          <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
            <Link href="/services">Services</Link>
            <Link href="/service-areas">Salt Lake County</Link>
            <span>Furnace Repair Near Me</span>
          </nav>
          <p className={styles.eyebrow}>All Solutions Heating and Air Conditioning</p>
          <h1>Same-Day Furnace Repair Near You in West Jordan &amp; Salt Lake County</h1>
          <p className={styles.lede}>
            When winter temperatures drop and your heating system stops working, you need a local, reliable HVAC contractor fast. We provide prompt diagnostics, transparent pricing, and same-day furnace repairs across the Salt Lake Valley.
          </p>
          <div className={styles.actions}>
            <a className={styles.primary} href={`tel:${primaryPhone.replace(/[^0-9+]/g, "")}`}>
              ⚡ Call Now: 801-755-3040
            </a>
            <Link className={styles.secondary} href="/book">
              📅 Book Appointment Online
            </Link>
          </div>
        </section>

        <section className={styles.content}>
          <h2>Fast, Reliable Heating Repairs for Utah Homeowners</h2>
          <p>
            A broken furnace in the middle of a Utah freeze is not just uncomfortable—it poses a real risk to your home&apos;s pipes and family&apos;s safety. At <strong>All Solutions Heating and Air Conditioning</strong>, our mobile diagnostic vans are stationed right here in West Jordan and dispatched across Salt Lake County with genuine replacement parts and precision testing equipment.
          </p>
          <p>
            Whether your furnace refuses to turn on, cycles on and off repeatedly, or blows lukewarm air, our certified technicians troubleshoot the root cause rather than guessing.
          </p>

          <h2>Common Furnace Problems We Fix Every Day</h2>
          <ul>
            <li><strong>Furnace Blowing Cold Air:</strong> Often caused by an overheated heat exchanger tripping the limit switch, a bad flame sensor, or a cracked ignitor.</li>
            <li><strong>Short-Cycling (Turning On &amp; Off Frequently):</strong> Usually caused by restricted airflow, a clogged furnace filter, or an oversized heating unit.</li>
            <li><strong>Loud Squealing, Grinding, or Banging Noises:</strong> Warning signs of a failing blower motor bearing, loose fan wheel, or delayed gas ignition.</li>
            <li><strong>Furnace Won&apos;t Ignite or Start:</strong> Faulty electronic ignition boards, blown fuses, open door switches, or defective gas valves.</li>
            <li><strong>Yellow or Flickering Flame:</strong> Indicates incomplete combustion, which can generate dangerous carbon monoxide. Requires immediate shutoff and professional inspection.</li>
            <li><strong>Thermostat Not Communicating:</strong> Wiring faults, blown low-voltage transformers, or incompatible smart thermostat programming.</li>
          </ul>

          <section className={styles.proof} aria-labelledby="furnace-proof-heading">
            <p className={styles.proofLabel}>Verified Customer Satisfaction</p>
            <h2 id="furnace-proof-heading">5.0-Star Google Rating &amp; BBB Accredited</h2>
            <p>
              Homeowners across West Jordan and Salt Lake County trust All Solutions for honest heating diagnostics and fair pricing. We never push unnecessary replacements when a simple, reliable repair will get your heat running safely again.
            </p>
            <div style={{ marginTop: 12, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="/reviews" style={{ fontWeight: 700, color: "#095f91" }}>
                ⭐ Read Customer Reviews
              </Link>
              <span style={{ color: "#94a3b8" }}>|</span>
              <a
                href="https://www.bbb.org/us/ut/west-jordan/profile/heating-and-air-conditioning/all-solutions-heating-and-air-conditioning-llc-1166-90042709"
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontWeight: 700, color: "#095f91" }}
              >
                🛡️ BBB Accredited Business
              </a>
            </div>
          </section>

          <h2>All Major Furnace Brands Serviced</h2>
          <p>
            Our technicians have hands-on diagnostic experience with all leading residential and commercial furnace manufacturers:
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, margin: "16px 0 28px 0" }}>
            {["Lennox", "Carrier", "Trane", "Goodman", "Rheem", "York", "Amana", "Bryant", "Daikin", "American Standard", "Payne", "Heil"].map((brand) => (
              <div
                key={brand}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 6,
                  padding: "10px 14px",
                  textAlign: "center",
                  fontWeight: 600,
                  color: "#334155",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                }}
              >
                {brand}
              </div>
            ))}
          </div>

          <section className={styles.faqs} aria-labelledby="furnace-faq-heading">
            <h2 id="furnace-faq-heading">Frequently Asked Questions About Furnace Repair Near Me</h2>
            {furnaceFaqs.map((faq) => (
              <article key={faq.question} className={styles.faq}>
                <h3>{faq.question}</h3>
                <p>{faq.answer}</p>
              </article>
            ))}
          </section>

          <div className={styles.links}>
            <h2>Local City Furnace Repair Service Pages</h2>
            <Link href="/furnace-repair-west-jordan">Furnace Repair in West Jordan, UT (Hub)</Link>
            <Link href="/furnace-repair-south-jordan">Furnace Repair in South Jordan, UT</Link>
            <Link href="/furnace-repair-riverton">Furnace Repair in Riverton, UT</Link>
            <Link href="/services/sandy/furnace-repair">Furnace Repair in Sandy, UT</Link>
            <Link href="/services/draper/furnace-repair">Furnace Repair in Draper, UT</Link>
            <Link href="/services/herriman/furnace-repair">Furnace Repair in Herriman, UT</Link>
            <Link href="/services/taylorsville/furnace-repair">Furnace Repair in Taylorsville, UT</Link>
            <Link href="/services/murray/furnace-repair">Furnace Repair in Murray, UT</Link>
            <Link href="/services/midvale/furnace-repair">Furnace Repair in Midvale, UT</Link>
            <Link href="/services/salt-lake-city/furnace-repair">Furnace Repair in Salt Lake City, UT</Link>
            <Link href="/emergency-hvac-repair">Emergency 24/7 HVAC Service</Link>
            <Link href="/services">View All HVAC Services</Link>
          </div>
        </section>
      </main>
      <HomepageFooter />
    </>
  );
}
