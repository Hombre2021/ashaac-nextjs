# AI Chat + Phone Assistant Migration Plan

## Decision: keep vs replace

- Keep and reuse:
  - `src/app/api/assistant/lead/route.ts` in this app (already handles lead scoring, HVAC Pro push, follow-up task creation, and Twilio handoff dispatch).
  - The assistant entry point in `src/app/layout.tsx`.
  - Booking flow and booking API integration in `src/components/booking/*` and `src/app/api/book/*`.
- Replace:
  - Legacy rigid chat flow in `src/components/WebsiteAIAssistant.tsx` (replaced with adaptive conversation flow).
- Do not delete yet (reference-only until parity is complete):
  - `c:/Users/hombr/hvac-lead-generator` app. It contains useful backup logic for text thread bridging and automation scripts.

## What changed now

1. Replaced `WebsiteAIAssistant` with a smarter flow:
   - Intent-aware opening (question, booking, SMS technician, callback, transfer).
   - Lightweight HVAC Q&A responses.
   - Adaptive question queue and lead capture.
   - Existing API submission (`/api/assistant/lead`) retained.
2. Added quick action links in widget:
   - Book now
   - Call
   - Text
3. Added reset/start-over control to make repeat interactions easier.

## Next implementation phases

1. Add live text thread API routes to `ashaac-nextjs`:
   - Open instant text thread.
   - Twilio inbound SMS webhook relay.
   - Thread state persistence in your current store.
2. Add appointment actions:
   - Reschedule/cancel/status check endpoints and assistant intents.
3. Add business analytics:
   - Lead-to-book conversion by channel.
   - Missed-call recovery metrics.
4. Add compliance and safety controls:
   - Text opt-in/opt-out behavior.
   - Call recording disclosure logic.
   - AI safety guardrails for homeowner troubleshooting advice.

## Removal criteria for old app

Archive or remove `hvac-lead-generator` only after all are true:

- Live text thread parity confirmed.
- Twilio inbound/outbound workflows verified in this app.
- Hourly SLA automation replaced or intentionally retired.
- 7+ day production run with no lead loss and no webhook failures.
