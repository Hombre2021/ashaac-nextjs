import type { Metadata } from "next";
import HomepageFooter from "@/components/HomepageFooter";
import HomepageHeader from "@/components/HomepageHeader";
import BookingExperience from "@/components/booking/BookingExperience";

export const metadata: Metadata = {
  title: "Book HVAC Service",
  description:
    "Request an HVAC appointment or estimate directly on ashaac.com with a faster, branded booking flow for West Jordan and Salt Lake County.",
  keywords: [
    "book HVAC service West Jordan",
    "schedule HVAC estimate Utah",
    "HVAC appointment Salt Lake County",
    "request furnace repair appointment",
  ],
  alternates: {
    canonical: "/book",
  },
};

export default function BookPage() {
  return (
    <>
      <HomepageHeader />
      <BookingExperience />
      <HomepageFooter />
    </>
  );
}
