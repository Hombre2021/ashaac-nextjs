export type ServiceArea = {
  slug: string;
  city: string;
  county: string;
  stateCode: string;
  summary: string;
  neighborhoods: string[];
};

export const serviceAreas: ServiceArea[] = [
  {
    slug: "west-jordan",
    city: "West Jordan",
    county: "Salt Lake County",
    stateCode: "UT",
    summary: "Fast HVAC installation, replacement, and repair services across West Jordan homes and small businesses.",
    neighborhoods: ["Jordan Landing", "Copper Hills", "Oquirrh", "West Jordan Highlands"],
  },
  {
    slug: "south-jordan",
    city: "South Jordan",
    county: "Salt Lake County",
    stateCode: "UT",
    summary: "High-efficiency HVAC system installs and seasonal maintenance for South Jordan properties.",
    neighborhoods: ["Daybreak", "The District", "River Heights", "South Jordan East"],
  },
  {
    slug: "sandy",
    city: "Sandy",
    county: "Salt Lake County",
    stateCode: "UT",
    summary: "Professional furnace, AC, and heat pump service in Sandy with same-day scheduling when available.",
    neighborhoods: ["East Sandy", "Crescent", "White City", "Sandy Central"],
  },
  {
    slug: "murray",
    city: "Murray",
    county: "Salt Lake County",
    stateCode: "UT",
    summary: "Dependable HVAC diagnostics, repair, and replacements throughout Murray and nearby communities.",
    neighborhoods: ["Murray North", "Murray Central", "Murray South", "Vine Street Corridor"],
  },
  {
    slug: "midvale",
    city: "Midvale",
    county: "Salt Lake County",
    stateCode: "UT",
    summary: "Residential and light commercial HVAC services for Midvale with clear recommendations and fair pricing.",
    neighborhoods: ["Historic Midvale", "Fort Union", "Midvale East", "Bingham Junction"],
  },
  {
    slug: "taylorsville",
    city: "Taylorsville",
    county: "Salt Lake County",
    stateCode: "UT",
    summary: "Trusted HVAC installation and repair in Taylorsville focused on comfort, efficiency, and reliability.",
    neighborhoods: ["Bennion", "Taylorsville West", "Mid-Valley", "Southridge"],
  },
  {
    slug: "draper",
    city: "Draper",
    county: "Salt Lake County",
    stateCode: "UT",
    summary: "Energy-efficient HVAC upgrades and service plans for Draper homes and growing businesses.",
    neighborhoods: ["SunCrest", "Draper East Bench", "South Mountain", "Draper Historic"],
  },
  {
    slug: "salt-lake-city",
    city: "Salt Lake City",
    county: "Salt Lake County",
    stateCode: "UT",
    summary: "Comprehensive HVAC services in Salt Lake City, including replacements, maintenance, and emergency repair support.",
    neighborhoods: ["Sugar House", "The Avenues", "Downtown", "Liberty Wells"],
  },
];

export function findServiceAreaBySlug(slug: string) {
  return serviceAreas.find((area) => area.slug === slug);
}