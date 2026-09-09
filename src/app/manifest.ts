import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "All Solutions Heating and Air Conditioning",
    short_name: "All Solutions HVAC",
    description:
      "Licensed HVAC contractor in West Jordan, UT providing AC repair, furnace replacement, heat pump installation, and emergency service across Salt Lake County.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#095f91",
    icons: [
      {
        src: "/images/homepage/all-solutions-logo-no-phone.png",
        sizes: "192x192 512x512",
        type: "image/png",
      },
    ],
  };
}
