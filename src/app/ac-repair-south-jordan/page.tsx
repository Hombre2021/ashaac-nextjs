import type { Metadata } from "next";
import LocalServicePage from "@/components/LocalServicePage";

export const metadata: Metadata = {
  title: "AC Repair South Jordan, UT | Same-Day Emergency Cooling Near Me",
  description:
    "Fast, affordable AC repair in South Jordan & Daybreak, UT. Same-day diagnostics, capacitor replacement, refrigerant leak detection, and emergency cooling service.",
  keywords: [
    "AC repair south jordan ut",
    "AC repair near me",
    "emergency AC repair south jordan",
    "air conditioning repair daybreak utah",
    "AC repair 84095",
    "AC repair 84009",
  ],
  alternates: { canonical: "/ac-repair-south-jordan" },
  openGraph: {
    title: "AC Repair South Jordan, UT | Same-Day Emergency Cooling Near Me",
    description:
      "Fast, affordable AC repair in South Jordan & Daybreak, UT. Same-day diagnostics, capacitor and motor replacement, and emergency cooling service.",
    url: "https://ashaac.com/ac-repair-south-jordan",
    type: "website",
  },
};

const southJordanAcFaqs = [
  {
    question: "Do you provide AC repair in Daybreak and South Jordan?",
    answer:
      "Yes! Our mobile service vans regularly dispatch across South Jordan, Daybreak, and the southwest Salt Lake Valley. We provide same-day diagnostics for urgent cooling problems.",
  },
  {
    question: "Why is my AC unit blowing warm air?",
    answer:
      "Warm air usually points to a blown capacitor, a tripped circuit breaker, dirty condenser coils, or low refrigerant. Our technicians carry diagnostic meters and common replacement parts to resolve the issue on the spot.",
  },
  {
    question: "What brands of air conditioners do you service in South Jordan?",
    answer:
      "We repair all major AC brands including Lennox, Carrier, Trane, Goodman, Rheem, York, Amana, Bryant, Daikin, and American Standard.",
  },
  {
    question: "How do I schedule same-day emergency cooling service?",
    answer:
      "Call or text 801-755-3040 for urgent dispatch, or submit an appointment request through our website booking form.",
  },
];

export default function Page() {
  return (
    <LocalServicePage
      city="South Jordan"
      service="AC Repair"
      summary="Fast, expert AC repair in South Jordan and Daybreak, UT. When your cooling system leaves your home hot and humid, All Solutions provides prompt diagnostics and reliable repairs."
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
          "Serving South Jordan and Daybreak with 5-star Google-rated heating and air conditioning service.",
      }}
      faqs={southJordanAcFaqs}
    />
  );
}
