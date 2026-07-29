import { NextResponse } from "next/server";
import { listAssistantParity } from "@/lib/assistantStore";

export const dynamic = "force-dynamic";

function dayKeyUtc(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseWindowDays(input: string | null) {
  const parsed = Number.parseInt(String(input || "7"), 10);
  if (!Number.isFinite(parsed)) return 7;
  return Math.max(3, Math.min(30, parsed));
}

function buildRecentDayKeys(days: number) {
  const keys: string[] = [];
  const now = new Date();
  for (let i = 0; i < days; i += 1) {
    const d = new Date(now);
    d.setUTCDate(now.getUTCDate() - i);
    keys.push(dayKeyUtc(d));
  }
  return keys;
}

function deriveColor(score: number) {
  if (score >= 85) return "green";
  if (score >= 60) return "yellow";
  return "red";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const days = parseWindowDays(url.searchParams.get("days"));

  const records = await listAssistantParity(1000);
  const latestByDay = new Map<string, (typeof records)[number]>();

  for (const record of records) {
    if (!latestByDay.has(record.dayKey)) {
      latestByDay.set(record.dayKey, record);
    }
  }

  const keys = buildRecentDayKeys(days);
  const trend = keys.map((dayKey) => {
    const record = latestByDay.get(dayKey) || null;
    return {
      dayKey,
      status: record ? (record.overallPass ? "pass" : "fail") : "missing",
      record,
    };
  });

  const passDays = trend.filter((item) => item.status === "pass").length;
  const failDays = trend.filter((item) => item.status === "fail").length;
  const missingDays = trend.filter((item) => item.status === "missing").length;

  const score = Number(((passDays / days) * 100).toFixed(1));
  const color = deriveColor(score);

  return NextResponse.json({
    ok: true,
    windowDays: days,
    score,
    color,
    passDays,
    failDays,
    missingDays,
    trend,
    guidance:
      color === "green"
        ? "Flow logic is healthy. Continue daily checks."
        : color === "yellow"
          ? "Mixed stability. Review failed or missing days and rerun parity checks."
          : "High risk. Investigate call/SMS flows immediately before scaling traffic.",
  });
}
