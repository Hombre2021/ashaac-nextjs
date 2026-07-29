import OpenAI from "openai";
import { after } from "next/server";
import WebSocket from "ws";
import { buildRealtimeAcceptBody, OPENAI_REALTIME_PHONE_GREETING, readSipCallerPhone } from "@/lib/openAiRealtimePhone";

export const runtime = "nodejs";

function envValue(name: string) {
  return String(process.env[name] || "").trim();
}

async function triggerOpeningGreeting(callId: string, apiKey: string) {
  await new Promise<void>((resolve, reject) => {
    const socket = new WebSocket(`wss://api.openai.com/v1/realtime?call_id=${encodeURIComponent(callId)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const timeout = setTimeout(() => {
      socket.close();
      reject(new Error("Timed out while starting the Realtime greeting."));
    }, 12000);
    const finish = (error?: Error) => {
      clearTimeout(timeout);
      socket.close();
      if (error) {
        reject(error);
        return;
      }
      resolve();
    };

    socket.once("open", () => {
      socket.send(JSON.stringify({
        type: "response.create",
        response: {
          output_modalities: ["audio"],
          instructions: `Say exactly this introduction, with a warm professional tone, and then listen for the caller's answer: ${OPENAI_REALTIME_PHONE_GREETING}`,
        },
      }));
    });
    socket.on("message", (data) => {
      try {
        const event = JSON.parse(data.toString()) as { type?: string; error?: { message?: string } };
        if (event.type === "response.created") finish();
        if (event.type === "error") finish(new Error(event.error?.message || "Realtime greeting failed."));
      } catch {
        // Ignore unrelated control frames.
      }
    });
    socket.once("error", (error) => finish(error));
  });
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

  after(async () => {
    try {
      await triggerOpeningGreeting(callId, apiKey);
      console.info("OpenAI Realtime greeting started", { callId, voice: envValue("OPENAI_REALTIME_VOICE") || "ash" });
    } catch (error) {
      console.error("OpenAI Realtime greeting failed", { callId, detail: String((error as Error).message || error) });
    }
  });

  return Response.json({ ok: true });
}