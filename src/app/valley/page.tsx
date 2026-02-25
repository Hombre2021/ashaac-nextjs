import type { Metadata } from "next";
import BlueOverlayImage from "../../components/BlueOverlayImage";

export const metadata: Metadata = {
  title: "Salt Lake Valley Service Area",
  description: "View our HVAC service area across Salt Lake Valley and surrounding communities.",
  alternates: {
    canonical: "/valley",
  },
};

export default function ValleyPage() {
  return (
    <BlueOverlayImage src="/images/homepage/Salt-Lake-Valley.png" alt="Salt Lake Valley" height={"80vh"}>
      {/* You can add centered content here if desired */}
    </BlueOverlayImage>
  );
}
