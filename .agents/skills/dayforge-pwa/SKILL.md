---
name: dayforge-pwa
description: >-
  Guides Progressive Web App setup, web manifest, service worker offline shell,
  online/offline indicators, and Capacitor compatibility for DayForge. Use when
  configuring PWA assets, caching, installability, or offline UX.
---

# DayForge PWA & Offline Shell

## Purpose
Ensure DayForge installs cleanly as a Progressive Web App, boots reliably offline, and stays compatible with future Capacitor mobile packaging.

## When to Use
- Configuring `manifest.webmanifest`, app icons, or service worker caching.
- Implementing offline/online status indicators or update prompts.
- Checking browser API usage for mobile/Capacitor compatibility.

## Project Conventions
Follow Section 6 of [SKILLS.md](../../../SKILLS.md):
- **Manifest:** Valid app name, short name, `display: standalone`, dark `theme_color` and `background_color` (`#111318`), and properly sized icons (including maskable).
- **Offline shell:** Cache static app shell assets so the app opens and operates offline backed by IndexedDB.
- **Status clarity:** Display an unobtrusive, accurate online/offline indicator.
- **Capacitor safety:** Guard browser-specific globals where needed and avoid desktop-only assumptions.
- **Honesty:** Never claim cloud sync is active unless backend sync is actually implemented.

## Required Workflow
1. Configure PWA build integration cleanly in Vite (inspect existing `vite.config.ts` first).
2. Verify manifest and service worker registration in production preview (`npm run build && npm run preview`), not only dev mode.
3. Test offline reload in Chrome DevTools / `browser` subagent and verify local IndexedDB data remains accessible.

## Quality Requirements
- Production build emits valid manifest and service worker without console registration errors.
- Offline navigation across core routes works cleanly without network requests failing the app shell.
