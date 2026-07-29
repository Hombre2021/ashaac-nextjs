import { timingSafeEqual } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";

export const runtime = "nodejs";

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

function toolResult(payload: unknown, isError = false) {
  return {
    isError,
    content: [{ type: "text" as const, text: JSON.stringify(payload) }],
  };
}

function createServer(origin: string) {
  const server = new McpServer({ name: "all-solutions-phone-tools", version: "1.0.0" });

  server.registerTool("check_availability", {
    description: "Get real Monday-through-Saturday website booking availability. Always call this before offering an appointment date or time.",
    inputSchema: {
      requestedDate: z.string().optional().describe("Requested date in YYYY-MM-DD when known."),
      requestedPeriod: z.enum(["morning", "afternoon", "evening", "any"]).optional(),
    },
  }, async ({ requestedDate, requestedPeriod }) => {
    try {
      const availability = await getInternal(origin, "/api/book/availability") as { slots?: Array<{ date?: string; windows?: string[] }> };
      const slots = Array.isArray(availability.slots) ? availability.slots : [];
      return toolResult({
        ok: true,
        requestedDate: requestedDate || "",
        requestedPeriod: requestedPeriod || "any",
        slots: requestedDate ? slots.filter((slot) => slot.date === requestedDate) : slots,
      });
    } catch (error) {
      return toolResult({ error: String((error as Error).message || error) }, true);
    }
  });

  server.registerTool("create_booking", {
    description: "Create a confirmed appointment through the website booking endpoint. Call only after checking availability and confirming date, time, phone, and address.",
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
      notes: z.string().default("Repair diagnostic requested by phone"),
    },
  }, async (args) => {
    try {
      return toolResult(await postInternal(origin, "/api/book", {
        ...args,
        serviceType: "Repair diagnostic",
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
    description: "Transfer the active SIP call to the owner when the caller asks for a person, Mauricio, or Leandro.",
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
  const server = createServer(new URL(request.url).origin);
  await server.connect(transport);
  return transport.handleRequest(request);
}

export function GET() {
  return new Response("Method not allowed", { status: 405 });
}

export function DELETE() {
  return new Response("Method not allowed", { status: 405 });
}