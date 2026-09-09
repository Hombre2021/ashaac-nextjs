## Summary

- What changed:
- Why this change was needed:
- Risk level: Low / Medium / High

## Responsive scope

- [ ] This PR includes responsive/layout changes
- [ ] Target family/families were identified before editing:
  - [ ] MOBILE-PORTRAIT
  - [ ] MOBILE-LANDSCAPE
  - [ ] TABLET-LANDSCAPE
  - [ ] DESKTOP
- [ ] Breakpoint changes (if any) were made only in src/constants/responsive.ts
- [ ] Family rules were used before adding any device exception
- [ ] Device exception rules (if any) are minimal and labeled under [DEVICE EXCEPTION]
- [ ] No duplicate media-query blocks/selectors were introduced

## Header/menu behavior checks

- [ ] Hamburger behavior remains phone-family only
- [ ] White-stripe desktop menu remains active for non-phone families

## Validation

- [ ] npm run type-check
- [ ] npm run lint
- [ ] Verified one viewport per family in Responsively:
  - [ ] Mobile portrait (e.g., iPhone 12 Pro)
  - [ ] Mobile landscape (Galaxy landscape-class viewport)
  - [ ] Tablet portrait (iPad class)
  - [ ] Tablet landscape (iPad class)
  - [ ] Desktop (1280+)

## Visual and structural quality

- [ ] No structural regressions in header/hero/navigation
- [ ] No overlap/clipping introduced for buttons, menus, or badges
- [ ] Change is visually consistent with existing design

## Notes for reviewers

- Key files touched:
- Any known follow-up work:

## Reference

- See RESPONSIVE_FAMILY_RULES.md and README.md (Responsive PR Checklist)
