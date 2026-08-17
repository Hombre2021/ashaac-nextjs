import { NextResponse } from "next/server";
import { timingSafeEqual as nodeTimingSafeEqual } from "node:crypto";
import { normalizePhoneForE164 } from "@/lib/assistantStore";
import { getTwilioConfig, sendTwilioSms } from "@/lib/twilio";

export const runtime = "nodejs";

type MessengerEvent = {
  sender?: { id?: string };
  message?: {
    is_echo?: boolean;
    text?: string;
    attachments?: Array<{ type?: string }>;
  };
};

type MessengerPayload = {
  object?: string;
  entry?: Array<{ messaging?: MessengerEvent[] }>;
};

function envFirst(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key];
    if (value?.trim()) return value.trim();
  }

  return "";
}

function timingSafeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && nodeTimingSafeEqual(leftBuffer, rightBuffer);
}

async function isValidMetaSignature(req: Request, rawBody: string) {
  const appSecret = envFirst("META_MESSENGER_APP_SECRET");
  const signature = req.headers.get("x-hub-signature-256") || "";
  if (!appSecret || !signature.startsWith("sha256=")) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(appSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const expected = `sha256=${Buffer.from(digest).toString("hex")}`;
  return timingSafeEqual(signature, expected);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const verifyToken = envFirst("META_MESSENGER_VERIFY_TOKEN");

  if (mode === "subscribe" && token && verifyToken && token === verifyToken && challenge) {
    return new NextResponse(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  if (!(await isValidMetaSignature(req, rawBody))) {
    return new NextResponse("Invalid signature", { status: 403 });
  }

  const payload = JSON.parse(rawBody) as MessengerPayload;
  if (payload.object !== "page") return NextResponse.json({ received: true });

  const dispatchPhone = normalizePhoneForE164(envFirst("LIVE_TECHNICIAN_SMS_TO", "P1_DISPATCH_SMS_TO"));
  const twilio = getTwilioConfig();
  if (!dispatchPhone || !twilio.configured || !twilio.fromSms) {
    return NextResponse.json({ received: true });
  }

  const messages = (payload.entry || [])
    .flatMap((entry) => entry.messaging || [])
    .filter((event) => event.message && !event.message.is_echo);

  await Promise.all(messages.map(async (event) => {
    const text = String(event.message?.text || "").trim();
    const attachmentTypes = (event.message?.attachments || []).map((attachment) => attachment.type).filter(Boolean).join(", ");
    const content = text || (attachmentTypes ? `[Attachment: ${attachmentTypes}]` : "[Message received]");
    const senderId = String(event.sender?.id || "unknown");
    const alert = (`Facebook Page message from ${senderId}:\n${content}`).slice(0, 1500);

    await sendTwilioSms({
      sid: twilio.sid,
      token: twilio.token,
      from: twilio.fromSms,
      to: dispatchPhone,
      body: alert,
    });
  }));

  return NextResponse.json({ received: true });
}