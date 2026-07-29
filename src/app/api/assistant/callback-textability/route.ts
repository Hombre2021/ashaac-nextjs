import { NextResponse } from "next/server";
import { getTwilioConfig, sendTwilioSms } from "@/lib/twilio";

type CallbackTextabilityPayload = {
  leadId?: string;
  firstName?: string;
  phone?: string;
  canText?: boolean;
};

function envFirst(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

function normalizePhoneForE164(value: string) {
  const digits = String(value || "").replace(/\D+/g, "");
  if (!digits) return "";
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  return String(value || "").trim();
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as CallbackTextabilityPayload | null;

  const leadId = String(body?.leadId || "").trim();
  const firstName = String(body?.firstName || "Customer").trim() || "Customer";
  const customerPhone = normalizePhoneForE164(String(body?.phone || ""));
  const canText = Boolean(body?.canText);

  if (!customerPhone) {
    return NextResponse.json({ error: "phone is required" }, { status: 400 });
  }

  const technicianPhone = normalizePhoneForE164(envFirst("LIVE_TECHNICIAN_SMS_TO", "P1_DISPATCH_SMS_TO"));
  if (!technicianPhone) {
    return NextResponse.json({ error: "Technician routing number is not configured." }, { status: 400 });
  }

  const twilio = getTwilioConfig();
  if (!twilio.configured || !twilio.fromSms) {
    return NextResponse.json({ error: "Twilio SMS is not configured." }, { status: 400 });
  }

  const message = canText
    ? `Callback update${leadId ? ` ${leadId}` : ""}: ${firstName} can also be texted at ${customerPhone}.`
    : `Callback update${leadId ? ` ${leadId}` : ""}: ${firstName} can NOT receive texts at ${customerPhone}. Call only.`;

  try {
    await sendTwilioSms({
      sid: twilio.sid,
      token: twilio.token,
      from: twilio.fromSms,
      to: technicianPhone,
      body: message,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String((error as Error)?.message || "Unable to send update.") }, { status: 500 });
  }
}
