import type { Metadata } from "next";
import Link from "next/link";
import HomepageHeader from "@/components/HomepageHeader";
import HomepageFooter from "@/components/HomepageFooter";
import styles from "@/components/LocalServicePage.module.css";
import { primaryPhone } from "@/lib/seo";

export const metadata: Metadata = {
  title: "AC Repair Near Me | Same-Day Emergency Air Conditioning | West Jordan & Salt Lake County, UT",
  description:
    "Need fast AC repair near you? All Solutions Heating and Air Conditioning provides same-day diagnostic service, refrigerant leak fixes, compressor repair, and emergency cooling service in West Jordan, South Jordan, Sandy, and throughout Salt Lake County.",
  keywords: [
    "AC repair near me",
    "air conditioning repair near me",
    "emergency AC repair West Jordan",
    "AC blowing warm air repair",
    "air conditioner repair Salt Lake County",
    "same day AC repair Utah",
    "central air repair near me",
    "affordable AC repair West Jordan",
  ],
  alternates: {
    canonical: "/ac-repair",
  },
  openGraph: {
    type: "website",
    url: "https://ashaac.com/ac-repair",
    title: "AC Repair Near Me | Same-Day Emergency Air Conditioning | All Solutions HVAC",
    description:
      "Same-day AC repair and cooling diagnostics near you in West Jordan & Salt Lake County. Licensed, insured, 5.0-star rated HVAC contractor.",
    images: [
      {
        url: "https://ashaac.com/images/homepage/van2-no-phone.png",
        width: 1200,
        height: 630,
        alt: "All Solutions Heating & Air Conditioning AC Repair",
      },
    ],
  },
};

const acFaqs = [
  {
    question: "How quickly can an AC technician arrive near me?",
    answer:
      "Our mobile service vans are dispatched daily throughout West Jordan, South Jordan, Sandy, and Salt Lake County. For emergency cooling outages during summer heat waves, we offer fast same-day diagnostic dispatch. Call or text 801-755-3040 for immediate arrival times.",
  },
  {
    question: "Why is my air conditioner blowing warm or room-temperature air?",
    answer:
      "Common causes include a dirty air filter blocking airflow, a blown dual-run capacitor preventing the compressor from starting, low refrigerant from a coil leak, or a tripped circuit breaker. Our certified technicians carry diagnostic gauges and common capacitors on our vans to fix this on the spot.",
  },
  {
    question: "Why is my AC frozen or covered in ice?",
    answer:
      "Ice on your AC condenser or evaporator coils is almost always caused by restricted airflow (severe filter clog or failing blower motor) or low refrigerant levels. Turn your AC system OFF immediately to prevent compressor burnout, switch the fan setting to ON, and call us for an inspection.",
  },
  {
    question: "What brands of air conditioners do you repair?",
    answer:
      "We service, repair, and maintain all major residential and commercial AC manufacturers including Lennox, Carrier, Trane, Goodman, Rheem, York, Amana, Bryant, American Standard, Daikin, Day & Night, and Payne.",
  },
  {
    question: "How much does AC repair typically cost in Salt Lake County?",
    answer:
      "Repair costs depend on the specific failed component. Routine repairs such as capacitors, contactors, and fan motors are very affordable, while refrigerant leak repairs or compressor replacements require more labor. We perform a full diagnostic assessment first and provide clear, upfront pricing before doing any work.",
  },
  {
    question: "What areas do you serve for AC repair near me?",
    answer:
      "We serve all of Salt Lake County, with primary dispatch hubs in West Jordan (84081, 84084, 84088), South Jordan (84095, Daybreak), Riverton (84065, 84096), Herriman, Sandy, Draper, Taylorsville, Murray, Midvale, and Salt Lake City.",
  },
];

export default function ACRepairRootPage() {
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": "https://ashaac.com/ac-repair#service",
    name: "AC Repair Near Me & Emergency Air Conditioning Service",
    serviceType: "Air Conditioning Repair",
    url: "https://ashaac.com/ac-repair",
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
      name: "AC Repair Services",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Emergency Same-Day AC Diagnostic & Repair",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Capacitor, Contactor & Fan Motor Replacement",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Refrigerant Leak Detection & Freon Recharge",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Comprehensive AC Seasonal Tune-Up & Cleaning",
          },
        },
      ],
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: acFaqs.map((faq) => ({
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
      { "@type": "ListItem", position: 3, name: "AC Repair Near Me", item: "https://ashaac.com/ac-repair" },
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
            <span>AC Repair Near Me</span>
          </nav>
          <p className={styles.eyebrow}>All Solutions Heating and Air Conditioning</p>
          <h1>Same-Day AC Repair Near You in West Jordan &amp; Salt Lake County</h1>
          <p className={styles.lede}>
            When hot Utah summer temperatures soar and your air conditioner stops cooling, you need fast, trustworthy help. We provide same-day diagnostics, upfront pricing, and licensed AC repairs across the Salt Lake Valley.
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
          <h2>Fast, Expert Air Conditioning Repairs for Utah Homeowners</h2>
          <p>
            Utah summer heat can push central cooling equipment to its limits. At <strong>All Solutions Heating and Air Conditioning</strong>, our mobile service vans are dispatched directly throughout West Jordan, South Jordan, Sandy, and surrounding communities with diagnostic meters and genuine replacement parts.
          </p>
          <p>
            Whether your AC unit is blowing warm air, making buzzing or screeching noises, leaking water, or freezing up, our certified technicians troubleshoot the root cause with upfront pricing and zero pressure.
          </p>

          <h2>Common AC Problems We Fix Every Day</h2>
          <ul>
            <li><strong>Air Conditioner Blowing Warm Air:</strong> Often caused by a failed capacitor, dead compressor contactor, dirty outside condenser coils, or low refrigerant levels.</li>
            <li><strong>Frozen Evaporator Coils (Ice on Unit):</strong> Severe airflow restrictions from clogged filters or low refrigerant pressure cause moisture on coils to freeze solid.</li>
            <li><strong>Loud Screeching, Rattling, or Humming Noises:</strong> Warning signs of a dying condenser fan motor, loose fan blade, or electrical contactor arcing.</li>
            <li><strong>Water Leaking Around the Indoor Unit:</strong> Clogged condensate drain lines or cracked drain pans can overflow and cause property damage if not cleared.</li>
            <li><strong>AC Short-Cycling (Turning On &amp; Off Rapidly):</strong> Usually caused by an overheating compressor, dirty coils, faulty thermostat, or restricted airflow.</li>
            <li><strong>Weak Airflow From Supply Vents:</strong> Failing blower motor, leaky ductwork, or dirty filters choking your home&apos;s cooling distribution.</li>
          </ul>

          <section className={styles.proof} aria-labelledby="ac-proof-heading">
            <p className={styles.proofLabel}>Verified Customer Satisfaction</p>
            <h2 id="ac-proof-heading">5.0-Star Google Rating (30+ Reviews) &amp; BBB Accredited</h2>
            <p>
              Homeowners across Salt Lake County trust All Solutions for honest cooling diagnostics, reasonable rates, and lasting repairs. We never push system replacements when an honest, reliable repair can get your cool air flowing again.
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

          <h2>All Major Air Conditioning Brands Serviced</h2>
          <p>
            Our technicians have hands-on diagnostic experience with all leading residential and light commercial cooling brands:
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, margin: "16px 0 28px 0" }}>
            {["Lennox", "Carrier", "Trane", "Goodman", "Rheem", "York", "Amana", "Bryant", "Daikin", "American Standard", "Payne", "Mitsubishi"].map((brand) => (
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

          <section className={styles.faqs} aria-labelledby="ac-faq-heading">
            <h2 id="ac-faq-heading">Frequently Asked Questions About AC Repair Near Me</h2>
            {acFaqs.map((faq) => (
              <article key={faq.question} className={styles.faq}>
                <h3>{faq.question}</h3>
                <p>{faq.answer}</p>
              </article>
            ))}
          </section>

          <div className={styles.links}>
            <h2>Local City AC Repair Service Pages</h2>
            <Link href="/ac-repair-west-jordan">AC Repair in West Jordan, UT (Hub)</Link>
            <Link href="/ac-repair-south-jordan">AC Repair in South Jordan, UT</Link>
            <Link href="/ac-repair-riverton">AC Repair in Riverton, UT</Link>
            <Link href="/services/sandy/ac-repair">AC Repair in Sandy, UT</Link>
            <Link href="/services/draper/ac-repair">AC Repair in Draper, UT</Link>
            <Link href="/services/herriman/ac-repair">AC Repair in Herriman, UT</Link>
            <Link href="/services/taylorsville/ac-repair">AC Repair in Taylorsville, UT</Link>
            <Link href="/services/murray/ac-repair">AC Repair in Murray, UT</Link>
            <Link href="/services/midvale/ac-repair">AC Repair in Midvale, UT</Link>
            <Link href="/services/salt-lake-city/ac-repair">AC Repair in Salt Lake City, UT</Link>
            <Link href="/furnace-repair">Furnace Repair Near Me</Link>
            <Link href="/emergency-hvac-repair">Emergency 24/7 HVAC Service</Link>
            <Link href="/services">View All HVAC Services</Link>
          </div>
        </section>
      </main>
      <HomepageFooter />
    </>
  );
}
