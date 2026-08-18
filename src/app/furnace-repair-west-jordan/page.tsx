import type { Metadata } from "next";
import LocalServicePage from "@/components/LocalServicePage";

export const metadata: Metadata = {
  title: "Furnace Repair in West Jordan, UT",
  description: "Request furnace repair in West Jordan from All Solutions Heating and Air Conditioning. Call or submit your service address for a callback.",
  alternates: { canonical: "/furnace-repair-west-jordan" },
};

export default function Page() {
  return <LocalServicePage city="West Jordan" service="Furnace Repair" summary="If your furnace is not heating, is making unusual sounds, or needs a repair assessment, send the service address and problem details for a callback." symptoms={["Furnace runs but the home stays cold", "No heat, short cycling, or weak airflow", "Unusual noise, odor, or repeated thermostat issues"]} />;
}
