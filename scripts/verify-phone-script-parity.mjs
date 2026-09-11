import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const runbook = readFileSync(resolve(root, "ASH_PHONE_CALL_SCRIPT.md"), "utf8");
const runtime = readFileSync(resolve(root, "src/lib/openAiRealtimePhone.ts"), "utf8");
const allowedToolsMatch = runtime.match(/allowed_tools:\s*\[([^\]]+)\]/s);
const allowedTools = allowedToolsMatch?.[1] || "";
const failures = [];

const requiredRunbookText = [
  "SMS verification is retired",
  "without electronic address verification",
  "Ash never transfers or connects a live caller",
  "I'm your AI assistant",
  "Let me check availability.",
  "after-hours bookings will incur a $100 additional fee",
  "The after-hours charge is $100",
  "Please say your first and last name.",
  "Please say the best phone number.",
  "Please describe the message for the technician.",
];

for (const text of requiredRunbookText) {
  if (!runbook.includes(text)) failures.push(`runbook missing: ${text}`);
}

const forbiddenRunbookPatterns = [
  /send (?:you )?(?:a |the )?verification code/i,
  /read only the six-digit/i,
  /please say your email address/i,
  /starts? electronic verification/i,
  /transfer_to_owner/i,
];

for (const pattern of forbiddenRunbookPatterns) {
  if (pattern.test(runbook)) failures.push(`runbook contains retired behavior: ${pattern}`);
}

if (/\$150|150 dollars|one hundred fifty/i.test(runbook) || /\$150|150 dollars|one hundred fifty/i.test(runtime)) {
  failures.push("phone script contains the retired $150 after-hours fee");
}

for (const text of [
  "I'm your AI assistant",
  "Let me check availability.",
  "after-hours bookings will incur a $100 additional fee",
  "The after-hours charge is $100",
]) {
  if (!runtime.includes(text)) failures.push(`runtime missing: ${text}`);
}

for (const retiredTool of ["send_booking_code", "verify_booking_code", "transfer_to_owner"]) {
  if (allowedTools.includes(`"${retiredTool}"`)) {
    failures.push(`runtime exposes retired tool: ${retiredTool}`);
  }
}

if (!runtime.includes("Never ask for an email address")) {
  failures.push("runtime is missing the no-email booking rule");
}

if (!runtime.includes("without any electronic address lookup")) {
  failures.push("runtime is missing the no-address-lookup rule");
}

if (failures.length > 0) {
  console.error("Phone script parity check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Phone script parity check passed.");