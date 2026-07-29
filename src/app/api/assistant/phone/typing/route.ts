export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return Response.redirect(new URL("/audio/typing-keyboard.mp3", request.url), 307);
}