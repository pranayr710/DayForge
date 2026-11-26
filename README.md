# DayForge

**Plan your day. Build your future.**

DayForge is an offline-first, local-first personal productivity and career operating system built around a college timetable, daily routine, Java DSA practice, 16-stage software engineering curriculum, daily 8–9 PM tech awareness, placement preparation, project tracking, Summer 2027 international internships, and Fall 2028 US Master's preparation.

Everything runs locally in your browser with **IndexedDB**—your personal schedule, tasks, notes, and logs stay on your device with zero account setup required.

---

## Quick Start

### 1. Run on Laptop / Desktop
```bash
git clone https://github.com/ysujith728/DayForge.git
cd DayForge
npm install
npm run dev
```
Open the `Local:` URL shown in the terminal (typically `http://localhost:5173/`).

### 2. Preview on Your Phone (iPhone / Android)
```bash
npm run dev -- --host
```
1. Make sure your phone and computer are on the same Wi-Fi (or connect your computer to your phone's Personal Hotspot if campus/public Wi-Fi blocks local device connections).
2. Open the **`Network: http://<your-ip>:5173/`** URL in your phone's browser—be sure to include **`http://`** explicitly so Safari/Chrome does not upgrade it to `https://`.
3. If prompted by Windows Defender Firewall, allow **Node.js** on your network.

### 3. Install as a Mobile / Desktop App (Offline PWA)
Full Home Screen app installation and offline caching (`dist/sw.js`) require **HTTPS** (or `localhost`):
- **Recommended:** Deploy the repository on **Vercel** (`npm run build` outputs to `dist/`).
- **iPhone (Safari):** Open your deployed `https://` URL → tap **Share (`□↑`)** → **Add to Home Screen**.
- **Android / Desktop Chrome:** Open the URL → click **Install app** from the browser menu.

---

## How to Use DayForge (New User Guide)

### 1. Dashboard (`/`) — Your Command Center
- **Now & Next Spotlight:** Shows the block you should be working on right now (live in IST or your configured timezone), automatically clears blocks already marked **Done / Skipped / Wasted**, handles late-night blocks crossing midnight (`23:30 → 01:00`), and provides a **Focus Now** button alongside what comes up next.
- **Daily Overview Rings:** Tracks **Tasks Completed**, **Focus Time Today** (to the exact second), and **Schedule Completion** (swipeable compact cards on mobile, 3-column grid on desktop).
- **Today's Schedule Timeline:** Tick blocks off directly or click embedded quick-redirect pills (such as `daily.dev`, `Hacker News`, `GitHub Trending`, `takeUforward`, `LeetCode`, `NeetCode`, or today's YouTube channel). On phones, shows a focused 5-block window around your active slot with a **Show full day** toggle.
- **Today's Priorities & Quick-Add:** Add tasks due today in one line with category and priority, or launch Focus directly on any task.
- **YouTube & Dev Redirects / Goals / Deadlines / Weekly Overview:** Quick access to today's 8:30 PM YouTube channel, long-term goal progress, upcoming dated deadlines, and 7-day completion bars.

---

### 2. Schedule & Timetable (`/schedule`)
- **Day / Week / Month Views:** Switch views at the top left, and filter by source (`All`, `College`, `Routine`, `Custom`).
- **Date Navigation & Calendar Picker:**
  - Use **`<`** and **`>`** arrows to step day-by-day (or week/month in those views).
  - The center pill shows **`Today · <Day, Date>`** when on today, and updates to the selected date as you navigate.
  - Tap the **center calendar pill** anytime to open the **Jump to Date** calendar and pick any date directly (or tap **Today** to return).
- **Handling Partial Work, Early Finish, Wasted & Skipped Slots:**
  - Click **Focus** on any slot to open Focus Mode automatically pre-loaded with that slot's planned duration (for example, `60m` for a 1-hour slot).
  - If you **finish early** (for example, completing a 1-hour slot in `40m 15s` or stopping after `12s`), DayForge logs the **exact seconds**—never rounding seconds up to a full minute. Tap **Done** to mark the slot completed (`Done · 40m 15s`).
  - If you **exceed the planned slot**, the timer continues running into **Overtime** (`+MM:SS`), notifies you gently, and records the full total time (including `+OT`) when you tap **Done**.
  - If you **stop partway through** (for example, `25m` out of `1h`), tap **Log Partial**—DayForge logs the exact duration and shows a **Partial · 25m/1h** indicator and progress bar on the slot.
  - Tap any slot's title or **Edit** button to open the **Activity Inspector**, where you can manually set **Slot Status** (`Planned`, `Partial`, `Done`, `Wasted`, `Skipped`), edit **Exact Time Worked** (minutes and seconds), reschedule just that date, add notes, or **Skip Today**.
- **Custom & Recurring Slots:** Click **+ Add Event** for a one-off event, or **Edit Recurring Slots** to add, edit inline, or remove weekly repeating templates (start and end times must differ to prevent accidental 24-hour blocks).

---

### 3. Focus Mode (Global Timer)
- Launch Focus Mode from the header/sidebar (**Start Focus**), from a **Schedule** slot, or from any **Task**.
- Choose presets (`25m`, `45m`, `60m`) or set a custom duration (`1–240m`), write session notes, and pause/resume anytime. Changing the target duration mid-session keeps your already-logged elapsed time intact.
- Active timer state is persisted locally in `localStorage` so refreshing the page or locking your phone screen won't lose an active countdown. If you start Focus on a different item while an earlier timer has elapsed work, the previous progress is saved as **Partial** automatically instead of being lost.
- If the timer reaches `00:00` while you're still working, it switches smoothly into **Overtime (`+MM:SS`)** and keeps tracking exact seconds until you stop or complete it.
- Tap **Done** to log exact elapsed time and complete the linked slot/task, **Log Partial / Save Partial** to record progress without completing it, or **Finish Session** when running standalone.

---

### 4. Tasks & Habits (`/tasks`)
- **Tasks:** Organize items across 9 categories (`College`, `DSA`, `Software Engineering`, `Technology Awareness`, `Placement Preparation`, `Projects`, `Internship`, `Master's`, `Personal`) with `high`/`medium`/`low` priority, due dates/times, and optional `daily` or `weekly` recurrence (completing a recurring task automatically schedules its next occurrence).
- **Habits:** Track non-punitive 7-day consistency bars for recurring daily habits.

---

### 5. Learning Hub (`/learning`)
- **16-Stage Software Engineering Curriculum:** Interactive concept checklists, recommended YouTube channels/sites (clickable directly from cards and stage details), status tracking, assignments, and notes.
- **First 12-Week Roadmap:** Week-by-week progression mapped to the 16 curriculum stages.
- **DSA Tracker (Java):** Log problems by platform (`LeetCode`, `NeetCode`, `Striver`, `GFG`, `Other`), topic, difficulty, time taken, complexity, mistakes, and revisit queue dates.
- **Tech Awareness (8–9 PM):** Interactive 5-step daily evening routine (`daily.dev`, `Hacker News`, day-by-day YouTube rotation, `GitHub Trending`, notes) plus quick-save resources.

---

### 6. Career & Projects (`/career`, `/projects`)
- **Placement Prep:** Day-of-week core CS topic rotation (`OS`, `DBMS`, `CN`, `OOP`, `System Design`, etc.) plus session logs.
- **Summer 2027 Internships:** Application tracker, official opportunity portals, and a persistent 10-item **Internship Application Checklist**.
- **Fall 2028 US Master's:** Editable milestone timeline and shortlisted university tracker (SOP, LOR, GRE/TOEFL checklists, deadlines, and notes).
- **Projects:** Track AI/Backend/Research projects with per-project tasks, milestones, tech stack tags, documentation/test status, and GitHub/deployment links.

---

### 7. Analytics & Settings (`/analytics`, `/settings`)
- **Analytics:** Weekly, Monthly, and Long-Term (`2026–2028`) KPIs and charts computed strictly from your recorded sessions (to the exact second), tasks, DSA problems, schedule slot outcomes (**Done / Partial / Wasted**, excluding skipped slots), and milestones.
- **Settings:**
  - **Theme:** Click **Dark**, **Light**, or **System** tiles directly (or use the dropdown) to switch immediately.
  - **Profile & Timetable Preferences:** Customize your name, semester, **Professional Elective III** course label (updates the timetable dynamically), timezone, and week start day (`Monday` or `Sunday`).
  - **Backup & Restore:** Export your entire local IndexedDB workspace as a `.json` file anytime and restore it via **Import JSON Backup**. *(Because data is stored locally per browser/device, export/import lets you move snapshots between devices.)*

---

## Tech Stack & Verification

- **Frontend:** React 19, TypeScript (strict), Vite, Tailwind CSS v4, Lucide React, Framer Motion, Recharts, React Router, React Hook Form + Zod
- **Storage & Offline:** IndexedDB via Dexie (`DayForgeDB`), `vite-plugin-pwa` (Workbox)
- **Future Backend Boundary:** Supabase interface scaffolded at `src/services/supabase/syncInterface.ts` (not yet active; Firebase is not used)

### Development Commands
```bash
npm run typecheck   # Strict TypeScript check
npm run lint        # ESLint check
npm run build       # TypeScript build + Vite production bundle + PWA service worker
npm run preview     # Preview the production dist/ build locally
```

---

## Documentation

- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) — Modular monolith layout & module boundaries
- [docs/DATABASE_SCHEMA.md](./docs/DATABASE_SCHEMA.md) — IndexedDB / Dexie tables and fields
- [DESIGN.md](./DESIGN.md) — Visual design system & tokens
- [AUDIT.md](./AUDIT.md) — Build and verification log
