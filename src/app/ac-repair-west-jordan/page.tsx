import type { Metadata } from "next";
import LocalServicePage from "@/components/LocalServicePage";

export const metadata: Metadata = {
  title: "AC Repair in West Jordan, UT | All Solutions",
  description: "Request AC repair in West Jordan from All Solutions Heating and Air Conditioning. Call or submit your service address for a callback.",
  alternates: { canonical: "/ac-repair-west-jordan" },
};

export default function Page() {
  return <LocalServicePage city="West Jordan" service="AC Repair" summary="Get help with an air conditioner that is not cooling, has weak airflow, leaks, or needs a clear repair recommendation." symptoms={["Warm air from vents or uneven cooling", "Weak airflow, frozen coil, or repeated cycling", "Water near the indoor unit or unusual AC sounds"]} />;
}
