# Vercel Deploy Checklist

Use this checklist before promoting to production.

## 1) Environment variables

Set in Vercel Project Settings:

- `NEXT_PUBLIC_SITE_URL` = production canonical URL (for example `https://ashaac.com`)
- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` = Google Search Console token (if used)
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` = GA4 measurement ID (optional but recommended)

## 2) Pre-deploy validation

Run locally:

- `npm run type-check`
- `npm run lint`
- `npm run build`

## 3) SEO verification

- Confirm `robots.txt` resolves and points to `/sitemap.xml`
- Confirm sitemap includes key routes and service-area city routes
- Confirm canonical URLs use production domain after deploy
- Confirm JSON-LD scripts render on homepage and major pages

## 4) Performance verification

- Confirm optimized image formats are served (`avif/webp` where supported)
- Confirm cache headers on `/_next/static/*` and `/images/*`
- Confirm no layout shift in hero/header across mobile/tablet/desktop

## 5) Responsive smoke test (Responsively)

Check at least:

- Mobile portrait (iPhone 12 Pro)
- Mobile landscape (Galaxy landscape class)
- Tablet portrait (iPad class)
- Tablet landscape (iPad class)
- Desktop (1280+)

## 6) Deploy

- Push branch to GitHub
- Open PR and complete `.github/PULL_REQUEST_TEMPLATE.md`
- Merge after checks pass
- Confirm Vercel production deployment succeeds

## 7) Post-deploy checks

- Open homepage, services, contact, reviews, service-areas pages
- Test core CTA links (`tel:`, contact form path, estimate links)
- Submit URL in Google Search Console (homepage + sitemap)
- Monitor Vercel logs and web vitals for first 24 hours

For strict release validation and sign-off, use `POST_DEPLOY_VALIDATION_CHECKLIST.md`.
