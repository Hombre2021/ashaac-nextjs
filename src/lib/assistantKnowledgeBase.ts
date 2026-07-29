import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { head, put } from "@vercel/blob";

export type KnowledgeChunk = {
  id: string;
  url: string;
  title: string;
  content: string;
  embedding: number[];
};

export type KnowledgeStore = {
  updatedAt: string;
  sitemapUrl: string;
  pageCount: number;
  chunkCount: number;
  chunks: KnowledgeChunk[];
};

export type RetrievedChunk = {
  id: string;
  url: string;
  title: string;
  content: string;
  score: number;
};

export type IngestResult = {
  ok: boolean;
  detail: string;
  updatedAt?: string;
  sitemapUrl?: string;
  pageCount?: number;
  chunkCount?: number;
};

const dataDir = join(process.cwd(), "data");
const kbFile = join(dataDir, "assistant-knowledge-store.json");
const kbBlobPath = "assistant/rag/knowledge-store.json";

let memoryStore: KnowledgeStore | null = null;
let ingestInFlight: Promise<IngestResult> | null = null;
let memoryStoreSource: "blob" | "file" | "memory" | "none" = "none";

function nowIso() {
  return new Date().toISOString();
}

function envFirst(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === "string" && value.trim()) {
      const trimmed = value.trim().replace(/^['\"]|['\"]$/g, "");
      if (!trimmed) continue;
      const upper = trimmed.toUpperCase();
      if (upper.includes("REPLACE") || upper.includes("YOUR_API_KEY") || upper.includes("CHANGEME")) {
        continue;
      }
      return trimmed;
    }
  }

  return "";
}

function hashText(value: string) {
  return createHash("sha1").update(value).digest("hex");
}

function hasBlobConfig() {
  return Boolean(envFirst("BLOB_READ_WRITE_TOKEN", "VERCEL_BLOB_READ_WRITE_TOKEN"));
}

function storageBackend() {
  return hasBlobConfig() ? "vercel-blob" : "local-file";
}

function normalizeWhitespace(value: string) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function decodeHtmlEntities(text: string) {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripHtml(html: string) {
  return normalizeWhitespace(
    decodeHtmlEntities(
      String(html || "")
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
        .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, " ")
        .replace(/<[^>]+>/g, " "),
    ),
  );
}

function extractTitle(html: string, url: string) {
  const titleMatch = String(html || "").match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch?.[1]) {
    return normalizeWhitespace(decodeHtmlEntities(titleMatch[1]));
  }

  try {
    const parsed = new URL(url);
    const path = parsed.pathname === "/" ? "Home" : parsed.pathname.replace(/\/$/, "").split("/").filter(Boolean).join(" ");
    return normalizeWhitespace(path || parsed.hostname);
  } catch {
    return "Website Page";
  }
}

function chunkText(text: string, maxChars = 900, overlap = 180) {
  const normalized = normalizeWhitespace(text);
  if (!normalized) return [] as string[];
  if (normalized.length <= maxChars) return [normalized];

  const chunks: string[] = [];
  let start = 0;

  while (start < normalized.length) {
    const end = Math.min(normalized.length, start + maxChars);
    const slice = normalized.slice(start, end);
    const lastSpace = slice.lastIndexOf(" ");
    const safeEnd = end < normalized.length && lastSpace > maxChars * 0.6 ? start + lastSpace : end;
    const chunk = normalized.slice(start, safeEnd).trim();

    if (chunk.length > 40) {
      chunks.push(chunk);
    }

    if (safeEnd >= normalized.length) break;
    start = Math.max(safeEnd - overlap, start + 1);
  }

  return chunks;
}

function cosineSimilarity(a: number[], b: number[]) {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  if (!magA || !magB) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

async function readStore() {
  if (memoryStore) {
    memoryStoreSource = "memory";
    return memoryStore;
  }

  if (hasBlobConfig()) {
    try {
      const blob = await head(kbBlobPath);
      const response = await fetch(blob.url, { cache: "no-store" });
      if (response.ok) {
        const raw = await response.text();
        const parsed = JSON.parse(raw) as KnowledgeStore;
        if (parsed && Array.isArray(parsed.chunks)) {
          memoryStore = parsed;
          memoryStoreSource = "blob";
          return parsed;
        }
      }
    } catch {
      // Fall through to file storage.
    }
  }

  try {
    const raw = await readFile(kbFile, "utf8");
    const parsed = JSON.parse(raw) as KnowledgeStore;
    if (!parsed || !Array.isArray(parsed.chunks)) {
      return null;
    }

    memoryStore = parsed;
    memoryStoreSource = "file";
    return parsed;
  } catch {
    memoryStoreSource = "none";
    return null;
  }
}

async function writeStore(store: KnowledgeStore) {
  memoryStore = store;

  if (hasBlobConfig()) {
    try {
      await put(kbBlobPath, JSON.stringify(store), {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
      });
      memoryStoreSource = "blob";
    } catch {
      // Continue with file persistence as fallback.
    }
  }

  try {
    await mkdir(dataDir, { recursive: true });
    await writeFile(kbFile, JSON.stringify(store, null, 2), "utf8");
    if (memoryStoreSource !== "blob") {
      memoryStoreSource = "file";
    }
  } catch {
    // Ignore write errors in read-only/serverless runtimes.
  }
}

async function fetchXml(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "ASHAAC-Assistant-Ingest/1.0",
      Accept: "application/xml,text/xml;q=0.9,*/*;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch sitemap: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

function parseTagValues(xml: string, tagName: string) {
  const values: string[] = [];
  const rx = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, "gi");
  let match: RegExpExecArray | null = rx.exec(xml);

  while (match) {
    const value = normalizeWhitespace(decodeHtmlEntities(match[1] || ""));
    if (value) values.push(value);
    match = rx.exec(xml);
  }

  return values;
}

async function collectSitemapUrls(sitemapUrl: string, maxPages: number) {
  const visited = new Set<string>();
  const pageUrls: string[] = [];
  const pending: string[] = [sitemapUrl];

  while (pending.length > 0 && pageUrls.length < maxPages) {
    const current = pending.shift() || "";
    if (!current || visited.has(current)) continue;
    visited.add(current);

    const xml = await fetchXml(current);
    const nestedSitemaps = parseTagValues(xml, "loc").filter((value) => /sitemap/i.test(value) && /\.xml($|\?)/i.test(value));

    const urls = parseTagValues(xml, "loc").filter((value) => /^https?:\/\//i.test(value));

    for (const candidate of urls) {
      if (pageUrls.length >= maxPages) break;
      if (/\.xml($|\?)/i.test(candidate) && /sitemap/i.test(candidate)) {
        if (!visited.has(candidate)) {
          pending.push(candidate);
        }
        continue;
      }

      pageUrls.push(candidate);
    }

    for (const nested of nestedSitemaps) {
      if (!visited.has(nested)) {
        pending.push(nested);
      }
    }
  }

  return Array.from(new Set(pageUrls)).slice(0, maxPages);
}

async function fetchPage(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "ASHAAC-Assistant-Ingest/1.0",
      Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
    },
  });

  if (!response.ok) {
    return null;
  }

  const html = await response.text();
  const title = extractTitle(html, url);
  const text = stripHtml(html);

  if (!text || text.length < 120) {
    return null;
  }

  return {
    url,
    title,
    text,
  };
}

async function createEmbeddings(inputs: string[]) {
  const apiKey = envFirst("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required for knowledge embeddings.");
  }

  const model = envFirst("OPENAI_EMBED_MODEL") || "text-embedding-3-small";
  const vectors: number[][] = [];

  for (let i = 0; i < inputs.length; i += 50) {
    const batch = inputs.slice(i, i + 50);
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: batch,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`Embedding request failed (${response.status}): ${detail || response.statusText}`);
    }

    const payload = (await response.json()) as { data?: Array<{ embedding?: number[] }> };
    const embedded = Array.isArray(payload.data) ? payload.data : [];
    for (const item of embedded) {
      vectors.push(Array.isArray(item.embedding) ? item.embedding : []);
    }
  }

  if (vectors.length !== inputs.length) {
    throw new Error(`Embedding count mismatch: got ${vectors.length}, expected ${inputs.length}.`);
  }

  return vectors;
}

function filterSameOrigin(urls: string[], sitemapUrl: string) {
  let origin = "";
  try {
    origin = new URL(sitemapUrl).origin;
  } catch {
    origin = "";
  }

  if (!origin) return urls;
  return urls.filter((value) => {
    try {
      return new URL(value).origin === origin;
    } catch {
      return false;
    }
  });
}

export async function ingestKnowledgeFromSitemap(options?: {
  sitemapUrl?: string;
  maxPages?: number;
  force?: boolean;
}) {
  if (ingestInFlight) {
    return ingestInFlight;
  }

  ingestInFlight = (async () => {
    const sitemapUrl = options?.sitemapUrl || envFirst("ASSISTANT_SITEMAP_URL", "NEXT_PUBLIC_SITE_URL") || "https://ashaac.com/sitemap.xml";
    const normalizedSitemap = sitemapUrl.endsWith(".xml") ? sitemapUrl : `${sitemapUrl.replace(/\/$/, "")}/sitemap.xml`;
    const maxPages = Math.max(5, Math.min(200, options?.maxPages || Number.parseInt(envFirst("ASSISTANT_SITEMAP_MAX_PAGES") || "40", 10) || 40));

    const existing = options?.force ? null : await readStore();
    if (existing && existing.chunkCount > 0) {
      const maxAgeHours = Math.max(1, Number.parseInt(envFirst("ASSISTANT_KB_MAX_AGE_HOURS") || "24", 10) || 24);
      const updatedMs = Date.parse(existing.updatedAt || "");
      if (updatedMs && Date.now() - updatedMs < maxAgeHours * 60 * 60 * 1000) {
        return {
          ok: true,
          detail: "Knowledge base is fresh; ingest skipped.",
          updatedAt: existing.updatedAt,
          sitemapUrl: existing.sitemapUrl,
          pageCount: existing.pageCount,
          chunkCount: existing.chunkCount,
        } satisfies IngestResult;
      }
    }

    const discovered = await collectSitemapUrls(normalizedSitemap, maxPages * 2);
    const pageUrls = filterSameOrigin(discovered, normalizedSitemap).slice(0, maxPages);

    const pages: Array<{ url: string; title: string; text: string }> = [];
    for (const pageUrl of pageUrls) {
      const page = await fetchPage(pageUrl);
      if (page) {
        pages.push(page);
      }
    }

    if (pages.length === 0) {
      throw new Error("No sitemap pages could be ingested.");
    }

    const rawChunks: Array<{ url: string; title: string; content: string }> = [];
    for (const page of pages) {
      const chunks = chunkText(page.text);
      for (const chunk of chunks) {
        rawChunks.push({
          url: page.url,
          title: page.title,
          content: chunk,
        });
      }
    }

    const dedupedMap = new Map<string, { url: string; title: string; content: string }>();
    for (const item of rawChunks) {
      const key = hashText(`${item.url}|${item.content}`);
      if (!dedupedMap.has(key)) {
        dedupedMap.set(key, item);
      }
    }

    const deduped = Array.from(dedupedMap.values());
    const embeddings = await createEmbeddings(deduped.map((item) => item.content));

    const chunks: KnowledgeChunk[] = deduped.map((item, index) => ({
      id: `${hashText(item.url).slice(0, 10)}-${index + 1}`,
      url: item.url,
      title: item.title,
      content: item.content,
      embedding: embeddings[index],
    }));

    const store: KnowledgeStore = {
      updatedAt: nowIso(),
      sitemapUrl: normalizedSitemap,
      pageCount: pages.length,
      chunkCount: chunks.length,
      chunks,
    };

    await writeStore(store);

    return {
      ok: true,
      detail: "Knowledge base ingested from sitemap.",
      updatedAt: store.updatedAt,
      sitemapUrl: store.sitemapUrl,
      pageCount: store.pageCount,
      chunkCount: store.chunkCount,
    } satisfies IngestResult;
  })();

  try {
    return await ingestInFlight;
  } finally {
    ingestInFlight = null;
  }
}

export async function getKnowledgeStatus() {
  const store = await readStore();
  if (!store) {
    return {
      ok: true,
      detail: "Knowledge base has not been built yet.",
      storageBackend: storageBackend(),
      loadedFrom: memoryStoreSource,
      exists: false,
      updatedAt: "",
      sitemapUrl: "",
      pageCount: 0,
      chunkCount: 0,
      sampleSources: [] as string[],
    };
  }

  return {
    ok: true,
    detail: "Knowledge base is available.",
    storageBackend: storageBackend(),
    loadedFrom: memoryStoreSource,
    exists: true,
    updatedAt: store.updatedAt,
    sitemapUrl: store.sitemapUrl,
    pageCount: store.pageCount,
    chunkCount: store.chunkCount,
    sampleSources: Array.from(new Set(store.chunks.slice(0, 10).map((item) => item.url))),
  };
}

async function ensureKnowledgeLoaded() {
  let store = await readStore();
  if (store && store.chunkCount > 0) {
    return store;
  }

  const ingested = await ingestKnowledgeFromSitemap({ force: true }).catch(() => null);
  if (!ingested?.ok) {
    return store;
  }

  store = await readStore();
  return store;
}

async function embedQuery(question: string) {
  const apiKey = envFirst("OPENAI_API_KEY");
  if (!apiKey) return [] as number[];
  const model = envFirst("OPENAI_EMBED_MODEL") || "text-embedding-3-small";

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, input: question }),
  });

  if (!response.ok) {
    return [] as number[];
  }

  const payload = (await response.json()) as { data?: Array<{ embedding?: number[] }> };
  const vector = payload.data?.[0]?.embedding;
  return Array.isArray(vector) ? vector : [];
}

export async function retrieveRelevantKnowledge(question: string, topK = 5) {
  const store = await ensureKnowledgeLoaded();
  if (!store || !Array.isArray(store.chunks) || store.chunks.length === 0) {
    return [] as RetrievedChunk[];
  }

  const queryVector = await embedQuery(question);
  if (queryVector.length === 0) {
    return [] as RetrievedChunk[];
  }

  return store.chunks
    .map((chunk) => ({
      id: chunk.id || randomUUID(),
      url: chunk.url,
      title: chunk.title,
      content: chunk.content,
      score: cosineSimilarity(queryVector, chunk.embedding || []),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, topK));
}
