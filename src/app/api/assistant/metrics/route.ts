import { NextResponse } from "next/server";
import { listAssistantActions, listAssistantLeads } from "@/lib/assistantStore";
import { listAppointmentHistory } from "@/lib/appointmentHistory";

function sinceDays(days: number) {
  const point = new Date();
  point.setDate(point.getDate() - days);
  return point;
}

function parseDate(input: string) {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  return d;
}

export async function GET() {
  const [assistantLeads, assistantActions, bookingHistory] = await Promise.all([
    listAssistantLeads(2000),
    listAssistantActions(2000),
    listAppointmentHistory(500),
  ]);

  const last7 = sinceDays(7);
  const last30 = sinceDays(30);

  const lead30 = assistantLeads.filter((lead) => {
    const d = parseDate(lead.createdAt);
    return d ? d >= last30 : false;
  });

  const lead7 = assistantLeads.filter((lead) => {
    const d = parseDate(lead.createdAt);
    return d ? d >= last7 : false;
  });

  const byPriority = { P1: 0, P2: 0, P3: 0 };
  for (const lead of lead30) {
    byPriority[lead.priority] += 1;
  }

  const booking30 = bookingHistory.filter((entry) => {
    const d = parseDate(entry.submittedAt);
    return d ? d >= last30 : false;
  }).length;

  const action30 = assistantActions.filter((entry) => {
    const d = parseDate(entry.createdAt);
    return d ? d >= last30 : false;
  });

  const actionSummary = {
    status: action30.filter((a) => a.action === "status").length,
    reschedule: action30.filter((a) => a.action === "reschedule").length,
    cancel: action30.filter((a) => a.action === "cancel").length,
    successRate: action30.length > 0 ? Number(((action30.filter((a) => a.ok).length / action30.length) * 100).toFixed(1)) : 0,
  };

  const conversionRate = lead30.length > 0 ? Number(((booking30 / lead30.length) * 100).toFixed(1)) : 0;

  return NextResponse.json({
    ok: true,
    window: "30d",
    leads: {
      total30d: lead30.length,
      total7d: lead7.length,
      byPriority,
    },
    bookings: {
      total30d: booking30,
      conversionPct: conversionRate,
    },
    appointmentActions: actionSummary,
  });
}
