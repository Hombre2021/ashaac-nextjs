import { NextResponse } from "next/server";
import { listAssistantSpamReviews } from "@/lib/assistantStore";

export const dynamic = "force-dynamic";

function envFirst(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

function isAuthorized(request: Request) {
  const expected = envFirst("BOOKING_MANAGER_VIEW_TOKEN", "ASSISTANT_INTERNAL_TOKEN", "CRON_SECRET", "VERCEL_CRON_SECRET");
  if (!expected) return true;
  const auth = request.headers.get("authorization") || "";
  const bearer = auth.replace(/^Bearer\s+/i, "").trim();
  return bearer === expected;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, detail: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  const limitRaw = Number.parseInt(String(url.searchParams.get("limit") || "100"), 10);
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(1000, limitRaw)) : 100;
  const blockedOnly = ["1", "true", "yes"].includes(String(url.searchParams.get("blockedOnly") || "").toLowerCase());

  const reviews = await listAssistantSpamReviews(limit);
  const filtered = blockedOnly ? reviews.filter((item) => item.blocked) : reviews;

  return NextResponse.json({ ok: true, count: filtered.length, reviews: filtered });
}
