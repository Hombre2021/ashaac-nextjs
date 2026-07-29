import { NextResponse } from "next/server";
import {
  appendThreadMessage,
  findTextThreadByCode,
  findTextThreadByCustomerPhone,
  findLatestActiveThreadByTechnicianPhone,
  findLatestPendingThreadByTechnicianPhone,
  normalizePhoneForE164,
  setTextThreadStatus,
} from "@/lib/assistantStore";
import { getTwilioConfig, sendTwilioSms } from "@/lib/twilio";

function xmlOk() {
  return new NextResponse("<Response></Response>", {
    status: 200,
    headers: {
      "Content-Type": "text/xml",
    },
  });
}

function parseThreadCodeAndBody(text: string) {
  const match = text.match(/^#?([A-Za-z0-9]{4,8})\b[:\-\s]*(.*)$/);
  if (!match) {
    return { code: "", body: text.trim() };
  }

  return {
    code: String(match[1] || "").toUpperCase(),
    body: String(match[2] || "").trim(),
  };
}

function parseConnectDecision(value: string) {
  const normalized = String(value || "").trim().toLowerCase();
  if (/^(y|yes|connect|accept)\b/.test(normalized)) return "yes" as const;
  if (/^(n|no|decline|busy)\b/.test(normalized)) return "no" as const;
  return "none" as const;
}

function envFirst(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

function buildQueuedCustomerSummary(thread: Awaited<ReturnType<typeof findTextThreadByCode>>) {
  if (!thread) return "";

  const queued = thread.messages
    .filter((message) => message.from === "customer")
    .map((message) => message.body.trim())
    .filter(Boolean)
    .slice(-3);

  if (queued.length === 0) return "";
  return queued.join("\n");
}

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") || "";

  let fromRaw = "";
  let bodyRaw = "";

  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    fromRaw = String(form.get("From") || "");
    bodyRaw = String(form.get("Body") || "");
  } else {
    const body = (await req.json().catch(() => null)) as { From?: string; Body?: string } | null;
    fromRaw = String(body?.From || "");
    bodyRaw = String(body?.Body || "");
  }

  const from = normalizePhoneForE164(fromRaw);
  const text = String(bodyRaw || "").trim();

  if (!from || !text) {
    return xmlOk();
  }

  const twilio = getTwilioConfig();
  if (!twilio.configured || !twilio.fromSms) {
    return xmlOk();
  }

  const technicianPhone = normalizePhoneForE164(envFirst("LIVE_TECHNICIAN_SMS_TO", "P1_DISPATCH_SMS_TO"));

  try {
    if (technicianPhone && from === technicianPhone) {
      const parsed = parseThreadCodeAndBody(text);
      const decision = parseConnectDecision(parsed.body || text);
      let thread = parsed.code ? await findTextThreadByCode(parsed.code) : null;

      if (!thread) {
        if (decision !== "none") {
          thread = await findLatestPendingThreadByTechnicianPhone(from);
        }
      }

      if (!thread) {
        thread = await findLatestActiveThreadByTechnicianPhone(from);
      }

      if (decision === "yes" && thread) {
        const queuedSummary = buildQueuedCustomerSummary(thread);
        await setTextThreadStatus({ code: thread.code, status: "active" });
        await sendTwilioSms({
          sid: twilio.sid,
          token: twilio.token,
          from: twilio.fromSms,
          to: thread.customerPhone,
          body: "You are now connected to a live technician by text. Please continue here.",
        });
        await sendTwilioSms({
          sid: twilio.sid,
          token: twilio.token,
          from: twilio.fromSms,
          to: technicianPhone,
          body: `Connected. You can now text this customer directly in thread #${thread.code} without typing the code each time.`,
        });

        if (queuedSummary) {
          await sendTwilioSms({
            sid: twilio.sid,
            token: twilio.token,
            from: twilio.fromSms,
            to: technicianPhone,
            body: `Latest thread details:\n${queuedSummary}`,
          });
        }

        await appendThreadMessage({ code: thread.code, from: "technician", body: "Technician accepted connection." });
        return xmlOk();
      }

      if (decision === "no" && thread) {
        await setTextThreadStatus({ code: thread.code, status: "closed" });
        await sendTwilioSms({
          sid: twilio.sid,
          token: twilio.token,
          from: twilio.fromSms,
          to: thread.customerPhone,
          body: "Thanks for your message. Our technicians are currently busy, and we will follow up with you shortly.",
        });
        await appendThreadMessage({ code: thread.code, from: "technician", body: "Technician declined connection (busy)." });
        return xmlOk();
      }

      if (!thread || !parsed.body) {
        await sendTwilioSms({
          sid: twilio.sid,
          token: twilio.token,
          from: twilio.fromSms,
          to: technicianPhone,
          body: "No active connected thread found. Reply Y to connect the latest pending thread, or #THREADCODE your message.",
        });
        return xmlOk();
      }

      if (thread.status !== "active") {
        await sendTwilioSms({
          sid: twilio.sid,
          token: twilio.token,
          from: twilio.fromSms,
          to: technicianPhone,
          body: "This thread is not connected yet. Reply Y to connect or N to decline.",
        });
        return xmlOk();
      }

      await sendTwilioSms({
        sid: twilio.sid,
        token: twilio.token,
        from: twilio.fromSms,
        to: thread.customerPhone,
        body: `Technician: ${parsed.body}`,
      });

      await appendThreadMessage({ code: thread.code, from: "technician", body: parsed.body });
      return xmlOk();
    }

    const customerThread = await findTextThreadByCustomerPhone(from);
    if (!customerThread) {
      return xmlOk();
    }

    if (customerThread.status !== "active") {
      await sendTwilioSms({
        sid: twilio.sid,
        token: twilio.token,
        from: twilio.fromSms,
        to: customerThread.customerPhone,
        body: "Your message is queued while we connect a technician. We will text you shortly.",
      });
      await appendThreadMessage({ code: customerThread.code, from: "customer", body: text });
      return xmlOk();
    }

    await sendTwilioSms({
      sid: twilio.sid,
      token: twilio.token,
      from: twilio.fromSms,
      to: customerThread.technicianPhone,
      body: `Customer: ${text}`,
    });

    await appendThreadMessage({ code: customerThread.code, from: "customer", body: text });
    return xmlOk();
  } catch {
    return xmlOk();
  }
}
