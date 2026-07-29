import { readFileSync } from "node:fs";
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
    markers: ["submit_service_request", "manage_appointment", "transfer_to_owner"],
  },
  {
    file: "src/app/api/webhooks/twilio/sms/route.ts",
    markers: ["getTwilioConfig", "sendTwilioSms", "export async function POST"],
  },
];

const failures = [];

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

const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
for (const dependency of ["openai", "@modelcontextprotocol/sdk"]) {
  if (!packageJson.dependencies?.[dependency]) {
    failures.push(`package.json: missing dependency ${dependency}`);
  }
}

if (failures.length > 0) {
  console.error("Assistant deployment integrity check failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Assistant deployment integrity check passed.");