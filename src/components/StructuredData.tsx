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
    `${siteUrl}/images/homepage/van2-no-phone.png`,
    `${siteUrl}/images/homepage/commercial.jpg`,
    `${siteUrl}/images/services/Heat-pump-WJ.webp`,
  ],
  description:
    "Mobile HVAC contractor based in West Jordan, UT providing on-site emergency AC repair, furnace replacement, heat pump installation, mini-splits, and maintenance across Salt Lake County.",
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
  priceRange: "$$",
  currenciesAccepted: "USD",
  paymentAccepted: "Cash, Credit Card, Debit Card, Check, ACH, Financing",
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
    { "@type": "City", name: "Salt Lake City" },
    { "@type": "AdministrativeArea", name: "Salt Lake County" },
    { "@type": "AdministrativeArea", name: "Salt Lake Valley" },
  ],
  knowsAbout: [
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
          name: "HVAC Installation & Replacement",
          description: "Complete heating and air conditioning system replacement and new installations.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Air Conditioning Repair",
          description: "Prompt troubleshooting, refrigerant leak detection, compressor repair, and AC service.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Furnace Installation and Repair",
          description: "High-efficiency furnace replacements, emergency heater repair, and seasonal tune-ups.",
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
    "https://www.facebook.com/Warrior2021Q",
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
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteUrl}/services?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Do you offer emergency HVAC repair in West Jordan, Utah?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. All Solutions Heating and Air Conditioning provides fast emergency HVAC repair and same-day troubleshooting for homeowners across West Jordan, South Jordan, Riverton, and Salt Lake County.",
      },
    },
    {
      "@type": "Question",
      name: "What HVAC services do you provide in Salt Lake County?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We provide complete residential and commercial HVAC services including AC repair, AC installation, furnace repair, furnace replacement, heat pumps, ductless mini-splits, and maintenance tune-ups.",
      },
    },
    {
      "@type": "Question",
      name: "Do you offer free estimates on new HVAC installations?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, we provide free in-person or upfront estimates for new HVAC systems, furnace replacements, and heat pump installations.",
      },
    },
    {
      "@type": "Question",
      name: "Do you serve South Jordan, Riverton, Herriman, and nearby Utah cities?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. We serve homeowners throughout West Jordan, South Jordan, Riverton, Herriman, Sandy, Draper, Taylorsville, Murray, and surrounding communities in Salt Lake County, Utah.",
      },
    },
  ],
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}
