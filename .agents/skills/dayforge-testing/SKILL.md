---
name: dayforge-testing
description: >-
  Defines DayForge verification standards including TypeScript checks, ESLint,
  production builds, Chrome DevTools console/network inspection, responsive
  testing, and persistence verification. Use before marking any task complete.
---

# DayForge Testing & Verification

## Purpose
Prevent unverified changes, runtime regressions, console errors, broken responsiveness, or lost local data from slipping into DayForge.

## When to Use
- Before finishing any code, UI, schema, or configuration change.
- Debugging layout issues, console errors, network failures, or persistence bugs.

## Project Conventions
Follow Section 7 of [SKILLS.md](../../../SKILLS.md):
- Never report any check as passing unless you executed it after your final edit and observed it succeed.
- Use Antigravity's `browser` subagent (Chrome DevTools) or configured Chrome DevTools tooling to inspect live rendered output.

## Required Workflow
1. **Static checks:** Run `npx tsc --noEmit`, ESLint (`npm run lint`), and production build (`npm run build`)—fix all errors.
2. **Browser verification:** Start the local dev/preview server and test affected interactions in a real browser.
3. **Console & Network:** Inspect browser console and network requests for runtime errors, React warnings, or failed asset loads.
4. **Responsive audit:** Verify both mobile (`~375px`–`390px`) and desktop (`~1280px`+) viewports for layout integrity and zero horizontal overflow.
5. **Persistence & Accessibility:** Reload after mutating data to verify IndexedDB persistence; verify keyboard navigation, focus states, and semantic labels.

## Quality Requirements
- Zero TypeScript errors, zero ESLint errors, clean production build.
- Report exact commands/checks run and any unverified or blocked checks honestly.
