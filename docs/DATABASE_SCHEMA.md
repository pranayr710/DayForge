# DayForge Database Schema (`IndexedDB / Dexie`)

Local-first Dexie schema (`DayForgeDB`, version `1`) designed with stable UUID primary keys, `userId` ownership field for future multi-user sync, and `createdAt` / `updatedAt` ISO timestamps for Phase 2 Supabase PostgreSQL reconciliation.

---

## Tables

### 1. `userProfile`
Stores single-user local configuration (convertible to Supabase `profiles` table).
- `id` (string, PK)
- `displayName` (string)
- `timezone` (string, default `"Asia/Kolkata"`)
- `academicProgramme` (string)
- `institution` (string)
- `semester` (string)
- `planningPeriod` (string)
- `electiveThreeName` (string — configurable Professional Elective III)
- `theme` (`"dark" | "light" | "system"`)
- `weekStartsOn` (`"monday" | "sunday"`)
- `notificationsEnabled` (boolean)
- `createdAt`, `updatedAt` (ISO string)

### 2. `scheduleTemplates`
Configurable recurring college classes & daily routine blocks.
- `id` (string, PK)
- `userId` (string)
- `source` (`"college" | "routine"`)
- `category` (`"class" | "lab" | "mentoring" | "project" | "cir" | "break" | "routine" | "dsa" | "awareness" | "placement" | "career" | "personal"`)
- `dayOfWeek` (`0..6`, Sunday=0 .. Saturday=6)
- `subjectCode?` (string)
- `title` (string)
- `subtitle?` (string)
- `location?` (string)
- `startTime` (`"HH:mm"` 24h IST)
- `endTime` (`"HH:mm"` 24h IST; supports `< startTime` or `24:00+` for midnight-crossing activities)
- `isActive` (boolean)
- `createdAt`, `updatedAt`

### 3. `scheduleInstances`
Date-specific overrides, completions, custom events, and temporary reschedules (`dateKey` = `"YYYY-MM-DD"` in IST).
- `id` (string, PK)
- `userId` (string)
- `dateKey` (string, indexed)
- `templateId?` (string, indexed)
- `title` (string)
- `subjectCode?` (string)
- `category` (string)
- `startTime` (string)
- `endTime` (string)
- `completed` (boolean)
- `completedAt?` (string)
- `isCustom` (boolean)
- `isCancelled` (boolean)
- `notes?` (string)
- `createdAt`, `updatedAt`

### 4. `tasks`
Actionable tasks decoupled from recurring timetable templates.
- `id` (string, PK)
- `userId` (string)
- `title` (string)
- `category` (`"College" | "DSA" | "Software Engineering" | "Technology Awareness" | "Placement Preparation" | "Projects" | "Internship" | "Master's" | "Personal"`)
- `priority` (`"high" | "medium" | "low"`)
- `dueDate?` (`"YYYY-MM-DD"`)
- `dueTime?` (`"HH:mm"`)
- `recurrence` (`"none" | "daily" | "weekly"`)
- `completed` (boolean)
- `completedAt?` (string)
- `notes?` (string)
- `createdAt`, `updatedAt`

### 5. `habits` & `habitLogs`
- `habits`: `id`, `userId`, `title`, `category`, `targetFrequency`, `archived`, `createdAt`, `updatedAt`
- `habitLogs`: `id`, `userId`, `habitId` (indexed), `dateKey` (indexed), `completed` (boolean), `createdAt`

### 6. `focusSessions`
Recorded actual focus durations (timers never auto-complete tasks).
- `id` (string, PK)
- `userId` (string)
- `taskId?`, `taskTitle` (string)
- `objective?` (string)
- `plannedMinutes` (number)
- `actualSeconds` (number)
- `notes?` (string)
- `startedAt`, `endedAt`, `dateKey`

### 7. `learningStages`
16-stage software engineering curriculum with per-concept checkboxes, notes, assignments, and manual status (`"not_started" | "in_progress" | "completed"`).

### 8. `dsaProblems`
Java DSA tracker records: `id`, `problemName`, `platform`, `topic`, `difficulty`, `status` (`"attempted" | "solved"`), `dateAttempted`, `dateSolved?`, `timeTakenMinutes`, `solutionLink`, `notes`, `mistakes`, `timeComplexity`, `spaceComplexity`, `revisitDate?`, `createdAt`, `updatedAt`.

### 9. `awarenessLogs` & `savedResources`
Daily 8–9 PM Tech Awareness completions (`daily.dev`, `Hacker News`, `Day-specific YouTube`, `GitHub Trending`, `Technology Notes`) + saved-for-later links & personal notes.

### 10. `placementSessions`
Daily placement rotation notes, practice/interview question tracking, and mock assessment logs.

### 11. `projects`
AI Engineering / Backend / AI-ML Research projects with `isPrimary`, stack tags, milestones, tasks, docs/testing status, GitHub URL, and deployment URL.

### 12. `internshipApplications` & `mastersMilestones` & `universities`
- `internshipApplications`: Summer 2027 international internship tracker (`Interested` -> `Accepted` / `Rejected` / `Withdrawn`).
- `mastersMilestones`: Editable Nov 2026 – Jun 2028 US Master's roadmap milestones.
- `universities`: Target MS CS (AI/ML & Systems) shortlist tracking tests (IELTS, TOEFL, GRE, DET), SOP, LORs, transcripts, resume, and deadlines.
