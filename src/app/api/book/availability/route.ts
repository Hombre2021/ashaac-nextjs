import { NextResponse } from "next/server";
import {
  buildPhoneAvailability,
  type BookingAvailabilitySlot,
  type BookingAvailabilityResponse,
} from "@/lib/booking";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const rawSlots = buildPhoneAvailability();

  const payload: BookingAvailabilityResponse = {
    mode: "prototype",
    // The owner has confirmed 24/7 availability. The manager confirms conflicts
    // when the appointment is submitted, so the picker can show every window.
    slots: rawSlots.map((slot) => ({
      ...slot,
      windows: slot.windows as BookingAvailabilityResponse["slots"][number]["windows"],
    })) as BookingAvailabilitySlot[],
  };

  return NextResponse.json(payload);
}
