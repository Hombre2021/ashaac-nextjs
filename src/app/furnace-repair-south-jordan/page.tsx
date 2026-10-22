import type { Metadata } from "next";
import LocalServicePage from "@/components/LocalServicePage";

export const metadata: Metadata = {
  title: "Furnace Repair South Jordan, UT | Same-Day Emergency Heating Near Me",
  description:
    "Fast, affordable furnace repair in South Jordan & Daybreak, UT. Same-day diagnostics, blower motor and ignitor repair, safety checks, and emergency heating service.",
  keywords: [
    "furnace repair south jordan ut",
    "furnace repair near me",
    "emergency furnace repair south jordan",
    "heating repair daybreak utah",
    "furnace repair 84095",
    "furnace repair 84009",
  ],
  alternates: { canonical: "/furnace-repair-south-jordan" },
  openGraph: {
    title: "Furnace Repair South Jordan, UT | Same-Day Emergency Heating Near Me",
    description:
      "Fast, affordable furnace repair in South Jordan & Daybreak, UT. Same-day diagnostics, blower motor and ignitor repair, and emergency heating service.",
    url: "https://ashaac.com/furnace-repair-south-jordan",
    type: "website",
  },
};

const southJordanFurnaceFaqs = [
  {
    question: "Do you provide furnace repair in Daybreak and South Jordan?",
    answer:
      "Yes! Our service vans regularly dispatch across South Jordan, Daybreak, and the southwest Salt Lake Valley. We provide same-day diagnostics for urgent heating issues.",
  },
  {
    question: "Why is my furnace blowing cold air?",
    answer:
      "Common causes include a dirty air filter tripping the high-limit safety switch, a dirty flame sensor, or a failed ignitor. Our technicians carry diagnostic meters and common replacement parts to resolve the issue on the spot.",
  },
  {
    question: "What brands of furnaces do you service in South Jordan?",
    answer:
      "We repair all major furnace brands including Lennox, Carrier, Trane, Goodman, Rheem, York, Amana, Bryant, Daikin, and American Standard.",
  },
  {
    question: "How do I schedule same-day emergency furnace service?",
    answer:
      "Call or text 801-755-3040 for urgent dispatch, or submit an appointment request through our website booking form.",
  },
];

export default function Page() {
  return (
    <LocalServicePage
      city="South Jordan"
      service="Furnace Repair"
      summary="Fast, expert furnace repair in South Jordan and Daybreak, UT. When your heating system leaves your home in the cold, All Solutions provides prompt diagnostics and reliable repairs."
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
          "Serving South Jordan and Daybreak with 5-star Google-rated heating and air conditioning service.",
      }}
      faqs={southJordanFurnaceFaqs}
    />
  );
}
