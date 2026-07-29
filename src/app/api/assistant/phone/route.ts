import { NextResponse } from "next/server";
import {
  buildFlowForIntent,
  decodePhoneAssistantState,
  detectYesNo,
  detectPhoneInterruptIntent,
  detectPhoneIntent,
  encodePhoneAssistantState,
  groundedPhoneAnswer,
  normalizePhoneDigits,
  phoneAssistantGreeting,
  promptForStep,
  summarizeCollectedData,
  type PhoneAssistantState,
} from "@/lib/phoneAssistantFlow";
import {
  appendAssistantLead,
  appendAssistantSpamReview,
  createMauricioTransferSession,
  findMauricioTransferSessionByConference,
  listAssistantSpamRules,
  type MauricioTransferRecord,
  updateMauricioTransferSession,
} from "@/lib/assistantStore";
import { getTwilioConfig, sendTwilioSms } from "@/lib/twilio";
import { assistantBusinessFacts } from "@/lib/assistantKnowledge";
import { retrieveRelevantKnowledge, type RetrievedChunk } from "@/lib/assistantKnowledgeBase";
import { getOpenAiRealtimeSipUri } from "@/lib/openAiRealtimePhone";

function escapeXml(value: string) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function getPublicBaseUrl() {
  const configured = (process.env.NEXT_PUBLIC_SITE_URL || process.env.PUBLIC_BASE_URL || "https://ashaac.com").trim();
  return configured.replace(/\/$/, "");
}

function envFirst(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === "string" && value.trim()) {
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
  if (chunks.length === 0) return "";
  return chunks
    .map((chunk, index) => `[${index + 1}] ${chunk.title} (${chunk.url})\n${chunk.content}`)
    .join("\n\n");
}

function sanitizeForVoice(text: string) {
  const withoutSources = String(text || "").replace(/\n\s*Sources:[\s\S]*$/i, "");
  const withoutCitations = withoutSources.replace(/\[\d{1,2}\]/g, "");
  const withoutUrls = withoutCitations.replace(/https?:\/\/\S+/gi, "");
  return withoutUrls.replace(/\s+/g, " ").trim();
}

const shortHelpPrompt = "How can I help you? You can ask a question, request a visit, ask for status, or press 0 to ring the owner.";

function isSameDayVisitRequest(question: string) {
  const lower = String(question || "").toLowerCase();
  return /(same day|today|asap|right away|emergency|come today|visit today|come now)/.test(lower)
    && /(service|visit|repair|technician|hvac|ac|furnace|cooling|heating)/.test(lower);
}

function parseWindowStartMinutes(label: string) {
  const raw = String(label || "");
  const match = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return Number.POSITIVE_INFINITY;
  let hour = Number.parseInt(match[1], 10) % 12;
  const minute = Number.parseInt(match[2], 10);
  const meridiem = match[3].toUpperCase();
  if (meridiem === "PM") hour += 12;
  return hour * 60 + minute;
}

function currentMountainMinutes() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Denver",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const hour = Number(parts.find((part) => part.type === "hour")?.value || "0") % 24;
  const minute = Number(parts.find((part) => part.type === "minute")?.value || "0");
  return hour * 60 + minute;
}

function formatTwoHourWindow(startMinutes: number) {
  const clamp = Math.max(8 * 60, Math.min(22 * 60, startMinutes));
  const end = clamp + 120;
  const to12h = (total: number) => {
    const h24 = Math.floor(total / 60) % 24;
    const m = total % 60;
    const ampm = h24 >= 12 ? "PM" : "AM";
    const h12 = h24 % 12 || 12;
    return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
  };
  return `${to12h(clamp)} - ${to12h(end)}`;
}

function nextDefaultTwoHourWindow(nowMinutes: number) {
  const rounded = Math.ceil((nowMinutes + 30) / 60) * 60;
  return formatTwoHourWindow(rounded);
}

async function buildPostAnswerFollowup(request: Request, question: string) {
  if (!isSameDayVisitRequest(question)) {
    return {
      text: "Is there anything else I can help you with?",
      sameDayOffer: null as null | { date: string; window: string; question: string },
    };
  }

  const todayDate = normalizeBookingDate("today");
  const windows = await fetchAvailabilityForDate(request, todayDate).catch(() => [] as string[]);
  const valid = windows.filter((window) => !/Any time/i.test(window));

  if (valid.length === 0) {
    const suggestion = nextDefaultTwoHourWindow(currentMountainMinutes());
    return {
      text: `Would it work for you for a technician to come between ${suggestion} today?`,
      sameDayOffer: {
        date: todayDate,
        window: suggestion,
        question,
      },
    };
  }

  const now = currentMountainMinutes();
  const target = now + 30;
  const picked = valid
    .map((window) => ({ window, start: parseWindowStartMinutes(window) }))
    .sort((a, b) => a.start - b.start)
    .find((item) => Number.isFinite(item.start) && item.start >= target)
    || { window: valid[0], start: parseWindowStartMinutes(valid[0]) };

  return {
    text: `Would it work for you for a technician to come between ${picked.window} today?`,
    sameDayOffer: {
      date: todayDate,
      window: picked.window,
      question,
    },
  };
}

function formatAiVoiceReply(question: string, answer: string) {
  const cleanedAnswer = sanitizeForVoice(answer);
  if (!cleanedAnswer) {
    return "I could not find a clear answer right now. Please ask me again and I will do my best to help.";
  }

  const normalizedQuestion = sanitizeForVoice(question).toLowerCase();
  const normalizedAnswer = cleanedAnswer.toLowerCase();

  // If the model returns an echo-like answer, switch to a direct fallback prompt.
  if (normalizedQuestion && normalizedAnswer.includes(normalizedQuestion) && cleanedAnswer.length < 180) {
    const fallback = groundedPhoneAnswer(question);
    return `Here is what I found: ${fallback} Would you like me to book an appointment, schedule a callback, or connect you to a live technician via text and then he can decide to call you if he needs to?`;
  }

  const hasNextStep = /(book|appointment|callback|call back|technician|transfer)/i.test(cleanedAnswer);
  const closer = hasNextStep
    ? ""
    : " Would you like me to book an appointment, schedule a callback, or connect you to a live technician via text and then he can decide to call you if he needs to?";

  return `Here is what I found: ${cleanedAnswer}${closer}`.trim();
}

async function getPhoneAiAnswer(request: Request, question: string) {
  const prompt = String(question || "").trim();
  if (!prompt) {
    return groundedPhoneAnswer(question);
  }

  const apiKey = envFirst("OPENAI_API_KEY");
  const model = envFirst("OPENAI_CHAT_MODEL", "OPENAI_MODEL") || "gpt-4.1-mini";
  if (!apiKey) {
    return groundedPhoneAnswer(question);
  }

  const grounded = groundedPhoneAnswer(prompt);
  const retrieved = await retrieveRelevantKnowledge(prompt, 6).catch(() => [] as RetrievedChunk[]);
  const knowledgeContext = buildKnowledgeContext(retrieved);

  const systemPrompt = [
    "You are All Solutions AI Assistant for phone calls.",
    "Primary goal: book an appointment whenever the caller is service-ready.",
    "Secondary goals: schedule a callback or connect to a live technician when booking is not chosen.",
    "Answer clearly in plain language for a caller.",
    "Do not repeat the caller's full question back.",
    "Keep the answer short and directly useful.",
    "After answering, guide toward one next step: booking, callback, or live technician.",
    "When relevant, mention same-day service is based on technician availability.",
    "If caller asks for same-day service, propose a concrete time window and ask a yes/no confirmation.",
    "Grounding facts:",
    ...assistantBusinessFacts.map((fact) => `- ${fact}`),
    grounded ? `Grounded answer candidate: ${grounded}` : "",
    knowledgeContext ? `Retrieved website knowledge snippets:\n${knowledgeContext}` : "",
    "Never invent policy details.",
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
            content: [{ type: "input_text", text: prompt }],
          },
        ],
        max_output_tokens: 180,
      }),
    });

    if (!response.ok) {
      return groundedPhoneAnswer(question);
    }

    const payload = (await response.json().catch(() => null)) as unknown;
    const answer = sanitizeForVoice(extractResponseText(payload));
    if (!response.ok || !answer) {
      return groundedPhoneAnswer(question);
    }

    return answer;
  } catch {
    return groundedPhoneAnswer(question);
  }
}

function hasElevenLabsConfig() {
  return Boolean((process.env.ELEVENLABS_API_KEY || "").trim() && (process.env.ELEVENLABS_VOICE_ID || "").trim());
}

function buildSpeechNode(text: string, state?: PhoneAssistantState) {
  const spokenText = escapeXml(text);
  const voice = process.env.TWILIO_PHONE_ASSISTANT_VOICE || "Polly.Matthew";

  if (hasElevenLabsConfig()) {
    const callSidParam = state?.callSid ? `&callSid=${encodeURIComponent(state.callSid)}` : "";
    const ttsUrl = `${getPublicBaseUrl()}/api/assistant/phone/tts?text=${encodeURIComponent(text)}${callSidParam}`;
    return `<Play>${escapeXml(ttsUrl)}</Play>`;
  }

  return `<Say voice="${voice}" language="en-US">${spokenText}</Say>`;
}

function buildTypingSoundNode(question?: string) {
  // DTMF tone bursts simulate keyboard tapping without external audio hosting.
  const len = String(question || "").trim().length;
  const pattern = len >= 120
    ? "w12w34w56w78w90w*#w12w34w56w78w90w*#w1234w5678"
    : len >= 60
      ? "w12w34w56w78w90w*#w1234w5678"
      : "w12w34w56w78";
  return `<Play digits="${pattern}"/>`;
}

function getGatherHints(state?: PhoneAssistantState) {
  if (state?.intent === "mauricio") {
    return ["name", "first name", "first and last name"].join(", ");
  }

  if (!state || state.intent === "menu") {
    return [
      "appointment",
      "book appointment",
      "same day service",
      "air conditioner repair",
      "furnace repair",
      "question about service",
      "transfer to technician",
      "text with a technician",
      "call me back",
      "appointment status",
      "reschedule appointment",
      "cancel appointment",
      "talk to Mauricio",
      "good bye",
    ].join(", ");
  }

  return [
    "yes",
    "no",
    "I don't have it",
    "question about service",
    "booking",
    "text with a technician",
  ].join(", ");
}

function toTwiml(text: string, options?: { gather?: boolean; state?: PhoneAssistantState; actionSuffix?: string }) {
  const stateParam = options?.state ? `state=${encodeURIComponent(encodePhoneAssistantState(options.state))}` : "";
  const action = `/api/assistant/phone${stateParam ? `?${stateParam}` : ""}${options?.actionSuffix || ""}`;
  const speechNode = buildSpeechNode(text, options?.state);

  if (options?.gather) {
    return `<?xml version="1.0" encoding="UTF-8"?><Response><Gather input="speech dtmf" action="${action}" actionOnEmptyResult="true" method="POST" speechTimeout="auto" timeout="8" bargeIn="true" hints="${escapeXml(getGatherHints(options?.state))}">${speechNode}</Gather></Response>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?><Response>${speechNode}</Response>`;
}

function toThinkingTwiml(text: string, options?: { state?: PhoneAssistantState; redirectSuffix?: string; question?: string }) {
  const stateParam = options?.state ? `state=${encodeURIComponent(encodePhoneAssistantState(options.state))}` : "";
  const suffix = options?.redirectSuffix || "mode=ai-answer";
  const joiner = stateParam ? "&" : "";
  const actionUrl = `/api/assistant/phone?${stateParam}${joiner}${suffix}`;
  const speechNode = buildSpeechNode(text, options?.state);
  const pending = options?.state ? readPendingAiQuestion(options.state) : "";
  const typingNode = buildTypingSoundNode(options?.question || pending);
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Gather input="speech dtmf" action="${escapeXml(actionUrl)}" actionOnEmptyResult="true" method="POST" speechTimeout="auto" timeout="6" bargeIn="true" hints="${escapeXml(getGatherHints(options?.state))}">${speechNode}${typingNode}<Pause length="1"/></Gather></Response>`;
}

const PENDING_AI_QUESTION_KEY = "_pendingAiQuestion";
const EMERGENCY_FLAG_KEY = "_emergencyFlag";
const OWNER_ASSISTANT_FLAG_KEY = "_ownerAssistantCaller";
const POST_INTRO_SUPPORT_PENDING_KEY = "_postIntroSupportPending";
const SAME_DAY_OFFER_PENDING_KEY = "_sameDayOfferPending";
const SAME_DAY_OFFER_DATE_KEY = "_sameDayOfferDate";
const SAME_DAY_OFFER_WINDOW_KEY = "_sameDayOfferWindow";
const SAME_DAY_OFFER_QUESTION_KEY = "_sameDayOfferQuestion";

function withPendingAiQuestion(state: PhoneAssistantState, question: string): PhoneAssistantState {
  return {
    ...state,
    data: {
      ...state.data,
      [PENDING_AI_QUESTION_KEY]: String(question || "").trim(),
    },
  };
}

function clearPendingAiQuestion(state: PhoneAssistantState): PhoneAssistantState {
  const data = { ...state.data };
  delete data[PENDING_AI_QUESTION_KEY];
  return { ...state, data };
}

function readPendingAiQuestion(state: PhoneAssistantState) {
  return String(state.data[PENDING_AI_QUESTION_KEY] || "").trim();
}

function withEmergencyFlag(state: PhoneAssistantState, emergency: boolean) {
  if (!emergency) return state;
  return {
    ...state,
    data: {
      ...state.data,
      [EMERGENCY_FLAG_KEY]: "1",
    },
  };
}

function isEmergencyState(state: PhoneAssistantState) {
  return String(state.data[EMERGENCY_FLAG_KEY] || "") === "1";
}

function withOwnerAssistantFlag(state: PhoneAssistantState, ownerAssistant: boolean) {
  if (!ownerAssistant) return state;
  return {
    ...state,
    data: {
      ...state.data,
      [OWNER_ASSISTANT_FLAG_KEY]: "1",
    },
  };
}

function isOwnerAssistantState(state: PhoneAssistantState) {
  return String(state.data[OWNER_ASSISTANT_FLAG_KEY] || "") === "1";
}

function withPostIntroSupportPending(state: PhoneAssistantState, pending: boolean) {
  const data = { ...state.data };
  if (pending) {
    data[POST_INTRO_SUPPORT_PENDING_KEY] = "1";
  } else {
    delete data[POST_INTRO_SUPPORT_PENDING_KEY];
  }
  return { ...state, data };
}

function isPostIntroSupportPending(state: PhoneAssistantState) {
  return String(state.data[POST_INTRO_SUPPORT_PENDING_KEY] || "") === "1";
}

function supportChoicePrompt() {
  return "Would you like to leave a message, send or receive a text, or receive a call back?";
}

function resolveSupportIntent(text: string): "callback" | "sms-technician" | "unknown" {
  const lower = String(text || "").toLowerCase();
  if (/(call\s*back|callback|call me back|receive a call back)/.test(lower)) return "callback";
  if (/(text|sms|send a text|receive a text|message me)/.test(lower)) return "sms-technician";
  if (/(leave a message|voicemail|voice mail|message)/.test(lower)) return "callback";
  return "unknown";
}

function withSameDayOfferContext(state: PhoneAssistantState, offer: { date: string; window: string; question: string }) {
  return {
    ...state,
    data: {
      ...state.data,
      [SAME_DAY_OFFER_PENDING_KEY]: "1",
      [SAME_DAY_OFFER_DATE_KEY]: offer.date,
      [SAME_DAY_OFFER_WINDOW_KEY]: offer.window,
      [SAME_DAY_OFFER_QUESTION_KEY]: offer.question,
    },
  };
}

function clearSameDayOfferContext(state: PhoneAssistantState) {
  const data = { ...state.data };
  delete data[SAME_DAY_OFFER_PENDING_KEY];
  delete data[SAME_DAY_OFFER_DATE_KEY];
  delete data[SAME_DAY_OFFER_WINDOW_KEY];
  delete data[SAME_DAY_OFFER_QUESTION_KEY];
  return { ...state, data };
}

function readSameDayOfferContext(state: PhoneAssistantState) {
  const pending = String(state.data[SAME_DAY_OFFER_PENDING_KEY] || "") === "1";
  const date = String(state.data[SAME_DAY_OFFER_DATE_KEY] || "").trim();
  const window = String(state.data[SAME_DAY_OFFER_WINDOW_KEY] || "").trim();
  const question = String(state.data[SAME_DAY_OFFER_QUESTION_KEY] || "").trim();
  return { pending, date, window, question };
}

async function readTwilioPayload(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  const payload: Record<string, string> = {};

  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    for (const [key, value] of form.entries()) {
      payload[key] = String(value || "");
    }
    return payload;
  }

  const json = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!json) return payload;

  for (const [key, value] of Object.entries(json)) {
    payload[key] = String(value || "");
  }
  return payload;
}

async function sendSmsToCaller(to: string, body: string) {
  if (!to) return;

  const twilio = getTwilioConfig();
  if (!twilio.configured || !twilio.fromSms) return;

  await sendTwilioSms({
    sid: twilio.sid,
    token: twilio.token,
    from: twilio.fromSms,
    to,
    body,
  }).catch(() => null);
}

async function sendOwnerAlertSms(body: string) {
  const twilio = getTwilioConfig();
  const to = resolveOwnerDirectDial();
  if (!twilio.configured || !twilio.fromSms || !to) return;

  await sendTwilioSms({
    sid: twilio.sid,
    token: twilio.token,
    from: twilio.fromSms,
    to,
    body,
  }).catch(() => null);
}

async function sendMauricioAttemptSms(session: MauricioTransferRecord) {
  if (!session.isEmergency) return;

  const twilio = getTwilioConfig();
  const to = toE164(session.mauricioPhone || resolveMauricioPhone());
  if (!twilio.configured || !twilio.fromSms || !to) return;

  const body = `Emergency caller waiting: ${session.callerName || "Customer"}, phone ${session.callerPhone || "unknown"}. Attempt ${session.attemptCount + 1}. Please answer immediately.`;
  await sendTwilioSms({
    sid: twilio.sid,
    token: twilio.token,
    from: twilio.fromSms,
    to,
    body,
  }).catch(() => null);
}

async function sendMauricioMessage(message: string) {
  const twilio = getTwilioConfig();
  const to = toE164(resolveMauricioPhone());
  if (!twilio.configured || !twilio.fromSms || !to) return;

  await sendTwilioSms({
    sid: twilio.sid,
    token: twilio.token,
    from: twilio.fromSms,
    to,
    body: message,
  }).catch(() => null);
}

async function fetchAvailabilityForDate(request: Request, date: string) {
  const url = new URL(request.url);
  const endpoint = new URL("/api/book/availability", url.origin).toString();
  const response = await fetch(endpoint, { method: "GET", cache: "no-store" });
  const payload = (await response.json().catch(() => null)) as { slots?: Array<{ date?: string; windows?: string[] }> } | null;
  const slots = Array.isArray(payload?.slots) ? payload!.slots : [];
  const slot = slots.find((item) => String(item.date || "") === date);
  return Array.isArray(slot?.windows) ? slot!.windows : [];
}

async function callLocalApi(request: Request, path: string, body: Record<string, unknown>) {
  const url = new URL(request.url);
  const endpoint = new URL(path, url.origin).toString();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  return { response, data };
}

function currentStepLabel(stepKey: string) {
  const base = promptForStep(stepKey as Parameters<typeof promptForStep>[0]);
  return `${base} Take your time.`;
}

function mauricioNamePrompt() {
  return "Please state your name.";
}

function keepConversationGoing(message: string) {
  return `${message} Would you like help with anything else?`;
}

function excuseMePrompt(message: string) {
  return `Excuse me, what did you say? ${message}`;
}

function didYouSayPrompt(heard: string, nextPrompt: string) {
  const normalized = String(heard || "").replace(/\s+/g, " ").trim();
  const clipped = normalized.length > 120 ? `${normalized.slice(0, 117)}...` : normalized;
  if (!clipped) {
    return excuseMePrompt(nextPrompt);
  }
  return `Excuse me, did you say, ${clipped}? ${nextPrompt}`;
}

function toE164(raw: string) {
  const value = String(raw || "").trim();
  if (!value) return "";

  if (/^\+\d{10,15}$/.test(value)) {
    return value;
  }

  const digits = normalizePhoneDigits(value);
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  if (digits.length === 10) {
    return `+1${digits}`;
  }

  return digits ? `+${digits}` : "";
}

function isEmergencyText(value: string) {
  const lower = String(value || "").toLowerCase();
  return /(emergency|urgent|asap|right now|immediately|no heat|no cooling|gas smell|water leak|unsafe|after hours)/.test(lower);
}

function normalizeBookingServiceType(value: string) {
  const lower = String(value || "").toLowerCase();
  if (/replace|replacement|new system|install/.test(lower)) return "System replacement estimate";
  if (/tune|maintenance|seasonal/.test(lower)) return "Seasonal tune-up";
  if (/mini\s*split/.test(lower)) return "Mini-split consultation";
  if (/heat\s*pump/.test(lower)) return "Heat pump consultation";
  if (/second opinion/.test(lower)) return "Second opinion";
  return "Repair diagnostic";
}

function normalizeBookingCity(value: string) {
  const lower = String(value || "").toLowerCase();
  if (lower.includes("west jordan")) return "West Jordan";
  if (lower.includes("south jordan")) return "South Jordan";
  if (lower.includes("sandy")) return "Sandy";
  if (lower.includes("murray")) return "Murray";
  if (lower.includes("midvale")) return "Midvale";
  if (lower.includes("taylorsville")) return "Taylorsville";
  if (lower.includes("draper")) return "Draper";
  if (lower.includes("salt lake")) return "Salt Lake City";
  return "West Jordan";
}

function normalizeBookingWindow(value: string) {
  const lower = String(value || "").toLowerCase();
  if (/any\s*time|anytime|whenever/.test(lower)) return "Any time (24-hour availability)";
  if (/8|eight/.test(lower) && /10|ten/.test(lower)) return "8:00 AM - 10:00 AM";
  if (/10|ten/.test(lower) && /12|twelve/.test(lower)) return "10:00 AM - 12:00 PM";
  if (/12|twelve/.test(lower) && /2|two/.test(lower)) return "12:00 PM - 2:00 PM";
  if (/2|two/.test(lower) && /4|four/.test(lower)) return "2:00 PM - 4:00 PM";
  if (/4|four/.test(lower) && /6|six/.test(lower)) return "4:00 PM - 6:00 PM";
  if (/6|six/.test(lower) && /8|eight/.test(lower)) return "6:00 PM - 8:00 PM";
  if (/8|eight/.test(lower) && /10|ten/.test(lower) && /pm/.test(lower)) return "8:00 PM - 10:00 PM";
  if (/10|ten/.test(lower) && /11|eleven/.test(lower)) return "10:00 PM - 11:00 PM";
  if (/morning/.test(lower)) return "8:00 AM - 10:00 AM";
  if (/afternoon/.test(lower)) return "2:00 PM - 4:00 PM";
  if (/evening/.test(lower) || /night/.test(lower)) return "6:00 PM - 8:00 PM";
  return "Any time (24-hour availability)";
}

function normalizeBookingDate(value: string) {
  const lower = String(value || "").toLowerCase().trim();
  const now = new Date();
  const mountain = new Date(now.toLocaleString("en-US", { timeZone: "America/Denver" }));
  const format = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  if (/today/.test(lower)) return format(mountain);
  if (/tomorrow/.test(lower)) {
    const t = new Date(mountain);
    t.setDate(t.getDate() + 1);
    return format(t);
  }

  const iso = lower.match(/\b(20\d{2})[-\s\/]?(\d{1,2})[-\s\/]?(\d{1,2})\b/);
  if (iso) {
    const y = iso[1];
    const m = String(Number.parseInt(iso[2], 10)).padStart(2, "0");
    const d = String(Number.parseInt(iso[3], 10)).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  return format(mountain);
}

function normalizeEmailFromSpeech(value: string) {
  const normalized = String(value || "")
    .toLowerCase()
    .replace(/\s+at\s+/g, "@")
    .replace(/\s+dot\s+/g, ".")
    .replace(/\s+/g, "");

  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalized)) {
    return normalized;
  }

  return "";
}

function isOutOfScopeQuestion(question: string) {
  const text = String(question || "").toLowerCase().trim();
  if (!text) return false;

  const inScopeKeywords = [
    "hvac",
    "ac",
    "air conditioner",
    "cooling",
    "furnace",
    "heating",
    "heat pump",
    "mini split",
    "thermostat",
    "duct",
    "water heater",
    "estimate",
    "quote",
    "book",
    "appointment",
    "service",
    "repair",
    "install",
    "maintenance",
    "emergency",
    "same day",
    "callback",
    "technician",
    "west jordan",
    "south jordan",
    "riverton",
    "midvale",
    "salt lake",
  ];

  return !inScopeKeywords.some((keyword) => text.includes(keyword));
}

function resolveMauricioPhone() {
  const configured = (process.env.MAURICIO_PHONE || "8017553040").trim();
  return toE164(configured) || "+18017553040";
}

function resolveOwnerDirectDial() {
  return toE164((process.env.OWNER_DIRECT_DIAL || "8017553040").trim()) || "+18017553040";
}

function isOwnerAssistantCaller(fromE164: string, incomingText: string) {
  const allowlistRaw = envFirst("OWNER_ASSISTANT_PHONES");
  const allowlist = allowlistRaw
    ? allowlistRaw.split(",").map((value) => toE164(value.trim())).filter(Boolean)
    : [resolveOwnerDirectDial()];

  if (fromE164 && allowlist.includes(fromE164)) {
    return true;
  }

  const lower = String(incomingText || "").toLowerCase();
  return /(owner|assistant\s+to\s+the\s+owner|office\s+manager|office\s+assistant)/.test(lower);
}

function isTrustedCaller(fromE164: string) {
  const trusted = new Set<string>();
  const owner = resolveOwnerDirectDial();
  if (owner) trusted.add(owner);
  const mauricio = resolveMauricioPhone();
  if (mauricio) trusted.add(mauricio);

  const allowlistRaw = envFirst("OWNER_ASSISTANT_PHONES", "TRUSTED_CALLER_PHONES");
  if (allowlistRaw) {
    for (const value of allowlistRaw.split(",")) {
      const normalized = toE164(value.trim());
      if (normalized) trusted.add(normalized);
    }
  }

  const twilio = getTwilioConfig();
  for (const value of [twilio.fromCall, twilio.fromSms, envFirst("TWILIO_FROM_NUMBER")]) {
    const normalized = toE164(value);
    if (normalized) trusted.add(normalized);
  }

  const twilioNumbers = envFirst("TWILIO_PHONE_NUMBERS");
  if (twilioNumbers) {
    for (const value of twilioNumbers.split(/[,;\s]+/)) {
      const normalized = toE164(value.trim());
      if (normalized) trusted.add(normalized);
    }
  }

  return Boolean(fromE164 && trusted.has(fromE164));
}

function isTollFreeCaller(fromE164: string) {
  const digits = normalizePhoneDigits(fromE164);
  const ten = digits.length >= 10 ? digits.slice(-10) : digits;
  const areaCode = ten.slice(0, 3);
  return ["800", "833", "844", "855", "866", "877", "888"].includes(areaCode);
}

function isUtahAreaCode(fromE164: string) {
  const digits = normalizePhoneDigits(fromE164);
  const ten = digits.length >= 10 ? digits.slice(-10) : digits;
  const areaCode = ten.slice(0, 3);
  return ["801", "385", "435"].includes(areaCode);
}

function hasDebtCollectorKeywords(text: string) {
  const lower = String(text || "").toLowerCase();
  if (!lower.trim()) return false;

  const patterns = [
    /portfolio\s+recovery/,
    /portfolio\s+recovery\s+associates/,
    /debt\s+collector/,
    /attempt\s+to\s+collect\s+a\s+debt/,
    /collect\s+a\s+debt/,
    /mini\s+miranda/,
  ];

  return patterns.some((pattern) => pattern.test(lower));
}

function hasSpamCallerName(callerName: string) {
  const lower = String(callerName || "").toLowerCase().trim();
  if (!lower) return false;

  const patterns = [
    /portfolio\s+recovery/,
    /portfolio\s+recovery\s+associates/,
    /citibank/,
    /citi\b/,
    /wells\s+fargo/,
    /debt\s+collection/,
    /credit\s+solutions/,
    /loan\s+center/,
    /warranty/,
    /telemark/,
  ];

  return patterns.some((pattern) => pattern.test(lower));
}

function hasSpamKeywords(text: string) {
  const lower = String(text || "").toLowerCase();
  if (!lower.trim()) return false;

  const spamPatterns = [
    /this\s+call\s+(may\s+be|is)\s+recorded/,
    /recorded\s+line/,
    /press\s+(one|1|two|2|three|3)/,
    /pre-?approved\s+for\s+(a\s+)?loan/,
    /prequalified\s+for\s+(a\s+)?loan/,
    /loan\s+forgiveness/,
    /auto(?:\s+|-)warranty/,
    /extended\s+warranty/,
    /vehicle\s+warranty/,
    /credit\s+card\s+(debt|relief|rate)/,
    /student\s+loan/,
    /tax\s+debt/,
    /debt\s+collector/,
    /merchant\s+cash\s+advance/,
    /business\s+line\s+of\s+credit/,
    /working\s+capital/,
    /google\s+business\s+profile/,
    /seo\s+services?/,
    /website\s+traffic/,
    /medicare/,
    /health\s+insurance/,
    /final\s+expense/,
    /solar\s+panels?/,
    /timeshare/,
    /home\s+security/,
    /claim\s+your\s+benefits/,
  ];

  return spamPatterns.some((pattern) => pattern.test(lower));
}

function isSuspiciousCaller(fromE164: string, incomingText: string, callerName: string) {
  if (isTrustedCaller(fromE164)) return false;
  if (isTollFreeCaller(fromE164)) return true;
  if (hasSpamCallerName(callerName)) return true;
  if (hasDebtCollectorKeywords(callerName) || hasDebtCollectorKeywords(incomingText)) return true;
  if (hasSpamKeywords(incomingText)) return true;
  if (fromE164 && !isUtahAreaCode(fromE164) && String(incomingText || "").trim()) return true;
  return false;
}

type SpamDecision = {
  blocked: boolean;
  reason: string;
};

async function getSpamDecision(fromE164: string, incomingText: string, callerName: string): Promise<SpamDecision> {
  if (isTrustedCaller(fromE164)) return { blocked: false, reason: "trusted-caller" };

  const rules = await listAssistantSpamRules(1000).catch(() => []);
  const activeRules = rules.filter((rule) => rule.active);

  const normalizedPhone = fromE164;
  const normalizedCaller = String(callerName || "").toLowerCase();
  const normalizedText = String(incomingText || "").toLowerCase();

  for (const rule of activeRules) {
    const ruleValue = String(rule.value || "").trim().toLowerCase();
    const matched = rule.matchType === "phone"
      ? Boolean(normalizedPhone && normalizedPhone === toE164(ruleValue))
      : rule.matchType === "callerName"
        ? normalizedCaller.includes(ruleValue)
        : normalizedText.includes(ruleValue);

    if (!matched) continue;
    return { blocked: rule.type === "deny", reason: `rule:${rule.type}:${rule.matchType}:${rule.label}` };
  }

  const autoReason = getSpamBlockReason(fromE164, incomingText, callerName);
  if (autoReason) {
    return { blocked: true, reason: autoReason };
  }

  if (isSuspiciousCaller(fromE164, incomingText, callerName)) {
    return { blocked: false, reason: "suspicious-review" };
  }

  return { blocked: false, reason: "clear" };
}

function isBlockedCallerNumber(fromE164: string) {
  const raw = envFirst("BLOCKED_CALLER_PHONES", "SPAM_CALLER_PHONES");
  if (!raw) return false;
  const blocked = raw.split(",").map((value) => toE164(value.trim())).filter(Boolean);
  return Boolean(fromE164 && blocked.includes(fromE164));
}

function getSpamBlockReason(fromE164: string, incomingText: string, callerName: string) {
  if (isTrustedCaller(fromE164)) return "";
  if (isBlockedCallerNumber(fromE164)) return "blocked-number";
  if (isTollFreeCaller(fromE164)) return "toll-free";
  if (hasSpamCallerName(callerName)) return "spam-caller-name";
  if (hasDebtCollectorKeywords(callerName) || hasDebtCollectorKeywords(incomingText)) return "debt-collector";
  if (hasSpamKeywords(incomingText)) return "spam-keywords";
  if (fromE164 && !isUtahAreaCode(fromE164) && /recorded|loan|debt|warranty|medicare|seo|google business|insurance/i.test(String(incomingText || ""))) {
    return "out-of-state-spam";
  }
  return "";
}

function spamHangupTwiml() {
  return hangupTwiml("This line does not accept solicitation calls. Goodbye.");
}

function resolveTwilioCallerId(attemptCount = 0) {
  const twilio = getTwilioConfig();
  const defaultMauricioOutboundFrom = "+16893886782";
  const configured = [
    process.env.MAURICIO_OUTBOUND_FROM || "",
    process.env.MAURICIO_OUTBOUND_FALLBACK_FROM || "",
    defaultMauricioOutboundFrom,
    twilio.fromCall,
    twilio.fromSms,
    process.env.TWILIO_FROM_NUMBER || "",
  ];

  const normalized = configured
    .map((value) => toE164(value))
    .filter(Boolean)
    .filter((value, index, list) => list.indexOf(value) === index);

  if (normalized.length === 0) return "";
  return normalized[Math.max(0, attemptCount) % normalized.length];
}

function hangupTwiml(message: string) {
  const speech = buildSpeechNode(message, undefined);
  return `<?xml version="1.0" encoding="UTF-8"?><Response>${speech}<Hangup/></Response>`;
}

function buildMauricioWaitTwiml(message: string) {
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Matthew" language="en-US">${escapeXml(message)}</Say><Pause length="4"/></Response>`;
}

function buildMauricioScreenTwiml(callerName: string, conferenceName: string) {
  const safeCallerName = escapeXml(callerName || "the caller");
  const actionUrl = `${getPublicBaseUrl()}/api/assistant/phone?mode=mauricio-screen&conference=${encodeURIComponent(conferenceName)}`;
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Matthew" language="en-US">${safeCallerName} is calling. Press 1 to answer the call. Press 2 to send the caller to voicemail.</Say><Gather input="dtmf" numDigits="1" timeout="12" action="${escapeXml(actionUrl)}" method="POST"><Say voice="Polly.Matthew" language="en-US">Press 1 to answer. Press 2 to send to voicemail.</Say></Gather><Say voice="Polly.Matthew" language="en-US">No response received. Goodbye.</Say><Hangup/></Response>`;
}

function buildMauricioJoinTwiml(conferenceName: string) {
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Matthew" language="en-US">Connecting now.</Say><Dial><Conference startConferenceOnEnter="true" endConferenceOnExit="true" beep="false">${escapeXml(conferenceName)}</Conference></Dial></Response>`;
}

function buildCallerConferenceTwiml(conferenceName: string) {
  const waitUrl = `${getPublicBaseUrl()}/api/assistant/phone?mode=mauricio-wait&conference=${encodeURIComponent(conferenceName)}`;
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Matthew" language="en-US">Transferring you to Mauricio now.</Say><Dial><Conference startConferenceOnEnter="false" endConferenceOnExit="true" waitUrl="${escapeXml(waitUrl)}" beep="false">${escapeXml(conferenceName)}</Conference></Dial></Response>`;
}

function buildOwnerDirectTransferTwiml() {
  const ownerPhone = resolveOwnerDirectDial();
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Matthew" language="en-US">Connecting you now.</Say><Dial>${escapeXml(ownerPhone)}</Dial></Response>`;
}

function buildRealtimeSipTwiml(state: PhoneAssistantState) {
  const sipUri = getOpenAiRealtimeSipUri();
  const completionUrl = `${getPublicBaseUrl()}/api/assistant/phone?mode=realtime-dial-complete`;
  const greeting = "Thank you for calling All Solutions. We offer free estimates, so one of our technicians can come to your desired location and disclose pricing before doing anything. Would you like to make an appointment?";
  return `<?xml version="1.0" encoding="UTF-8"?><Response>${buildSpeechNode(greeting, state)}<Dial answerOnBridge="true" action="${escapeXml(completionUrl)}" method="POST"><Sip>${escapeXml(sipUri)}</Sip></Dial></Response>`;
}

function buildCallerVoicemailTwiml(callerName: string, conferenceName: string) {
  const safeCallerName = escapeXml(callerName || "there");
  const completeUrl = `${getPublicBaseUrl()}/api/assistant/phone?mode=mauricio-voicemail-complete&conference=${encodeURIComponent(conferenceName)}`;
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Matthew" language="en-US">Hi ${safeCallerName}, Mauricio is unavailable right now. Please leave a message after the beep.</Say><Record maxLength="120" playBeep="true" finishOnKey="#" action="${escapeXml(completeUrl)}" method="POST"/><Say voice="Polly.Matthew" language="en-US">Thanks. Goodbye.</Say><Hangup/></Response>`;
}

function buildMauricioVoicemailTwiml(callerName: string) {
  const safeCallerName = escapeXml(callerName || "the caller");
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Matthew" language="en-US">Sorry, Mauricio is unavailable. ${safeCallerName} will be prompted to leave a message now.</Say><Hangup/></Response>`;
}

async function updateTwilioCallTwiml(callSid: string, twiml: string) {
  const twilio = getTwilioConfig();
  if (!twilio.configured) {
    return { ok: false as const, detail: "Twilio is not configured." };
  }

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilio.sid}/Calls/${encodeURIComponent(callSid)}.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${twilio.sid}:${twilio.token}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ Twiml: twiml }).toString(),
  });

  const text = await response.text().catch(() => "");
  if (!response.ok) {
    return { ok: false as const, detail: text || response.statusText };
  }

  return { ok: true as const, detail: text || "Call updated." };
}

async function placeMauricioScreeningCall(session: MauricioTransferRecord) {
  const twilio = getTwilioConfig();
  const from = resolveTwilioCallerId(session.attemptCount || 0);
  const mauricioPhone = session.mauricioPhone || resolveMauricioPhone();
  if (!twilio.configured || !from) {
    return { ok: false as const, detail: "Twilio call settings are not configured." };
  }

  const twiml = buildMauricioScreenTwiml(session.callerName, session.conferenceName);
  const statusCallback = `${getPublicBaseUrl()}/api/assistant/phone?mode=mauricio-status&conference=${encodeURIComponent(session.conferenceName)}`;
  await sendMauricioAttemptSms(session);

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilio.sid}/Calls.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${twilio.sid}:${twilio.token}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      From: from,
      To: mauricioPhone,
      Twiml: twiml,
      StatusCallback: statusCallback,
      StatusCallbackEvent: "initiated ringing answered completed",
      StatusCallbackMethod: "POST",
    }).toString(),
  });

  const text = await response.text().catch(() => "");
  if (!response.ok) {
    return { ok: false as const, detail: text || response.statusText };
  }

  const data = (() => {
    try {
      return JSON.parse(text) as { sid?: string };
    } catch {
      return null;
    }
  })();

  await updateMauricioTransferSession(session.conferenceName, {
    mauricioCallSid: data?.sid || "",
    attemptCount: (session.attemptCount || 0) + 1,
    lastAttemptAt: new Date().toISOString(),
    status: "screening",
  });

  return { ok: true as const, callSid: data?.sid || "", detail: text || "Mauricio screening call placed." };
}

async function tryRetryMauricio(conferenceName: string) {
  const session = await findMauricioTransferSessionByConference(conferenceName);
  if (!session) return;
  if (session.status === "connected" || session.status === "voicemail" || session.status === "completed") return;
  if (session.attemptCount >= 8) return;
  const lastAttemptAt = session.lastAttemptAt ? Date.parse(session.lastAttemptAt) : 0;
  if (lastAttemptAt && Date.now() - lastAttemptAt < 10000) return;
  await placeMauricioScreeningCall(session);
}

async function sendCallerToVoicemailFallback(session: MauricioTransferRecord, reason: string) {
  await updateMauricioTransferSession(session.conferenceName, {
    status: "voicemail",
    lastAttemptAt: new Date().toISOString(),
  });

  await updateTwilioCallTwiml(session.callerCallSid, buildCallerVoicemailTwiml(session.callerName, session.conferenceName));

  const callerE164 = toE164(session.callerPhone);
  if (callerE164) {
    await sendSmsToCaller(callerE164, `Mauricio is unavailable right now. Please leave a voicemail and we will return your call shortly. (${reason})`);
  }
}

const MAURICIO_MAX_ATTEMPTS = 3;

function getMauricioMaxAttempts(session: MauricioTransferRecord) {
  return session.isEmergency ? 8 : MAURICIO_MAX_ATTEMPTS;
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const payload = await readTwilioPayload(request);
  const mode = String(url.searchParams.get("mode") || "").trim();
  const realtimeFallback = url.searchParams.get("realtimeFallback") === "1";
  const conferenceName = String(url.searchParams.get("conference") || "").trim();
  const incomingState = decodePhoneAssistantState(url.searchParams.get("state"));
  const incomingText = String(payload.SpeechResult || payload.Digits || payload.Body || "").trim();
  const confidenceRaw = String(payload.Confidence || "").trim();
  const confidence = Number.parseFloat(confidenceRaw);
  const lowConfidence = Number.isFinite(confidence) && confidence < 0.45;
  const from = normalizePhoneDigits(payload.From || "");
  const fromE164 = toE164(payload.From || "");
  const callerName = String(payload.CallerName || payload.Caller || "").trim();
  const callSid = String(payload.CallSid || incomingState.callSid || "").trim();

  const state: PhoneAssistantState = { ...incomingState, callSid };

  if (mode === "realtime-dial-complete") {
    const dialStatus = String(payload.DialCallStatus || "").trim().toLowerCase();
    if (dialStatus === "completed") {
      return new NextResponse(hangupTwiml("Thank you for calling All Solutions. Goodbye."), {
        headers: { "Content-Type": "text/xml" },
      });
    }

    return new NextResponse(
      toTwiml("Would you like to make an appointment?", {
        gather: true,
        state,
      }),
      { headers: { "Content-Type": "text/xml" } },
    );
  }

  const spamDecision = await getSpamDecision(fromE164, incomingText, callerName);

  if (String(payload.Digits || "").trim() === "0" && mode !== "mauricio-screen") {
    return new NextResponse(buildOwnerDirectTransferTwiml(), {
      headers: { "Content-Type": "text/xml" },
    });
  }

  if (spamDecision.reason === "suspicious-review") {
    await appendAssistantSpamReview({
      phone: fromE164 || from,
      callerName,
      transcript: incomingText,
      reason: spamDecision.reason,
      blocked: false,
      notes: "Suspicious caller flagged for review.",
    });
  }

  if (spamDecision.blocked && mode !== "mauricio-screen" && mode !== "mauricio-status") {
    await appendAssistantSpamReview({
      phone: fromE164 || from,
      callerName,
      transcript: incomingText,
      reason: spamDecision.reason,
      blocked: true,
      notes: "Call dismissed before OpenAI usage.",
    });
    return new NextResponse(spamHangupTwiml(), {
      headers: { "Content-Type": "text/xml" },
    });
  }

  if (mode === "ai-answer") {
    const pendingQuestion = incomingText || readPendingAiQuestion(state);
    const detectedIntent = incomingText ? detectPhoneIntent(incomingText) : "menu";

    if (incomingText && detectedIntent !== "menu" && detectedIntent !== "question") {
      if (detectedIntent === "goodbye") {
        return new NextResponse(hangupTwiml("Good bye."), { headers: { "Content-Type": "text/xml" } });
      }

      if (detectedIntent === "mauricio") {
        const emergency = isEmergencyText(incomingText);
        const ownerAssistantCaller = isOwnerAssistantCaller(fromE164, incomingText);
        const opening = emergency
          ? `${mauricioNamePrompt()} Emergency and after-hours service can include an extra cost of 150 dollars.`
          : mauricioNamePrompt();

        return new NextResponse(
          toTwiml(opening, {
            gather: true,
            state: withOwnerAssistantFlag(withEmergencyFlag({ ...state, intent: "mauricio", flow: ["firstName"], stepIndex: 0, data: {} }, emergency), ownerAssistantCaller),
          }),
          { headers: { "Content-Type": "text/xml" } },
        );
      }

      const flow = buildFlowForIntent(detectedIntent);
      const emergency = isEmergencyText(incomingText);
      const ownerAssistantCaller = isOwnerAssistantCaller(fromE164, incomingText);
      const nextState = withOwnerAssistantFlag(withEmergencyFlag({ ...state, intent: detectedIntent, flow, stepIndex: 0, data: {} }, emergency), ownerAssistantCaller);

      if (flow.length === 0) {
        return new NextResponse(toThinkingTwiml("Give me a few seconds while I get the best answer to your question.", {
          state: withPendingAiQuestion(nextState, incomingText),
          question: incomingText,
          redirectSuffix: "mode=ai-answer",
        }), {
          headers: { "Content-Type": "text/xml" },
        });
      }

      const prompt = (detectedIntent === "booking" && emergency)
        ? `${currentStepLabel(flow[0])} Emergency and after-hours service can include an extra cost of 150 dollars.`
        : currentStepLabel(flow[0]);
      return new NextResponse(toTwiml(prompt, { gather: true, state: nextState }), {
        headers: { "Content-Type": "text/xml" },
      });
    }

    if (!pendingQuestion) {
      const cleaned = clearPendingAiQuestion(state);
      return new NextResponse(toTwiml(shortHelpPrompt, { gather: true, state: { ...cleaned, intent: "menu", flow: [], stepIndex: 0 } }), {
        headers: { "Content-Type": "text/xml" },
      });
    }

    const aiAnswer = await getPhoneAiAnswer(request, pendingQuestion);
    const cleaned = clearPendingAiQuestion(state);

    if (isOutOfScopeQuestion(pendingQuestion)) {
      await sendOwnerAlertSms(
        [
          "Out-of-scope caller question received.",
          `Caller: ${fromE164 || from || "unknown"}`,
          `CallSid: ${callSid || "unknown"}`,
          `Transcribed question: ${pendingQuestion}`,
        ].join("\n"),
      );

      return new NextResponse(
        toTwiml("I am taking note of your question and will have someone call you in regards to your request.", {
          gather: true,
          state: cleaned,
        }),
        {
          headers: { "Content-Type": "text/xml" },
        },
      );
    }

    const followup = await buildPostAnswerFollowup(request, pendingQuestion);
    const finalReply = `${formatAiVoiceReply(pendingQuestion, aiAnswer)} ${followup.text}`.replace(/\s+/g, " ").trim();
    const replyState = followup.sameDayOffer
      ? withSameDayOfferContext(cleaned, followup.sameDayOffer)
      : clearSameDayOfferContext(cleaned);

    return new NextResponse(toTwiml(finalReply, { gather: true, state: replyState }), {
      headers: { "Content-Type": "text/xml" },
    });
  }

  if (mode === "mauricio-connect") {
    if (!state.data.firstName) {
      return new NextResponse(toTwiml(excuseMePrompt(mauricioNamePrompt()), { gather: true, state: { ...state, intent: "mauricio", flow: ["firstName"], stepIndex: 0 } }), {
        headers: { "Content-Type": "text/xml" },
      });
    }

    const mauricioPhone = resolveMauricioPhone();
    const conference = `mauricio-${callSid || Date.now()}`;
    const session = await createMauricioTransferSession({
      conferenceName: conference,
      callerCallSid: callSid,
      callerPhone: from,
      callerName: state.data.firstName,
      mauricioPhone,
      attemptCount: 0,
      isEmergency: isEmergencyState(state),
    });

    const outbound = await placeMauricioScreeningCall(session);
    if (!outbound.ok) {
      await updateMauricioTransferSession(session.conferenceName, { status: "failed" });
      return new NextResponse(buildCallerVoicemailTwiml(session.callerName, session.conferenceName), {
        headers: { "Content-Type": "text/xml" },
      });
    }

    return new NextResponse(buildCallerConferenceTwiml(session.conferenceName), {
      headers: { "Content-Type": "text/xml" },
    });
  }

  if (mode === "mauricio-wait") {
    if (conferenceName) {
      await tryRetryMauricio(conferenceName);
    }
    const session = conferenceName ? await findMauricioTransferSessionByConference(conferenceName) : null;
    if (session && session.status !== "connected" && session.attemptCount >= getMauricioMaxAttempts(session)) {
      await sendCallerToVoicemailFallback(session, "No technician answer");
      return new NextResponse(buildMauricioWaitTwiml("I could not reach Mauricio right now. Sending you to voicemail."), { headers: { "Content-Type": "text/xml" } });
    }
    const waitMessage = session && session.attemptCount > 0
      ? (session.isEmergency
        ? "Emergency line active. Still trying Leandro Mauricio now. Please stay on the line."
        : "Still trying Mauricio. Please hold while we connect you.")
      : (session?.isEmergency
        ? "Emergency line active. Trying Leandro Mauricio now. Please hold. Emergency and after-hours service can include an extra cost of 150 dollars."
        : "Please hold while we connect you to Mauricio.");
    return new NextResponse(buildMauricioWaitTwiml(waitMessage), { headers: { "Content-Type": "text/xml" } });
  }

  if (mode === "mauricio-voicemail-complete") {
    await updateMauricioTransferSession(conferenceName, { status: "completed" });
    return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Matthew" language="en-US">Thank you. Goodbye.</Say><Hangup/></Response>`, {
      headers: { "Content-Type": "text/xml" },
    });
  }

  if (mode === "mauricio-status") {
    const status = String(payload.CallStatus || "").trim().toLowerCase();
    const mauricioCallSid = String(payload.CallSid || "").trim();
    const session = await findMauricioTransferSessionByConference(conferenceName);
    if (!session) {
      return new NextResponse("", { headers: { "Content-Type": "text/xml" } });
    }

    if (mauricioCallSid && !session.mauricioCallSid) {
      await updateMauricioTransferSession(conferenceName, { mauricioCallSid });
    }

    if (["answered"].includes(status)) {
      await updateMauricioTransferSession(conferenceName, { status: "screening" });
      return new NextResponse("", { headers: { "Content-Type": "text/xml" } });
    }

    if (["busy", "no-answer", "failed", "canceled", "completed"].includes(status)) {
      await updateMauricioTransferSession(conferenceName, { status: session.status });
      if ((status === "busy" || status === "no-answer" || status === "failed" || status === "canceled") && session.attemptCount < getMauricioMaxAttempts(session) && session.status !== "connected" && session.status !== "voicemail") {
        await tryRetryMauricio(conferenceName);
      } else if (status === "completed" && session.status === "screening" && session.attemptCount < getMauricioMaxAttempts(session)) {
        await tryRetryMauricio(conferenceName);
      } else if (session.status !== "connected" && session.status !== "voicemail") {
        await sendCallerToVoicemailFallback(session, "No technician answer");
      }
    }

    return new NextResponse("", { headers: { "Content-Type": "text/xml" } });
  }

  if (mode === "mauricio-screen") {
    const session = await findMauricioTransferSessionByConference(conferenceName);
    if (!session) {
      return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Matthew" language="en-US">Transfer session not found.</Say><Hangup/></Response>`, {
        headers: { "Content-Type": "text/xml" },
      });
    }

    const digits = String(payload.Digits || "").trim();
    if (digits === "1") {
      await updateMauricioTransferSession(conferenceName, { status: "connected" });
      return new NextResponse(buildMauricioJoinTwiml(conferenceName), { headers: { "Content-Type": "text/xml" } });
    }

    if (digits === "2") {
      await updateMauricioTransferSession(conferenceName, { status: "voicemail" });
      const callerUpdate = await updateTwilioCallTwiml(session.callerCallSid, buildCallerVoicemailTwiml(session.callerName, conferenceName));
      if (!callerUpdate.ok) {
        await updateMauricioTransferSession(conferenceName, { status: "failed" });
        return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Matthew" language="en-US">I could not send the caller to voicemail.</Say><Hangup/></Response>`, {
          headers: { "Content-Type": "text/xml" },
        });
      }

      return new NextResponse(buildMauricioVoicemailTwiml(session.callerName), { headers: { "Content-Type": "text/xml" } });
    }

    return new NextResponse(buildMauricioScreenTwiml(session.callerName, conferenceName), { headers: { "Content-Type": "text/xml" } });
  }

  const sameDayOffer = readSameDayOfferContext(state);
  if (sameDayOffer.pending && incomingText) {
    const yesNo = detectYesNo(incomingText);

    if (yesNo === "yes") {
      const flow = buildFlowForIntent("booking");
      const bookingData: Record<string, string> = {
        serviceType: normalizeBookingServiceType(sameDayOffer.question || ""),
        city: normalizeBookingCity(sameDayOffer.question || "West Jordan"),
        preferredDate: normalizeBookingDate(sameDayOffer.date || "today"),
        preferredTimeWindow: normalizeBookingWindow(sameDayOffer.window || "Any time"),
      };

      const offerCleared = clearSameDayOfferContext(state);
      const nextIndex = flow.findIndex((stepKey) => !String(bookingData[stepKey] || "").trim());
      const stepIndex = nextIndex >= 0 ? nextIndex : 0;
      const nextState: PhoneAssistantState = {
        ...offerCleared,
        intent: "booking",
        flow,
        stepIndex,
        data: {
          ...offerCleared.data,
          ...bookingData,
        },
      };

      return new NextResponse(
        toTwiml(`Great, I can get that booked now. ${currentStepLabel(flow[stepIndex])}`, { gather: true, state: nextState }),
        { headers: { "Content-Type": "text/xml" } },
      );
    }

    if (yesNo === "no") {
      const cleared = clearSameDayOfferContext(state);
      const flow: PhoneAssistantState["flow"] = ["preferredTimeWindow", "firstName", "lastName", "phone", "email", "address", "addressCity", "addressZip", "notes"];
      const nextState: PhoneAssistantState = {
        ...cleared,
        intent: "booking",
        flow,
        stepIndex: 0,
        data: {
          ...cleared.data,
          serviceType: normalizeBookingServiceType(sameDayOffer.question || ""),
          city: normalizeBookingCity(sameDayOffer.question || "West Jordan"),
          preferredDate: normalizeBookingDate(sameDayOffer.date || "today"),
        },
      };

      return new NextResponse(
        toTwiml("No problem. I can check another time window for you. What time works better today?", {
          gather: true,
          state: nextState,
        }),
        { headers: { "Content-Type": "text/xml" } },
      );
    }

    return new NextResponse(
      toTwiml("Please say yes if that time works, or no if you prefer another time.", { gather: true, state }),
      { headers: { "Content-Type": "text/xml" } },
    );
  }

  if (!state.intent || state.intent === "menu") {
    if (!incomingText) {
      if (!realtimeFallback && getOpenAiRealtimeSipUri()) {
        return new NextResponse(buildRealtimeSipTwiml(state), {
          headers: { "Content-Type": "text/xml" },
        });
      }

      return new NextResponse(toTwiml(phoneAssistantGreeting, { gather: true, state }), { headers: { "Content-Type": "text/xml" } });
    }

    if (isPostIntroSupportPending(state)) {
      const yesNo = detectYesNo(incomingText);

      if (yesNo === "yes") {
        return new NextResponse(toTwiml(`Great. ${supportChoicePrompt()}`, { gather: true, state }), {
          headers: { "Content-Type": "text/xml" },
        });
      }

      if (yesNo === "no") {
        const cleared = withPostIntroSupportPending(state, false);
        return new NextResponse(toTwiml(shortHelpPrompt, { gather: true, state: cleared }), {
          headers: { "Content-Type": "text/xml" },
        });
      }

      const selectedSupportIntent = resolveSupportIntent(incomingText);
      if (selectedSupportIntent === "callback" || selectedSupportIntent === "sms-technician") {
        const emergency = isEmergencyText(incomingText);
        const ownerAssistantCaller = isOwnerAssistantCaller(fromE164, incomingText);
        const flow = buildFlowForIntent(selectedSupportIntent);
        const nextState: PhoneAssistantState = withOwnerAssistantFlag(
          withEmergencyFlag(
            withPostIntroSupportPending({ ...state, intent: selectedSupportIntent, flow, stepIndex: 0, data: {} }, false),
            emergency,
          ),
          ownerAssistantCaller,
        );

        return new NextResponse(toTwiml(`Absolutely. ${currentStepLabel(flow[0])}`, { gather: true, state: nextState }), {
          headers: { "Content-Type": "text/xml" },
        });
      }

      return new NextResponse(toTwiml(`I can help with that. ${supportChoicePrompt()}`, { gather: true, state }), {
        headers: { "Content-Type": "text/xml" },
      });
    }

    const yesNoFromGreeting = detectYesNo(incomingText);
    if (yesNoFromGreeting === "yes") {
      const emergency = isEmergencyText(incomingText);
      const ownerAssistantCaller = isOwnerAssistantCaller(fromE164, incomingText);
      const flow = buildFlowForIntent("booking");
      const nextState: PhoneAssistantState = withOwnerAssistantFlag(withEmergencyFlag({ ...state, intent: "booking", flow, stepIndex: 0, data: {} }, emergency), ownerAssistantCaller);
      return new NextResponse(toTwiml(currentStepLabel(flow[0]), { gather: true, state: nextState }), {
        headers: { "Content-Type": "text/xml" },
      });
    }

    if (yesNoFromGreeting === "no") {
      const nextState = withPostIntroSupportPending(state, true);
      return new NextResponse(toTwiml(supportChoicePrompt(), { gather: true, state: nextState }), {
        headers: { "Content-Type": "text/xml" },
      });
    }

    const chosenIntent = detectPhoneIntent(incomingText);
    const emergency = isEmergencyText(incomingText);
    const ownerAssistantCaller = isOwnerAssistantCaller(fromE164, incomingText);

    if (chosenIntent === "menu") {
      const words = incomingText.split(/\s+/).filter(Boolean);
      if (words.length >= 3) {
        const nextState: PhoneAssistantState = withOwnerAssistantFlag(withEmergencyFlag({ ...state, intent: "question", flow: [], stepIndex: 0, data: {} }, emergency), ownerAssistantCaller);
        return new NextResponse(toThinkingTwiml("Give me a few seconds while I get the best answer to your question.", {
          state: withPendingAiQuestion(nextState, incomingText),
          question: incomingText,
          redirectSuffix: "mode=ai-answer",
        }), {
          headers: { "Content-Type": "text/xml" },
        });
      }

      return new NextResponse(toTwiml(didYouSayPrompt(incomingText, shortHelpPrompt), { gather: true, state }), { headers: { "Content-Type": "text/xml" } });
    }

    if (lowConfidence) {
      return new NextResponse(toTwiml(didYouSayPrompt(incomingText, shortHelpPrompt), { gather: true, state }), { headers: { "Content-Type": "text/xml" } });
    }

    if (chosenIntent === "goodbye") {
      return new NextResponse(hangupTwiml("Good bye."), { headers: { "Content-Type": "text/xml" } });
    }

    if (chosenIntent === "mauricio") {
      const mauricioPhone = resolveMauricioPhone();
      if (from) {
        await sendSmsToCaller(from, `Trying to reach Leandro/Mauricio at ${mauricioPhone}.`);
      }

      const opening = emergency
        ? `${mauricioNamePrompt()} Emergency and after-hours service can include an extra cost of 150 dollars.`
        : mauricioNamePrompt();

      return new NextResponse(
        toTwiml(opening, {
          gather: true,
          state: withOwnerAssistantFlag(withEmergencyFlag({ ...state, intent: "mauricio", flow: ["firstName"], stepIndex: 0, data: {} }, emergency), ownerAssistantCaller),
        }),
        { headers: { "Content-Type": "text/xml" } },
      );
    }

    const flow = buildFlowForIntent(chosenIntent);
    const nextState: PhoneAssistantState = withOwnerAssistantFlag(withEmergencyFlag({ ...state, intent: chosenIntent, flow, stepIndex: 0, data: {} }, emergency), ownerAssistantCaller);

    if (flow.length === 0) {
      const thinkingState = withPendingAiQuestion(nextState, incomingText);
      return new NextResponse(toThinkingTwiml("Give me a few seconds while I get the best answer to your question.", { state: thinkingState, question: incomingText }), {
        headers: { "Content-Type": "text/xml" },
      });
    }

    const openingStepPrompt = (chosenIntent === "booking" && emergency)
      ? `${currentStepLabel(flow[0])} Emergency and after-hours service can include an extra cost of 150 dollars.`
      : currentStepLabel(flow[0]);

    return new NextResponse(toTwiml(openingStepPrompt, { gather: true, state: nextState }), {
      headers: { "Content-Type": "text/xml" },
    });
  }

  if (state.intent === "mauricio") {
    if (!incomingText) {
      return new NextResponse(toTwiml(excuseMePrompt(mauricioNamePrompt()), { gather: true, state }), {
        headers: { "Content-Type": "text/xml" },
      });
    }

    if (lowConfidence) {
      return new NextResponse(toTwiml(didYouSayPrompt(incomingText, mauricioNamePrompt()), { gather: true, state }), {
        headers: { "Content-Type": "text/xml" },
      });
    }

    state.data.firstName = incomingText;
    const emergency = isEmergencyState(state);
    const connectPrompt = emergency
      ? "Give me a few seconds while I try to get a hold of him right now. Emergency and after-hours service can include an extra cost of 150 dollars."
      : "Give me a few seconds while I try to get a hold of him.";
    const thinkingState = withPendingAiQuestion({ ...state, intent: "mauricio", flow: [], stepIndex: 0 }, "Connect me to Leandro Mauricio");
    return new NextResponse(toThinkingTwiml(connectPrompt, {
      state: thinkingState,
      question: "Connect me to Leandro Mauricio",
      redirectSuffix: "mode=mauricio-connect",
    }), {
      headers: { "Content-Type": "text/xml" },
    });
  }

  if (state.awaitingRescheduleFollowup && state.intent === "reschedule") {
    if (!incomingText) {
      return new NextResponse(toTwiml(excuseMePrompt(keepConversationGoing("When would you like to re-schedule?")), { gather: true, state }), {
        headers: { "Content-Type": "text/xml" },
      });
    }

    if (lowConfidence) {
      return new NextResponse(toTwiml(didYouSayPrompt(incomingText, keepConversationGoing("When would you like to re-schedule?")), { gather: true, state }), {
        headers: { "Content-Type": "text/xml" },
      });
    }

    const response = await callLocalApi(request, "/api/assistant/appointments/manage", {
      action: "reschedule",
      requestId: state.data.requestId || undefined,
      phone: state.data.phone || from,
      firstName: state.data.firstName || "",
      address: state.data.address || "",
      preferredDate: incomingText,
      preferredTimeWindow: state.data.preferredTimeWindow || "",
      reason: state.data.notes || "Requested by phone assistant",
    });

    const detail = (response.data?.detail as string) || `Your appointment has been re-scheduled for ${incomingText}`;
    return new NextResponse(toTwiml(keepConversationGoing(detail), { gather: true, state: { ...state, awaitingRescheduleFollowup: false, intent: "menu", flow: [], stepIndex: 0 } }), {
      headers: { "Content-Type": "text/xml" },
    });
  }

  const step = state.flow[state.stepIndex];
  if (!step) {
    return new NextResponse(toTwiml(shortHelpPrompt, { gather: true, state: { ...state, intent: "menu", flow: [], stepIndex: 0 } }), {
      headers: { "Content-Type": "text/xml" },
    });
  }

  if (!incomingText) {
    return new NextResponse(toTwiml(excuseMePrompt(currentStepLabel(step)), { gather: true, state }), {
      headers: { "Content-Type": "text/xml" },
    });
  }

  if (lowConfidence) {
    return new NextResponse(toTwiml(didYouSayPrompt(incomingText, currentStepLabel(step)), { gather: true, state }), {
      headers: { "Content-Type": "text/xml" },
    });
  }

  const interruptIntent = detectPhoneInterruptIntent(incomingText);
  const broadIntent = detectPhoneIntent(incomingText);
  const effectiveInterruptIntent = (interruptIntent || (broadIntent !== "menu" ? broadIntent : null));
  if (effectiveInterruptIntent && effectiveInterruptIntent !== state.intent) {
    const emergency = isEmergencyText(incomingText);
    const ownerAssistantCaller = isOwnerAssistantCaller(fromE164, incomingText);
    if (effectiveInterruptIntent === "goodbye") {
      return new NextResponse(hangupTwiml("Good bye."), { headers: { "Content-Type": "text/xml" } });
    }

    if (effectiveInterruptIntent === "mauricio") {
      return new NextResponse(toTwiml(mauricioNamePrompt(), {
        gather: true,
        state: withOwnerAssistantFlag(withEmergencyFlag({ ...state, intent: "mauricio", flow: ["firstName"], stepIndex: 0, data: {} }, emergency), ownerAssistantCaller),
      }), { headers: { "Content-Type": "text/xml" } });
    }

    const interruptFlow = buildFlowForIntent(effectiveInterruptIntent);
    const interruptState: PhoneAssistantState = withOwnerAssistantFlag(withEmergencyFlag({ ...state, intent: effectiveInterruptIntent, flow: interruptFlow, stepIndex: 0, data: {}, awaitingRescheduleFollowup: false }, emergency), ownerAssistantCaller);

    if (interruptFlow.length === 0) {
      const thinkingState = withPendingAiQuestion(interruptState, incomingText);
      return new NextResponse(toThinkingTwiml("Give me a few seconds while I get the best answer to your question.", { state: thinkingState, question: incomingText }), {
        headers: { "Content-Type": "text/xml" },
      });
    }

    const interruptPrompt = (effectiveInterruptIntent === "booking" && emergency)
      ? `${currentStepLabel(interruptFlow[0])} Emergency and after-hours service can include an extra cost of 150 dollars.`
      : currentStepLabel(interruptFlow[0]);

    return new NextResponse(toTwiml(interruptPrompt, { gather: true, state: interruptState }), {
      headers: { "Content-Type": "text/xml" },
    });
  }

  const normalizedValue =
    step === "phone"
      ? normalizePhoneDigits(incomingText) || incomingText
      : step === "serviceType"
        ? normalizeBookingServiceType(incomingText)
        : step === "city" || step === "addressCity"
          ? normalizeBookingCity(incomingText)
          : step === "preferredTimeWindow"
            ? normalizeBookingWindow(incomingText)
            : step === "preferredDate"
              ? normalizeBookingDate(incomingText)
              : step === "email"
                ? normalizeEmailFromSpeech(incomingText)
                : step === "addressZip"
                  ? normalizePhoneDigits(incomingText).slice(0, 10)
                  : step === "requestId" && /^(i\s+don't\s+have\s+it|i\s+dont\s+have\s+it|n\/a|na)$/i.test(incomingText)
                    ? ""
                    : incomingText;

  state.data[step] = normalizedValue;

  const nextIndex = state.stepIndex + 1;
  if (nextIndex >= state.flow.length) {
    switch (state.intent) {
      case "goodbye":
        return new NextResponse(hangupTwiml("Good bye."), { headers: { "Content-Type": "text/xml" } });

      case "check-status": {
        const response = await callLocalApi(request, "/api/assistant/appointments/manage", {
          action: "status",
          requestId: state.data.requestId || undefined,
          phone: state.data.phone || from,
          firstName: state.data.firstName || "",
          address: state.data.address || "",
        });

        const detail = (response.data?.detail as string) || "I found your appointment.";
        return new NextResponse(toTwiml(keepConversationGoing(detail), { gather: true, state: { ...state, intent: "menu", flow: [], stepIndex: 0 } }), {
          headers: { "Content-Type": "text/xml" },
        });
      }

      case "reschedule": {
        const lookup = await callLocalApi(request, "/api/assistant/appointments/manage", {
          action: "status",
          requestId: state.data.requestId || undefined,
          phone: state.data.phone || from,
          firstName: state.data.firstName || "",
          address: state.data.address || "",
        });

        if (!lookup.response.ok) {
          const detail = String(lookup.data?.detail || "I could not find your appointment.");
          return new NextResponse(toTwiml(keepConversationGoing(detail), { gather: true, state: { ...state, intent: "menu", flow: [], stepIndex: 0 } }), {
            headers: { "Content-Type": "text/xml" },
          });
        }

        state.awaitingRescheduleFollowup = true;
        return new NextResponse(toTwiml(keepConversationGoing("When would you like to re-schedule?"), { gather: true, state }), {
          headers: { "Content-Type": "text/xml" },
        });
      }

      case "cancel": {
        const response = await callLocalApi(request, "/api/assistant/appointments/manage", {
          action: "cancel",
          requestId: state.data.requestId || undefined,
          phone: state.data.phone || from,
          firstName: state.data.firstName || "",
          address: state.data.address || "",
          reason: state.data.notes || "Customer requested cancellation by phone",
        });

        const detail = (response.data?.detail as string) || "Your appointment has been cancelled.";
        return new NextResponse(toTwiml(keepConversationGoing(detail), { gather: true, state: { ...state, intent: "menu", flow: [], stepIndex: 0 } }), {
          headers: { "Content-Type": "text/xml" },
        });
      }

      case "booking": {
        const bookingPayload = {
          serviceType: normalizeBookingServiceType(state.data.serviceType || ""),
          city: normalizeBookingCity(state.data.city || "West Jordan"),
          preferredDate: normalizeBookingDate(state.data.preferredDate || "today"),
          preferredTimeWindow: normalizeBookingWindow(state.data.preferredTimeWindow || "Any time"),
          firstName: state.data.firstName || "Customer",
          lastName: state.data.lastName || "Caller",
          phone: state.data.phone || from,
          email: normalizeEmailFromSpeech(state.data.email || ""),
          addressLine1: state.data.address || "",
          addressCity: normalizeBookingCity(state.data.addressCity || state.data.city || "West Jordan"),
          addressZip: (state.data.addressZip || "").trim(),
          notes: state.data.notes || "",
          sourcePage: "/phone-assistant",
          utm_source: "phone-assistant",
          utm_medium: "voice",
          utm_campaign: "phone-booking",
          utm_term: "",
          utm_content: "",
          gclid: "",
          gbraid: "",
          wbraid: "",
          fbclid: "",
          msclkid: "",
        };

        if (!bookingPayload.email || !bookingPayload.addressLine1 || bookingPayload.addressZip.length < 5) {
          const bookingUrl = `${url.origin}/book`;
          if (from) {
            await sendSmsToCaller(from, `I need a few details to complete booking. Please finish here: ${bookingUrl}`);
          }
          return new NextResponse(toTwiml("I still need a valid email, full street address, and zip code to finalize your booking. I sent the booking link to your phone so you can complete it quickly.", {
            gather: true,
            state: { ...state, intent: "menu", flow: [], stepIndex: 0 },
          }), {
            headers: { "Content-Type": "text/xml" },
          });
        }

        const availabilityWindows = await fetchAvailabilityForDate(request, bookingPayload.preferredDate).catch(() => [] as string[]);
        const slotUnavailable = availabilityWindows.length > 0 && !availabilityWindows.includes(bookingPayload.preferredTimeWindow);
        if (slotUnavailable && isOwnerAssistantState(state)) {
          await sendMauricioMessage(
            `Owner/assistant requested blocking an already-booked slot. Confirm before booking: ${bookingPayload.firstName} ${bookingPayload.lastName}, ${bookingPayload.phone}, ${bookingPayload.preferredDate} ${bookingPayload.preferredTimeWindow}, ${bookingPayload.addressLine1}, ${bookingPayload.addressCity}.`,
          );

          return new NextResponse(toTwiml(
            "That time appears already booked. I sent Leandro Mauricio a confirmation request now. I will not block that time until he confirms. Would you like me to check another time as well?",
            {
              gather: true,
              state: { ...state, intent: "menu", flow: [], stepIndex: 0 },
            },
          ), {
            headers: { "Content-Type": "text/xml" },
          });
        }

        const bookingResponse = await callLocalApi(request, "/api/book", bookingPayload);
        if (!bookingResponse.response.ok) {
          const bookingUrl = `${url.origin}/book`;
          if (from) {
            await sendSmsToCaller(from, `Booking link for All Solutions HVAC: ${bookingUrl}`);
          }
          const detail = String(bookingResponse.data?.error || "I could not confirm the booking right now.");
          return new NextResponse(toTwiml(`${detail} I sent a booking link to your phone to finish your appointment request.`, {
            gather: true,
            state: { ...state, intent: "menu", flow: [], stepIndex: 0 },
          }), {
            headers: { "Content-Type": "text/xml" },
          });
        }

        const requestId = String(bookingResponse.data?.requestId || "").trim();
        const nextStep = String(bookingResponse.data?.nextStep || "").trim();
        const emergencyNotice = isEmergencyState(state)
          ? " Emergency and after-hours service can include an extra cost of 150 dollars."
          : "";
        const successMessage = requestId
          ? `Your appointment request is confirmed with request ID ${requestId}. ${nextStep}${emergencyNotice}`
          : `Your appointment request is confirmed. ${nextStep}${emergencyNotice}`;

        return new NextResponse(toTwiml(keepConversationGoing(successMessage), {
          gather: true,
          state: { ...state, intent: "menu", flow: [], stepIndex: 0 },
        }), {
          headers: { "Content-Type": "text/xml" },
        });
      }

      case "sms-technician": {
        const firstName = state.data.firstName || "Customer";
        const lastName = state.data.lastName || "";
        const callerPhone = state.data.phone || from;
        const callerNotes = state.data.notes || "";

        await appendAssistantLead({
          leadId: `VOICE-${Date.now()}`,
          priority: "P1",
          serviceType: "general-service",
          urgency: "now",
          city: "West Jordan",
          phone: callerPhone,
          handoffMode: "sms-technician",
          bookingMode: "callback-only",
          captureSource: "phone-assistant",
          aiBranch: "phone-assistant-transfer",
        });

        const response = await callLocalApi(request, "/api/assistant/text-threads/open", {
          customerPhone: callerPhone,
          firstName,
          lastName,
          city: "West Jordan",
          serviceType: "general-service",
          urgency: "now",
          initialMessage: callerNotes,
        });

        const code = String(response.data?.thread && typeof response.data.thread === "object" ? (response.data.thread as { code?: string }).code || "" : "").trim();
        const detail = code ? `A technician text thread is open. Reference ${code}.` : "A technician text thread is open.";
        return new NextResponse(toTwiml(keepConversationGoing(detail), { gather: true, state }), {
          headers: { "Content-Type": "text/xml" },
        });
      }

      case "callback": {
        const response = await callLocalApi(request, "/api/assistant/lead", {
          handoffMode: "callback",
          serviceType: "general-service",
          urgency: "now",
          bookingMode: "callback-only",
          preferredDate: "",
          preferredTimeWindow: "",
          firstName: state.data.firstName || "Customer",
          address: "",
          phone: state.data.phone || from,
          city: "",
          email: "",
          contactMethod: "phone",
          homeType: "owner",
          notes: state.data.notes || "",
          liveTechnicianPhone: process.env.LIVE_TECHNICIAN_SMS_TO || process.env.P1_DISPATCH_SMS_TO || "",
          assistantTranscript: `VOICE: ${summarizeCollectedData(state.data)}`,
          aiBranch: "phone-assistant",
          captureSource: "phone-assistant",
        });

        const leadId = String(response.data?.leadId || "").trim();
        const detail = leadId
          ? `Callback request sent to technician with your message. He will probably text you first. Can you receive texts to this number?`
          : "Callback request sent to technician with your message. He will probably text you first. Can you receive texts to this number?";

        return new NextResponse(toTwiml(keepConversationGoing(detail), { gather: true, state: { ...state, awaitingRescheduleFollowup: false } }), {
          headers: { "Content-Type": "text/xml" },
        });
      }

      default:
        return new NextResponse(toThinkingTwiml("Give me a few seconds while I get the best answer to your question.", {
          state: withPendingAiQuestion(state, state.data.notes || incomingText),
          question: state.data.notes || incomingText,
          redirectSuffix: "mode=ai-answer",
        }), {
          headers: { "Content-Type": "text/xml" },
        });
    }
  }

  const nextState: PhoneAssistantState = { ...state, stepIndex: nextIndex };
  return new NextResponse(toTwiml(currentStepLabel(nextState.flow[nextIndex]), { gather: true, state: nextState }), {
    headers: { "Content-Type": "text/xml" },
  });
}
