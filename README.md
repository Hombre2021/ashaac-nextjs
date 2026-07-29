## ASHAAC Next.js

This is the production Next.js site for All Solutions Heating and Air Conditioning.

**Current Version: June 15, 2026 (Booking History & Manager View Restored)**

Key Features:
- the public marketing site
- the `/book` booking flow with media uploads and Google Calendar-backed availability
- `/manager/appointments` booking history dashboard (requires `BOOKING_MANAGER_VIEW_TOKEN`)
- consolidated AI chat + phone + SMS assistant stack in this project
- `/manager/assistant` internal assistant operations dashboard (requires `BOOKING_MANAGER_VIEW_TOKEN`)
- Google Analytics 4, Google Tag Manager, Google Ads, and Search Console wiring
- optional media upload support for booking attachments
- the in-house booking app that replaced the former Calendly flow

**Backup Info:** Keep a local backup copy of `ashaac-nextjs/` with matching `.env.local` values and any booking secrets from the companion `hvac-pro/` project.

## Local Backup And Restore

If you want to keep a local backup copy of the site, use this folder as the source of truth and keep these items together:
- the `ashaac-nextjs` project files
- the matching `.env.local` values used for local dev
- any booking/backend secret values kept in the companion `hvac-pro` project

Recommended Windows startup from the workspace root:

```powershell
powershell -ExecutionPolicy Bypass -File .\dev.ps1
```

If you only want to start this app directly:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Required Environment Variables

Keep these in Vercel and your local backup copy:
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- `NEXT_PUBLIC_GTM_ID`
- `NEXT_PUBLIC_GOOGLE_ADS_ID`
- `NEXT_PUBLIC_GOOGLE_ADS_BOOKING_LABEL` when using a direct Google Ads website conversion label
- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`
- `HVAC_PRO_BOOKING_ENDPOINT` (defaults to manager intake endpoint if set)
- `HVAC_PRO_FOLLOWUP_ENDPOINT` (`createWebsiteLeadFollowUp` in hvac-pro)
- `HVAC_PRO_API_KEY` (same website booking intake key used by hvac-pro)
- `HVAC_PRO_AUTH_HEADER` (defaults to `x-api-key`)
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `OPENAI_API_KEY` (required for real AI answers in chat and phone assistant)
- `OPENAI_CHAT_MODEL` (example: `gpt-4.1-mini`)
- `OPENAI_EMBED_MODEL` (optional, default `text-embedding-3-small`)
- `OPENAI_PROJECT_ID` (required for direct SIP Realtime calls; starts with `proj_`)
- `OPENAI_WEBHOOK_SECRET` (signing secret for `/api/webhooks/openai/realtime`)
- `OPENAI_REALTIME_MCP_TOKEN` (long random secret used only between OpenAI Realtime and the phone MCP route)
- `OPENAI_REALTIME_MODEL` (optional, defaults to `gpt-realtime`)
- `TWILIO_OPENAI_REALTIME_ENABLED` (optional; set to `true` only after the OpenAI webhook is configured and tested)
- `TWILIO_FROM_NUMBER` and optionally `TWILIO_FROM_SMS`, `TWILIO_FROM_CALL`
- `LIVE_TECHNICIAN_SMS_TO` and optionally `LIVE_TECHNICIAN_CALL_TO`
- `BOOKING_DESTINATION_URL` for assistant action links (defaults to `https://ashaac.com/book`)
- `MANAGER_BOOKING_URL`
- `MANAGER_API_KEY`
- `MANAGER_AUTH_HEADER`
- `MANAGER_APPOINTMENT_UPDATE_URL` (or `HVAC_PRO_APPOINTMENT_UPDATE_ENDPOINT`) for status/reschedule/cancel actions
- `BOOKING_MANAGER_VIEW_TOKEN` for manager dashboards
- `MEDIA_UPLOAD_URL`

## Booking Flow

The live flow is:
1. Visitor submits the booking form.
2. The site posts the request to `/api/book`.
3. Booking data is forwarded to the backend booking function.
4. Confirmed bookings sync into Google Calendar for the `ashaacutah@gmail.com` calendar account.
5. Optional attachments are uploaded through `/api/book/upload`.
6. GA4 records the booking event and Google Ads can import it as a conversion.

Availability is now calendar-driven end to end: `/api/book/availability` reads live availability from the hvac-pro Google Calendar backend.

The booking form is intentionally configured to work without attachments too, and it replaces the former Calendly booking experience with this in-house app.

## AI Assistant Flow (Consolidated)

The assistant now runs from this same codebase and supports:
- web chat intake on site pages
- lead scoring and HVAC Pro handoff via `/api/assistant/lead`
- live text thread open/list endpoints under `/api/assistant/text-threads`
- Twilio inbound SMS relay at `/api/webhooks/twilio/sms`
- appointment actions via `/api/assistant/appointments/manage` (status, reschedule, cancel)
- assistant metrics via `/api/assistant/metrics`
- hotlist endpoint via `/api/assistant/hotlist`

## Phone Assistant Foundation

The phone answering assistant now has a first-pass foundation that mirrors the website assistant flow:
- Twilio voice webhook at `/api/assistant/phone`
- shared flow/state helpers in `src/lib/phoneAssistantFlow.ts`
- service question handling using the same grounded assistant knowledge
- appointment status / reschedule / cancel intake using the same appointment lookup and update APIs
- callback and live-technician text handoff using the same SMS/lead plumbing as the website flow

Voice setup notes:
- Point your Twilio Voice webhook to `/api/assistant/phone`
- Keep `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER` configured
- Direct SIP sends Twilio call audio to OpenAI while the signed webhook and stateless MCP tools remain in this Vercel project; no separate WebSocket host is required
- Configure the OpenAI project webhook as `https://ashaac.com/api/webhooks/openai/realtime` and subscribe to `realtime.call.incoming`
- To activate Realtime for new calls, configure `OPENAI_PROJECT_ID`, `OPENAI_WEBHOOK_SECRET`, and `OPENAI_REALTIME_MCP_TOKEN`, then set `TWILIO_OPENAI_REALTIME_ENABLED=true`
- Set `TWILIO_OPENAI_REALTIME_ENABLED=false` to return new calls to the existing Twilio Gather flow

Deployment safety:
- `npm run build` automatically runs `assistant:verify-deployment` first
- The build fails if core website chat, Twilio SMS, OpenAI SIP, signed webhook, or phone MCP tool code is missing
- Keep all assistant routes, shared libraries, scripts, and `package-lock.json` committed with website improvements so Git-based Vercel deployments use the same algorithms as local deployments
- For two or more Twilio lines, prefer `TWILIO_PHONE_NUMBERS` as a comma-separated E.164 list
- Keep `LIVE_TECHNICIAN_SMS_TO` configured for Mauricio's routing number
- Keep `MANAGER_APPOINTMENT_UPDATE_URL` and `BOOKING_MANAGER_VIEW_TOKEN` available for appointment actions and manager review
- (Optional but recommended) `ASSISTANT_SITEMAP_URL` for website-grounded ingest (default `https://ashaac.com/sitemap.xml`)
- (Optional) `ASSISTANT_SITEMAP_MAX_PAGES` to cap crawl size per ingest (default `40`)
- (Optional) `ASSISTANT_KB_MAX_AGE_HOURS` freshness window before re-ingest (default `24`)
- `CRON_SECRET` or `ASSISTANT_INGEST_TOKEN` to protect scheduled/manual ingest endpoint

Webhook setup helpers:
- `npm run assistant:webhook:set` updates SMS + Voice webhooks for all configured Twilio lines
- `npm run assistant:webhook:set:local` updates localhost SMS + Voice webhooks for all configured Twilio lines
- `npm run assistant:webhook:set:sms` updates only SMS webhook
- `npm run assistant:webhook:set:voice` updates only Voice webhook
- `npm run assistant:webhook:dryrun` prints intended updates without modifying Twilio

## Website-Grounded AI Knowledge (RAG)

The assistant now supports website-grounded retrieval with source citations:
- Ingests pages from sitemap on a schedule
- Chunks page content and creates embeddings
- Retrieves top matching snippets for each user question
- Returns citation trails used by the answer

Routes:
- `POST /api/assistant/knowledge/ingest` (also supports `GET`)
- `GET /api/assistant/knowledge/status`

Helper scripts:
- `npm run assistant:kb:ingest`
- `npm run assistant:kb:status`

Scheduling:
- `vercel.json` includes a daily cron job to call `/api/assistant/knowledge/ingest?source=cron`

## Daily Parity Logging

Use this lightweight endpoint to record pass/fail outcomes for the same daily checks:
- Normal question flow
- Press 0 direct ring
- Emergency Leandro/Mauricio transfer path
- Inbound SMS test on Twilio number 1
- Inbound SMS test on Twilio number 2

Routes:
- `POST /api/assistant/parity/daily`
- `GET /api/assistant/parity/daily?limit=14`
- `GET /api/assistant/parity/confidence?days=7`

Scripts:
- `npm run assistant:parity:daily`
- `npm run assistant:parity:summary`
- `npm run assistant:parity:confidence`

## Spam Controls

The phone assistant now supports persistent spam controls and a suspicious-call review log.

Routes:
- `GET /api/assistant/spam/rules`
- `POST /api/assistant/spam/rules`
- `DELETE /api/assistant/spam/rules?id=...`
- `GET /api/assistant/spam/reviews?limit=50`

Scripts:
- `npm run assistant:spam:rules`
- `npm run assistant:spam:reviews`

Manager operations page:
- `/manager/assistant` (token-protected through `BOOKING_MANAGER_VIEW_TOKEN`)

Detailed cutover/fallback instructions are in `ASSISTANT_CONSOLIDATION_RUNBOOK.md`.

## Production Notes

- Deployed site: [https://ashaac.com](https://ashaac.com)
- Booking page: [https://ashaac.com/book](https://ashaac.com/book)
- Search Console sitemap: [https://ashaac.com/sitemap.xml](https://ashaac.com/sitemap.xml)

## Development Notes

- The app uses Next.js App Router.
- The booking form lives under `src/components/booking/`.
- API routes live under `src/app/api/book/`.
- Google tracking helpers live under `src/lib/analytics.ts`.

## Deployment

Deploy to Vercel with:

```bash
npx vercel --prod
```

If you need to refresh local Vercel values into the backup copy:

```bash
npx vercel env pull .env.vercel --yes
```

