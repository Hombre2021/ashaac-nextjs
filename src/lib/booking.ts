import { z } from "zod";

export const BOOKING_TIME_ZONE = "America/Denver";

export const bookingServiceOptions = [
  "Repair diagnostic",
  "System replacement estimate",
  "Seasonal tune-up",
  "Mini-split consultation",
  "Heat pump consultation",
  "Second opinion",
  "Use your own words",
] as const;

export const bookingTimeWindowOptions = [
  "5:00 AM - 7:00 AM",
  "7:00 AM - 9:00 AM",
  "9:00 AM - 11:00 AM",
  "8:00 AM - 10:00 AM",
  "10:00 AM - 12:00 PM",
  "12:00 PM - 2:00 PM",
  "2:00 PM - 4:00 PM",
  "4:00 PM - 6:00 PM",
  "6:00 PM - 8:00 PM",
  "7:00 PM - 9:00 PM",
  "9:00 PM - 11:00 PM",
  "8:00 PM - 10:00 PM",
  "10:00 PM - 11:00 PM",
  "Any time (24-hour availability)",
] as const;

export const bookingAttributionKeys = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "gbraid",
  "wbraid",
  "fbclid",
  "msclkid",
] as const;

export const supportedBookingCities = [
  "West Jordan",
  "South Jordan",
  "Sandy",
  "Murray",
  "Midvale",
  "Taylorsville",
  "Draper",
  "Salt Lake City",
] as const;

export const bookingRequestSchema = z.object({
  serviceType: z.enum(bookingServiceOptions, { message: "Select a service type." }),
  city: z.enum(supportedBookingCities as unknown as [string, ...string[]], { message: "Select a service area." }),
  preferredDate: z.string().min(1, "Choose a preferred date."),
  preferredTimeWindow: z.enum(bookingTimeWindowOptions, { message: "Choose a time window." }),
  firstName: z.string().min(1, "Enter your first name."),
  lastName: z.string().min(1, "Enter your last name."),
  phone: z.string().min(10, "Enter a valid phone number."),
  email: z.email("Enter a valid email address."),
  addressLine1: z.string().min(5, "Enter the service address."),
  addressCity: z.string().min(2, "Enter the city."),
  addressZip: z.string().min(5, "Enter the zip code.").max(10, "Zip code too long."),
  customServiceDescription: z.string().max(1200, "Keep your description under 1200 characters.").default(""),
  notes: z.string().max(1200, "Keep notes under 1200 characters.").default(""),
  sourcePage: z.string().min(1).default("/book"),
  utm_source: z.string().default(""),
  utm_medium: z.string().default(""),
  utm_campaign: z.string().default(""),
  utm_term: z.string().default(""),
  utm_content: z.string().default(""),
  gclid: z.string().default(""),
  gbraid: z.string().default(""),
  wbraid: z.string().default(""),
  fbclid: z.string().default(""),
  msclkid: z.string().default(""),
}).superRefine((data, ctx) => {
  if (data.serviceType === "Use your own words" && data.customServiceDescription.trim().length < 5) {
    ctx.addIssue({
      code: "custom",
      path: ["customServiceDescription"],
      message: "Describe your request in at least 5 characters.",
    });
  }
});

export type BookingRequestInput = z.input<typeof bookingRequestSchema>;
export type BookingRequest = z.output<typeof bookingRequestSchema>;

export type BookingAvailabilitySlot = {
  date: string;
  label: string;
  windows: typeof bookingTimeWindowOptions[number][];
};

function toIsoDate(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: BOOKING_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(date);
}

function toLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: BOOKING_TIME_ZONE,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

function isBusinessDay(date: Date) {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: BOOKING_TIME_ZONE,
    weekday: "short",
  }).format(date);

  return weekday !== "Sun";
}

function parseClockTime12h(value: string) {
  const match = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;

  const hourPart = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3].toUpperCase();

  if (Number.isNaN(hourPart) || Number.isNaN(minute)) return null;

  let hour = hourPart % 12;
  if (meridiem === "PM") {
    hour += 12;
  }

  return { hour, minute };
}

function getCurrentMountainMinutes(now: Date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: BOOKING_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const hour = Number(parts.find((part) => part.type === "hour")?.value || "0") % 24;
  const minute = Number(parts.find((part) => part.type === "minute")?.value || "0");
  return hour * 60 + minute;
}

function getWindowStartMinutes(window: typeof bookingTimeWindowOptions[number]) {
  if (window === "Any time (24-hour availability)") {
    return Number.NEGATIVE_INFINITY;
  }

  const startPart = window.split("-")[0]?.trim();
  if (!startPart) {
    return Number.NEGATIVE_INFINITY;
  }

  const parsed = parseClockTime12h(startPart);
  if (!parsed) {
    return Number.NEGATIVE_INFINITY;
  }

  return parsed.hour * 60 + parsed.minute;
}

function hasFutureTimeForToday(window: typeof bookingTimeWindowOptions[number], now: Date) {
  const nowMinutes = getCurrentMountainMinutes(now);

  if (window === "Any time (24-hour availability)") {
    return true;
  }

  return getWindowStartMinutes(window) > nowMinutes;
}

const FRIDAY_WINDOWS = new Set<string>([
  "5:00 AM - 7:00 AM",
  "7:00 AM - 9:00 AM",
  "9:00 AM - 11:00 AM",
  "10:00 AM - 12:00 PM",
  "7:00 PM - 9:00 PM",
  "9:00 PM - 11:00 PM",
]);

const FRIDAY_ONLY_WINDOWS = new Set<string>([
  "5:00 AM - 7:00 AM",
  "7:00 AM - 9:00 AM",
  "9:00 AM - 11:00 AM",
  "7:00 PM - 9:00 PM",
  "9:00 PM - 11:00 PM",
]);

export function isBookingWindowAllowedOnDate(date: string, window: string) {
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return false;
  const weekday = parsed.getDay();
  if (weekday === 0) return false;
  if (weekday === 5) return FRIDAY_WINDOWS.has(window);
  if (FRIDAY_ONLY_WINDOWS.has(window)) return false;
  if (weekday === 6) return [
    "8:00 AM - 10:00 AM",
    "10:00 AM - 12:00 PM",
    "12:00 PM - 2:00 PM",
    "2:00 PM - 4:00 PM",
    "4:00 PM - 6:00 PM",
  ].includes(window);
  return true;
}

export function getCurrentDateInBookingTimeZone(now = new Date()) {
  return toIsoDate(now);
}
export function buildPrototypeAvailability(days = 7): BookingAvailabilitySlot[] {
  const slots: BookingAvailabilitySlot[] = [];

  const today = new Date();
  const baseDay = new Date(today);
  baseDay.setHours(12, 0, 0, 0);

  for (let offset = 0; offset <= days; offset += 1) {
    const candidate = new Date(baseDay);
    candidate.setDate(baseDay.getDate() + offset);

    if (offset === 0) {
      const candidateDate = toIsoDate(candidate);
      const todayWindows = [...bookingTimeWindowOptions]
        .filter((window) => isBookingWindowAllowedOnDate(candidateDate, window))
        .filter((window) => hasFutureTimeForToday(window, today));

      if (todayWindows.length > 0) {
        slots.push({
          date: toIsoDate(candidate),
          label: `Today, ${toLabel(candidate)} — Same Day`,
          windows: todayWindows,
        });
      }

      continue;
    }

    if (!isBusinessDay(candidate)) {
      continue;
    }

    const candidateDate = toIsoDate(candidate);
    const windows = [...bookingTimeWindowOptions].filter((window) => isBookingWindowAllowedOnDate(candidateDate, window));

    slots.push({
      date: toIsoDate(candidate),
      label: toLabel(candidate),
      windows,
    });
  }

  return slots;
}

export type BookingAvailabilityResponse = {
  mode: "prototype";
  slots: BookingAvailabilitySlot[];
};

export type BookingSubmissionResponse = {
  mode: "prototype";
  requestId: string;
  nextStep: string;
};
