import { NextResponse } from "next/server";
import { listAssistantSpamRules, removeAssistantSpamRule, upsertAssistantSpamRule } from "@/lib/assistantStore";

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

  const rules = await listAssistantSpamRules(1000);
  return NextResponse.json({ ok: true, count: rules.length, rules });
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, detail: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const type = String(body?.type || "").trim().toLowerCase();
  const matchType = String(body?.matchType || "").trim();
  const value = String(body?.value || "").trim();
  const active = body?.active === undefined ? true : Boolean(body.active);

  if (!(["allow", "deny"].includes(type) && ["phone", "callerName", "keyword"].includes(matchType) && value)) {
    return NextResponse.json({ ok: false, detail: "Invalid spam rule payload." }, { status: 400 });
  }

  const rule = await upsertAssistantSpamRule({
    id: String(body?.id || "").trim() || undefined,
    type: type as "allow" | "deny",
    matchType: matchType as "phone" | "callerName" | "keyword",
    value,
    label: String(body?.label || value).trim(),
    active,
    notes: String(body?.notes || "").trim(),
  });

  return NextResponse.json({ ok: true, rule });
}

export async function DELETE(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, detail: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  const id = String(url.searchParams.get("id") || "").trim();
  if (!id) {
    return NextResponse.json({ ok: false, detail: "Rule id is required." }, { status: 400 });
  }

  const result = await removeAssistantSpamRule(id);
  return NextResponse.json({ ok: result.ok });
}
