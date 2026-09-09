import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  async redirects() {
    return [
      {
        source: "/about-us",
        destination: "/about",
        permanent: true,
      },
      {
        source: "/contact-us",
        destination: "/contact",
        permanent: true,
      },
      {
        source: "/all-seasons-privacy-policy",
        destination: "/privacy-policy",
        permanent: true,
      },
      {
        source: "/all-seasons-privacy-policy/",
        destination: "/privacy-policy",
        permanent: true,
      },
      {
        source: "/about-us/",
        destination: "/about",
        permanent: true,
      },
      {
        source: "/contact-us/",
        destination: "/contact",
        permanent: true,
      },
      // City Service Mappings & Redundancy
      {
        source: "/services/south-jordan/ac-repair",
        destination: "/ac-repair-south-jordan",
        permanent: true,
      },
      {
        source: "/services/west-jordan/ac-repair",
        destination: "/ac-repair-west-jordan",
        permanent: true,
      },
      {
        source: "/services/riverton/ac-repair",
        destination: "/ac-repair-riverton",
        permanent: true,
      },
      {
        source: "/services/south-jordan/furnace-repair",
        destination: "/furnace-repair-south-jordan",
        permanent: true,
      },
      {
        source: "/services/west-jordan/furnace-repair",
        destination: "/furnace-repair-west-jordan",
        permanent: true,
      },
      {
        source: "/services/riverton/furnace-repair",
        destination: "/furnace-repair-riverton",
        permanent: true,
      },
      {
        source: "/services/south-jordan/emergency-hvac",
        destination: "/emergency-hvac-repair-south-jordan",
        permanent: true,
      },
      {
        source: "/services/west-jordan/emergency-hvac",
        destination: "/emergency-hvac-repair-west-jordan",
        permanent: true,
      },
      {
        source: "/services/riverton/emergency-hvac",
        destination: "/emergency-hvac-repair-riverton",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
