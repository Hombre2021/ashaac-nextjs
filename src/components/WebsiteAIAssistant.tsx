"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { trackAssistantAction } from "@/lib/analytics";
import styles from "./WebsiteAIAssistant.module.css";

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "error-callback"?: () => void;
      theme?: "light" | "dark" | "auto";
    },
  ) => string;
  reset: (widgetId?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

type HandoffMode = "callback" | "sms-technician" | "live-transfer";

type ConversationField =
  | "requestId"
  | "serviceType"
  | "urgency"
  | "bookingMode"
  | "preferredDate"
  | "preferredTimeWindow"
  | "firstName"
  | "address"
  | "phone"
  | "city"
  | "email"
  | "contactMethod"
  | "homeType"
  | "notes"
  | "liveTechnicianPhone";

type AssistantStep = {
  key: ConversationField;
  prompt: string;
  optional?: boolean;
  choices?: string[];
  placeholder?: string;
};

type AssistantPayload = {
  requestId: string;
  serviceType: string;
  urgency: string;
  bookingMode: string;
  preferredDate: string;
  preferredTimeWindow: string;
  firstName: string;
  address: string;
  phone: string;
  city: string;
  email: string;
  contactMethod: string;
  homeType: string;
  notes: string;
  handoffMode: string;
  liveTechnicianPhone: string;
};

type PostAnswerAction = "none" | "awaiting-choice" | "text" | "callback";
const postAnswerChoices = ["Book appointment", "Technician text", "Technician call back", "None of these - End conversation"] as const;

type Message = { from: "assistant" | "user"; text: string };

type CallbackFollowup = {
  leadId: string;
  firstName: string;
  phone: string;
};

type RescheduleFollowup = {
  requestId: string;
  phone: string;
  firstName: string;
  address: string;
};

type LeadResponse = {
  ok: boolean;
  leadId: string;
  priority: "P1" | "P2" | "P3";
  bookingActions?: {
    bookingUrl?: string;
    callUrl?: string;
    textUrl?: string;
  };
  handoff?: {
    hvacPro?: { success?: boolean; detail?: string };
    hvacProTask?: { success?: boolean; detail?: string };
    liveTechnician?: { success?: boolean; detail?: string };
  };
};

const firstChoices = [
  "Question about service",
  "I need service ASAP",
  "I want to book an appointment",
  "Text with a live technician now",
  "Call me back",
  "Check appointment status",
  "Reschedule appointment",
  "Cancel appointment",
];

const issueChoices = ["AC not cooling", "No heat", "Need maintenance", "Need install", "Use your own words"];
const urgencyChoices = ["Need help now", "Book appointment"];

const emptyPayload: AssistantPayload = {
  requestId: "",
  serviceType: "",
  urgency: "",
  bookingMode: "",
  preferredDate: "",
  preferredTimeWindow: "",
  firstName: "",
  address: "",
  phone: "",
  city: "",
  email: "",
  contactMethod: "",
  homeType: "",
  notes: "",
  handoffMode: "",
  liveTechnicianPhone: "",
};

function normalizeValue(key: ConversationField, value: string): string {
  const v = value.trim();
  const lower = v.toLowerCase();

  if (key === "serviceType") {
    if (lower.includes("cool")) return "no-cooling";
    if (lower.includes("heat")) return "no-heat";
    if (lower.includes("maint")) return "maintenance";
    if (lower.includes("install")) return "install";
    return "general-service";
  }

  if (key === "urgency") {
    if (lower.includes("now")) return "now";
    if (lower.includes("book")) return "book-appointment";
    return "now";
  }

  if (key === "contactMethod") {
    if (lower.includes("text")) return "text";
    if (lower.includes("email")) return "email";
    return "phone";
  }

  if (key === "homeType") {
    if (lower.includes("tenant")) return "tenant";
    if (lower.includes("manager")) return "manager";
    return "owner";
  }

  if (key === "bookingMode") {
    if (lower.includes("book")) return "book-appointment";
    return "callback-only";
  }

  if (key === "preferredTimeWindow") {
    if (lower.includes("morn")) return "morning";
    if (lower.includes("after")) return "afternoon";
    if (lower.includes("even")) return "evening";
    return "any-time";
  }

  if (key === "requestId") {
    if (lower.includes("don't have") || lower.includes("dont have") || lower === "na" || lower === "n/a") {
      return "";
    }
  }

  return v;
}

function detectIntent(text: string) {
  const lower = text.toLowerCase();
  if (lower.includes("status") && lower.includes("appointment")) return "appointment-status";
  if (lower.includes("reschedule")) return "appointment-reschedule";
  if (lower.includes("cancel") && lower.includes("appointment")) return "appointment-cancel";
  if (lower.includes("text") && lower.includes("technician")) return "sms-technician";
  if (lower.includes("transfer")) return "live-transfer";
  if (lower.includes("call me")) return "callback";
  if (lower.includes("book") || lower.includes("appointment")) return "booking";
  if (lower.includes("asap") || lower.includes("urgent") || lower.includes("now")) return "asap";
  return "question";
}

function detectKnowledgeReply(text: string) {
  const lower = text.toLowerCase();
  if (lower.includes("filter")) {
    return "A clogged filter can reduce airflow and comfort. We can also send a technician if you'd like.";
  }
  if (lower.includes("thermostat") || lower.includes("temp")) {
    return "For thermostat issues, check batteries and mode first. If it still fails, we can route service today.";
  }
  if (lower.includes("not cooling") || lower.includes("no cool") || /\bac\b/.test(lower) || lower.includes("air conditioner")) {
    return "I can help with a no-cooling issue right away.";
  }
  if (lower.includes("not heating") || lower.includes("no heat") || lower.includes("furnace")) {
    return "No heat is usually urgent. I can route this as priority and help you book right now.";
  }
  return "Thanks for your message. How can I help with your HVAC service today?";
}

function isAffirmativeReply(value: string) {
  const normalized = value.trim().toLowerCase();
  const affirmatives = new Set([
    "yes",
    "yes please",
    "y",
    "yeah",
    "yep",
    "yup",
    "sure",
    "ok",
    "okay",
    "please do",
    "do it",
    "let's do it",
    "lets do it",
  ]);

  return affirmatives.has(normalized);
}

function isQuestionLikeInput(value: string) {
  const text = value.trim().toLowerCase();
  if (!text) return false;
  if (text.includes("?")) return true;
  return /^(do|does|can|is|are|what|when|where|how|why)\b/.test(text);
}

async function fetchRealAiAnswer(question: string, turnstileToken = "") {
  const response = await fetch("/api/assistant/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, turnstileToken }),
  });

  if (!response.ok) {
    throw new Error("AI answer request failed");
  }

  const payload = (await response.json()) as {
    answer?: string;
    sources?: Array<{ title?: string; url?: string }>;
  };

  const answer = String(payload.answer || "").trim();
  const sources = Array.isArray(payload.sources)
    ? payload.sources
      .map((item) => ({ title: String(item?.title || "").trim(), url: String(item?.url || "").trim() }))
      .filter((item) => item.url)
    : [];

  return { answer, sources };
}

function appendCitationTrail(answer: string, sources: Array<{ title: string; url: string }>) {
  const cleanAnswer = String(answer || "").trim();
  if (!cleanAnswer) return "";
  if (!Array.isArray(sources) || sources.length === 0) return cleanAnswer;

  const lines = sources.slice(0, 4).map((source, index) => {
    const label = source.title || `Source ${index + 1}`;
    return `- ${label}: ${source.url}`;
  });

  return `${cleanAnswer}\n\nSources:\n${lines.join("\n")}`;
}

function buildQueue(intent: string): AssistantStep[] {
  if (intent === "appointment-status") {
    return [
      { key: "firstName", prompt: "", placeholder: "Enter first and last name on the appointment and press send" },
      { key: "address", prompt: "What is the service address?", placeholder: "123 Main St, West Jordan, UT" },
      { key: "phone", prompt: "Phone number used when booking?", placeholder: "801-555-1234" },
      { key: "requestId", prompt: "Booking request ID if you have it?", optional: true, placeholder: "Example: A1B2C3D4", choices: ["I don't have it"] },
    ];
  }

  if (intent === "appointment-reschedule") {
    return [
      { key: "firstName", prompt: "", placeholder: "Please enter your name here." },
      { key: "address", prompt: "What is the service address?", placeholder: "123 Main St, West Jordan, UT" },
      { key: "phone", prompt: "Phone number used when booking?", placeholder: "801-555-1234" },
      { key: "requestId", prompt: "Booking request ID if you have it?", optional: true, placeholder: "Example: A1B2C3D4", choices: ["I don't have it"] },
    ];
  }

  if (intent === "appointment-cancel") {
    return [
      { key: "firstName", prompt: "", placeholder: "Please enter your name here." },
      { key: "address", prompt: "What is the service address?", placeholder: "123 Main St, West Jordan, UT" },
      { key: "phone", prompt: "Phone number used when booking?", placeholder: "801-555-1234" },
      { key: "requestId", prompt: "Booking request ID if you have it?", optional: true, placeholder: "Example: A1B2C3D4", choices: ["I don't have it"] },
      { key: "email", prompt: "Email is optional; if you share it, we'll send estimates, invoices, and receipts there.", optional: true, placeholder: "name@email.com" },
      { key: "notes", prompt: "Reason for cancellation?", optional: true, placeholder: "Optional reason" },
    ];
  }

  if (intent === "booking") {
    return [];
  }

  if (intent === "callback") {
    return [
      { key: "firstName", prompt: "", placeholder: "Please enter your name here." },
      { key: "notes", prompt: "Describe in your own words the message you want to communicate to our technician, so he is prepared to call you.", placeholder: "Type your message for the technician..." },
      { key: "phone", prompt: "Best phone number for technician to call you back?", placeholder: "801-555-1234" },
    ];
  }

  if (intent === "sms-technician") {
    return [
      { key: "firstName", prompt: "", placeholder: "Please enter your name here." },
      { key: "notes", prompt: "Describe in your own words the message you want to communicate to our technician.", placeholder: "Type your message for the technician..." },
      { key: "phone", prompt: "Best phone number for technician to text with you in case we get disconnected?", placeholder: "801-555-1234" },
    ];
  }

  return [
    { key: "firstName", prompt: "", placeholder: "Please enter your name here." },
    { key: "address", prompt: "What is the service address?", placeholder: "123 Main St, West Jordan, UT" },
    { key: "phone", prompt: "Best phone number?", placeholder: "801-555-1234" },
    { key: "serviceType", prompt: "What is the main issue?", choices: issueChoices },
    { key: "urgency", prompt: "How urgent is this?", choices: urgencyChoices },
    { key: "bookingMode", prompt: "Book appointment or callback only?", choices: ["Book appointment", "Callback only"] },
    { key: "email", prompt: "Email address? Optional. If provided, we'll use it for estimates, invoices, and receipts.", optional: true, placeholder: "name@email.com" },
    { key: "contactMethod", prompt: "Best contact method?", choices: ["Phone", "Text", "Email"] },
    { key: "homeType", prompt: "Homeowner, tenant, or property manager?", choices: ["Homeowner", "Tenant", "Property manager"] },
    { key: "notes", prompt: "Anything else the technician should know?", optional: true, placeholder: "Symptoms, model, preferred time..." },
    { key: "liveTechnicianPhone", prompt: "Live technician phone for SMS handoff?", optional: true, placeholder: "+18017553040" },
  ];
}

export default function WebsiteAIAssistant() {
  const pathname = usePathname();
  const isHomepage = pathname === "/";
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [payload, setPayload] = useState<AssistantPayload>(emptyPayload);
  const [queue, setQueue] = useState<AssistantStep[]>([]);
  const [stepIndex, setStepIndex] = useState(-1);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [actions, setActions] = useState<LeadResponse["bookingActions"]>();
  const [intent, setIntent] = useState("");
  const [manualServiceTypeEntry, setManualServiceTypeEntry] = useState(false);
  const [manualQuestionEntry, setManualQuestionEntry] = useState(false);
  const [postAnswerAction, setPostAnswerAction] = useState<PostAnswerAction>("none");
  const [callbackTextabilityPending, setCallbackTextabilityPending] = useState(false);
  const [callbackFollowup, setCallbackFollowup] = useState<CallbackFollowup | null>(null);
  const [rescheduleFollowup, setRescheduleFollowup] = useState<RescheduleFollowup | null>(null);
  const [suppressQuickReplies, setSuppressQuickReplies] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileLoadIssue, setTurnstileLoadIssue] = useState(false);
  const [turnstileReloadTick, setTurnstileReloadTick] = useState(0);
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);
  const turnstileSiteKeyRaw = (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "").trim();
  const turnstileSiteKey = turnstileSiteKeyRaw.startsWith("REPLACE_WITH_") ? "" : turnstileSiteKeyRaw;
  const isLocalHost = typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const turnstileEnabled = Boolean(turnstileSiteKey) && !isLocalHost;

  const safeResetTurnstile = () => {
    if (!window.turnstile || !turnstileWidgetIdRef.current) return;
    try {
      window.turnstile.reset(turnstileWidgetIdRef.current);
    } catch {
      // Ignore stale widget errors and let the next render create a fresh widget.
    }
  };

  useEffect(() => {
    if (!open || !manualQuestionEntry || !turnstileEnabled) return;

    const ensureScriptAndRender = () => {
      if (!window.turnstile || !turnstileContainerRef.current) return;
      if (turnstileWidgetIdRef.current && turnstileContainerRef.current.childElementCount > 0) return;
      if (turnstileWidgetIdRef.current && turnstileContainerRef.current.childElementCount === 0) {
        turnstileWidgetIdRef.current = null;
      }

      try {
        turnstileContainerRef.current.innerHTML = "";
        turnstileWidgetIdRef.current = window.turnstile.render(turnstileContainerRef.current, {
          sitekey: turnstileSiteKey,
          theme: "light",
          callback: (token) => {
            setTurnstileToken(token);
            setTurnstileLoadIssue(false);
            setStatus("");
          },
          "error-callback": () => {
            setTurnstileToken("");
            setTurnstileLoadIssue(true);
            setStatus("Robot check failed. Please try again.");
          },
        });
      } catch {
        setTurnstileLoadIssue(true);
      }
    };

    let attempts = 0;
    const maxAttempts = 120;
    const pollId = window.setInterval(() => {
      ensureScriptAndRender();
      if (turnstileWidgetIdRef.current) {
        window.clearInterval(pollId);
        return;
      }

      attempts += 1;
      if (attempts >= maxAttempts) {
        window.clearInterval(pollId);
        setTurnstileLoadIssue(true);
      }
    }, 100);

    if (window.turnstile) {
      ensureScriptAndRender();
      return () => {
        window.clearInterval(pollId);
      };
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-assistant-turnstile="1"]');
    if (existing) {
      existing.addEventListener("load", ensureScriptAndRender, { once: true });
      return () => {
        window.clearInterval(pollId);
      };
    }

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.dataset.assistantTurnstile = "1";
    script.addEventListener("load", ensureScriptAndRender, { once: true });
    document.head.appendChild(script);

    return () => {
      window.clearInterval(pollId);
    };
  }, [manualQuestionEntry, open, turnstileEnabled, turnstileSiteKey, turnstileReloadTick]);

  const reloadRobotCheck = () => {
    safeResetTurnstile();

    if (turnstileContainerRef.current) {
      turnstileContainerRef.current.innerHTML = "";
    }
    turnstileWidgetIdRef.current = null;
    setTurnstileToken("");
    setTurnstileLoadIssue(false);
    setStatus("");
    setTurnstileReloadTick((value) => value + 1);
  };

  const step = queue[stepIndex] || null;

  const quickChoices = useMemo(() => {
    if (postAnswerAction === "awaiting-choice") return [...postAnswerChoices];
    if (suppressQuickReplies) return [];
    if (stepIndex < 0 && manualQuestionEntry) return [];
    if (stepIndex < 0) return firstChoices;
    if (manualServiceTypeEntry && step?.key === "serviceType") return [];
    return step?.choices || [];
  }, [manualQuestionEntry, manualServiceTypeEntry, postAnswerAction, step, stepIndex, suppressQuickReplies]);

  const appendMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
  };

  const resetConversation = () => {
    setMessages([]);
    setPayload(emptyPayload);
    setQueue([]);
    setStepIndex(-1);
    setInput("");
    setStatus("");
    setBusy(false);
    setActions(undefined);
    setIntent("");
    setManualServiceTypeEntry(false);
    setManualQuestionEntry(false);
    setPostAnswerAction("none");
    setCallbackTextabilityPending(false);
    setCallbackFollowup(null);
    setRescheduleFollowup(null);
    setSuppressQuickReplies(false);
    setTurnstileToken("");
    safeResetTurnstile();
  };

  const beginFlow = async (requestText: string) => {
    const pickedIntent = detectIntent(requestText);
    setIntent(pickedIntent);

    const defaultHandoff: HandoffMode =
      pickedIntent === "sms-technician" ? "sms-technician" : pickedIntent === "live-transfer" ? "live-transfer" : "callback";

    const inferredServiceType = normalizeValue("serviceType", requestText);
    const inferredUrgency = /(asap|urgent|now)/i.test(requestText) ? "now" : "month";
    const inferredBookingMode = pickedIntent === "booking" ? "book-appointment" : "callback-only";

    setPayload((prev) => ({
      ...prev,
      handoffMode: defaultHandoff,
      serviceType: inferredServiceType === requestText.trim() ? "general-service" : inferredServiceType,
      urgency: inferredUrgency,
      bookingMode: inferredBookingMode,
    }));

    if (pickedIntent === "booking" || pickedIntent === "asap") {
      setSuppressQuickReplies(true);
      setPostAnswerAction("none");
      trackAssistantAction("assistant_booking_redirect", {
        intent: pickedIntent,
        source: "assistant-intent",
        service_type: inferredServiceType,
      });
      appendMessage({ from: "assistant", text: "I’m sending you to the booking form now so you can book your same-day appointment." });
      setStatus("");
      window.location.assign("/book");
      return;
    }

    let assistantReply = detectKnowledgeReply(requestText);

    if (pickedIntent === "sms-technician") {
      assistantReply = "Let me gather some information before transfering this text flow to the technician; Please enter your name first, press Send, and then describe in your own words the message you want to communicate to our technician.";
    }

    if (pickedIntent === "callback") {
      assistantReply = "Let me gather some information before having one of our technicians call you back; Please enter your name first, press Send, and then describe in your own words the message you want to communicate to our technician, so he is prepared to call you back.";
    }

    if (pickedIntent === "appointment-status") {
      assistantReply = "";
    }

    if (["appointment-reschedule", "appointment-cancel"].includes(pickedIntent)) {
      assistantReply = "";
    }

    if (pickedIntent === "question") {
      setSuppressQuickReplies(true);
      try {
        const aiResult = await fetchRealAiAnswer(requestText, turnstileToken);
        if (aiResult.answer) {
          assistantReply = appendCitationTrail(aiResult.answer, aiResult.sources);
          trackAssistantAction("assistant_question_answered", {
            intent: pickedIntent,
            source: "assistant-question",
            question_length: requestText.length,
          });
        }
      } catch {
        // Keep local fallback reply when AI is unavailable.
      }
    }

    if (assistantReply) {
      appendMessage({ from: "assistant", text: assistantReply });
    }

    if (pickedIntent === "question") {
      setQueue([]);
      setStepIndex(-1);
      setPostAnswerAction("awaiting-choice");
      setSuppressQuickReplies(false);
      setStatus("");
      return;
    }

    setPostAnswerAction("none");

    const nextQueue = buildQueue(pickedIntent);
    setQueue(nextQueue);
    setStepIndex(0);
    if (nextQueue[0]?.prompt) {
      appendMessage({ from: "assistant", text: nextQueue[0].prompt });
    }
  };

  const submitAppointmentAction = async (finalPayload: AssistantPayload) => {
    setBusy(true);
    setStatus("Checking appointment details...");

    const action =
      intent === "appointment-status"
        ? "status"
        : intent === "appointment-reschedule"
          ? "reschedule"
          : "cancel";

    try {
      if (action === "reschedule") {
        const lookupResponse = await fetch("/api/assistant/appointments/manage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "status",
            requestId: finalPayload.requestId,
            phone: finalPayload.phone,
            firstName: finalPayload.firstName,
            address: finalPayload.address,
          }),
        });

        const lookupResult = (await lookupResponse.json().catch(() => null)) as {
          ok?: boolean;
          detail?: string;
          appointment?: { requestId?: string };
        } | null;

        if (!lookupResponse.ok || !lookupResult?.ok) {
          throw new Error(lookupResult?.detail || "Could not find the appointment.");
        }

        setRescheduleFollowup({
          requestId: lookupResult.appointment?.requestId || finalPayload.requestId,
          phone: finalPayload.phone,
          firstName: finalPayload.firstName,
          address: finalPayload.address,
        });
        appendMessage({ from: "assistant", text: "When would you like to re-schedule?" });
        setStepIndex(-1);
        setStatus("");
        return;
      }

      const response = await fetch("/api/assistant/appointments/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          requestId: finalPayload.requestId,
          phone: finalPayload.phone,
          firstName: finalPayload.firstName,
          address: finalPayload.address,
          preferredDate: finalPayload.preferredDate,
          preferredTimeWindow: finalPayload.preferredTimeWindow,
          reason: finalPayload.notes,
        }),
      });

      const result = (await response.json().catch(() => null)) as { ok?: boolean; detail?: string } | null;

      if (!response.ok || !result?.ok) {
        throw new Error(result?.detail || "Could not process appointment action.");
      }

      setStatus(result.detail || "Appointment action completed.");
      appendMessage({ from: "assistant", text: result.detail || "Appointment action completed." });
      setStepIndex(queue.length);
    } catch (error) {
      setStatus(String((error as Error)?.message || "Appointment action failed."));
    } finally {
      setBusy(false);
    }
  };

  const submitTextHandoff = async (finalPayload: AssistantPayload) => {
    if (!finalPayload.firstName.trim() || !finalPayload.phone.trim()) {
      setStatus("Please provide your name and phone number.");
      return;
    }

    setBusy(true);
    setStatus("Opening live text thread...");

    try {
      const response = await fetch("/api/assistant/text-threads/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerPhone: finalPayload.phone,
          firstName: finalPayload.firstName || "Customer",
          city: finalPayload.city || "West Jordan",
          serviceType: finalPayload.serviceType || "general-service",
          urgency: finalPayload.urgency || "now",
          initialMessage: finalPayload.notes || "",
        }),
      });

      const data = (await response.json().catch(() => null)) as { ok?: boolean; thread?: { code?: string } } | null;
      if (!response.ok || !data?.ok) {
        throw new Error("Unable to open live text thread.");
      }

      const code = data.thread?.code || "";
      const message = code
        ? `Perfect, ${finalPayload.firstName}. We opened a text thread. Reference #${code}. Please wait a couple of minutes and you will recieve a new text on your phone from our technitian and you can continue texting with him through your phone. Thank you!`
        : `Perfect, ${finalPayload.firstName}. We opened a text thread. Please wait a couple of minutes and you will recieve a new text on your phone from our technitian and you can continue texting with him through your phone. Thank you!`;
      appendMessage({ from: "assistant", text: message });
      setStatus(message);
      setPostAnswerAction("none");
      setStepIndex(queue.length);
    } catch (error) {
      setStatus(String((error as Error)?.message || "Unable to open text thread."));
    } finally {
      setBusy(false);
    }
  };

  const submitCallbackRequest = async (finalPayload: AssistantPayload) => {
    if (!finalPayload.firstName.trim() || !finalPayload.phone.trim()) {
      setStatus("Please provide your name and phone number.");
      return;
    }

    const bestTime = finalPayload.notes.trim() || "the next available window";
    const message = `Perfect, ${finalPayload.firstName}. We will call you at ${finalPayload.phone} around ${bestTime}.`;
    appendMessage({ from: "assistant", text: message });
    setStatus(message);
    setPostAnswerAction("none");
    setStepIndex(queue.length);
  };

  const advance = async (rawValue: string) => {
    const trimmed = rawValue.trim();

    if (stepIndex < 0) {
      if (!trimmed) {
        setStatus("Please tell me what you need help with.");
        return;
      }

      if (rescheduleFollowup) {
        appendMessage({ from: "user", text: trimmed });
        setInput("");
        setBusy(true);
        setStatus("Updating your appointment...");

        try {
          const response = await fetch("/api/assistant/appointments/manage", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "reschedule",
              requestId: rescheduleFollowup.requestId,
              phone: rescheduleFollowup.phone,
              firstName: rescheduleFollowup.firstName,
              address: rescheduleFollowup.address,
              preferredDate: trimmed,
              preferredTimeWindow: "",
            }),
          });

          const result = (await response.json().catch(() => null)) as { ok?: boolean; detail?: string } | null;
          if (!response.ok || !result?.ok) {
            throw new Error(result?.detail || "Unable to re-schedule the appointment.");
          }

          const confirm = `Your appointment has been re-scheduled for ${trimmed}`;
          appendMessage({ from: "assistant", text: confirm });
          setStatus(confirm);
          setRescheduleFollowup(null);
        } catch (error) {
          setStatus(String((error as Error)?.message || "Unable to re-schedule the appointment."));
        } finally {
          setBusy(false);
        }
        return;
      }

      if (callbackTextabilityPending && callbackFollowup) {
        const lower = trimmed.toLowerCase();
        const canText = isAffirmativeReply(trimmed) || lower.includes("yes") || lower.includes("can text") || lower.includes("receive text") || lower.includes("recieve text");
        const cannotText = /\b(no|cannot|can not|can't|cant|nope)\b/.test(lower);

        appendMessage({ from: "user", text: trimmed });
        setInput("");

        if (!canText && !cannotText) {
          appendMessage({ from: "assistant", text: "Please answer yes or no so I can update our technician." });
          setStatus("Please answer yes or no.");
          return;
        }

        try {
          await fetch("/api/assistant/callback-textability", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              leadId: callbackFollowup.leadId,
              firstName: callbackFollowup.firstName,
              phone: callbackFollowup.phone,
              canText,
            }),
          });
        } catch {
          // Continue user flow even if technician update fails.
        }

        appendMessage({ from: "assistant", text: "Great, thank you for the information" });
        setStatus("");
        setCallbackTextabilityPending(false);
        setCallbackFollowup(null);
        return;
      }

      if (manualQuestionEntry) {
        if (turnstileEnabled && !turnstileToken) {
          setStatus("Please complete the I am not a robot check first.");
          return;
        }

        appendMessage({ from: "user", text: trimmed });
        setStatus("");
        setInput("");
        setManualQuestionEntry(false);
        setSuppressQuickReplies(true);
        await beginFlow(trimmed);
        return;
      }

      if (trimmed.toLowerCase().includes("question about service")) {
        appendMessage({ from: "user", text: trimmed });
        appendMessage({ from: "assistant", text: "Please type your question in your own words below, then press Send." });
        setManualQuestionEntry(true);
        setSuppressQuickReplies(true);
        setTurnstileToken("");
        setStatus("Type your question and press Send.");
        setInput("");
        return;
      }

      if (trimmed.toLowerCase().includes("i want to book an appointment")) {
        appendMessage({ from: "user", text: trimmed });
        setStatus("Taking you to the booking page...");
        window.location.assign("/book");
        return;
      }

      if (trimmed.toLowerCase().includes("i need service asap")) {
        appendMessage({ from: "user", text: trimmed });
        appendMessage({ from: "assistant", text: "I’m sending you to the booking form now so you can book your same-day appointment." });
        setSuppressQuickReplies(true);
        setStatus("");
        window.location.assign("/book");
        return;
      }

      if (postAnswerAction === "awaiting-choice") {
        const lower = trimmed.toLowerCase();
        appendMessage({ from: "user", text: trimmed });

        if (isAffirmativeReply(trimmed) || lower.includes("book") || lower.includes("appointment")) {
          appendMessage({ from: "assistant", text: "I’m sending you to the booking form now so you can book your same-day appointment." });
          setPostAnswerAction("none");
          setSuppressQuickReplies(true);
          setStatus("");
          window.location.assign("/book");
          return;
        }

        if (lower.includes("text") || lower.includes("sms")) {
          const textQueue: AssistantStep[] = [
            { key: "firstName", prompt: "Great, what is your name?", placeholder: "First name" },
            { key: "phone", prompt: "Best phone number for text?", placeholder: "801-555-1234" },
          ];
          setPostAnswerAction("text");
          setQueue(textQueue);
          setStepIndex(0);
          setStatus("");
          appendMessage({ from: "assistant", text: textQueue[0].prompt });
          return;
        }

        if (lower.includes("call") || lower.includes("callback") || lower.includes("call back")) {
          const callbackQueue: AssistantStep[] = [
            { key: "firstName", prompt: "Great, what is your name?", placeholder: "First name" },
            { key: "phone", prompt: "Best callback number?", placeholder: "801-555-1234" },
            { key: "notes", prompt: "Best time to call you?", placeholder: "Example: today after 3 PM" },
          ];
          setPostAnswerAction("callback");
          setQueue(callbackQueue);
          setStepIndex(0);
          setStatus("");
          appendMessage({ from: "assistant", text: callbackQueue[0].prompt });
          return;
        }

        if (lower.includes("none") || lower.includes("end") || lower.includes("goodbye") || lower.includes("good bye")) {
          appendMessage({ from: "assistant", text: "Thank you for contacting us, good bye." });
          setPostAnswerAction("none");
          setSuppressQuickReplies(true);
          setStatus("");
          return;
        }

        appendMessage({ from: "assistant", text: "Please reply with book appointment, text me, or call me back." });
        setStatus("Please choose book, text, or callback.");
        return;
      }

      appendMessage({ from: "user", text: trimmed });
      setStatus("");
      setInput("");
      await beginFlow(trimmed);
      return;
    }

    if (!step) return;

    if (step.key === "urgency" && trimmed.toLowerCase().includes("book appointment")) {
      appendMessage({ from: "user", text: trimmed });
      setSuppressQuickReplies(true);
      setStatus("");
      window.location.assign("/book");
      return;
    }

    if (step.key === "bookingMode" && trimmed.toLowerCase().includes("book")) {
      appendMessage({ from: "user", text: trimmed });
      setSuppressQuickReplies(true);
      setStatus("");
      window.location.assign("/book");
      return;
    }

    if (step.key === "serviceType" && trimmed.toLowerCase() === "use your own words") {
      setManualServiceTypeEntry(true);
      setStatus("Please type your issue in your own words below, then press Send.");
      setInput("");
      return;
    }

    if (step.key === "serviceType" && isQuestionLikeInput(trimmed)) {
      if (turnstileEnabled && !turnstileToken) {
        setStatus("Please complete the I am not a robot check first.");
        return;
      }

      appendMessage({ from: "user", text: trimmed });
      setInput("");
      setSuppressQuickReplies(true);
      try {
        const aiResult = await fetchRealAiAnswer(trimmed, turnstileToken);
        const message = aiResult.answer
          ? appendCitationTrail(aiResult.answer, aiResult.sources)
          : detectKnowledgeReply(trimmed);
        appendMessage({ from: "assistant", text: message });
      } catch {
        appendMessage({ from: "assistant", text: detectKnowledgeReply(trimmed) });
      }

      appendMessage({ from: "assistant", text: step.prompt });
      setStatus("Answered. Tell me the main issue when you are ready.");
      return;
    }

    if (!trimmed && !step.optional) {
      setStatus("Please answer this question before continuing.");
      return;
    }

    appendMessage({ from: "user", text: trimmed || "Skipped" });
    setStatus("");
    setManualServiceTypeEntry(false);
    if (step.key === "serviceType") {
      setSuppressQuickReplies(false);
    }

    const normalized = normalizeValue(step.key, trimmed);
    setPayload((prev) => ({ ...prev, [step.key]: normalized }));
    setInput("");

    const nextIndex = stepIndex + 1;
    if (nextIndex >= queue.length) {
      const finalPayload = { ...payload, [step.key]: normalized };
      if (postAnswerAction === "text") {
        await submitTextHandoff(finalPayload);
        return;
      }
      if (postAnswerAction === "callback") {
        await submitCallbackRequest(finalPayload);
        return;
      }
      if (intent === "sms-technician") {
        await submitTextHandoff(finalPayload);
        return;
      }
      if (intent === "booking") {
        setSuppressQuickReplies(true);
        setStatus("");
        window.location.assign("/book");
        return;
      }
      if (["appointment-status", "appointment-reschedule", "appointment-cancel"].includes(intent)) {
        await submitAppointmentAction(finalPayload);
      } else {
        await submitLead(finalPayload);
      }
      return;
    }

    setStepIndex(nextIndex);
    if (queue[nextIndex]?.prompt) {
      appendMessage({ from: "assistant", text: queue[nextIndex].prompt });
    }
  };

  const onQuickChoice = async (choice: string) => {
    const lower = choice.trim().toLowerCase();

    if (postAnswerAction === "awaiting-choice") {
      appendMessage({ from: "user", text: choice });

      if (lower.includes("book")) {
        trackAssistantAction("assistant_booking_redirect", {
          intent: "post-answer-book",
          source: "assistant-choice",
          service_type: payload.serviceType || "general-service",
        });
        appendMessage({ from: "assistant", text: "I’m sending you to the booking form now so you can book your same-day appointment." });
        setPostAnswerAction("none");
        setSuppressQuickReplies(true);
        setStatus("");
        window.location.assign("/book");
        return;
      }

      if (lower.includes("text")) {
        const textQueue: AssistantStep[] = [
          { key: "firstName", prompt: "Great, what is your name?", placeholder: "First name" },
          { key: "phone", prompt: "Best phone number for text?", placeholder: "801-555-1234" },
        ];
        setPostAnswerAction("text");
        setQueue(textQueue);
        setStepIndex(0);
        setStatus("");
        appendMessage({ from: "assistant", text: textQueue[0].prompt });
        return;
      }

      if (lower.includes("call")) {
        const callbackQueue: AssistantStep[] = [
          { key: "firstName", prompt: "Great, what is your name?", placeholder: "First name" },
          { key: "phone", prompt: "Best callback number?", placeholder: "801-555-1234" },
          { key: "notes", prompt: "Best time to call you?", placeholder: "Example: today after 3 PM" },
        ];
        setPostAnswerAction("callback");
        setQueue(callbackQueue);
        setStepIndex(0);
        setStatus("");
        appendMessage({ from: "assistant", text: callbackQueue[0].prompt });
        return;
      }

      if (lower.includes("none") || lower.includes("end")) {
        appendMessage({ from: "assistant", text: "Thank you for contacting us, good bye." });
        setPostAnswerAction("none");
        setSuppressQuickReplies(true);
        setStatus("");
        return;
      }
    }

    if (lower === "i need service asap" || lower === "i want to book an appointment") {
      trackAssistantAction("assistant_booking_redirect", {
        intent: "quick-action",
        source: "assistant-quick-choice",
        service_type: payload.serviceType || "general-service",
      });
      appendMessage({ from: "user", text: choice });
      appendMessage({ from: "assistant", text: "I’m sending you to the booking form now so you can book your same-day appointment." });
      setSuppressQuickReplies(true);
      setStatus("");
      window.location.assign("/book");
      return;
    }

    await advance(choice);
  };

  const submitLead = async (finalPayload: AssistantPayload) => {
    const requiredMissing = [
      !finalPayload.firstName.trim() ? "name" : "",
      !finalPayload.phone.trim() ? "phone" : "",
      intent !== "callback" && !finalPayload.address.trim() ? "address" : "",
    ].filter(Boolean);

    if (requiredMissing.length > 0) {
      setStatus(`We still need ${requiredMissing.join(", ")} to make the appointment.`);
      return;
    }

    setBusy(true);
    setStatus("Sending lead to HVAC team...");

    const params = new URLSearchParams(window.location.search);

    try {
      const response = await fetch("/api/assistant/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...finalPayload,
          captureSource: "ai-chatbot",
          assistantTranscript: messages.map((m) => `${m.from.toUpperCase()}: ${m.text}`).join("\n"),
          aiBranch: intent || "assistant-v2",
          utmSource: params.get("utm_source") || "",
          utmMedium: params.get("utm_medium") || "",
          utmCampaign: params.get("utm_campaign") || "",
        }),
      });

      if (!response.ok) {
        const err = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(err?.error || "Could not submit lead.");
      }

      const result = (await response.json()) as LeadResponse;
      setActions(result.bookingActions);
      if (intent === "callback") {
        trackAssistantAction("assistant_callback_started", {
          lead_id: result.leadId,
          service_type: finalPayload.serviceType || "general-service",
        });
        appendMessage({ from: "assistant", text: "Callback request sent to technician with your message. He will probably text you first, can you recieve texts to this number?" });
        setCallbackTextabilityPending(true);
        setCallbackFollowup({
          leadId: result.leadId,
          firstName: finalPayload.firstName,
          phone: finalPayload.phone,
        });
        setStepIndex(-1);
        setStatus("");
      } else {
        trackAssistantAction("assistant_revenue", {
          lead_id: result.leadId,
          priority: result.priority,
          service_type: finalPayload.serviceType || "general-service",
          booking_mode: finalPayload.bookingMode || "assistant",
        });
        setStatus(`Lead ${result.leadId.slice(0, 8).toUpperCase()} routed as ${result.priority}.`);
        appendMessage({ from: "assistant", text: "Done. Your request was sent to the HVAC team with transcript and handoff details." });
        setStepIndex(queue.length);
      }
    } catch (error) {
      setStatus(String((error as Error)?.message || "Submission failed."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {!open ? (
        <button
          className={`${styles.launcher} ${isHomepage ? styles.launcherHome : styles.launcherDefault}`}
          onClick={() => setOpen(true)}
          type="button"
          aria-label="Open AI HVAC Assistant"
        >
          <span className={styles.launcherAvatarWrap} aria-hidden="true">
            <Image
              className={styles.launcherAvatar}
              src="https://randomuser.me/api/portraits/men/32.jpg"
              alt=""
              width={58}
              height={58}
              unoptimized
            />
            <span className={styles.launcherHeadset} />
          </span>
          <span className={styles.launcherCopy}>
            <span className={styles.launcherEyebrow}>AI HVAC Assistant</span>
            <span className={styles.launcherTitle}>Get help here right away!</span>
            <span className={styles.launcherSubcopy}>Our technicians are close to your area and may be ready to help right away!</span>
          </span>
        </button>
      ) : null}

      {open ? (
        <aside className={styles.panel} aria-live="polite">
          <div className={styles.header}>
            <p className={styles.headerTitle}>All Solutions AI Assistant</p>
            <button className={styles.closeBtn} onClick={() => setOpen(false)} type="button" aria-label="Close assistant">×</button>
          </div>

          <div className={styles.topActions}>
            <a className={styles.topActionLink} href="https://ashaac.com/book">Book now</a>
            <a className={styles.topActionLink} href="tel:+18017553040">Call</a>
            <a className={styles.topActionLink} href="sms:+18017553040">Text</a>
          </div>

          <div className={styles.thread}>
            {messages.map((m, idx) => (
              <div key={`${m.from}-${idx}`} className={`${styles.bubble} ${m.from === "assistant" ? styles.assistant : styles.user}`}>
                {m.text}
              </div>
            ))}
          </div>

          {quickChoices.length > 0 && stepIndex < queue.length ? (
            <div className={styles.quickReplies}>
              {quickChoices.map((choice) => (
                <button key={choice} className={styles.quickBtn} type="button" onClick={() => void onQuickChoice(choice)} disabled={busy}>
                  {choice}
                </button>
              ))}
            </div>
          ) : null}

          <div className={styles.composer}>
            {manualQuestionEntry && turnstileEnabled ? (
              <div className={styles.turnstileWrap}>
                <div ref={turnstileContainerRef} />
              </div>
            ) : null}

            {manualQuestionEntry && turnstileEnabled && turnstileLoadIssue ? (
              <button className={styles.reloadTurnstileBtn} type="button" onClick={reloadRobotCheck}>
                Security check did not load - tap to retry
              </button>
            ) : null}

            {stepIndex < queue.length || stepIndex < 0 ? (
              <div className={styles.inputRow}>
                <input
                  className={styles.input}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={manualServiceTypeEntry ? "Describe your issue in your own words..." : step?.placeholder || "Type your question here"}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void advance(input);
                    }
                  }}
                  disabled={busy}
                />
                <button className={styles.sendBtn} type="button" onClick={() => advance(input)} disabled={busy}>
                  Send
                </button>
              </div>
            ) : null}

            <button className={styles.resetBtn} type="button" onClick={resetConversation}>
              Start over
            </button>

            <p className={styles.status}>{status}</p>

            {actions ? (
              <div className={styles.actions}>
                {actions.bookingUrl ? <a className={styles.actionLink} href={actions.bookingUrl}>Book</a> : null}
                {actions.callUrl ? <a className={styles.actionLink} href={actions.callUrl}>Call</a> : null}
                {actions.textUrl ? <a className={styles.actionLink} href={actions.textUrl}>Text</a> : null}
              </div>
            ) : null}
          </div>
        </aside>
      ) : null}
    </>
  );
}
