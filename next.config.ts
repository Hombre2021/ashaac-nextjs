import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2678400,
  },
  turbopack: {
    root: process.cwd(),
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
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
      {
        source: "/faqs/",
        destination: "/faqs",
        permanent: true,
      },
      {
        source: "/services/",
        destination: "/services",
        permanent: true,
      },
      {
        source: "/reviews/",
        destination: "/reviews",
        permanent: true,
      },
      {
        source: "/terms-and-conditions/",
        destination: "/terms-and-conditions",
        permanent: true,
      },
      {
        source: "/service-area",
        destination: "/service-areas",
        permanent: true,
      },
      {
        source: "/service-area/",
        destination: "/service-areas",
        permanent: true,
      },
      {
        source: "/service-areas/",
        destination: "/service-areas",
        permanent: true,
      },
      {
        source: "/salt-lake-valley",
        destination: "/valley",
        permanent: true,
      },
      {
        source: "/salt-lake-valley/",
        destination: "/valley",
        permanent: true,
      },
      {
        source: "/diy-help",
        destination: "/diy-help-center",
        permanent: true,
      },
      {
        source: "/diy-help/",
        destination: "/diy-help-center",
        permanent: true,
      },
      {
        source: "/diy-help-center/",
        destination: "/diy-help-center",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
