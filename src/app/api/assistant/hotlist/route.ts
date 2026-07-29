import { NextResponse } from "next/server";
import { listAssistantLeads } from "@/lib/assistantStore";

type HotLead = {
  leadId: string;
  createdAt: string;
  priority: "P1" | "P2" | "P3";
  serviceType: string;
  urgency: string;
  city: string;
  phoneMasked: string;
  handoffMode: string;
  bookingMode: string;
  aiBranch: string;
};

function normalizeDigits(value: string) {
  return String(value || "").replace(/\D+/g, "");
}

function maskPhone(value: string) {
  const digits = normalizeDigits(value);
  if (digits.length < 4) return "";
  return `***-***-${digits.slice(-4)}`;
}

function scoreWeight(lead: {
  priority: "P1" | "P2" | "P3";
  urgency: string;
  serviceType: string;
}) {
  let score = 0;

  if (lead.priority === "P1") score += 100;
  else if (lead.priority === "P2") score += 60;
  else score += 20;

  if (lead.urgency === "now") score += 25;
  else if (lead.urgency === "week") score += 10;

  if (lead.serviceType === "no-cooling" || lead.serviceType === "no-heat") score += 20;
  else if (lead.serviceType === "install") score += 12;

  return score;
}

export async function GET() {
  const leads = await listAssistantLeads(400);

  const hotlist: HotLead[] = leads
    .filter((lead) => lead.priority === "P1" || lead.priority === "P2")
    .sort((a, b) => scoreWeight(b) - scoreWeight(a))
    .slice(0, 100)
    .map((lead) => ({
      leadId: lead.leadId,
      createdAt: lead.createdAt,
      priority: lead.priority,
      serviceType: lead.serviceType,
      urgency: lead.urgency,
      city: lead.city,
      phoneMasked: maskPhone(lead.phone),
      handoffMode: lead.handoffMode,
      bookingMode: lead.bookingMode,
      aiBranch: lead.aiBranch,
    }));

  return NextResponse.json({ ok: true, hotlist });
}
