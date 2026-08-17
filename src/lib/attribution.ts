import { bookingAttributionKeys } from "./booking";

const STORAGE_KEY = "ashaac_attribution";
const STORAGE_TTL_MS = 90 * 24 * 60 * 60 * 1000;

export type Attribution = Record<typeof bookingAttributionKeys[number], string>;

export function emptyAttribution(): Attribution {
  return Object.fromEntries(bookingAttributionKeys.map((key) => [key, ""])) as Attribution;
}

export function readStoredAttribution(): Attribution {
  if (typeof window === "undefined") {
    return emptyAttribution();
  }

  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null") as { values?: Partial<Attribution>; expiresAt?: number } | null;
    if (!stored || !stored.expiresAt || stored.expiresAt < Date.now()) {
      return emptyAttribution();
    }

    return { ...emptyAttribution(), ...stored.values };
  } catch {
    return emptyAttribution();
  }
}

export function captureAttribution(search: string): Attribution {
  const current = readStoredAttribution();
  const params = new URLSearchParams(search);
  const values = { ...current };

  for (const key of bookingAttributionKeys) {
    const value = params.get(key)?.trim();
    if (value) {
      values[key] = value;
    }
  }

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ values, expiresAt: Date.now() + STORAGE_TTL_MS }));
    } catch {
      // Storage may be unavailable in private browsing or restrictive browsers.
    }
  }

  return values;
}