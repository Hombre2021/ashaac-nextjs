import type { MetadataRoute } from "next";
import { siteDescription, siteName, siteUrl } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteName,
    short_name: "All Solutions HVAC",
    description: siteDescription,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f172a",
    lang: "en-US",
    icons: [
      {
        src: "/images/homepage/Google-verified.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/images/homepage/Google-verified.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    categories: ["business", "home services"],
    id: siteUrl,
  };
}