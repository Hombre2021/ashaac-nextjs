## Hotfix Summary

- Issue fixed:
- User impact:
- Root cause:
- Why this is safe as a hotfix:

## Scope guardrails

- [ ] Change is minimal and targeted (no broad refactor)
- [ ] No unrelated files/areas modified
- [ ] No duplicate media-query blocks/selectors introduced

## Responsive safety (if UI touched)

- [ ] Target family was identified first
- [ ] No cross-family regression introduced
- [ ] Hamburger remains phone-family only (if header touched)
- [ ] White-stripe desktop menu remains intact for non-phone families (if header touched)

## Required checks

- [ ] npm run type-check
- [ ] npm run lint
- [ ] Quick Responsively smoke check on affected family/device

## Deployment notes

- Rollout plan:
- Rollback plan:
- Monitoring/checkpoint after deploy:

## Reference

- Full checklist: .github/PULL_REQUEST_TEMPLATE.md
- Responsive standards: RESPONSIVE_FAMILY_RULES.md
