import { timingSafeEqual } from "node:crypto";
import { after } from "next/server";
import { controlRealtimeCall, requestRealtimeContinuation } from "../route";

export const runtime = "nodejs";
export const maxDuration = 300;

function envValue(name: string) {
  return String(process.env[name] || "").trim();
}

function authorized(request: Request) {
  const expected = envValue("OPENAI_REALTIME_MCP_TOKEN");
  const supplied = String(request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!expected || !supplied) return false;
  const expectedBytes = Buffer.from(expected);
  const suppliedBytes = Buffer.from(supplied);
  return expectedBytes.length === suppliedBytes.length && timingSafeEqual(expectedBytes, suppliedBytes);
}

export async function POST(request: Request) {
  if (!authorized(request)) return new Response("Unauthorized", { status: 401 });
  const body = await request.json().catch(() => ({})) as { callId?: unknown; callerCallSid?: unknown };
  const callId = String(body.callId || "").trim();
  const callerCallSid = String(body.callerCallSid || "").trim();
  if (!/^rtc_[A-Za-z0-9_-]+$/.test(callId)) {
    return Response.json({ error: "Invalid call ID." }, { status: 400 });
  }
  if (callerCallSid && !/^CA[0-9a-f]{32}$/i.test(callerCallSid)) {
    return Response.json({ error: "Invalid caller call SID." }, { status: 400 });
  }

  const apiKey = envValue("OPENAI_API_KEY");
  const projectId = envValue("OPENAI_PROJECT_ID");
  const token = envValue("OPENAI_REALTIME_MCP_TOKEN");
  if (!apiKey || !projectId || !token) {
    return Response.json({ error: "Realtime control configuration is incomplete." }, { status: 503 });
  }

  const continuationUrl = new URL(request.url);
  after(async () => {
    try {
      const needsContinuation = await controlRealtimeCall(callId, apiKey, projectId, false, callerCallSid);
      if (needsContinuation) {
        await requestRealtimeContinuation(continuationUrl, token, callId, callerCallSid);
      }
    } catch (error) {
      console.error("OpenAI Realtime continuation failed", {
        callId,
        detail: String((error as Error).message || error),
      });
    }
  });

  return Response.json({ ok: true });
}