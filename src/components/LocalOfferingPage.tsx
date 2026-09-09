import Link from "next/link";
import HomepageFooter from "./HomepageFooter";
import HomepageHeader from "./HomepageHeader";
import styles from "./LocalServicePage.module.css";
import { cityContext, type LocalCitySlug } from "@/lib/localOfferings";

type LocalOfferingPageProps = {
  city: string;
  citySlug: LocalCitySlug;
  offering: {
    slug: string;
    title: string;
    summary: string;
    details: readonly string[];
    faqs: readonly (readonly [string, string])[];
  };
};

export default function LocalOfferingPage({ city, citySlug, offering }: LocalOfferingPageProps) {
  const pageUrl = `https://ashaac.com/services/${citySlug}/${offering.slug}`;
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${offering.title} in ${city}, Utah`,
    serviceType: offering.title,
    url: pageUrl,
    provider: { "@id": "https://ashaac.com/#business" },
    areaServed: {
      "@type": "City",
      name: city,
      address: { "@type": "PostalAddress", addressRegion: "UT", addressCountry: "US" },
    },
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Services", item: "https://ashaac.com/services" },
      { "@type": "ListItem", position: 2, name: `${city} HVAC services`, item: "https://ashaac.com/service-areas" },
      { "@type": "ListItem", position: 3, name: offering.title, item: pageUrl },
    ],
  };
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: offering.faqs.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <HomepageHeader />
      <main className={styles.page}>
        <section className={styles.hero}>
          <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
            <Link href="/services">Services</Link>
            <Link href="/service-areas">{city} service area</Link>
            <span>{offering.title}</span>
          </nav>
          <p className={styles.eyebrow}>All Solutions Heating and Air Conditioning</p>
          <h1>{offering.title} in {city}, UT</h1>
          <p className={styles.lede}>{offering.summary}</p>
          <div className={styles.actions}>
            <a className={styles.primary} href="tel:8017553040">Call 801-755-3040</a>
            {" "}
            <Link className={styles.secondary} href="/book">Request an appointment</Link>
          </div>
        </section>
        <section className={styles.content}>
          <h2>{offering.title} for {city} homeowners</h2>
          <p>
            Share the service address, your current equipment, and what you want to improve. All Solutions can review the request and discuss the appropriate next step.
          </p>
          <p>{cityContext[citySlug]}</p>
          <h2>What this service can help with</h2>
          <ul>{offering.details.map((detail) => <li key={detail}>{detail}</li>)}</ul>
          <section className={styles.faqs} aria-labelledby="offering-faq-heading">
            <h2 id="offering-faq-heading">{offering.title} questions</h2>
            {offering.faqs.map(([question, answer]) => (
              <article key={question} className={styles.faq}>
                <h3>{question}</h3>
                <p>{answer}</p>
              </article>
            ))}
          </section>
          <div className={styles.links}>
            <h2>Related HVAC services</h2>
            <Link href={`/emergency-hvac-repair-${citySlug}`}>Emergency HVAC repair in {city}</Link>
            <Link href={`/ac-repair-${citySlug}`}>AC repair in {city}</Link>
            <Link href={`/furnace-repair-${citySlug}`}>Furnace repair in {city}</Link>
            <Link href="/services">View all HVAC services</Link>
          </div>
        </section>
      </main>
      <HomepageFooter />
    </>
  );
}
