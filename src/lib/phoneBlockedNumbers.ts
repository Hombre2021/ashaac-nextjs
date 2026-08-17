import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { get, put } from "@vercel/blob";

type BlockedNumberRecord = {
  version: 1;
  updatedAt: string;
  sources: string[];
  hashes: string[];
};

const PATHNAME = "phone-spam/android-blocked-numbers.json";

function secret() {
  const value = String(process.env.OPENAI_REALTIME_MCP_TOKEN || "").trim();
  return value ? createHash("sha256").update(`blocked-numbers:${value}`).digest() : null;
}

function normalize(value: string) {
  const digits = String(value || "").replace(/\D+/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return digits.length >= 7 ? `+${digits}` : "";
}

function numberHash(value: string) {
  const normalized = normalize(value);
  return normalized ? createHash("sha256").update(normalized).digest("hex") : "";
}

function encrypt(record: BlockedNumberRecord) {
  const key = secret();
  if (!key) return null;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(record), "utf8"), cipher.final()]);
  return JSON.stringify({
    version: 1,
    iv: iv.toString("base64url"),
    tag: cipher.getAuthTag().toString("base64url"),
    ciphertext: ciphertext.toString("base64url"),
  });
}

function decrypt(value: string) {
  const key = secret();
  if (!key) return null;
  try {
    const envelope = JSON.parse(value) as { version?: number; iv?: string; tag?: string; ciphertext?: string };
    if (envelope.version !== 1 || !envelope.iv || !envelope.tag || !envelope.ciphertext) return null;
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(envelope.iv, "base64url"));
    decipher.setAuthTag(Buffer.from(envelope.tag, "base64url"));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(envelope.ciphertext, "base64url")),
      decipher.final(),
    ]).toString("utf8");
    return JSON.parse(plaintext) as BlockedNumberRecord;
  } catch {
    return null;
  }
}

async function readRecord() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  const response = await get(PATHNAME, { access: "public", useCache: false }).catch(() => null);
  if (!response || response.statusCode !== 200) return null;
  const encrypted = await new Response(response.stream).text().catch(() => "");
  return decrypt(encrypted);
}

export async function isImportedBlockedNumber(value: string) {
  const hash = numberHash(value);
  if (!hash) return false;
  const record = await readRecord();
  return Boolean(record?.hashes.includes(hash));
}

export async function replaceImportedBlockedNumbers(numbers: string[], sources: string[]) {
  const hashes = Array.from(new Set(numbers.map(numberHash).filter(Boolean))).sort();
  const record: BlockedNumberRecord = {
    version: 1,
    updatedAt: new Date().toISOString(),
    sources: Array.from(new Set(sources.map((value) => value.trim()).filter(Boolean))),
    hashes,
  };
  const encrypted = encrypt(record);
  if (!encrypted || !process.env.BLOB_READ_WRITE_TOKEN) return { ok: false, count: 0 };
  try {
    await put(PATHNAME, encrypted, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      cacheControlMaxAge: 60,
    });
    return { ok: true, count: hashes.length };
  } catch {
    return { ok: false, count: 0 };
  }
}