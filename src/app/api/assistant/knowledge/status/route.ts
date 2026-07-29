import { NextResponse } from "next/server";
import { getKnowledgeStatus } from "@/lib/assistantKnowledgeBase";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = await getKnowledgeStatus();
  return NextResponse.json(status);
}
