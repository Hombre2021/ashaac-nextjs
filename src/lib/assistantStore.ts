import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

export type AssistantLeadRecord = {
  id: string;
  createdAt: string;
  leadId: string;
  priority: "P1" | "P2" | "P3";
  serviceType: string;
  urgency: string;
  city: string;
  phone: string;
  handoffMode: string;
  bookingMode: string;
  captureSource: string;
  aiBranch: string;
};

export type AssistantActionRecord = {
  id: string;
  createdAt: string;
  action: "status" | "reschedule" | "cancel";
  ok: boolean;
  requestId: string;
  phone: string;
  detail: string;
};

export type TextThreadMessage = {
  at: string;
  from: "system" | "customer" | "technician";
  body: string;
};

export type TextThreadRecord = {
  id: string;
  code: string;
  leadId: string;
  customerPhone: string;
  technicianPhone: string;
  openedAt: string;
  lastMessageAt: string;
  status: "pending" | "active" | "closed";
  messages: TextThreadMessage[];
};

export type MauricioTransferRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  lastAttemptAt?: string;
  conferenceName: string;
  callerCallSid: string;
  callerPhone: string;
  callerName: string;
  mauricioPhone: string;
  mauricioCallSid?: string;
  attemptCount: number;
  isEmergency?: boolean;
  status: "pending" | "screening" | "connected" | "voicemail" | "completed" | "failed";
  voicemailRecordingUrl?: string;
};

export type AssistantCostRecord = {
  id: string;
  createdAt: string;
  provider: "elevenlabs" | "openai" | "twilio" | "other";
  category: "tts" | "llm" | "telephony" | "other";
  callSid?: string;
  unitCount: number;
  unitLabel: string;
  estimatedUsd?: number;
  detail?: string;
};

export type AssistantParityRecord = {
  id: string;
  createdAt: string;
  dayKey: string;
  callerLabel: string;
  normalQuestionPass: boolean;
  pressZeroPass: boolean;
  emergencyTransferPass: boolean;
  smsNumber1Pass: boolean;
  smsNumber2Pass: boolean;
  notes: string;
  overallPass: boolean;
};

export type AssistantSpamRuleRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  type: "allow" | "deny";
  matchType: "phone" | "callerName" | "keyword";
  value: string;
  label: string;
  active: boolean;
  notes: string;
};

export type AssistantSpamReviewRecord = {
  id: string;
  createdAt: string;
  phone: string;
  callerName: string;
  transcript: string;
  reason: string;
  blocked: boolean;
  notes: string;
};

type AssistantStoreShape = {
  leads: AssistantLeadRecord[];
  actions: AssistantActionRecord[];
  threads: TextThreadRecord[];
  costs: AssistantCostRecord[];
  mauricioTransfers: MauricioTransferRecord[];
  parity: AssistantParityRecord[];
  spamRules: AssistantSpamRuleRecord[];
  spamReviews: AssistantSpamReviewRecord[];
};

const MAX_LEADS = 5000;
const MAX_ACTIONS = 5000;
const MAX_THREADS = 1000;
const MAX_COSTS = 10000;
const MAX_MAURICIO_TRANSFERS = 500;
const MAX_PARITY = 1000;
const MAX_SPAM_RULES = 2000;
const MAX_SPAM_REVIEWS = 5000;

const dataDir = join(process.cwd(), "data");
const dataFile = join(dataDir, "assistant-store.json");

const memoryStore: AssistantStoreShape = {
  leads: [],
  actions: [],
  threads: [],
  costs: [],
  mauricioTransfers: [],
  parity: [],
  spamRules: [],
  spamReviews: [],
};

function normalizePhoneDigits(value: string) {
  return String(value || "").replace(/\D+/g, "");
}

export function normalizePhoneForE164(value: string) {
  const digits = normalizePhoneDigits(value);
  if (!digits) return "";
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  return String(value || "").trim();
}

function nowIso() {
  return new Date().toISOString();
}

function createThreadCode() {
  return randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
}

async function readStore(): Promise<AssistantStoreShape> {
  try {
    const raw = await readFile(dataFile, "utf8");
    const parsed = JSON.parse(raw) as Partial<AssistantStoreShape>;
    return {
      leads: Array.isArray(parsed.leads) ? parsed.leads : [],
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
      threads: Array.isArray(parsed.threads) ? parsed.threads : [],
      costs: Array.isArray(parsed.costs) ? parsed.costs : [],
      mauricioTransfers: Array.isArray(parsed.mauricioTransfers) ? parsed.mauricioTransfers : [],
      parity: Array.isArray(parsed.parity) ? parsed.parity : [],
      spamRules: Array.isArray(parsed.spamRules) ? parsed.spamRules : [],
      spamReviews: Array.isArray(parsed.spamReviews) ? parsed.spamReviews : [],
    };
  } catch {
    return { ...memoryStore };
  }
}

async function writeStore(store: AssistantStoreShape) {
  memoryStore.leads = store.leads;
  memoryStore.actions = store.actions;
  memoryStore.threads = store.threads;
  memoryStore.costs = store.costs;
  memoryStore.mauricioTransfers = store.mauricioTransfers;
  memoryStore.parity = store.parity;
  memoryStore.spamRules = store.spamRules;
  memoryStore.spamReviews = store.spamReviews;

  try {
    await mkdir(dataDir, { recursive: true });
    await writeFile(dataFile, JSON.stringify(store, null, 2), "utf8");
  } catch {
    // Ignore disk write failures for serverless/read-only deployments.
  }
}

export async function appendAssistantLead(record: Omit<AssistantLeadRecord, "id" | "createdAt">) {
  const store = await readStore();
  store.leads.unshift({
    id: randomUUID(),
    createdAt: nowIso(),
    ...record,
  });
  store.leads = store.leads.slice(0, MAX_LEADS);
  await writeStore(store);
}

export async function listAssistantLeads(limit = 200) {
  const store = await readStore();
  return store.leads.slice(0, Math.max(1, limit));
}

export async function appendAssistantAction(record: Omit<AssistantActionRecord, "id" | "createdAt">) {
  const store = await readStore();
  store.actions.unshift({
    id: randomUUID(),
    createdAt: nowIso(),
    ...record,
  });
  store.actions = store.actions.slice(0, MAX_ACTIONS);
  await writeStore(store);
}

export async function listAssistantActions(limit = 200) {
  const store = await readStore();
  return store.actions.slice(0, Math.max(1, limit));
}

export async function listTextThreads(limit = 100) {
  const store = await readStore();
  return store.threads.slice(0, Math.max(1, limit));
}

export async function findTextThreadByCode(code: string) {
  const store = await readStore();
  const normalized = String(code || "").trim().toUpperCase();
  return store.threads.find((thread) => thread.status !== "closed" && thread.code === normalized) || null;
}

export async function findTextThreadByCustomerPhone(phone: string) {
  const store = await readStore();
  const normalized = normalizePhoneForE164(phone);
  return store.threads.find((thread) => thread.status !== "closed" && thread.customerPhone === normalized) || null;
}

export async function findLatestPendingThreadByTechnicianPhone(phone: string) {
  const store = await readStore();
  const normalized = normalizePhoneForE164(phone);
  return store.threads.find((thread) => thread.status === "pending" && thread.technicianPhone === normalized) || null;
}

export async function findLatestActiveThreadByTechnicianPhone(phone: string) {
  const store = await readStore();
  const normalized = normalizePhoneForE164(phone);
  return store.threads.find((thread) => thread.status === "active" && thread.technicianPhone === normalized) || null;
}

export async function setTextThreadStatus(params: { code: string; status: TextThreadRecord["status"] }) {
  const store = await readStore();
  const code = String(params.code || "").trim().toUpperCase();
  const thread = store.threads.find((item) => item.code === code) || null;

  if (!thread) {
    return { ok: false, detail: "Thread not found." };
  }

  thread.status = params.status;
  thread.lastMessageAt = nowIso();
  thread.messages.push({ at: nowIso(), from: "system", body: `Thread status updated to ${params.status}.` });
  await writeStore(store);
  return { ok: true, thread };
}

export async function openOrReuseTextThread(params: {
  leadId: string;
  customerPhone: string;
  technicianPhone: string;
}) {
  const store = await readStore();
  const customerPhone = normalizePhoneForE164(params.customerPhone);
  const technicianPhone = normalizePhoneForE164(params.technicianPhone);

  if (!customerPhone || !technicianPhone) {
    return { ok: false, detail: "Both customer and technician phones are required." as const };
  }

  const existing = store.threads.find((thread) => thread.status !== "closed" && thread.customerPhone === customerPhone) || null;

  if (existing) {
    existing.lastMessageAt = nowIso();
    existing.messages.push({
      at: nowIso(),
      from: "system",
      body: "Thread reused.",
    });
    await writeStore(store);
    return { ok: true, reused: true, thread: existing };
  }

  const created: TextThreadRecord = {
    id: randomUUID(),
    code: createThreadCode(),
    leadId: params.leadId || randomUUID(),
    customerPhone,
    technicianPhone,
    openedAt: nowIso(),
    lastMessageAt: nowIso(),
    status: "pending",
    messages: [{ at: nowIso(), from: "system", body: "Thread opened." }],
  };

  store.threads.unshift(created);
  store.threads = store.threads.slice(0, MAX_THREADS);
  await writeStore(store);
  return { ok: true, reused: false, thread: created };
}

export async function appendThreadMessage(params: {
  code: string;
  from: TextThreadMessage["from"];
  body: string;
}) {
  const store = await readStore();
  const code = String(params.code || "").trim().toUpperCase();
  const thread = store.threads.find((item) => item.status !== "closed" && item.code === code) || null;

  if (!thread) {
    return { ok: false, detail: "Thread not found." };
  }

  thread.lastMessageAt = nowIso();
  thread.messages.push({ at: nowIso(), from: params.from, body: String(params.body || "").trim() });
  await writeStore(store);

  return { ok: true, thread };
}

export async function appendAssistantCost(record: Omit<AssistantCostRecord, "id" | "createdAt">) {
  const store = await readStore();
  store.costs.unshift({
    id: randomUUID(),
    createdAt: nowIso(),
    ...record,
  });
  store.costs = store.costs.slice(0, MAX_COSTS);
  await writeStore(store);
}

export async function listAssistantCosts(limit = 500) {
  const store = await readStore();
  return store.costs.slice(0, Math.max(1, limit));
}

export async function createMauricioTransferSession(record: Omit<MauricioTransferRecord, "id" | "createdAt" | "updatedAt" | "status" | "attemptCount"> & { attemptCount?: number }) {
  const store = await readStore();
  const createdAt = nowIso();
  const session: MauricioTransferRecord = {
    id: randomUUID(),
    createdAt,
    updatedAt: createdAt,
    lastAttemptAt: createdAt,
    status: "pending",
    ...record,
    attemptCount: record.attemptCount ?? 0,
  };

  store.mauricioTransfers.unshift(session);
  store.mauricioTransfers = store.mauricioTransfers.slice(0, MAX_MAURICIO_TRANSFERS);
  await writeStore(store);
  return session;
}

export async function findMauricioTransferSessionByConference(conferenceName: string) {
  const store = await readStore();
  const normalized = String(conferenceName || "").trim();
  return store.mauricioTransfers.find((session) => session.conferenceName === normalized) || null;
}

export async function findMauricioTransferSessionByMauricioCallSid(callSid: string) {
  const store = await readStore();
  const normalized = String(callSid || "").trim();
  return store.mauricioTransfers.find((session) => session.mauricioCallSid === normalized) || null;
}

export async function updateMauricioTransferSession(conferenceName: string, patch: Partial<MauricioTransferRecord>) {
  const store = await readStore();
  const normalized = String(conferenceName || "").trim();
  const session = store.mauricioTransfers.find((item) => item.conferenceName === normalized) || null;

  if (!session) {
    return { ok: false as const, detail: "Mauricio transfer session not found." };
  }

  Object.assign(session, patch, { updatedAt: nowIso() });
  await writeStore(store);
  return { ok: true as const, session };
}

export async function appendAssistantParity(record: Omit<AssistantParityRecord, "id" | "createdAt">) {
  const store = await readStore();
  store.parity.unshift({
    id: randomUUID(),
    createdAt: nowIso(),
    ...record,
  });
  store.parity = store.parity.slice(0, MAX_PARITY);
  await writeStore(store);
}

export async function listAssistantParity(limit = 200) {
  const store = await readStore();
  return store.parity.slice(0, Math.max(1, limit));
}

export async function listAssistantSpamRules(limit = 500) {
  const store = await readStore();
  return store.spamRules.slice(0, Math.max(1, limit));
}

export async function upsertAssistantSpamRule(record: Omit<AssistantSpamRuleRecord, "id" | "createdAt" | "updatedAt"> & { id?: string }) {
  const store = await readStore();
  const now = nowIso();
  const normalizedValue = String(record.value || "").trim();
  const existing = record.id
    ? store.spamRules.find((item) => item.id === record.id) || null
    : store.spamRules.find((item) => item.type === record.type && item.matchType === record.matchType && item.value.toLowerCase() === normalizedValue.toLowerCase()) || null;

  if (existing) {
    existing.type = record.type;
    existing.matchType = record.matchType;
    existing.value = normalizedValue;
    existing.label = String(record.label || existing.label || normalizedValue).trim();
    existing.active = record.active;
    existing.notes = String(record.notes || "").trim();
    existing.updatedAt = now;
    await writeStore(store);
    return existing;
  }

  const created: AssistantSpamRuleRecord = {
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
    type: record.type,
    matchType: record.matchType,
    value: normalizedValue,
    label: String(record.label || normalizedValue).trim(),
    active: record.active,
    notes: String(record.notes || "").trim(),
  };

  store.spamRules.unshift(created);
  store.spamRules = store.spamRules.slice(0, MAX_SPAM_RULES);
  await writeStore(store);
  return created;
}

export async function removeAssistantSpamRule(id: string) {
  const store = await readStore();
  const before = store.spamRules.length;
  store.spamRules = store.spamRules.filter((item) => item.id !== id);
  await writeStore(store);
  return { ok: store.spamRules.length !== before };
}

export async function appendAssistantSpamReview(record: Omit<AssistantSpamReviewRecord, "id" | "createdAt">) {
  const store = await readStore();
  store.spamReviews.unshift({
    id: randomUUID(),
    createdAt: nowIso(),
    ...record,
  });
  store.spamReviews = store.spamReviews.slice(0, MAX_SPAM_REVIEWS);
  await writeStore(store);
}

export async function listAssistantSpamReviews(limit = 200) {
  const store = await readStore();
  return store.spamReviews.slice(0, Math.max(1, limit));
}
