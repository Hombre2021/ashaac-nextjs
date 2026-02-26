import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";
import { serviceAreas } from "@/data/serviceAreas";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const routes: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
    { path: "", priority: 1, changeFrequency: "weekly" },
    { path: "/about", priority: 0.8, changeFrequency: "monthly" },
    { path: "/services", priority: 0.9, changeFrequency: "weekly" },
    { path: "/projects", priority: 0.85, changeFrequency: "weekly" },
    { path: "/reviews", priority: 0.8, changeFrequency: "weekly" },
    { path: "/emergency-hvac-repair", priority: 0.9, changeFrequency: "weekly" },
    { path: "/diy-help-center", priority: 0.75, changeFrequency: "weekly" },
    { path: "/contact", priority: 0.9, changeFrequency: "monthly" },
    { path: "/financing", priority: 0.8, changeFrequency: "monthly" },
    { path: "/faqs", priority: 0.7, changeFrequency: "monthly" },
    { path: "/privacy-policy", priority: 0.4, changeFrequency: "yearly" },
    { path: "/terms-and-conditions", priority: 0.4, changeFrequency: "yearly" },
    { path: "/legal-policies", priority: 0.4, changeFrequency: "yearly" },
    { path: "/valley", priority: 0.6, changeFrequency: "monthly" },
    { path: "/service-areas", priority: 0.85, changeFrequency: "weekly" },
  ];

  const cityRoutes = serviceAreas.map((area) => ({
    path: `/service-areas/${area.slug}`,
    priority: 0.8,
    changeFrequency: "weekly" as const,
  }));

  return [...routes, ...cityRoutes].map((route) => ({
    url: `${siteUrl}${route.path || "/"}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
