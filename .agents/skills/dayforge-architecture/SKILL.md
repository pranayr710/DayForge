---
name: dayforge-architecture
description: >-
  Guides modular monolith layout, feature boundaries, dependency decisions, and
  separation of concerns for DayForge. Use when scaffolding folders, adding new
  features, refactoring modules, or evaluating new packages.
---

# DayForge Architecture

## Purpose
Keep DayForge structured as a clean, scalable modular monolith where personal productivity modules stay decoupled, strongly typed, and ready for future multi-user sync.

## When to Use
- Initializing the Vite + React + TypeScript project structure.
- Creating a new feature under `src/features/` or extracting shared primitives.
- Adding dependencies or reviewing module imports.

## Project Conventions
Follow Section 3 and Section 4 of [SKILLS.md](../../../SKILLS.md):
- Feature-based layout under `src/` (`app/`, `components/{ui,layout,shared}/`, `features/*`, `hooks/`, `lib/`, `services/`, `store/`, `types/`, `config/`, `styles/`).
- Business logic, Zod validation, and date helpers belong in `services/`, `lib/`, and `features/<name>/` hooks/utils—never inside presentational JSX components.
- Personal data (schedules, targets, preferences) must live in `config/` or IndexedDB via `services/`, never hardcoded in reusable UI components.
- **Forbidden:** Do not add Firebase or unnecessary dependencies. Inspect `package.json` before adding packages.

## Required Workflow
1. Read `SKILLS.md` and inspect `package.json` and `src/` before making structural changes.
2. Place new domain views inside `src/features/<domain>/` with clear local components, hooks, and types.
3. Promote cross-feature UI primitives to `src/components/shared/` only when reused across features.
4. Keep `services/` as the single boundary for IndexedDB/Dexie persistence so future Supabase sync plugs in cleanly.

## Quality Requirements
- Zero circular imports between feature folders.
- Strict TypeScript (`npx tsc --noEmit`) and ESLint pass with zero errors.
- No speculative abstractions or dead files.
