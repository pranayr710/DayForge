# DayForge Architecture

## 1. Architectural Style
DayForge is a **local-first, offline-capable modular monolith** built with React 19, TypeScript (strict), Vite, Tailwind CSS, and IndexedDB (Dexie). It avoids premature backend coupling while keeping domain logic and persistence behind clean typed service interfaces so Phase 2 Supabase authentication, PostgreSQL, and sync can be attached without rewriting UI features.

---

## 2. Directory Structure

```text
public/
  icons/                    # App icons (SVG + PNG maskable/standard PWA icons)
src/
  app/
    layouts/                # AppShell (Desktop sidebar + Mobile top/bottom nav + Focus drawer)
    providers/              # ThemeProvider, AppBootstrapProvider, FocusProvider, ToastProvider
    router/                 # React Router configuration with lazy-loaded feature routes
  components/
    ui/                     # Reusable UI primitives (Button, Card, Input, Badge, Dialog, Sheet, Tabs, Select, Progress, Skeleton)
    shared/                 # Cross-feature components (EmptyState, PageHeader, ConfirmDialog, StatusBadge, OfflineBanner)
  config/
    personalPlan.ts         # Default configurable personal master plan (Amrita Sem VI, IST, goals)
    timetable.ts            # Configurable college slot timings & Semester VI weekly timetable
    routine.ts              # Configurable Mon/Tue/Fri, Wed, Thu, Sat, Sun master daily routines
    curriculum.ts           # 16-stage SE curriculum, recommended channels, 12-week roadmap
    awareness.ts            # 8–9 PM YouTube day rotation & daily reading websites
    career.ts               # Placement weekly rotation, Summer 2027 sources, Fall 2028 US Master's timeline
  features/
    dashboard/              # Today-first command center (Now/Next, priorities, goals, deadlines, weekly strip)
    schedule/               # Day / Week / Month views, timetable merge engine, exceptions & custom events
    tasks/                  # Task manager + calm Daily Habits & streak history
    learning/               # 16-Stage Curriculum, 12-Week Roadmap, Java DSA Tracker, 8–9 PM Tech Awareness
    career/                 # Placement Prep rotation, Summer 2027 Internships, Fall 2028 US Master's
    projects/               # AI Engineering / Backend / AI-ML Research project & milestone tracker
    analytics/              # Real data-derived weekly, monthly, and long-term charts & metrics
    settings/               # Profile, theme, timezone, timetable/routine reset, JSON export/import backup
    focus/                  # Distraction-free Focus Mode timer (25m / 45m / 60m / custom) + session logging
  hooks/                    # Shared hooks (useOnlineStatus, useIstClock, useFocusTimer, useAppStore)
  lib/                      # dateUtils (IST-aware), cn(), validation schemas, scheduleEngine
  services/
    storage/                # Dexie IndexedDB schema, migrations, seeded bootstrap, repository CRUD, JSON backup
    supabase/               # Phase 2 typed sync interface boundary (no premature backend side effects)
  types/                    # Domain interfaces for every DayForge entity
  styles/                   # Design tokens, Tailwind CSS entry, dark/light theme variables
```

---

## 3. Core Design Decisions
1. **Schedule Engine (`src/lib/scheduleEngine.ts`):**
   - Dynamically merges the active Semester Timetable + Day-of-Week Master Routine + user custom events + date-scoped exceptions (`rescheduled` or `skipped` instances) without mutating the underlying recurring templates.
   - Properly handles activities crossing midnight (e.g., `11:30 PM – 12:15 AM` wind-down and `12:15 AM` sleep).
   - Explicitly detects and surfaces overlapping conflicts rather than silently hiding them.
   - Never marks tasks or schedule blocks completed merely because their scheduled time has passed.
2. **Honest Zero-Fake-Data Policy:**
   - Structural configuration (exact Amrita Sem VI timetable, master routines, 16-stage curriculum topics, YouTube channels, placement rotation, internship portals, Master's timeline) is seeded cleanly as configurable user templates.
   - Personal progress metrics (tasks completed, DSA solved count, focus minutes, curriculum completion, internship applications, project progress) start at **zero / empty** and update strictly from real user actions persisted in IndexedDB.
3. **Capacitor & Mobile Readiness:**
   - Uses `min-h-[100dvh]`, safe-area CSS insets (`env(safe-area-inset-bottom)`), Hash/Browser routing compatibility, and storage abstraction behind `services/storage/` so wrapping with Capacitor requires no feature rewrites.
