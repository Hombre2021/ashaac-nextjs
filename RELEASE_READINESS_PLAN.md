# Release Readiness Plan

## Goal

Finish and review the current work as four coherent units. Do not deploy by treating the entire dirty worktree as one feature.

Existing changes must not be discarded. Use explicit file staging when commits are requested.

## Business contact routing

- Public business email target: `contact@ashaac.com`
- Google account and Calendar identity: retain `ashaacutah@gmail.com`
- Temporary email fallback during migration: `ashaacutah@gmail.com`
- Business SMS alert destination: `+18017553040`
- Twilio sender: use the configured Twilio messaging number; do not assume the alert destination is also the sender

Email migration gates:
1. Create `contact@ashaac.com` as a Microsoft 365 shared mailbox or licensed mailbox.
2. Grant the operating user access and verify inbound and outbound delivery.
3. Publish and enable Microsoft 365 DKIM selectors for `ashaac.com`.
4. Route `contact@ashaac.com` into the monitored inbox and retain Gmail as a temporary fallback.
5. Set `BOOKING_NOTIFICATION_EMAIL_TO=contact@ashaac.com` only after a real delivery test passes.
6. After stable delivery, update public website email references from Gmail to the domain address.

## Unit 1 - Shared booking and lead foundation

Purpose: provide stable, idempotent CRM, callback, availability, and appointment contracts used by both web and phone flows.

Files:
- `src/app/api/assistant/lead/route.ts`
- `src/app/api/book/availability/route.ts`
- `src/app/api/book/health/route.ts`
- `src/app/api/book/route.ts`
- `src/lib/appointmentHistory.ts`
- `src/lib/assistantStore.ts`
- `src/lib/booking.ts`
- `src/lib/twilio.ts`
- `src/lib/analytics.ts`

Acceptance gates:
1. Callback submissions are idempotent.
2. Callback submissions notify the business through at least one configured channel.
3. Booking submissions confirm both customer and appointment linkage before reporting success.
4. Regular and after-hours availability rules return valid two-hour windows.
5. `npm run lint` and `npm run build` pass.

## Unit 2 - Phone assistant runtime

Purpose: complete Ash's direct SIP call control, booking, callback, owner-message, spam, and closing behavior.

Files:
- `src/app/api/assistant/phone/mcp/route.ts`
- `src/app/api/assistant/phone/route.ts`
- `src/app/api/webhooks/openai/realtime/route.ts`
- `src/app/api/webhooks/openai/realtime/control/route.ts`
- `src/lib/openAiRealtimePhone.ts`
- `src/lib/phoneAssistantFlow.ts`
- `src/lib/phoneBlockedNumbers.ts`
- `src/lib/phoneBookingCloseState.ts`
- `src/lib/phoneBookingVerification.ts`
- `src/temporary/phone-booking-verification/config.ts`
- `scripts/verify-assistant-deployment.mjs`
- `scripts/verify-phone-script-parity.mjs`
- `ASH_PHONE_CALL_SCRIPT.md`
- `package.json`

Current policy contract:
- no SMS booking verification
- no email collection
- no electronic address lookup
- no live caller transfer
- owner/technician contact uses a saved message or callback
- regular bookings require confirmed name, phone, visit reason, address, date, and time
- explicit test mode performs no operational booking writes

Acceptance gates:
1. `npm run assistant:verify-deployment` passes.
2. `npm run assistant:verify-script` passes.
3. One explicit test-mode call completes without creating a customer, appointment, Calendar event, or dispatch.
4. One callback test records the request once and sends the expected owner notification.
5. One booking test reaches the final pre-write validation path with correct date, time, phone, reason, and address.
6. One spam test confirms an authenticated test number can be reviewed without blocking an uncertain caller.

Do not enable Realtime routing for new production calls until all six gates pass.

## Unit 3 - Website conversion UI

Purpose: increase qualified callbacks and calls without paid advertising.

Files:
- `src/components/booking/BookingExperience.tsx`
- `src/components/booking/BookingExperience.module.css`
- `src/components/MobileCallAction.tsx`
- `src/components/MobileCallAction.module.css`
- `src/components/WebsiteAIAssistant.module.css`
- `src/components/HomepageFooter.tsx`
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/components/ContactButtons.tsx`
- `src/components/HomepageEstimateButton.tsx`
- booking-link portions of `src/components/HomepageHeader.tsx`

Acceptance gates:
1. `/book` displays only first name, phone, and problem.
2. Submission routes to callback intake and does not create a fake appointment.
3. Mobile call action uses `tel:8017553040` and does not overlap Ash.
4. Only 801-755-3040 is shown as the canonical phone number.
5. Desktop and 390x844 mobile browser checks pass.
6. Build passes with the Unit 1 callback contract.

## Unit 4 - Tracking, SEO, and visual changes

Purpose: finish performance, tracking, responsive, content, and new-page work independently from phone and callback behavior.

Files include:
- `src/components/DeferredTrackingScripts.tsx`
- `src/components/GoogleTracking.tsx`
- `src/components/HomepageDualFeature.tsx`
- `src/components/HomepageHeader.module.css`
- responsive/image portions of `src/components/HomepageHeader.tsx`
- `src/components/HomepageHero.module.css`
- `src/components/HomepageHero.tsx`
- `src/components/HomepageResponsive.tsx`
- `src/components/HomepageSection.tsx`
- `src/components/HomepageTestimonials.tsx`
- `src/app/diy-help-center/page.tsx`
- `CALENDLY_REPLACEMENT_PLAN.md`

Acceptance gates:
1. Tracking uses live preview evidence; configured IDs alone do not count as proof.
2. Homepage screenshots pass at supported desktop and mobile viewports.
3. No visual regression or image-quality reduction is accepted for a small score gain.
4. Sitemap, canonical, and page metadata checks pass.
5. Production build passes.

## Integration order

1. Stabilize Unit 1 contracts.
2. Complete Unit 2 test-mode and callback tests.
3. Rebase Unit 3 behavior on the verified Unit 1 callback contract.
4. Validate Unit 4 separately.
5. Run the combined production build and responsive smoke tests.
6. Create a preview deployment before production.
7. Verify callback notifications and phone routing in preview-safe modes.
8. Deploy production only after an explicit go decision.

## Git handling

When commits are requested, stage only the files in one unit at a time with explicit paths. Do not use `git add .` while unrelated units remain mixed. Do not reset or discard the current worktree.