import { NextResponse } from "next/server";
import { listAssistantCosts } from "@/lib/assistantStore";

function sinceDays(days: number) {
  const point = new Date();
  point.setDate(point.getDate() - days);
  return point;
}

function parseDate(input: string) {
  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const days = Math.max(1, Math.min(90, Number(url.searchParams.get("days") || 30)));
  const cutoff = sinceDays(days);
  const includedCharsPerMonth = Math.max(0, Number(url.searchParams.get("includedChars") || process.env.COST_ELEVENLABS_INCLUDED_CHARS || 30000));
  const overageUsdPer1kChars = Math.max(0, Number(url.searchParams.get("overagePer1k") || process.env.COST_ELEVENLABS_OVERAGE_PER_1000 || 0.3));
  const scenarioCalls = (url.searchParams.get("projectedCalls") || "100,300,500,1000")
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value) && value > 0)
    .slice(0, 12);

  const costs = await listAssistantCosts(5000);
  const filtered = costs.filter((entry) => {
    const date = parseDate(entry.createdAt);
    return date ? date >= cutoff : false;
  });

  const summary = {
    totalEvents: filtered.length,
    byProvider: {
      elevenlabs: filtered.filter((entry) => entry.provider === "elevenlabs").length,
      openai: filtered.filter((entry) => entry.provider === "openai").length,
      twilio: filtered.filter((entry) => entry.provider === "twilio").length,
      other: filtered.filter((entry) => entry.provider === "other").length,
    },
    elevenlabsCharacters: filtered
      .filter((entry) => entry.provider === "elevenlabs" && entry.unitLabel === "characters")
      .reduce((sum, entry) => sum + (entry.unitCount || 0), 0),
  };

  const elevenlabsEvents = filtered.filter((entry) => entry.provider === "elevenlabs" && entry.category === "tts");
  const uniqueCallSids = new Set(elevenlabsEvents.map((entry) => entry.callSid).filter(Boolean));
  const observedCalls = uniqueCallSids.size > 0 ? uniqueCallSids.size : Math.max(1, elevenlabsEvents.length);
  const charsPerCall = observedCalls > 0 ? summary.elevenlabsCharacters / observedCalls : 0;

  const monthlyObservedCalls = Math.max(0, Math.round((observedCalls / days) * 30));
  const projectedRows = scenarioCalls.map((callsPerMonth) => {
    const projectedChars = Math.round(charsPerCall * callsPerMonth);
    const billableChars = Math.max(0, projectedChars - includedCharsPerMonth);
    const estimatedOverageUsd = Number(((billableChars / 1000) * overageUsdPer1kChars).toFixed(2));

    return {
      callsPerMonth,
      projectedCharacters: projectedChars,
      includedCharacters: includedCharsPerMonth,
      billableCharacters: billableChars,
      estimatedOverageUsd,
    };
  });

  const observedProjectedChars = Math.round(charsPerCall * monthlyObservedCalls);
  const observedBillableChars = Math.max(0, observedProjectedChars - includedCharsPerMonth);
  const observedEstimatedOverageUsd = Number(((observedBillableChars / 1000) * overageUsdPer1kChars).toFixed(2));

  return NextResponse.json({
    ok: true,
    days,
    summary,
    projections: {
      assumptions: {
        includedCharsPerMonth,
        overageUsdPer1kChars,
      },
      observed: {
        observedCallsInWindow: observedCalls,
        projectedCallsPerMonth: monthlyObservedCalls,
        averageCharactersPerCall: Number(charsPerCall.toFixed(1)),
        projectedCharactersPerMonth: observedProjectedChars,
        estimatedOverageUsdPerMonth: observedEstimatedOverageUsd,
      },
      scenarios: projectedRows,
    },
    events: filtered.slice(0, 500),
  });
}
