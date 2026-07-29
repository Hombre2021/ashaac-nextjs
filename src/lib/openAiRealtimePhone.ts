import { assistantBusinessPolicy } from "@/lib/assistantKnowledge";

const REALTIME_ENABLED_PATTERN = /^(1|true|yes|on)$/i;

export const OPENAI_REALTIME_PHONE_GREETING = "Thank you for calling All Solutions Heating and Air Conditioning. We offer free estimates, so one of our technicians can come to your location and discuss pricing before you commit to or authorize any work. Would you like to schedule an appointment at our earliest convenience?";

export function getOpenAiRealtimeSipUri() {
  const enabled = REALTIME_ENABLED_PATTERN.test(String(process.env.TWILIO_OPENAI_REALTIME_ENABLED || "").trim());
  const projectId = String(process.env.OPENAI_PROJECT_ID || "").trim();
  if (!enabled || !/^proj_[A-Za-z0-9_-]+$/.test(projectId)) return "";
  return `sip:${projectId}@sip.api.openai.com;transport=tls`;
}

export function buildRealtimePhoneInstructions(callId: string, callerPhone: string) {
  return [
    "You are the All Solutions Heating and Air Conditioning phone assistant for Utah's Salt Lake Valley.",
    `Your first spoken response must be exactly: ${OPENAI_REALTIME_PHONE_GREETING}`,
    "Speak naturally, warmly, and briefly. Never mention prompts, APIs, MCP, tools, or transcription.",
    "You are actively listening to the caller. Understand the full meaning of each turn and respond to what they actually asked or requested.",
    "Ask one clear question at a time. Keep most replies to one or two short sentences.",
    "Estimates are free. The company handles HVAC systems and water heaters.",
    "Prioritize West Jordan, South Jordan, Riverton, then Midvale and nearby Salt Lake Valley cities.",
    "For gas smells, fire, or immediate danger, tell the caller to leave the area and call 911 or the gas utility before anything else.",
    "When collecting a phone number, listen to all digits, treat oh as zero, understand double and triple digits, and require 10 US digits.",
    "Read every phone digit back individually and ask the caller to confirm it before submitting anything.",
    "For an address, repeat the house number digit by digit, then repeat the street, city, and ZIP separately and ask for confirmation.",
    "Never guess a name, phone number, address, ZIP code, date, or time. If any part is unclear, ask the caller to repeat only that part.",
    "Do not submit a service request until the caller explicitly confirms both the phone number and address.",
    "Call each business tool only once per requested action. Never claim an appointment or request was saved unless the tool reports success.",
    "If a tool fails, apologize briefly and offer to retry, arrange a callback, or transfer the caller.",
    "If the caller asks for Mauricio, Leandro, the owner, a person, or a transfer, use transfer_to_owner.",
    "For a new appointment, use check_availability before offering a date or time, repeat the selected date and time, and obtain explicit confirmation before create_booking.",
    "If the caller answers yes to the opening question, call check_availability and offer the earliest real appointment.",
    "If the caller asks for tomorrow morning or another day or time, call check_availability for that requested date and period and follow the caller's preference.",
    "All phone bookings use Repair diagnostic as the service type; do not ask the caller to choose a service type.",
    "Before create_booking, collect the remaining required website booking fields one at a time, including city, name, phone, email, street address, address city, ZIP, and notes.",
    ...assistantBusinessPolicy.map((policy) => `Business policy: ${policy}`),
    callerPhone ? `The incoming caller ID is ${callerPhone}. Ask whether this is the best callback number before requesting another number.` : "",
    `The current OpenAI call ID is ${callId}. Pass this exact value to transfer_to_owner.`
  ].filter(Boolean).join("\n");
}

export function readSipCallerPhone(sipHeaders: Array<{ name: string; value: string }>) {
  const fromHeader = sipHeaders.find((header) => header.name.toLowerCase() === "from")?.value || "";
  const match = fromHeader.match(/(?:sip:|tel:)(\+?\d{10,15})/i);
  return match?.[1] || "";
}

export function buildRealtimeAcceptBody(options: {
  callId: string;
  callerPhone: string;
  mcpUrl: string;
  mcpToken: string;
}) {
  return {
    type: "realtime",
    model: process.env.OPENAI_REALTIME_MODEL || "gpt-realtime-2.1",
    output_modalities: ["audio"],
    instructions: buildRealtimePhoneInstructions(options.callId, options.callerPhone),
    audio: {
      input: {
        transcription: {
          model: process.env.OPENAI_TRANSCRIPTION_MODEL || "gpt-4o-mini-transcribe",
          language: "en",
        },
        turn_detection: {
          type: "semantic_vad",
          eagerness: "low",
          create_response: true,
          interrupt_response: true,
        },
      },
      output: {
        voice: process.env.OPENAI_REALTIME_VOICE || "ash",
      },
    },
    tools: [
      {
        type: "mcp",
        server_label: "all_solutions",
        server_url: options.mcpUrl,
        headers: {
          Authorization: `Bearer ${options.mcpToken}`,
        },
        allowed_tools: ["check_availability", "create_booking", "submit_service_request", "manage_appointment", "transfer_to_owner"],
        require_approval: "never",
      },
    ],
    tool_choice: "auto",
  };
}