# Assistant Consolidation Runbook

## Goal

Run chat, phone, SMS handoff, appointment actions, and reporting from `ashaac-nextjs` only.

## Current state

- Primary app: `my-hvac-website/ashaac-nextjs`
- Fallback app: `hvac-lead-generator` (standby only)

## Production routes in consolidated app

- Lead intake: `/api/assistant/lead`
- Hotlist: `/api/assistant/hotlist`
- Text threads list: `/api/assistant/text-threads`
- Open text thread: `/api/assistant/text-threads/open`
- Twilio inbound SMS webhook: `/api/webhooks/twilio/sms`
- Twilio inbound Voice webhook: `/api/assistant/phone`
- Appointment actions: `/api/assistant/appointments/manage`
- Assistant metrics API: `/api/assistant/metrics`
- Internal dashboard API: `/api/manager/assistant-dashboard`
- Internal dashboard UI: `/manager/assistant`

## Env vars required

- `BOOKING_MANAGER_VIEW_TOKEN`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER` (or `TWILIO_FROM_SMS` + `TWILIO_FROM_CALL`)
- `TWILIO_PHONE_NUMBERS` (recommended for 2+ Twilio lines, comma-separated E.164)
- `LIVE_TECHNICIAN_SMS_TO` (or `P1_DISPATCH_SMS_TO`)
- `LIVE_TECHNICIAN_CALL_TO` (optional)
- `HVAC_PRO_BOOKING_ENDPOINT`
- `HVAC_PRO_FOLLOWUP_ENDPOINT`
- `HVAC_PRO_API_KEY`
- `HVAC_PRO_AUTH_HEADER` (optional)
- `MANAGER_APPOINTMENT_UPDATE_URL` (or `HVAC_PRO_APPOINTMENT_UPDATE_ENDPOINT`)
- `MANAGER_API_KEY`
- `MANAGER_AUTH_HEADER` (optional)

## Cutover steps

1. Point Twilio inbound webhooks to consolidated app for all configured lines:
   - SMS: `https://ashaac.com/api/webhooks/twilio/sms`
   - Voice: `https://ashaac.com/api/assistant/phone`
   - command: `npm run assistant:webhook:set`
   - dry-run: `npm run assistant:webhook:dryrun`
2. Keep old `hvac-lead-generator` running in standby for fallback only.
3. Run both for 3-7 days and compare:
   - lead counts
   - thread opens
   - successful technician replies
   - appointment action success rates
   - command: `npm run assistant:parity`
   - reports are saved under `data/parity-reports/`
4. Confirm manager dashboard metrics at `/manager/assistant` with token.
5. If parity is stable, freeze old app writes and archive old app.

## Rollback plan

1. Repoint Twilio webhook to old app endpoint.
2. Keep website assistant UI unchanged while backend routes are switched.
3. Re-enable old automation cycle scripts until issue is fixed.

## Parity checklist

- [ ] Lead intake in consolidated app receives all assistant leads.
- [ ] P1/P2 hotlist matches expected urgency ranking.
- [ ] Live text thread opens successfully from assistant UI.
- [ ] Twilio inbound messages relay customer <-> technician.
- [ ] Appointment status/reschedule/cancel actions return success.
- [ ] Manager dashboard updates with new leads and threads.
