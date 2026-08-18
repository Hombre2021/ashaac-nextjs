import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import GoogleTracking from "@/components/GoogleTracking";
import AttributionCapture from "@/components/AttributionCapture";
import MetaPixel from "@/components/MetaPixel";
import StructuredData from "@/components/StructuredData";
import WebsiteAIAssistant from "@/components/WebsiteAIAssistant";
import MobileCallAction from "@/components/MobileCallAction";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ashaac.com";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  preload: false,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "HVAC Installation & Repair in West Jordan, UT | All Solutions Heating and Air Conditioning",
    template: "%s | All Solutions Heating and Air Conditioning",
  },
  description:
    "Trusted HVAC installation, replacement, maintenance, and repair in West Jordan and Salt Lake County. Affordable, efficient, reliable service since 2012.",
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
    siteName: "All Solutions Heating and Air Conditioning",
    locale: "en_US",
    images: [{ url: "/images/homepage/van2-no-phone.png", alt: "All Solutions Heating and Air Conditioning service van" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "HVAC Installation & Repair in West Jordan, UT | All Solutions Heating and Air Conditioning",
    description:
      "Trusted HVAC installation, replacement, maintenance, and repair in West Jordan and Salt Lake County.",
    images: ["/images/homepage/van2-no-phone.png"],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
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
        <GoogleTracking />
        <AttributionCapture />
        <MetaPixel />
        <StructuredData />
        <div className="appRoot">{children}</div>
        <MobileCallAction />
        <WebsiteAIAssistant />
      </body>
    </html>
  );
}
