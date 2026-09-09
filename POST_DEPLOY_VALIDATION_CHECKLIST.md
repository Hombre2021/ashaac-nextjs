# Post-Deploy Validation Checklist (Pass/Fail)

Use this immediately after each production deploy.

## Release metadata

- Date/time (UTC):
- Release owner:
- Production URL:
- Vercel deployment ID:
- Commit SHA:

## Severity policy

- **Blocker:** Broken lead flow, major page failure, production runtime errors, or missing conversion tracking on core CTAs.
- **Major:** Non-blocking but high-impact UX/SEO issue that can affect lead quality, crawlability, or trust.
- **Minor:** Cosmetic/content issue that does not affect core lead generation or indexing.

Release decision:

- [ ] **GO** (all Blockers resolved; no unresolved Major without explicit approval)
- [ ] **NO-GO** (any unresolved Blocker)

## A) Smoke UX (Desktop + Mobile)

Mark each row **PASS** or **FAIL** and include evidence.

| Route | Desktop | Mobile | Notes/Evidence |
| --- | --- | --- | --- |
| `/` (Home) | ☐ PASS ☐ FAIL | ☐ PASS ☐ FAIL | |
| `/services` | ☐ PASS ☐ FAIL | ☐ PASS ☐ FAIL | |
| `/contact` | ☐ PASS ☐ FAIL | ☐ PASS ☐ FAIL | |
| `/diy-help-center` | ☐ PASS ☐ FAIL | ☐ PASS ☐ FAIL | |
| `/financing` | ☐ PASS ☐ FAIL | ☐ PASS ☐ FAIL | |
| `/reviews` | ☐ PASS ☐ FAIL | ☐ PASS ☐ FAIL | |
| Service coverage route (`/valley`) | ☐ PASS ☐ FAIL | ☐ PASS ☐ FAIL | |

Required checks per route:

- [ ] No broken layout/overlap
- [ ] Main CTA visible and clickable
- [ ] Hero and key media load correctly
- [ ] No obvious console/runtime errors

## B) Lead Flow Validation

| Lead path | Result | Notes/Evidence |
| --- | --- | --- |
| `tel:` click-to-call link | ☐ PASS ☐ FAIL | |
| Contact form submit path | ☐ PASS ☐ FAIL | |
| DIY question form (`mailto`) opens client + prefilled subject/body | ☐ PASS ☐ FAIL | |
| DIY live-help form (`mailto`) opens client + prefilled subject/body | ☐ PASS ☐ FAIL | |

Gate:

- [ ] No broken or misleading lead path in production

## C) SEO Technical Validation

| Check | Result | Notes/Evidence |
| --- | --- | --- |
| `https://ashaac.com/robots.txt` resolves and allows expected crawl paths | ☐ PASS ☐ FAIL | |
| `https://ashaac.com/sitemap.xml` resolves and includes expected routes | ☐ PASS ☐ FAIL | |
| Canonical tags point to production domain | ☐ PASS ☐ FAIL | |
| Metadata/title/description render correctly on key pages | ☐ PASS ☐ FAIL | |
| JSON-LD/structured data validates (Rich Results test) | ☐ PASS ☐ FAIL | |
| URL Inspection submitted for homepage + sitemap | ☐ PASS ☐ FAIL | |

Gate:

- [ ] No critical crawl/indexing issues

## D) Analytics and Conversion Tracking

Validate in GTM Preview + GA4 DebugView.

| Event/Signal | Result | Notes/Evidence |
| --- | --- | --- |
| Page view on key routes | ☐ PASS ☐ FAIL | |
| Core CTA click events (call/contact/estimate/financing) | ☐ PASS ☐ FAIL | |
| Form submission or conversion events fire | ☐ PASS ☐ FAIL | |
| No duplicate firing on single action | ☐ PASS ☐ FAIL | |

Gate:

- [ ] Conversion-critical events are firing correctly

## E) Platform Health (Vercel)

| Check | Result | Notes/Evidence |
| --- | --- | --- |
| Deployment status is Ready (Production) | ☐ PASS ☐ FAIL | |
| Build logs contain no unresolved errors | ☐ PASS ☐ FAIL | |
| Runtime logs show no new 5xx bursts | ☐ PASS ☐ FAIL | |
| Domain + SSL healthy | ☐ PASS ☐ FAIL | |

Gate:

- [ ] No production health blockers

## F) Final Release Decision

- [ ] **GO** to keep release live
- [ ] **NO-GO** (start hotfix)

If **NO-GO**:

- Hotfix branch:
- Owner:
- ETA:
- Re-test scope:

## G) Sign-off

- QA/Validator:
- Engineering:
- Marketing/SEO (if applicable):
- Final timestamp:
