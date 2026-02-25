import type { Metadata } from "next";
import FinancingPage from '../../components/financingHero';

export const metadata: Metadata = {
  title: "HVAC Financing Options",
  description:
    "Apply for HVAC financing for installation and replacement projects with All Solutions Heating and Air Conditioning.",
  alternates: {
    canonical: "/financing",
  },
};

export default function Financing() {
  return <FinancingPage />;
}
