import type { Metadata } from "next";
import LocalServicePage from "@/components/LocalServicePage";

const emergencyFaqs = [
  {
    question: "What should I do if my HVAC system stops working?",
    answer: "If there is a burning smell, smoke, or another safety concern, turn the system off and seek appropriate help. Otherwise, call or request an appointment with the symptoms, service address, and a time you can be reached.",
  },
  {
    question: "Do you help with both heating and cooling problems?",
    answer: "Yes. Describe whether you have no heat, no cooling, weak airflow, unusual noises, water around the system, or another issue so the team can discuss the appropriate next step.",
  },
  {
    question: "Can I request service if I live near West Jordan?",
    answer: "Yes. Include your service address with the request. The team will confirm whether the address is within the service area before scheduling an appointment.",
  },
  {
    question: "What information should I include when I call?",
    answer: "Share the system problem, your service address, the best phone number to reach you, and any timing constraints. This helps the team discuss availability and next steps.",
  },
];

const emergencyFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: emergencyFaqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

export const metadata: Metadata = {
  title: "Emergency HVAC Repair in West Jordan, UT",
  description: "Need emergency HVAC repair in West Jordan? Call All Solutions Heating and Air Conditioning or request a callback with your service address and problem.",
  alternates: { canonical: "/emergency-hvac-repair-west-jordan" },
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(emergencyFaqSchema) }} />
      <LocalServicePage
        city="West Jordan"
        service="Emergency HVAC Repair"
        summary="When your home is too hot, too cold, or your HVAC system stops working, call to discuss the problem or request an appointment with your service address."
        symptoms={[
          "Air conditioner is running but the home is not cooling",
          "Furnace is not heating or is cycling unexpectedly",
          "Unusual HVAC noise, odor, leak, or loss of airflow",
        ]}
        proof={{
          rating: "5.0",
          reviewCount: 29,
          details: "The profile uses 801-755-3040 and serves West Jordan and nearby areas.",
        }}
        faqs={emergencyFaqs}
      />
    </>
  );
}
