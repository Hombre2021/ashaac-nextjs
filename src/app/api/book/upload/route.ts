import { NextResponse } from "next/server";

const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/quicktime",
]);
const MAX_SIZE = 8 * 1024 * 1024; // 8 MB safe cap for JSON/base64 transport

function resolveMediaUploadUrl() {
  if (process.env.MEDIA_UPLOAD_URL) {
    return process.env.MEDIA_UPLOAD_URL;
  }

  const managerUrl = process.env.MANAGER_BOOKING_URL || "";
  if (managerUrl.includes("intakeWebsiteBooking")) {
    return managerUrl.replace("intakeWebsiteBooking", "uploadWebsiteBookingMedia");
  }

  return "https://us-central1-hvac-pro-28a7e.cloudfunctions.net/uploadWebsiteBookingMedia";
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Multipart form required" }, { status: 400 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Could not parse form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ACCEPTED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length > MAX_SIZE) {
    return NextResponse.json({ error: "File exceeds 8 MB limit" }, { status: 413 });
  }

  const uploadUrl = resolveMediaUploadUrl();
  const apiKey = process.env.MANAGER_API_KEY || "";

  if (!apiKey) {
    return NextResponse.json({ error: "Media upload API key is not configured" }, { status: 500 });
  }

  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      fileBase64: buffer.toString("base64"),
    }),
  });

  const uploadPayload = (await uploadResponse.json().catch(() => null)) as { url?: string; error?: string } | null;

  if (!uploadResponse.ok || !uploadPayload?.url) {
    return NextResponse.json(
      { error: uploadPayload?.error || "Upload to storage failed" },
      { status: uploadResponse.status || 500 },
    );
  }

  return NextResponse.json({ url: uploadPayload.url });
}
