import OpenAI from "openai";
import { after } from "next/server";
import WebSocket from "ws";
import { buildRealtimeAcceptBody, OPENAI_REALTIME_PHONE_GREETING, readSipCallerPhone, readSipHeader } from "@/lib/openAiRealtimePhone";

export const runtime = "nodejs";
export const maxDuration = 300;

function envValue(name: string) {
  return String(process.env[name] || "").trim();
}

async function controlRealtimeCall(callId: string, apiKey: string, projectId: string) {
  await new Promise<void>((resolve, reject) => {
    const socket = new WebSocket(`wss://api.openai.com/v1/realtime?call_id=${encodeURIComponent(callId)}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "OpenAI-Project": projectId,
      },
    });
    let responseGeneration = 0;
    let followUpTimer: ReturnType<typeof setTimeout> | null = null;
    const timeout = setTimeout(() => {
      socket.close();
      resolve();
    }, 285000);
    const finish = (error?: Error) => {
      clearTimeout(timeout);
      if (followUpTimer) clearTimeout(followUpTimer);
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
        const event = JSON.parse(data.toString()) as {
          type?: string;
          error?: { message?: string };
          response?: { output?: Array<{ type?: string }> };
        };
        if (event.type === "response.created") {
          responseGeneration += 1;
          if (followUpTimer) {
            clearTimeout(followUpTimer);
            followUpTimer = null;
          }
        }
        const completedToolOutput = event.type === "response.done"
          && event.response?.output?.some((item) => item.type === "mcp_call" || item.type === "function_call");
        const completedMcpEvent = Boolean(event.type?.includes("mcp") && event.type.endsWith(".completed"));
        if (completedToolOutput || completedMcpEvent) {
          const generationAtCompletion = responseGeneration;
          if (followUpTimer) clearTimeout(followUpTimer);
          followUpTimer = setTimeout(() => {
            followUpTimer = null;
            if (responseGeneration !== generationAtCompletion || socket.readyState !== WebSocket.OPEN) return;
            socket.send(JSON.stringify({
              type: "response.create",
              response: {
                output_modalities: ["audio"],
                instructions: "The business tool has finished. Immediately tell the caller the result. If an appointment or request was saved, clearly confirm it and summarize the date and time when available. If availability was checked, offer the recommended opening. If the tool failed, explain the fallback. Do not wait for the caller to speak first.",
              },
            }));
            console.info("OpenAI Realtime forced post-tool response", { callId, eventType: event.type });
          }, 350);
        }
        if (event.type === "error") finish(new Error(event.error?.message || "Realtime greeting failed."));
      } catch {
        // Ignore unrelated control frames.
      }
    });
    socket.once("error", (error) => finish(error));
    socket.once("close", () => finish());
  });
}

export async function POST(request: Request) {
  const apiKey = envValue("OPENAI_API_KEY");
  const projectId = envValue("OPENAI_PROJECT_ID");
  const webhookSecret = envValue("OPENAI_WEBHOOK_SECRET");
  const mcpToken = envValue("OPENAI_REALTIME_MCP_TOKEN");
  if (!apiKey || !projectId || !webhookSecret) {
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
  const conferenceName = readSipHeader(event.data.sip_headers, "x-all-solutions-conference");
  console.info("OpenAI Realtime SIP metadata", {
    callId,
    conferenceRecognized: /^ash-CA[0-9a-f]{32}$/i.test(conferenceName),
  });
  const origin = new URL(request.url).origin;
  const mcpUrl = new URL("/api/assistant/phone/mcp", origin);
  if (/^ash-CA[0-9a-f]{32}$/i.test(conferenceName)) {
    mcpUrl.searchParams.set("conference", conferenceName);
  }
  const acceptResponse = await fetch(`https://api.openai.com/v1/realtime/calls/${encodeURIComponent(callId)}/accept`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "OpenAI-Project": projectId,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildRealtimeAcceptBody({
      callId,
      callerPhone,
      mcpUrl: mcpUrl.toString(),
      mcpToken,
    })),
  });
  const acceptDetail = await acceptResponse.text().catch(() => "");
  console.info("OpenAI Realtime accept result", {
    callId,
    status: acceptResponse.status,
    detail: acceptDetail.slice(0, 300),
    voice: envValue("OPENAI_REALTIME_VOICE") || "ash",
  });

  if (!acceptResponse.ok) {
    console.error("OpenAI Realtime call acceptance failed", { status: acceptResponse.status, detail: acceptDetail.slice(0, 300) });
    return Response.json({ error: "Unable to accept Realtime call." }, { status: 502 });
  }

  after(async () => {
    try {
      await controlRealtimeCall(callId, apiKey, projectId);
      console.info("OpenAI Realtime call control ended", { callId, voice: envValue("OPENAI_REALTIME_VOICE") || "ash" });
    } catch (error) {
      console.error("OpenAI Realtime call control failed", { callId, detail: String((error as Error).message || error) });
    }
  });

  return Response.json({ ok: true });
}