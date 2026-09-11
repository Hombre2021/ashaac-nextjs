import { createHash, timingSafeEqual } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import { allBookingTimeWindowOptions, bookingRequestSchema, buildPhoneAvailability, getCurrentDateInBookingTimeZone, isAfterHoursPhoneBooking, isExactPhoneBookingHourAvailable, isExactPhoneBookingWindowAvailable, phoneBookingTimeWindowOptions, resolveSupportedBookingCity } from "@/lib/booking";
import { createPhoneBookingCode, createPhoneBookingVerificationProof, getPhoneBookingVerificationForCall, normalizeVerificationPhone, verifyPhoneBookingCode } from "@/lib/phoneBookingVerification";
import { getTwilioConfig, sendTwilioSms } from "@/lib/twilio";
import { appendAssistantSpamReview, upsertAssistantSpamRule } from "@/lib/assistantStore";
import { clearPhoneBookingFarewellPending, isPhoneBookingFarewellPending, markPhoneBookingFarewellPending } from "@/lib/phoneBookingCloseState";
import { PHONE_BOOKING_VERIFICATION_ENABLED } from "@/temporary/phone-booking-verification/config";

export const runtime = "nodejs";
export const maxDuration = 60;

const INTERNAL_REQUEST_TIMEOUT_MS = 12000;
const BOOKING_REQUEST_TIMEOUT_MS = 45000;
const FAREWELL_AUDIO_DRAIN_MS = 12000;
const POST_FAREWELL_GRACE_MS = 4000;

function authorized(request: Request) {
  const expected = String(process.env.OPENAI_REALTIME_MCP_TOKEN || "").trim();
  const supplied = String(request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!expected || !supplied) return false;
  const expectedBytes = Buffer.from(expected);
  const suppliedBytes = Buffer.from(supplied);
  return expectedBytes.length === suppliedBytes.length && timingSafeEqual(expectedBytes, suppliedBytes);
}

async function postInternal(origin: string, path: string, body: Record<string, unknown>) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (path === "/api/book") {
    headers["x-phone-booking-token"] = String(process.env.OPENAI_REALTIME_MCP_TOKEN || "");
  }
  const response = await fetch(`${origin}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(path === "/api/book" ? BOOKING_REQUEST_TIMEOUT_MS : INTERNAL_REQUEST_TIMEOUT_MS),
  });
  const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) throw new Error(String(payload.error || payload.detail || `HTTP ${response.status}`));
  return payload;
}

async function getInternal(origin: string, path: string) {
  const response = await fetch(`${origin}${path}`, {
    method: "GET",
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });
  const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) throw new Error(String(payload.error || payload.detail || `HTTP ${response.status}`));
  return payload;
}

async function hasDurableBooking(origin: string, callId: string) {
  if (!/^rtc_[A-Za-z0-9_-]+$/.test(callId)) return false;
  const bookingId = createHash("sha256").update(callId).digest("hex").slice(0, 8).toUpperCase();
  try {
    const response = await fetch(`${origin}/api/book?bookingId=${encodeURIComponent(bookingId)}`, {
      method: "GET",
      headers: { "x-phone-booking-token": String(process.env.OPENAI_REALTIME_MCP_TOKEN || "") },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    const result = await response.json().catch(() => ({})) as Record<string, unknown>;
    if (!response.ok) return false;
    return Boolean(result.managerId && result.customerId);
  } catch {
    return false;
  }
}

function twilioCredentials() {
  const clean = (value: string | undefined) => String(value || "").replace(/(?:\\[rn]|[\r\n])+$/g, "").trim();
  return {
    sid: clean(process.env.TWILIO_ACCOUNT_SID),
    token: clean(process.env.TWILIO_AUTH_TOKEN),
    from: clean(process.env.TWILIO_FROM_CALL || process.env.TWILIO_FROM_NUMBER),
  };
}

async function resolveConferenceSid(conferenceName: string) {
  if (!/^ash-CA[0-9a-f]{32}$/i.test(conferenceName)) return "";
  const twilio = twilioCredentials();
  if (!twilio.sid || !twilio.token) return "";
  const query = new URLSearchParams({
    FriendlyName: conferenceName,
    Status: "in-progress",
    PageSize: "1",
  });
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilio.sid}/Conferences.json?${query}`, {
    headers: { Authorization: `Basic ${Buffer.from(`${twilio.sid}:${twilio.token}`).toString("base64")}` },
  });
  const payload = await response.json().catch(() => ({})) as { conferences?: Array<{ sid?: string }> };
  return response.ok ? String(payload.conferences?.[0]?.sid || "") : "";
}

async function resolveParticipantCallSid(conferenceSid: string, participant: string) {
  if (/^CA[0-9a-f]{32}$/i.test(participant)) return participant;
  const twilio = twilioCredentials();
  if (!twilio.sid || !twilio.token || !/^CF[0-9a-f]{32}$/i.test(conferenceSid)) return "";
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilio.sid}/Conferences/${conferenceSid}/Participants.json?PageSize=20`, {
    headers: { Authorization: `Basic ${Buffer.from(`${twilio.sid}:${twilio.token}`).toString("base64")}` },
  });
  const payload = await response.json().catch(() => ({})) as { participants?: Array<{ call_sid?: string; label?: string }> };
  if (!response.ok) return "";
  const match = payload.participants?.find((entry) => entry.label === participant);
  return String(match?.call_sid || "");
}

async function endCallerCall(conferenceName: string, directCallSid: string) {
  const { sid, token } = twilioCredentials();
  if (!sid || !token) return false;
  let callerCallSid = /^CA[0-9a-f]{32}$/i.test(directCallSid) ? directCallSid : "";
  if (!callerCallSid && /^ash-CA[0-9a-f]{32}$/i.test(conferenceName)) {
    const conferenceSid = await resolveConferenceSid(conferenceName);
    if (conferenceSid) callerCallSid = await resolveParticipantCallSid(conferenceSid, "caller");
  }
  if (!callerCallSid) return false;

  await new Promise((resolve) => setTimeout(resolve, FAREWELL_AUDIO_DRAIN_MS + POST_FAREWELL_GRACE_MS));
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls/${callerCallSid}.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ Status: "completed" }).toString(),
  });
  return response.ok;
}

function toolResult(payload: unknown, isError = false) {
  return {
    isError,
    content: [{ type: "text" as const, text: JSON.stringify(payload) }],
  };
}

function windowMatchesPeriod(window: string, period: "morning" | "afternoon" | "evening" | "any") {
  if (period === "any") return true;
  const hourMatch = window.match(/^(\d{1,2}):\d{2}\s*(AM|PM)/i);
  if (!hourMatch) return true;
  const hour = (Number(hourMatch[1]) % 12) + (hourMatch[2].toUpperCase() === "PM" ? 12 : 0);
  if (period === "morning") return hour < 12;
  if (period === "afternoon") return hour >= 12 && hour < 17;
  return hour >= 17;
}

function twoHourWindowForRequestedHour(requestedHour: number) {
  if (!Number.isInteger(requestedHour) || requestedHour < 0 || requestedHour > 23) return "";
  const startHour = Math.floor(requestedHour / 2) * 2;
  return phoneBookingTimeWindowOptions.find((window) => {
    const match = window.match(/^(\d{1,2}):00\s*(AM|PM)/i);
    if (!match) return false;
    const hour = (Number(match[1]) % 12) + (match[2].toUpperCase() === "PM" ? 12 : 0);
    return hour === startHour;
  }) || "";
}

function nextIsoDate(date: string) {
  const parsed = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  parsed.setUTCDate(parsed.getUTCDate() + 1);
  return parsed.toISOString().slice(0, 10);
}

function createServer(origin: string, conferenceName: string, callerPhone: string, currentCallId: string, directCallSid: string) {
  const server = new McpServer({ name: "all-solutions-phone-tools", version: "1.0.0" });

  server.registerTool("check_availability", {
    description: "Get phone booking availability. For next, earliest, or broad period requests, offer only regular hours from 8:00 AM through 8:00 PM. When the caller explicitly requests an exact hour, pass requestedHour in 24-hour time; the server resolves its exact two-hour block. Exact after-hours requests remain available through the separate after-hours consent flow. Always say exactly 'Let me check availability.' immediately before calling this tool.",
    inputSchema: {
      requestedDate: z.string().optional().describe("Requested date in YYYY-MM-DD when known. Broad values such as earliest or next available are normalized server-side."),
      requestedPeriod: z.string().optional().describe("Morning, afternoon, evening, any, earliest, or next available."),
      requestedHour: z.union([z.number(), z.string()]).optional().describe("Exact caller-requested hour in 24-hour time. Example: 11 PM is 23 and maps to 10:00 PM - 12:00 AM."),
      requestedTimeWindow: z.string().optional().describe("Exact requested two-hour time block containing the hour named by the caller. Broad values are normalized server-side."),
    },
  }, async ({ requestedDate, requestedPeriod, requestedHour, requestedTimeWindow }) => {
    try {
      const normalizedDate = /^\d{4}-\d{2}-\d{2}$/.test(String(requestedDate || "")) ? String(requestedDate) : "";
      const periodText = String(requestedPeriod || "").toLowerCase();
      const period = periodText.includes("morning")
        ? "morning"
        : periodText.includes("afternoon")
          ? "afternoon"
          : periodText.includes("evening")
            ? "evening"
            : "any";
      const parsedHour = requestedHour === undefined || requestedHour === "" ? undefined : Number(requestedHour);
      const normalizedHour = Number.isInteger(parsedHour) && Number(parsedHour) >= 0 && Number(parsedHour) <= 23
        ? Number(parsedHour)
        : undefined;
      const normalizedWindow = (allBookingTimeWindowOptions as readonly string[]).includes(String(requestedTimeWindow || ""))
        ? requestedTimeWindow as (typeof allBookingTimeWindowOptions)[number]
        : "";
      const resolvedRequestedWindow = normalizedHour === undefined
        ? normalizedWindow
        : twoHourWindowForRequestedHour(normalizedHour);
      const availability = await getInternal(origin, "/api/book/availability") as { slots?: Array<{ date?: string; windows?: string[] }> };
      const regularSlots = Array.isArray(availability.slots) ? availability.slots : [];
      const initialRequestedDate = resolvedRequestedWindow
        ? normalizedDate || getCurrentDateInBookingTimeZone()
        : "";
      const exactRequestedDate = normalizedHour !== undefined
        && normalizedHour < 8
        && initialRequestedDate === getCurrentDateInBookingTimeZone()
        && !isExactPhoneBookingHourAvailable(initialRequestedDate, normalizedHour)
          ? nextIsoDate(initialRequestedDate)
          : initialRequestedDate;
      const slots = resolvedRequestedWindow && normalizedHour !== undefined
        ? [{
            date: exactRequestedDate,
            windows: isExactPhoneBookingHourAvailable(exactRequestedDate, normalizedHour)
              ? [resolvedRequestedWindow]
              : [],
          }]
        : resolvedRequestedWindow
          ? [{
              date: exactRequestedDate,
              windows: isExactPhoneBookingWindowAvailable(exactRequestedDate, resolvedRequestedWindow)
                ? [resolvedRequestedWindow]
                : [],
            }]
        : regularSlots.length > 0 ? regularSlots : buildPhoneAvailability();
      const matching = slots
        .filter((slot) => !resolvedRequestedWindow || slot.date === exactRequestedDate)
        .filter((slot) => resolvedRequestedWindow || !normalizedDate || slot.date === normalizedDate)
        .flatMap((slot) => (slot.windows || [])
          .filter((window) => !resolvedRequestedWindow || window === resolvedRequestedWindow)
          .filter((window) => resolvedRequestedWindow || !isAfterHoursPhoneBooking(slot.date || "", window))
          .filter((window) => windowMatchesPeriod(window, period))
          .map((window) => ({
            date: slot.date || "",
            window,
            afterHours: isAfterHoursPhoneBooking(slot.date || "", window),
          })))
        .slice(0, 3);
      console.info("Phone availability check completed", {
        callId: currentCallId,
        requestedDate: normalizedDate || exactRequestedDate,
        requestedHour: normalizedHour ?? null,
        requestedTimeWindow: resolvedRequestedWindow || "",
        rolledToNextDay: Boolean(normalizedDate && exactRequestedDate && normalizedDate !== exactRequestedDate),
        matchCount: matching.length,
        afterHours: matching[0]?.afterHours === true,
      });
      return toolResult({
        ok: true,
        requestedDate: exactRequestedDate || normalizedDate,
        requestedPeriod: period,
        requestedHour: normalizedHour ?? null,
        requestedTimeWindow: resolvedRequestedWindow || "",
        recommended: matching[0] || null,
        alternatives: matching.slice(1),
        instruction: matching.length > 0
          ? "Say exactly: That time is available. Then repeat only the recommended date and full two-hour time block returned here and ask exactly: Would you like that exact block? Never use a time from an earlier result. For broad or next-available searches, offer only regular-hours results. Keep slot classification internal. If the caller explicitly requested the returned time and it has afterHours true, then give the separate after-hours disclosure and $100 fee question after acceptance."
          : "Tell the caller no matching time was found and ask for another date or time period.",
      });
    } catch (error) {
      return toolResult({ error: String((error as Error).message || error) }, true);
    }
  });

  server.registerTool("send_booking_code", {
    description: "Send a six-digit appointment verification code by SMS after the caller accepts an offered appointment time. The caller reads only the six numerical digits from the text. callId and verificationId are internal identifiers: never say, spell, describe, or ask the caller to read them. For after-hours times, afterHoursFeeAccepted may be true only after the caller explicitly accepts the $100 additional fee. Ask whether to use the incoming caller-ID number or another mobile number before calling this tool. Never ask for detailed booking information until the code is verified.",
    inputSchema: {
      callId: z.string().startsWith("rtc_").optional(),
      useCallerId: z.boolean().optional().describe("True when the caller explicitly agrees to receive the code at the incoming caller-ID number."),
      phone: z.string().min(10).optional().describe("Required only when the caller declines the caller-ID number and supplies another mobile number."),
      phoneConfirmed: z.literal(true).describe("True only after the caller explicitly accepts the incoming caller-ID number, or after every digit of an alternate mobile number is read back and confirmed."),
      preferredDate: z.string().min(10),
      preferredTimeWindow: z.enum(allBookingTimeWindowOptions),
      afterHoursFeeAccepted: z.literal(true).optional().describe("Required for after-hours times and true only after the caller explicitly accepts the $100 additional fee."),
      testMode: z.literal(true).optional().describe("True only when the caller explicitly declared this is a test call. The server persists this no-write mode through final validation."),
    },
  }, async (args) => {
    const callId = args.callId || currentCallId;
    const phone = args.useCallerId === true ? callerPhone : args.phone || "";
    if (!callId || !phone) {
      return toolResult({
        error: "A confirmed mobile number is required for verification.",
        instruction: "Ask for a reachable mobile number, read every digit back, ask only: Is that correct? After confirmation, retry send_booking_code with useCallerId false, that number, and phoneConfirmed true.",
      }, true);
    }
    if (isAfterHoursPhoneBooking(args.preferredDate, args.preferredTimeWindow) && args.afterHoursFeeAccepted !== true) {
      return toolResult({
        error: "Explicit after-hours fee acceptance is required.",
        instruction: "Do not send the code or continue this after-hours booking. Say exactly: I understand, would you like to schedule our technician to come a regular time? Wait for the caller's answer.",
      }, true);
    }
    const twilio = getTwilioConfig();
    if (!twilio.configured || !twilio.fromSms) {
      return toolResult({ error: "SMS verification is unavailable. Offer a callback instead." }, true);
    }
    const challenge = await createPhoneBookingCode({
      ...args,
      callId,
      phone,
    });
    if (!challenge) {
      return toolResult({ error: "Unable to start phone verification. Offer a callback instead." }, true);
    }
    try {
      const message = await sendTwilioSms({
        sid: twilio.sid,
        token: twilio.token,
        from: twilio.fromSms,
        to: challenge.record.phone,
        body: `All Solutions appointment verification code: ${challenge.code}. This code expires in 5 minutes. Do not share it except with our phone assistant during this call.`,
      });
      return toolResult({
        ok: true,
        verificationId: challenge.record.id,
        messageSid: String(message?.sid || ""),
        phone: challenge.record.phone,
        expiresInMinutes: 5,
        instruction: "Say exactly: I sent you a text message. Please read only the six-digit number in that message. Do not speak or ask for the internal verificationId or callId, and do not reveal or guess the code.",
      });
    } catch (error) {
      return toolResult({ error: `Unable to send verification text: ${String((error as Error).message || error)}` }, true);
    }
  });

  server.registerTool("verify_booking_code", {
    description: "Verify the six numerical digits exactly once. After this tool reports verified or alreadyVerified, the verification step is permanently complete for this call: never call this tool again and immediately ask for the visit reason.",
    inputSchema: {
      callId: z.string().startsWith("rtc_").optional(),
      verificationId: z.string().uuid().optional(),
      code: z.string().regex(/^\d{6}$/, "Enter exactly six numerical digits."),
    },
  }, async (args) => {
    const callId = args.callId || currentCallId;
    const activeVerification = callId ? await getPhoneBookingVerificationForCall(callId) : null;
    const verificationId = args.verificationId || activeVerification?.id || "";
    const result = await verifyPhoneBookingCode({ callId, verificationId, code: args.code });
    console.info("Phone booking code verification completed", {
      callId,
      status: result.status,
    });
    if (result.status === "verified") {
      return toolResult({
        ok: true,
        verified: true,
        verificationComplete: true,
        verificationProof: result.record ? createPhoneBookingVerificationProof(result.record) : "",
        nextStep: "collectVisitReason",
        sayExactly: "That is correct, thank you for confirming that with me.",
        instruction: "The six-digit verification step is complete. Keep verificationProof internal and pass it unchanged to create_booking. Never speak it, ask for it, or verify a code again during this call. Say the sayExactly text verbatim, then ask exactly: Describe in your own words the reason you want our technician to come to your location.",
      });
    }
    if (result.status === "incorrect") {
      return toolResult({
        error: "The verification code was incorrect.",
        attemptsRemaining: result.attemptsRemaining,
        instruction: "Ask the caller to read the same six-digit code again. Do not send another code yet.",
      }, true);
    }
    const instruction = result.status === "expired"
      ? "Tell the caller the code expired and call send_booking_code once to send a new code."
      : result.status === "locked"
        ? "Tell the caller verification could not be completed and offer a callback."
        : "Ask the caller to read all six digits again.";
    return toolResult({ error: `Verification status: ${result.status}.`, instruction }, true);
  });

  server.registerTool("create_booking", {
    description: "Create a confirmed appointment using the accepted date and time plus the caller's confirmed name, phone, service address, and visit reason. Email and SMS verification are not used.",
    inputSchema: {
      preferredDate: z.string().default(""),
      preferredTimeWindow: z.string().default(""),
      city: z.string().default("").describe("Served Utah city. Common variants such as Riverton, Utah are normalized server-side."),
      firstName: z.string().default(""),
      lastName: z.string().default(""),
      phone: z.string().default(""),
      phoneConfirmed: z.literal(true).optional(),
      testMode: z.literal(true).optional(),
      afterHoursFeeAccepted: z.literal(true).optional(),
      addressLine1: z.string().default(""),
      addressCity: z.string().default(""),
      addressState: z.string().default(""),
      addressZip: z.string().default(""),
      visitReason: z.string().default("").describe("The website Project details value. Use the caller-confirmed wording when it is English, or a concise faithful English translation when another language was selected."),
      callerLanguage: z.string().max(40).optional().describe("The confirmed non-English caller language written in English, for example Spanish or Portuguese. Omit this field when the selected language is English."),
      customerConfirmationSms: z.string().max(1600).optional().describe("Required for a confirmed non-English language. Write the complete booking confirmation text in the caller's selected language, using the confirmed name, appointment date, full time block, and service address. Include {{BOOKING_ID}} exactly where the booking ID belongs. For after-hours bookings, state in that language that technician confirmation is still required and the additional charge is $100. Omit this field for English."),
    },
  }, async (args) => {
    console.info("Phone create_booking invoked", {
      callId: currentCallId,
      hasDate: Boolean(args.preferredDate),
      hasTimeWindow: Boolean(args.preferredTimeWindow),
      hasCity: Boolean(args.city || args.addressCity),
      hasName: Boolean(args.firstName && args.lastName),
      hasAddress: Boolean(args.addressLine1 && args.addressZip),
      hasVisitReason: Boolean(args.visitReason),
      hasNonEnglishLanguage: Boolean(args.callerLanguage && !/^english$/i.test(args.callerLanguage.trim())),
    });
    const callId = currentCallId;
    const preferredDate = args.preferredDate;
    const preferredTimeWindow = args.preferredTimeWindow;
    const bookingPhone = normalizeVerificationPhone(callerPhone)
      || normalizeVerificationPhone(args.phone);
    if (!bookingPhone) {
      return toolResult({
        ok: false,
        needsCorrection: true,
        field: "phone",
        detail: "A reachable caller phone number is required.",
        instruction: "Ask only for a reachable phone number, read every digit back, confirm it, and immediately retry create_booking.",
      });
    }
    console.info("Phone create_booking booking context applied", {
      callId,
      preferredDate,
      preferredTimeWindow,
      verificationEnabled: PHONE_BOOKING_VERIFICATION_ENABLED,
      callerIdApplied: Boolean(normalizeVerificationPhone(callerPhone)),
    });
    const city = resolveSupportedBookingCity(args.city || args.addressCity);
    if (!city) {
      console.info("Phone create_booking correction required", { callId: currentCallId, field: "city", reason: "invalid-city" });
      return toolResult({
        ok: false,
        needsCorrection: true,
        field: "city",
        detail: "The service city is outside the direct-booking area or needs correction.",
        instruction: "Ask only for the service city. After the caller answers, retry create_booking using the matching served Utah city. Do not say there was a booking-system problem.",
      });
    }
    const addressCity = resolveSupportedBookingCity(args.addressCity || city) || city;
    const addressState = String(args.addressState || "").trim() || "UT";
    const addressZip = String(args.addressZip || "").replace(/\D/g, "").slice(0, 5) || String(args.addressZip || "").trim();
    const webFormPreflight = bookingRequestSchema.safeParse({
      ...args,
      preferredDate,
      preferredTimeWindow,
      city,
      phone: "+10000000000",
      addressCity,
      addressState,
      serviceType: "Use your own words",
      customServiceDescription: args.visitReason,
      notes: "",
      sourcePage: "/phone-assistant-realtime",
      utm_source: "phone-assistant",
      utm_medium: "voice",
      utm_campaign: "openai-realtime-booking",
      utm_term: "",
      utm_content: "",
      gclid: "",
      gbraid: "",
      wbraid: "",
      fbclid: "",
      msclkid: "",
    });
    if (!webFormPreflight.success) {
      const issue = webFormPreflight.error.issues[0];
      const field = String(issue?.path?.[0] || "booking information");
      console.info("Phone create_booking correction required", { callId: currentCallId, reason: "booking-field", field, stage: "preflight" });
      return toolResult({
        ok: false,
        needsCorrection: true,
        field,
        detail: issue?.message || "Invalid booking information.",
        instruction: `Ask only for the caller's ${field}, read it back when confirmation is required, and retry create_booking once with every previously confirmed field unchanged.`,
      });
    }
    const afterHours = isAfterHoursPhoneBooking(preferredDate, preferredTimeWindow);
    const afterHoursFeeAccepted = args.afterHoursFeeAccepted === true;
    if (afterHours && !afterHoursFeeAccepted) {
      console.info("Phone create_booking correction required", { callId, field: "afterHoursFeeAccepted", reason: "after-hours-consent" });
      return toolResult({
        ok: false,
        needsCorrection: true,
        field: "afterHoursFeeAccepted",
        detail: "Explicit after-hours fee acceptance is required before booking.",
        instruction: "Do not create or confirm the appointment. Offer a regular time, or continue only after the caller explicitly accepts the $100 fee.",
      });
    }
    console.info("Phone create_booking caller-confirmed address accepted", { callId, city: addressCity });
    const callerLanguage = String(args.callerLanguage || "").trim();
    const nonEnglishCallerLanguage = callerLanguage && !/^english$/i.test(callerLanguage)
      ? callerLanguage
      : "";
    const customerConfirmationSms = String(args.customerConfirmationSms || "").trim();
    if (nonEnglishCallerLanguage && !customerConfirmationSms.includes("{{BOOKING_ID}}")) {
      return toolResult({
        ok: false,
        needsCorrection: true,
        field: "customerConfirmationSms",
        detail: "A localized customer confirmation with the {{BOOKING_ID}} placeholder is required.",
        instruction: "Retry create_booking immediately with every confirmed booking field unchanged. Add customerConfirmationSms entirely in the selected caller language, include the confirmed appointment date, full time block, and service address, and include {{BOOKING_ID}} exactly where the booking ID belongs. For after-hours bookings, include the pending technician confirmation and $100 additional charge. Do not ask the caller another question.",
      });
    }
    const bookingRequest = {
      ...webFormPreflight.data,
      city,
      phone: bookingPhone,
      addressCity,
      addressState,
      serviceType: "Use your own words" as const,
      // Project details is the single customer narrative field for web and phone bookings.
      customServiceDescription: args.visitReason,
      callerLanguage: nonEnglishCallerLanguage,
      customerConfirmationSms: nonEnglishCallerLanguage ? customerConfirmationSms : "",
      notes: [
        nonEnglishCallerLanguage ? `CALLER LANGUAGE: ${nonEnglishCallerLanguage}` : "",
        afterHours
          ? "AFTER-HOURS BOOKING: Customer explicitly accepted the $100 additional fee. Technician must provide additional confirmation directly to the customer."
          : "",
      ].filter(Boolean).join("\n"),
      sourcePage: "/phone-assistant-realtime",
      utm_source: "phone-assistant",
      utm_medium: "voice",
      utm_campaign: "openai-realtime-booking",
      utm_term: "",
      utm_content: "",
      gclid: "",
      gbraid: "",
      wbraid: "",
      fbclid: "",
      msclkid: "",
    };
    const validated = bookingRequestSchema.safeParse(bookingRequest);
    if (!validated.success) {
      const issue = validated.error.issues[0];
      const field = String(issue?.path?.[0] || "booking information");
      console.info("Phone create_booking correction required", { callId, reason: "booking-field", field, stage: "final" });
      return toolResult({
        ok: false,
        needsCorrection: true,
        field,
        detail: issue?.message || "Invalid booking information.",
        instruction: `Tell the caller the ${field} needs correction, ask only for that value again, confirm it, and retry create_booking once. Do not say there was a system failure.`,
      });
    }
    const testMode = args.testMode === true;
    console.info("Phone create_booking payload validated", { callId, testMode });
    if (testMode) {
      const requestId = `TEST-${createHash("sha256").update(callId).digest("hex").slice(0, 8).toUpperCase()}`;
      console.info("Phone create_booking test completed", { callId, afterHours, requestId });
      return toolResult({
        ok: true,
        testMode: true,
        requestId,
        confirmationType: "test-only",
        instruction: "Tell the caller the complete booking test passed and no real customer, appointment, Calendar event, dispatch message, or booking confirmation was created. Then say exactly: Thank you so much for calling, and have a wonderful rest of your day. Immediately call end_call after finishing the farewell.",
      });
    }
    try {
      console.info("Phone create_booking submission started", { callId, afterHours });
      const bookingId = createHash("sha256").update(callId).digest("hex").slice(0, 8).toUpperCase();
      const booking = await postInternal(origin, "/api/book", {
        ...validated.data,
        bookingId,
      });
      const farewellProtected = await markPhoneBookingFarewellPending(callId);
      console.info("Phone create_booking submission completed", { callId, afterHours, requestId: booking.requestId || "" });
      console.info("Phone booking farewell protection applied", { callId, farewellProtected });
      return toolResult({
        ...booking,
        confirmationType: afterHours ? "temporary-after-hours" : "confirmed",
        instruction: afterHours
          ? "Say exactly in the caller's selected language: Your after-hours appointment has been recorded and is pending additional confirmation from our technician for the service address you provided. The appointment is for [full date], between [full two-hour time block]. The after-hours charge is $100. Thank you so much for calling, and have a wonderful rest of your day. Replace only the bracketed date and time block with the accepted values. After finishing the complete spoken confirmation and farewell, call end_call with farewellCompleted true and bookingConfirmationCompleted true. Do not ask another question, repeat the caller's name or street address, repeat the fee question, or describe it as a final technician confirmation."
          : "Speak this exact confirmation and warm farewell aloud to the caller right now in audio: 'Your booking has been successfully submitted. Please check your phone for a text with the confirmation details. Thank you so much for calling, and you have a wonderful rest of your day.' You must speak this confirmation aloud first. Do not stay silent and do not call end_call until after this confirmation and farewell are completely spoken in audio.",
      });
    } catch (error) {
      const detail = String((error as Error).message || error);
      console.error("Phone create_booking submission failed", { callId, afterHours, detail });
      return toolResult({
        error: detail,
        instruction: "Do not say there was a general booking-system problem. Tell the caller the appointment was not recorded, offer to retry create_booking once using the already confirmed information, and do not recollect information unless the error names a specific field.",
      }, true);
    }
  });

  server.registerTool("submit_service_request", {
    description: "Submit a service or callback request only after the caller confirms the phone number and address.",
    inputSchema: {
      firstName: z.string().min(2),
      lastName: z.string().optional(),
      phone: z.string().min(10),
      address: z.string().min(3),
      city: z.string().min(2),
      state: z.string().optional(),
      zip: z.string().optional(),
      email: z.string().email().optional(),
      serviceType: z.string().min(2),
      urgency: z.enum(["now", "week", "planning"]),
      notes: z.string().min(2),
      preferredDate: z.string().optional(),
      preferredTimeWindow: z.string().optional(),
    },
  }, async (args) => {
    try {
      const payload = await postInternal(origin, "/api/assistant/lead", {
        handoffMode: "callback",
        bookingMode: "callback-only",
        preferredDate: args.preferredDate || "",
        preferredTimeWindow: args.preferredTimeWindow || "",
        firstName: [args.firstName, args.lastName].filter(Boolean).join(" "),
        address: [args.address, args.city, args.state, args.zip].filter(Boolean).join(", "),
        phone: args.phone,
        city: args.city,
        email: args.email || "",
        contactMethod: "phone",
        homeType: "owner",
        serviceType: args.serviceType,
        urgency: args.urgency,
        notes: args.notes,
        assistantTranscript: "OpenAI Realtime SIP call",
        aiBranch: "openai-realtime-sip",
        captureSource: "ai-phone-realtime",
        idempotencyKey: `${currentCallId}:callback`,
      });
      return toolResult({
        ...payload,
        instruction: "Confirm that the message or callback request was saved. Then say exactly: Thank you so much for calling, and have a wonderful rest of your day. Immediately call end_call after finishing the farewell. Do not ask another question.",
      });
    } catch (error) {
      return toolResult({ error: String((error as Error).message || error) }, true);
    }
  });

  server.registerTool("submit_owner_message", {
    description: "Save and text a message to Mauricio, Leandro, or the owner. Live phone transfers are not allowed. Collect only the caller's name, reachable phone number, and message unless the caller voluntarily provides more.",
    inputSchema: {
      callerName: z.string().min(2),
      phone: z.string().min(10),
      message: z.string().min(2).max(1200),
    },
  }, async ({ callerName, phone, message }) => {
    try {
      const payload = await postInternal(origin, "/api/assistant/lead", {
        handoffMode: "callback",
        bookingMode: "owner-message",
        preferredDate: "",
        preferredTimeWindow: "",
        firstName: callerName,
        address: "",
        phone,
        city: "",
        email: "",
        contactMethod: "phone",
        homeType: "owner",
        serviceType: "Owner callback message",
        urgency: "planning",
        notes: message,
        assistantTranscript: "OpenAI Realtime screened owner message",
        aiBranch: "openai-realtime-owner-screening",
        captureSource: "ai-phone-owner-message",
        idempotencyKey: `${currentCallId}:owner-message`,
      });
      return toolResult({
        ...payload,
        instruction: "Say exactly: The owner or technician has been sent your message and will get back to you at his earliest convenience. Then say exactly: Thank you so much for calling, and have a wonderful rest of your day. Immediately call end_call after finishing the farewell. Do not ask another question.",
      });
    } catch (error) {
      return toolResult({ error: String((error as Error).message || error) }, true);
    }
  });

  server.registerTool("block_spam_caller", {
    description: "Persistently block the authenticated incoming caller-ID number only when the caller is clearly a telemarketer, debt collector, robocall, scam, or repeated solicitor. Never use for an uncertain call, a private caller, or merely an off-topic caller.",
    inputSchema: {
      reason: z.enum(["telemarketing", "debt-collection", "robocall", "scam", "repeated-solicitation"]),
      transcriptSummary: z.string().min(2).max(500),
    },
  }, async ({ reason, transcriptSummary }) => {
    if (!/^\+\d{10,15}$/.test(callerPhone)) {
      return toolResult({
        error: "No authenticated caller-ID number is available to block.",
        instruction: "End the unwanted call without claiming the number was blocked.",
      }, true);
    }
    const rule = await upsertAssistantSpamRule({
      type: "deny",
      matchType: "phone",
      value: callerPhone,
      label: `Ash confirmed ${reason}`,
      active: true,
      notes: transcriptSummary,
    });
    await appendAssistantSpamReview({
      phone: callerPhone,
      callerName: "",
      transcript: transcriptSummary,
      reason,
      blocked: true,
      notes: "Blocked during authenticated OpenAI Realtime call.",
    });
    return toolResult({
      ok: true,
      ruleId: rule.id,
      instruction: "Tell the caller this line does not accept solicitation calls and say goodbye. Then immediately call end_call. Do not ask another question.",
    });
  });

  server.registerTool("manage_appointment", {
    description: "Look up, reschedule, or cancel an existing appointment.",
    inputSchema: {
      action: z.enum(["status", "reschedule", "cancel"]),
      requestId: z.string().optional(),
      phone: z.string().optional(),
      firstName: z.string().optional(),
      address: z.string().optional(),
      preferredDate: z.string().optional(),
      preferredTimeWindow: z.string().optional(),
      reason: z.string().optional(),
    },
  }, async (args) => {
    const hasLookup = Boolean(args.requestId?.trim() || (args.phone?.trim() && args.firstName?.trim()));
    if (!hasLookup) {
      return toolResult({
        error: "Appointment identification is incomplete.",
        instruction: "Ask only for the appointment request ID. If the caller does not have it, ask for the confirmed phone number and first name one at a time.",
      }, true);
    }
    if (args.action === "reschedule" && (!args.preferredDate?.trim() || !args.preferredTimeWindow?.trim())) {
      return toolResult({
        error: "The requested reschedule date or time is missing.",
        instruction: args.preferredDate?.trim() ? "Ask only for the preferred time window." : "Ask only for the preferred date.",
      }, true);
    }
    try {
      return toolResult(await postInternal(origin, "/api/assistant/appointments/manage", args));
    } catch (error) {
      return toolResult({ error: String((error as Error).message || error) }, true);
    }
  });

  server.registerTool("end_call", {
    description: "End the active caller leg only after the complete approved confirmation and warm farewell have been spoken in the caller's selected language. For a successful saved booking, bookingConfirmationCompleted must be true and may be set only after the full booking confirmation and farewell were spoken.",
    inputSchema: {
      farewellCompleted: z.literal(true),
      bookingConfirmationCompleted: z.literal(true).optional(),
    },
  }, async ({ bookingConfirmationCompleted }) => {
    const savedBooking = await isPhoneBookingFarewellPending(currentCallId) || await hasDurableBooking(origin, currentCallId);
    if (savedBooking && bookingConfirmationCompleted !== true) {
      return toolResult({
        error: "Ash's booking confirmation has not been observed yet.",
        instruction: "Say the complete successful-booking confirmation and warm farewell in the caller's selected language, then retry end_call with farewellCompleted true and bookingConfirmationCompleted true.",
      }, true);
    }
    const ended = await endCallerCall(conferenceName, directCallSid);
    if (ended && savedBooking) await clearPhoneBookingFarewellPending(currentCallId);
    return ended
      ? toolResult({ ok: true, detail: "Caller leg ended." })
      : toolResult({ error: "Unable to end the caller leg." }, true);
  });

  return server;
}

export async function POST(request: Request) {
  if (!authorized(request)) return new Response("Unauthorized", { status: 401 });
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  const requestUrl = new URL(request.url);
  const callerPhone = String(requestUrl.searchParams.get("caller") || "").trim();
  const currentCallId = String(requestUrl.searchParams.get("callId") || "").trim();
  const server = createServer(requestUrl.origin, requestUrl.searchParams.get("conference") || "", callerPhone, currentCallId, requestUrl.searchParams.get("callerCallSid") || "");
  await server.connect(transport);
  return transport.handleRequest(request);
}

export function GET() {
  return new Response("Method not allowed", { status: 405 });
}

export function DELETE() {
  return new Response("Method not allowed", { status: 405 });
}