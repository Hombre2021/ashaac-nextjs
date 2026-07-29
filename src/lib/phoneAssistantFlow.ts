import { assistantBusinessFacts, getGroundedAssistantAnswer } from "@/lib/assistantKnowledge";

export type PhoneAssistantIntent =
  | "menu"
  | "question"
  | "booking"
  | "mauricio"
  | "callback"
  | "sms-technician"
  | "check-status"
  | "reschedule"
  | "cancel"
  | "goodbye";

export type PhoneAssistantStepKey =
  | "serviceType"
  | "city"
  | "preferredDate"
  | "preferredTimeWindow"
  | "firstName"
  | "lastName"
  | "address"
  | "addressCity"
  | "addressZip"
  | "phone"
  | "email"
  | "requestId"
  | "notes";

export type PhoneAssistantState = {
  callSid?: string;
  intent: PhoneAssistantIntent;
  stepIndex: number;
  flow: PhoneAssistantStepKey[];
  data: Record<string, string>;
  awaitingTextability?: boolean;
  awaitingRescheduleFollowup?: boolean;
};

export type PhoneAssistantResponse = {
  text: string;
  state: PhoneAssistantState;
  complete?: boolean;
  handoff?:
    | { type: "book"; url: string }
    | { type: "callback" }
    | { type: "text" }
    | { type: "status" }
    | { type: "reschedule" }
    | { type: "cancel" }
    | null;
};

export const phoneAssistantGreeting =
  "Thank you for calling All Solutions Heating and Air Conditioning. We offer free estimates, so one of our technicians can come to your location and discuss pricing before you commit to or authorize any work. Would you like to schedule an appointment at our earliest convenience?";

function isBookingRequest(lower: string) {
  return /(\bbook(?:ing)?\b|\bschedul(?:e|ing)\b|make\s+(?:me\s+)?an?\s+appointment|set\s+up\s+an?\s+appointment|need\s+an?\s+appointment|want\s+an?\s+appointment|technician\s+(?:can\s+)?come|technician\s+(?:to\s+)?visit|(?:can|could|would)\s+you\s+come|come\s+(?:today|tomorrow|this\s+(?:morning|afternoon|evening))|\b(?:next\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday)(?:\s+(?:morning|afternoon|evening))?\b|come\s+to\s+(?:my|our|the)\s+(?:home|house|location|address))/.test(lower);
}

function isCallbackRequest(lower: string) {
  return /(callback|call\s+me\s+back|call\s+back|(?:can|could|would)\s+(?:a\s+technician|someone|somebody|you)\s+call\s+(?:me\s+)?(?:back|later)|have\s+(?:a\s+technician|someone|somebody)\s+call\s+me)/.test(lower);
}

function isTechnicianTextRequest(lower: string) {
  return /(text\s+(?:with\s+)?(?:a\s+)?technician|technician\s+(?:to\s+)?text|text\s+me|send\s+me\s+(?:a\s+)?text|(?:have|want|need)\s+(?:a\s+technician|someone|somebody)\s+to\s+text\s+me|connect\s+me.{0,30}(?:by|through|via)\s+text)/.test(lower);
}

export function defaultPhoneAssistantState(callSid?: string): PhoneAssistantState {
  return {
    callSid,
    intent: "menu",
    stepIndex: 0,
    flow: [],
    data: {},
  };
}

export function detectPhoneIntent(text: string): PhoneAssistantIntent {
  const lower = text.toLowerCase();
  const asksAvailability = /(next\s+available|when\s+is\s+your\s+next\s+available|when\s+can\s+you\s+(come|guys\s+come)|how\s+soon\s+can\s+your\s+technician\s+come|when\s+can\s+your\s+technician\s+come)/.test(lower);
  if (/(good\s*bye|goodbye|bye\b|hang up|end this call)/.test(lower)) return "goodbye";
  if (lower.includes("mauricio") || lower.includes("leandro") || (lower.includes("talk") && (lower.includes("mauricio") || lower.includes("leandro")))) return "mauricio";
  if (lower.includes("status") || (lower.includes("check") && lower.includes("status"))) return "check-status";
  if (lower.includes("reschedule") || /\bre[-\s]?schedule\b/.test(lower)) return "reschedule";
  if (lower.includes("cancel")) return "cancel";
  if (asksAvailability || isBookingRequest(lower)) return "booking";
  if (/(transfer|live\s+person|real\s+person|representative|agent|someone\s+now)/.test(lower)) return "sms-technician";
  if (isTechnicianTextRequest(lower)) return "sms-technician";
  if (isCallbackRequest(lower)) return "callback";
  if (lower.includes("question") || lower.includes("service")) return "question";
  return "menu";
}

export function detectPhoneInterruptIntent(text: string): PhoneAssistantIntent | null {
  const lower = text.toLowerCase().trim();

  if (/(good\s*bye|goodbye|bye\b|hang up|end this call)/.test(lower)) return "goodbye";
  if (/(talk\s+to\s+mauricio|talk\s+to\s+leandro|mauricio|leandro)/.test(lower)) return "mauricio";
  if (/(question\s+about\s+service|service\s+question)/.test(lower)) return "question";
  if (/(next\s+available|when\s+is\s+your\s+next\s+available|when\s+can\s+you\s+(come|guys\s+come)|how\s+soon\s+can\s+your\s+technician\s+come|when\s+can\s+your\s+technician\s+come)/.test(lower)) return "booking";
  if (isBookingRequest(lower) || /get\s+service\s+as\s+soon\s+as\s+possible/.test(lower)) return "booking";
  if (/(transfer|live\s+person|real\s+person|representative|agent|someone\s+now)/.test(lower)) return "sms-technician";
  if (isTechnicianTextRequest(lower)) return "sms-technician";
  if (isCallbackRequest(lower)) return "callback";
  if (/(appointment\s+status|check\s+(?:my\s+)?status|status\s+of\s+(?:my\s+)?appointment)/.test(lower)) return "check-status";
  if (/(re[-\s]?schedule\s+(?:an\s+)?appointment|reschedule\s+(?:an\s+)?appointment)/.test(lower)) return "reschedule";
  if (/(cancel\s+(?:an\s+)?appointment)/.test(lower)) return "cancel";

  return null;
}

export function buildFlowForIntent(intent: PhoneAssistantIntent): PhoneAssistantStepKey[] {
  switch (intent) {
    case "mauricio":
      return ["firstName"];
    case "goodbye":
      return [];
    case "check-status":
      return ["firstName", "lastName", "address", "phone", "requestId"];
    case "reschedule":
      return ["firstName", "lastName", "address", "phone", "requestId", "preferredDate", "preferredTimeWindow"];
    case "cancel":
      return ["firstName", "lastName", "address", "phone", "requestId"];
    case "booking":
      return [
        "serviceType",
        "city",
        "preferredDate",
        "preferredTimeWindow",
        "firstName",
        "lastName",
        "phone",
        "email",
        "address",
        "addressCity",
        "addressZip",
        "notes",
      ];
    case "callback":
      return ["firstName", "lastName", "phone", "address", "addressCity", "addressZip", "notes"];
    case "sms-technician":
      return ["firstName", "lastName", "phone", "address", "addressCity", "addressZip", "notes"];
    default:
      return [];
  }
}

export function parseMenuChoice(text: string): PhoneAssistantIntent {
  const lower = text.toLowerCase();
  const asksAvailability = /(next\s+available|when\s+is\s+your\s+next\s+available|when\s+can\s+you\s+(come|guys\s+come)|how\s+soon\s+can\s+your\s+technician\s+come|when\s+can\s+your\s+technician\s+come)/.test(lower);
  if (/(good\s*bye|goodbye|bye\b|hang up|end this call)/.test(lower)) return "goodbye";
  if (lower.includes("mauricio") || lower.includes("leandro") || (lower.includes("talk") && (lower.includes("mauricio") || lower.includes("leandro")))) return "mauricio";
  if (lower.includes("status")) return "check-status";
  if (lower.includes("reschedule")) return "reschedule";
  if (lower.includes("cancel")) return "cancel";
  if (asksAvailability || isBookingRequest(lower)) return "booking";
  if (/(transfer|live\s+person|real\s+person|representative|agent|someone\s+now)/.test(lower)) return "sms-technician";
  if (isTechnicianTextRequest(lower)) return "sms-technician";
  if (isCallbackRequest(lower)) return "callback";
  if (lower.includes("question") || lower.includes("service")) return "question";
  return "menu";
}

export function promptForStep(step: PhoneAssistantStepKey): string {
  switch (step) {
    case "serviceType":
      return "Please say the service type. For example: Repair diagnostic, system replacement estimate, seasonal tune-up, mini split consultation, heat pump consultation, or second opinion.";
    case "city":
      return "Please say your service city. For example: West Jordan, South Jordan, Sandy, Murray, Midvale, Taylorsville, Draper, or Salt Lake City.";
    case "preferredDate":
      return "Please say your preferred date. You can say today, tomorrow, or a date like twenty twenty six dash zero seven dash thirty.";
    case "preferredTimeWindow":
      return "Please say your preferred time window. For example: 8 AM to 10 AM, 10 AM to 12 PM, 12 PM to 2 PM, 2 PM to 4 PM, 4 PM to 6 PM, 6 PM to 8 PM, 8 PM to 10 PM, 10 PM to 11 PM, or Any time.";
    case "firstName":
      return "Please say your first name.";
    case "lastName":
      return "Please say your last name.";
    case "address":
      return "Please say the service address.";
    case "addressCity":
      return "Please say the city for that service address.";
    case "addressZip":
      return "Please say the zip code for that service address.";
    case "phone":
      return "Please say the best phone number.";
    case "email":
      return "Please say your email address so we can send confirmation and appointment details.";
    case "requestId":
      return "If you have the appointment request ID, say it now. If not, say I don't have it.";
    case "notes":
      return "Please describe the message for the technician.";
  }
}

export function isMauricioFlow(state?: { intent?: PhoneAssistantIntent }) {
  return state?.intent === "mauricio";
}

export function normalizePhoneDigits(value: string) {
  return String(value || "").replace(/\D+/g, "");
}

export function detectYesNo(value: string): "yes" | "no" | "unknown" {
  const lower = value.trim().toLowerCase();
  if (/^(y|yes|sure|ok|okay|correct|affirmative)\b/.test(lower)) return "yes";
  if (/^(n|no|nope|negative|cannot|can not|can't|cant)\b/.test(lower)) return "no";
  return "unknown";
}

export function groundedPhoneAnswer(question: string) {
  return getGroundedAssistantAnswer(question) || assistantBusinessFacts[0];
}

export function summarizeCollectedData(data: Record<string, string>) {
  const name = [data.firstName, data.lastName].filter(Boolean).join(" ").trim() || "Customer";
  const phone = data.phone || "";
  const address = data.address || "";
  const requestId = data.requestId || "";
  const parts = [name, phone ? `phone ${phone}` : "", address ? `address ${address}` : "", requestId ? `request id ${requestId}` : ""];
  return parts.filter(Boolean).join(", ");
}

export function encodePhoneAssistantState(state: PhoneAssistantState) {
  return Buffer.from(JSON.stringify(state), "utf8").toString("base64url");
}

export function decodePhoneAssistantState(raw: string | null | undefined): PhoneAssistantState {
  if (!raw) {
    return defaultPhoneAssistantState();
  }

  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as Partial<PhoneAssistantState>;
    return {
      ...defaultPhoneAssistantState(parsed.callSid),
      ...parsed,
      intent: (parsed.intent as PhoneAssistantIntent) || "menu",
      stepIndex: typeof parsed.stepIndex === "number" ? parsed.stepIndex : 0,
      flow: Array.isArray(parsed.flow) ? (parsed.flow as PhoneAssistantStepKey[]) : [],
      data: parsed.data && typeof parsed.data === "object" ? (parsed.data as Record<string, string>) : {},
    };
  } catch {
    return defaultPhoneAssistantState();
  }
}
