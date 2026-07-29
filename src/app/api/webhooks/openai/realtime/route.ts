import OpenAI from "openai";
import { buildRealtimeAcceptBody, readSipCallerPhone } from "@/lib/openAiRealtimePhone";

export const runtime = "nodejs";

function envValue(name: string) {
  return String(process.env[name] || "").trim();
}

export async function POST(request: Request) {
  const apiKey = envValue("OPENAI_API_KEY");
  const webhookSecret = envValue("OPENAI_WEBHOOK_SECRET");
  const mcpToken = envValue("OPENAI_REALTIME_MCP_TOKEN");
  if (!apiKey || !webhookSecret || !mcpToken) {
    return Response.json({ error: "OpenAI Realtime phone configuration is incomplete." }, { status: 503 });
  }

  const client = new OpenAI({ apiKey, webhookSecret });
  const rawBody = await request.text();
  let event;
  try {
    event = await client.webhooks.unwrap(rawBody, request.headers);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type !== "realtime.call.incoming") {
    return Response.json({ ok: true, ignored: event.type });
  }

  const callId = event.data.call_id;
  const callerPhone = readSipCallerPhone(event.data.sip_headers);
  const origin = new URL(request.url).origin;
  const acceptResponse = await fetch(`https://api.openai.com/v1/realtime/calls/${encodeURIComponent(callId)}/accept`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildRealtimeAcceptBody({
      callId,
      callerPhone,
      mcpUrl: `${origin}/api/assistant/phone/mcp`,
      mcpToken,
    })),
  });

  if (!acceptResponse.ok && acceptResponse.status !== 409) {
    const detail = await acceptResponse.text().catch(() => "");
    console.error("OpenAI Realtime call acceptance failed", { status: acceptResponse.status, detail: detail.slice(0, 300) });
    return Response.json({ error: "Unable to accept Realtime call." }, { status: 502 });
  }

  return Response.json({ ok: true });
}