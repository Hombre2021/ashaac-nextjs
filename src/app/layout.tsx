import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import GoogleTracking from "@/components/GoogleTracking";
import AttributionCapture from "@/components/AttributionCapture";
import MetaPixel from "@/components/MetaPixel";
import StructuredData from "@/components/StructuredData";
import WebsiteAIAssistant from "@/components/WebsiteAIAssistant";
import MobileCallAction from "@/components/MobileCallAction";
import "./globals.css";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://ashaac.com").replace(/\/$/, "");

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
  applicationName: "All Solutions Heating and Air Conditioning",
  authors: [{ name: "All Solutions Heating and Air Conditioning" }],
  creator: "All Solutions Heating and Air Conditioning",
  publisher: "All Solutions Heating and Air Conditioning",
  category: "Home Services",
  title: {
    default: "HVAC Installation & Repair in West Jordan, UT | All Solutions Heating and Air Conditioning",
    template: "%s | All Solutions Heating and Air Conditioning",
  },
  description:
    "Licensed HVAC contractor in West Jordan, UT providing air conditioning repair, furnace replacement, heat pump installation, and maintenance across Salt Lake County.",
  keywords: [
    "HVAC contractor West Jordan UT",
    "HVAC company West Jordan",
    "HVAC Salt Lake County",
    "air conditioning repair West Jordan",
    "furnace replacement West Jordan",
    "heat pump installation Utah",
    "mini split installation West Jordan",
    "emergency HVAC repair Utah",
    "All Solutions Heating and Air Conditioning",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "All Solutions Heating and Air Conditioning",
    locale: "en_US",
    title: "HVAC Installation & Repair in West Jordan, UT | All Solutions Heating and Air Conditioning",
    description:
      "Licensed HVAC contractor in West Jordan, UT providing air conditioning repair, furnace replacement, heat pump installation, and maintenance across Salt Lake County.",
    images: [{
      url: new URL("/images/homepage/van2-no-phone.png", siteUrl),
      width: 1200,
      height: 630,
      alt: "All Solutions Heating and Air Conditioning service van",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "HVAC Installation & Repair in West Jordan, UT | All Solutions Heating and Air Conditioning",
    description:
      "Licensed HVAC contractor in West Jordan, UT providing air conditioning repair, furnace replacement, heat pump installation, and maintenance across Salt Lake County.",
    images: [new URL("/images/homepage/van2-no-phone.png", siteUrl)],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    other: {
      "facebook-domain-verification": "32vhelzlafs29vdr9yb44cizigof1s",
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
