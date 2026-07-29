import { NextResponse } from "next/server";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { listAppointmentHistory } from "@/lib/appointmentHistory";
import { listAssistantActions, listAssistantLeads, listTextThreads } from "@/lib/assistantStore";

type ParityReport = {
  generatedAt: string;
  windowDays: number;
  status: "PASS" | "WARN";
  deltas?: {
    leads?: number;
    threads?: number;
  };
};

type DailyParityStatus = {
  day: string;
  generatedAt: string;
  status: "PASS" | "WARN";
};

function isAuthorized(request: Request): boolean {
  const expectedToken = process.env.BOOKING_MANAGER_VIEW_TOKEN;
  if (!expectedToken) {
    return false;
  }

  const url = new URL(request.url);
  const queryToken = url.searchParams.get("token") || "";
  const headerToken = request.headers.get("x-manager-token") || "";
  const providedToken = queryToken || headerToken;

  return providedToken.length > 0 && providedToken === expectedToken;
}

function sinceDays(days: number) {
  const point = new Date();
  point.setDate(point.getDate() - days);
  return point;
}

function parseDate(input: string) {
  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeDigits(value: string) {
  return String(value || "").replace(/\D+/g, "");
}

function maskPhone(value: string) {
  const digits = normalizeDigits(value);
  if (digits.length < 4) return "";
  return `***-***-${digits.slice(-4)}`;
}

async function loadParityReports(limit = 14): Promise<ParityReport[]> {
  const reportsDir = join(process.cwd(), "data", "parity-reports");

  try {
    const files = await readdir(reportsDir);
    const targets = files
      .filter((file) => file.startsWith("assistant-parity-") && file.endsWith(".json"))
      .sort((a, b) => b.localeCompare(a))
      .slice(0, limit);

    const reports: ParityReport[] = [];

    for (const file of targets) {
      try {
        const raw = await readFile(join(reportsDir, file), "utf8");
        const parsed = JSON.parse(raw) as ParityReport;

        if (!parsed || !parsed.generatedAt || !parsed.status) {
          continue;
        }

        reports.push(parsed);
      } catch {
        continue;
      }
    }

    return reports.sort((a, b) => a.generatedAt.localeCompare(b.generatedAt));
  } catch {
    return [];
  }
}

function summarizeDailyParity(reports: ParityReport[]): DailyParityStatus[] {
  const byDay = new Map<string, DailyParityStatus>();

  for (const report of reports) {
    const ts = new Date(report.generatedAt);
    if (Number.isNaN(ts.getTime())) continue;

    const day = ts.toISOString().slice(0, 10);
    const current = byDay.get(day);

    if (!current || report.generatedAt > current.generatedAt) {
      byDay.set(day, {
        day,
        generatedAt: report.generatedAt,
        status: report.status,
      });
    }
  }

  return Array.from(byDay.values()).sort((a, b) => b.day.localeCompare(a.day));
}

function consecutivePassDays(daily: DailyParityStatus[]) {
  if (daily.length === 0) return 0;

  let streak = 0;
  let expected: Date | null = null;

  for (const item of daily) {
    if (item.status !== "PASS") break;

    const current = new Date(`${item.day}T00:00:00.000Z`);
    if (Number.isNaN(current.getTime())) break;

    if (!expected) {
      streak += 1;
      expected = new Date(current.getTime() - 24 * 60 * 60 * 1000);
      continue;
    }

    const expectedDay = expected.toISOString().slice(0, 10);
    if (item.day !== expectedDay) {
      break;
    }

    streak += 1;
    expected = new Date(current.getTime() - 24 * 60 * 60 * 1000);
  }

  return streak;
}

export async function GET(request: Request) {
  if (!process.env.BOOKING_MANAGER_VIEW_TOKEN) {
    return NextResponse.json(
      {
        error: "Manager view token is not configured. Set BOOKING_MANAGER_VIEW_TOKEN.",
      },
      { status: 503 },
    );
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [assistantLeads, assistantActions, bookingHistory, threads] = await Promise.all([
    listAssistantLeads(2000),
    listAssistantActions(2000),
    listAppointmentHistory(500),
    listTextThreads(200),
  ]);
  const parityReports = await loadParityReports(21);
  const latestParity = parityReports.length > 0 ? parityReports[parityReports.length - 1] : null;
  const dailyParity = summarizeDailyParity(parityReports);
  const passStreakDays = consecutivePassDays(dailyParity);
  const requiredPassDays = Math.max(2, Number(process.env.ASSISTANT_PARITY_REQUIRED_DAYS || 3));
  const canRetireFallback = passStreakDays >= requiredPassDays;

  const last7 = sinceDays(7);
  const last30 = sinceDays(30);

  const leads30 = assistantLeads.filter((lead) => {
    const d = parseDate(lead.createdAt);
    return d ? d >= last30 : false;
  });

  const leads7 = assistantLeads.filter((lead) => {
    const d = parseDate(lead.createdAt);
    return d ? d >= last7 : false;
  });

  const booking30 = bookingHistory.filter((entry) => {
    const d = parseDate(entry.submittedAt);
    return d ? d >= last30 : false;
  }).length;

  const actions30 = assistantActions.filter((entry) => {
    const d = parseDate(entry.createdAt);
    return d ? d >= last30 : false;
  });

  const byPriority = { P1: 0, P2: 0, P3: 0 };
  for (const lead of leads30) {
    byPriority[lead.priority] += 1;
  }

  const conversionPct = leads30.length > 0 ? Number(((booking30 / leads30.length) * 100).toFixed(1)) : 0;

  return NextResponse.json({
    ok: true,
    metrics: {
      leads: {
        total30d: leads30.length,
        total7d: leads7.length,
        byPriority,
      },
      bookings: {
        total30d: booking30,
        conversionPct,
      },
      appointmentActions: {
        status: actions30.filter((a) => a.action === "status").length,
        reschedule: actions30.filter((a) => a.action === "reschedule").length,
        cancel: actions30.filter((a) => a.action === "cancel").length,
        successRate: actions30.length > 0 ? Number(((actions30.filter((a) => a.ok).length / actions30.length) * 100).toFixed(1)) : 0,
      },
    },
    threads: threads.map((thread) => ({
      id: thread.id,
      code: thread.code,
      leadId: thread.leadId,
      customerPhoneMasked: maskPhone(thread.customerPhone),
      technicianPhoneMasked: maskPhone(thread.technicianPhone),
      openedAt: thread.openedAt,
      lastMessageAt: thread.lastMessageAt,
      status: thread.status,
      messageCount: thread.messages.length,
      preview: thread.messages.slice(-3),
    })),
    recentActions: assistantActions.slice(0, 30).map((action) => ({
      id: action.id,
      createdAt: action.createdAt,
      action: action.action,
      ok: action.ok,
      requestId: action.requestId,
      phoneMasked: maskPhone(action.phone),
      detail: action.detail,
    })),
    parity: {
      latest: latestParity
        ? {
            generatedAt: latestParity.generatedAt,
            status: latestParity.status,
            windowDays: latestParity.windowDays,
            leadDelta: Number(latestParity.deltas?.leads || 0),
            threadDelta: Number(latestParity.deltas?.threads || 0),
          }
        : null,
      trend: parityReports.map((report) => ({
        generatedAt: report.generatedAt,
        status: report.status,
        leadDelta: Number(report.deltas?.leads || 0),
        threadDelta: Number(report.deltas?.threads || 0),
      })),
      retirementReadiness: {
        requiredDays: requiredPassDays,
        currentPassStreakDays: passStreakDays,
        canRetireFallback,
        latestDailyStatus: dailyParity[0]?.status || "WARN",
      },
    },
  });
}
