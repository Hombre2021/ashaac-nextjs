const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://ashaac.com").replace(/\/$/, "");

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "HVACBusiness",
  "@id": `${siteUrl}/#business`,
  name: "All Solutions Heating and Air Conditioning",
  alternateName: "All Solutions HVAC",
  url: siteUrl,
  telephone: "+1-801-755-3040",
  email: "ashaacutah@gmail.com",
  hasMap: "https://maps.google.com/?q=All+Solutions+Heating+and+Air+Conditioning+West+Jordan+UT",
  logo: `${siteUrl}/images/homepage/van2-no-phone.png`,
  image: [
    `${siteUrl}/images/about/leandro-van.jpg`,
    `${siteUrl}/images/homepage/van2-no-phone.png`,
    `${siteUrl}/images/homepage/commercial.jpg`,
    `${siteUrl}/images/services/Heat-pump-WJ.webp`,
  ],
  description:
    "Mobile HVAC contractor based in West Jordan, UT providing on-site 24/7 emergency AC repair, furnace repair, heating diagnostics, furnace replacement, heat pump installation, mini-splits, and maintenance across Salt Lake County.",
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
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "00:00",
      closes: "23:59",
    },
  ],
  priceRange: "$$",
  currenciesAccepted: "USD",
  paymentAccepted: "Cash, Credit Card, Debit Card, Check, ACH, Financing",
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "5.0",
    reviewCount: "30",
    bestRating: "5",
    worstRating: "1",
  },
  review: [
    {
      "@type": "Review",
      author: { "@type": "Person", name: "Judy Nielsen" },
      reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
      reviewBody: "My 97-year-old father called me informing me that his heater was not working. The first person that I thought of was Leandro at All Solutions HVAC. Prompt, caring, and professional.",
    },
    {
      "@type": "Review",
      author: { "@type": "Person", name: "Samra Zele" },
      reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
      reviewBody: "Leandro was great!! Knew exactly what was wrong with our unit and fixed it the same day. He is an honest technician and our go-to for replacement and repair.",
    },
    {
      "@type": "Review",
      author: { "@type": "Person", name: "Burl Moimoi" },
      reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
      reviewBody: "Pricing was very reasonable and they did a great job with installation and even cleaned up everything in the work area. Highly recommended.",
    },
    {
      "@type": "Review",
      author: { "@type": "Person", name: "Ken Coleman" },
      reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
      reviewBody: "Leandro helped me out start to finish, suggesting what to do next and selecting the right equipment for my AC. Always on time and very knowledgeable.",
    },
  ],
  areaServed: [
    { "@type": "City", name: "West Jordan" },
    { "@type": "City", name: "South Jordan" },
    { "@type": "City", name: "Riverton" },
    { "@type": "City", name: "Herriman" },
    { "@type": "City", name: "Sandy" },
    { "@type": "City", name: "Murray" },
    { "@type": "City", name: "Midvale" },
    { "@type": "City", name: "Taylorsville" },
    { "@type": "City", name: "Draper" },
    { "@type": "City", name: "Kearns" },
    { "@type": "City", name: "Cottonwood Heights" },
    { "@type": "City", name: "Holladay" },
    { "@type": "City", name: "Salt Lake City" },
    { "@type": "AdministrativeArea", name: "Salt Lake County" },
    { "@type": "AdministrativeArea", name: "Salt Lake Valley" },
  ],
  knowsAbout: [
    "Furnace repair near me",
    "Furnace repair service",
    "Emergency furnace repair",
    "Heating contractor",
    "Heating system repairs",
    "Gas furnace troubleshooting",
    "AC repair near me",
    "Air conditioning repair service",
    "Central air conditioning maintenance",
    "HVAC installation",
    "Air conditioning repair",
    "Furnace installation and replacement",
    "Furnace repair",
    "Heat pump installation",
    "Mini-split installation",
    "Indoor air quality",
    "Emergency HVAC repair",
    "Seasonal HVAC tune-ups",
    "Energy-efficient heating and cooling",
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "HVAC Services",
    itemListElement: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Furnace Repair Near Me & Emergency Heating Service",
          serviceType: "Furnace Repair",
          url: `${siteUrl}/furnace-repair`,
          description: "Same-day furnace repair, no-heat diagnostics, blower motor fixes, and emergency heating repairs across West Jordan and Salt Lake County.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "AC Repair Near Me & Emergency Cooling Service",
          serviceType: "Air Conditioning Repair",
          url: `${siteUrl}/ac-repair`,
          description: "Same-day AC repair, refrigerant leak detection, compressor diagnostics, and emergency cooling service across West Jordan and Salt Lake County.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "HVAC Installation & Replacement",
          description: "Complete heating and air conditioning system replacement and new installations.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Heat Pump Installation & Repair",
          description: "All-in-one heating and cooling solutions with high SEER2 energy efficiency.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Ductless Mini-Split Installation",
          description: "Multi-zone and single-room ductless climate control solutions.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Indoor Air Quality & Maintenance",
          description: "Filter replacements, airflow optimization, tune-ups, and air purification systems.",
        },
      },
    ],
  },
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: "+1-801-755-3040",
      contactType: "customer service",
      areaServed: "US",
      availableLanguage: ["English", "Spanish"],
    },
  ],
  sameAs: [
    "https://maps.google.com/?q=All+Solutions+Heating+and+Air+Conditioning+West+Jordan+UT",
    "https://www.facebook.com/AllSolutionsHVACUtah",
    "https://www.bbb.org/us/ut/west-jordan/profile/heating-and-air-conditioning/all-solutions-heating-and-air-conditioning-llc-1166-90042709",
  ],
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
