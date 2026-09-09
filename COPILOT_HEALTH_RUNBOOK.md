# Copilot Health Runbook (Windows + Next.js)

Use this whenever Copilot starts failing, especially with `413 failed to parse request`.

## Daily prevention

1. Keep `.next`, `.vercel`, and logs out of commits.
2. Do not interrupt `npm install`.
3. Before pushing, run:
   - `npm install`
   - `npm run build`

## One-command status check

```powershell
npm run copilot:status
```

## Recovery levels

### Level 1: Quick clean (safe)

Use when dev/build failed once and behavior feels off.

```powershell
npm run copilot:quick-clean
```

Removes:
- `.next`
- `.vercel`

### Level 2: Deep clean

Use when installs/build cache feel corrupted.

```powershell
npm run copilot:deep-clean
```

Removes:
- `.next`
- `.vercel`
- `node_modules`
- `package-lock.json`

Then reinstall:

```powershell
npm install
```

### Level 3: Full reset including VS Code workspace storage

Use when Copilot keeps failing after cleans.

```powershell
npm run copilot:deep-clean:all
npm install
```

This also resets:
- `%APPDATA%\Code\User\workspaceStorage`

## All-in-one repair command

Runs deep clean + install + build (optional workspaceStorage reset variants included):

```powershell
npm run copilot:repair
npm run copilot:repair:all
```

## Suggested rule

If Next.js or Vercel fails in a weird way, immediately run:

```powershell
npm run copilot:repair
```

If Copilot is still unstable, run:

```powershell
npm run copilot:repair:all
```

## Git pre-push guard (installed)

This repo has an active pre-push hook that runs `pre-push.ps1` automatically.

- Always runs: `npm run build`
- Reinstalls dependencies only when needed:
   - `node_modules` is missing
   - `package-lock.json` is missing
   - no upstream branch is configured yet
   - `package.json` or `package-lock.json` changed versus upstream
