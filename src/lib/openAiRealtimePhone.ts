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
      "Before calling a business tool, briefly tell the caller what you are checking. As soon as the tool returns, immediately speak the result and ask the next question. Never remain silent after a tool result.",
      "If a lookup is still pending or an idle timeout occurs, say: I am still checking that for you. One moment please. Do not ask the caller to repeat information you already heard.",
    "If a tool fails, apologize briefly and offer to retry, arrange a callback, or transfer the caller.",
    "If the caller asks for Mauricio, Leandro, the owner, a person, or a transfer, use transfer_to_owner.",
    "While connecting a live technician, if transfer_to_owner returns pending, say exactly: Thank you for your patience, I am still trying to connect to a live technician. Then immediately call transfer_to_owner again with the same call ID and reason. Repeat this every time the tool returns pending.",
    "For a new appointment, use check_availability before offering a date or time, repeat the selected date and time, and obtain explicit confirmation before create_booking.",
    "If the caller answers yes to the opening question, call check_availability and offer the earliest real appointment.",
    "If the caller asks for tomorrow morning or another day or time, call check_availability for that requested date and period and follow the caller's preference.",
    "After the caller confirms an offered appointment date and time, ask exactly: Describe in your own words the reason you want our technician to come to your location.",
    "Preserve the caller's visit reason in their own words. Repeat it back and ask for explicit confirmation. If corrected, repeat the corrected wording and confirm again.",
    "Never call create_booking until the caller has explicitly confirmed the repeated visit reason. Pass the exact confirmed wording as visitReason and pass visitReasonConfirmed as true.",
    "For every phone booking, set the website Service Type to Use your own words and store the caller's exact confirmed visit reason in the website customServiceDescription field through create_booking.",
    "Before create_booking, collect the remaining required website booking fields one at a time, including city, name, phone, email, street address, address city, ZIP, and the confirmed visit reason.",
    ...assistantBusinessPolicy.map((policy) => `Business policy: ${policy}`),
    callerPhone ? `The incoming caller ID is ${callerPhone}. Ask whether this is the best callback number before requesting another number.` : "",
    `The current OpenAI call ID is ${callId}. Pass this exact value to transfer_to_owner.`
  ].filter(Boolean).join("\n");
}

export function readSipCallerPhone(sipHeaders: Array<{ name: string; value: string }>) {
  const forwardedCaller = readSipHeader(sipHeaders, "x-all-solutions-caller");
  if (/^\+?\d{10,15}$/.test(forwardedCaller)) return forwardedCaller;
  const fromHeader = sipHeaders.find((header) => header.name.toLowerCase() === "from")?.value || "";
  const match = fromHeader.match(/(?:sip:|tel:)(\+?\d{10,15})/i);
  return match?.[1] || "";
}

export function readSipHeader(sipHeaders: Array<{ name: string; value: string }>, name: string) {
  return sipHeaders.find((header) => header.name.toLowerCase() === name.toLowerCase())?.value || "";
}

export function buildRealtimeAcceptBody(options: {
  callId: string;
  callerPhone: string;
  mcpUrl: string;
  mcpToken: string;
}) {
  const session = {
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
            type: "server_vad",
            threshold: 0.45,
            prefix_padding_ms: 400,
            silence_duration_ms: 650,
            idle_timeout_ms: 9000,
          create_response: true,
          interrupt_response: true,
        },
      },
      output: {
        voice: process.env.OPENAI_REALTIME_VOICE || "ash",
      },
    },
  } as Record<string, unknown>;

  if (REALTIME_ENABLED_PATTERN.test(String(process.env.OPENAI_REALTIME_MCP_ENABLED || "").trim())) {
    session.tools = [
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
    ];
    session.tool_choice = "auto";
  }

  return session;
}