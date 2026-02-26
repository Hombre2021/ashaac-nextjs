import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import StructuredData from "@/components/StructuredData";
import { absoluteUrl, siteDescription, siteName, siteUrl } from "@/lib/seo";
import "./globals.css";

const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: siteName,
  category: "Home Services",
  title: {
    default: `HVAC Installation & Repair in West Jordan, UT | ${siteName}`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: [
    "HVAC West Jordan",
    "HVAC Salt Lake County",
    "air conditioning repair West Jordan",
    "furnace installation West Jordan",
    "mini split installation Utah",
    "heat pump installation Utah",
    "HVAC contractor near me",
    "emergency HVAC repair",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: absoluteUrl("/"),
    title: `HVAC Installation & Repair in West Jordan, UT | ${siteName}`,
    description: siteDescription,
    siteName,
    locale: "en_US",
    images: [
      {
        url: absoluteUrl("/images/homepage/van2.png"),
        width: 1200,
        height: 630,
        alt: `${siteName} service van`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `HVAC Installation & Repair in West Jordan, UT | ${siteName}`,
    description: siteDescription,
    images: [absoluteUrl("/images/homepage/van2.png")],
  },
  creator: siteName,
  publisher: siteName,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  icons: {
    icon: [
      { url: "/images/homepage/Google-verified.png", type: "image/png" },
    ],
    apple: [
      { url: "/images/homepage/Google-verified.png", type: "image/png" },
    ],
    shortcut: [
      { url: "/images/homepage/Google-verified.png", type: "image/png" },
    ],
  },
  appLinks: {
    web: {
      url: absoluteUrl("/"),
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {gaMeasurementId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${gaMeasurementId}');`}
            </Script>
          </>
        ) : null}
        <StructuredData />
        <div className="appRoot">{children}</div>
      </body>
    </html>
  );
}
