import type { Metadata } from "next";
import LocalServicePage from "@/components/LocalServicePage";

export const metadata: Metadata = {
  title: "AC Repair West Jordan, UT | Same-Day Emergency Cooling Near Me",
  description:
    "Fast, affordable AC repair in West Jordan, UT. Same-day diagnostics, freon leak detection, capacitor replacement, and 24/7 emergency cooling across 84081, 84084, and 84088.",
  keywords: [
    "AC repair west jordan ut",
    "AC repair near me",
    "emergency AC repair west jordan",
    "air conditioning repair west jordan",
    "AC repair 84088",
    "AC repair 84084",
    "AC repair 84081",
    "air conditioner repair near me",
  ],
  alternates: { canonical: "/ac-repair-west-jordan" },
  openGraph: {
    title: "AC Repair West Jordan, UT | Same-Day Emergency Cooling Near Me",
    description:
      "Fast, affordable AC repair in West Jordan, UT. Same-day diagnostics, capacitor and motor replacement, and 24/7 emergency service.",
    url: "https://ashaac.com/ac-repair-west-jordan",
    type: "website",
  },
};

const westJordanAcFaqs = [
  {
    question: "How fast can you arrive at my West Jordan home for AC repair?",
    answer:
      "Because All Solutions is based right here in West Jordan, our mobile diagnostic vans can often arrive same-day—frequently within a couple of hours for urgent no-cooling emergencies across 84088, 84084, and 84081.",
  },
  {
    question: "Why is my air conditioner blowing warm air?",
    answer:
      "The most common causes are a blown dual-run capacitor, a tripped breaker, a failed contactor, or low refrigerant from a coil leak. Our technicians carry diagnostic meters and common replacement parts to diagnose and fix it in one visit.",
  },
  {
    question: "What air conditioning brands do you service in West Jordan?",
    answer:
      "We service, repair, and maintain all major residential AC brands including Lennox, Carrier, Trane, Goodman, Rheem, York, Amana, Bryant, Daikin, and American Standard.",
  },
  {
    question: "Do you offer emergency weekend and evening AC repair?",
    answer:
      "Yes. During extreme Utah heat waves, an air conditioning breakdown is urgent. Call or text 801-755-3040 for emergency dispatch.",
  },
  {
    question: "How much does AC diagnosis and repair cost in West Jordan?",
    answer:
      "We believe in transparent, upfront pricing. Our technician performs a full electrical, safety, and refrigerant diagnostic check, explains the problem, and gives you the exact repair cost before starting any work.",
  },
];

export default function Page() {
  return (
    <LocalServicePage
      city="West Jordan"
      service="AC Repair"
      summary="Fast, local AC repair in West Jordan, UT. When your central air stops cooling, blows warm air, or leaks, our West Jordan technicians provide rapid same-day diagnostics and honest repairs."
      symptoms={[
        "Air conditioner running but blowing warm or room-temperature air",
        "Outside condenser fan not spinning or making humming noises",
        "Frozen evaporator coil or ice forming on copper refrigerant lines",
        "Water leaking around your indoor air handler or furnace cabinet",
        "Frequent AC short-cycling (system shuts off after only 2-3 minutes)",
        "Thermostat set to COOL but air conditioning unit does not turn on",
      ]}
      proof={{
        rating: "5.0",
        reviewCount: 30,
        details:
          "Headquartered in West Jordan (84088), All Solutions is your neighborhood HVAC specialist with 30+ verified 5-star Google reviews.",
      }}
      faqs={westJordanAcFaqs}
    />
  );
}
