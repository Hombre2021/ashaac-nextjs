import type { MetadataRoute } from "next";
import { localCities, localOfferings } from "@/lib/localOfferings";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://ashaac.com").replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  const routes: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
    { path: "", priority: 1, changeFrequency: "weekly" },
    { path: "/about", priority: 0.8, changeFrequency: "monthly" },
    { path: "/services", priority: 0.9, changeFrequency: "weekly" },
    { path: "/service-areas", priority: 0.9, changeFrequency: "monthly" },
    { path: "/emergency-hvac-repair-west-jordan", priority: 0.95, changeFrequency: "weekly" },
    { path: "/ac-repair-west-jordan", priority: 0.9, changeFrequency: "weekly" },
    { path: "/furnace-repair-west-jordan", priority: 0.9, changeFrequency: "weekly" },
    { path: "/emergency-hvac-repair-south-jordan", priority: 0.9, changeFrequency: "weekly" },
    { path: "/ac-repair-south-jordan", priority: 0.85, changeFrequency: "weekly" },
    { path: "/furnace-repair-south-jordan", priority: 0.85, changeFrequency: "weekly" },
    { path: "/emergency-hvac-repair-riverton", priority: 0.85, changeFrequency: "weekly" },
    { path: "/ac-repair-riverton", priority: 0.8, changeFrequency: "weekly" },
    { path: "/furnace-repair-riverton", priority: 0.8, changeFrequency: "weekly" },
    { path: "/projects", priority: 0.85, changeFrequency: "weekly" },
    { path: "/reviews", priority: 0.8, changeFrequency: "weekly" },
    { path: "/contact", priority: 0.9, changeFrequency: "monthly" },
    { path: "/book", priority: 0.85, changeFrequency: "monthly" },
    { path: "/financing", priority: 0.8, changeFrequency: "monthly" },
    { path: "/faqs", priority: 0.7, changeFrequency: "monthly" },
    { path: "/diy-help-center", priority: 0.6, changeFrequency: "monthly" },
    { path: "/privacy-policy", priority: 0.4, changeFrequency: "yearly" },
    { path: "/terms-and-conditions", priority: 0.4, changeFrequency: "yearly" },
    { path: "/legal-policies", priority: 0.4, changeFrequency: "yearly" },
    { path: "/valley", priority: 0.6, changeFrequency: "monthly" },
  ];

  localCities.forEach((city) => {
    localOfferings.forEach((offering) => {
      routes.push({ path: `/services/${city}/${offering.slug}`, priority: city === "west-jordan" ? 0.85 : 0.75, changeFrequency: "monthly" });
    });
  });

  return routes.map((route) => ({
    url: `${siteUrl}${route.path || "/"}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
