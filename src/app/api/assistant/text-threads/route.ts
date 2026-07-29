import { NextResponse } from "next/server";
import { listTextThreads } from "@/lib/assistantStore";

export async function GET() {
  const threads = await listTextThreads(100);

  return NextResponse.json({
    ok: true,
    threads: threads.map((thread) => ({
      id: thread.id,
      code: thread.code,
      leadId: thread.leadId,
      customerPhone: thread.customerPhone,
      technicianPhone: thread.technicianPhone,
      openedAt: thread.openedAt,
      lastMessageAt: thread.lastMessageAt,
      status: thread.status,
      messageCount: thread.messages.length,
    })),
  });
}
