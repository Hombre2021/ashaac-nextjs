import Link from "next/link";
import HomepageFooter from "./HomepageFooter";
import HomepageHeader from "./HomepageHeader";
import styles from "./LocalServicePage.module.css";

type LocalServicePageProps = {
  city: "West Jordan" | "South Jordan" | "Riverton";
  service: "Emergency HVAC Repair" | "AC Repair" | "Furnace Repair";
  summary: string;
  symptoms: string[];
  proof?: {
    rating: string;
    reviewCount: number;
    details: string;
  };
  faqs?: Array<{
    question: string;
    answer: string;
  }>;
};

export default function LocalServicePage({ city, service, summary, symptoms, proof, faqs }: LocalServicePageProps) {
  const citySlug = city.toLowerCase().replace(/ /g, "-");
  const pageUrl = `https://ashaac.com/${service.toLowerCase().replace(/ /g, "-")}-${citySlug}`;
  const serviceLinks = [
    ["Emergency HVAC Repair", `/emergency-hvac-repair-${citySlug}`],
    ["AC Repair", `/ac-repair-${citySlug}`],
    ["Furnace Repair", `/furnace-repair-${citySlug}`],
  ] as const;
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${service} in ${city}, Utah`,
    serviceType: service,
    url: pageUrl,
    provider: {
      "@id": "https://ashaac.com/#business",
    },
    areaServed: {
      "@type": "City",
      name: city,
      address: {
        "@type": "PostalAddress",
        addressRegion: "UT",
        addressCountry: "US",
      },
    },
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Services", item: "https://ashaac.com/services" },
      { "@type": "ListItem", position: 2, name: `${city} HVAC services`, item: "https://ashaac.com/service-areas" },
      { "@type": "ListItem", position: 3, name: `${service} in ${city}`, item: pageUrl },
    ],
  };
  const faqSchema = faqs && faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  } : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {faqSchema ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} /> : null}
      <HomepageHeader />
      <main className={styles.page}>
        <section className={styles.hero}>
          <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
            <Link href="/services">Services</Link>
            <Link href="/service-areas">{city} service area</Link>
            <span>{service}</span>
          </nav>
          <p className={styles.eyebrow}>All Solutions Heating and Air Conditioning</p>
          <h1>{service} in {city}, UT</h1>
          <p className={styles.lede}>{summary}</p>
          <div className={styles.actions}>
            <a className={styles.primary} href="tel:8017553040">Call 801-755-3040</a>
            <Link className={styles.secondary} href="/book">Request an appointment</Link>
          </div>
        </section>

        <section className={styles.content}>
          <h2>HVAC help for {city} homeowners</h2>
          <p>
            Tell us what is happening with your system and where service is needed. We will use your service address to confirm whether the request is in our service area and call to discuss the next available appointment.
          </p>
          <h2>Common reasons customers call</h2>
          <ul>{symptoms.map((symptom) => <li key={symptom}>{symptom}</li>)}</ul>
          <p>
            Need a quote, repair, or second opinion? Request an appointment and include your service address, preferred time, and problem description so our team can confirm the next step.
          </p>
          {proof ? (
            <section className={styles.proof} aria-labelledby="local-proof-heading">
              <p className={styles.proofLabel}>Local customer feedback</p>
              <h2 id="local-proof-heading">Verified Google Business Profile details</h2>
              <p>
                All Solutions Heating and Air Conditioning is listed as an HVAC contractor with a {proof.rating} Google rating from {proof.reviewCount} reviews. {proof.details}
              </p>
              <Link href="/reviews">Read customer reviews</Link>
            </section>
          ) : null}
          {faqs && faqs.length > 0 ? (
            <section className={styles.faqs} aria-labelledby="local-faq-heading">
              <h2 id="local-faq-heading">Emergency HVAC repair questions</h2>
              {faqs.map((faq) => (
                <article key={faq.question} className={styles.faq}>
                  <h3>{faq.question}</h3>
                  <p>{faq.answer}</p>
                </article>
              ))}
            </section>
          ) : null}
          <div className={styles.links}>
            <h2>Related HVAC services</h2>
            {serviceLinks.map(([label, href]) => <Link key={href} href={href}>{label} in {city}</Link>)}
            <Link href="/services">View all HVAC services</Link>
          </div>
        </section>
      </main>
      <HomepageFooter />
    </>
  );
}
