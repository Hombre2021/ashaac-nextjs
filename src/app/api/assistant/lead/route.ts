import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { appendAssistantLead, listAssistantLeads, normalizePhoneForE164 as normalizeStorePhone, openOrReuseTextThread } from "@/lib/assistantStore";

const leadSchema = z.object({
  handoffMode: z.string().default("callback"),
  serviceType: z.string().min(2),
  urgency: z.string().min(2),
  bookingMode: z.string().default("callback-only"),
  preferredDate: z.string().default(""),
  preferredTimeWindow: z.string().default(""),
  firstName: z.string().min(2),
  address: z.string().default(""),
  phone: z.string().min(7),
  city: z.string().default(""),
  email: z.string().email().or(z.literal("")),
  contactMethod: z.string().default("phone"),
  homeType: z.string().default("owner"),
  notes: z.string().default(""),
  liveTechnicianPhone: z.string().default(""),
  assistantTranscript: z.string().default(""),
  aiBranch: z.string().default("assistant-v2"),
  captureSource: z.string().default("ai-chatbot"),
  utmSource: z.string().default(""),
  utmMedium: z.string().default(""),
  utmCampaign: z.string().default(""),
  idempotencyKey: z.string().max(200).default(""),
});

type LeadInput = z.infer<typeof leadSchema>;

function envFirst(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === "string" && value.trim().length > 0) {
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
  return value;
}

function normalizeCity(value: string) {
  const raw = String(value || "").trim().toLowerCase();
  const map: Record<string, string> = {
    "west jordan": "West Jordan",
    "south jordan": "South Jordan",
    riverton: "Riverton",
    midvale: "Midvale",
    sandy: "Sandy",
    draper: "Draper",
    "salt lake city": "Salt Lake City",
  };

  return map[raw] || String(value || "").trim();
}

function scoreLead(input: LeadInput): { score: number; priority: "P1" | "P2" | "P3" } {
  let score = 0;

  const cityPriority: Record<string, number> = {
    "West Jordan": 30,
    "South Jordan": 25,
    Riverton: 22,
    Midvale: 15,
  };

  score += cityPriority[input.city] || 8;

  if (input.urgency === "now") score += 30;
  else if (input.urgency === "week") score += 18;
  else score += 7;

  if (input.serviceType === "no-cooling" || input.serviceType === "no-heat") score += 30;
  else if (input.serviceType === "install") score += 20;
  else score += 12;

  if (input.homeType === "owner") score += 10;
  if (input.contactMethod === "phone") score += 5;
  if (input.utmSource) score += 3;

  return {
    score,
    priority: score >= 75 ? "P1" : score >= 55 ? "P2" : "P3",
  };
}

async function fetchJson(url: string, options: RequestInit) {
  const response = await fetch(url, options);
  const text = await response.text();
  const parsed = text
    ? (() => {
        try {
          return JSON.parse(text) as Record<string, unknown>;
        } catch {
          return null;
        }
      })()
    : null;

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${text || response.statusText}`);
  }

  return parsed;
}

async function pushToHvacPro(leadId: string, lead: LeadInput) {
  const endpoint = envFirst("HVAC_PRO_BOOKING_ENDPOINT", "MANAGER_BOOKING_URL");
  const apiKey = envFirst("HVAC_PRO_API_KEY", "MANAGER_API_KEY");
  const authHeader = envFirst("HVAC_PRO_AUTH_HEADER", "MANAGER_AUTH_HEADER") || "x-api-key";

  if (!endpoint || !apiKey) {
    return { success: false, detail: "HVAC Pro intake endpoint not configured" };
  }

  const payload = {
    bookingId: leadId,
    customerName: lead.firstName,
    customerPhone: lead.phone,
    customerEmail: lead.email,
    serviceAddress: [lead.address, lead.city].filter(Boolean).join(", "),
    serviceCity: lead.city,
    serviceZip: "",
    serviceType: lead.serviceType,
    city: lead.city,
    preferredDate: lead.preferredDate || "",
    preferredTimeWindow: lead.preferredTimeWindow || "",
    notes: [
      lead.notes || "",
      "Lead capture from AI chat bot",
      lead.bookingMode ? `Booking mode: ${lead.bookingMode}` : "",
      lead.handoffMode ? `Technician action: ${lead.handoffMode}` : "",
      lead.assistantTranscript ? `AI transcript:\n${lead.assistantTranscript}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    sourceSystem: "ashaac-nextjs-ai-assistant",
    sourcePage: "https://ashaac.com",
    attribution: {
      utm_source: lead.utmSource || "",
      utm_medium: lead.utmMedium || "",
      utm_campaign: lead.utmCampaign || "",
    },
  };

  try {
    const data = await fetchJson(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [authHeader]: apiKey,
      },
      body: JSON.stringify(payload),
    });

    const customerId = (data?.customerId as string) || "";
    return { success: true, detail: "Lead sent to HVAC Pro", customerId };
  } catch (error) {
    return { success: false, detail: String((error as Error)?.message || error) };
  }
}

async function createHvacProFollowup(leadId: string, lead: LeadInput, customerId: string) {
  const endpoint = envFirst("HVAC_PRO_FOLLOWUP_ENDPOINT");
  const apiKey = envFirst("HVAC_PRO_API_KEY", "MANAGER_API_KEY");
  const authHeader = envFirst("HVAC_PRO_AUTH_HEADER", "MANAGER_AUTH_HEADER") || "x-api-key";

  if (!endpoint || !apiKey || !customerId) {
    return { success: false, detail: "HVAC Pro follow-up endpoint not configured or missing customerId" };
  }

  try {
    await fetchJson(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [authHeader]: apiKey,
      },
      body: JSON.stringify({
        customerId,
        title: `AI chat follow-up: ${lead.serviceType}`,
        description: `Immediate AI chat follow-up for ${lead.firstName} in ${lead.city}.`,
        dueDate: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        priority: "high",
        leadId,
      }),
    });

    return { success: true, detail: "Follow-up task created" };
  } catch (error) {
    return { success: false, detail: String((error as Error)?.message || error) };
  }
}

async function sendTwilioSms(sid: string, token: string, from: string, to: string, body: string) {
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const params = new URLSearchParams({ From: from, To: to, Body: body });

  return fetchJson(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });
}

async function sendGraphNotificationEmail(to: string, subject: string, text: string) {
  const endpoint = envFirst("HVAC_PRO_EMAIL_ENDPOINT");
  const apiKey = envFirst("HVAC_PRO_API_KEY", "MANAGER_API_KEY");
  if (!endpoint || !apiKey || !to) return { success: false, detail: "Microsoft Graph email endpoint is not configured" };
  try {
    await fetchJson(endpoint, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        toEmail: to,
        subject,
        text,
      }),
    });
    return { success: true, detail: `Microsoft Graph email sent to ${to}` };
  } catch (error) {
    return { success: false, detail: String((error as Error)?.message || error) };
  }
}

async function dispatchRequestConfirmations(leadId: string, lead: LeadInput) {
  if (lead.handoffMode !== "callback") return { businessEmail: null, callerSms: null, callerEmail: null };
  const subject = lead.bookingMode === "owner-message"
    ? `Owner message ${leadId} from ${lead.firstName}`
    : `Callback request ${leadId} from ${lead.firstName}`;
  const details = [
    subject,
    `Caller phone: ${lead.phone}`,
    lead.email ? `Caller email: ${lead.email}` : "",
    lead.address ? `Service address: ${lead.address}` : "",
    lead.notes ? `Message: ${lead.notes}` : "",
  ].filter(Boolean).join("\n");
  const businessEmailTo = envFirst("BOOKING_NOTIFICATION_EMAIL_TO") || "ashaacutah@gmail.com";
  const businessEmail = await sendGraphNotificationEmail(businessEmailTo, subject, details);

  const sid = envFirst("TWILIO_ACCOUNT_SID");
  const token = envFirst("TWILIO_AUTH_TOKEN");
  const fromSms = envFirst("TWILIO_FROM_SMS", "TWILIO_FROM_NUMBER");
  const callerPhone = normalizePhoneForE164(lead.phone);
  let callerSms: { success: boolean; detail: string } = { success: false, detail: "Caller SMS is not configured" };
  if (sid && token && fromSms && callerPhone) {
    try {
      await sendTwilioSms(
        sid,
        token,
        fromSms,
        callerPhone,
        `All Solutions received your ${lead.bookingMode === "owner-message" ? "message" : "callback request"} ${leadId}. The owner or technician will get back to you at his earliest convenience.`,
      );
      callerSms = { success: true, detail: "Caller confirmation SMS sent" };
    } catch (error) {
      callerSms = { success: false, detail: String((error as Error)?.message || error) };
    }
  }

  const callerEmail = lead.email
    ? await sendGraphNotificationEmail(lead.email, `All Solutions confirmation ${leadId}`, `We received your request.\n\n${details}`)
    : null;
  return { businessEmail, callerSms, callerEmail };
}

async function placeTwilioCall(sid: string, token: string, from: string, to: string, message: string) {
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const twiml = `<Response><Say voice=\"alice\">${message}</Say></Response>`;
  const params = new URLSearchParams({ From: from, To: to, Twiml: twiml });

  return fetchJson(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });
}

async function dispatchLiveTechnician(leadId: string, lead: LeadInput) {
  const sid = envFirst("TWILIO_ACCOUNT_SID");
  const token = envFirst("TWILIO_AUTH_TOKEN");
  const fromSms = envFirst("TWILIO_FROM_SMS", "TWILIO_FROM_NUMBER");
  const fromCall = envFirst("TWILIO_FROM_CALL", "TWILIO_FROM_NUMBER");
  const smsTo = normalizePhoneForE164(lead.liveTechnicianPhone || envFirst("LIVE_TECHNICIAN_SMS_TO", "P1_DISPATCH_SMS_TO"));
  const callTo = normalizePhoneForE164(envFirst("LIVE_TECHNICIAN_CALL_TO", "P1_DISPATCH_CALL_TO"));

  if (!sid || !token || (!smsTo && !callTo)) {
    return { success: false, detail: "Twilio handoff not configured" };
  }

  try {
    if (smsTo && fromSms && lead.handoffMode === "sms-technician") {
      await sendTwilioSms(
        sid,
        token,
        fromSms,
        smsTo,
        `AI chat lead ${leadId}: ${lead.firstName} in ${lead.city}, ${lead.serviceType}, urgency ${lead.urgency}. Phone ${lead.phone}.`,
      );
    }

    if (smsTo && fromSms && lead.handoffMode === "callback") {
      await sendTwilioSms(
        sid,
        token,
        fromSms,
        smsTo,
        `Callback request ${leadId}: ${lead.firstName}. Customer phone ${lead.phone}. Customer message: ${lead.notes || "No message provided."}`,
      );
    }

    if (callTo && fromCall && lead.handoffMode === "live-transfer") {
      await placeTwilioCall(
        sid,
        token,
        fromCall,
        callTo,
        `Live technician handoff. Lead ${leadId}. ${lead.firstName} in ${lead.city}. Please call back ${lead.phone}.`,
      );
    }

    return { success: true, detail: "Live technician handoff dispatched" };
  } catch (error) {
    return { success: false, detail: String((error as Error)?.message || error) };
  }
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = leadSchema.safeParse(json || {});

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid lead payload" }, { status: 400 });
  }

  const lead = parsed.data;

  // Service/booking leads must include full location details.
  // Callback-only flow intentionally skips address/city collection.
  if (lead.handoffMode !== "callback") {
    if (!String(lead.address || "").trim() || String(lead.address || "").trim().length < 5) {
      return NextResponse.json({ error: "Service address is required." }, { status: 400 });
    }

    if (!String(lead.city || "").trim() || String(lead.city || "").trim().length < 2) {
      return NextResponse.json({ error: "City is required." }, { status: 400 });
    }
  }

  const leadNormalized: LeadInput = {
    ...lead,
    city: normalizeCity(lead.city || "West Jordan"),
  };
  const leadId = lead.idempotencyKey
    ? createHash("sha256").update(lead.idempotencyKey).digest("hex").slice(0, 8).toUpperCase()
    : crypto.randomUUID().slice(0, 8).toUpperCase();
  if (lead.idempotencyKey) {
    const existing = (await listAssistantLeads(5000)).find((entry) => entry.leadId === leadId);
    if (existing) {
      return NextResponse.json({
        ok: true,
        leadId,
        duplicate: true,
        detail: "Request already saved; duplicate delivery was suppressed.",
      });
    }
  }
  const scored = scoreLead(leadNormalized);

  const shouldSendToHvacPro = leadNormalized.handoffMode !== "callback";
  const hvacPro = shouldSendToHvacPro
    ? await pushToHvacPro(leadId, leadNormalized)
    : { success: false, detail: "Skipped HVAC Pro booking for callback-only handoff" };
  const hvacProTask = shouldSendToHvacPro
    ? await createHvacProFollowup(leadId, leadNormalized, (hvacPro as { customerId?: string }).customerId || "")
    : { success: false, detail: "Skipped HVAC Pro follow-up for callback-only handoff" };
  const liveTechnician = await dispatchLiveTechnician(leadId, leadNormalized);
  const confirmations = await dispatchRequestConfirmations(leadId, leadNormalized);

  // Persist assistant lead telemetry for dashboard metrics.
  await appendAssistantLead({
    leadId,
    priority: scored.priority,
    serviceType: leadNormalized.serviceType,
    urgency: leadNormalized.urgency,
    city: leadNormalized.city,
    phone: leadNormalized.phone,
    handoffMode: leadNormalized.handoffMode,
    bookingMode: leadNormalized.bookingMode,
    captureSource: leadNormalized.captureSource,
    aiBranch: leadNormalized.aiBranch,
  });

  // Open a persistent text thread when AI capture requested live text/transfer and we have customer + tech routing numbers.
  if (["sms-technician", "live-transfer"].includes(leadNormalized.handoffMode)) {
    const customerPhone = normalizeStorePhone(leadNormalized.phone);
    const technicianPhone = normalizeStorePhone(leadNormalized.liveTechnicianPhone || envFirst("LIVE_TECHNICIAN_SMS_TO", "P1_DISPATCH_SMS_TO"));

    if (customerPhone && technicianPhone) {
      await openOrReuseTextThread({
        leadId,
        customerPhone,
        technicianPhone,
      });
    }
  }

  return NextResponse.json({
    ok: true,
    leadId,
    priority: scored.priority,
    score: scored.score,
    handoff: {
      hvacPro,
      hvacProTask,
      liveTechnician,
      confirmations,
    },
    bookingActions: {
      bookingUrl: process.env.BOOKING_DESTINATION_URL || "https://ashaac.com/book",
      callUrl: "tel:+18017553040",
      textUrl:
        "sms:+18017553040?body=Hi%20All%20Solutions%20HVAC%2C%20I%20just%20submitted%20a%20request%20from%20the%20AI%20assistant.",
    },
  });
}
