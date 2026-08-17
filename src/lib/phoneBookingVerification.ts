import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import { del, get, put } from "@vercel/blob";

export type PhoneBookingVerification = {
  id: string;
  callId: string;
  phone: string;
  preferredDate: string;
  preferredTimeWindow: string;
  afterHoursFeeAccepted: boolean;
  testMode: boolean;
  codeSalt: string;
  codeHash: string;
  attempts: string;
  status: "pending" | "verified" | "expired" | "locked";
  createdAt: string;
  expiresAt: string;
  verifiedAt: string;
};

const MAX_ATTEMPTS = 5;
const EXPIRY_MS = 5 * 60 * 1000;

export function normalizeVerificationPhone(value: string) {
  const digits = String(value || "").replace(/\D+/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return "";
}

function codeDigest(salt: string, code: string) {
  return createHash("sha256").update(`${salt}:${code}`).digest("hex");
}

function pathname(id: string) {
  return `phone-booking-verifications/${id}.json`;
}

function callPathname(callId: string) {
  const callHash = createHash("sha256").update(callId).digest("hex");
  return `phone-booking-verifications/by-call/${callHash}.json`;
}

function encryptionKey() {
  const secret = String(process.env.PHONE_BOOKING_VERIFICATION_SECRET || process.env.OPENAI_REALTIME_MCP_TOKEN || "").trim();
  return secret ? createHash("sha256").update(secret).digest() : null;
}

function encryptRecord(record: PhoneBookingVerification) {
  const key = encryptionKey();
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

function decryptRecord(value: string) {
  const key = encryptionKey();
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
    return JSON.parse(plaintext) as PhoneBookingVerification;
  } catch {
    return null;
  }
}

async function write(record: PhoneBookingVerification) {
  const encrypted = encryptRecord(record);
  if (!process.env.BLOB_READ_WRITE_TOKEN || !encrypted) return false;
  try {
    const options = {
      access: "public" as const,
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      cacheControlMaxAge: 60,
    };
    await Promise.all([
      put(pathname(record.id), encrypted, options),
      put(callPathname(record.callId), encrypted, options),
    ]);
    return true;
  } catch {
    return false;
  }
}

async function readEncryptedRecord(path: string) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  const response = await get(path, {
    access: "public",
    useCache: false,
    abortSignal: AbortSignal.timeout(1500),
  }).catch(() => null);
  if (!response || response.statusCode !== 200) return null;
  const encrypted = await new Response(response.stream).text().catch(() => "");
  return decryptRecord(encrypted);
}

export async function createPhoneBookingCode(params: {
  callId: string;
  phone: string;
  preferredDate: string;
  preferredTimeWindow: string;
  afterHoursFeeAccepted?: boolean;
  testMode?: boolean;
}) {
  const phone = normalizeVerificationPhone(params.phone);
  if (!/^rtc_[A-Za-z0-9_-]+$/.test(params.callId) || !phone) return null;
  const code = String(randomInt(100000, 1000000));
  const salt = randomBytes(24).toString("hex");
  const now = new Date();
  const record: PhoneBookingVerification = {
    id: randomUUID(),
    callId: params.callId,
    phone,
    preferredDate: params.preferredDate,
    preferredTimeWindow: params.preferredTimeWindow,
    afterHoursFeeAccepted: params.afterHoursFeeAccepted === true,
    testMode: params.testMode === true,
    codeSalt: salt,
    codeHash: codeDigest(salt, code),
    attempts: "0",
    status: "pending",
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + EXPIRY_MS).toISOString(),
    verifiedAt: "",
  };
  return await write(record) ? { record, code } : null;
}

export async function getPhoneBookingVerification(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id) || !process.env.BLOB_READ_WRITE_TOKEN) return null;
  const record = await readEncryptedRecord(pathname(id));
  if (!record) return null;
  if (record.status === "pending" && Date.parse(record.expiresAt) <= Date.now()) {
    const expired = { ...record, status: "expired" as const };
    await write(expired);
    return expired;
  }
  return record;
}

export async function getPhoneBookingVerificationForCall(callId: string) {
  if (!/^rtc_[A-Za-z0-9_-]+$/.test(callId)) return null;
  const record = await readEncryptedRecord(callPathname(callId));
  return record?.callId === callId ? record : null;
}

export async function verifyPhoneBookingCode(params: {
  callId: string;
  verificationId: string;
  code: string;
}) {
  const code = params.code.replace(/\D+/g, "");
  if (!/^\d{6}$/.test(code)) return { status: "invalid_format" as const };
  const record = await getPhoneBookingVerification(params.verificationId);
  if (!record || record.callId !== params.callId) return { status: "not_found" as const };
  if (record.status !== "pending") return { status: record.status };

  const attempts = Number.parseInt(record.attempts, 10) || 0;
  const suppliedHash = Buffer.from(codeDigest(record.codeSalt, code));
  const expectedHash = Buffer.from(record.codeHash);
  const matches = suppliedHash.length === expectedHash.length && timingSafeEqual(suppliedHash, expectedHash);
  if (matches) {
    const verified = { ...record, status: "verified" as const, verifiedAt: new Date().toISOString() };
    return await write(verified)
      ? { status: "verified" as const, record: verified }
      : { status: "unavailable" as const };
  }

  const nextAttempts = attempts + 1;
  const failed = {
    ...record,
    attempts: String(nextAttempts),
    status: nextAttempts >= MAX_ATTEMPTS ? "locked" as const : "pending" as const,
  };
  await write(failed);
  return {
    status: failed.status === "locked" ? "locked" as const : "incorrect" as const,
    attemptsRemaining: Math.max(0, MAX_ATTEMPTS - nextAttempts),
  };
}

export async function requireVerifiedPhoneBooking(params: {
  callId: string;
  phone: string;
  verificationId: string;
  preferredDate: string;
  preferredTimeWindow: string;
}) {
  const record = await getPhoneBookingVerification(params.verificationId);
  const valid = Boolean(
    record
    && record.callId === params.callId
    && record.phone === normalizeVerificationPhone(params.phone)
    && record.status === "verified"
    && record.preferredDate === params.preferredDate
    && record.preferredTimeWindow === params.preferredTimeWindow,
  );
  return valid ? record : null;
}

export async function consumePhoneBookingVerification(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id) || !process.env.BLOB_READ_WRITE_TOKEN) return false;
  try {
    const record = await getPhoneBookingVerification(id);
    await Promise.all([
      del(pathname(id)),
      record ? del(callPathname(record.callId)) : Promise.resolve(),
    ]);
    return true;
  } catch {
    return false;
  }
}

function verificationSecret() {
  return String(process.env.PHONE_BOOKING_VERIFICATION_SECRET || process.env.OPENAI_REALTIME_MCP_TOKEN || "").trim();
}

export function createPhoneBookingVerificationProof(record: PhoneBookingVerification) {
  const secret = verificationSecret();
  if (!secret || record.status !== "verified") return "";
  const payload = Buffer.from(JSON.stringify({
    callId: record.callId,
    phone: record.phone,
    preferredDate: record.preferredDate,
    preferredTimeWindow: record.preferredTimeWindow,
    afterHoursFeeAccepted: record.afterHoursFeeAccepted,
    testMode: record.testMode,
    expiresAt: record.expiresAt,
  })).toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyPhoneBookingVerificationProof(proof: string, callId: string): PhoneBookingVerification | null {
  const secret = verificationSecret();
  const [payload, suppliedSignature] = String(proof || "").split(".");
  if (!secret || !payload || !suppliedSignature) return null;
  const expectedSignature = createHmac("sha256", secret).update(payload).digest("base64url");
  const suppliedBytes = Buffer.from(suppliedSignature);
  const expectedBytes = Buffer.from(expectedSignature);
  if (suppliedBytes.length !== expectedBytes.length || !timingSafeEqual(suppliedBytes, expectedBytes)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<PhoneBookingVerification>;
    if (data.callId !== callId || !data.phone || !data.preferredDate || !data.preferredTimeWindow || !data.expiresAt) return null;
    if (Date.parse(data.expiresAt) <= Date.now()) return null;
    return {
      id: "signed-proof",
      callId,
      phone: data.phone,
      preferredDate: data.preferredDate,
      preferredTimeWindow: data.preferredTimeWindow,
      afterHoursFeeAccepted: data.afterHoursFeeAccepted === true,
      testMode: data.testMode === true,
      codeSalt: "",
      codeHash: "",
      attempts: "0",
      status: "verified",
      createdAt: "",
      expiresAt: data.expiresAt,
      verifiedAt: "",
    };
  } catch {
    return null;
  }
}