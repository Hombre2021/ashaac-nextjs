import { NextResponse } from "next/server";
import { appendAssistantCost } from "@/lib/assistantStore";

export const dynamic = "force-dynamic";

function trimEnv(name: string) {
  return String(process.env[name] || "").trim();
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const text = String(url.searchParams.get("text") || "").trim();
  const callSid = String(url.searchParams.get("callSid") || "").trim();

  if (!text) {
    return new NextResponse("Missing text", { status: 400 });
  }

  const apiKey = trimEnv("ELEVENLABS_API_KEY");
  const voiceId = trimEnv("ELEVENLABS_VOICE_ID");
  const modelId = trimEnv("ELEVENLABS_MODEL_ID") || "eleven_turbo_v2_5";

  if (!apiKey || !voiceId) {
    return new NextResponse("ElevenLabs is not configured", { status: 503 });
  }

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`, {
    method: "POST",
    headers: {
      Accept: "audio/mpeg",
      "Content-Type": "application/json",
      "xi-api-key": apiKey,
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      voice_settings: {
        stability: 0.45,
        similarity_boost: 0.85,
        style: 0.3,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    await appendAssistantCost({
      provider: "elevenlabs",
      category: "tts",
      callSid: callSid || undefined,
      unitCount: text.length,
      unitLabel: "characters",
      detail: `error:${response.status}`,
    });
    return new NextResponse(`ElevenLabs TTS failed: ${detail || response.statusText}`, { status: 502 });
  }

  const audioBuffer = await response.arrayBuffer();

  await appendAssistantCost({
    provider: "elevenlabs",
    category: "tts",
    callSid: callSid || undefined,
    unitCount: text.length,
    unitLabel: "characters",
    detail: `voice:${voiceId}`,
  });

  return new NextResponse(audioBuffer, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "public, max-age=300",
    },
  });
}
