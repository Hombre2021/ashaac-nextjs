# Post-Deploy Validation Run — 2026-02-26

Validation target: production site `https://ashaac.com`.

## Release metadata

- Date/time (UTC): 2026-02-27 04:01 UTC
- Release owner: hombre2021
- Production URL: https://ashaac.com
- Vercel deployment ID: (add from Vercel dashboard)
- Commit SHA: (add deployed SHA)
- Validation mode: automated HTTP/HTML checks completed by Copilot; manual UX/analytics/platform-console checks still required

## Severity policy

- **Blocker:** Broken lead flow, major page failure, production runtime errors, or missing conversion tracking on core CTAs.
- **Major:** Non-blocking but high-impact UX/SEO issue that can affect lead quality, crawlability, or trust.
- **Minor:** Cosmetic/content issue that does not affect core lead generation or indexing.

Release decision:

- [ ] **GO** (all Blockers resolved; no unresolved Major without explicit approval)
- [x] **NO-GO** (any unresolved Blocker)

Reason: production still serves `/service-areas` routes and includes them in `sitemap.xml`, which does not match the latest approved code changes that removed those pages/links.

## A) Smoke UX (Desktop + Mobile)

| Route | Desktop | Mobile | Notes/Evidence |
| --- | --- | --- | --- |
| `/` (Home) | ☑ PASS ☐ FAIL | ☐ PASS ☐ FAIL | Auto: HTTP 200 |
| `/services` | ☑ PASS ☐ FAIL | ☐ PASS ☐ FAIL | Auto: HTTP 200; title + description + canonical present |
| `/contact` | ☑ PASS ☐ FAIL | ☐ PASS ☐ FAIL | Auto: HTTP 200 |
| `/diy-help-center` | ☑ PASS ☐ FAIL | ☐ PASS ☐ FAIL | Auto: HTTP 200 |
| `/financing` | ☑ PASS ☐ FAIL | ☐ PASS ☐ FAIL | Auto: HTTP 200 |
| `/reviews` | ☑ PASS ☐ FAIL | ☐ PASS ☐ FAIL | Auto: HTTP 200 |
| Service coverage route (`/valley`) | ☑ PASS ☐ FAIL | ☐ PASS ☐ FAIL | Auto: `/valley` HTTP 200 |

Required checks per route:

- [ ] No broken layout/overlap (manual)
- [ ] Main CTA visible and clickable (manual)
- [ ] Hero and key media load correctly (manual)
- [ ] No obvious console/runtime errors (manual)

## B) Lead Flow Validation

| Lead path | Result | Notes/Evidence |
| --- | --- | --- |
| `tel:` click-to-call link | ☑ PASS ☐ FAIL | Auto: `tel:` link detected in production `/contact` HTML |
| Contact form submit path | ☐ PASS ☑ FAIL | Auto: no `<form>` tag found in production `/contact` HTML |
| DIY question form (`mailto`) opens client + prefilled subject/body | ☐ PASS ☐ FAIL | Manual check required |
| DIY live-help form (`mailto`) opens client + prefilled subject/body | ☐ PASS ☐ FAIL | Manual check required |

Gate:

- [ ] No broken or misleading lead path in production

## C) SEO Technical Validation

| Check | Result | Notes/Evidence |
| --- | --- | --- |
| `https://ashaac.com/robots.txt` resolves and allows expected crawl paths | ☑ PASS ☐ FAIL | HTTP 200; includes `Allow: /`, `Disallow: /api/`, and sitemap pointer |
| `https://ashaac.com/sitemap.xml` resolves and includes expected routes | ☐ PASS ☑ FAIL | HTTP 200 but still contains `/service-areas` and city routes that were removed in current codebase |
| Canonical tags point to production domain | ☑ PASS ☐ FAIL | Auto verified on `/services` and `/valley` |
| Metadata/title/description render correctly on key pages | ☑ PASS ☐ FAIL | Auto extracted on `/services` and `/valley` |
| JSON-LD/structured data validates (Rich Results test) | ☐ PASS ☐ FAIL | Manual Rich Results test required |
| URL Inspection submitted for homepage + sitemap | ☐ PASS ☐ FAIL | Manual Search Console action required |

Gate:

- [ ] No critical crawl/indexing issues

## D) Analytics and Conversion Tracking

Validate in GTM Preview + GA4 DebugView.

| Event/Signal | Result | Notes/Evidence |
| --- | --- | --- |
| Page view on key routes | ☐ PASS ☐ FAIL | Manual GTM Preview + GA4 DebugView required |
| Core CTA click events (call/contact/estimate/financing) | ☐ PASS ☐ FAIL | Manual GTM Preview + GA4 DebugView required |
| Form submission or conversion events fire | ☐ PASS ☐ FAIL | Manual GTM Preview + GA4 DebugView required |
| No duplicate firing on single action | ☐ PASS ☐ FAIL | Manual GTM Preview + GA4 DebugView required |

Gate:

- [ ] Conversion-critical events are firing correctly

## E) Platform Health (Vercel)

| Check | Result | Notes/Evidence |
| --- | --- | --- |
| Deployment status is Ready (Production) | ☐ PASS ☐ FAIL | Manual Vercel dashboard confirmation required |
| Build logs contain no unresolved errors | ☐ PASS ☐ FAIL | Manual Vercel Logs review required |
| Runtime logs show no new 5xx bursts | ☐ PASS ☐ FAIL | Manual Vercel runtime monitoring required |
| Domain + SSL healthy | ☑ PASS ☐ FAIL | Production responds over HTTPS with HTTP 200 |

Gate:

- [ ] No production health blockers

## F) Final Release Decision

- [ ] **GO** to keep release live
- [x] **NO-GO** (start hotfix)

If **NO-GO**:

- Hotfix branch: (set by engineering)
- Owner: (assign)
- ETA: (set)
- Re-test scope: `/`, `/services`, `/valley`, `robots.txt`, `sitemap.xml`, and removed route checks (`/service-areas*` should no longer resolve)

## H) Recheck Snapshot (latest)

- Recheck time (UTC): 2026-02-27 04:03
- `https://ashaac.com/` => HTTP 200
- `https://ashaac.com/services` => HTTP 200
- `https://ashaac.com/valley` => HTTP 200
- `https://ashaac.com/robots.txt` => HTTP 200
- `https://ashaac.com/sitemap.xml` => HTTP 200
- `https://ashaac.com/service-areas` => HTTP 200 (**unexpected; should be removed**)
- `https://ashaac.com/service-areas/west-jordan` => HTTP 200 (**unexpected; should be removed**)
- `sitemap.xml` still contains multiple `/service-areas/*` URLs
- Script run: `scripts/post-deploy-verify.ps1` at 2026-02-27 04:12 UTC confirms same NO-GO state

Conclusion: automated recheck remains **NO-GO** until production redeploy serves the current codebase and sitemap no longer lists removed routes.

## I) Advanced SEO/Visibility & Tracking Audit

### 1) Google indexing/ranking behavior (general search visibility)

- Status: **Partial (automated proxy checks only)**
- Verified:
	- Production routes are crawlable over HTTPS and return HTTP 200 on key pages.
	- `robots.txt` allows crawl and points to sitemap.
	- Canonical/title/description are present on sampled pages.
- Blocker affecting visibility quality:
	- Live sitemap and live URLs still include deprecated `/service-areas*` pages.
- Not fully verifiable from this environment:
	- Actual ranking movement and query-level performance (requires Search Console data and time series).

### 2) Search Console coverage, URL Inspection, sitemap recrawl status

- Status: **Blocked (requires authenticated GSC property access)**
- Required manual actions in GSC:
	- Inspect and request indexing for `/`, `/services`, `/valley`.
	- Re-submit `https://ashaac.com/sitemap.xml`.
	- Confirm deprecated `/service-areas*` URLs transition to `404/410` or are removed from sitemap after redeploy.
	- Validate Coverage report shows no new indexing errors after recrawl.

### 3) Core Web Vitals/PageSpeed and real-user performance trends

- Status: **Blocked in this run (PageSpeed API quota exhaustion in shared environment)**
- Evidence:
	- Public PSI API returned `429 RESOURCE_EXHAUSTED` (`rateLimitExceeded`) for all tested routes.
- Required manual actions:
	- Run PageSpeed Insights manually for `/`, `/services`, `/contact` (mobile + desktop).
	- Review CrUX/Core Web Vitals trend cards in Search Console (28-day real-user data).

### 4) GA4/GTM conversion-event quality and duplication checks

- Status: **Partial (implementation reviewed; runtime property validation pending)**
- Code-level findings:
	- GTM loader present in layout.
	- GA4 `gtag` loader/config also present in layout.
	- Event helper pushes to both `dataLayer` and `gtag`, which can duplicate counts if GTM also forwards same events to GA4.
	- `send_page_view` is disabled when GTM ID exists, reducing one common double-pageview risk.
- Remaining manual validation required:
	- GTM Preview + GA4 DebugView for single-fire verification of `call_click`, `financing_click`, `book_estimate_click`, `form_submit`.
	- Confirm no duplicate conversion events on one click/submit across both GTM and direct GA4 pathways.

## G) Sign-off

- QA/Validator: Copilot (automated checks)
- Engineering: pending
- Marketing/SEO (if applicable): pending
- Final timestamp: 2026-02-27 04:03 UTC
