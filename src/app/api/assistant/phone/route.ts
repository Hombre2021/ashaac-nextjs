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
  appendAssistantCost,
  appendAssistantLead,
  appendAssistantSpamReview,
  createMauricioTransferSession,
  findMauricioTransferSessionByConference,
  listAssistantSpamRules,
  type MauricioTransferRecord,
  updateMauricioTransferSession,
} from "@/lib/assistantStore";
import { isImportedBlockedNumber } from "@/lib/phoneBlockedNumbers";
import { getTwilioConfig, sendTwilioSms } from "@/lib/twilio";
import { assistantBusinessFacts, assistantBusinessPolicy } from "@/lib/assistantKnowledge";
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
      text: "",
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

async function buildBookingAvailabilityOffer(request: Request, bookingRequest: string) {
  const slots = await fetchAvailabilitySlots(request).catch(() => [] as Array<{ date: string; windows: string[] }>);
  const requestedDate = inferRequestedBookingDate(bookingRequest);
  const requestedPeriod = inferRequestedTimePeriod(bookingRequest);
  const todayDate = normalizeBookingDate("today");
  const now = currentMountainMinutes();
  const target = now + 30;
  const allCandidates = slots
    .filter((slot) => isMondayThroughSaturday(slot.date))
    .flatMap((slot) => slot.windows
      .filter((window) => !/Any time/i.test(window))
      .map((window) => ({ date: slot.date, window, start: parseWindowStartMinutes(window) })))
    .filter((item) => Number.isFinite(item.start))
    .filter((item) => item.date !== todayDate || item.start >= target)
    .sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start);
  const exactCandidates = allCandidates
    .filter((item) => !requestedDate || item.date === requestedDate)
    .filter((item) => matchesRequestedTimePeriod(item.start, requestedPeriod));
  const periodAlternatives = allCandidates.filter((item) => matchesRequestedTimePeriod(item.start, requestedPeriod));
  const picked = exactCandidates[0] || periodAlternatives[0] || allCandidates[0];

  if (!picked) {
    return {
      text: "I do not see an available appointment in the current schedule. Which other day, Monday through Saturday, would work for you?",
      offer: null,
    };
  }

  const spokenDate = formatBookingDateForVoice(picked.date, todayDate);
  const exactMatch = exactCandidates.length > 0;
  const requestedDateText = requestedDate ? formatBookingDateForVoice(requestedDate, todayDate) : "your requested day";
  const requestedPeriodText = requestedPeriod === "any" ? "" : ` ${requestedPeriod}`;

  return {
    text: exactMatch
      ? `The earliest matching time is between ${picked.window} ${spokenDate}. Would that work for you?`
      : `I do not see an available${requestedPeriodText} appointment ${requestedDateText}. The nearest available time is between ${picked.window} ${spokenDate}. Would that work for you?`,
    offer: {
      date: picked.date,
      window: picked.window,
      question: bookingRequest,
    },
  };
}

function inferRequestedBookingDate(value: string) {
  if (/\btoday\b/i.test(value)) return normalizeBookingDate("today");
  if (/\btomorrow\b/i.test(value)) return normalizeBookingDate("tomorrow");
  if (/\b(?:next\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday)\b/i.test(value)) return normalizeBookingDate(value);
  if (/\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}/i.test(value)) return normalizeBookingDate(value);
  const iso = value.match(/\b20\d{2}[-\s\/]?\d{1,2}[-\s\/]?\d{1,2}\b/);
  return iso ? normalizeBookingDate(iso[0]) : "";
}

function isMondayThroughSaturday(date: string) {
  const parsed = new Date(`${date}T12:00:00`);
  return !Number.isNaN(parsed.getTime()) && parsed.getDay() >= 1 && parsed.getDay() <= 6;
}

function inferRequestedTimePeriod(value: string) {
  if (/\bmorning\b/i.test(value)) return "morning" as const;
  if (/\bafternoon\b/i.test(value)) return "afternoon" as const;
  if (/\b(?:evening|night)\b/i.test(value)) return "evening" as const;
  return "any" as const;
}

function matchesRequestedTimePeriod(startMinutes: number, period: "morning" | "afternoon" | "evening" | "any") {
  if (period === "morning") return startMinutes < 12 * 60;
  if (period === "afternoon") return startMinutes >= 12 * 60 && startMinutes < 17 * 60;
  if (period === "evening") return startMinutes >= 17 * 60;
  return true;
}

function formatBookingDateForVoice(date: string, todayDate: string) {
  if (date === todayDate) return "today";
  if (date === normalizeBookingDate("tomorrow")) return "tomorrow";
  const parsed = new Date(`${date}T12:00:00`);
  return Number.isNaN(parsed.getTime())
    ? `on ${date}`
    : `on ${new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(parsed)}`;
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
    return `${fallback} Would you like me to book an appointment, connect you with a technician by text, or arrange a callback?`;
  }

  const hasNextStep = /(would you like|do you want|I can|shall I).{0,120}(book|appointment|text|callback|call back|transfer)/i.test(cleanedAnswer);
  const closer = hasNextStep
    ? ""
    : " Would you like me to book an appointment, connect you with a technician by text, or arrange a callback?";

  return `${cleanedAnswer}${closer}`.trim();
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
    "If booking is not chosen, next offer a technician text chat. Offer a callback last.",
    "Answer clearly in plain language for a caller.",
    "Respond to the caller's full meaning and finish the current thought before offering another action.",
    "Do not ask whether the caller needs anything else until their current question or request is fully resolved.",
    "Do not repeat the caller's full question back.",
    "Keep the answer short and directly useful.",
    "After answering, guide toward one next step: booking, callback, or live technician.",
    "When relevant, mention same-day service is based on technician availability.",
    "If caller asks for same-day service, propose a concrete time window and ask a yes/no confirmation.",
    "All Solutions business policy:",
    ...assistantBusinessPolicy.map((policy) => `- ${policy}`),
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

async function getNaturalWorkflowPrompt(
  request: Request,
  callerText: string,
  intent: PhoneAssistantState["intent"],
  requiredQuestion: string,
) {
  const fallbackAcknowledgement: Partial<Record<PhoneAssistantState["intent"], string>> = {
    callback: "I can arrange a callback for you.",
    "sms-technician": "I can connect you with a technician by text.",
    "check-status": "I can check your appointment status.",
    reschedule: "I can help reschedule your appointment.",
    cancel: "I can help with your cancellation request.",
  };
  const fallback = `${fallbackAcknowledgement[intent] || "I can help with that."} ${requiredQuestion}`;
  const apiKey = envFirst("OPENAI_API_KEY");
  if (!apiKey) return fallback;

  const model = envFirst("OPENAI_CHAT_MODEL", "OPENAI_MODEL") || "gpt-4.1-mini";
  const policy = assistantBusinessPolicy.map((item) => `- ${item}`).join("\n");
  const systemPrompt = [
    "You are the All Solutions phone assistant.",
    "Acknowledge the caller naturally in one short sentence based on what they actually said.",
    "Do not ask a question, collect data, promise success, or mention internal systems in the acknowledgement.",
    "Do not repeat the caller verbatim. Return only the acknowledgement sentence.",
    `Recognized workflow: ${intent}.`,
    "Business policy:",
    policy,
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
          { role: "system", content: [{ type: "input_text", text: systemPrompt }] },
          { role: "user", content: [{ type: "input_text", text: callerText }] },
        ],
        max_output_tokens: 60,
      }),
      signal: AbortSignal.timeout(7000),
    });
    if (!response.ok) return fallback;
    const payload = (await response.json().catch(() => null)) as unknown;
    const generated = sanitizeForVoice(extractResponseText(payload))
      .split(/\?|\b(?:may I|please (?:say|provide|tell)|what is your|could you (?:provide|tell|say)|can you (?:provide|tell|say))\b/i)[0]
      .trim();
    if (!generated || /(phone number|callback number|service address|zip code|email address)/i.test(generated)) {
      return fallback;
    }
    return `${generated.replace(/[.!]+$/, "")}. ${requiredQuestion}`;
  } catch {
    return fallback;
  }
}

type PhoneTurnInterpretation = {
  kind: "request" | "question" | "field_answer" | "offer_accept" | "offer_decline" | "offer_repeat" | "goodbye" | "unknown";
  intent: "booking" | "question" | "callback" | "sms-technician" | "check-status" | "reschedule" | "cancel" | "mauricio" | "current" | "unknown";
  normalizedValue: string;
  acknowledgement: string;
};

async function interpretPhoneTurn(params: {
  callerText: string;
  callSid: string;
  state: PhoneAssistantState;
  pendingOffer: { pending: boolean; date: string; window: string };
}) {
  const apiKey = envFirst("OPENAI_API_KEY");
  if (!apiKey || !params.callerText.trim()) return null;
  const model = envFirst("OPENAI_PHONE_INTERPRETER_MODEL", "OPENAI_CHAT_MODEL", "OPENAI_MODEL") || "gpt-4.1-mini";
  const currentStep: string = params.state.flow[params.state.stepIndex] ?? "none";
  const systemPrompt = [
    "You are the real-time turn interpreter for the All Solutions phone assistant.",
    "Understand the caller's meaning in context. Do not answer the caller directly.",
    "Classify requests separately from informational questions and from answers to the current workflow question.",
    "If an appointment time is pending, a request to repeat, clarify, or ask what date/time was said is offer_repeat even if the utterance starts with yes.",
    "Only an unambiguous acceptance of the pending appointment is offer_accept.",
    "A requested different day or time is a booking request, not acceptance or decline.",
    "Use field_answer when the caller is answering the current required field.",
    `Current workflow intent: ${params.state.intent}.`,
    `Current required field: ${currentStep}.`,
    `Pending appointment offer: ${params.pendingOffer.pending ? `${params.pendingOffer.date} ${params.pendingOffer.window}` : "none"}.`,
    params.state.intent === "menu" && currentStep === "none"
      ? "The assistant most recently asked whether the caller wants to schedule an appointment. An unambiguous yes means a booking request."
      : "",
    "Business policy:",
    ...assistantBusinessPolicy.map((item) => `- ${item}`),
  ].join("\n");

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        input: [
          { role: "system", content: [{ type: "input_text", text: systemPrompt }] },
          { role: "user", content: [{ type: "input_text", text: params.callerText }] },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "phone_turn",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["kind", "intent", "normalizedValue", "acknowledgement"],
              properties: {
                kind: { type: "string", enum: ["request", "question", "field_answer", "offer_accept", "offer_decline", "offer_repeat", "goodbye", "unknown"] },
                intent: { type: "string", enum: ["booking", "question", "callback", "sms-technician", "check-status", "reschedule", "cancel", "mauricio", "current", "unknown"] },
                normalizedValue: { type: "string" },
                acknowledgement: { type: "string" },
              },
            },
          },
        },
        max_output_tokens: 180,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    const payload = (await response.json().catch(() => null)) as unknown;
    const raw = extractResponseText(payload);
    const interpretation = JSON.parse(raw) as PhoneTurnInterpretation;
    await appendAssistantCost({
      provider: "openai",
      category: "llm",
      callSid: params.callSid || undefined,
      unitCount: 1,
      unitLabel: "turn",
      detail: `phone-turn:${model}:${interpretation.kind}:${interpretation.intent}`,
    }).catch(() => null);
    console.info("phone_openai_turn", {
      callSid: params.callSid,
      model,
      kind: interpretation.kind,
      intent: interpretation.intent,
    });
    return interpretation;
  } catch {
    return null;
  }
}

function intentFromInterpretation(turn: PhoneTurnInterpretation | null) {
  if (!turn || turn.intent === "current" || turn.intent === "unknown") return null;
  return turn.intent as PhoneAssistantState["intent"];
}

function yesNoFromInterpretation(turn: PhoneTurnInterpretation | null) {
  if (turn?.kind === "offer_accept") return "yes" as const;
  if (turn?.kind === "offer_decline") return "no" as const;
  return "unknown" as const;
}

function hasElevenLabsConfig() {
  const enabled = /^(1|true|yes|on)$/i.test(String(process.env.PHONE_USE_ELEVENLABS || "").trim());
  return enabled && Boolean((process.env.ELEVENLABS_API_KEY || "").trim() && (process.env.ELEVENLABS_VOICE_ID || "").trim());
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

function buildTypingSoundNode() {
  return `<Play>${escapeXml(`${getPublicBaseUrl()}/audio/typing-keyboard.mp3`)}</Play>`;
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
  return `<?xml version="1.0" encoding="UTF-8"?><Response>${speechNode}${buildTypingSoundNode()}<Redirect method="POST">${escapeXml(actionUrl)}</Redirect></Response>`;
}

function toBookingAvailabilityTwiml(state: PhoneAssistantState) {
  const stateParam = `state=${encodeURIComponent(encodePhoneAssistantState(state))}`;
  const actionUrl = `/api/assistant/phone?${stateParam}&mode=booking-availability`;
  const speechNode = buildSpeechNode("Let me look for available times our technician can come to your location.", state);
  return `<?xml version="1.0" encoding="UTF-8"?><Response>${speechNode}${buildTypingSoundNode()}<Redirect method="POST">${escapeXml(actionUrl)}</Redirect></Response>`;
}

const PENDING_AI_QUESTION_KEY = "_pendingAiQuestion";
const EMERGENCY_FLAG_KEY = "_emergencyFlag";
const OWNER_ASSISTANT_FLAG_KEY = "_ownerAssistantCaller";
const POST_INTRO_SUPPORT_PENDING_KEY = "_postIntroSupportPending";
const SAME_DAY_OFFER_PENDING_KEY = "_sameDayOfferPending";
const SAME_DAY_OFFER_DATE_KEY = "_sameDayOfferDate";
const SAME_DAY_OFFER_WINDOW_KEY = "_sameDayOfferWindow";
const SAME_DAY_OFFER_QUESTION_KEY = "_sameDayOfferQuestion";
const CONTACT_CONFIRMATION_PENDING_KEY = "_contactConfirmationPending";
const CONTACT_CONFIRMED_KEY = "_contactConfirmed";

function requiresConfirmedContact(intent: PhoneAssistantState["intent"]) {
  return intent === "booking" || intent === "sms-technician" || intent === "callback";
}

function missingRequiredContactStep(state: PhoneAssistantState) {
  if (!String(state.data.firstName || "").trim()) return "firstName" as const;
  if (normalizePhoneDigits(state.data.phone || "").length !== 10) return "phone" as const;
  if (!String(state.data.address || "").trim()) return "address" as const;
  if (!String(state.data.addressCity || "").trim()) return "addressCity" as const;
  if (normalizePhoneDigits(state.data.addressZip || "").length < 5) return "addressZip" as const;
  return null;
}

function contactConfirmationPrompt(state: PhoneAssistantState) {
  const name = [state.data.firstName, state.data.lastName].filter(Boolean).join(" ").trim();
  const phone = normalizePhoneDigits(state.data.phone || "").split("").join(", ");
  const address = [state.data.address, state.data.addressCity, state.data.addressZip].filter(Boolean).join(", ");
  return `Please confirm the information for our technician. Your name is ${name}. Your callback number is ${phone}. The service address is ${address}. Is all of that correct?`;
}

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
  return "Would you like me to connect you with a technician by text, or arrange a callback?";
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

function isOfferClarificationRequest(value: string) {
  return /(repeat|say (?:that|it|the time|the date) again|what time|which time|what date|which date|what day|which day|when did you say|what did you say|did not (?:hear|catch|understand)|didn't (?:hear|catch|understand)|could you say that again|can you say that again|come again|pardon)/i.test(value);
}

function repeatOfferPrompt(date: string, window: string) {
  const spokenDate = formatBookingDateForVoice(normalizeBookingDate(date || "today"), normalizeBookingDate("today"));
  const spokenWindow = String(window || "").replace(" - ", " to ");
  return `The available appointment I mentioned is ${spokenDate}, from ${spokenWindow}. Would that work for you? Please say yes or no.`;
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
  const slots = await fetchAvailabilitySlots(request);
  const slot = slots.find((item) => item.date === date);
  return slot?.windows || [];
}

async function fetchAvailabilitySlots(request: Request) {
  const url = new URL(request.url);
  const endpoint = new URL("/api/book/availability", url.origin).toString();
  const response = await fetch(endpoint, { method: "GET", cache: "no-store" });
  const payload = (await response.json().catch(() => null)) as { slots?: Array<{ date?: string; windows?: string[] }> } | null;
  return (Array.isArray(payload?.slots) ? payload!.slots : [])
    .map((slot) => ({
      date: String(slot.date || "").trim(),
      windows: Array.isArray(slot.windows) ? slot.windows.map((window) => String(window).trim()).filter(Boolean) : [],
    }))
    .filter((slot) => slot.date && slot.windows.length > 0);
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
  return `${message} Is there anything else I can assist you with?`;
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

function inferBookingCity(value: string) {
  return /(west jordan|south jordan|sandy|murray|midvale|taylorsville|draper|salt lake)/i.test(value)
    ? normalizeBookingCity(value)
    : "";
}

function normalizeBookingWindow(value: string) {
  const lower = String(value || "").toLowerCase();
  if (/any\s*time|anytime|whenever/.test(lower)) return "Any time (24-hour availability)";
  if (/5|five/.test(lower) && /7|seven/.test(lower) && /am|morning/.test(lower)) return "5:00 AM - 7:00 AM";
  if (/7|seven/.test(lower) && /9|nine/.test(lower) && /am|morning/.test(lower)) return "7:00 AM - 9:00 AM";
  if (/9|nine/.test(lower) && /11|eleven/.test(lower) && /am|morning/.test(lower)) return "9:00 AM - 11:00 AM";
  if (/7|seven/.test(lower) && /9|nine/.test(lower) && /pm|evening|night/.test(lower)) return "7:00 PM - 9:00 PM";
  if (/9|nine/.test(lower) && /11|eleven/.test(lower) && /pm|evening|night/.test(lower)) return "9:00 PM - 11:00 PM";
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

  const weekdayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const weekdayMatch = lower.match(/\b(?:next\s+)?(monday|tuesday|wednesday|thursday|friday|saturday)\b/);
  if (weekdayMatch) {
    const targetDay = weekdayNames.indexOf(weekdayMatch[1]);
    let daysAhead = (targetDay - mountain.getDay() + 7) % 7;
    if (/\bnext\s+/.test(weekdayMatch[0]) || daysAhead === 0) daysAhead += 7;
    const target = new Date(mountain);
    target.setDate(target.getDate() + daysAhead);
    return format(target);
  }

  const monthNames: Record<string, number> = {
    january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
    july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
  };
  const monthMatch = lower.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(20\d{2}))?\b/);
  if (monthMatch) {
    let year = monthMatch[3] ? Number.parseInt(monthMatch[3], 10) : mountain.getFullYear();
    const month = monthNames[monthMatch[1]];
    const day = Number.parseInt(monthMatch[2], 10);
    let target = new Date(year, month, day);
    if (!monthMatch[3] && format(target) < format(mountain)) {
      year += 1;
      target = new Date(year, month, day);
    }
    if (target.getMonth() === month && target.getDate() === day) return format(target);
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
  if (await isImportedBlockedNumber(fromE164)) return { blocked: true, reason: "imported-android-block-list" };

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

function buildRealtimeSipTwiml(callSid: string, callerPhone: string) {
  const sipUri = getOpenAiRealtimeSipUri();
  const completionUrl = `${getPublicBaseUrl()}/api/assistant/phone?mode=realtime-dial-complete`;
  const separator = sipUri.includes("?") ? "&" : "?";
  const directSipUri = `${sipUri}${separator}X-All-Solutions-Caller=${encodeURIComponent(callerPhone)}&X-All-Solutions-Call-Sid=${encodeURIComponent(callSid)}`;
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Dial answerOnBridge="true" action="${escapeXml(completionUrl)}" method="POST"><Sip>${escapeXml(directSipUri)}</Sip></Dial></Response>`;
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
  let incomingText = String(payload.SpeechResult || payload.Digits || payload.Body || "").trim();
  const confidenceRaw = String(payload.Confidence || "").trim();
  const confidence = Number.parseFloat(confidenceRaw);
  const lowConfidence = Number.isFinite(confidence) && confidence < 0.45;
  const from = normalizePhoneDigits(payload.From || "");
  const fromE164 = toE164(payload.From || "");
  const callerName = String(payload.CallerName || payload.Caller || "").trim();
  const callSid = String(payload.CallSid || incomingState.callSid || "").trim();

  const state: PhoneAssistantState = { ...incomingState, callSid };
  let contactConfirmationAccepted = false;

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
    const flow = buildFlowForIntent("callback");
    return new NextResponse(toTwiml("I can send the owner or technician a message. Please say your first name.", {
      gather: true,
      state: { ...state, intent: "callback", flow, stepIndex: 0, data: {} },
    }), {
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

  const excludedInterpretationModes = new Set([
    "booking-availability",
    "realtime-dial-complete",
    "mauricio-connect",
    "mauricio-wait",
    "mauricio-status",
    "mauricio-screen",
    "mauricio-voicemail-complete",
  ]);
  const interpretedTurn = incomingText && !lowConfidence && !String(payload.Digits || "").trim() && !excludedInterpretationModes.has(mode)
    ? await interpretPhoneTurn({
      callerText: incomingText,
      callSid,
      state,
      pendingOffer: readSameDayOfferContext(state),
    })
    : null;

  if (mode === "booking-availability") {
    const bookingRequest = readPendingAiQuestion(state) || "book an appointment";
    const availability = await buildBookingAvailabilityOffer(request, bookingRequest);
    const clearedState = clearPendingAiQuestion(state);
    const offerState = availability.offer
      ? withSameDayOfferContext(clearedState, availability.offer)
      : clearSameDayOfferContext(clearedState);
    return new NextResponse(toTwiml(availability.text, { gather: true, state: offerState }), {
      headers: { "Content-Type": "text/xml" },
    });
  }

  if (mode === "ai-answer") {
    const pendingQuestion = incomingText || readPendingAiQuestion(state);
    const detectedIntent = incomingText ? (intentFromInterpretation(interpretedTurn) || detectPhoneIntent(incomingText)) : "menu";

    if (incomingText && detectedIntent !== "menu" && detectedIntent !== "question") {
      if (detectedIntent === "goodbye") {
        return new NextResponse(hangupTwiml("Good bye."), { headers: { "Content-Type": "text/xml" } });
      }

      if (detectedIntent === "mauricio") {
        const emergency = isEmergencyText(incomingText);
        const ownerAssistantCaller = isOwnerAssistantCaller(fromE164, incomingText);
        const opening = emergency
          ? `${mauricioNamePrompt()} Emergency and after-hours service can include an extra cost of 100 dollars.`
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

      if (detectedIntent === "booking") {
        return new NextResponse(toBookingAvailabilityTwiml(withPendingAiQuestion(nextState, incomingText)), {
          headers: { "Content-Type": "text/xml" },
        });
      }

      if (flow.length === 0) {
        return new NextResponse(toThinkingTwiml("Give me a few seconds while I get the best answer to your question.", {
          state: withPendingAiQuestion(nextState, incomingText),
          question: incomingText,
          redirectSuffix: "mode=ai-answer",
        }), {
          headers: { "Content-Type": "text/xml" },
        });
      }

      const prompt = await getNaturalWorkflowPrompt(request, incomingText, detectedIntent, currentStepLabel(flow[0]));
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
        ? "Emergency line active. Trying Leandro Mauricio now. Please hold. Emergency and after-hours service can include an extra cost of 100 dollars."
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
    const explicitClarification = isOfferClarificationRequest(incomingText);
    const recognizedYesNo = detectYesNo(incomingText);

    if (explicitClarification || (recognizedYesNo === "unknown" && interpretedTurn?.kind === "offer_repeat")) {
      return new NextResponse(toTwiml(repeatOfferPrompt(sameDayOffer.date, sameDayOffer.window), { gather: true, state }), {
        headers: { "Content-Type": "text/xml" },
      });
    }

    const interpretedYesNo = yesNoFromInterpretation(interpretedTurn);
    const yesNo = recognizedYesNo !== "unknown" ? recognizedYesNo : interpretedYesNo;

    if (yesNo === "yes") {
      const flow = buildFlowForIntent("booking");
      const bookingData: Record<string, string> = {
        serviceType: "Repair diagnostic",
        city: inferBookingCity(sameDayOffer.question || ""),
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
      const flow: PhoneAssistantState["flow"] = ["city", "preferredTimeWindow", "firstName", "lastName", "phone", "email", "address", "addressCity", "addressZip", "notes"];
      const nextState: PhoneAssistantState = {
        ...cleared,
        intent: "booking",
        flow,
        stepIndex: 0,
        data: {
          ...cleared.data,
          serviceType: "Repair diagnostic",
          city: inferBookingCity(sameDayOffer.question || ""),
          preferredDate: normalizeBookingDate(sameDayOffer.date || "today"),
        },
      };

      return new NextResponse(
        toTwiml(`No problem. ${currentStepLabel(flow[0])}`, {
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
        return new NextResponse(buildRealtimeSipTwiml(callSid, fromE164 || from), {
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

        const naturalPrompt = await getNaturalWorkflowPrompt(request, incomingText, selectedSupportIntent, currentStepLabel(flow[0]));
        return new NextResponse(toTwiml(naturalPrompt, { gather: true, state: nextState }), {
          headers: { "Content-Type": "text/xml" },
        });
      }

      return new NextResponse(toTwiml(`I can help with that. ${supportChoicePrompt()}`, { gather: true, state }), {
        headers: { "Content-Type": "text/xml" },
      });
    }

    const interpretedGreetingAnswer = yesNoFromInterpretation(interpretedTurn);
    const interpretedGreetingIntent = intentFromInterpretation(interpretedTurn);
    const yesNoFromGreeting = interpretedGreetingAnswer !== "unknown"
      ? interpretedGreetingAnswer
      : interpretedGreetingIntent === "booking"
        ? "yes"
        : detectYesNo(incomingText);
    if (yesNoFromGreeting === "yes") {
      const emergency = isEmergencyText(incomingText);
      const ownerAssistantCaller = isOwnerAssistantCaller(fromE164, incomingText);
      const flow = buildFlowForIntent("booking");
      const nextState: PhoneAssistantState = withOwnerAssistantFlag(withEmergencyFlag({ ...state, intent: "booking", flow, stepIndex: 0, data: {} }, emergency), ownerAssistantCaller);
      return new NextResponse(toBookingAvailabilityTwiml(withPendingAiQuestion(nextState, incomingText)), {
        headers: { "Content-Type": "text/xml" },
      });
    }

    if (yesNoFromGreeting === "no") {
      const nextState = withPostIntroSupportPending(state, true);
      return new NextResponse(toTwiml(supportChoicePrompt(), { gather: true, state: nextState }), {
        headers: { "Content-Type": "text/xml" },
      });
    }

    const chosenIntent = intentFromInterpretation(interpretedTurn) || detectPhoneIntent(incomingText);
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
        ? `${mauricioNamePrompt()} Emergency and after-hours service can include an extra cost of 100 dollars.`
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

    if (chosenIntent === "booking") {
      return new NextResponse(toBookingAvailabilityTwiml(withPendingAiQuestion(nextState, incomingText)), {
        headers: { "Content-Type": "text/xml" },
      });
    }

    if (flow.length === 0) {
      const thinkingState = withPendingAiQuestion(nextState, incomingText);
      return new NextResponse(toThinkingTwiml("Give me a few seconds while I get the best answer to your question.", { state: thinkingState, question: incomingText }), {
        headers: { "Content-Type": "text/xml" },
      });
    }

    const openingStepPrompt = await getNaturalWorkflowPrompt(request, incomingText, chosenIntent, currentStepLabel(flow[0]));

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
      ? "Give me a few seconds while I try to get a hold of him right now. Emergency and after-hours service can include an extra cost of 100 dollars."
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

  if (String(state.data[CONTACT_CONFIRMATION_PENDING_KEY] || "") === "1") {
    const confirmation = detectYesNo(incomingText);
    if (confirmation === "no") {
      const data = { ...state.data };
      for (const key of ["firstName", "lastName", "phone", "address", "addressCity", "addressZip", CONTACT_CONFIRMATION_PENDING_KEY, CONTACT_CONFIRMED_KEY]) {
        delete data[key];
      }
      const confirmationFlow: PhoneAssistantState["flow"] = ["firstName", "lastName", "phone", "address", "addressCity", "addressZip"];
      return new NextResponse(toTwiml("No problem. Let us correct it. Please say your first name.", {
        gather: true,
        state: { ...state, data, flow: confirmationFlow, stepIndex: 0 },
      }), { headers: { "Content-Type": "text/xml" } });
    }

    if (confirmation !== "yes") {
      return new NextResponse(toTwiml(`Please say yes if this is correct, or no to correct it. ${contactConfirmationPrompt(state)}`, {
        gather: true,
        state,
      }), { headers: { "Content-Type": "text/xml" } });
    }

    delete state.data[CONTACT_CONFIRMATION_PENDING_KEY];
    state.data[CONTACT_CONFIRMED_KEY] = "1";
    contactConfirmationAccepted = true;
    const finalStep = state.flow[state.flow.length - 1];
    state.stepIndex = state.flow.length - 1;
    incomingText = String(state.data[finalStep] || "No additional notes");
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
  const broadIntent = intentFromInterpretation(interpretedTurn) || detectPhoneIntent(incomingText);
  const effectiveInterruptIntent = (interruptIntent || (broadIntent !== "menu" ? broadIntent : null));
  if (!contactConfirmationAccepted && effectiveInterruptIntent && effectiveInterruptIntent !== state.intent) {
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

    if (effectiveInterruptIntent === "booking") {
      return new NextResponse(toBookingAvailabilityTwiml(withPendingAiQuestion(interruptState, incomingText)), {
        headers: { "Content-Type": "text/xml" },
      });
    }

    if (interruptFlow.length === 0) {
      const thinkingState = withPendingAiQuestion(interruptState, incomingText);
      return new NextResponse(toThinkingTwiml("Give me a few seconds while I get the best answer to your question.", { state: thinkingState, question: incomingText }), {
        headers: { "Content-Type": "text/xml" },
      });
    }

    const interruptPrompt = await getNaturalWorkflowPrompt(request, incomingText, effectiveInterruptIntent, currentStepLabel(interruptFlow[0]));

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
    if (requiresConfirmedContact(state.intent)) {
      const missingStep = missingRequiredContactStep(state);
      if (missingStep) {
        const requiredFlow: PhoneAssistantState["flow"] = [missingStep];
        return new NextResponse(toTwiml(currentStepLabel(missingStep), {
          gather: true,
          state: { ...state, flow: requiredFlow, stepIndex: 0 },
        }), { headers: { "Content-Type": "text/xml" } });
      }

      if (String(state.data[CONTACT_CONFIRMED_KEY] || "") !== "1") {
        state.data[CONTACT_CONFIRMATION_PENDING_KEY] = "1";
        return new NextResponse(toTwiml(contactConfirmationPrompt(state), { gather: true, state }), {
          headers: { "Content-Type": "text/xml" },
        });
      }

      delete state.data[CONTACT_CONFIRMED_KEY];
    }

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
          ? " Emergency and after-hours service can include an extra cost of 100 dollars."
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
        const serviceAddress = [state.data.address, state.data.addressCity, state.data.addressZip].filter(Boolean).join(", ");

        await appendAssistantLead({
          leadId: `VOICE-${Date.now()}`,
          priority: "P1",
          serviceType: "general-service",
          urgency: "now",
          city: normalizeBookingCity(state.data.addressCity || "West Jordan"),
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
          city: normalizeBookingCity(state.data.addressCity || "West Jordan"),
          serviceType: "general-service",
          urgency: "now",
          initialMessage: [callerNotes, `Service address: ${serviceAddress}`].filter(Boolean).join("\n"),
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
          address: [state.data.address, state.data.addressCity, state.data.addressZip].filter(Boolean).join(", "),
          phone: state.data.phone || from,
          city: normalizeBookingCity(state.data.addressCity || "West Jordan"),
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
