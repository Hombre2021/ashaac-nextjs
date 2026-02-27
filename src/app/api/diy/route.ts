import { NextResponse } from "next/server";

type DIYQuestionPayload = {
  submissionType: "question";
  name: string;
  email: string;
  city: string;
  replyChannel: string;
  question: string;
};

type DIYLiveHelpPayload = {
  submissionType: "live_help";
  name: string;
  email: string;
  phone: string;
  preferredDate: string;
  preferredTime: string;
  issue: string;
};

type DIYPayload = DIYQuestionPayload | DIYLiveHelpPayload;

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isQuestionSubmission(payload: DIYPayload): payload is DIYQuestionPayload {
  return payload.submissionType === "question";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<DIYPayload>;

    const submissionType =
      body.submissionType === "live_help" ? "live_help" : body.submissionType === "question" ? "question" : null;

    if (!submissionType) {
      return NextResponse.json({ ok: false, error: "Invalid submission type" }, { status: 400 });
    }

    const payload = { ...body, submissionType } as DIYPayload;

    const commonName = String(payload.name || "").trim();
    const commonEmail = String(payload.email || "").trim();

    if (!commonName || !commonEmail || !isValidEmail(commonEmail)) {
      return NextResponse.json({ ok: false, error: "Missing or invalid contact info" }, { status: 400 });
    }

    if (isQuestionSubmission(payload)) {
      if (
        !String(payload.city || "").trim() ||
        !String(payload.replyChannel || "").trim() ||
        !String(payload.question || "").trim()
      ) {
        return NextResponse.json({ ok: false, error: "Missing question fields" }, { status: 400 });
      }
    } else {
      if (
        !String(payload.phone || "").trim() ||
        !String(payload.preferredDate || "").trim() ||
        !String(payload.preferredTime || "").trim() ||
        !String(payload.issue || "").trim()
      ) {
        return NextResponse.json({ ok: false, error: "Missing live help fields" }, { status: 400 });
      }
    }

    const webhookUrl = process.env.DIY_WEBHOOK_URL || process.env.CONTACT_WEBHOOK_URL;

    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source: "diy_help_center",
          submittedAt: new Date().toISOString(),
          ...payload,
        }),
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }
}
