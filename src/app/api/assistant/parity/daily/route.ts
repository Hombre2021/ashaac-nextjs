import { NextResponse } from "next/server";
import { appendAssistantParity, listAssistantParity } from "@/lib/assistantStore";

export const dynamic = "force-dynamic";

function toBool(value: unknown) {
  if (typeof value === "boolean") return value;
  const raw = String(value || "").trim().toLowerCase();
  return ["1", "true", "yes", "y", "pass", "ok"].includes(raw);
}

function dayKeyNow() {
  return new Date().toISOString().slice(0, 10);
}

function computeOverall(input: {
  normalQuestionPass: boolean;
  pressZeroPass: boolean;
  emergencyTransferPass: boolean;
  smsNumber1Pass: boolean;
  smsNumber2Pass: boolean;
}) {
  return input.normalQuestionPass
    && input.pressZeroPass
    && input.emergencyTransferPass
    && input.smsNumber1Pass
    && input.smsNumber2Pass;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  const payload = {
    dayKey: String(body?.dayKey || dayKeyNow()).trim() || dayKeyNow(),
    callerLabel: String(body?.callerLabel || "daily-parity").trim() || "daily-parity",
    normalQuestionPass: toBool(body?.normalQuestionPass),
    pressZeroPass: toBool(body?.pressZeroPass),
    emergencyTransferPass: toBool(body?.emergencyTransferPass),
    smsNumber1Pass: toBool(body?.smsNumber1Pass),
    smsNumber2Pass: toBool(body?.smsNumber2Pass),
    notes: String(body?.notes || "").trim(),
  };

  const overallPass = computeOverall(payload);

  await appendAssistantParity({
    ...payload,
    overallPass,
  });

  return NextResponse.json({
    ok: true,
    saved: {
      ...payload,
      overallPass,
    },
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const day = String(url.searchParams.get("day") || "").trim();
  const limitRaw = Number.parseInt(String(url.searchParams.get("limit") || "30"), 10);
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(365, limitRaw)) : 30;

  const records = await listAssistantParity(limit);
  const filtered = day ? records.filter((item) => item.dayKey === day) : records;

  const last7 = records.slice(0, 7);
  const passCount = last7.filter((item) => item.overallPass).length;
  const passRateLast7 = last7.length > 0 ? Number(((passCount / last7.length) * 100).toFixed(1)) : 0;

  return NextResponse.json({
    ok: true,
    count: filtered.length,
    passRateLast7,
    records: filtered,
  });
}
