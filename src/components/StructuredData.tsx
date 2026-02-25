const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://ashaac.com").replace(/\/$/, "");

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "HVACBusiness",
  "@id": `${siteUrl}/#business`,
  name: "All Solutions Heating and Air Conditioning",
  url: siteUrl,
  telephone: "+1-801-755-3040",
  email: "contact@ashaac.com",
  image: `${siteUrl}/images/homepage/van2.png`,
  address: {
    "@type": "PostalAddress",
    streetAddress: "4434 W 8790 S",
    addressLocality: "West Jordan",
    addressRegion: "UT",
    postalCode: "84088",
    addressCountry: "US",
  },
  areaServed: [
    { "@type": "City", name: "West Jordan" },
    { "@type": "City", name: "Salt Lake City" },
    { "@type": "AdministrativeArea", name: "Salt Lake County" },
  ],
  sameAs: [
    "https://www.bbb.org/us/ut/west-jordan/profile/heating-and-air-conditioning/all-solutions-heating-and-air-conditioning-llc-1166-90042709",
  ],
  priceRange: "$$",
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${siteUrl}/#website`,
  url: siteUrl,
  name: "All Solutions Heating and Air Conditioning",
  inLanguage: "en-US",
  publisher: {
    "@id": `${siteUrl}/#business`,
  },
};

export default function StructuredData() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  );
}
