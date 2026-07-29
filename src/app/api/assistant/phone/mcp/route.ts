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

function toolResult(payload: unknown, isError = false) {
  return {
    isError,
    content: [{ type: "text" as const, text: JSON.stringify(payload) }],
  };
}

function createServer(origin: string) {
  const server = new McpServer({ name: "all-solutions-phone-tools", version: "1.0.0" });

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