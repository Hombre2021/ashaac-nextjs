import { NextResponse } from "next/server";
import {
  buildPrototypeAvailability,
  getCurrentDateInBookingTimeZone,
  bookingRequestSchema,
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

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  channel: string,
  requestId: string,
  maxAttempts = 3,
): Promise<{ result: T | null; attempts: number; lastError: string | null }> {
  let lastError: string | null = null;
  let attempts = 0;

  for (let i = 1; i <= maxAttempts; i++) {
    attempts = i;
    const startTime = Date.now();

    try {
      log({
        requestId,
        channel: channel as "webhook" | "email" | "sms",
        attempt: i,
        status: "pending",
      });

      const result = await fn();

      const duration = Date.now() - startTime;
      log({
        requestId,
        channel: channel as "webhook" | "email" | "sms",
        attempt: i,
        status: "success",
        duration,
      });

      return { result, attempts: i, lastError: null };
    } catch (error) {
      const duration = Date.now() - startTime;
      lastError = String(error);

      log({
        requestId,
        channel: channel as "webhook" | "email" | "sms",
        attempt: i,
        status: "failure",
        error: lastError,
        duration,
      });

      if (i < maxAttempts) {
        const backoffMs = Math.pow(2, i - 1) * 1000;
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
  }

  return { result: null, attempts, lastError };
}

function buildManagerPayload(bookingId: string, data: BookingRequest & { mediaUrls?: string[] }) {
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
    notes: data.notes || "",
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
    attribution: {
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

  const { result, attempts, lastError } = await retryWithBackoff(
    async () => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (managerApiKey) {
        headers[authHeaderName] = managerApiKey;
      }

      const response = await fetch(managerUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(buildManagerPayload(bookingId, data)),
      });

      if (!response.ok) {
        throw new Error(`manager returned ${response.status}`);
      }

      const responseBody = (await response.json().catch(() => null)) as Record<
        string,
        unknown
      > | null;
      return { response, body: responseBody };
    },
    "manager",
    bookingId,
    2,
  );

  if (!result) {
    return {
      ok: false,
      detail: `failed: ${lastError}`,
      attempts,
      lastError: lastError || undefined,
    };
  }

  const managerId = (result.body?.managerId || result.body?.id || result.body?.leadId || result.body?.requestId) as
    | string
    | undefined;
  const customerId = (result.body?.customerId || result.body?.crmCustomerId) as string | undefined;
  const calendarEventId = (result.body?.calendarEventId || result.body?.eventId) as string | undefined;
  const calendarHtmlLink = (result.body?.calendarHtmlLink || result.body?.htmlLink) as string | undefined;

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
      attempts,
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
    attempts,
  };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const { mediaUrls, ...bookingBody } = (body || {}) as Record<string, unknown>;
  const parsed = bookingRequestSchema.safeParse(bookingBody);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message || "Booking request is invalid.",
      },
      { status: 400 },
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
  const selectedWindowIsValid = Boolean(selectedDate?.windows.includes(parsed.data.preferredTimeWindow));

  if (!selectedWindowIsValid) {
    return NextResponse.json(
      { error: "Selected time window is no longer available. Please choose a current or future window." },
      { status: 400 },
    );
  }

  const payload: BookingSubmissionResponse = {
    mode: "prototype",
    requestId: crypto.randomUUID().slice(0, 8).toUpperCase(),
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
