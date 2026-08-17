function envFirst(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.replace(/(?:\\[rn]|[\r\n])+$/g, "").trim();
    }
  }

  return "";
}

async function fetchJson(url: string, options: RequestInit) {
  const response = await fetch(url, options);
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${text || response.statusText}`);
  }

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getTwilioConfig() {
  const sid = envFirst("TWILIO_ACCOUNT_SID");
  const token = envFirst("TWILIO_AUTH_TOKEN");
  const fromSms = envFirst("TWILIO_FROM_SMS", "TWILIO_FROM_NUMBER");
  const fromCall = envFirst("TWILIO_FROM_CALL", "TWILIO_FROM_NUMBER");

  return {
    sid,
    token,
    fromSms,
    fromCall,
    configured: Boolean(sid && token),
  };
}

export async function sendTwilioSms(params: {
  sid: string;
  token: string;
  from: string;
  to: string;
  body: string;
}) {
  const auth = Buffer.from(`${params.sid}:${params.token}`).toString("base64");
  const payload = new URLSearchParams({
    From: params.from,
    To: params.to,
    Body: params.body,
  });

  return fetchJson(`https://api.twilio.com/2010-04-01/Accounts/${params.sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: payload.toString(),
  });
}

export async function placeTwilioCall(params: {
  sid: string;
  token: string;
  from: string;
  to: string;
  message: string;
}) {
  const auth = Buffer.from(`${params.sid}:${params.token}`).toString("base64");
  const twiml = `<Response><Say voice="alice">${params.message}</Say></Response>`;
  const payload = new URLSearchParams({
    From: params.from,
    To: params.to,
    Twiml: twiml,
  });

  return fetchJson(`https://api.twilio.com/2010-04-01/Accounts/${params.sid}/Calls.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: payload.toString(),
  });
}
