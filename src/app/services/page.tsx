import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import HomepageHeader from "../../components/HomepageHeader";
import ServicesHero from "../../components/ServicesHero";
import ServicesContent from "../../components/ServicesContent";
import HomepageFooter from "../../components/HomepageFooter";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://ashaac.com").replace(/\/$/, "");

export const metadata: Metadata = {
  title: "HVAC Services: AC, Furnace & Heat Pump Installation & Repair | West Jordan, UT",
  description:
    "Complete HVAC services in West Jordan and Salt Lake County: central AC repair & installation, high-efficiency furnaces, heat pumps, ductless mini-splits, and maintenance.",
  keywords: [
    "HVAC services West Jordan",
    "AC installation West Jordan",
    "furnace installation Salt Lake County",
    "HVAC maintenance Utah",
    "mini split services West Jordan",
    "heat pump repair Salt Lake County",
    "commercial HVAC Salt Lake Valley",
  ],
  alternates: {
    canonical: "/services",
  },
  openGraph: {
    type: "website",
    url: `${siteUrl}/services`,
    title: "HVAC Services: AC, Furnace & Heat Pump Installation & Repair | West Jordan, UT",
    description: "Complete HVAC services in West Jordan and Salt Lake County: AC repair, furnace installation, heat pumps, mini-splits, and maintenance.",
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
    { "@type": "ListItem", position: 2, name: "Services", item: `${siteUrl}/services` },
  ],
};

const servicesSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: [
    {
      "@type": "Service",
      position: 1,
      name: "Air Conditioning Installation & Repair",
      description: "High-efficiency central air conditioning installation, troubleshooting, freon recharge, and condenser repair.",
      url: `${siteUrl}/ac-repair-west-jordan`,
      provider: { "@id": `${siteUrl}/#business` },
    },
    {
      "@type": "Service",
      position: 2,
      name: "Furnace Installation & Repair",
      description: "Residential and commercial furnace replacement, diagnostic troubleshooting, and safety inspections.",
      url: `${siteUrl}/furnace-repair-west-jordan`,
      provider: { "@id": `${siteUrl}/#business` },
    },
    {
      "@type": "Service",
      position: 3,
      name: "Heat Pump Installation & Service",
      description: "Year-round heating and cooling solutions offering superior efficiency and lower utility costs.",
      url: `${siteUrl}/services/west-jordan/heat-pump-installation`,
      provider: { "@id": `${siteUrl}/#business` },
    },
    {
      "@type": "Service",
      position: 4,
      name: "Ductless Mini-Split Installation",
      description: "Targeted single-zone and multi-zone heating and cooling for homes, additions, and offices.",
      url: `${siteUrl}/services/west-jordan/mini-split-installation`,
      provider: { "@id": `${siteUrl}/#business` },
    },
    {
      "@type": "Service",
      position: 5,
      name: "Emergency HVAC Repair",
      description: "Fast-response 24/7 heating and cooling emergency repair across Salt Lake County.",
      url: `${siteUrl}/emergency-hvac-repair-west-jordan`,
      provider: { "@id": `${siteUrl}/#business` },
    },
  ],
};

export default function ServicesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(servicesSchema) }}
      />
      <HomepageHeader />
      <ServicesHero />
      <ServicesContent />
      <div style={{
        width: '100%',
        maxWidth: 1100,
        margin: '48px auto 0 auto',
        padding: '0 24px',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 32,
      }}>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <Image
            src="/images/services/ac-downtown.webp"
            alt="Central Air Conditioning System Installation in West Jordan Utah"
            width={340}
            height={220}
            sizes="(max-width: 768px) 100vw, 340px"
            style={{ borderRadius: 14, boxShadow: "0 2px 16px rgba(0,0,0,0.10)", width: "100%", maxWidth: 340, height: "auto", objectFit: "cover" }}
          />
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <Image
            src="/images/services/Heat-pump-WJ.webp"
            alt="High-Efficiency Heat Pump Installation in West Jordan UT"
            width={340}
            height={220}
            sizes="(max-width: 768px) 100vw, 340px"
            style={{ borderRadius: 14, boxShadow: "0 2px 16px rgba(0,0,0,0.10)", width: "100%", maxWidth: 340, height: "auto", objectFit: "cover" }}
          />
        </div>
      </div>

      <div style={{
        maxWidth: 800,
        margin: '40px auto 32px auto',
        padding: '0 24px',
        fontSize: 20,
        lineHeight: 1.6,
        color: '#222',
        textAlign: 'center',
      }}>
        <strong>Air Conditioning (AC) Units and Heat Pumps</strong><br />
        We offer professional installation and maintenance of air conditioning (AC) units and heat pumps. Our team will assess your cooling needs and recommend the most suitable AC unit or heat pump for your space. Whether it&apos;s a central air conditioning system or a heat pump that provides both heating and cooling, we ensure proper installation and optimal performance to keep your indoor environment ideally comfortable.
      </div>

      <div style={{
        width: '100%',
        maxWidth: 1100,
        margin: '0 auto 32px auto',
        padding: '0 24px',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 32,
      }}>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <Image
            src="/images/services/mini-split.webp"
            alt="Ductless Mini-Split Heat Pump and AC Installation"
            width={340}
            height={220}
            sizes="(max-width: 768px) 100vw, 340px"
            style={{ borderRadius: 14, boxShadow: "0 2px 16px rgba(0,0,0,0.10)", width: "100%", maxWidth: 340, height: "auto", objectFit: "cover" }}
          />
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <Image
            src="/images/services/mini-split-room2.webp"
            alt="Indoor Wall Mounted Mini-Split Air Conditioner"
            width={340}
            height={220}
            sizes="(max-width: 768px) 100vw, 340px"
            style={{ borderRadius: 14, boxShadow: "0 2px 16px rgba(0,0,0,0.10)", width: "100%", maxWidth: 340, height: "auto", objectFit: "cover" }}
          />
        </div>
      </div>

      <div style={{
        maxWidth: 800,
        margin: '0 auto 32px auto',
        padding: '0 24px',
        fontSize: 20,
        lineHeight: 1.6,
        color: '#222',
        textAlign: 'center',
      }}>
        <strong>Mini-Split Systems</strong><br />
        Mini-split systems are an excellent solution for spaces where traditional ductwork is not feasible or desirable. Our technicians have expertise in the installation and also maintenance of mini-split systems. These systems provide efficient heating and cooling, allowing you to create customized comfort zones in different areas of your home or business. We&apos;ll help you select the right mini-split system and ensure precise installation for maximum comfort.
      </div>

      <div style={{
        maxWidth: 800,
        margin: '0 auto 56px auto',
        padding: '0 24px',
        fontSize: 20,
        lineHeight: 1.6,
        color: '#222',
        textAlign: 'center',
      }}>
        <strong>Through-the-Window or Wall Units</strong><br />
        For spaces where a full central air system is not necessary, we offer the installation of through-the-window or wall units. These units are efficient and cost-effective options for cooling or heating specific areas. Our technicians will recommend the most suitable through-the-window or wall unit for your needs and ensure proper installation for optimal performance.
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto 56px auto', padding: '0 24px', textAlign: 'center' }}>
        <p style={{ fontSize: '1.1rem', color: '#4b5563', lineHeight: 1.7 }}>
          Looking for city-specific service? Explore our service areas in{' '}
          <Link href="/emergency-hvac-repair-west-jordan" style={{ color: '#095f91', fontWeight: 600 }}>West Jordan</Link>,{' '}
          <Link href="/emergency-hvac-repair-south-jordan" style={{ color: '#095f91', fontWeight: 600 }}>South Jordan</Link>, and{' '}
          <Link href="/emergency-hvac-repair-riverton" style={{ color: '#095f91', fontWeight: 600 }}>Riverton</Link>.
        </p>
      </div>

      <HomepageFooter />
    </>
  );
}
