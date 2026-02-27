All pages built. I am in the last details and completing all links. Not quite ready for migration but close. Added Google and BBB verification images, updated Hero man with All Solutions HVAC uniform, increased titles and subtitles size and theme. Once all visuals and links are done, then I will focus on SEO, back links and maintaining whatever status I have to make it better, this website will be faster, better, and more efficient.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Default local startup workflow: run `powershell -ExecutionPolicy Bypass -File ..\dev.ps1` from the workspace root (`my-hvac-website`) for the most stable dev environment on Windows.

If Copilot or local build state starts behaving unexpectedly, use the recovery guide in `COPILOT_HEALTH_RUNBOOK.md` and run `npm run copilot:status` first.

For local SEO publishing and outreach operations, use the off-page execution toolkit in `seo-offpage/README.md`.

For mobile rendering QA with Responsively App:

1. Start dev server: `npm run dev`
2. In a second terminal, launch Responsively on localhost: `npm run dev:responsively`
3. Use device presets in Responsively to validate alignment and spacing fixes before commit.

## Responsive PR Checklist

Before opening a PR with responsive/layout changes:

1. Confirm target device family first (`MOBILE-PORTRAIT`, `MOBILE-LANDSCAPE`, `TABLET-LANDSCAPE`, `DESKTOP`).
2. Update breakpoints only in `src/constants/responsive.ts` (single source of truth).
3. Prefer family media-query blocks over exact device-size exceptions.
4. If a device exception is required, keep it minimal and place it under `[DEVICE EXCEPTION]` in CSS.
5. Check for duplicate selectors/media-query blocks before adding rules.
6. Ensure mobile hamburger behavior stays phone-family only; tablet/desktop keep white-stripe menu.
7. Run validation:
	- `npm run type-check`
	- `npm run lint`
8. Verify in Responsively with at least one viewport per family:
	- iPhone 12 Pro (mobile portrait)
	- Galaxy landscape-class viewport (mobile landscape)
	- iPad class portrait (tablet portrait)
	- iPad class landscape (tablet landscape)
	- 1280+ desktop viewport

Detailed rules live in `RESPONSIVE_FAMILY_RULES.md`.

## PR Template Usage

- Use `.github/PULL_REQUEST_TEMPLATE.md` for normal feature, refactor, responsive, and content changes.
- Use `.github/PULL_REQUEST_TEMPLATE_HOTFIX.md` only for urgent production fixes that must stay minimal and targeted.
- If a hotfix grows beyond a narrow fix, switch back to the standard template.

For production release readiness, follow `VERCEL_DEPLOY_CHECKLIST.md`.

## Post-Deploy Verification (Automation)

Run the automated production validation snapshot after each deploy:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\post-deploy-verify.ps1
```

Optional custom target:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\post-deploy-verify.ps1 -BaseUrl "https://your-domain.com"
```

This script checks route health, `robots.txt`, `sitemap.xml`, stale removed routes, and analytics loader presence. It also prints required manual checks for GSC, GTM, GA4, and CWV.

## Analytics Setup (GA4 + GTM)

Set these environment variables in Vercel Project Settings -> Environment Variables:

- `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX`
- `NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX`

Notes:

- If both GA4 and GTM are set, direct GA4 pageview is disabled in code to avoid duplicate pageviews.
- Conversion events are tracked globally for:
	- `call_click` (tel links)
	- `book_estimate_click` (Calendly links)
	- `financing_click` (`/financing` links)
	- `form_submit` (form submissions)

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

