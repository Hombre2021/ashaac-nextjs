import type { Metadata } from "next";
import LocalServicePage from "@/components/LocalServicePage";

export const metadata: Metadata = { title: "Emergency HVAC Repair in Riverton, UT", description: "Request emergency HVAC repair in Riverton from All Solutions Heating and Air Conditioning. Call or submit your service address for a callback.", alternates: { canonical: "/emergency-hvac-repair-riverton" } };

export default function Page() { return <LocalServicePage city="Riverton" service="Emergency HVAC Repair" summary="When your HVAC system stops working, get a direct path to a local callback and service discussion in Riverton." symptoms={["Air conditioner is not cooling the home", "Furnace is not heating or is cycling unexpectedly", "Unusual HVAC noise, odor, leak, or loss of airflow"]} />; }
