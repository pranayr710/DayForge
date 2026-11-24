# DayForge — Project Development Handbook (`SKILLS.md`)

> Central engineering, architecture, design, PWA, and workflow specification for **DayForge**.
> All AI agents and contributors must read and follow this handbook before planning or modifying code.

---

## 1. Project Identity

- **Project:** DayForge
- **Tagline:** *Plan your day. Build your future.*
- **Repository:** `https://github.com/ysujith728/DayForge`
- **Description:** DayForge is a personal productivity and learning operating system that manages academic schedules, daily routines, DSA practice, software engineering learning, technology awareness, placement preparation, projects, international internships, and US Master's preparation.
- **Scope & Evolution:** Initially designed for personal single-user use with an offline-first local database, structured cleanly so future phases can introduce multi-user authentication, PostgreSQL persistence, and cloud synchronization without rewriting core modules.

---

## 2. Product Principles

### Core Principles
- **Premium user experience:** Crisp visual hierarchy, calm focus, fast keyboard and touch interactions.
- **Dark mode by default:** Intentional dark-first surface layering with high legibility and low eye strain.
- **Minimal, polished interface:** High signal-to-noise ratio; avoid visual clutter and redundant chrome.
- **Mobile-first responsive design:** First-class usability on phones, tablets, and wide desktop screens.
- **Strong desktop experience:** Efficient multi-column layouts, persistent sidebar navigation, and keyboard-friendly workflows.
- **Offline-first architecture:** All core reads and writes work locally without network connectivity.
- **Reusable components:** Build composable primitives in `components/ui/` and `components/shared/`.
- **Accessible interactions:** Semantic HTML, keyboard navigation, focus-visible states, ARIA labels, and WCAG AA contrast.
- **Reliable local persistence:** Durable IndexedDB storage with schema versioning and safe migrations.
- **Configurable personal data:** Store personal schedules, targets, semesters, and user preferences in structured config or user data—never hardcoded into reusable UI components.
- **Maintainable and scalable code:** Clear module boundaries, strict typing, and predictable state flow.

### Strict Prohibitions (Never Do)
- **Never** fabricate user data, metrics, streaks, or completion history.
- **Never** invent academic schedules, deadlines, or personal milestones.
- **Never** generate fake progress bars or placeholder telemetry presented as real user progress.
- **Never** create non-functional buttons, dead links, or stubbed interactive controls without explicit user-facing state.
- **Never** introduce unnecessary dependencies when existing stack primitives suffice.
- **Never** overengineer abstractions prematurely.
- **Never** replace working code without clear justification.
- **Never** add Firebase (explicitly excluded from this stack).

---

## 3. Technology Stack

Inspect `package.json` and existing code before introducing or changing any dependency.

### Frontend
- **Framework:** React 19
- **Language:** TypeScript (strict mode)
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **UI Primitives:** shadcn/ui
- **Icons:** Lucide React
- **Animation:** Framer Motion
- **Charts & Analytics:** Recharts
- **Routing:** React Router
- **Forms & Validation:** React Hook Form + Zod

### Local-First Persistence
- **Primary Store:** IndexedDB
- **Wrapper:** Dexie (where appropriate for typed schemas, queries, and migrations)

### Future Backend (Later Phase — Do Not Provision Prematurely)
- **Auth:** Supabase Authentication
- **Database:** Supabase PostgreSQL
- **Files:** Supabase Storage (where necessary)
- **Constraint:** **Do not add Firebase.**

### Deployment & Mobile Packaging
- **Hosting / Backend:** Vercel (frontend), Supabase (future backend)
- **Mobile:** Progressive Web App (PWA), designed for future Capacitor compatibility

---

## 4. Architecture Rules

DayForge uses a **modular monolith** with **feature-based organization**. Adjust only if a clearly better established pattern emerges as the codebase grows.

### Preferred Directory Structure

```text
src/
  app/                  # App shell, router, providers, error boundaries
  components/
    ui/                 # shadcn/ui primitives and low-level UI building blocks
    layout/             # Sidebar, mobile bottom nav, page headers, shell frames
    shared/             # Cross-feature reusable components (empty states, badges, cards)
  features/
    dashboard/          # Daily command center & overview
    schedule/           # Academic timetable, classes, time blocks
    tasks/              # Action items, priorities, deadlines
    habits/             # Daily routines & streak tracking
    learning/           # Software engineering & coursework learning tracks
    dsa/                # DSA problem tracking, patterns, spaced repetition
    technology/         # Tech awareness, reading queue, tool notes
    placement/          # Placement prep, company targets, interview prep
    career/             # International internships & US Master's preparation
    projects/           # Personal & academic project tracking
    analytics/          # Real user-derived trends and consistency metrics
    settings/           # Preferences, data export/import, theme, PWA status
  hooks/                # Shared generic React hooks
  lib/                  # Third-party setups, validation helpers, date utilities, cn()
  services/             # Persistence adapters, IndexedDB/Dexie services, future sync
  store/                # Lightweight client UI state where needed
  types/                # Shared domain TypeScript interfaces and schemas
  config/               # App constants, navigation config, default personal config templates
  styles/               # Global CSS, Tailwind directives, design token CSS variables
```

### Engineering Rules
- **Separate UI from business logic:** Keep domain calculations, persistence queries, and validation out of presentational JSX components.
- **Strict TypeScript:** Enable `strict: true`, `noUncheckedIndexedAccess`, and avoid `any`.
- **Prefer reusable components:** Extract shared patterns into `components/shared/` instead of copy-pasting across features.
- **Centralize utilities:** Put Zod schemas/validators and date/timezone helpers in `lib/` so schedule and streak logic stays consistent.
- **Separate personal data from components:** Reusable components must accept typed props or read from `services/` / `config/`; never hardcode personal schedules or user details inside UI components.
- **Consistent naming:** Use PascalCase for components (`ScheduleCard.tsx`), camelCase for hooks/utils (`useDailySchedule.ts`, `dateUtils.ts`), and kebab-case or consistent feature folder names.
- **Avoid duplicated code:** Factor shared queries, formatters, and layouts cleanly.
- **Keep components focused:** Break large views into small, single-responsibility subcomponents.

---

## 5. Design System Rules

### Aesthetic Direction
- **Inspiration:** Linear, Notion, Raycast — crisp density, quiet borders, subtle elevation, fast keyboard-friendly ergonomics. **Do not clone them.**
- **Default Theme:** Dark mode by default.

### Initial Color Palette

| Token Role | Hex | Usage |
| :--- | :--- | :--- |
| Background | `#111318` | Primary app canvas |
| Secondary | `#191D25` | Sidebar, secondary panels, recessed containers |
| Elevated | `#202631` | Cards, popovers, modals, hover surfaces |
| Primary Accent | `#635BDB` | Primary CTAs, active nav indicators, focus rings |
| Secondary Accent | `#8178F5` | Subtle highlights, badges, secondary interactive accents |
| Success | `#16A34A` | Completed tasks, positive status, online/saved states |
| Warning | `#E5A03C` | Upcoming deadlines, offline notices, caution states |
| Error | `#E05252` | Validation errors, destructive actions, failed states |
| Primary Text | `#F3F4F6` | Headings, primary body copy |
| Secondary Text | `#9CA3AF` | Metadata, timestamps, muted labels |

### Typography & Tokens
- **Font Family:** `Geist` or `Inter` (plus monospace such as `JetBrains Mono` or system mono for code/timers/metrics).
- **Token Consistency:** Define CSS variables and Tailwind theme tokens for:
  - Colors (semantic surface, border, text, accent, and status tokens)
  - Typography scale (display, headings, body, caption, tabular numbers for timers/counts)
  - Spacing scale (consistent `4px`/`8px` rhythm)
  - Border radii (`sm`, `md`, `lg`, `xl` consistent across cards, inputs, and buttons)
  - Shadows & borders (subtle `1px` borders on dark surfaces rather than heavy drop shadows)
  - Transitions (fast, restrained micro-interactions respecting `prefers-reduced-motion`)

### Layout & Interaction Requirements
- **Desktop:** Persistent collapsible/responsive sidebar navigation with generous workspace clarity.
- **Mobile:** Fixed, thumb-friendly bottom navigation bar with safe-area padding (`env(safe-area-inset-bottom)`).
- **Touch targets:** Minimum ~40–44px interactive tap areas on mobile.
- **No horizontal overflow:** Verify `320px`–`430px` mobile viewports and desktop viewports have zero unintended horizontal scrolling.
- **Subtle animations:** Use Framer Motion purposefully (state transitions, drawers, layout polish) without blocking quick navigation.
- **Explicit UI states:** Every data-driven view must define clean **empty**, **loading**, and **error** states.

---

## 6. PWA & Mobile Readiness Rules

- **Installable app:** Valid `manifest.webmanifest` (name, short_name, dark `theme_color` `#111318`, `background_color` `#111318`, `display: standalone`, properly sized PNG/SVG icons including maskable icon).
- **Service Worker:** Cache the application shell and static assets for reliable offline launch.
- **Offline persistence:** Store all active user entities in IndexedDB (via Dexie) so the app reads/writes seamlessly offline.
- **Online/offline awareness:** Surface a clear, unobtrusive network status indicator when offline or syncing.
- **Future sync safety:** Design local entities with stable IDs (UUIDs), `createdAt`, `updatedAt`, and clean sync boundaries so future Supabase sync can reconcile safely.
- **Capacitor compatibility:** Avoid hard assumptions on browser-only globals without guards; keep routing, storage, and layout compatible with future Capacitor webview wrapping.
- **Honesty rule:** Never claim cloud sync, multi-device backup, or backend persistence is implemented until it actually exists and is verified.

---

## 7. Code Quality & Verification Rules

Before considering any implementation task complete:

1. **TypeScript check:** Run `npx tsc --noEmit` (or project `typecheck` script) — zero errors.
2. **Linting:** Run ESLint (`npm run lint`) — zero errors.
3. **Production build:** Run `npm run build` — succeeds cleanly.
4. **Fix all errors:** Resolve issues directly instead of suppressing types (`@ts-ignore`, `any`) or disabling lint rules without justification.
5. **Interactive verification:** Test affected flows in a real browser (using Chrome DevTools / Antigravity `browser` subagent).
6. **Console & network check:** Inspect the browser console and network tab for uncaught errors, hydration/React warnings, or failed requests.
7. **Responsive check:** Verify mobile (`~375px`–`390px`) and desktop (`~1280px`–`1440px`) layouts have no clipping or horizontal overflow.
8. **Persistence check:** Reload the page and confirm IndexedDB data persists as expected (and test offline behavior for PWA changes).
9. **Accessibility review:** Check keyboard navigation, focus states, semantic landmarks, labels, and contrast.

**Never report a check, test, or build as passing unless you executed it after your final edit and observed it pass.**

---

## 8. Development Workflow

Every AI agent working on DayForge must follow this workflow:

1. **Inspect before modifying:** Read `SKILLS.md`, `AGENTS.md`, relevant `.agents/skills/`, `package.json`, and existing target files before writing code.
2. **Understand existing architecture:** Follow established patterns, tokens, and folder boundaries.
3. **Plan substantial changes:** Outline multi-file or architectural changes before editing.
4. **Make incremental changes:** Implement and verify step by step rather than rewriting whole subsystems at once.
5. **Reuse existing components:** Check `src/components/` and `src/lib/` before creating new primitives.
6. **Test after implementation:** Run typecheck, lint, build, and browser verification.
7. **Summarize changed files:** Report exact files created/modified and observed check outputs.
8. **Report unresolved issues:** Clearly flag blockers, missing credentials, or unverified paths.

**Communication rule:** Do not repeatedly ask the user questions that this handbook already answers. Use sensible, configurable defaults aligned with this specification for minor ambiguities, and ask only when a genuine product or irreversible architectural decision is required.

---

## 9. Environment & Tooling Reference

- **Project Instructions:** [AGENTS.md](./AGENTS.md)
- **Workspace Skills:** `.agents/skills/*/SKILL.md`
  - **DayForge domain skills:** `dayforge-architecture`, `dayforge-ui-design`, `dayforge-react-development`, `dayforge-pwa`, `dayforge-testing`, `dayforge-data-management`
  - **Official Stitch skills (`google-labs-code/stitch-skills`):** `generate-design`, `enhance-prompt`, `manage-design-system`, `design-md`, `taste-design`, `react-components`, `shadcn-ui`, `code-to-design`, `extract-design-md`, `extract-static-html`, `upload-to-stitch`
- **UI Design & Design-to-Code:** `StitchMCP` (`https://stitch.googleapis.com/mcp`, configured in user-global `~/.gemini/config/mcp_config.json`)
- **Browser Testing & Debugging:** Built-in Antigravity `browser` subagent (Chrome DevTools) and Marketplace `chrome-devtools-plugin`
- **Git & GitHub:** Local `git` + GitHub CLI (`gh`)
- **Future Backend (Phase 2+):** Official Supabase plugin (`antigravity-plugins-partners/plugin/supabase`), documented env placeholders in `.env.example`
