import type { Metadata } from "next";
import LocalServicePage from "@/components/LocalServicePage";

export const metadata: Metadata = {
  title: "Furnace Repair West Jordan, UT | Same-Day Emergency Heating Near Me",
  description:
    "Fast, affordable furnace repair in West Jordan, UT. Same-day diagnostics, blower motor and ignitor repair, safety checks, and 24/7 emergency service across 84081, 84084, and 84088.",
  keywords: [
    "furnace repair west jordan ut",
    "furnace repair near me",
    "emergency furnace repair west jordan",
    "heating repair west jordan",
    "furnace repair 84088",
    "furnace repair 84084",
    "furnace repair 84081",
    "west jordan furnace technician",
  ],
  alternates: { canonical: "/furnace-repair-west-jordan" },
  openGraph: {
    title: "Furnace Repair West Jordan, UT | Same-Day Emergency Heating Near Me",
    description:
      "Fast, affordable furnace repair in West Jordan, UT. Same-day diagnostics, blower motor and ignitor repair, and 24/7 emergency service.",
    url: "https://ashaac.com/furnace-repair-west-jordan",
    type: "website",
  },
};

const westJordanFurnaceFaqs = [
  {
    question: "How fast can you arrive at my West Jordan home for furnace repair?",
    answer:
      "Because All Solutions is based right here in West Jordan, our mobile diagnostic vans can often arrive same-day, frequently within a couple of hours for urgent no-heat situations across 84088, 84084, and 84081.",
  },
  {
    question: "Why is my furnace blowing cold air?",
    answer:
      "Common causes include a dirty furnace filter causing the high-limit switch to trip, a dirty flame sensor, a failed hot-surface ignitor, or a gas valve issue. Our technicians carry diagnostic meters and common replacement parts on our vans to diagnose and fix it during the first visit.",
  },
  {
    question: "What furnace brands do you repair in West Jordan?",
    answer:
      "We service, repair, and maintain all major residential furnace brands, including Lennox, Carrier, Trane, Goodman, Rheem, York, Amana, Bryant, Daikin, and American Standard.",
  },
  {
    question: "Do you offer emergency weekend and evening furnace repair?",
    answer:
      "Yes. When freezing Utah winter weather hits, a broken furnace is an emergency. Call or text 801-755-3040 for urgent dispatch.",
  },
  {
    question: "How much does furnace diagnosis and repair cost in West Jordan?",
    answer:
      "We provide transparent, upfront pricing. Our technician performs a full safety and diagnostic inspection of your furnace, explains exactly what part has failed, and provides the exact repair price before any work begins.",
  },
];

export default function Page() {
  return (
    <LocalServicePage
      city="West Jordan"
      service="Furnace Repair"
      summary="Fast, local furnace repair in West Jordan, UT. When your furnace stops heating, short-cycles, or makes alarming noises, our West Jordan technicians provide rapid same-day diagnostics and honest repairs."
      symptoms={[
        "Furnace runs but blows cold or lukewarm air",
        "Short-cycling (furnace turns on for 2-3 minutes, then shuts off)",
        "Ignitor clicks repeatedly but burners fail to catch fire",
        "Loud squealing, grinding, or rattling sounds from the blower fan",
        "Yellow or flickering burner flame (carbon monoxide hazard)",
        "Thermostat set to HEAT but furnace does not respond or click on",
      ]}
      proof={{
        rating: "5.0",
        reviewCount: 29,
        details:
          "Headquartered in West Jordan (84088), All Solutions is your neighborhood HVAC specialist with hundreds of happy local families and verified 5-star Google reviews.",
      }}
      faqs={westJordanFurnaceFaqs}
    />
  );
}
