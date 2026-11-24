# DayForge Agent Instructions

Read [SKILLS.md](./SKILLS.md) before starting any work in this repository. `SKILLS.md` is the authoritative project handbook.

## Non-Negotiable Rules
- **Stack discipline:** React 19, TypeScript (strict), Vite, Tailwind CSS, shadcn/ui, Lucide React, Framer Motion, Recharts, React Router, React Hook Form + Zod, IndexedDB/Dexie. **Never add Firebase.**
- **No fake data:** Never fabricate user data, academic schedules, deadlines, or fake progress metrics. Keep personal/user data out of reusable UI components.
- **Design baseline:** Dark mode by default (`#111318` background, `#191D25` secondary, `#202631` elevated, `#635BDB` primary accent), Geist/Inter typography, mobile-first + desktop sidebar, zero horizontal overflow, clear empty/loading/error states.
- **Offline-first honesty:** Persist locally in IndexedDB. Do not claim cloud sync exists until Supabase integration is actually built and verified.
- **Security:** Never commit `.env` files, API keys, or secrets. Keep credentials in user-local config or untracked `.env` files matching `.env.example`.
- **Verification:** Run TypeScript checks, ESLint, production build, and browser verification after edits; never claim a check passed without running it.

## Project Skills (`.agents/skills/`)
Load the relevant skill when working in its area:
- `dayforge-architecture` — Feature layout, module boundaries, separation of concerns.
- `dayforge-ui-design` — Dark theme tokens, responsive navigation, Stitch design workflow.
- `dayforge-react-development` — Strict TypeScript, React 19, forms, charts, component reuse.
- `dayforge-data-management` — IndexedDB/Dexie schemas, config separation, future Supabase sync readiness.
- `dayforge-pwa` — Web manifest, service worker, offline shell, Capacitor compatibility.
- `dayforge-testing` — Typecheck, lint, build, Chrome DevTools / browser console & responsive checks.
- Official Stitch skills (`generate-design`, `enhance-prompt`, `manage-design-system`, `design-md`, `taste-design`, `react-components`, `shadcn-ui`, `code-to-design`, `extract-design-md`, `extract-static-html`, `upload-to-stitch`) — Use with `StitchMCP` for UI design, design systems, and React component generation.
