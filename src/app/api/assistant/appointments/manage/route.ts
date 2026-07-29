import { NextResponse } from "next/server";
import { appendAssistantAction, normalizePhoneForE164 } from "@/lib/assistantStore";
import { listAppointmentHistory } from "@/lib/appointmentHistory";
import { getTwilioConfig, sendTwilioSms } from "@/lib/twilio";

type ActionType = "status" | "reschedule" | "cancel";

type Payload = {
  action: ActionType;
  requestId?: string;
  phone?: string;
  firstName?: string;
  address?: string;
  preferredDate?: string;
  preferredTimeWindow?: string;
  reason?: string;
};

function normalizeDigits(value: string) {
  return String(value || "").replace(/\D+/g, "");
}

function maskPhone(value: string) {
  const digits = normalizeDigits(value);
  if (digits.length < 4) return "";
  return `***-***-${digits.slice(-4)}`;
}

function normalizeText(value: string) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
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

async function sendUpdateToManager(payload: {
  action: ActionType;
  requestId: string;
  phone: string;
  preferredDate?: string;
  preferredTimeWindow?: string;
  reason?: string;
}) {
  const endpoint = envFirst("MANAGER_APPOINTMENT_UPDATE_URL", "HVAC_PRO_APPOINTMENT_UPDATE_ENDPOINT");
  const apiKey = envFirst("MANAGER_API_KEY", "HVAC_PRO_API_KEY");
  const authHeader = envFirst("MANAGER_AUTH_HEADER", "HVAC_PRO_AUTH_HEADER") || "x-api-key";

  if (!endpoint || !apiKey) {
    return { ok: false, detail: "Manager update endpoint is not configured." };
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      [authHeader]: apiKey,
    },
    body: JSON.stringify({
      ...payload,
      source: "assistant",
      submittedAt: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    return { ok: false, detail: `Manager update failed (${response.status}): ${text || response.statusText}` };
  }

  return { ok: true, detail: "Manager update accepted." };
}

async function notifyTechnician(message: string) {
  const technicianPhone = normalizePhoneForE164(envFirst("LIVE_TECHNICIAN_SMS_TO", "P1_DISPATCH_SMS_TO"));
  if (!technicianPhone) return;

  const twilio = getTwilioConfig();
  if (!twilio.configured || !twilio.fromSms) return;

  try {
    await sendTwilioSms({
      sid: twilio.sid,
      token: twilio.token,
      from: twilio.fromSms,
      to: technicianPhone,
      body: message,
    });
  } catch {
    // Do not fail appointment actions if technician notification fails.
  }
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Payload | null;

  const action = body?.action;
  if (!action || !["status", "reschedule", "cancel"].includes(action)) {
    return NextResponse.json({ error: "Valid action is required." }, { status: 400 });
  }

  const requestId = String(body?.requestId || "").trim().toUpperCase();
  const phone = normalizePhoneForE164(body?.phone || "");
  const nameOnAppointment = normalizeText(String(body?.firstName || ""));
  const serviceAddress = normalizeText(String(body?.address || ""));

  if (!requestId && !phone) {
    return NextResponse.json({ error: "requestId or phone is required." }, { status: 400 });
  }

  const history = await listAppointmentHistory(400);

  const found = history.find((entry) => {
    if (requestId && entry.requestId.toUpperCase() === requestId) {
      return true;
    }

    const phoneOk = phone ? normalizeDigits(entry.phone).endsWith(normalizeDigits(phone).slice(-10)) : true;
    const nameOk = nameOnAppointment ? normalizeText(entry.name).includes(nameOnAppointment) : true;
    const addressOk = serviceAddress ? normalizeText(entry.addressLine1).includes(serviceAddress) : true;

    return phoneOk && nameOk && addressOk;
  });

  if (!found) {
    await appendAssistantAction({
      action,
      ok: false,
      requestId,
      phone,
      detail: "Appointment record not found.",
    });

    return NextResponse.json({
      ok: false,
      detail: "I could not find an appointment with that information. Please verify phone or request ID.",
    });
  }

  if (action === "status") {
    const statusDetail = `Appointment ${found.requestId} is on ${found.preferredDate || "TBD"} (${found.preferredTimeWindow || "time pending"}) for ${found.serviceType}.`;

    await appendAssistantAction({
      action,
      ok: true,
      requestId: found.requestId,
      phone: found.phone,
      detail: statusDetail,
    });

    await notifyTechnician(
      `Status update: ${found.name} (${found.phone}) asked for appointment status on ${found.requestId}. Current appointment is ${found.preferredDate || "TBD"} ${found.preferredTimeWindow || ""}.`,
    );

    return NextResponse.json({
      ok: true,
      detail: statusDetail,
      appointment: {
        requestId: found.requestId,
        city: found.city,
        serviceType: found.serviceType,
        preferredDate: found.preferredDate,
        preferredTimeWindow: found.preferredTimeWindow,
        phoneMasked: maskPhone(found.phone),
      },
    });
  }

  if (action === "reschedule") {
    const preferredDate = String(body?.preferredDate || "").trim();
    const preferredTimeWindow = String(body?.preferredTimeWindow || "").trim();

    if (!preferredDate && !preferredTimeWindow) {
      return NextResponse.json({
        ok: false,
        detail: "Please provide preferredDate or preferredTimeWindow for reschedule.",
      });
    }

    const manager = await sendUpdateToManager({
      action,
      requestId: found.requestId,
      phone: found.phone,
      preferredDate,
      preferredTimeWindow,
      reason: String(body?.reason || "").trim(),
    });

    await appendAssistantAction({
      action,
      ok: manager.ok,
      requestId: found.requestId,
      phone: found.phone,
      detail: manager.detail,
    });

    if (manager.ok) {
      await notifyTechnician(
        `Reschedule update: ${found.name} (${found.phone}) moved appointment ${found.requestId} from ${found.preferredDate || "TBD"} ${found.preferredTimeWindow || ""} to ${preferredDate || "new date requested"}${preferredTimeWindow ? ` (${preferredTimeWindow})` : ""}.`,
      );
    }

    return NextResponse.json({
      ok: manager.ok,
      detail: manager.ok
        ? `Reschedule request received for ${found.requestId}. We will confirm ${preferredDate || "new date"} ${preferredTimeWindow || "new time window"}.`
        : manager.detail,
    });
  }

  const manager = await sendUpdateToManager({
    action,
    requestId: found.requestId,
    phone: found.phone,
    reason: String(body?.reason || "Customer requested cancellation").trim(),
  });

  await appendAssistantAction({
    action,
    ok: manager.ok,
    requestId: found.requestId,
    phone: found.phone,
    detail: manager.detail,
  });

  if (manager.ok) {
    await notifyTechnician(`Cancellation update: ${found.name} (${found.phone}) cancelled appointment ${found.requestId}.`);
  }

  return NextResponse.json({
    ok: manager.ok,
    detail: manager.ok
      ? `Cancellation request received for ${found.requestId}. A team member will confirm shortly.`
      : manager.detail,
  });
}
