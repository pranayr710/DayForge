# DayForge

**Plan your day. Build your future.**

DayForge is an offline-first, local-first personal productivity and career operating system built around an academic timetable, master daily routine, Java DSA practice, 16-stage software engineering curriculum, daily 8–9 PM technology awareness, placement preparation, project tracking, Summer 2027 international internships, and Fall 2028 US Master's preparation.

---

## Key Capabilities

- **Today-First Dashboard:** Live IST Now & Next spotlight, daily tasks/focus/schedule completion metrics, today's priorities, 4 long-term goals, approaching deadlines, and weekly consistency strip.
- **Schedule & Timetable (`Day / Week / Month`):** Amrita Semester VI college timetable merged dynamically with day-specific master routines (including midnight-crossing wind-down/sleep), overlap detection, one-day rescheduling, custom events, and editable recurring templates.
- **Tasks & Calm Habits:** 9 domain categories, recurring tasks (`daily` / `weekly`), search/filters, and non-punitive 7-day habit consistency tracking.
- **Focus Mode:** Distraction-free timer (`25m`, `45m`, `60m`, or custom) with session notes and actual elapsed time logging (never auto-completes tasks).
- **Learning Hub:**
  - **16-Stage Software Engineering Curriculum** (Computer Fundamentals through AI Engineering) with recommended channels, concept checklists, assignments, and notes.
  - **First 12-Week Roadmap** linked to curriculum stages.
  - **DSA Tracker (Java)** with complexity, mistakes, revisit queue, filters, and real analytics.
  - **Tech Awareness (8–9 PM)** with 5 independently trackable steps, day-specific YouTube rotation, quick-open reading portals, save-for-later, and session history.
- **Career Hub & Projects:** Weekly placement rotation & mock/study logs, Summer 2027 international internship tracker (with official sources), Fall 2028 US Master's editable timeline & university/test/SOP/LOR checklist, and AI/Backend/Research project tracker.
- **Analytics & Settings:** Real data-derived Recharts analytics, dark/light/system theme, configurable Professional Elective III & IST timezone, and JSON export/import backup.
- **Offline-First PWA:** Installable web app with web manifest, Workbox service worker offline shell, and IndexedDB (Dexie) persistence.

---

## Tech Stack

- **Frontend:** React 19, TypeScript (strict), Vite, Tailwind CSS, Lucide React, Framer Motion, Recharts, React Router, React Hook Form, Zod
- **Local Persistence:** IndexedDB via Dexie
- **PWA:** `vite-plugin-pwa` (Workbox)
- **Future Backend (Phase 2):** Supabase Authentication, PostgreSQL, and Storage (not yet active; Firebase is not used)

---

## Local Development

```bash
npm install
npm run dev
```

### Verification Scripts

```bash
npm run typecheck
npm run lint
npm run build
```

---

## Documentation

- [SKILLS.md](./SKILLS.md) — Central development handbook
- [DESIGN.md](./DESIGN.md) — Visual design system & Stitch tokens
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) — Modular monolith architecture
- [docs/DATABASE_SCHEMA.md](./docs/DATABASE_SCHEMA.md) — IndexedDB / Dexie schema
- [AUDIT.md](./AUDIT.md) — Build and verification audit log
