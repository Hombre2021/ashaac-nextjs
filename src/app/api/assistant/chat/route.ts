import { NextResponse } from "next/server";
import { assistantBusinessFacts, getGroundedAssistantAnswer } from "@/lib/assistantKnowledge";
import { retrieveRelevantKnowledge, type RetrievedChunk } from "@/lib/assistantKnowledgeBase";

type CitationSource = {
  index: number;
  title: string;
  url: string;
  score: number;
};

function envFirst(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === "string" && value.trim().length > 0) {
      const trimmed = value.trim().replace(/^['"]|['"]$/g, "");
      const upper = trimmed.toUpperCase();
      if (
        trimmed.startsWith("REPLACE_WITH_")
        || upper.startsWith("REPLACE")
        || upper.includes("YOUR_API_KEY")
        || upper.includes("CHANGEME")
      ) {
        continue;
      }
      return trimmed;
    }
  }

  return "";
}

function fallbackAnswer(question: string) {
  return getGroundedAssistantAnswer(question)
    || "Thanks for your question. We can help with HVAC repair, replacement, and maintenance in West Jordan and surrounding areas. Would you like to book now, text a technician, or request a callback?";
}

function extractResponseText(payload: unknown) {
  const root = payload as {
    output_text?: unknown;
    output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  };

  const direct = String(root?.output_text || "").trim();
  if (direct) return direct;

  const output = Array.isArray(root?.output) ? root.output : [];
  for (const item of output) {
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const block of content) {
      const text = String(block?.text || "").trim();
      if (text) return text;
    }
  }

  return "";
}

function buildKnowledgeContext(chunks: RetrievedChunk[]) {
  if (chunks.length === 0) {
    return "";
  }

  return chunks
    .map((chunk, index) => `[${index + 1}] ${chunk.title} (${chunk.url})\n${chunk.content}`)
    .join("\n\n");
}

function extractCitationIndexes(answer: string) {
  const indexes = new Set<number>();
  const rx = /\[(\d{1,2})\]/g;
  let match = rx.exec(answer);

  while (match) {
    const value = Number.parseInt(match[1], 10);
    if (Number.isFinite(value) && value > 0) {
      indexes.add(value);
    }
    match = rx.exec(answer);
  }

  return Array.from(indexes).sort((a, b) => a - b);
}

function buildCitationSources(answer: string, chunks: RetrievedChunk[]) {
  if (chunks.length === 0) return [] as CitationSource[];

  const citedIndexes = extractCitationIndexes(answer);
  const indexes = citedIndexes.length > 0 ? citedIndexes : [1, 2];
  const unique = new Set<number>();
  const sources: CitationSource[] = [];

  for (const index of indexes) {
    if (unique.has(index)) continue;
    unique.add(index);
    const chunk = chunks[index - 1];
    if (!chunk) continue;

    sources.push({
      index,
      title: chunk.title,
      url: chunk.url,
      score: Number(chunk.score.toFixed(4)),
    });
  }

  return sources;
}

async function verifyTurnstile(token: string, remoteIp: string) {
  const secret = envFirst("TURNSTILE_SECRET_KEY");
  if (!secret) {
    return { ok: true, mode: "off" as const };
  }

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      secret,
      response: token,
      remoteip: remoteIp,
    }).toString(),
  });

  const payload = (await response.json().catch(() => null)) as { success?: boolean } | null;
  return { ok: Boolean(payload?.success), mode: "on" as const };
}

function hasInternalAssistantAuth(req: Request) {
  const expected = envFirst("ASSISTANT_INTERNAL_TOKEN", "CRON_SECRET", "VERCEL_CRON_SECRET");
  if (!expected) return false;

  const authHeader = req.headers.get("authorization") || "";
  const bearer = authHeader.replace(/^Bearer\s+/i, "").trim();
  const alt = String(req.headers.get("x-assistant-internal-token") || "").trim();

  return (bearer && bearer === expected) || (alt && alt === expected);
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { question?: string; turnstileToken?: string } | null;
  const question = String(body?.question || "").trim();
  const turnstileToken = String(body?.turnstileToken || "").trim();

  if (!question) {
    return NextResponse.json({ error: "question is required" }, { status: 400 });
  }

  const forwardedFor = req.headers.get("x-forwarded-for") || "";
  const remoteIp = forwardedFor.split(",")[0]?.trim() || "";
  const hostHeader = req.headers.get("host") || "";
  const isLocalHost = /localhost|127\.0\.0\.1/.test(hostHeader);
  const internalRequest = hasInternalAssistantAuth(req);
  const turnstileSecretEnabled = Boolean(envFirst("TURNSTILE_SECRET_KEY")) && !isLocalHost && !internalRequest;

  if (turnstileSecretEnabled && !turnstileToken) {
    return NextResponse.json({ error: "Robot verification required." }, { status: 403 });
  }

  if (turnstileSecretEnabled) {
    const check = await verifyTurnstile(turnstileToken, remoteIp);
    if (!check.ok) {
      return NextResponse.json({ error: "Robot verification failed." }, { status: 403 });
    }
  }

  const apiKey = envFirst("OPENAI_API_KEY");
  const model = envFirst("OPENAI_CHAT_MODEL", "OPENAI_MODEL") || "gpt-4.1-mini";
  const groundedAnswer = getGroundedAssistantAnswer(question);
  const retrieved = await retrieveRelevantKnowledge(question, 6).catch(() => [] as RetrievedChunk[]);
  const knowledgeContext = buildKnowledgeContext(retrieved);

  if (!apiKey) {
    return NextResponse.json({
      ok: true,
      answer: fallbackAnswer(question),
      mode: "fallback",
      sources: [] as CitationSource[],
    });
  }

  const systemPrompt = [
    "You are All Solutions AI Assistant for an HVAC company.",
    "Answer customer service questions clearly and briefly in plain language.",
    "When relevant, mention service area coverage and same-day availability as 'based on technician availability'.",
    "If retrieved knowledge snippets are provided, prioritize them as source of truth.",
    "When using retrieved knowledge in your answer, cite with bracket indexes like [1], [2].",
    "Grounding facts:",
    ...assistantBusinessFacts.map((fact) => `- ${fact}`),
    groundedAnswer ? `Known grounded answer candidate for this question: ${groundedAnswer}` : "",
    knowledgeContext ? `Retrieved website knowledge snippets:\n${knowledgeContext}` : "",
    "Never invent policy details that were not provided.",
  ].join("\n");

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: "system",
            content: [{ type: "input_text", text: systemPrompt }],
          },
          {
            role: "user",
            content: [{ type: "input_text", text: question }],
          },
        ],
        max_output_tokens: 180,
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`LLM request failed (${response.status}): ${text || response.statusText}`);
    }

    const payload = (await response.json()) as unknown;
    const answer = extractResponseText(payload);

    return NextResponse.json({
      ok: true,
      answer: answer || fallbackAnswer(question),
      mode: "llm",
      sources: buildCitationSources(answer, retrieved),
    });
  } catch {
    return NextResponse.json({
      ok: true,
      answer: fallbackAnswer(question),
      mode: "fallback",
      sources: [] as CitationSource[],
    });
  }
}
