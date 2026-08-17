import type { Metadata } from "next";
import LocalServicePage from "@/components/LocalServicePage";

export const metadata: Metadata = { title: "Furnace Repair in Riverton, UT | All Solutions", description: "Request furnace repair in Riverton from All Solutions Heating and Air Conditioning. Call or submit your service address for a callback.", alternates: { canonical: "/furnace-repair-riverton" } };

export default function Page() { return <LocalServicePage city="Riverton" service="Furnace Repair" summary="If your furnace is not heating or needs a repair assessment, send the service address and problem details for a callback." symptoms={["Furnace runs but the home stays cold", "No heat, short cycling, or weak airflow", "Unusual noise, odor, or repeated thermostat issues"]} />; }
