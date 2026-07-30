import { readFile } from "node:fs/promises";
import type { BookingRequest } from "@/lib/booking";

type BookingRecordFields = {
  serviceType: string;
  customServiceDescription: string;
  city: string;
  preferredDate: string;
  preferredTimeWindow: string;
  name: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressCity: string;
  addressZip: string;
  notes: string;
  sourcePage: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term: string;
  utm_content: string;
  gclid: string;
  gbraid: string;
  wbraid: string;
  fbclid: string;
  msclkid: string;
};

export type AppointmentHistoryRecord = BookingRecordFields & {
  requestId: string;
  submittedAt: string;
  mediaUrls: string[];
  managerStatus: "submitted" | "failed" | "not-configured";
  managerId: string;
  managerDetail: string;
  notificationSummary: string;
};

type ServiceAccount = {
  client_email: string;
  private_key: string;
};

type FirestoreConfig = {
  projectId: string;
  serviceAccount: ServiceAccount;
};

function toFirestoreValue(value: unknown): Record<string, unknown> {
  if (value === null || value === undefined) {
    return { nullValue: null };
  }

  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map((entry) => toFirestoreValue(entry)),
      },
    };
  }

  if (typeof value === "string") {
    return { stringValue: value };
  }

  if (typeof value === "boolean") {
    return { booleanValue: value };
  }

  if (typeof value === "number") {
    if (Number.isInteger(value)) {
      return { integerValue: value.toString() };
    }

    return { doubleValue: value };
  }

  if (typeof value === "object") {
    const fields: Record<string, unknown> = {};
    for (const [key, fieldValue] of Object.entries(value)) {
      fields[key] = toFirestoreValue(fieldValue);
    }

    return {
      mapValue: {
        fields,
      },
    };
  }

  return { stringValue: String(value) };
}

function fromFirestoreValue(value: Record<string, unknown> | undefined): unknown {
  if (!value) {
    return "";
  }

  if ("stringValue" in value) {
    return (value.stringValue as string) || "";
  }

  if ("booleanValue" in value) {
    return Boolean(value.booleanValue);
  }

  if ("integerValue" in value) {
    return Number(value.integerValue || 0);
  }

  if ("doubleValue" in value) {
    return Number(value.doubleValue || 0);
  }

  if ("arrayValue" in value) {
    const rawArray = value.arrayValue as { values?: Array<Record<string, unknown>> };
    return (rawArray.values || []).map((entry) => fromFirestoreValue(entry));
  }

  if ("mapValue" in value) {
    const rawMap = value.mapValue as { fields?: Record<string, Record<string, unknown>> };
    const result: Record<string, unknown> = {};

    for (const [key, nestedValue] of Object.entries(rawMap.fields || {})) {
      result[key] = fromFirestoreValue(nestedValue);
    }

    return result;
  }

  return "";
}

function toFirestoreFields(record: Record<string, unknown>) {
  const fields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    fields[key] = toFirestoreValue(value);
  }
  return fields;
}

async function resolveFirestoreConfig(): Promise<FirestoreConfig | null> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "hvac-pro-28a7e";
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const serviceAccountFile = process.env.FIREBASE_SERVICE_ACCOUNT_FILE;

  let rawServiceAccount = serviceAccountJson;

  if (!rawServiceAccount && serviceAccountFile) {
    try {
      rawServiceAccount = await readFile(serviceAccountFile, "utf8");
    } catch {
      return null;
    }
  }

  if (!rawServiceAccount) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawServiceAccount) as ServiceAccount;
    return {
      projectId,
      serviceAccount: {
        client_email: parsed.client_email,
        private_key: parsed.private_key?.replace(/\\n/g, "\n"),
      },
    };
  } catch {
    return null;
  }
}

async function getFirestoreAccessToken(serviceAccount: ServiceAccount): Promise<string | null> {
  try {
    const jwtHeader = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
    const now = Math.floor(Date.now() / 1000);
    const jwtClaims = Buffer.from(
      JSON.stringify({
        iss: serviceAccount.client_email,
        scope: "https://www.googleapis.com/auth/datastore",
        aud: "https://oauth2.googleapis.com/token",
        exp: now + 3600,
        iat: now,
      }),
    ).toString("base64url");

    const { createSign } = await import("node:crypto");
    const sign = createSign("RSA-SHA256");
    sign.update(`${jwtHeader}.${jwtClaims}`);
    const jwtSig = sign.sign(serviceAccount.private_key, "base64url");
    const jwt = `${jwtHeader}.${jwtClaims}.${jwtSig}`;

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });

    const tokenData = (await tokenResponse.json()) as { access_token?: string };
    return tokenData.access_token || null;
  } catch {
    return null;
  }
}

async function upsertDocument(
  projectId: string,
  token: string,
  collection: string,
  documentId: string,
  record: Record<string, unknown>,
) {
  const endpoint = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${documentId}`;

  const response = await fetch(endpoint, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      fields: toFirestoreFields(record),
    }),
  });

  if (!response.ok) {
    throw new Error(`firestore ${collection} write failed: ${response.status}`);
  }
}

export async function saveAppointmentHistory(
  record: AppointmentHistoryRecord,
  options?: { skipAppointmentsWrite?: boolean },
): Promise<{ ok: boolean; detail: string }> {
  const config = await resolveFirestoreConfig();
  if (!config) {
    return { ok: false, detail: "history skipped: Firestore credentials not configured" };
  }

  const token = await getFirestoreAccessToken(config.serviceAccount);
  if (!token) {
    return { ok: false, detail: "history skipped: Firestore auth failed" };
  }

  try {
    await upsertDocument(config.projectId, token, "websiteBookingHistory", record.requestId, record);

    await upsertDocument(config.projectId, token, "websiteBookings", record.requestId, {
      ...record,
      sourceSystem: "ashaac-nextjs",
      sourceChannel: "website",
      recordType: "booking_submission",
    });

    if (!options?.skipAppointmentsWrite) {
      await upsertDocument(config.projectId, token, "appointments", record.requestId, {
        sourceSystem: "ashaac-nextjs",
        sourceChannel: "website",
        recordType: "booking_submission",
        status: "new",
        leadStatus: "new",
        requestId: record.requestId,
        bookingId: record.requestId,
        appointmentDate: record.preferredDate,
        appointmentTime: record.preferredTimeWindow,
        serviceType: record.serviceType,
        customServiceDescription: record.customServiceDescription,
        city: record.city,
        customerName: record.name,
        customerPhone: record.phone,
        customerEmail: record.email,
        addressLine1: record.addressLine1,
        addressCity: record.addressCity,
        addressZip: record.addressZip,
        notes: record.notes,
        mediaUrls: record.mediaUrls,
        submittedAt: record.submittedAt,
        sourcePage: record.sourcePage,
        managerId: record.managerId,
        managerStatus: record.managerStatus,
        managerDetail: record.managerDetail,
        notificationSummary: record.notificationSummary,
        attribution: {
          utm_source: record.utm_source,
          utm_medium: record.utm_medium,
          utm_campaign: record.utm_campaign,
          utm_term: record.utm_term,
          utm_content: record.utm_content,
          gclid: record.gclid,
          gbraid: record.gbraid,
          wbraid: record.wbraid,
          fbclid: record.fbclid,
          msclkid: record.msclkid,
        },
      });
    }

    return {
      ok: true,
      detail: options?.skipAppointmentsWrite
        ? "history saved to Firestore (websiteBookingHistory, websiteBookings; appointments handled by hvac-pro intake)"
        : "history saved to Firestore (websiteBookingHistory, websiteBookings, appointments)",
    };
  } catch (error) {
    return { ok: false, detail: `history save failed: ${String(error)}` };
  }
}

export async function listAppointmentHistory(limit = 50): Promise<AppointmentHistoryRecord[]> {
  const config = await resolveFirestoreConfig();
  if (!config) {
    return [];
  }

  const token = await getFirestoreAccessToken(config.serviceAccount);
  if (!token) {
    return [];
  }

  const endpoint = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents:runQuery`;
  const queryBody = {
    structuredQuery: {
      from: [{ collectionId: "websiteBookingHistory" }],
      orderBy: [{ field: { fieldPath: "submittedAt" }, direction: "DESCENDING" }],
      limit,
    },
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(queryBody),
    });

    if (!response.ok) {
      return [];
    }

    const rows = (await response.json()) as Array<{
      document?: {
        fields?: Record<string, Record<string, unknown>>;
      };
    }>;

    const records: AppointmentHistoryRecord[] = [];

    for (const row of rows) {
      const fields = row.document?.fields;
      if (!fields) {
        continue;
      }

      const parsed: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(fields)) {
        parsed[key] = fromFirestoreValue(value);
      }

      records.push({
        requestId: String(parsed.requestId || ""),
        submittedAt: String(parsed.submittedAt || ""),
        serviceType: String(parsed.serviceType || ""),
        customServiceDescription: String(parsed.customServiceDescription || ""),
        city: String(parsed.city || ""),
        preferredDate: String(parsed.preferredDate || ""),
        preferredTimeWindow: String(parsed.preferredTimeWindow || ""),
        name: String(parsed.name || ""),
        phone: String(parsed.phone || ""),
        email: String(parsed.email || ""),
        addressLine1: String(parsed.addressLine1 || ""),
        addressCity: String(parsed.addressCity || ""),
        addressZip: String(parsed.addressZip || ""),
        notes: String(parsed.notes || ""),
        sourcePage: String(parsed.sourcePage || ""),
        utm_source: String(parsed.utm_source || ""),
        utm_medium: String(parsed.utm_medium || ""),
        utm_campaign: String(parsed.utm_campaign || ""),
        utm_term: String(parsed.utm_term || ""),
        utm_content: String(parsed.utm_content || ""),
        gclid: String(parsed.gclid || ""),
        gbraid: String(parsed.gbraid || ""),
        wbraid: String(parsed.wbraid || ""),
        fbclid: String(parsed.fbclid || ""),
        msclkid: String(parsed.msclkid || ""),
        mediaUrls: Array.isArray(parsed.mediaUrls) ? parsed.mediaUrls.map((entry) => String(entry)) : [],
        managerStatus: (parsed.managerStatus as AppointmentHistoryRecord["managerStatus"]) || "not-configured",
        managerId: String(parsed.managerId || ""),
        managerDetail: String(parsed.managerDetail || ""),
        notificationSummary: String(parsed.notificationSummary || ""),
      });
    }

    return records;
  } catch {
    return [];
  }
}

export function toAppointmentHistoryRecord(
  requestId: string,
  data: BookingRequest,
  mediaUrls: string[],
  manager: {
    status: AppointmentHistoryRecord["managerStatus"];
    id?: string;
    detail: string;
  },
  notificationSummary: string,
): AppointmentHistoryRecord {
  return {
    serviceType: data.serviceType,
    customServiceDescription: data.customServiceDescription,
    city: data.city,
    preferredDate: data.preferredDate,
    preferredTimeWindow: data.preferredTimeWindow,
    name: `${data.firstName} ${data.lastName}`.trim(),
    phone: data.phone,
    email: data.email,
    addressLine1: data.addressLine1,
    addressCity: data.addressCity,
    addressZip: data.addressZip,
    notes: data.notes,
    sourcePage: data.sourcePage,
    utm_source: data.utm_source,
    utm_medium: data.utm_medium,
    utm_campaign: data.utm_campaign,
    utm_term: data.utm_term,
    utm_content: data.utm_content,
    gclid: data.gclid,
    gbraid: data.gbraid,
    wbraid: data.wbraid,
    fbclid: data.fbclid,
    msclkid: data.msclkid,
    requestId,
    submittedAt: new Date().toISOString(),
    mediaUrls,
    managerStatus: manager.status,
    managerId: manager.id || "",
    managerDetail: manager.detail,
    notificationSummary,
  };
}