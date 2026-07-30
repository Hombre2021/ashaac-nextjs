export const dynamic = "force-dynamic";

function keyboardHoldTwiml(request: Request) {
  const origin = new URL(request.url).origin;
  const routeUrl = `${origin}/api/assistant/phone/typing`;
  const audioUrl = `${origin}/audio/typing-keyboard.mp3`;
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response><Play>${audioUrl}</Play><Redirect method="GET">${routeUrl}</Redirect></Response>`, {
    headers: { "Content-Type": "text/xml" },
  });
}

export const GET = keyboardHoldTwiml;
export const POST = keyboardHoldTwiml;