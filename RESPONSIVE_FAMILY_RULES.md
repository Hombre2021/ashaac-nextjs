# Responsive Family Rules

This project now follows device-family breakpoints from a single source:

- `src/constants/responsive.ts`

## Device families

- `mobile-portrait`: portrait and `<= 479px`
- `mobile-landscape`: landscape phone-like viewport and `<= 767px`
- `tablet-portrait`: portrait `480px - 1023px`
- `tablet-landscape`: landscape `768px - 1199px`
- `desktop`: `>= 1200px` (or larger viewports outside tablet ranges)

## Single-source update points

1. Update breakpoints in `src/constants/responsive.ts`
2. JS behavior automatically follows via:
   - `src/hooks/useResponsiveFlags.ts`
   - `src/components/HomepageResponsive.tsx`
3. CSS family ranges should be edited by family blocks (avoid exact device overrides unless required)

## Header/menu behavior

- Mobile hamburger menu is controlled by `HomepageHeader` using phone-family logic from `useResponsiveFlags`.
- Non-phone families render desktop header menu on the white stripe.

## Safe rule for future edits

- Prefer family range media queries over exact `width + height` queries.
- If a device-specific override is required, keep it minimal and isolate it after the family block.
- Do not duplicate the same media query selector in multiple places; merge into one block per file when possible.

## Media query labels in CSS

Main responsive CSS files now use explicit tags in section headers:

- `[FAMILY: MOBILE-PORTRAIT]`
- `[FAMILY: MOBILE-LANDSCAPE]`
- `[FAMILY: TABLET-LANDSCAPE]`
- `[FAMILY: DESKTOP]`
- `[DEVICE EXCEPTION]`

Use these tags to choose the correct section before editing. If a change is meant for a full family, apply it only under the matching family tag. If it is for one specific viewport, keep it under `[DEVICE EXCEPTION]` and avoid copying the same declaration into family sections.

## Responsive maintenance checklist

Use this checklist for every responsive change:

1. Identify target family first (`MOBILE-PORTRAIT`, `MOBILE-LANDSCAPE`, `TABLET-LANDSCAPE`, or `DESKTOP`).
2. Update shared breakpoints only in `src/constants/responsive.ts`.
3. Prefer family blocks in CSS before adding any device exception.
4. If a device exception is needed, keep it minimal and place it under `[DEVICE EXCEPTION]`.
5. Search file for duplicate selectors/media queries before adding new rules.
6. Keep hamburger behavior phone-family only; desktop/tablet should keep white-stripe menu.
7. Run verification:
   - `npm run type-check`
   - `npm run lint`
8. In Responsively, verify at least one viewport per family plus one real-device exception.

### Minimum QA set

- Mobile portrait: iPhone 12 Pro (390x844)
- Mobile landscape: Galaxy S23 landscape-class viewport
- Tablet portrait: iPad class (768x1024)
- Tablet landscape: iPad class (1024x768 or 1180x820)
- Desktop: 1280+ width

### Performance and cleanliness guardrails

- Remove dead selectors when logic/components are removed.
- Merge identical media-query blocks instead of copying declarations.
- Avoid adding global overrides when a family-scoped rule is sufficient.
- Keep structural layout in family rules and visual fine-tuning in minimal exceptions.

## PR workflow references

- Standard PR checklist: `.github/PULL_REQUEST_TEMPLATE.md`
- Hotfix PR checklist: `.github/PULL_REQUEST_TEMPLATE_HOTFIX.md`
