import { createHash } from "node:crypto";
import { del, get, put } from "@vercel/blob";

function markerPath(callId: string) {
  const callHash = createHash("sha256").update(callId).digest("hex");
  return `phone-booking-close/${callHash}.json`;
}

function greetingPath(callId: string) {
  const callHash = createHash("sha256").update(callId).digest("hex");
  return `phone-greetings/${callHash}.json`;
}

export async function claimPhoneGreeting(callId: string) {
  if (!process.env.BLOB_READ_WRITE_TOKEN || !/^rtc_[A-Za-z0-9_-]+$/.test(callId)) return false;
  try {
    await put(greetingPath(callId), JSON.stringify({ claimed: true }), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: "application/json",
      cacheControlMaxAge: 60,
    });
    return true;
  } catch {
    return false;
  }
}

export async function markPhoneBookingFarewellPending(callId: string) {
  if (!process.env.BLOB_READ_WRITE_TOKEN || !/^rtc_[A-Za-z0-9_-]+$/.test(callId)) return false;
  try {
    await put(markerPath(callId), JSON.stringify({ pending: true }), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      cacheControlMaxAge: 60,
    });
    return true;
  } catch {
    return false;
  }
}

export async function isPhoneBookingFarewellPending(callId: string) {
  if (!process.env.BLOB_READ_WRITE_TOKEN || !/^rtc_[A-Za-z0-9_-]+$/.test(callId)) return false;
  const response = await get(markerPath(callId), {
    access: "public",
    useCache: false,
    abortSignal: AbortSignal.timeout(1500),
  }).catch(() => null);
  return response?.statusCode === 200;
}

export async function clearPhoneBookingFarewellPending(callId: string) {
  if (!process.env.BLOB_READ_WRITE_TOKEN || !/^rtc_[A-Za-z0-9_-]+$/.test(callId)) return;
  await del(markerPath(callId)).catch(() => undefined);
}