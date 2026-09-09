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
  "8:00 AM - 10:00 AM",
  "10:00 AM - 12:00 PM",
  "12:00 PM - 2:00 PM",
  "2:00 PM - 4:00 PM",
  "4:00 PM - 6:00 PM",
  "6:00 PM - 8:00 PM",
] as const;

export const phoneBookingTimeWindowOptions = [
  "12:00 AM - 2:00 AM",
  "2:00 AM - 4:00 AM",
  "4:00 AM - 6:00 AM",
  "6:00 AM - 8:00 AM",
  "8:00 AM - 10:00 AM",
  "10:00 AM - 12:00 PM",
  "12:00 PM - 2:00 PM",
  "2:00 PM - 4:00 PM",
  "4:00 PM - 6:00 PM",
  "6:00 PM - 8:00 PM",
  "8:00 PM - 10:00 PM",
  "10:00 PM - 12:00 AM",
] as const;

export const allBookingTimeWindowOptions = [
  ...phoneBookingTimeWindowOptions,
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
  "Riverton",
  "Herriman",
  "Kearns",
  "Midvale",
  "Sandy",
  "Murray",
  "Taylorsville",
  "Draper",
  "Salt Lake City",
] as const;

export const strictServiceAreaCities = [
  "West Jordan",
  "South Jordan",
  "Riverton",
  "Herriman",
] as const;

export function resolveSupportedBookingCity(value: string) {
  const normalized = String(value || "")
    .trim()
    .replace(/,?\s+(?:ut|utah)$/i, "")
    .trim()
    .toLowerCase();
  const aliases: Record<string, typeof supportedBookingCities[number]> = {
    slc: "Salt Lake City",
    "kearns metro township": "Kearns",
    herriman: "Herriman",
    "south jordan": "South Jordan",
    "west jordan": "West Jordan",
    riverton: "Riverton",
  };
  return aliases[normalized]
    || supportedBookingCities.find((city) => city.toLowerCase() === normalized)
    || "";
}

export const bookingRequestSchema = z.object({
  serviceType: z.enum(bookingServiceOptions, { message: "Select a service type." }),
  city: z.enum(supportedBookingCities as unknown as [string, ...string[]], { message: "Select a service area." }),
  preferredDate: z.string().min(1, "Choose a preferred date."),
  preferredTimeWindow: z.enum(allBookingTimeWindowOptions, { message: "Choose a time window." }),
  firstName: z.string().min(1, "Enter your first name."),
  lastName: z.string().min(1, "Enter your last name."),
  phone: z.string().min(10, "Enter a valid phone number."),
  email: z.union([z.literal(""), z.email("Enter a valid email address.")]).default(""),
  addressLine1: z.string().min(5, "Enter the service address."),
  addressCity: z.string().min(2, "Enter the city."),
  addressZip: z.string().min(5, "Enter the zip code.").max(10, "Zip code too long."),
  customServiceDescription: z.string().max(1200, "Keep your description under 1200 characters.").default(""),
  notes: z.string().max(1200, "Keep notes under 1200 characters.").default(""),
  callerLanguage: z.string().max(40).default(""),
  customerConfirmationSms: z.string().max(1600).default(""),
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
  if (data.customServiceDescription.trim().length < 5) {
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
  windows: typeof allBookingTimeWindowOptions[number][];
};

export function isAfterHoursPhoneBooking(date: string, window: string) {
  const [startPart, endPart] = window.split("-").map((part) => part.trim());
  const start = startPart ? parseClockTime12h(startPart) : null;
  const end = endPart ? parseClockTime12h(endPart) : null;
  if (!start || !end) return true;
  const startMinutes = start.hour * 60 + start.minute;
  let endMinutes = end.hour * 60 + end.minute;
  if (endMinutes <= startMinutes) endMinutes += 24 * 60;
  return startMinutes < 8 * 60 || endMinutes > 20 * 60;
}

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

function getWindowStartMinutes(window: typeof allBookingTimeWindowOptions[number]) {
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

function getWindowEndMinutes(window: typeof allBookingTimeWindowOptions[number]) {
  const [startPart, endPart] = window.split("-").map((part) => part.trim());
  const start = startPart ? parseClockTime12h(startPart) : null;
  const end = endPart ? parseClockTime12h(endPart) : null;
  if (!start || !end) return Number.NEGATIVE_INFINITY;
  const startMinutes = start.hour * 60 + start.minute;
  const endMinutes = end.hour * 60 + end.minute;
  return endMinutes <= startMinutes ? endMinutes + 24 * 60 : endMinutes;
}

function hasFutureTimeForToday(window: typeof allBookingTimeWindowOptions[number], now: Date) {
  const nowMinutes = getCurrentMountainMinutes(now);
  return getWindowStartMinutes(window) > nowMinutes;
}

export function isBookingWindowAllowedOnDate(date: string, window: string) {
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return false;
  return allBookingTimeWindowOptions.includes(window as typeof allBookingTimeWindowOptions[number]);
}

export function getCurrentDateInBookingTimeZone(now = new Date()) {
  return toIsoDate(now);
}

export function isPhoneBookingWindowAvailable(date: string, window: string, now = new Date()) {
  const currentDate = getCurrentDateInBookingTimeZone(now);
  if (date < currentDate) return false;
  if (date > currentDate) return true;
  return hasFutureTimeForToday(window as typeof allBookingTimeWindowOptions[number], now);
}

export function isExactPhoneBookingHourAvailable(date: string, requestedHour: number, now = new Date()) {
  if (!Number.isInteger(requestedHour) || requestedHour < 0 || requestedHour > 23) return false;
  const currentDate = getCurrentDateInBookingTimeZone(now);
  if (date < currentDate) return false;
  if (date > currentDate) return true;
  return requestedHour * 60 > getCurrentMountainMinutes(now);
}

export function isExactPhoneBookingWindowAvailable(date: string, window: typeof allBookingTimeWindowOptions[number], now = new Date()) {
  const currentDate = getCurrentDateInBookingTimeZone(now);
  if (date < currentDate) return false;
  if (date > currentDate) return true;
  return getWindowEndMinutes(window) > getCurrentMountainMinutes(now);
}

export function buildPhoneAvailability(days = 7): BookingAvailabilitySlot[] {
  const slots: BookingAvailabilitySlot[] = [];
  const now = new Date();
  const baseDay = new Date(`${getCurrentDateInBookingTimeZone(now)}T12:00:00Z`);

  for (let offset = 0; offset <= days; offset += 1) {
    const candidate = new Date(baseDay);
    candidate.setDate(baseDay.getDate() + offset);
    const date = toIsoDate(candidate);
    const windows = phoneBookingTimeWindowOptions.filter((window) => isPhoneBookingWindowAvailable(date, window, now));
    if (windows.length > 0) {
      slots.push({
        date,
        label: offset === 0 ? `Today, ${toLabel(candidate)} — Same Day` : toLabel(candidate),
        windows: [...windows],
      });
    }
  }

  return slots;
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
