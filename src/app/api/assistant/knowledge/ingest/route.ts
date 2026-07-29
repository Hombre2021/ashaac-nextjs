import { NextResponse } from "next/server";
import { ingestKnowledgeFromSitemap } from "@/lib/assistantKnowledgeBase";

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
  const expected = envFirst("ASSISTANT_INGEST_TOKEN", "CRON_SECRET", "VERCEL_CRON_SECRET");
  if (!expected) {
    return process.env.NODE_ENV !== "production";
  }

  const header = request.headers.get("authorization") || "";
  const token = header.replace(/^Bearer\s+/i, "").trim();
  return token && token === expected;
}

async function runIngest(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, detail: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  const maxPages = Number.parseInt(url.searchParams.get("maxPages") || "", 10);
  const force = ["1", "true", "yes"].includes(String(url.searchParams.get("force") || "").toLowerCase());
  const sitemapUrl = String(url.searchParams.get("sitemap") || "").trim();

  try {
    const result = await ingestKnowledgeFromSitemap({
      sitemapUrl: sitemapUrl || undefined,
      maxPages: Number.isFinite(maxPages) ? maxPages : undefined,
      force,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        detail: String((error as Error)?.message || "Knowledge ingest failed."),
      },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  return runIngest(request);
}

export async function POST(request: Request) {
  return runIngest(request);
}
