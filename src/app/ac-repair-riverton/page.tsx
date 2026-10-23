import type { Metadata } from "next";
import LocalServicePage from "@/components/LocalServicePage";

export const metadata: Metadata = {
  title: "AC Repair Riverton, UT | Same-Day Emergency Cooling Near Me",
  description:
    "Fast, reliable AC repair in Riverton, UT. Same-day diagnostics, capacitor replacement, refrigerant leak detection, and emergency cooling service across 84065 and 84096.",
  keywords: [
    "AC repair riverton ut",
    "AC repair near me",
    "emergency AC repair riverton",
    "air conditioning repair riverton utah",
    "AC repair 84065",
    "AC repair 84096",
  ],
  alternates: { canonical: "/ac-repair-riverton" },
  openGraph: {
    title: "AC Repair Riverton, UT | Same-Day Emergency Cooling Near Me",
    description:
      "Fast, reliable AC repair in Riverton, UT. Same-day diagnostics, capacitor and motor replacement, and emergency cooling service.",
    url: "https://ashaac.com/ac-repair-riverton",
    type: "website",
  },
};

const rivertonAcFaqs = [
  {
    question: "How fast can you repair an AC in Riverton, UT?",
    answer:
      "Our mobile service vans are dispatched daily throughout Riverton and southwest Salt Lake County. We provide fast same-day diagnostics for cooling emergencies.",
  },
  {
    question: "Why is my air conditioner blowing warm air?",
    answer:
      "Common causes include a blown run capacitor, dirty outdoor coils, or low refrigerant levels. Our certified technician can quickly identify and fix the issue.",
  },
  {
    question: "What AC brands do you repair in Riverton?",
    answer:
      "We repair all major air conditioning brands including Lennox, Carrier, Trane, Goodman, Rheem, York, Amana, Bryant, Daikin, and American Standard.",
  },
  {
    question: "How do I schedule AC repair in Riverton?",
    answer:
      "Call or text 801-755-3040 for rapid emergency dispatch, or book online through our website.",
  },
];

export default function Page() {
  return (
    <LocalServicePage
      city="Riverton"
      service="AC Repair"
      summary="Fast, local AC repair in Riverton, UT. When your air conditioner fails during hot summer weather, All Solutions provides same-day diagnostics, upfront pricing, and lasting repairs."
      symptoms={[
        "Air conditioner running but blowing warm or room-temperature air",
        "Outside condenser unit buzzing or humming without fan spinning",
        "Frozen evaporator coils or ice along refrigerant copper lines",
        "Water leaking around your indoor furnace or air handler",
        "Thermostat set to COOL but air conditioning unit does not turn on",
      ]}
      proof={{
        rating: "5.0",
        reviewCount: 30,
        details:
          "Serving Riverton and southwest Salt Lake County with 5-star Google-rated heating and cooling service.",
      }}
      faqs={rivertonAcFaqs}
    />
  );
}
