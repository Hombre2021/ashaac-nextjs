import { timingSafeEqual } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

function authorized(request: Request) {
  const expected = String(process.env.OPENAI_REALTIME_MCP_TOKEN || "").trim();
  const supplied = String(request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!expected || !supplied) return false;
  const expectedBytes = Buffer.from(expected);
  const suppliedBytes = Buffer.from(supplied);
  return expectedBytes.length === suppliedBytes.length && timingSafeEqual(expectedBytes, suppliedBytes);
}

async function postInternal(origin: string, path: string, body: Record<string, unknown>) {
  const response = await fetch(`${origin}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(12000),
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

function twilioCredentials() {
  return {
    sid: String(process.env.TWILIO_ACCOUNT_SID || "").trim(),
    token: String(process.env.TWILIO_AUTH_TOKEN || "").trim(),
    from: String(process.env.TWILIO_FROM_CALL || process.env.TWILIO_FROM_NUMBER || "").trim(),
  };
}

async function twilioParticipantRequest(conferenceName: string, participant: string, method: "GET" | "POST" | "DELETE", body?: URLSearchParams) {
  const twilio = twilioCredentials();
  if (!twilio.sid || !twilio.token) return null;
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilio.sid}/Conferences/${encodeURIComponent(conferenceName)}/Participants/${encodeURIComponent(participant)}.json`, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${twilio.sid}:${twilio.token}`).toString("base64")}`,
      ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: body?.toString(),
  });
  if (method === "DELETE") return { ok: response.ok, status: response.status };
  const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
  return { ok: response.ok, status: response.status, payload };
}

async function waitForConferenceTechnician(conferenceName: string, ownerPhone: string): Promise<"connected" | "pending" | "failed"> {
  if (!/^ash-CA[0-9a-f]{32}$/i.test(conferenceName)) return "failed";
  const twilio = twilioCredentials();
  if (!twilio.sid || !twilio.token || !twilio.from) return "failed";

  let participant = await twilioParticipantRequest(conferenceName, "technician", "GET");
  if (!participant?.ok) {
    const createResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilio.sid}/Conferences/${encodeURIComponent(conferenceName)}/Participants.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${twilio.sid}:${twilio.token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: twilio.from,
        To: ownerPhone,
        Label: "technician",
        Beep: "false",
        EarlyMedia: "false",
        StartConferenceOnEnter: "true",
        EndConferenceOnExit: "false",
        Timeout: "60",
      }).toString(),
    });
    if (!createResponse.ok) return "failed";
  } else if (participant.payload?.status === "connected") {
    return "connected";
  }

  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    participant = await twilioParticipantRequest(conferenceName, "technician", "GET");
    if (participant?.ok && participant.payload?.status === "connected") return "connected";
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  participant = await twilioParticipantRequest(conferenceName, "technician", "GET");
  return participant?.ok ? "pending" : "failed";
}

async function setCallerHold(origin: string, conferenceName: string, hold: boolean) {
  if (!/^ash-CA[0-9a-f]{32}$/i.test(conferenceName)) return false;
  const { sid, token } = twilioCredentials();
  if (!sid || !token) return false;

  const body = new URLSearchParams({ Hold: String(hold) });
  if (hold) {
    body.set("HoldUrl", `${origin}/api/assistant/phone/typing`);
    body.set("HoldMethod", "GET");
  }

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Conferences/${encodeURIComponent(conferenceName)}/Participants/caller.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
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

function createServer(origin: string, conferenceName: string) {
  const server = new McpServer({ name: "all-solutions-phone-tools", version: "1.0.0" });

  server.registerTool("check_availability", {
    description: "Get real Monday-through-Saturday website booking availability. Always call this before offering an appointment date or time.",
    inputSchema: {
      requestedDate: z.string().optional().describe("Requested date in YYYY-MM-DD when known."),
      requestedPeriod: z.enum(["morning", "afternoon", "evening", "any"]).optional(),
    },
  }, async ({ requestedDate, requestedPeriod }) => {
    const callerOnHold = await setCallerHold(origin, conferenceName, true);
    try {
      const availability = await getInternal(origin, "/api/book/availability") as { slots?: Array<{ date?: string; windows?: string[] }> };
      const slots = Array.isArray(availability.slots) ? availability.slots : [];
        const period = requestedPeriod || "any";
        const matching = slots
          .filter((slot) => !requestedDate || slot.date === requestedDate)
          .flatMap((slot) => (slot.windows || [])
            .filter((window) => windowMatchesPeriod(window, period))
            .map((window) => ({ date: slot.date || "", window })))
          .slice(0, 3);
      return toolResult({
        ok: true,
        requestedDate: requestedDate || "",
            requestedPeriod: period,
            recommended: matching[0] || null,
            alternatives: matching.slice(1),
            instruction: matching.length > 0
              ? "Immediately offer the recommended date and window to the caller. Do not stay silent."
              : "Tell the caller no matching time was found and ask for another date or time period.",
      });
    } catch (error) {
      return toolResult({ error: String((error as Error).message || error) }, true);
    } finally {
      if (callerOnHold) {
        await setCallerHold(origin, conferenceName, false);
      }
    }
  });

  server.registerTool("create_booking", {
    description: "Create a confirmed appointment through the website booking endpoint. Call only after checking availability and confirming date, time, phone, address, and the caller's own description of the reason for the visit.",
    inputSchema: {
      preferredDate: z.string().min(10),
      preferredTimeWindow: z.string().min(5),
      city: z.string().min(2),
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      phone: z.string().min(10),
      email: z.string().email(),
      addressLine1: z.string().min(5),
      addressCity: z.string().min(2),
      addressZip: z.string().min(5),
      visitReason: z.string().min(5).max(1200).describe("The caller's reason for the technician visit, preserved in the caller's own words."),
      visitReasonConfirmed: z.literal(true).describe("True only after repeating the visit reason to the caller and receiving explicit confirmation."),
    },
  }, async (args) => {
    try {
      return toolResult(await postInternal(origin, "/api/book", {
        ...args,
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
      }));
    } catch (error) {
      return toolResult({ error: String((error as Error).message || error) }, true);
    }
  });

  server.registerTool("submit_service_request", {
    description: "Submit a service or callback request only after the caller confirms the phone number and address.",
    inputSchema: {
      firstName: z.string().min(2),
      phone: z.string().min(10),
      address: z.string().min(3),
      city: z.string().min(2),
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
        firstName: args.firstName,
        address: args.address,
        phone: args.phone,
        city: args.city,
        email: "",
        contactMethod: "phone",
        homeType: "owner",
        serviceType: args.serviceType,
        urgency: args.urgency,
        notes: args.notes,
        assistantTranscript: "OpenAI Realtime SIP call",
        aiBranch: "openai-realtime-sip",
        captureSource: "ai-phone-realtime",
      });
      return toolResult(payload);
    } catch (error) {
      return toolResult({ error: String((error as Error).message || error) }, true);
    }
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
    try {
      return toolResult(await postInternal(origin, "/api/assistant/appointments/manage", args));
    } catch (error) {
      return toolResult({ error: String((error as Error).message || error) }, true);
    }
  });

  server.registerTool("transfer_to_owner", {
    description: "Transfer the active SIP call to the owner when the caller asks for a person, Mauricio, or Leandro. If the result is pending, say the exact required patience message and immediately call this same tool again with the same arguments; the existing technician call will continue without redialing.",
    inputSchema: {
      callId: z.string().startsWith("rtc_"),
      reason: z.string().min(2),
    },
  }, async ({ callId }) => {
    const apiKey = String(process.env.OPENAI_API_KEY || "").trim();
    const ownerPhone = String(process.env.LIVE_TECHNICIAN_CALL_TO || process.env.LIVE_TECHNICIAN_SMS_TO || "").replace(/[^+\d]/g, "");
    if (!apiKey || !/^\+\d{10,15}$/.test(ownerPhone)) {
      return toolResult({ error: "Owner transfer is not configured." }, true);
    }
    if (/^ash-CA[0-9a-f]{32}$/i.test(conferenceName)) {
      const callerOnHold = await setCallerHold(origin, conferenceName, true);
      try {
        const connection = await waitForConferenceTechnician(conferenceName, ownerPhone);
        if (connection === "failed") {
          await twilioParticipantRequest(conferenceName, "technician", "DELETE");
          return toolResult({ error: "The technician did not connect. Offer a callback or voicemail." }, true);
        }
        if (connection === "pending") {
          return toolResult({
            ok: true,
            pending: true,
            sayExactly: "Thank you for your patience, I am still trying to connect to a live technician.",
            instruction: "Say the sayExactly text verbatim, then immediately call transfer_to_owner again with the same callId and reason. Do not ask the caller another question.",
          });
        }
        await twilioParticipantRequest(conferenceName, "ash", "DELETE");
        return toolResult({ ok: true, detail: "The technician is connected." });
      } finally {
        if (callerOnHold) await setCallerHold(origin, conferenceName, false);
      }
    }
    const response = await fetch(`https://api.openai.com/v1/realtime/calls/${encodeURIComponent(callId)}/refer`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ target_uri: `tel:${ownerPhone}` }),
    });
    return response.ok
      ? toolResult({ ok: true, detail: "Transferring the caller to the owner." })
      : toolResult({ error: "The transfer could not be started." }, true);
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
  const server = createServer(requestUrl.origin, requestUrl.searchParams.get("conference") || "");
  await server.connect(transport);
  return transport.handleRequest(request);
}

export function GET() {
  return new Response("Method not allowed", { status: 405 });
}

export function DELETE() {
  return new Response("Method not allowed", { status: 405 });
}