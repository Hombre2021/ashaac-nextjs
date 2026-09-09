import OpenAI from "openai";
import { after } from "next/server";
import WebSocket from "ws";
const CONTROLLER_HANDOFF_MS = 240000;
const ACTIVE_TOOL_HANDOFF_RECHECK_MS = 5000;
const CONTROLLER_FORCED_RENEWAL_MS = 280000;
const BOOKING_FAREWELL_AUDIO_DRAIN_MS = 12000;
const POST_FAREWELL_GRACE_MS = 4000;
const BOOKING_SUCCESS_FAREWELL = "Your booking has been successfully submitted. Please check your phone for a text with the confirmation details. Thank you so much for calling, and you have a wonderful rest of your day.";

import { buildRealtimeAcceptBody, OPENAI_REALTIME_PHONE_GREETING, readSipCallerPhone, readSipHeader } from "@/lib/openAiRealtimePhone";
import { claimPhoneGreeting, clearPhoneBookingFarewellPending, isPhoneBookingFarewellPending } from "@/lib/phoneBookingCloseState";

export const runtime = "nodejs";
export const maxDuration = 300;

function envValue(name: string) {
  return String(process.env[name] || "").replace(/(?:\\[rn]|[\r\n])+$/g, "").trim();
}

async function endDirectCallerAfterAsh(callerCallSid: string) {
  if (!/^CA[0-9a-f]{32}$/i.test(callerCallSid)) return false;
  const sid = envValue("TWILIO_ACCOUNT_SID");
  const token = envValue("TWILIO_AUTH_TOKEN");
  if (!/^AC[0-9a-f]{32}$/i.test(sid) || !token) return false;
  await new Promise((resolve) => setTimeout(resolve, BOOKING_FAREWELL_AUDIO_DRAIN_MS + POST_FAREWELL_GRACE_MS));
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls/${callerCallSid}.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ Status: "completed" }).toString(),
  });
  return response.ok;
}

function responseWaitsForCaller(spokenText: string) {
  const normalized = spokenText.trim().replace(/[”"']+$/g, "");
  if (!normalized) return false;
  if (/\?\s*$/.test(normalized) || /\bis that correct[?.]?\s*$/i.test(normalized)) return true;
  const finalSentence = normalized.split(/(?<=[.!?])\s+/).at(-1) || normalized;
  return /^(?:what|when|where|which|who|why|how|would|could|can|may|do|does|did|is|are|was|were|have|has|will|should)\b/i.test(finalSentence)
    || /^(?:please\s+)?(?:read|describe|tell|say|repeat|provide|spell|confirm|explain|share|give)\b/i.test(finalSentence)
    || /\b(?:please read|please tell me|let me know)\b/i.test(finalSentence);
}

export async function requestRealtimeContinuation(url: URL, token: string, callId: string, callerCallSid = "") {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ callId, callerCallSid }),
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) return true;
      console.error("OpenAI Realtime continuation request rejected", { callId, attempt, status: response.status });
    } catch (error) {
      console.error("OpenAI Realtime continuation request failed", {
        callId,
        attempt,
        detail: String((error as Error).message || error),
      });
    }
    if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 500));
  }
  return false;
}

export async function controlRealtimeCall(callId: string, apiKey: string, projectId: string, sendGreeting = true, callerCallSid = "") {
  return new Promise<boolean>((resolve) => {
    let settled = false;
    const socket = new WebSocket(`wss://api.openai.com/v1/realtime?call_id=${encodeURIComponent(callId)}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "OpenAI-Project": projectId,
      },
    });
    let responseActive = false;
    let followUpPending = false;
    let followUpToolName = "";
    let toolInProgress = false;
    let activeToolName = "";
    let activeToolGeneration = 0;
    let closingCall = false;
    let callNoLongerAvailable = false;
    const mcpToolNames = new Map<string, string>();
    const completedMcpItemIds = new Set<string>();
    let reminderResponseActive = false;
    let reminderRequestPending = false;
    let closingRecoveryRequested = false;
    let bookingFarewellObserved = false;
    let bookingFarewellPending = false;
    let followUpTimer: ReturnType<typeof setTimeout> | null = null;
    let reminderTimer: ReturnType<typeof setTimeout> | null = null;
    let callerResponseTimer: ReturnType<typeof setTimeout> | null = null;
    const enterClosingCall = () => {
      closingCall = true;
      toolInProgress = true;
      followUpPending = false;
      if (followUpTimer) {
        clearTimeout(followUpTimer);
        followUpTimer = null;
      }
      if (reminderTimer) {
        clearTimeout(reminderTimer);
        reminderTimer = null;
      }
      if (callerResponseTimer) {
        clearTimeout(callerResponseTimer);
        callerResponseTimer = null;
      }
    };
    const controllerStartedAt = Date.now();
    let timeout: ReturnType<typeof setTimeout>;
    const beginControllerHandoff = () => {
      const controllerAgeMs = Date.now() - controllerStartedAt;
      if ((toolInProgress || followUpPending || responseActive || Boolean(followUpTimer) || Boolean(callerResponseTimer)) && controllerAgeMs < CONTROLLER_FORCED_RENEWAL_MS) {
        timeout = setTimeout(beginControllerHandoff, ACTIVE_TOOL_HANDOFF_RECHECK_MS);
        console.info("OpenAI Realtime controller renewal deferred for active conversation", {
          callId,
          activeToolName,
          controllerAgeMs,
        });
        return;
      }
      console.info("OpenAI Realtime controller renewing without ending caller leg", { callId, controllerAgeMs });
      settled = true;
      socket.close();
      resolve(true);
    };
    timeout = setTimeout(beginControllerHandoff, CONTROLLER_HANDOFF_MS);
    const sendToolFollowUp = (eventType: string, toolName = followUpToolName) => {
      if (followUpTimer) {
        clearTimeout(followUpTimer);
        followUpTimer = null;
      }
      followUpPending = false;
      const activeTool = toolName || followUpToolName;
      followUpToolName = "";
      if (closingCall || socket.readyState !== WebSocket.OPEN) return;
      if (activeTool === "create_booking") {
        socket.send(JSON.stringify({
          type: "response.create",
          response: {
            conversation: "default",
            metadata: { purpose: "booking_confirmation" },
            tool_choice: "none",
            input: [{
              type: "message",
              role: "user",
              content: [{
                type: "input_text",
                text: `Say exactly: ${BOOKING_SUCCESS_FAREWELL}`,
              }],
            }],
            output_modalities: ["audio"],
            instructions: `Say exactly: ${BOOKING_SUCCESS_FAREWELL} Do not say any other words, do not stay silent, and do not call any tool.`,
          },
        }));
        console.info("OpenAI Realtime forced booking confirmation farewell response", { callId, eventType });
        return;
      }
      const toolInstructions: Record<string, string> = {
        check_availability: "The availability check finished. Follow only its latest result. If it returned a recommended block, say exactly: That time is available. Then speak the date with the full month name, day, and four-digit year, for example August 5, 2026, followed by the full two-hour block, and ask exactly: Would you like that exact block? Never speak the ISO date returned by the tool and never use a time from an earlier result. If no matching block was returned or the lookup failed, say so briefly and ask for another date or time. If the returned block is after-hours, wait for acceptance before giving the after-hours disclosure and $100 fee question.",
        send_booking_code: "The verification-text action finished. Follow only its latest result. If it succeeded, do not discuss availability, offer a different time, or repeat an earlier time. Say exactly: I sent you a text message. Please read only the six-digit number in that message. Then wait for the caller. If it failed, do not claim a text was sent; apologize briefly and offer one retry or a callback.",
        verify_booking_code: "The six-digit code check finished. Follow only its latest result. If verified or verificationComplete is true, preserve verificationProof internally for create_booking; never speak it. The verification step is permanently complete for this call. Never call verify_booking_code again and never ask for another code. Continue immediately without waiting for the caller: if you have not already said it, say exactly: That is correct, thank you for confirming that with me. Then ask exactly: Describe in your own words the reason you want our technician to come to your location. Do not repeat the acknowledgment, ask any other question, or remain silent. If verification actually failed, follow the result's specific instruction.",
        create_booking: `The booking action finished. Follow only its latest result. An unverified-address note is not a failure and requires no caller action. If needsCorrection is true, ask only for the named field, preserve verificationProof and every other confirmed value, and immediately retry create_booking once after that answer. Never restart availability, phone verification, address verification, or the intake. If confirmationType is test-only, say the complete booking test passed and no real customer, appointment, Calendar event, dispatch message, or booking confirmation was created. If confirmationType temporary-after-hours was returned, say in the caller's selected language: Your after-hours appointment has been recorded and is pending additional confirmation from our technician for the service address you provided. The appointment is for [full date], between [full two-hour time block]. The after-hours charge is $100. Thank you so much for calling, and have a wonderful rest of your day. Replace only the bracketed values with the accepted date and time block. Do not repeat the caller's name or street address. For every successful saved regular booking, say ONLY and EXACTLY in Ash's voice and the selected language: ${BOOKING_SUCCESS_FAREWELL} Never say 'All set', 'here is your confirmation', 'wrap up', or any filler. After the complete spoken booking confirmation and farewell, call end_call with farewellCompleted true and bookingConfirmationCompleted true. If an actual system error occurred, do not claim an appointment exists; follow the result's retry instruction immediately.`,
        submit_service_request: "The callback or service request finished. Follow only its latest result. If saved, confirm that the request was saved and that the caller will be contacted, then say exactly: Thank you so much for calling, and have a wonderful rest of your day. Immediately call end_call and ask no other question. If it failed, apologize briefly and offer one retry or the owner-message option.",
        submit_owner_message: "The owner or technician text-message request finished. Follow only its latest result. If saved, say exactly: The owner or technician has been sent your message and will get back to you at his earliest convenience. Then say exactly: Thank you so much for calling, and have a wonderful rest of your day. Immediately call end_call and ask no other question. If it failed, apologize briefly and offer one retry.",
        manage_appointment: "The appointment-management action finished. Follow only its latest result and immediately tell the caller what happened. If one corrected value is required, ask only for that value. If the action completed, say exactly: Thank you so much for calling, and have a wonderful rest of your day. Then immediately call end_call.",
        block_spam_caller: "The spam review action finished. Do not describe internal blocking rules. Say exactly: Thank you so much for calling, and have a wonderful rest of your day. Then immediately call end_call.",
      };
      socket.send(JSON.stringify({
        type: "response.create",
        response: {
          output_modalities: ["audio"],
          instructions: toolInstructions[toolName]
            || "The latest business tool finished. Follow only its latest result and instruction. Never repeat a stale availability time or claim success after an error. Do not wait for the caller to speak first unless the latest instruction asks a question.",
        },
      }));
      console.info("OpenAI Realtime forced post-tool response", {
        callId,
        eventType,
        toolName,
      });
    };
    const scheduleToolReminder = (toolGeneration = activeToolGeneration) => {
      if (closingCall || activeToolName === "create_booking" || activeToolName === "end_call") return;
      if (reminderTimer) clearTimeout(reminderTimer);
      reminderTimer = setTimeout(() => {
        reminderTimer = null;
        if (closingCall || !toolInProgress || toolGeneration !== activeToolGeneration || socket.readyState !== WebSocket.OPEN) return;
        if (activeToolName === "create_booking" || activeToolName === "end_call") return;
        if (reminderResponseActive || reminderRequestPending) {
          scheduleToolReminder(toolGeneration);
          return;
        }
        reminderRequestPending = true;
        const reminderText = activeToolName === "check_availability"
          ? "I am still looking to see if that time is available, thank you for your patience."
          : "I am still searching, just verifying that for you.";
        socket.send(JSON.stringify({
          type: "response.create",
          response: {
            conversation: "none",
            metadata: { purpose: "tool_wait_reminder" },
            tool_choice: "none",
            input: [{
              type: "message",
              role: "user",
              content: [{
                type: "input_text",
                text: `Say exactly: ${reminderText}`,
              }],
            }],
            output_modalities: ["audio"],
            instructions: `Say exactly: ${reminderText} Do not add any other words or call any tool.`,
          },
        }));
        console.info("OpenAI Realtime tool wait reminder requested", { callId, activeToolName, toolGeneration });
      }, 4000);
    };
    const queueToolFollowUp = (eventType: string, toolName: string) => {
      if (closingCall) return;
      followUpToolName = toolName;
      if (followUpTimer) clearTimeout(followUpTimer);
      followUpTimer = setTimeout(() => {
        followUpTimer = null;
        if (responseActive || reminderResponseActive) {
          followUpPending = true;
          return;
        }
        sendToolFollowUp(eventType, toolName);
      }, 350);
    };

    socket.once("open", async () => {
      if (sendGreeting) {
        const greetingClaimed = await claimPhoneGreeting(callId);
        console.info("OpenAI Realtime greeting claim resolved", { callId, greetingClaimed });
        if (!greetingClaimed || socket.readyState !== WebSocket.OPEN) return;
        socket.send(JSON.stringify({
          type: "response.create",
          response: {
            conversation: "none",
            metadata: { purpose: "initial_greeting" },
            tool_choice: "none",
            output_modalities: ["audio"],
            instructions: `Say exactly this introduction, with a warm professional tone, and then listen for the caller's answer: ${OPENAI_REALTIME_PHONE_GREETING}`,
          },
        }));
        return;
      }
      if (await isPhoneBookingFarewellPending(callId)) {
        bookingFarewellPending = true;
        socket.send(JSON.stringify({
          type: "response.create",
          response: {
            output_modalities: ["audio"],
            instructions: `A saved booking is waiting for its completed closure. If it is a regular booking, say in the caller's selected language: ${BOOKING_SUCCESS_FAREWELL} If it is after-hours, say in the selected language: Your after-hours appointment has been recorded and is pending additional confirmation from our technician for the service address you provided. The appointment is for [full date], between [full two-hour time block]. The after-hours charge is $100. Thank you so much for calling, and have a wonderful rest of your day. Replace only the bracketed values with the accepted date and time block. Do not repeat the caller's name or street address. After the complete spoken booking confirmation and farewell, call end_call with farewellCompleted true and bookingConfirmationCompleted true. Do not ask another question.`,
          },
        }));
        console.info("OpenAI Realtime renewed controller resumed booking farewell", { callId });
      }
    });
    socket.on("message", (data) => {
      try {
        const event = JSON.parse(data.toString()) as {
          type?: string;
          error?: { message?: string };
          response?: {
            id?: string;
            metadata?: { purpose?: string };
            output?: Array<{
              type?: string;
              id?: string;
              name?: string;
              role?: string;
              content?: Array<{ type?: string; text?: string; transcript?: string }>;
            }>;
          };
          item?: { type?: string; id?: string; name?: string; role?: string; output?: string; error?: unknown };
          item_id?: string;
          transcript?: string;
        };
        if (event.type === "response.output_item.added" && event.item?.type === "mcp_call" && event.item.id && event.item.name) {
          if (callerResponseTimer) {
            clearTimeout(callerResponseTimer);
            callerResponseTimer = null;
          }
          mcpToolNames.set(event.item.id, event.item.name);
          if (event.item.name === "end_call") {
            activeToolName = event.item.name;
          } else if (!toolInProgress) {
            activeToolGeneration += 1;
            toolInProgress = true;
            activeToolName = event.item.name;
            scheduleToolReminder(activeToolGeneration);
            console.info("OpenAI Realtime MCP tool started", {
              callId,
              toolName: event.item.name,
              itemId: event.item.id,
              eventType: event.type,
            });
          }
        }
        if ((event.type === "conversation.item.created" || event.type === "conversation.item.added")
          && event.item?.type === "message" && event.item.role === "user" && event.item.id) {
          console.info("OpenAI Realtime caller turn committed", { callId, itemId: event.item.id });
          if (callerResponseTimer) clearTimeout(callerResponseTimer);
          callerResponseTimer = setTimeout(() => {
            callerResponseTimer = null;
            if (closingCall || responseActive || toolInProgress || socket.readyState !== WebSocket.OPEN) return;
            socket.send(JSON.stringify({
              type: "response.create",
              response: {
                output_modalities: ["audio"],
                instructions: "Respond immediately to the caller's latest completed turn and continue the active workflow from the current context. Do not restart or repeat already confirmed information.",
              },
            }));
            console.info("OpenAI Realtime caller-turn silence recovery requested", { callId, itemId: event.item?.id });
          }, 2500);
        }
        if (event.type === "response.created") {
          if (callerResponseTimer) {
            clearTimeout(callerResponseTimer);
            callerResponseTimer = null;
          }
          if (event.response?.metadata?.purpose === "tool_wait_reminder") {
            reminderRequestPending = false;
            if (!toolInProgress) {
              if (event.response.id) {
                socket.send(JSON.stringify({ type: "response.cancel", response_id: event.response.id }));
              }
              reminderResponseActive = false;
              return;
            }
            reminderResponseActive = true;
          } else {
            responseActive = true;
          }
        }
        const completedMcpEvent = event.type === "response.output_item.done"
          && event.item?.type === "mcp_call";
        const failedMcpEvent = event.type === "response.mcp_call.failed";
        if (event.type === "response.mcp_call.in_progress") {
          const toolName = event.item_id ? mcpToolNames.get(event.item_id) || "" : "";
          if (!toolInProgress) activeToolGeneration += 1;
          toolInProgress = true;
          activeToolName = toolName || activeToolName;
          if (activeToolName === "end_call") {
            enterClosingCall();
          } else {
            scheduleToolReminder(activeToolGeneration);
          }
        }
        if ((completedMcpEvent || failedMcpEvent) && !completedMcpItemIds.has(event.item?.id || event.item_id || "")) {
          const completedItemId = event.item?.id || event.item_id || "";
          if (completedItemId) completedMcpItemIds.add(completedItemId);
          const completedToolName = event.item?.name
            || activeToolName
            || (completedItemId ? mcpToolNames.get(completedItemId) || "" : "");
          if (completedItemId && completedToolName) mcpToolNames.set(completedItemId, completedToolName);
          if (completedToolName === "create_booking" && !failedMcpEvent && !event.item?.error) {
            bookingFarewellPending = true;
          }
          activeToolGeneration += 1;
          toolInProgress = false;
          activeToolName = "";
          reminderRequestPending = false;
          if (reminderTimer) {
            clearTimeout(reminderTimer);
            reminderTimer = null;
          }
          console.info("OpenAI Realtime MCP tool finished", {
            callId,
            eventType: event.type,
            toolName: completedToolName,
            itemId: completedItemId,
            failed: failedMcpEvent || Boolean(event.item?.error),
            failureDetail: failedMcpEvent
              ? String(event.item?.error || event.item?.output || "OpenAI did not provide failure detail.").slice(0, 500)
              : "",
          });
          if (!closingCall) queueToolFollowUp(event.type || "tool.completed", completedToolName);
        }
        if (event.type === "response.output_audio.delta" && followUpPending && !toolInProgress) {
          // Audio may still belong to the pre-tool holding phrase. The completed
          // business tool must always receive its own deterministic follow-up.
        }
        if (event.type === "response.done") {
          if (event.response?.metadata?.purpose === "tool_wait_reminder") {
            reminderResponseActive = false;
            if (closingCall) {
              followUpPending = false;
            } else if (followUpPending) {
              sendToolFollowUp(event.type);
            } else if (toolInProgress) {
              scheduleToolReminder();
            }
          } else {
            responseActive = false;
            const output = event.response?.output || [];
            const startedTool = output.some((item) => item.type === "mcp_call" || item.type === "function_call");
            const finalToolIndex = output.findLastIndex((item) => item.type === "mcp_call" || item.type === "function_call");
            const postToolSpokenText = finalToolIndex < 0
              ? ""
              : output.slice(finalToolIndex + 1)
                .filter((item) => item.type === "message" && item.role === "assistant")
                .flatMap((item) => item.content || [])
                .map((content) => content.transcript || content.text || "")
                .join(" ")
                .trim();
            const sentToolFollowUp = !closingCall && followUpPending && !postToolSpokenText;
            if (followUpPending && postToolSpokenText) {
              followUpPending = false;
              followUpToolName = "";
              if (followUpTimer) {
                clearTimeout(followUpTimer);
                followUpTimer = null;
              }
              console.info("OpenAI Realtime native post-tool response completed", { callId });
            } else if (sentToolFollowUp) {
              sendToolFollowUp(event.type);
            }
            const spokenText = output
              .filter((item) => item.type === "message" && item.role === "assistant")
              .flatMap((item) => item.content || [])
              .map((content) => content.transcript || content.text || "")
              .join(" ");
            const normalizedSpokenText = spokenText.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
            const bookingFarewellSpoken = normalizedSpokenText.includes("your booking has been successfully submitted")
              && normalizedSpokenText.includes("please check your phone for a text with the confirmation details")
              && normalizedSpokenText.includes("thank you so much for calling")
              && normalizedSpokenText.includes("you have a wonderful rest of your day");
            const afterHoursFarewellSpoken = normalizedSpokenText.includes("appointment")
              && normalizedSpokenText.includes("pending")
              && normalizedSpokenText.includes("technician")
              && (normalizedSpokenText.includes("after hours charge is 100") || normalizedSpokenText.includes("after hours charge is one hundred"))
              && normalizedSpokenText.includes("thank you so much for calling")
              && normalizedSpokenText.includes("wonderful rest of your day");
            const completedWarmFarewell = normalizedSpokenText.includes("thank you so much for calling")
              && normalizedSpokenText.includes("wonderful rest of your day");
            if ((bookingFarewellSpoken || afterHoursFarewellSpoken || (bookingFarewellPending && completedWarmFarewell)) && !bookingFarewellObserved) {
              bookingFarewellObserved = true;
              enterClosingCall();
              void endDirectCallerAfterAsh(callerCallSid).then((ended) => {
                if (ended) void clearPhoneBookingFarewellPending(callId);
                console.info("OpenAI Realtime Ash booking farewell completed", { callId, ended });
              });
            }
            const farewellSpoken = spokenText.includes("Thank you so much for calling, and have a wonderful rest of your day.");
            const incompleteClosing = /\b(?:let me|i(?:'|’)ll|i will|i am going to)\s+(?:wrap|finish|end|close)|\bwrap this up\b/i.test(spokenText);
            if (!closingCall && !startedTool && !closingRecoveryRequested && (farewellSpoken || incompleteClosing)) {
              closingRecoveryRequested = true;
              socket.send(JSON.stringify({
                type: "response.create",
                response: {
                  output_modalities: ["audio"],
                  instructions: farewellSpoken
                    ? "Do not speak. Immediately call end_call with farewellCompleted true."
                    : "Say exactly: Thank you so much for calling, and have a wonderful rest of your day. Then immediately call end_call with farewellCompleted true. Do not add any other words.",
                },
              }));
              console.info("OpenAI Realtime incomplete closing recovery requested", { callId, farewellSpoken });
            } else {
              const waitsForCaller = responseWaitsForCaller(spokenText);
              const stalledSpokenTurn = spokenText.trim() && !startedTool && !waitsForCaller && !farewellSpoken;
              if (!closingCall && !sentToolFollowUp && !toolInProgress && stalledSpokenTurn) {
                socket.send(JSON.stringify({
                  type: "response.create",
                  response: {
                    output_modalities: ["audio"],
                    instructions: "Your previous response ended without advancing the call. Continue immediately from the current context. Ask the single next required question, start the required business tool, or complete the approved farewell and end_call. Do not repeat the acknowledgment or confirmation you just gave.",
                  },
                }));
                console.info("OpenAI Realtime incomplete turn continued", { callId });
              }
            }
          }
        }
        if (event.type === "error") {
          console.error("OpenAI Realtime control event error", {
            callId,
            detail: event.error?.message || "Unknown Realtime error.",
            activeToolName,
          });
          reminderRequestPending = false;
          reminderResponseActive = false;
          if (toolInProgress && !closingCall) scheduleToolReminder();
        }
      } catch {
        // Ignore unrelated control frames.
      }
    });
    socket.once("error", (error) => {
      if (/server response:\s*404/i.test(String(error.message || error))) {
        callNoLongerAvailable = true;
      }
      console.error("OpenAI Realtime controller socket error", {
        callId,
        detail: String(error.message || error),
      });
    });
    socket.once("close", (code, reason) => {
      if (settled) return;
      clearTimeout(timeout);
      if (followUpTimer) clearTimeout(followUpTimer);
      if (reminderTimer) clearTimeout(reminderTimer);
      if (callerResponseTimer) clearTimeout(callerResponseTimer);
      settled = true;
      const abnormalClosure = code !== 1000 && !callNoLongerAvailable;
      console.info("OpenAI Realtime controller socket closed", {
        callId,
        code,
        reason: reason.toString().slice(0, 200),
        renew: abnormalClosure,
      });
      resolve(abnormalClosure);
    });
  });
}

export async function POST(request: Request) {
  const apiKey = envValue("OPENAI_API_KEY");
  const projectId = envValue("OPENAI_PROJECT_ID");
  const webhookSecret = envValue("OPENAI_WEBHOOK_SECRET");
  const mcpToken = envValue("OPENAI_REALTIME_MCP_TOKEN");
  if (!apiKey || !projectId || !webhookSecret) {
    return Response.json({ error: "OpenAI Realtime phone configuration is incomplete." }, { status: 503 });
  }

  const client = new OpenAI({ apiKey, webhookSecret });
  const rawBody = await request.text();
  let event;
  try {
    event = await client.webhooks.unwrap(rawBody, request.headers);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type !== "realtime.call.incoming") {
    return Response.json({ ok: true, ignored: event.type });
  }

  const callId = event.data.call_id;
  const callerPhone = readSipCallerPhone(event.data.sip_headers);
  const conferenceName = readSipHeader(event.data.sip_headers, "x-all-solutions-conference");
  const callerCallSid = readSipHeader(event.data.sip_headers, "x-all-solutions-call-sid");
  console.info("OpenAI Realtime SIP metadata", {
    callId,
    conferenceRecognized: /^ash-CA[0-9a-f]{32}$/i.test(conferenceName),
    directCallRecognized: /^CA[0-9a-f]{32}$/i.test(callerCallSid),
  });
  const origin = new URL(request.url).origin;
  const mcpUrl = new URL("/api/assistant/phone/mcp", origin);
  if (/^ash-CA[0-9a-f]{32}$/i.test(conferenceName)) {
    mcpUrl.searchParams.set("conference", conferenceName);
  }
  if (/^CA[0-9a-f]{32}$/i.test(callerCallSid)) {
    mcpUrl.searchParams.set("callerCallSid", callerCallSid);
  }
  if (callerPhone) {
    mcpUrl.searchParams.set("caller", callerPhone);
  }
  mcpUrl.searchParams.set("callId", callId);
  const acceptResponse = await fetch(`https://api.openai.com/v1/realtime/calls/${encodeURIComponent(callId)}/accept`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "OpenAI-Project": projectId,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildRealtimeAcceptBody({
      callId,
      callerPhone,
      mcpUrl: mcpUrl.toString(),
      mcpToken,
    })),
  });
  const acceptDetail = await acceptResponse.text().catch(() => "");
  console.info("OpenAI Realtime accept result", {
    callId,
    status: acceptResponse.status,
    detail: acceptDetail.slice(0, 300),
    voice: envValue("OPENAI_REALTIME_VOICE") || "ash",
  });

  if (!acceptResponse.ok) {
    console.error("OpenAI Realtime call acceptance failed", { status: acceptResponse.status, detail: acceptDetail.slice(0, 300) });
    return Response.json({ error: "Unable to accept Realtime call." }, { status: 502 });
  }

  after(async () => {
    try {
      const needsContinuation = await controlRealtimeCall(callId, apiKey, projectId, true, callerCallSid);
      if (needsContinuation) {
        await requestRealtimeContinuation(new URL("/api/webhooks/openai/realtime/control", origin), mcpToken, callId, callerCallSid);
      }
      console.info("OpenAI Realtime call control ended", { callId, voice: envValue("OPENAI_REALTIME_VOICE") || "ash" });
    } catch (error) {
      console.error("OpenAI Realtime call control failed", { callId, detail: String((error as Error).message || error) });
    }
  });

  return Response.json({ ok: true });
}