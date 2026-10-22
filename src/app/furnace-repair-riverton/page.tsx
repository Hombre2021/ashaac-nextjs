import type { Metadata } from "next";
import LocalServicePage from "@/components/LocalServicePage";

export const metadata: Metadata = {
  title: "Furnace Repair Riverton, UT | Same-Day Emergency Heating Near Me",
  description:
    "Fast, reliable furnace repair in Riverton, UT. Same-day diagnostics, blower motor and ignitor repair, safety checks, and emergency heating service across 84065 and 84096.",
  keywords: [
    "furnace repair riverton ut",
    "furnace repair near me",
    "emergency furnace repair riverton",
    "heating repair riverton utah",
    "furnace repair 84065",
    "furnace repair 84096",
  ],
  alternates: { canonical: "/furnace-repair-riverton" },
  openGraph: {
    title: "Furnace Repair Riverton, UT | Same-Day Emergency Heating Near Me",
    description:
      "Fast, reliable furnace repair in Riverton, UT. Same-day diagnostics, blower motor and ignitor repair, and emergency heating service.",
    url: "https://ashaac.com/furnace-repair-riverton",
    type: "website",
  },
};

const rivertonFurnaceFaqs = [
  {
    question: "How fast can you repair a furnace in Riverton, UT?",
    answer:
      "Our mobile service vans are dispatched daily throughout Riverton and southwest Salt Lake County. We provide fast same-day diagnostics for no-heat emergencies.",
  },
  {
    question: "What causes a furnace to blow cold air?",
    answer:
      "Common culprits are a clogged furnace filter causing the high-limit switch to trip, a dirty flame sensor, or a failed ignitor. Our certified technician can quickly identify and fix the issue.",
  },
  {
    question: "What furnace brands do you repair in Riverton?",
    answer:
      "We repair all major furnace brands including Lennox, Carrier, Trane, Goodman, Rheem, York, Amana, Bryant, Daikin, and American Standard.",
  },
  {
    question: "How do I schedule furnace repair in Riverton?",
    answer:
      "Call or text 801-755-3040 for rapid emergency dispatch, or book online through our website.",
  },
];

export default function Page() {
  return (
    <LocalServicePage
      city="Riverton"
      service="Furnace Repair"
      summary="Fast, local furnace repair in Riverton, UT. When your furnace fails during cold Utah weather, All Solutions provides same-day diagnostics, upfront pricing, and lasting repairs."
      symptoms={[
        "Furnace running but blowing cold or room-temperature air",
        "Short-cycling (furnace repeatedly turning on and off)",
        "Ignitor clicking without burner flame igniting",
        "Loud buzzing, rattling, or squealing from the blower motor",
        "Thermostat set to HEAT but furnace does not respond",
      ]}
      proof={{
        rating: "5.0",
        reviewCount: 29,
        details:
          "Serving Riverton and southwest Salt Lake County with 5-star Google-rated heating and cooling service.",
      }}
      faqs={rivertonFurnaceFaqs}
    />
  );
}
