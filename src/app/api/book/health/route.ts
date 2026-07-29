import { NextResponse } from "next/server";

type ChannelHealth = {
  channel: "manager";
  configured: boolean;
  healthy: boolean;
  detail: string;
};

async function checkManagerHealth(): Promise<ChannelHealth> {
  const managerUrl = process.env.MANAGER_BOOKING_URL;
  const managerApiKey = process.env.MANAGER_API_KEY;
  const authHeaderName = process.env.MANAGER_AUTH_HEADER || "X-API-Key";

  if (!managerUrl || !managerApiKey) {
    return {
      channel: "manager",
      configured: false,
      healthy: false,
      detail: !managerUrl ? "MANAGER_BOOKING_URL not set" : "MANAGER_API_KEY not set",
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(managerUrl, {
      method: "GET",
      headers: {
        [authHeaderName]: managerApiKey,
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    return {
      channel: "manager",
      configured: true,
      healthy: response.ok,
      detail: response.ok ? `manager endpoint reachable (${response.status})` : `manager endpoint error: ${response.status}`,
    };
  } catch (error) {
    return {
      channel: "manager",
      configured: true,
      healthy: false,
      detail: `error testing manager: ${String(error)}`,
    };
  }
}

export async function GET() {
  const manager = await checkManagerHealth();

  const health = [manager];
  const configuredChannels = health.filter((ch) => ch.configured);
  const healthyChannels = health.filter((ch) => ch.healthy);

  const status = healthyChannels.length > 0 ? "ok" : configuredChannels.length > 0 ? "degraded" : "unconfigured";

  return NextResponse.json(
    {
      status,
      configuredChannels: configuredChannels.map((ch) => ch.channel),
      healthyChannels: healthyChannels.map((ch) => ch.channel),
      channels: health,
    },
    {
      status: status === "ok" ? 200 : status === "degraded" ? 206 : 503,
    },
  );
}
