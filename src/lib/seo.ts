const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ashaac.com";

export const siteUrl = rawSiteUrl.replace(/\/$/, "");
export const siteName = "All Solutions Heating and Air Conditioning";
export const legalBusinessName = "All Solutions Heating and Air Conditioning LLC";
export const siteDescription =
  "Trusted HVAC installation, replacement, maintenance, and repair in West Jordan and Salt Lake County. Affordable, efficient, reliable service since 2012.";

export const primaryPhone = "+1-801-755-3040";
export const secondaryPhone = "+1-801-512-7103";
export const businessEmail = "contact@ashaac.com";

export const businessAddress = {
  addressLocality: "West Jordan",
  addressRegion: "UT",
  addressCountry: "US",
};

export const businessMapUrl =
  "https://www.google.com/maps/search/?api=1&query=West%20Jordan%2C%20Utah";

export const googleBusinessProfileUrl =
  "https://www.google.com/search?q=All+Solutions+Heating+And+Air+Conditioning";

export const googleReviewUrl =
  "https://www.google.com/search?q=all+solutions+Heating+And+Air+Conditioning+google+reviews";

export const areaServed = [
  "West Jordan",
  "South Jordan",
  "Sandy",
  "Murray",
  "Midvale",
  "Taylorsville",
  "Draper",
  "Salt Lake City",
  "Salt Lake County",
];

export function absoluteUrl(path: string = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl}${normalizedPath}`;
}

export function buildLocalBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "HVACBusiness",
    "@id": absoluteUrl("/#business"),
    name: siteName,
    legalName: legalBusinessName,
    url: siteUrl,
    image: absoluteUrl("/images/homepage/van2.png"),
    logo: absoluteUrl("/images/homepage/Google-verified.png"),
    description: siteDescription,
    telephone: primaryPhone,
    email: businessEmail,
    hasMap: businessMapUrl,
    address: {
      "@type": "PostalAddress",
      ...businessAddress,
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: primaryPhone,
        contactType: "customer service",
        areaServed: "US-UT",
        availableLanguage: ["English", "Spanish"],
      },
      {
        "@type": "ContactPoint",
        telephone: secondaryPhone,
        contactType: "customer service",
        areaServed: "US-UT",
        availableLanguage: ["English", "Spanish"],
      },
    ],
    areaServed: areaServed.map((name) => ({
      "@type": name === "Salt Lake County" ? "AdministrativeArea" : "City",
      name,
    })),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "HVAC Services",
      itemListElement: [
        "HVAC Installation",
        "Air Conditioning Repair",
        "Furnace Installation and Repair",
        "Mini-Split Installation",
        "Heat Pump Installation and Repair",
      ].map((serviceName) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: serviceName,
        },
      })),
    },
    sameAs: [
      "https://www.bbb.org/us/ut/west-jordan/profile/heating-and-air-conditioning/all-solutions-heating-and-air-conditioning-llc-1166-90042709",
    ],
    priceRange: "$$",
  };
}

export function buildWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    url: siteUrl,
    name: siteName,
    inLanguage: "en-US",
    publisher: {
      "@id": absoluteUrl("/#business"),
    },
  };
}

export function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": absoluteUrl("/#organization"),
    name: siteName,
    url: siteUrl,
    logo: absoluteUrl("/images/homepage/Google-verified.png"),
    email: businessEmail,
    telephone: primaryPhone,
    address: {
      "@type": "PostalAddress",
      ...businessAddress,
    },
  };
}