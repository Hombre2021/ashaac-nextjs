# Calendly Replacement Plan

## Current Calendly Features In Use

The current site uses a narrow slice of Calendly functionality. These are the features that must be preserved in the internal replacement:

1. A single estimate-oriented booking destination based on the Calendly `ashaacutah/30min` link.
2. Entry points from multiple CTA surfaces:
   - homepage desktop header estimate button
   - homepage mobile navigation estimate link
   - homepage red estimate CTA section
   - contact page booking button
3. Outbound click analytics through the `click_calendly` event.
4. Attribution passthrough at click time for:
   - `utm_source`
   - `utm_medium`
   - `utm_campaign`
   - `utm_term`
   - `utm_content`
   - `gclid`
   - `gbraid`
   - `wbraid`
   - `fbclid`
   - `msclkid`
5. `source_page` capture so the originating page is preserved.
6. External-link behavior that currently opens in a new tab.

## Features To Integrate In The In-House Booking Module

1. Internal booking route at `/book`.
2. Multi-entry CTA support so the existing estimate buttons can be switched over without changing user intent.
3. Source and campaign attribution capture on the booking form.
4. Service-type selection tailored to HVAC requests rather than a generic meeting scheduler.
5. Service-area selection based on the local cities already targeted in the site.
6. Preferred date and time-window selection backed by an availability API.
7. Customer contact and service-address intake.
8. Submission API contract ready for CRM, email, or SMS wiring.
9. Replacement analytics event path for successful booking requests.
10. Professional, on-brand UI that keeps the user on ashaac.com.

## Initial Route / Component / API Structure

### Route

- `src/app/book/page.tsx`

### Components

- `src/components/booking/BookingExperience.tsx`
- `src/components/booking/BookingExperience.module.css`

### Shared Booking Logic

- `src/lib/booking.ts`

### API Endpoints

- `src/app/api/book/availability/route.ts`
- `src/app/api/book/route.ts`

## What This First Pass Does

1. Creates the internal booking page and keeps the experience inside the site.
2. Preserves the current Calendly attribution requirements in the booking payload.
3. Validates booking requests with a typed schema.
4. Provides prototype availability so the front end can be built before back-office rules are connected.
5. Switches current Calendly CTA links to `/book` for header, homepage estimate CTA, and contact booking CTA.
6. Adds optional notification delivery in `src/app/api/book/route.ts` via env-configured webhook, email (Resend), and SMS (Twilio).

## Notification Env Variables (Optional)

1. `BOOKING_WEBHOOK_URL` for posting booking payloads to an operations endpoint.
2. `RESEND_API_KEY` and `BOOKING_NOTIFICATION_EMAIL_TO` for email alerts.
3. `BOOKING_NOTIFICATION_EMAIL_FROM` to override the default sender (`booking@ashaac.com`).
4. `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`, and either `BOOKING_NOTIFICATION_SMS_TO` or `TWILIO_TO_NUMBER` for SMS alerts.

## Manager System Integration Env Variables (Optional)

1. `MANAGER_BOOKING_URL` — Your manager system's booking intake endpoint (e.g., `https://manager.ashaac.com/api/bookings`).
2. `MANAGER_API_KEY` — API key for authentication.
3. `MANAGER_AUTH_HEADER` — Custom header name for auth (defaults to `X-API-Key`). Use `Authorization` for Bearer tokens.

**Manager Integration Details:**
- Booking ID generated on our end is sent as `bookingId` in the request payload.
- Manager system can return its own ID in response fields: `id`, `leadId`, or `requestId` — whichever is present is captured and returned to the client.
- Payload structure includes all booking fields plus attribution data (utm params, gclid, etc.).
- Submission uses 2 retry attempts with exponential backoff if manager temporarily fails.
- Full booking request is retained locally even if manager submission fails.

## Next Build Steps

1. Persist requests to the real lead system or manager app.
2. Replace prototype availability with office-managed scheduling rules.
3. Add confirmation and reminder workflows after office acceptance.
4. Add reschedule and cancel flows if the business needs self-service changes.
