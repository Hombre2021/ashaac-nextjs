import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { appendThreadMessage, normalizePhoneForE164, openOrReuseTextThread } from "@/lib/assistantStore";
import { getTwilioConfig, sendTwilioSms } from "@/lib/twilio";

type OpenThreadPayload = {
  customerPhone: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  serviceType?: string;
  urgency?: string;
  leadId?: string;
  initialMessage?: string;
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

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as OpenThreadPayload | null;
  const customerPhoneRaw = String(body?.customerPhone || "").trim();
  const customerPhone = normalizePhoneForE164(body?.customerPhone || "");

  if (!customerPhone) {
    return NextResponse.json({ error: "customerPhone is required." }, { status: 400 });
  }

  const firstName = String(body?.firstName || "Customer").trim() || "Customer";
  const lastName = String(body?.lastName || "").trim();
  const technicianPhone = normalizePhoneForE164(envFirst("LIVE_TECHNICIAN_SMS_TO", "P1_DISPATCH_SMS_TO"));
  const initialMessage = String(body?.initialMessage || "").trim();
  const customerPhoneDisplay = customerPhoneRaw || customerPhone;

  if (!technicianPhone) {
    return NextResponse.json({ error: "Technician routing number is not configured." }, { status: 400 });
  }

  const opened = await openOrReuseTextThread({
    leadId: String(body?.leadId || randomUUID()).trim(),
    customerPhone,
    technicianPhone,
  });

  if (!opened.ok) {
    return NextResponse.json({ error: opened.detail }, { status: 400 });
  }

  const thread = opened.thread;
  if (!thread) {
    return NextResponse.json({ error: "Thread could not be created." }, { status: 500 });
  }

  if (initialMessage) {
    await appendThreadMessage({
      code: thread.code,
      from: "customer",
      body: initialMessage,
    });

    await appendThreadMessage({
      code: thread.code,
      from: "customer",
      body: "Best phone number for technician to text with you in case we get disconnected?",
    });

    await appendThreadMessage({
      code: thread.code,
      from: "customer",
      body: customerPhoneDisplay,
    });
  }

  const twilio = getTwilioConfig();

  if (twilio.configured && twilio.fromSms) {
    const customerLabel = `${firstName} ${lastName}`.trim();

    if (thread.customerPhone === thread.technicianPhone) {
      await sendTwilioSms({
        sid: twilio.sid,
        token: twilio.token,
        from: twilio.fromSms,
        to: thread.customerPhone,
        body: `Live text thread #${thread.code} opened. Reply Y to connect live text thread or N to decline.`,
      });
    } else {
      await sendTwilioSms({
        sid: twilio.sid,
        token: twilio.token,
        from: twilio.fromSms,
        to: thread.technicianPhone,
        body: `Leandro/Mauricio live handoff. Customer number: ${thread.customerPhone}. Copy and paste this message to the customer: Hi ${customerLabel}, this is Leandro (Mauricio) with All Solutions HVAC, you mentioned that: ${initialMessage || "your AC is not working properly"} Would you like me to come over right now and check what's going on with your system?`,
      });

      await sendTwilioSms({
        sid: twilio.sid,
        token: twilio.token,
        from: twilio.fromSms,
        to: thread.customerPhone,
        body: `We received your request. A technician is reviewing it now and will connect with you shortly.`,
      });
    }
  }

  return NextResponse.json({
    ok: true,
    thread: {
      id: thread.id,
      code: thread.code,
      leadId: thread.leadId,
      customerPhone: thread.customerPhone,
      technicianPhone: thread.technicianPhone,
      status: thread.status,
      openedAt: thread.openedAt,
      lastMessageAt: thread.lastMessageAt,
      reused: opened.reused,
    },
  });
}
