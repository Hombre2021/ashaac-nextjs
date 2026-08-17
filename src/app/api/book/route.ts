const MANAGER_BOOKING_TIMEOUT_MS = 8000;
const MANAGER_STATUS_TIMEOUT_MS = 5000;

import { NextResponse } from "next/server";
import {
  buildPrototypeAvailability,
  getCurrentDateInBookingTimeZone,
  isPhoneBookingWindowAvailable,
  phoneBookingTimeWindowOptions,
  bookingRequestSchema,
  resolveSupportedBookingCity,
  strictServiceAreaCities,
  type BookingRequest,
  type BookingSubmissionResponse,
} from "@/lib/booking";
import { saveAppointmentHistory, toAppointmentHistoryRecord } from "@/lib/appointmentHistory";

type ManagerSubmissionResult = {
  ok: boolean;
  managerId?: string;
  customerId?: string;
  calendarEventId?: string;
  calendarHtmlLink?: string;
  detail: string;
  attempts: number;
  lastError?: string;
};

type LogEntry = {
  timestamp: string;
  requestId: string;
  channel: "webhook" | "email" | "sms" | "manager";
  attempt: number;
  status: "pending" | "success" | "failure";
  statusCode?: number;
  error?: string;
  duration?: number;
};

function isGmailAddress(value: string) {
  return /@(?:gmail\.com|googlemail\.com)$/i.test(String(value || "").trim());
}

function log(entry: Omit<LogEntry, "timestamp">) {
  const fullEntry: LogEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };

  const level = entry.status === "failure" ? "error" : "info";
  console[level as "error" | "info"]("booking:notification", fullEntry);
}

function buildManagerPayload(bookingId: string, data: BookingRequest & { mediaUrls?: string[] }) {
  const serviceDescription = [data.customServiceDescription, data.notes]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join("\n\n");

  return {
    bookingId,
    serviceType: data.serviceType,
    customServiceDescription: data.customServiceDescription,
    city: data.city,
    preferredDate: data.preferredDate,
    preferredTimeWindow: data.preferredTimeWindow,
    customerName: `${data.firstName} ${data.lastName}`.trim(),
    customerPhone: data.phone,
    customerEmail: data.email,
    serviceAddress: data.addressLine1,
    serviceCity: data.addressCity,
    serviceZip: data.addressZip,
    callerLanguage: data.callerLanguage,
    customerConfirmationSms: data.customerConfirmationSms,
    notes: serviceDescription,
    mediaUrls: Array.isArray(data.mediaUrls) ? data.mediaUrls : [],
    sourcePage: data.sourcePage,
    source: {
      system: "ashaac-nextjs-booking",
      sourcePage: data.sourcePage,
      utm_source: data.utm_source || "",
      utm_medium: data.utm_medium || "",
      utm_campaign: data.utm_campaign || "",
      utm_term: data.utm_term || "",
      utm_content: data.utm_content || "",
      gclid: data.gclid || "",
      gbraid: data.gbraid || "",
      wbraid: data.wbraid || "",
      fbclid: data.fbclid || "",
      msclkid: data.msclkid || "",
    },
    submittedAt: new Date().toISOString(),
  };
}

async function submitToManager(
  bookingId: string,
  data: BookingRequest & { mediaUrls?: string[] },
): Promise<ManagerSubmissionResult | null> {
  const managerUrl = process.env.MANAGER_BOOKING_URL;
  const managerApiKey = process.env.MANAGER_API_KEY;
  const authHeaderName = process.env.MANAGER_AUTH_HEADER || "X-API-Key";

  if (!managerUrl) {
    return null;
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (managerApiKey) headers[authHeaderName] = managerApiKey;
  const startedAt = Date.now();
  log({ requestId: bookingId, channel: "manager", attempt: 1, status: "pending" });

  let response: Response;
  try {
    response = await fetch(managerUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(buildManagerPayload(bookingId, data)),
      signal: AbortSignal.timeout(MANAGER_BOOKING_TIMEOUT_MS),
    });
  } catch (error) {
    const lastError = String(error);
    try {
      const statusUrl = new URL(managerUrl);
      statusUrl.searchParams.set("bookingId", bookingId);
      const statusResponse = await fetch(statusUrl, {
        method: "GET",
        headers,
        cache: "no-store",
        signal: AbortSignal.timeout(MANAGER_STATUS_TIMEOUT_MS),
      });
      const statusBody = await statusResponse.json().catch(() => null) as Record<string, unknown> | null;
      if (statusResponse.ok && statusBody?.managerId && statusBody?.customerId) {
        response = new Response(JSON.stringify(statusBody), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
        console.info("booking:manager-status-recovered", {
          requestId: bookingId,
          duration: Date.now() - startedAt,
          calendarLinked: Boolean(statusBody.calendarEventId),
        });
      } else {
        throw new Error(`manager status returned ${statusResponse.status}`);
      }
    } catch (statusError) {
      const recoveryError = `${lastError}; status recovery failed: ${String(statusError)}`;
      log({ requestId: bookingId, channel: "manager", attempt: 1, status: "failure", error: recoveryError, duration: Date.now() - startedAt });
      return {
        ok: false,
        detail: `failed: ${recoveryError}`,
        attempts: 1,
        lastError: recoveryError,
      };
    }
  }

  if (!response.ok) {
    const lastError = `manager returned ${response.status}`;
    log({ requestId: bookingId, channel: "manager", attempt: 1, status: "failure", statusCode: response.status, error: lastError, duration: Date.now() - startedAt });
    return { ok: false, detail: `failed: ${lastError}`, attempts: 1, lastError };
  }

  log({ requestId: bookingId, channel: "manager", attempt: 1, status: "success", statusCode: response.status, duration: Date.now() - startedAt });
  const responseBody = (await response.json().catch(() => null)) as Record<string, unknown> | null;

  const managerId = (responseBody?.managerId || responseBody?.id || responseBody?.leadId || responseBody?.requestId) as
    | string
    | undefined;
  const customerId = (responseBody?.customerId || responseBody?.crmCustomerId) as string | undefined;
  const calendarEventId = (responseBody?.calendarEventId || responseBody?.eventId) as string | undefined;
  const calendarHtmlLink = (responseBody?.calendarHtmlLink || responseBody?.htmlLink) as string | undefined;

  if (!managerId || !customerId) {
    return {
      ok: false,
      managerId,
      customerId,
      calendarEventId,
      calendarHtmlLink,
      detail: [
        managerId ? `appointment recorded: ${managerId}` : "appointment ID not returned",
        customerId ? `customer linked: ${customerId}` : "customer ID not returned",
      ].join(" | "),
      attempts: 1,
      lastError: "hvac-pro intake did not confirm both appointment and customer linkage",
    };
  }

  return {
    ok: true,
    managerId,
    customerId,
    calendarEventId,
    calendarHtmlLink,
    detail: [
      managerId ? `accepted with manager ID: ${managerId}` : "accepted (no manager ID returned)",
      customerId ? `customer ID: ${customerId}` : "customer ID: not returned",
      calendarEventId ? `Google Calendar event: ${calendarEventId}` : "Google Calendar event: not returned",
    ].join(" | "),
    attempts: 1,
  };
}

export async function GET(request: Request) {
  const internalPhoneToken = String(request.headers.get("x-phone-booking-token") || "");
  const expectedPhoneToken = String(process.env.OPENAI_REALTIME_MCP_TOKEN || "");
  if (!expectedPhoneToken || internalPhoneToken !== expectedPhoneToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const bookingId = String(new URL(request.url).searchParams.get("bookingId") || "").trim();
  if (!/^[A-F0-9]{8}$/.test(bookingId)) {
    return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
  }
  const managerUrl = process.env.MANAGER_BOOKING_URL;
  if (!managerUrl) return NextResponse.json({ error: "Manager not configured" }, { status: 503 });
  const statusUrl = new URL(managerUrl);
  statusUrl.searchParams.set("bookingId", bookingId);
  const headers: Record<string, string> = {};
  const managerApiKey = process.env.MANAGER_API_KEY;
  if (managerApiKey) headers[process.env.MANAGER_AUTH_HEADER || "X-API-Key"] = managerApiKey;
  try {
    const response = await fetch(statusUrl, {
      method: "GET",
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(MANAGER_STATUS_TIMEOUT_MS),
    });
    const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json({ error: "Booking status unavailable" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const { mediaUrls, bookingId: requestedBookingId, ...bookingBody } = (body || {}) as Record<string, unknown>;
  const parsed = bookingRequestSchema.safeParse(bookingBody);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message || "Booking request is invalid.",
      },
      { status: 400 },
    );
  }

  const requestedCity = resolveSupportedBookingCity(parsed.data.city);
  const addressCity = resolveSupportedBookingCity(parsed.data.addressCity);
  const strictCities = new Set<string>(strictServiceAreaCities);
  if (!requestedCity || !addressCity || requestedCity !== addressCity || !strictCities.has(requestedCity)) {
    return NextResponse.json(
      { error: "We currently serve West Jordan, South Jordan, Riverton, and Herriman only." },
      { status: 422 },
    );
  }

  const availability = buildPrototypeAvailability();
  const currentMountainDate = getCurrentDateInBookingTimeZone();
  if (parsed.data.preferredDate < currentMountainDate) {
    return NextResponse.json(
      { error: "Selected date is in the past. Please choose today or a future date." },
      { status: 400 },
    );
  }

  const selectedDate = availability.find((slot) => slot.date === parsed.data.preferredDate);
  const isPhoneTwoHourWindow = (phoneBookingTimeWindowOptions as readonly string[]).includes(parsed.data.preferredTimeWindow);
  const selectedWindowIsValid = isPhoneTwoHourWindow
    ? isPhoneBookingWindowAvailable(parsed.data.preferredDate, parsed.data.preferredTimeWindow)
    : Boolean(selectedDate?.windows.includes(parsed.data.preferredTimeWindow as typeof selectedDate.windows[number]));

  if (!selectedWindowIsValid) {
    return NextResponse.json(
      { error: "Selected time window is no longer available. Please choose a current or future window." },
      { status: 400 },
    );
  }

  const internalPhoneToken = String(request.headers.get("x-phone-booking-token") || "");
  const expectedPhoneToken = String(process.env.OPENAI_REALTIME_MCP_TOKEN || "");
  const trustedPhoneBooking = Boolean(expectedPhoneToken) && internalPhoneToken === expectedPhoneToken;
  const payload: BookingSubmissionResponse = {
    mode: "prototype",
    requestId: trustedPhoneBooking && /^[A-F0-9]{8}$/.test(String(requestedBookingId || ""))
      ? String(requestedBookingId)
      : crypto.randomUUID().slice(0, 8).toUpperCase(),
    nextStep: "Booking received. Processing...",
  };

  // Attach media URLs to manager payload so HVAC Pro stores the reference
  const managerPayloadExtra = Array.isArray(mediaUrls) && mediaUrls.length > 0
    ? { mediaUrls: mediaUrls as string[] }
    : {};

  const managerResult = await submitToManager(payload.requestId, { ...parsed.data, ...managerPayloadExtra } as BookingRequest);

  const resolvedNotificationSummary = managerResult?.ok
    ? "manager:submitted"
    : "manager:failed";

    const historyRecord = toAppointmentHistoryRecord(
      payload.requestId,
      parsed.data,
      Array.isArray(mediaUrls) ? (mediaUrls as string[]) : [],
      {
        status: managerResult ? (managerResult.ok ? "submitted" : "failed") : "not-configured",
        id: managerResult?.managerId,
        detail: managerResult?.detail || "manager not configured",
      },
      resolvedNotificationSummary,
    );

    const historyResult = await saveAppointmentHistory(historyRecord, {
      skipAppointmentsWrite: Boolean(managerResult?.ok),
    });

    if (!managerResult?.ok) {
      return NextResponse.json(
        {
          error: "Booking could not be confirmed in CRM. Please try again or call 801-755-3040.",
          requestId: payload.requestId,
          detail: managerResult?.detail || "manager intake unavailable",
          history: historyResult.detail,
        },
        { status: 502 },
      );
    }

    const messages: string[] = [];

    if (managerResult) {
      messages.push(`Manager: ${managerResult.detail}`);
    }

    if (managerResult?.ok) {
      messages.push("Notifications: routed through hvac-pro intake pipeline");
    }

    if (managerResult?.calendarEventId && isGmailAddress(parsed.data.email)) {
      messages.push("Calendar invite: sent to your Gmail address");
    }

    if (historyResult.ok) {
      messages.push("Records: saved for future reference");
    } else {
      messages.push("Records: save attempt completed");
    }

    if (messages.length === 0) {
      messages.push("Booking saved locally. No external integrations configured.");
    }

    payload.nextStep = messages.join(" | ");

    const responseData: Record<string, unknown> = {
      ...payload,
    };

    if (managerResult?.managerId) {
      responseData.managerId = managerResult.managerId;
    }

    if (managerResult?.customerId) {
      responseData.customerId = managerResult.customerId;
    }

    if (managerResult?.calendarEventId) {
      responseData.calendarEventId = managerResult.calendarEventId;
    }

    if (managerResult?.calendarHtmlLink) {
      responseData.calendarHtmlLink = managerResult.calendarHtmlLink;
    }

    return NextResponse.json(responseData, { status: 201 });
}
