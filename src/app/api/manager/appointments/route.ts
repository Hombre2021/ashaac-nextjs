import { NextResponse } from "next/server";
import { listAppointmentHistory } from "@/lib/appointmentHistory";

function isAuthorized(request: Request): boolean {
  const expectedToken = process.env.BOOKING_MANAGER_VIEW_TOKEN;
  if (!expectedToken) {
    return false;
  }

  const url = new URL(request.url);
  const queryToken = url.searchParams.get("token") || "";
  const headerToken = request.headers.get("x-manager-token") || "";
  const providedToken = queryToken || headerToken;

  return providedToken.length > 0 && providedToken === expectedToken;
}

export async function GET(request: Request) {
  if (!process.env.BOOKING_MANAGER_VIEW_TOKEN) {
    return NextResponse.json(
      {
        error: "Manager view token is not configured. Set BOOKING_MANAGER_VIEW_TOKEN.",
      },
      { status: 503 },
    );
  }

  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        error: "Unauthorized",
      },
      { status: 401 },
    );
  }

  const records = await listAppointmentHistory(100);
  return NextResponse.json({ records });
}