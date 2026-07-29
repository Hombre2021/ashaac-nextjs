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
    markers: ["submit_service_request", "manage_appointment", "transfer_to_owner"],
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