import { NextResponse } from "next/server";
import {
  buildPrototypeAvailability,
  bookingTimeWindowOptions,
  isBookingWindowAllowedOnDate,
  type BookingAvailabilitySlot,
  type BookingAvailabilityResponse,
} from "@/lib/booking";

const VALID_WINDOWS = new Set<string>(bookingTimeWindowOptions as unknown as string[]);
const DEFAULT_DURATION_MINUTES = 60;
const DEFAULT_SLOT_INTERVAL_MINUTES = 60;
const DEFAULT_BUSINESS_START_HOUR = 8;
const DEFAULT_BUSINESS_END_HOUR = 23;

export const dynamic = "force-dynamic";
export const revalidate = 0;

function envFirst(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return "";
}

function deriveGoogleCalendarAvailabilityUrl() {
  const direct = envFirst("HVAC_PRO_CALENDAR_AVAILABILITY_URL");
  if (direct) {
    return direct;
  }

  const managerBookingUrl = envFirst("MANAGER_BOOKING_URL");
  if (!managerBookingUrl) {
    return "";
  }

  return managerBookingUrl.replace(/intakeWebsiteBooking\/?$/, "getGoogleCalendarAvailability");
}

async function fetchCalendarDayAvailability(date: string): Promise<string[]> {
  const availabilityUrl = deriveGoogleCalendarAvailabilityUrl();
  const apiKey = envFirst("HVAC_PRO_CALENDAR_API_KEY", "MANAGER_API_KEY");
  const authHeader = envFirst("HVAC_PRO_AUTH_HEADER", "MANAGER_AUTH_HEADER") || "x-api-key";

  if (!availabilityUrl) {
    return [];
  }

  const url = new URL(availabilityUrl);
  url.searchParams.set("date", date);
  url.searchParams.set("durationMinutes", String(DEFAULT_DURATION_MINUTES));
  url.searchParams.set("slotIntervalMinutes", String(DEFAULT_SLOT_INTERVAL_MINUTES));
  const isFriday = new Date(`${date}T12:00:00`).getDay() === 5;
  url.searchParams.set("businessStartHour", String(isFriday ? 5 : DEFAULT_BUSINESS_START_HOUR));
  url.searchParams.set("businessEndHour", String(DEFAULT_BUSINESS_END_HOUR));

  const headers: Record<string, string> = {};
  if (apiKey) {
    headers[authHeader] = apiKey;
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Google Calendar availability request failed (${response.status})`);
  }

  const payload = (await response.json()) as {
    slots?: Array<{ label?: string }>;
  } | null;

  const windows = Array.isArray(payload?.slots)
    ? payload.slots.map((slot) => String(slot.label || "").trim()).filter(Boolean)
    : [];

  if (windows.length > 0 && !windows.includes("Any time (24-hour availability)")) {
    windows.push("Any time (24-hour availability)");
  }

  return windows.filter((window) => VALID_WINDOWS.has(window) && isBookingWindowAllowedOnDate(date, window));
}

export async function GET() {
  const rawSlots = buildPrototypeAvailability();

  const calendarSlots = await Promise.all(
    rawSlots.map(async (slot) => ({
      ...slot,
      windows: (await fetchCalendarDayAvailability(slot.date).catch(() => slot.windows))
        .filter((window) => isBookingWindowAllowedOnDate(slot.date, window)),
    })),
  );

  const normalized = calendarSlots.filter((slot) => slot.windows.length > 0) as BookingAvailabilitySlot[];
  const fallbackSlots = rawSlots.map((slot) => ({
    ...slot,
    windows: slot.windows as BookingAvailabilityResponse["slots"][number]["windows"],
  })) as BookingAvailabilitySlot[];

  const payload: BookingAvailabilityResponse = {
    mode: "prototype",
    slots: normalized.length > 0 ? normalized : fallbackSlots,
  };

  return NextResponse.json(payload);
}
