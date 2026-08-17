import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const requirements = [
  {
    file: "src/app/api/assistant/chat/route.ts",
    markers: ["OPENAI_API_KEY", "https://api.openai.com/v1/responses"],
  },
  {
    file: "src/components/WebsiteAIAssistant.tsx",
    markers: ["/api/assistant/chat", "/api/assistant/lead"],
  },
  {
    file: "src/app/api/assistant/phone/route.ts",
    markers: ["getOpenAiRealtimeSipUri", "buildRealtimeSipTwiml", "realtimeFallback"],
  },
  {
    file: "src/lib/openAiRealtimePhone.ts",
    markers: ["sip.api.openai.com", "buildRealtimeAcceptBody", "mcpToken"],
  },
  {
    file: "src/app/api/webhooks/openai/realtime/route.ts",
    markers: ["realtime.call.incoming", "/accept", "client.webhooks.unwrap"],
  },
  {
    file: "src/app/api/assistant/phone/mcp/route.ts",
    markers: ["send_booking_code", "verify_booking_code", "getPhoneBookingVerificationForCall", "submit_service_request", "submit_owner_message", "manage_appointment", "block_spam_caller", "end_call", "bookingRequestSchema.safeParse"],
  },
  {
    file: "src/app/api/webhooks/twilio/sms/route.ts",
    markers: ["getTwilioConfig", "sendTwilioSms", "export async function POST"],
  },
];

const failures = [];
const retiredSchedulerName = ["calen", "dly"].join("");
const executableExtensions = new Set([
  ".cjs",
  ".css",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".mjs",
  ".ps1",
  ".scss",
  ".ts",
  ".tsx",
]);

function extensionOf(file) {
  const dot = file.lastIndexOf(".");
  return dot >= 0 ? file.slice(dot).toLowerCase() : "";
}

function collectExecutableFiles(path) {
  if (!existsSync(path)) return [];
  if (!statSync(path).isDirectory()) return executableExtensions.has(extensionOf(path)) ? [path] : [];

  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    if ([".git", ".next", "node_modules"].includes(entry.name)) return [];
    return collectExecutableFiles(resolve(path, entry.name));
  });
}

for (const requirement of requirements) {
  let source = "";
  try {
    source = readFileSync(resolve(root, requirement.file), "utf8");
  } catch {
    failures.push(`${requirement.file}: missing`);
    continue;
  }

  for (const marker of requirement.markers) {
    if (!source.includes(marker)) {
      failures.push(`${requirement.file}: missing required marker ${JSON.stringify(marker)}`);
    }
  }
}

const realtimePhoneSource = readFileSync(resolve(root, "src/lib/openAiRealtimePhone.ts"), "utf8");
const phoneVerificationConfigSource = readFileSync(resolve(root, "src/temporary/phone-booking-verification/config.ts"), "utf8");
const phoneVerificationRetired = phoneVerificationConfigSource.includes("PHONE_BOOKING_VERIFICATION_ENABLED = false");
if (!realtimePhoneSource.includes("After asking any question, stop speaking and wait for new caller speech.")) {
  failures.push("src/lib/openAiRealtimePhone.ts: missing caller-turn wait guard");
}
if (!realtimePhoneSource.includes("Never preview, summarize, or enumerate the questions you will ask later.")) {
  failures.push("src/lib/openAiRealtimePhone.ts: missing one-step-at-a-time booking dialogue guard");
}
if (!realtimePhoneSource.includes("Whenever you repeat or read back information for confirmation, ask only: Is that correct?")) {
  failures.push("src/lib/openAiRealtimePhone.ts: missing concise read-back confirmation rule");
}
if (!realtimePhoneSource.includes("full month name, day, and four-digit year") || !realtimePhoneSource.includes("Never speak an ISO date")) {
  failures.push("src/lib/openAiRealtimePhone.ts: caller-facing dates must be spoken naturally instead of as ISO values");
}
if (!realtimePhoneSource.includes("The first time any part is unclear") || !realtimePhoneSource.includes("I'm sorry, I'm having difficulty hearing you clearly because of background noise. Could you move somewhere quieter or reduce the noise around you?")) {
  failures.push("src/lib/openAiRealtimePhone.ts: missing guarded background-noise escalation");
}
if (!realtimePhoneSource.includes("Thank you so much for calling, and have a wonderful rest of your day.")) {
  failures.push("src/lib/openAiRealtimePhone.ts: missing exact final farewell");
}
if (!realtimePhoneSource.includes("I am your AI assistant. I can help you book an appointment") || !realtimePhoneSource.includes("immediately continue the active workflow")) {
  failures.push("src/lib/openAiRealtimePhone.ts: missing requested greeting or silence recovery behavior");
}
if (!realtimePhoneSource.includes("Your booking has been successfully submitted. Please check your phone for a text with the confirmation details. Thank you so much for calling, and you have a wonderful rest of your day.")) {
  failures.push("src/lib/openAiRealtimePhone.ts: missing exact successful-booking confirmation and farewell");
}
if (!realtimePhoneSource.includes("If the caller answers no to the opening appointment question, ask exactly: Would you like a call back?")) {
  failures.push("src/lib/openAiRealtimePhone.ts: missing callback offer after appointment decline");
}
if (!realtimePhoneSource.includes("If the caller also declines a callback or text message, ask exactly: Is there anything else I can do for you?")) {
  failures.push("src/lib/openAiRealtimePhone.ts: missing approved anything-else branch after contact refusal");
}
if (!realtimePhoneSource.includes("If incoming caller ID is private, blocked, anonymous, unavailable, or missing")) {
  failures.push("src/lib/openAiRealtimePhone.ts: missing private-caller phone requirement");
}
if (!phoneVerificationRetired
  || !realtimePhoneSource.includes("SMS verification is not part of booking")
  || !realtimePhoneSource.includes("Never call send_booking_code or verify_booking_code")
  || realtimePhoneSource.includes('allowed_tools: ["check_availability", "send_booking_code"')) {
  failures.push("phone booking: SMS verification must remain retired and unavailable to Ash");
}
if (!realtimePhoneSource.includes("Appointments may be requested 24 hours a day, seven days a week") || !realtimePhoneSource.includes("afterHoursFeeAccepted as true")) {
  failures.push("src/lib/openAiRealtimePhone.ts: missing 24/7 after-hours booking rules");
}
if (!realtimePhoneSource.includes("after-hours bookings will incur a $100 additional fee") || !realtimePhoneSource.includes("I understand, would you like to schedule our technician to come a regular time?")) {
  failures.push("src/lib/openAiRealtimePhone.ts: missing after-hours fee consent dialogue");
}
if (!realtimePhoneSource.includes("Never transfer or connect a live caller") || !realtimePhoneSource.includes("save the caller's own message with submit_owner_message")) {
  failures.push("src/lib/openAiRealtimePhone.ts: missing text-only owner-message rules");
}
if (!realtimePhoneSource.includes("repeat the complete first and last name") || !realtimePhoneSource.includes("address the caller naturally by the confirmed first name")) {
  failures.push("src/lib/openAiRealtimePhone.ts: missing confirmed-name read-back and caller-address rules");
}
if (!realtimePhoneSource.includes("Never ask for an email address")
  || realtimePhoneSource.includes("Please spell your email address")) {
  failures.push("phone booking: Ash must never collect email");
}
if (realtimePhoneSource.includes("idle_timeout_ms")) {
  failures.push("src/lib/openAiRealtimePhone.ts: idle_timeout_ms can make Ash respond without caller speech");
}
if (!realtimePhoneSource.includes('noise_reduction: {') || !realtimePhoneSource.includes('type: "near_field"')) {
  failures.push("src/lib/openAiRealtimePhone.ts: missing near-field caller noise reduction");
}
if (realtimePhoneSource.includes('language: "en"')
  || !realtimePhoneSource.includes("Detect the language of the caller's first substantive response automatically")
  || !realtimePhoneSource.includes("ask whether the caller wants to continue in that language")
  || !realtimePhoneSource.includes("use that selected language for every caller-facing sentence")
  || !realtimePhoneSource.includes("asks to return to English at any point")
  || !realtimePhoneSource.includes("Translate the caller's visit reason and other descriptive booking details internally into concise English")
  || !realtimePhoneSource.includes("Never translate, Anglicize, respell, reorder, or otherwise alter the caller's first name")) {
  failures.push("phone language: automatic detection, confirmed language persistence, internal translation, exact identity fields, and English return must remain enabled");
}
const realtimeWebhookSource = readFileSync(resolve(root, "src/app/api/webhooks/openai/realtime/route.ts"), "utf8");
if (!realtimePhoneSource.includes("call controller exclusively creates one opening-greeting response")
  || !realtimePhoneSource.includes("Never repeat or restart that greeting")
  || !realtimeWebhookSource.includes("claimPhoneGreeting(callId)")
  || !realtimeWebhookSource.includes('metadata: { purpose: "initial_greeting" }')
  || !realtimeWebhookSource.includes('tool_choice: "none"')) {
  failures.push("phone greeting: exactly one controller-owned, tool-free greeting response is required per call");
}
if (!realtimeWebhookSource.includes('event.type === "response.output_item.done"') || !realtimeWebhookSource.includes('event.item?.type === "mcp_call"')) {
  failures.push("src/app/api/webhooks/openai/realtime/route.ts: successful MCP completion must use response.output_item.done with an mcp_call item");
}
if (realtimeWebhookSource.includes('event.type === "response.mcp_call.completed"')) {
  failures.push("src/app/api/webhooks/openai/realtime/route.ts: response.mcp_call.completed is not a Realtime server event");
}
if (!realtimeWebhookSource.includes("completedMcpItemIds") || !realtimeWebhookSource.includes("OpenAI Realtime MCP tool finished")) {
  failures.push("src/app/api/webhooks/openai/realtime/route.ts: MCP completion must be deduplicated and observable");
}
if (!realtimeWebhookSource.includes("postToolSpokenText") || !realtimeWebhookSource.includes("OpenAI Realtime native post-tool response completed")) {
  failures.push("phone tool flow: force a post-tool response only when the native response did not already speak after the tool");
}
if (realtimeWebhookSource.includes('event.response?.output?.some((item) => item.type === "mcp_call"')) {
  failures.push("src/app/api/webhooks/openai/realtime/route.ts: response.done must not masquerade as business-tool completion");
}
if (!realtimeWebhookSource.includes("if (settled) return") || !realtimeWebhookSource.includes("code !== 1000")) {
  failures.push("src/app/api/webhooks/openai/realtime/route.ts: unexpected controller closure must renew call control");
}
if (!realtimeWebhookSource.includes("callNoLongerAvailable") || !realtimeWebhookSource.includes("server response:\\s*404")) {
  failures.push("src/app/api/webhooks/openai/realtime/route.ts: expired OpenAI calls must stop controller renewal");
}
if (!realtimeWebhookSource.includes("requestRealtimeContinuation") || !realtimeWebhookSource.includes("attempt <= 3") || !realtimeWebhookSource.includes("response.ok")) {
  failures.push("src/app/api/webhooks/openai/realtime/route.ts: controller handoff must verify and retry continuation delivery");
}
if (!realtimeWebhookSource.includes("CONTROLLER_HANDOFF_MS = 240000") || !realtimeWebhookSource.includes("CONTROLLER_FORCED_RENEWAL_MS = 280000") || !realtimeWebhookSource.includes('/api/webhooks/openai/realtime/control')) {
  failures.push("src/app/api/webhooks/openai/realtime/route.ts: Realtime controller must hand off long booking calls");
}
if (!realtimeWebhookSource.includes('const reminderText = "I am still searching, just verifying that for you."') || !realtimeWebhookSource.includes("}, 4000)")) {
  failures.push("src/app/api/webhooks/openai/realtime/route.ts: pending searches and verifications require the standard four-second reminder");
}
if (!realtimeWebhookSource.includes("activeToolGeneration") || !realtimeWebhookSource.includes("toolGeneration !== activeToolGeneration")) {
  failures.push("src/app/api/webhooks/openai/realtime/route.ts: reminder timers must be isolated to the exact active tool generation");
}
if (!realtimePhoneSource.includes("While any search or verification tool is pending") || !realtimePhoneSource.includes("about every four seconds")) {
  failures.push("src/lib/openAiRealtimePhone.ts: four-second reminder must be part of tool conversation flow");
}
if (!realtimeWebhookSource.includes("reminderRequestPending") || !realtimeWebhookSource.includes("OpenAI Realtime control event error")) {
  failures.push("src/app/api/webhooks/openai/realtime/route.ts: reminder errors must recover without ending call control");
}
if (!realtimePhoneSource.includes("create_response: true") || !realtimePhoneSource.includes('type: "server_vad"') || !realtimeWebhookSource.includes("OpenAI Realtime caller turn committed")) {
  failures.push("phone turn flow: the call-lifetime Realtime session must own one response for every completed caller turn");
}
if (!realtimePhoneSource.includes("silence_duration_ms: 700") || realtimePhoneSource.includes("idle_timeout_ms")) {
  failures.push("phone turn flow: speech-triggered VAD must commit answers promptly without an idle-time response that could answer Ash's own question");
}
if (!realtimeWebhookSource.includes('verify_booking_code: "The six-digit code check finished.') || !realtimeWebhookSource.includes("Describe in your own words the reason you want our technician to come to your location.")) {
  failures.push("src/app/api/webhooks/openai/realtime/route.ts: verified code acknowledgment must continue to the next booking question without silence");
}
if (/affirmativeResponseTimer|confirmationRecoveryTimer|unhandled affirmative/i.test(realtimeWebhookSource)) {
  failures.push("src/app/api/webhooks/openai/realtime/route.ts: custom yes-confirmation prompts and timers must remain removed so OpenAI handles caller turns natively");
}
if (!realtimePhoneSource.includes("You direct the workflow from start to finish") || !realtimePhoneSource.includes("Silence while waiting for the caller to answer your current question is correct")) {
  failures.push("src/lib/openAiRealtimePhone.ts: Ash must lead each workflow while distinguishing caller-wait silence from stalled-flow silence");
}
if (!realtimeWebhookSource.includes("manage_appointment:") || !realtimeWebhookSource.includes("block_spam_caller:") || !realtimeWebhookSource.includes("owner or technician text-message request finished")) {
  failures.push("src/app/api/webhooks/openai/realtime/route.ts: booking, callback, text, management, and spam tools require specific post-tool continuation");
}
if (!realtimeWebhookSource.includes("business tool must always receive its own deterministic follow-up") || !realtimeWebhookSource.includes('send_booking_code: "The verification-text action finished')) {
  failures.push("src/app/api/webhooks/openai/realtime/route.ts: completed business tools must not be suppressed by pre-tool holding audio");
}
if (/armTurnWatchdog|armVerificationCodeNudge|armPromisedActionWatchdog/.test(realtimeWebhookSource)) {
  failures.push("phone turn flow: timer watchdogs must not own ordinary conversation progress");
}
if (!realtimePhoneSource.includes("Every non-final response must advance the call before it ends") || !realtimeWebhookSource.includes("OpenAI Realtime incomplete turn continued")) {
  failures.push("phone turn flow: bare acknowledgments must immediately continue to a question, tool, or farewell");
}
if (!realtimeWebhookSource.includes("OpenAI Realtime incomplete closing recovery requested") || !realtimePhoneSource.includes("Never say let me wrap this up")) {
  failures.push("phone closing: missing recovery for closing filler without the approved farewell and end_call");
}
if (!realtimePhoneSource.includes("Never say you are checking whether the requested time is after-hours")) {
  failures.push("src/lib/openAiRealtimePhone.ts: availability lookup must not announce after-hours classification");
}
if (!realtimeWebhookSource.includes('event.item.name === "end_call"') || !realtimeWebhookSource.includes('activeToolName === "end_call"') || !realtimeWebhookSource.includes("enterClosingCall")) {
  failures.push("src/app/api/webhooks/openai/realtime/route.ts: end_call must suppress reminder and follow-up speech");
}
if (!realtimeWebhookSource.includes("confirmationType temporary-after-hours") || !realtimeWebhookSource.includes("pending additional confirmation from our technician")) {
  failures.push("src/app/api/webhooks/openai/realtime/route.ts: forced tool response must preserve temporary after-hours status");
}
if (realtimeWebhookSource.includes('event.type?.includes("mcp")')) {
  failures.push("src/app/api/webhooks/openai/realtime/route.ts: broad MCP matching can treat tool discovery as a completed action");
}
const phoneMcpSource = readFileSync(resolve(root, "src/app/api/assistant/phone/mcp/route.ts"), "utf8");
const bookingRouteSource = readFileSync(resolve(root, "src/app/api/book/route.ts"), "utf8");
const phoneVerificationSource = readFileSync(resolve(root, "src/lib/phoneBookingVerification.ts"), "utf8");
const createBookingSource = phoneMcpSource.split('server.registerTool("create_booking"')[1]?.split('server.registerTool("submit_service_request"')[0] || "";
if (phoneMcpSource.includes("args.nameConfirmed !== true") || phoneMcpSource.includes("args.emailConfirmed !== true") || phoneMcpSource.includes("args.visitReasonConfirmed !== true")) {
  failures.push("phone booking: redundant model confirmation flags must not block an otherwise verified booking");
}
if (!createBookingSource.includes("A reachable caller phone number is required") || !createBookingSource.includes("normalizeVerificationPhone(args.phone)")) {
  failures.push("phone booking: private caller fallback must still require a reachable phone number");
}
if (!phoneMcpSource.includes("Phone create_booking invoked") || !phoneMcpSource.includes("Phone create_booking booking context applied")) {
  failures.push("phone booking: create_booking must handle correctable model arguments inside the tool instead of failing MCP schema validation");
}
if (createBookingSource.includes("getVerifiedCallState")
  || createBookingSource.includes("getPhoneBookingVerificationForCall")
  || createBookingSource.includes("Phone verification is required before booking")
  || !createBookingSource.includes("normalizeVerificationPhone(callerPhone)")) {
  failures.push("phone booking: final submission must not reload verification state and must automatically use authenticated caller ID");
}
if (createBookingSource.includes("verificationProof")
  || createBookingSource.includes("verifyPhoneBookingVerificationProof")
  || createBookingSource.includes("email: z.string()")) {
  failures.push("phone booking: direct create_booking must not accept email or verification proof");
}
if (!phoneMcpSource.includes("Phone create_booking booking context applied") || !phoneMcpSource.includes("Phone create_booking payload validated")) {
  failures.push("phone booking: final booking context and payload stages must be observable without logging customer data");
}
if (!realtimePhoneSource.includes("without any electronic address lookup") || realtimePhoneSource.includes("verify_service_address")) {
  failures.push("phone booking: address confirmation must proceed directly to create_booking without an address tool");
}
if (!phoneMcpSource.includes("resolveSupportedBookingCity(args.city || args.addressCity)") || !phoneMcpSource.includes("phone: bookingPhone") || !phoneMcpSource.includes('|| "UT"')) {
  failures.push("phone booking: create_booking must derive city, authenticated caller phone, and Utah state inside the tool");
}
if (!phoneMcpSource.includes("Phone create_booking correction required") || !phoneMcpSource.includes('reason: "booking-field"')) {
  failures.push("phone booking: privacy-safe rejection reasons must identify pre-manager failures in production logs");
}
if (!createBookingSource.includes("Phone create_booking submission completed")
  || !phoneMcpSource.includes('farewellCompleted: z.literal(true)')
  || !phoneMcpSource.includes('bookingConfirmationCompleted: z.literal(true).optional()')
  || !phoneMcpSource.includes("savedBooking && bookingConfirmationCompleted !== true")
  || !phoneMcpSource.includes("markPhoneBookingFarewellPending(callId)")
  || !phoneMcpSource.includes("isPhoneBookingFarewellPending(currentCallId)")
  || !phoneMcpSource.includes("Ash's booking confirmation has not been observed yet")
  || !phoneMcpSource.includes("clearPhoneBookingFarewellPending(currentCallId)")
  || !realtimeWebhookSource.includes("bookingFarewellSpoken")
  || !realtimeWebhookSource.includes("afterHoursFarewellSpoken")
  || !realtimeWebhookSource.includes("bookingFarewellPending && completedWarmFarewell")
  || !realtimeWebhookSource.includes('completedToolName === "create_booking"')
  || !realtimeWebhookSource.includes("endDirectCallerAfterAsh(callerCallSid)")
  || !realtimeWebhookSource.includes("BOOKING_FAREWELL_AUDIO_DRAIN_MS = 12000")
  || !realtimeWebhookSource.includes("POST_FAREWELL_GRACE_MS = 4000")
  || !realtimeWebhookSource.includes("BOOKING_FAREWELL_AUDIO_DRAIN_MS + POST_FAREWELL_GRACE_MS")
  || !realtimeWebhookSource.includes("clearPhoneBookingFarewellPending(callId)")
  || !realtimeWebhookSource.includes('console.info("OpenAI Realtime Ash booking farewell completed"')
  || realtimeWebhookSource.includes('Twiml: `<?xml version="1.0" encoding="UTF-8"?><Response><Say')) {
  failures.push("phone booking: CRM success must confirm the appointment, speak the warm farewell, and end the caller leg");
}
const directPhoneRouteSource = readFileSync(resolve(root, "src/app/api/assistant/phone/route.ts"), "utf8");
if (directPhoneRouteSource.includes("buildRealtimeConferenceTwiml")
  || directPhoneRouteSource.includes("addAshConferenceParticipant")
  || directPhoneRouteSource.includes("shouldUseRealtimeConference")
  || !directPhoneRouteSource.includes("X-All-Solutions-Call-Sid")
  || !directPhoneRouteSource.includes("buildRealtimeSipTwiml(callSid, fromE164 || from)")) {
  failures.push("phone routing: 1264 must answer through direct OpenAI SIP with the original caller leg and no conference bridge");
}
if (!realtimeWebhookSource.includes('event.type === "response.output_item.added"')
  || !realtimeWebhookSource.includes("OpenAI Realtime MCP tool started")
  || !realtimeWebhookSource.includes("Boolean(followUpTimer) || Boolean(callerResponseTimer)")) {
  failures.push("phone controller: MCP tool start and pending confirmation audio must defer controller handoff");
}
if (!phoneMcpSource.includes("testMode: z.literal(true).optional()") || !phoneVerificationSource.includes("testMode: params.testMode === true") || !createBookingSource.includes("args.testMode === true")) {
  failures.push("phone booking: explicit test mode must remain supported by archived verification and temporary direct booking");
}
if (!realtimeWebhookSource.includes('metadata: { purpose: "tool_wait_reminder" }') || !realtimeWebhookSource.includes('tool_choice: "none"')) {
  failures.push("phone controller: tool-wait reminders must disable tool choice to prevent overlapping booking tools");
}
if (!realtimePhoneSource.includes("Project details is the single customer narrative field") || !phoneMcpSource.includes("Project details is the single customer narrative field")) {
  failures.push("phone booking: Ash must map the caller's exact words to the website Project details field");
}
if (!realtimePhoneSource.includes("Booking submission is your primary goal")
  || !realtimePhoneSource.includes("immediately call create_booking in that same turn")
  || !realtimePhoneSource.includes("Never call another business tool while create_booking is pending")
  || !realtimePhoneSource.includes("visit reason, full name, phone number, and complete service address")
  || !realtimePhoneSource.includes("preserve every other confirmed value")) {
  failures.push("phone booking: confirmed name, phone, address, and reason must submit immediately without extra questions");
}
const createBookingTestBranch = phoneMcpSource.indexOf("if (testMode)");
const createBookingWrite = phoneMcpSource.indexOf('postInternal(origin, "/api/book"');
if (createBookingTestBranch < 0 || createBookingWrite < 0 || createBookingTestBranch > createBookingWrite || !phoneMcpSource.includes('confirmationType: "test-only"') || !phoneMcpSource.includes("Phone create_booking test completed")) {
  failures.push("phone booking: test calls must complete validation and branch before all operational booking writes");
}
if (!realtimePhoneSource.includes("Never infer test mode merely from a familiar phone number") || !realtimeWebhookSource.includes("confirmationType is test-only")) {
  failures.push("phone booking: test mode must be explicit and receive a truthful no-record completion response");
}
if (!phoneMcpSource.includes('code: z.string().regex(/^\\d{6}$/')) {
  failures.push("src/app/api/assistant/phone/mcp/route.ts: verification code must be exactly six numerical digits");
}
if (!createBookingSource.includes("Phone create_booking caller-confirmed address accepted")
  || !createBookingSource.includes('"address could not be verified"')
  || createBookingSource.includes("await verifyPhoneServiceAddress")) {
  failures.push("phone booking: caller-confirmed served-Utah addresses must be noted and submitted without electronic verification blocking create_booking");
}
if (!phoneMcpSource.includes('server.registerTool("submit_owner_message"') || !phoneMcpSource.includes('server.registerTool("block_spam_caller"')) {
  failures.push("src/app/api/assistant/phone/mcp/route.ts: missing owner text-message or persistent spam-block tool");
}
if (!phoneMcpSource.includes('confirmationType: afterHours ? "temporary-after-hours"') || !phoneMcpSource.includes("Explicit after-hours fee acceptance is required")) {
  failures.push("src/app/api/assistant/phone/mcp/route.ts: missing enforced after-hours fee acceptance");
}
if (!createBookingSource.includes("afterHoursFeeAccepted: z.literal(true).optional()")
  || !createBookingSource.includes("const afterHoursFeeAccepted = args.afterHoursFeeAccepted === true")) {
  failures.push("phone booking: simplified direct flow must preserve explicit after-hours consent");
}
if (!phoneMcpSource.includes("The after-hours charge is $100") || !realtimePhoneSource.includes("The after-hours charge is $100")) {
  failures.push("phone booking: successful after-hours confirmation must state the $100 charge");
}
if (!phoneMcpSource.includes("callerLanguage: z.string().max(40).optional()")
  || !phoneMcpSource.includes("CALLER LANGUAGE: ${nonEnglishCallerLanguage}")
  || !phoneMcpSource.includes("!/^english$/i.test(callerLanguage)")
  || !realtimePhoneSource.includes("always pass callerLanguage as that language's common English name")
  || !realtimePhoneSource.includes("Omit both fields when the selected language is English")) {
  failures.push("phone booking: every confirmed non-English caller language must be noted on the booking record");
}
if (!phoneMcpSource.includes("customerConfirmationSms: z.string().max(1600).optional()")
  || !phoneMcpSource.includes('customerConfirmationSms.includes("{{BOOKING_ID}}")')
  || !realtimePhoneSource.includes("pass customerConfirmationSms as the complete confirmation text in the selected language")
  || !realtimePhoneSource.includes("include the pending technician confirmation and $100 additional charge in that language")
  || !bookingRouteSource.includes("callerLanguage: data.callerLanguage")
  || !bookingRouteSource.includes("customerConfirmationSms: data.customerConfirmationSms")) {
  failures.push("phone booking: non-English callers must receive a localized confirmation text with the booking ID placeholder");
}
if (!phoneVerificationSource.includes("afterHoursFeeAccepted: params.afterHoursFeeAccepted === true") || !createBookingSource.includes("afterHoursFeeAccepted")) {
  failures.push("phone booking: accepted after-hours fee must remain supported in archived and temporary flows");
}
if (!phoneMcpSource.includes("normalizedWindow") || !phoneMcpSource.includes("window === resolvedRequestedWindow")) {
  failures.push("src/app/api/assistant/phone/mcp/route.ts: exact 24/7 requested hours must be honored");
}
if (!phoneMcpSource.includes("twoHourWindowForRequestedHour") || !phoneMcpSource.includes("requestedHour: z.union([z.number(), z.string()]).optional()")) {
  failures.push("src/app/api/assistant/phone/mcp/route.ts: exact requested hours must resolve server-side to two-hour blocks");
}
if (!phoneMcpSource.includes("normalizedHour < 8") || !phoneMcpSource.includes("nextIsoDate(initialRequestedDate)") || !realtimePhoneSource.includes("tonight at 1:00 AM means August 7 at 1:00 AM")) {
  failures.push("phone availability: passed overnight hours requested for tonight must roll to the next calendar day");
}
if (!phoneMcpSource.includes("isExactPhoneBookingHourAvailable") || !phoneMcpSource.includes("isExactPhoneBookingWindowAvailable") || !phoneMcpSource.includes("normalizedDate || getCurrentDateInBookingTimeZone()")) {
  failures.push("phone availability: exact tonight requests must be evaluated by the requested hour, not the start of its two-hour block");
}
if (!phoneMcpSource.includes('requestedPeriod: z.string().optional()')
  || !phoneMcpSource.includes('periodText.includes("morning")')
  || !phoneMcpSource.includes('periodText.includes("afternoon")')
  || !phoneMcpSource.includes('periodText.includes("evening")')) {
  failures.push("phone availability: natural model arguments must normalize server-side instead of failing MCP schema validation");
}
if (!realtimeWebhookSource.includes("responseWaitsForCaller") || !realtimeWebhookSource.includes("please read|please tell me|let me know")) {
  failures.push("phone turn flow: questions and imperative caller prompts must wait, while bare acknowledgments continue");
}
if (!realtimeWebhookSource.includes("callerResponseTimer")
  || !realtimeWebhookSource.includes("OpenAI Realtime caller-turn silence recovery requested")
  || !realtimeWebhookSource.includes("}, 2500)")) {
  failures.push("phone turn flow: a committed caller answer must recover automatically if OpenAI starts neither speech nor a tool");
}
if (!realtimeWebhookSource.includes("callerCallSid }),")
  || !realtimeWebhookSource.includes("OpenAI Realtime renewed controller resumed booking farewell")) {
  failures.push("phone controller: renewals must preserve the caller leg and resume a pending booking farewell");
}
const callerWaitExamples = [
  "Please read only the six-digit number in that message.",
  "Describe in your own words the reason you want our technician to come to your location.",
  "Is that correct",
];
const callerContinuationExamples = [
  "Okay.",
  "That is correct, thank you for confirming that with me.",
  "Your address has been confirmed, thank you for staying with me.",
];
const responseWaitsForCaller = (spokenText) => {
  const normalized = spokenText.trim().replace(/[”"']+$/g, "");
  if (!normalized) return false;
  if (/\?\s*$/.test(normalized) || /\bis that correct[?.]?\s*$/i.test(normalized)) return true;
  const finalSentence = normalized.split(/(?<=[.!?])\s+/).at(-1) || normalized;
  return /^(?:what|when|where|which|who|why|how|would|could|can|may|do|does|did|is|are|was|were|have|has|will|should)\b/i.test(finalSentence)
    || /^(?:please\s+)?(?:read|describe|tell|say|repeat|provide|spell|confirm|explain)\b/i.test(finalSentence)
    || /\b(?:please read|please tell me|let me know)\b/i.test(finalSentence);
};
if (!callerWaitExamples.every(responseWaitsForCaller) || callerContinuationExamples.some(responseWaitsForCaller)) {
  failures.push("phone turn flow: caller wait/continue examples are misclassified");
}
if (!realtimePhoneSource.includes("Confirm the best phone number")
  || !createBookingSource.includes("normalizeVerificationPhone(callerPhone)")
  || !createBookingSource.includes("normalizeVerificationPhone(args.phone)")) {
  failures.push("phone booking: simplified flow must confirm and use caller ID or the supplied phone");
}
if (!phoneMcpSource.includes("resolveSupportedBookingCity") || !phoneMcpSource.includes("Riverton, Utah are normalized server-side")) {
  failures.push("phone booking: served-city variants must be normalized inside create_booking instead of failing MCP schema validation");
}
if (!realtimePhoneSource.includes("Do not call check_availability again before send_booking_code")
  && !realtimePhoneSource.includes("Do not call check_availability again unless the caller explicitly asks to change")) {
  failures.push("src/lib/openAiRealtimePhone.ts: accepted appointment block must remain locked through verification or direct booking");
}
if (!realtimePhoneSource.includes("After the caller confirms the phone number, ask exactly")) {
  failures.push("phone booking: temporary flow must proceed from confirmed phone to detailed intake");
}
if (!phoneMcpSource.includes("resolvedRequestedWindow || !isAfterHoursPhoneBooking") || !realtimePhoneSource.includes("offer only regular business hours from 8:00 AM through 8:00 PM")) {
  failures.push("phone availability: broad searches must offer only 8 AM through 8 PM regular hours");
}
const bookingSource = readFileSync(resolve(root, "src/lib/booking.ts"), "utf8");
if (bookingRouteSource.includes("retryWithBackoff") || bookingRouteSource.includes("maxAttempts")) {
  failures.push("src/app/api/book/route.ts: CRM booking submission must use one explicit idempotent attempt without built-in backoff retries");
}
if (!bookingRouteSource.includes("MANAGER_BOOKING_TIMEOUT_MS = 8000")
  || !bookingRouteSource.includes('statusUrl.searchParams.set("bookingId", bookingId)')
  || !bookingRouteSource.includes("booking:manager-status-recovered")
  || !bookingRouteSource.includes("statusBody?.managerId && statusBody?.customerId")
  || !bookingRouteSource.includes('request.headers.get("x-phone-booking-token")')) {
  failures.push("src/app/api/book/route.ts: stalled manager POSTs must recover only a durably linked deterministic booking");
}
if (!createBookingSource.includes('createHash("sha256").update(callId)') || !bookingRouteSource.includes("requestedBookingId") || !bookingRouteSource.includes('/^[A-F0-9]{8}$/') || !bookingRouteSource.includes("trustedPhoneBooking")) {
  failures.push("phone booking: retries must reuse one deterministic CRM booking ID per OpenAI call");
}
if ((bookingRouteSource.match(/\battribution:\s*\{/g) || []).length > 0) {
  failures.push("src/app/api/book/route.ts: manager payload must not duplicate source attribution in a second object");
}
const appointmentHistorySource = readFileSync(resolve(root, "src/lib/appointmentHistory.ts"), "utf8");
const fallbackAppointmentSource = appointmentHistorySource.split('"appointments", record.requestId')[1] || "";
if (fallbackAppointmentSource.includes("attribution: {")) {
  failures.push("src/lib/appointmentHistory.ts: fallback appointment must not duplicate root attribution fields");
}
const leadRouteSource = readFileSync(resolve(root, "src/app/api/assistant/lead/route.ts"), "utf8");
const assistantStoreSource = readFileSync(resolve(root, "src/lib/assistantStore.ts"), "utf8");
if (!leadRouteSource.includes("idempotencyKey") || !leadRouteSource.includes("duplicate delivery was suppressed") || !assistantStoreSource.includes("lead.leadId === record.leadId")) {
  failures.push("assistant callbacks/messages: per-call idempotency must suppress duplicate side effects and telemetry records");
}
if (!bookingSource.includes('"12:00 AM - 2:00 AM"') || !bookingSource.includes('"10:00 PM - 12:00 AM"') || bookingSource.includes('"12:00 AM - 1:00 AM"')) {
  failures.push("src/lib/booking.ts: all phone booking windows must use two-hour blocks");
}
const requiredBookingCities = ["West Jordan", "South Jordan", "Riverton", "Kearns", "Midvale", "Sandy", "Murray", "Taylorsville", "Draper", "Salt Lake City"];
const missingBookingCities = requiredBookingCities.filter((city) => !bookingSource.includes(`"${city}"`));
if (missingBookingCities.length > 0 || !bookingSource.includes("resolveSupportedBookingCity")) {
  failures.push(`src/lib/booking.ts: canonical direct-booking cities or shared normalization are missing: ${missingBookingCities.join(", ")}`);
}
if (!bookingSource.includes("startMinutes < 8 * 60") || !bookingSource.includes("endMinutes > 20 * 60")) {
  failures.push("src/lib/booking.ts: regular-hour classification must require the full window within 8 AM through 8 PM");
}
if (!realtimePhoneSource.includes("submits without any electronic address lookup") || !realtimePhoneSource.includes("remain silent, delay submission, or end the call")) {
  failures.push("src/lib/openAiRealtimePhone.ts: caller-confirmed served address must continue directly to booking");
}
if (phoneMcpSource.includes("verify_service_address") || phoneMcpSource.includes("verifyPhoneServiceAddress") || realtimeWebhookSource.includes("verify_service_address")) {
  failures.push("phone booking: Google/Census address verification must be absent from the active phone flow");
}
if (!phoneMcpSource.includes('server.registerTool("send_booking_code"') || !phoneMcpSource.includes('server.registerTool("verify_booking_code"')) {
  failures.push("phone booking: removing address verification must not remove six-digit SMS verification");
}
if (!phoneMcpSource.includes("FAREWELL_AUDIO_DRAIN_MS = 12000")
  || !phoneMcpSource.includes("POST_FAREWELL_GRACE_MS = 4000")
  || !phoneMcpSource.includes("FAREWELL_AUDIO_DRAIN_MS + POST_FAREWELL_GRACE_MS")) {
  failures.push("phone booking: every final hangup must drain farewell audio and add four seconds before disconnecting");
}
if (!realtimeWebhookSource.includes("CONTROLLER_FORCED_RENEWAL_MS = 280000")
  || !realtimeWebhookSource.includes("controller renewing without ending caller leg")
  || !realtimePhoneSource.includes("There is no caller-facing time limit")
  || !realtimePhoneSource.includes("immediately replace the earlier selection")) {
  failures.push("phone controller: active calls and changed appointment intake must continue across controller renewals");
}
const phoneRouteSource = readFileSync(resolve(root, "src/app/api/assistant/phone/route.ts"), "utf8");
if (!phoneRouteSource.includes("isImportedBlockedNumber(fromE164)")) {
  failures.push("src/app/api/assistant/phone/route.ts: missing imported Android blocked-number check");
}

const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
for (const dependency of ["openai", "@modelcontextprotocol/sdk"]) {
  if (!packageJson.dependencies?.[dependency]) {
    failures.push(`package.json: missing dependency ${dependency}`);
  }
}

const executableFiles = [
  ...collectExecutableFiles(resolve(root, "src")),
  ...collectExecutableFiles(resolve(root, "public")),
  ...collectExecutableFiles(resolve(root, "scripts")),
  resolve(root, "package.json"),
  resolve(root, "package-lock.json"),
  resolve(root, "next.config.ts"),
  resolve(root, "vercel.json"),
].filter((file) => existsSync(file) && !file.endsWith("verify-assistant-deployment.mjs"));

for (const file of executableFiles) {
  const relativeFile = file.slice(root.length + 1).replaceAll("\\", "/");
  if (relativeFile.toLowerCase().includes(retiredSchedulerName)) {
    failures.push(`${relativeFile}: retired external scheduler filename is not allowed`);
    continue;
  }

  const source = readFileSync(file, "utf8").toLowerCase();
  if (source.includes(retiredSchedulerName)) {
    failures.push(`${relativeFile}: retired external scheduler reference is not allowed`);
  }
}

if (failures.length > 0) {
  console.error("Assistant deployment integrity check failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Assistant deployment integrity check passed.");